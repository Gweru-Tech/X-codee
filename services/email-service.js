const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
    constructor() {
        this.transporter = null;
        this.templates = new Map();
        this.initializeTransporter();
        this.loadTemplates();
    }

    initializeTransporter() {
        // Configure email transporter
        const config = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        };

        if (config.auth.user && config.auth.pass) {
            this.transporter = nodemailer.createTransporter(config);
            console.log('Email service initialized');
        } else {
            console.warn('Email service not configured - missing SMTP credentials');
        }
    }

    async loadTemplates() {
        try {
            const templateFiles = await fs.readdir(path.join(__dirname, '../templates/emails'));
            
            for (const file of templateFiles) {
                if (file.endsWith('.html')) {
                    const templateName = path.basename(file, '.html');
                    const templateContent = await fs.readFile(
                        path.join(__dirname, '../templates/emails', file), 
                        'utf8'
                    );
                    this.templates.set(templateName, templateContent);
                }
            }
        } catch (error) {
            console.warn('Email templates not found, using defaults');
            this.createDefaultTemplates();
        }
    }

    createDefaultTemplates() {
        // Default email templates
        this.templates.set('welcome', `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Welcome to X-Coder Platform</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to X-Coder Platform!</h1>
                    </div>
                    <div class="content">
                        <p>Hi {{firstName}},</p>
                        <p>Thank you for joining X-Coder Platform! We're excited to help you build amazing projects.</p>
                        <p>Here's what you can do next:</p>
                        <ul>
                            <li>Create your first project</li>
                            <li>Explore our design tools</li>
                            <li>Set up WhatsApp bots</li>
                            <li>Deploy your applications</li>
                        </ul>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="{{baseUrl}}/dashboard" class="button">Get Started</a>
                        </p>
                        <p>If you have any questions, our support team is here to help!</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 X-Coder Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `);

        this.templates.set('project-deployed', `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Project Deployed Successfully</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🚀 Project Deployed Successfully!</h1>
                    </div>
                    <div class="content">
                        <p>Hi {{firstName}},</p>
                        <p>Great news! Your project <strong>{{projectName}}</strong> has been successfully deployed.</p>
                        <p><strong>Deployment Details:</strong></p>
                        <ul>
                            <li>URL: <a href="{{deploymentUrl}}">{{deploymentUrl}}</a></li>
                            <li>Platform: {{platform}}</li>
                            <li>Deployed at: {{deployedAt}}</li>
                        </ul>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="{{deploymentUrl}}" class="button">View Live Site</a>
                        </p>
                        <p>Your project is now live and accessible to users worldwide!</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 X-Coder Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `);

        this.templates.set('password-reset', `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Password Reset Request</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ffc107 0%, #ff6b6b 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #f9f9f9; }
                    .button { display: inline-block; background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hi {{firstName}},</p>
                        <p>We received a request to reset your password for your X-Coder Platform account.</p>
                        <p>Click the button below to reset your password:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="{{resetUrl}}" class="button">Reset Password</a>
                        </p>
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This link will expire in 1 hour</li>
                            <li>If you didn't request this, please ignore this email</li>
                            <li>Never share this link with anyone</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 X-Coder Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    async sendEmail(to, subject, template, data = {}) {
        if (!this.transporter) {
            throw new Error('Email service not configured');
        }

        try {
            // Get template content
            const templateContent = this.templates.get(template);
            if (!templateContent) {
                throw new Error(`Email template '${template}' not found`);
            }

            // Replace template variables
            const html = this.replaceVariables(templateContent, data);

            const mailOptions = {
                from: `"${process.env.FROM_NAME || 'X-Coder Platform'}" <${process.env.FROM_EMAIL}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject: subject,
                html: html,
                // Add text version for better deliverability
                text: this.htmlToText(html)
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            console.log(`Email sent to ${to}: ${subject}`);
            return {
                success: true,
                messageId: result.messageId,
                response: result
            };

        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    replaceVariables(template, data) {
        let result = template;
        
        // Replace {{variable}} patterns
        for (const [key, value] of Object.entries(data)) {
            const pattern = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(pattern, value);
        }

        // Add default variables
        const defaultData = {
            baseUrl: process.env.BASE_URL || 'https://xcoderplatform.com',
            companyName: 'X-Coder Platform',
            supportEmail: 'support@xcoderplatform.com',
            currentYear: new Date().getFullYear()
        };

        for (const [key, value] of Object.entries(defaultData)) {
            const pattern = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(pattern, value);
        }

        return result;
    }

    htmlToText(html) {
        // Simple HTML to text conversion
        return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    // Convenience methods for common email types
    async sendWelcomeEmail(user) {
        return await this.sendEmail(
            user.email,
            'Welcome to X-Coder Platform!',
            'welcome',
            {
                firstName: user.profile?.firstName || user.username,
                email: user.email
            }
        );
    }

    async sendProjectDeployedEmail(user, project) {
        return await this.sendEmail(
            user.email,
            `Project "${project.name}" Deployed Successfully!`,
            'project-deployed',
            {
                firstName: user.profile?.firstName || user.username,
                projectName: project.name,
                deploymentUrl: project.deployment.url,
                platform: project.deployment.platform,
                deployedAt: project.deployment.lastDeployed
            }
        );
    }

    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.BASE_URL}/auth/reset-password?token=${resetToken}`;
        
        return await this.sendEmail(
            user.email,
            'Reset Your Password',
            'password-reset',
            {
                firstName: user.profile?.firstName || user.username,
                resetUrl: resetUrl
            }
        );
    }

    async sendNotificationEmail(user, notification) {
        return await this.sendEmail(
            user.email,
            notification.title,
            'notification',
            {
                firstName: user.profile?.firstName || user.username,
                title: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl
            }
        );
    }

    async sendBulkEmail(recipients, subject, template, data = {}) {
        const results = [];
        
        for (const recipient of recipients) {
            try {
                const result = await this.sendEmail(
                    recipient.email,
                    subject,
                    template,
                    { ...data, ...recipient }
                );
                results.push({ email: recipient.email, success: true, ...result });
            } catch (error) {
                results.push({ email: recipient.email, success: false, error: error.message });
            }
        }

        return results;
    }

    async sendEmailWithAttachments(to, subject, template, data, attachments) {
        if (!this.transporter) {
            throw new Error('Email service not configured');
        }

        try {
            const templateContent = this.templates.get(template);
            const html = this.replaceVariables(templateContent, data);

            const mailOptions = {
                from: `"${process.env.FROM_NAME || 'X-Coder Platform'}" <${process.env.FROM_EMAIL}>`,
                to: Array.isArray(to) ? to.join(', ') : to,
                subject: subject,
                html: html,
                text: this.htmlToText(html),
                attachments: attachments.map(attachment => ({
                    filename: attachment.filename,
                    content: attachment.content,
                    contentType: attachment.contentType
                }))
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            return {
                success: true,
                messageId: result.messageId,
                response: result
            };

        } catch (error) {
            console.error('Email with attachments failed:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    // Template management
    async addTemplate(name, content) {
        this.templates.set(name, content);
        
        // Optionally save to file system
        try {
            await fs.writeFile(
                path.join(__dirname, '../templates/emails', `${name}.html`),
                content
            );
        } catch (error) {
            console.warn('Failed to save template to file:', error);
        }
    }

    getTemplate(name) {
        return this.templates.get(name);
    }

    getAvailableTemplates() {
        return Array.from(this.templates.keys());
    }

    // Email verification
    async verifyEmailConfiguration() {
        if (!this.transporter) {
            return { success: false, error: 'Transporter not configured' };
        }

        try {
            await this.transporter.verify();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get email service stats
    getStats() {
        return {
            configured: !!this.transporter,
            templatesAvailable: this.templates.size,
            supportedFeatures: [
                'HTML emails',
                'Template system',
                'Attachments',
                'Bulk sending',
                'Variable replacement'
            ]
        };
    }
}

module.exports = EmailService;