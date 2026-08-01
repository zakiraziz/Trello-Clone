/**
 * Stripe webhook handler - must be mounted before express.json() body parser
 * because Stripe requires the raw body for signature verification.
 */
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db/pool');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const EmailQueue = require('../services/emailQueue');

// Raw body parser for Stripe webhook
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const status = subscription.status;
                const proExpiresAt = status === 'active' ? 
                    new Date(subscription.current_period_end * 1000) : null;

                const userResult = await pool.query(
                    'SELECT id, email, name FROM users WHERE stripe_customer_id = $1',
                    [customerId]
                );
                const user = userResult.rows[0];

                await pool.query(
                    'UPDATE users SET pro_tier = $1, pro_expires_at = $2, stripe_subscription_id = $3 WHERE stripe_customer_id = $4',
                    [status === 'active' || status === 'trialing', proExpiresAt, subscription.id, customerId]
                );

                if (user) {
                    await AuditLog.log(user.id, 'subscription_updated', 'payment', user.id, { 
                        status, subscriptionId: subscription.id, customerId 
                    });
                    
                    if (status === 'active') {
                        await Notification.create(user.id, 'payment', 'Subscription Active', 'Your Pro subscription is now active!');
                        await EmailQueue.addToQueue(user.email, 'Subscription Active', 'welcome', { 
                            name: user.name, email: user.email 
                        });
                    }
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const deletedSub = event.data.object;
                const userResult = await pool.query(
                    'SELECT id FROM users WHERE stripe_customer_id = $1',
                    [deletedSub.customer]
                );
                const user = userResult.rows[0];

                await pool.query(
                    'UPDATE users SET pro_tier = false, pro_expires_at = NULL, stripe_subscription_id = NULL WHERE stripe_customer_id = $1',
                    [deletedSub.customer]
                );

                if (user) {
                    await AuditLog.log(user.id, 'subscription_cancelled', 'payment', user.id, { 
                        customerId: deletedSub.customer 
                    });
                    await Notification.create(user.id, 'payment', 'Subscription Cancelled', 'Your Pro subscription has been cancelled.');
                }
                break;
            }
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                if (userId) {
                    await AuditLog.log(userId, 'payment_succeeded', 'payment', session.id, { 
                        amount: session.amount_total, currency: session.currency 
                    });
                    await Notification.create(userId, 'payment', 'Payment Successful', 'Your payment was processed successfully!');
                }
                break;
            }
            case 'checkout.session.expired': {
                const expiredSession = event.data.object;
                const expiredUserId = expiredSession.metadata?.userId;
                if (expiredUserId) {
                    await AuditLog.log(expiredUserId, 'payment_expired', 'payment', expiredSession.id, {}, null, null, 'warning');
                }
                break;
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        await AuditLog.log(null, 'webhook_error', 'payment', null, { 
            error: error.message, eventType: event?.type 
        }, null, null, 'error');
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;