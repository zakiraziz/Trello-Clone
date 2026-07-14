import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Layers, Zap } from 'lucide-react'

const features = [
  { name: 'Boards', free: '3 boards', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Team Members', free: '3 per board', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Lists & Cards', free: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'File Attachments', free: '10MB/file', pro: '250MB/file', enterprise: '1GB/file' },
  { name: 'Real-time Sync', free: false, pro: true, enterprise: true },
  { name: 'Advanced Checklists', free: false, pro: true, enterprise: true },
  { name: 'Custom Fields', free: false, pro: true, enterprise: true },
  { name: 'Automation (Butler)', free: false, pro: '100/month', enterprise: 'Unlimited' },
  { name: 'Calendar View', free: false, pro: true, enterprise: true },
  { name: 'Timeline View', free: false, pro: true, enterprise: true },
  { name: 'Dashboard & Analytics', free: false, pro: true, enterprise: true },
  { name: 'Admin Controls', free: false, pro: false, enterprise: true },
  { name: 'SSO & SAML', free: false, pro: false, enterprise: true },
  { name: 'Audit Logs', free: false, pro: false, enterprise: true },
  { name: 'Dedicated Support', free: false, pro: 'Priority', enterprise: '24/7 Phone & Email' },
  { name: 'Data Export', free: false, pro: true, enterprise: true },
  { name: 'API Access', free: false, pro: true, enterprise: 'Unlimited' },
  { name: 'Custom Integrations', free: false, pro: false, enterprise: true },
]

export const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'For individuals and small projects',
      features: [
        'Up to 3 boards',
        'Unlimited cards & lists',
        'Basic integrations',
        'Mobile apps',
        '2FA authentication',
      ],
      cta: 'Get Started Free',
      popular: false,
      color: 'border-border',
    },
    {
      name: 'Pro',
      price: { monthly: 10, yearly: 8 },
      description: 'For teams that need more power',
      features: [
        'Unlimited boards',
        'Unlimited team members',
        'Real-time collaboration',
        'Advanced checklists & custom fields',
        'Automation (1,000 runs/month)',
        'Calendar & Timeline views',
        'Dashboard & analytics',
        '250MB file attachments',
        'Priority support',
        'Data export & API access',
      ],
      cta: 'Start Free Trial',
      popular: true,
      color: 'border-primary shadow-lg shadow-primary/10',
    },
    {
      name: 'Enterprise',
      price: { monthly: null, yearly: null },
      description: 'For large organizations',
      features: [
        'Everything in Pro',
        'Unlimited automation',
        'SSO & SAML authentication',
        'Advanced admin controls',
        'Audit logs & compliance',
        '1GB file attachments',
        'Dedicated success manager',
        '24/7 phone & email support',
        'Custom contracts & invoicing',
        'On-premise deployment option',
        'SLA guarantee',
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'border-border',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <main id="main-content">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TrelloClone</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Product
            </Link>
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section aria-labelledby="pricing-hero-heading" className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>New: Annual billing saves 20%</span>
          </div>
          <h1 id="pricing-hero-heading" className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Simple, transparent pricing
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            All plans include a 14-day free trial. No credit card required. Cancel anytime.
          </p>
          <div className="flex items-center justify-center gap-4 mb-10">
            <Button
              variant={billingPeriod === 'monthly' ? 'default' : 'outline'}
              onClick={() => setBillingPeriod('monthly')}
              className="w-full sm:w-auto"
            >
              Monthly
            </Button>
            <Button
              variant={billingPeriod === 'yearly' ? 'default' : 'outline'}
              onClick={() => setBillingPeriod('yearly')}
              className="w-full sm:w-auto flex items-center gap-2"
            >
              Yearly
              <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                Save 20
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section aria-labelledby="pricing-cards-heading" className="pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 id="pricing-cards-heading" className="sr-only">Pricing plans</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-background rounded-2xl p-8 border ${plan.color} ${
                  plan.popular ? 'scale-105 z-10' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>
                <div className="text-center mb-6">
                  {plan.price[billingPeriod] !== null ? (
                    <span className="text-5xl font-bold">
                      ${plan.price[billingPeriod]}
                      <span className="text-base font-normal text-muted-foreground">
                        /month
                      </span>
                    </span>
                  ) : (
                    <span className="text-5xl font-bold">Custom</span>
                  )}
                  {billingPeriod === 'yearly' && plan.price.yearly && plan.price.monthly && (
                    <p className="text-sm text-green-600 mt-1">
                      Billed ${plan.price.yearly * 12}/year
                    </p>
                  )}
                </div>
                <Link
                  to={plan.name === 'Free' ? '/register' : plan.name === 'Enterprise' ? '/contact' : '/register'}
                  className="block"
                >
                  <Button
                    className="w-full py-3 text-lg"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section aria-labelledby="feature-comparison-heading" className="pb-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <h2 id="feature-comparison-heading" className="text-4xl font-bold text-center mb-12">Feature comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium">Feature</th>
                  <th className="text-center p-4 font-medium">Free</th>
                  <th className="text-center p-4 font-medium text-primary">Pro</th>
                  <th className="text-center p-4 font-medium">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className="p-4 font-medium">{feature.name}</td>
                    <td className="text-center p-4">
                      {feature.free === false ? (
                        <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">{feature.free}</span>
                      )}
                    </td>
                    <td className="text-center p-4">
                      {feature.pro === false ? (
                        <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                      ) : feature.pro === true ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-green-600 font-medium">{feature.pro}</span>
                      )}
                    </td>
                    <td className="text-center p-4">
                      {feature.enterprise === false ? (
                        <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                      ) : feature.enterprise === true ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-green-600 font-medium">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-center mb-12">Frequently asked questions</h2>
          <dl className="space-y-6">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, while downgrades take effect at the end of your billing cycle.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and wire transfers for annual Enterprise plans.',
              },
              {
                q: 'Is there a discount for non-profits or educational institutions?',
                a: 'Yes! We offer 50% off Pro plans for qualified non-profits and educational institutions. Contact our sales team to learn more.',
              },
              {
                q: 'What happens when my free trial ends?',
                a: 'You\'ll be prompted to choose a plan. If you don\'t upgrade, your account will be downgraded to the Free plan with its limitations.',
              },
              {
                q: 'Can I cancel my subscription at any time?',
                a: 'Absolutely. You can cancel anytime from your account settings. You\'ll continue to have access until the end of your billing period.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us within 30 days for a full refund.',
              },
            ].map((faq, index) => (
              <div key={index} className="border border-border rounded-lg overflow-hidden">
                <dt className="p-6 font-medium bg-muted/50 cursor-pointer flex items-center justify-between">
                  {faq.q}
                  <span className="text-muted-foreground">+</span>
                </dt>
                <dd className="p-6 text-muted-foreground border-t border-border">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pb-20 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of teams already using TrelloClone to ship faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Start Free Trial
                <Zap className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">TrelloClone</span>
              </div>
              <p className="text-muted-foreground text-sm">
                The flexible project management tool for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/changelog" className="hover:text-foreground transition-colors">Changelog</Link></li>
                <li><Link to="/roadmap" className="hover:text-foreground transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/security" className="hover:text-foreground transition-colors">Security</Link></li>
                <li><Link to="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TrelloClone. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
      </main>
    </div>
  )
}