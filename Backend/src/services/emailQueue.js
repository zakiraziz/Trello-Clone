/**
 * Email queue service with automatic retry logic and exponential backoff.
 * Provides reliable email delivery with delivery status tracking.
 */
const pool = require('../db/pool');
const { sendEmail } = require('./emailService');

class EmailQueue {
    static async addToQueue(to, subject, template, data = {}) {
        try {
            const result = await pool.query(
                `INSERT INTO email_queue (to_email, subject, template, data, status, retries, max_retries, next_attempt)
                 VALUES ($1, $2, $3, $4, 'pending', 0, 5, NOW())
                 RETURNING *`,
                [to, subject, template, JSON.stringify(data)]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Failed to add email to queue:', error);
            return null;
        }
    }

    static async processQueue() {
        try {
            const emails = await pool.query(
                `SELECT * FROM email_queue
                 WHERE status = 'pending'
                 AND next_attempt <= NOW()
                 AND retries < max_retries
                 ORDER BY created_at ASC
                 LIMIT 10`
            );

            for (const email of emails.rows) {
                await this.processEmail(email);
            }

            return { processed: emails.rows.length };
        } catch (error) {
            console.error('Email queue processing error:', error);
            return { processed: 0, error: error.message };
        }
    }

    static async processEmail(email) {
        try {
            const data = typeof email.data === 'string' ? JSON.parse(email.data) : email.data;
            const result = await sendEmail(email.template, { ...data, to: email.to_email });

            if (result.success) {
                await pool.query(
                    `UPDATE email_queue SET status = 'sent', sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
                    [email.id]
                );
                console.log(`Email sent successfully: ${email.subject} to ${email.to_email}`);
            } else {
                throw new Error(result.error || 'Failed to send email');
            }
        } catch (error) {
            const newRetries = email.retries + 1;
            const backoffDelay = Math.min(Math.pow(2, newRetries) * 60 * 1000, 24 * 60 * 60 * 1000); // Exponential backoff, max 24h
            const nextAttempt = new Date(Date.now() + backoffDelay);

            await pool.query(
                `UPDATE email_queue 
                 SET status = $1, retries = $2, last_error = $3, next_attempt = $4, updated_at = NOW()
                 WHERE id = $5`,
                [newRetries >= email.max_retries ? 'failed' : 'pending', newRetries, error.message, nextAttempt, email.id]
            );

            console.error(`Email failed (${newRetries}/${email.max_retries}): ${email.subject} to ${email.to_email} - ${error.message}`);
        }
    }

    static async getQueueStatus() {
        try {
            const stats = await pool.query(
                `SELECT 
                    COUNT(*) FILTER (WHERE status = 'pending') as pending,
                    COUNT(*) FILTER (WHERE status = 'sent') as sent,
                    COUNT(*) FILTER (WHERE status = 'failed') as failed,
                    COUNT(*) FILTER (WHERE status = 'processing') as processing
                 FROM email_queue`
            );
            return stats.rows[0];
        } catch (error) {
            console.error('Failed to get queue status:', error);
            return { pending: 0, sent: 0, failed: 0, processing: 0 };
        }
    }

    static async retryFailedEmails() {
        try {
            const result = await pool.query(
                `UPDATE email_queue 
                 SET status = 'pending', retries = 0, next_attempt = NOW(), last_error = NULL, updated_at = NOW()
                 WHERE status = 'failed' AND retries >= max_retries
                 RETURNING id`
            );
            return { retried: result.rows.length };
        } catch (error) {
            console.error('Failed to retry emails:', error);
            return { retried: 0, error: error.message };
        }
    }

    static async cleanupOldEmails(days = 30) {
        try {
            const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const result = await pool.query(
                `DELETE FROM email_queue WHERE created_at < $1 AND status IN ('sent', 'failed')`,
                [cutoff]
            );
            return { deleted: result.rowCount };
        } catch (error) {
            console.error('Failed to cleanup old emails:', error);
            return { deleted: 0 };
        }
    }
}

// Process queue every 30 seconds
setInterval(() => {
    EmailQueue.processQueue().catch(err => console.error('Email queue processing interval error:', err));
}, 30000);

module.exports = EmailQueue;