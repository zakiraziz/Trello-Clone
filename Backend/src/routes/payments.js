const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../db/pool');

router.get('/status', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT pro_tier, pro_expires_at FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];
        const isPro = user.pro_tier && (!user.pro_expires_at || new Date(user.pro_expires_at) > new Date());

        res.json({
            isPro,
            proExpiresAt: user.pro_expires_at,
            isActive: isPro
        });
    } catch (error) {
        console.error('Get status error:', error);
        res.status(500).json({ error: 'Failed to get subscription status' });
    }
});

router.post('/create-checkout', async (req, res) => {
    const { priceId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;

    if (!priceId) {
        return res.status(400).json({
            error: 'Price ID required',
            message: 'Please specify a price for the subscription'
        });
    }

    try {
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

        res.json({
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Create checkout error:', error);
        res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message
        });
    }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;