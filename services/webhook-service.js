const crypto = require('crypto');
const { URL } = require('url');

class WebhookService {
    constructor() {
        this.webhooks = new Map();
        this.eventQueue = [];
        this.processing = false;
    }

    async createWebhook(userId, webhookData) {
        const { url, events, secret, active = true } = webhookData;
        
        // Validate URL
        this.validateUrl(url);
        
        const webhook = {
            id: crypto.randomUUID(),
            userId: userId,
            url: url,
            events: events || ['*'], // '*' means all events
            secret: secret || crypto.randomBytes(32).toString('hex'),
            active: active,
            retryCount: 3,
            timeout: 30000, // 30 seconds
            createdAt: new Date(),
            updatedAt: new Date(),
            lastTriggered: null,
            successCount: 0,
            failureCount: 0
        };

        this.webhooks.set(webhook.id, webhook);
        return webhook;
    }

    async updateWebhook(webhookId, userId, updateData) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook || webhook.userId !== userId) {
            throw new Error('Webhook not found or access denied');
        }

        if (updateData.url) {
            this.validateUrl(updateData.url);
        }

        Object.assign(webhook, updateData);
        webhook.updatedAt = new Date();
        
        this.webhooks.set(webhookId, webhook);
        return webhook;
    }

    async deleteWebhook(webhookId, userId) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook || webhook.userId !== userId) {
            throw new Error('Webhook not found or access denied');
        }

        this.webhooks.delete(webhookId);
        return true;
    }

    getWebhook(webhookId, userId) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook || webhook.userId !== userId) {
            throw new Error('Webhook not found or access denied');
        }
        return webhook;
    }

    getUserWebhooks(userId) {
        return Array.from(this.webhooks.values()).filter(webhook => webhook.userId === userId);
    }

    async triggerWebhook(event, data, options = {}) {
        const webhooks = this.getMatchingWebhooks(event);
        
        // Add to queue for processing
        for (const webhook of webhooks) {
            this.eventQueue.push({
                webhook: webhook,
                event: event,
                data: data,
                timestamp: new Date(),
                attempt: 0,
                options: options
            });
        }

        // Process queue if not already processing
        if (!this.processing) {
            this.processEventQueue();
        }

        return webhooks.length;
    }

    getMatchingWebhooks(event) {
        return Array.from(this.webhooks.values()).filter(webhook => {
            if (!webhook.active) return false;
            
            // Check if webhook listens to this event
            return webhook.events.includes('*') || 
                   webhook.events.includes(event) ||
                   webhook.events.some(pattern => this.matchPattern(pattern, event));
        });
    }

    matchPattern(pattern, event) {
        // Simple wildcard matching
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(event);
    }

    async processEventQueue() {
        this.processing = true;

        while (this.eventQueue.length > 0) {
            const eventItem = this.eventQueue.shift();
            await this.processWebhookEvent(eventItem);
        }

        this.processing = false;
    }

    async processWebhookEvent(eventItem) {
        const { webhook, event, data } = eventItem;
        
        try {
            const payload = {
                id: crypto.randomUUID(),
                event: event,
                data: data,
                timestamp: new Date().toISOString(),
                webhook: {
                    id: webhook.id,
                    url: webhook.url
                }
            };

            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'X-Coder-Webhook/1.0',
                'X-Webhook-ID': payload.id,
                'X-Event-Type': event,
                'X-Timestamp': payload.timestamp
            };

            // Add signature if secret is configured
            if (webhook.secret) {
                const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);
                headers['X-Signature'] = `sha256=${signature}`;
            }

            const response = await this.makeHttpRequest(webhook.url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
                timeout: webhook.timeout
            });

            // Update webhook stats
            webhook.lastTriggered = new Date();
            webhook.successCount++;

            this.webhooks.set(webhook.id, webhook);

            console.log(`Webhook ${webhook.id} triggered successfully for event ${event}`);
            
            return { success: true, response };

        } catch (error) {
            webhook.failureCount++;
            
            // Retry logic
            if (eventItem.attempt < webhook.retryCount) {
                eventItem.attempt++;
                
                // Exponential backoff
                const delay = Math.pow(2, eventItem.attempt) * 1000;
                setTimeout(() => {
                    this.eventQueue.push(eventItem);
                }, delay);
                
                console.log(`Webhook ${webhook.id} failed, retrying... (${eventItem.attempt}/${webhook.retryCount})`);
            } else {
                console.error(`Webhook ${webhook.id} failed after ${webhook.retryCount} attempts:`, error.message);
                
                // Could implement dead letter queue here
                this.notifyWebhookFailure(webhook, event, error);
            }
            
            this.webhooks.set(webhook.id, webhook);
            
            return { success: false, error: error.message };
        }
    }

    async makeHttpRequest(url, options) {
        // In a real implementation, you'd use a proper HTTP client like axios
        // This is a simplified version using fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    generateSignature(payload, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }

    validateSignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            throw new Error('Invalid URL format');
        }
    }

    async notifyWebhookFailure(webhook, event, error) {
        // In a real implementation, you might send an email, Slack notification, etc.
        console.error(`Webhook failure notification for ${webhook.id}:`, {
            webhook: webhook.url,
            event: event,
            error: error.message,
            timestamp: new Date()
        });
    }

    getWebhookStats(webhookId, userId) {
        const webhook = this.getWebhook(webhookId, userId);
        
        return {
            id: webhook.id,
            url: webhook.url,
            events: webhook.events,
            active: webhook.active,
            createdAt: webhook.createdAt,
            updatedAt: webhook.updatedAt,
            lastTriggered: webhook.lastTriggered,
            successCount: webhook.successCount,
            failureCount: webhook.failureCount,
            successRate: webhook.successCount + webhook.failureCount > 0 
                ? (webhook.successCount / (webhook.successCount + webhook.failureCount)) * 100 
                : 0
        };
    }

    async replayWebhook(webhookId, userId, event, data) {
        const webhook = this.getWebhook(webhookId, userId);
        
        const eventItem = {
            webhook: webhook,
            event: event,
            data: data,
            timestamp: new Date(),
            attempt: 0
        };

        return await this.processWebhookEvent(eventItem);
    }

    async testWebhook(webhookId, userId) {
        const webhook = this.getWebhook(webhookId, userId);
        
        const testData = {
            type: 'test',
            message: 'This is a test webhook from X-Coder Platform',
            timestamp: new Date().toISOString()
        };

        return await this.triggerWebhook('webhook.test', testData, { 
            webhookIds: [webhookId] 
        });
    }

    // Predefined event types that the system supports
    getSupportedEvents() {
        return [
            'project.created',
            'project.updated',
            'project.deleted',
            'project.deployed',
            'project.failed',
            'user.created',
            'user.updated',
            'service.created',
            'service.updated',
            'file.uploaded',
            'file.deleted',
            'payment.completed',
            'payment.failed',
            'subscription.created',
            'subscription.canceled',
            'webhook.test',
            'system.maintenance',
            'system.error'
        ];
    }

    // System-level webhook triggers (called by other services)
    static initialize(app) {
        const webhookService = new WebhookService();
        
        // Make webhook service available globally
        app.locals.webhookService = webhookService;
        
        // Add middleware to trigger webhooks for common events
        app.use((req, res, next) => {
            // Store original res.json to intercept responses
            const originalJson = res.json;
            
            res.json = function(data) {
                // Trigger webhook based on the endpoint and response
                if (req.path.startsWith('/user/projects/') && req.method === 'POST') {
                    app.locals.webhookService.triggerWebhook('project.created', data);
                }
                
                if (req.path.startsWith('/deploy/') && req.method === 'POST') {
                    app.locals.webhookService.triggerWebhook('project.deployed', data);
                }
                
                return originalJson.call(this, data);
            };
            
            next();
        });
        
        return webhookService;
    }
}

module.exports = WebhookService;