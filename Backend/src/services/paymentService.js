const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db/pool');

class PaymentService {
    static async createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
        const userResult = await pool.query(
            'SELECT email, name, stripe_customer_id FROM users WHERE id = $1',
            [userId]
        );

        const user = userResult.rows[0];
        let customerId = user.stripe_customer_id;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId }
            });
            customerId = customer.id;

            await pool.query(
                'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
                [customerId, userId]
            );
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'subscription',
            success_url: successUrl || `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.CLIENT_URL}/payment/cancel`,
            metadata: { userId }
        });

        return session;
    }

    static async handleWebhookEvent(event) {
        switch (event.type) {
            case 'customer.subscription.updated':
                const subscription = event.data.object;
                const customerId = subscription.customer;
                const status = subscription.status;
                const proExpiresAt = status === 'active' ? 
                    new Date(subscription.current_period_end * 1000) : null;

                await pool.query(
                    'UPDATE users SET pro_tier = $1, pro_expires_at = $2 WHERE stripe_customer_id = $3',
                    [status === 'active' || status === 'trialing', proExpiresAt, customerId]
                );
                break;

            case 'customer.subscription.deleted':
                const deletedSub = event.data.object;
                await pool.query(
                    'UPDATE users SET pro_tier = false, pro_expires_at = NULL WHERE stripe_customer_id = $1',
                    [deletedSub.customer]
                );
                break;

            case 'invoice.payment_succeeded':
                const invoice = event.data.object;
                await pool.query(
                    `INSERT INTO payment_history (user_id, stripe_payment_id, amount, currency, status)
                     SELECT id, $1, $2, $3, 'success'
                     FROM users WHERE stripe_customer_id = $4`,
                    [invoice.payment_intent, invoice.amount_paid, invoice.currency, invoice.customer]
                );
                break;
        }
    }
}

module.exports = PaymentService;