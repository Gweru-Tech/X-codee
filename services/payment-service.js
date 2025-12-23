const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
    constructor() {
        this.stripe = stripe;
        this.plans = new Map();
        this.initializePlans();
    }

    initializePlans() {
        // Define subscription plans
        this.plans.set('basic', {
            id: 'basic',
            name: 'Basic Plan',
            price: 999, // $9.99 in cents
            currency: 'usd',
            interval: 'month',
            features: [
                '5 projects',
                'Basic design tools',
                'Standard hosting',
                'Email support'
            ],
            limits: {
                projects: 5,
                storage: 1024 * 1024 * 100, // 100MB
                bandwidth: 1024 * 1024 * 1024 * 10, // 10GB
                customDomains: 0
            }
        });

        this.plans.set('pro', {
            id: 'pro',
            name: 'Pro Plan',
            price: 2999, // $29.99 in cents
            currency: 'usd',
            interval: 'month',
            features: [
                'Unlimited projects',
                'Advanced design tools',
                'Premium hosting',
                'Priority support',
                'Custom domains',
                'Analytics dashboard'
            ],
            limits: {
                projects: -1, // unlimited
                storage: 1024 * 1024 * 1024 * 5, // 5GB
                bandwidth: 1024 * 1024 * 1024 * 100, // 100GB
                customDomains: 5
            }
        });

        this.plans.set('enterprise', {
            id: 'enterprise',
            name: 'Enterprise Plan',
            price: 9999, // $99.99 in cents
            currency: 'usd',
            interval: 'month',
            features: [
                'Everything in Pro',
                'White-label options',
                'API access',
                'Dedicated support',
                'Custom integrations',
                'Advanced security',
                'SLA guarantee'
            ],
            limits: {
                projects: -1, // unlimited
                storage: 1024 * 1024 * 1024 * 50, // 50GB
                bandwidth: -1, // unlimited
                customDomains: -1 // unlimited
            }
        });
    }

    async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amount,
                currency: currency,
                metadata: metadata,
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            return {
                success: true,
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            };
        } catch (error) {
            console.error('PaymentIntent creation failed:', error);
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }
    }

    async createCustomer(userId, email, name = null) {
        try {
            const customer = await this.stripe.customers.create({
                email: email,
                name: name || email,
                metadata: {
                    userId: userId
                }
            });

            return {
                success: true,
                customerId: customer.id,
                customer: customer
            };
        } catch (error) {
            console.error('Customer creation failed:', error);
            throw new Error(`Failed to create customer: ${error.message}`);
        }
    }

    async createSubscription(customerId, planId, trialDays = 0) {
        try {
            const plan = this.plans.get(planId);
            if (!plan) {
                throw new Error('Invalid plan ID');
            }

            // Create or retrieve price from Stripe
            let priceId;
            try {
                const prices = await this.stripe.prices.list({
                    product: planId,
                    active: true
                });
                
                if (prices.data.length > 0) {
                    priceId = prices.data[0].id;
                } else {
                    // Create new price
                    const product = await this.stripe.products.create({
                        id: planId,
                        name: plan.name,
                        description: plan.features.join(', '),
                    });

                    const price = await this.stripe.prices.create({
                        product: product.id,
                        unit_amount: plan.price,
                        currency: plan.currency,
                        recurring: {
                            interval: plan.interval,
                        },
                    });

                    priceId = price.id;
                }
            } catch (error) {
                // Fallback to creating a new price
                const price = await this.stripe.prices.create({
                    unit_amount: plan.price,
                    currency: plan.currency,
                    recurring: {
                        interval: plan.interval,
                    },
                    product_data: {
                        name: plan.name,
                        description: plan.features.join(', '),
                    },
                });
                priceId = price.id;
            }

            const subscriptionData = {
                customer: customerId,
                items: [{
                    price: priceId,
                }],
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    save_default_payment_method: 'on_subscription',
                    payment_method_types: ['card'],
                },
                expand: ['latest_invoice.payment_intent'],
            };

            // Add trial period if specified
            if (trialDays > 0) {
                subscriptionData.trial_period_days = trialDays;
            }

            const subscription = await this.stripe.subscriptions.create(subscriptionData);

            return {
                success: true,
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
                subscription: subscription
            };

        } catch (error) {
            console.error('Subscription creation failed:', error);
            throw new Error(`Failed to create subscription: ${error.message}`);
        }
    }

    async cancelSubscription(subscriptionId, immediate = false) {
        try {
            let subscription;
            
            if (immediate) {
                subscription = await this.stripe.subscriptions.cancel(subscriptionId);
            } else {
                subscription = await this.stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true
                });
            }

            return {
                success: true,
                subscription: subscription,
                canceledImmediately: immediate,
                endDate: new Date(subscription.current_period_end * 1000)
            };

        } catch (error) {
            console.error('Subscription cancellation failed:', error);
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
    }

    async updateSubscription(subscriptionId, planId) {
        try {
            const newPlan = this.plans.get(planId);
            if (!newPlan) {
                throw new Error('Invalid plan ID');
            }

            // Get price for new plan
            const priceId = await this.getPriceForPlan(planId);

            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            const subscriptionItemId = subscription.items.data[0].id;

            const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
                items: [{
                    id: subscriptionItemId,
                    price: priceId,
                }],
                proration_behavior: 'create_prorations',
            });

            return {
                success: true,
                subscription: updatedSubscription
            };

        } catch (error) {
            console.error('Subscription update failed:', error);
            throw new Error(`Failed to update subscription: ${error.message}`);
        }
    }

    async getPriceForPlan(planId) {
        const plan = this.plans.get(planId);
        
        try {
            const prices = await this.stripe.prices.list({
                product: planId,
                active: true
            });
            
            if (prices.data.length > 0) {
                return prices.data[0].id;
            }
        } catch (error) {
            // Continue to create new price
        }

        // Create new price
        const price = await this.stripe.prices.create({
            unit_amount: plan.price,
            currency: plan.currency,
            recurring: {
                interval: plan.interval,
            },
            product_data: {
                name: plan.name,
                description: plan.features.join(', '),
            },
        });

        return price.id;
    }

    async getSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
                expand: ['latest_invoice.payment_intent']
            });

            return {
                success: true,
                subscription: subscription
            };

        } catch (error) {
            console.error('Subscription retrieval failed:', error);
            throw new Error(`Failed to retrieve subscription: ${error.message}`);
        }
    }

    async getCustomerSubscriptions(customerId) {
        try {
            const subscriptions = await this.stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                expand: ['data.latest_invoice.payment_intent']
            });

            return {
                success: true,
                subscriptions: subscriptions.data
            };

        } catch (error) {
            console.error('Customer subscriptions retrieval failed:', error);
            throw new Error(`Failed to retrieve subscriptions: ${error.message}`);
        }
    }

    async createCheckoutSession(userId, planId, successUrl, cancelUrl) {
        try {
            const plan = this.plans.get(planId);
            if (!plan) {
                throw new Error('Invalid plan ID');
            }

            const priceId = await this.getPriceForPlan(planId);

            const session = await this.stripe.checkout.sessions.create({
                customer_email: userId, // This should be the actual email
                billing_address_collection: 'auto',
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: {
                    userId: userId,
                    planId: planId
                }
            });

            return {
                success: true,
                sessionId: session.id,
                url: session.url
            };

        } catch (error) {
            console.error('Checkout session creation failed:', error);
            throw new Error(`Failed to create checkout session: ${error.message}`);
        }
    }

    async processWebhook(signature, payload) {
        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            const result = {
                success: true,
                event: event.type,
                data: event.data.object
            };

            // Handle different event types
            switch (event.type) {
                case 'invoice.payment_succeeded':
                    await this.handleInvoicePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    await this.handleInvoicePaymentFailed(event.data.object);
                    break;
                case 'customer.subscription.created':
                    await this.handleSubscriptionCreated(event.data.object);
                    break;
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionDeleted(event.data.object);
                    break;
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object);
                    break;
            }

            return result;

        } catch (error) {
            console.error('Webhook processing failed:', error);
            throw new Error(`Failed to process webhook: ${error.message}`);
        }
    }

    async handleInvoicePaymentSucceeded(invoice) {
        // Logic for successful invoice payment
        console.log(`Invoice ${invoice.id} payment succeeded for customer ${invoice.customer}`);
        
        // Update user subscription status in database
        // Send confirmation email
        // Grant access to features
    }

    async handleInvoicePaymentFailed(invoice) {
        // Logic for failed invoice payment
        console.log(`Invoice ${invoice.id} payment failed for customer ${invoice.customer}`);
        
        // Update user subscription status
        // Send notification email
        // Handle dunning process
    }

    async handleSubscriptionCreated(subscription) {
        // Logic for new subscription
        console.log(`Subscription ${subscription.id} created for customer ${subscription.customer}`);
        
        // Update user record
        // Send welcome email
        // Grant access to features
    }

    async handleSubscriptionUpdated(subscription) {
        // Logic for subscription update
        console.log(`Subscription ${subscription.id} updated`);
        
        // Update user record
        // Adjust feature access
    }

    async handleSubscriptionDeleted(subscription) {
        // Logic for subscription cancellation
        console.log(`Subscription ${subscription.id} deleted`);
        
        // Update user record
        // Revoke access to features
        // Send cancellation confirmation
    }

    async handlePaymentIntentSucceeded(paymentIntent) {
        // Logic for successful one-time payment
        console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
        
        // Update order status
        // Send confirmation
        // Grant access to purchased items
    }

    async handlePaymentIntentFailed(paymentIntent) {
        // Logic for failed payment
        console.log(`PaymentIntent ${paymentIntent.id} failed`);
        
        // Update order status
        // Send failure notification
    }

    // Utility methods
    getAvailablePlans() {
        return Array.from(this.plans.values()).map(plan => ({
            id: plan.id,
            name: plan.name,
            price: plan.price / 100, // Convert from cents
            currency: plan.currency,
            interval: plan.interval,
            features: plan.features
        }));
    }

    getPlanById(planId) {
        return this.plans.get(planId);
    }

    async refundPayment(paymentIntentId, amount = null) {
        try {
            const refundData = {
                payment_intent: paymentIntentId
            };

            if (amount) {
                refundData.amount = amount;
            }

            const refund = await this.stripe.refunds.create(refundData);

            return {
                success: true,
                refund: refund
            };

        } catch (error) {
            console.error('Refund creation failed:', error);
            throw new Error(`Failed to create refund: ${error.message}`);
        }
    }

    async getPaymentHistory(customerId, limit = 10) {
        try {
            const paymentIntents = await this.stripe.paymentIntents.list({
                customer: customerId,
                limit: limit
            });

            return {
                success: true,
                payments: paymentIntents.data
            };

        } catch (error) {
            console.error('Payment history retrieval failed:', error);
            throw new Error(`Failed to retrieve payment history: ${error.message}`);
        }
    }
}

module.exports = PaymentService;