const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class WhatsAppBotBuilder {
    constructor() {
        this.bots = new Map();
        this.templates = new Map();
        this.initializeTemplates();
    }

    initializeTemplates() {
        // Pre-built bot templates
        this.templates.set('customer-service', {
            name: 'Customer Service Bot',
            description: 'Handle customer inquiries and support',
            triggers: ['hello', 'help', 'support'],
            responses: {
                greeting: 'Hello! How can I help you today?',
                menu: 'Please choose from the following options:\n1. Order Status\n2. Product Information\n3. Technical Support\n4. Speak to Agent',
                default: 'I\'m not sure how to help with that. Would you like to speak to a human agent?'
            }
        });

        this.templates.set('appointment-booking', {
            name: 'Appointment Booking Bot',
            description: 'Schedule appointments and send reminders',
            triggers: ['book', 'schedule', 'appointment'],
            responses: {
                greeting: 'Welcome! I can help you book an appointment.',
                askService: 'What service would you like to book?',
                askDate: 'What date would you prefer?',
                askTime: 'What time works best for you?',
                confirm: 'Great! I\'ve booked your appointment for {date} at {time}. You\'ll receive a reminder.'
            }
        });

        this.templates.set('ecommerce', {
            name: 'E-commerce Bot',
            description: 'Product browsing and order management',
            triggers: ['products', 'order', 'track'],
            responses: {
                greeting: 'Hi! Welcome to our store. How can I help you today?',
                categories: 'Our main categories are:\n1. Electronics\n2. Clothing\n3. Home & Garden\n4. Sports',
                orderStatus: 'Please provide your order number to check the status.',
                track: 'Your order #{orderNumber} is currently {status}.'
            }
        });
    }

    async createBot(userId, botData) {
        const botId = uuidv4();
        
        const bot = {
            id: botId,
            userId: userId,
            name: botData.name,
            description: botData.description,
            template: botData.template || 'custom',
            phoneNumber: botData.phoneNumber,
            webhookUrl: botData.webhookUrl,
            isActive: false,
            settings: {
                autoReply: botData.autoReply || false,
                workingHours: botData.workingHours || { start: '09:00', end: '18:00' },
                timezone: botData.timezone || 'UTC',
                language: botData.language || 'en'
            },
            flows: botData.flows || [],
            keywords: botData.keywords || {},
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (botData.template && this.templates.has(botData.template)) {
            const template = this.templates.get(botData.template);
            bot.flows = this.createFlowsFromTemplate(template);
            bot.keywords = template.triggers;
        }

        this.bots.set(botId, bot);
        return bot;
    }

    createFlowsFromTemplate(template) {
        const flows = [];
        
        // Create greeting flow
        flows.push({
            id: uuidv4(),
            name: 'Greeting',
            trigger: ['hello', 'hi', 'start'],
            type: 'text',
            message: template.responses.greeting,
            next: 'main-menu'
        });

        // Create main menu flow
        flows.push({
            id: uuidv4(),
            name: 'Main Menu',
            trigger: ['menu', 'options', 'help'],
            type: 'interactive',
            message: template.responses.menu,
            buttons: this.createMenuButtons(template),
            next: null
        });

        return flows;
    }

    createMenuButtons(template) {
        if (template.name === 'Customer Service Bot') {
            return [
                { id: 'order-status', text: 'Order Status', action: 'check_order' },
                { id: 'product-info', text: 'Product Information', action: 'product_info' },
                { id: 'tech-support', text: 'Technical Support', action: 'tech_support' },
                { id: 'human-agent', text: 'Speak to Agent', action: 'human_agent' }
            ];
        }
        return [];
    }

    async updateBot(botId, updateData) {
        const bot = this.bots.get(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }

        Object.assign(bot, updateData);
        bot.updatedAt = new Date();
        
        this.bots.set(botId, bot);
        return bot;
    }

    async deleteBot(botId, userId) {
        const bot = this.bots.get(botId);
        if (!bot || bot.userId !== userId) {
            throw new Error('Bot not found or access denied');
        }

        this.bots.delete(botId);
        return true;
    }

    getBot(botId, userId) {
        const bot = this.bots.get(botId);
        if (!bot || bot.userId !== userId) {
            throw new Error('Bot not found or access denied');
        }
        return bot;
    }

    getUserBots(userId) {
        return Array.from(this.bots.values()).filter(bot => bot.userId === userId);
    }

    async activateBot(botId) {
        const bot = this.bots.get(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }

        bot.isActive = true;
        bot.updatedAt = new Date();
        
        // Here you would integrate with WhatsApp Business API
        // For now, we'll simulate activation
        await this.setupWhatsAppWebhook(bot);
        
        this.bots.set(botId, bot);
        return bot;
    }

    async setupWhatsAppWebhook(bot) {
        // Simulate WhatsApp webhook setup
        console.log(`Setting up webhook for bot ${botId} at ${bot.webhookUrl}`);
        
        // In a real implementation, you would:
        // 1. Register webhook with WhatsApp Business API
        // 2. Verify webhook endpoint
        // 3. Set up message handlers
        // 4. Configure phone number
        
        return {
            webhookId: uuidv4(),
            status: 'active',
            phoneNumber: bot.phoneNumber
        };
    }

    async processMessage(botId, message, from) {
        const bot = this.bots.get(botId);
        if (!bot || !bot.isActive) {
            throw new Error('Bot not active');
        }

        // Find matching flow
        const flow = this.findMatchingFlow(bot.flows, message);
        
        if (flow) {
            return await this.executeFlow(flow, message, from, bot);
        }

        // Return default response
        return {
            type: 'text',
            message: bot.settings.autoReply ? 
                'Thank you for your message. We\'ll get back to you soon.' : 
                'I\'m not sure how to help with that.',
            timestamp: new Date()
        };
    }

    findMatchingFlow(flows, message) {
        const normalizedMessage = message.toLowerCase().trim();
        
        for (const flow of flows) {
            if (flow.trigger && flow.trigger.some(trigger => 
                normalizedMessage.includes(trigger.toLowerCase())
            )) {
                return flow;
            }
        }
        
        return null;
    }

    async executeFlow(flow, message, from, bot) {
        const response = {
            type: flow.type,
            message: flow.message,
            timestamp: new Date()
        };

        // Process template variables
        if (flow.message.includes('{')) {
            response.message = this.processTemplate(flow.message, { 
                user: from, 
                message: message,
                bot: bot
            });
        }

        // Add interactive elements if needed
        if (flow.type === 'interactive' && flow.buttons) {
            response.buttons = flow.buttons;
        }

        // Handle next flow
        if (flow.next) {
            const nextFlow = bot.flows.find(f => f.name === flow.next);
            if (nextFlow) {
                setTimeout(async () => {
                    await this.executeFlow(nextFlow, message, from, bot);
                }, 1000);
            }
        }

        // Log interaction
        this.logInteraction(bot.id, from, message, response);

        return response;
    }

    processTemplate(template, variables) {
        return template.replace(/\{(\w+)\}/g, (match, key) => {
            return variables[key] || match;
        });
    }

    logInteraction(botId, from, message, response) {
        // In a real implementation, you'd save this to database
        console.log(`Bot ${botId} interaction:`, {
            from: from,
            message: message,
            response: response,
            timestamp: new Date()
        });
    }

    getBotAnalytics(botId, timeRange = '7d') {
        const bot = this.bots.get(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }

        // Simulate analytics data
        const analytics = {
            totalMessages: Math.floor(Math.random() * 1000),
            uniqueUsers: Math.floor(Math.random() * 100),
            averageResponseTime: '2.5s',
            topFlows: [
                { name: 'Greeting', count: 450 },
                { name: 'Main Menu', count: 320 },
                { name: 'Order Status', count: 180 }
            ],
            messagesByDay: this.generateMessageStats(timeRange),
            satisfactionRate: '92%'
        };

        return analytics;
    }

    generateMessageStats(timeRange) {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 1;
        const stats = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            stats.push({
                date: date.toISOString().split('T')[0],
                messages: Math.floor(Math.random() * 100)
            });
        }
        
        return stats;
    }

    async exportBot(botId, format = 'json') {
        const bot = this.bots.get(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }

        if (format === 'json') {
            return JSON.stringify(bot, null, 2);
        }

        if (format === 'csv') {
            // Convert flows to CSV
            const csv = [
                'Flow Name,Trigger,Type,Message',
                ...bot.flows.map(flow => 
                    `"${flow.name}","${flow.trigger.join(', ')}","${flow.type}","${flow.message}"`
                )
            ].join('\n');
            
            return csv;
        }

        throw new Error('Unsupported export format');
    }

    async generateQRCode(botId) {
        const bot = this.bots.get(botId);
        if (!bot) {
            throw new Error('Bot not found');
        }

        const qrData = `https://wa.me/${bot.phoneNumber.replace('+', '')}?text=Start`;
        const qrCodeDataURL = await qrcode.toDataURL(qrData);
        
        return {
            qrCode: qrCodeDataURL,
            phoneNumber: bot.phoneNumber,
            message: 'Scan this QR code to start a conversation with the bot'
        };
    }

    getAvailableTemplates() {
        return Array.from(this.templates.entries()).map(([id, template]) => ({
            id: id,
            name: template.name,
            description: template.description
        }));
    }
}

module.exports = WhatsAppBotBuilder;