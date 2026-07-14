const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PLANS = {
    PRO_MONTHLY: 'price_pro_monthly_123',
    PRO_YEARLY: 'price_pro_yearly_456'
};

module.exports = {
    stripe,
    PLANS
};