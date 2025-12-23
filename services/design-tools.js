const sharp = require('sharp');
const Jimp = require('jimp');
const { PDFDocument, rgb } = require('pdf-lib');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

class DesignTools {
    constructor() {
        this.templates = new Map();
        this.initializeTemplates();
    }

    initializeTemplates() {
        // Logo templates
        this.templates.set('logo-modern', {
            name: 'Modern Logo',
            description: 'Clean and modern logo design',
            style: 'minimal',
            colors: ['#667eea', '#764ba2', '#000000'],
            fonts: ['Inter', 'Roboto', 'Montserrat']
        });

        this.templates.set('logo-classic', {
            name: 'Classic Logo',
            description: 'Traditional and professional logo',
            style: 'classic',
            colors: ['#1a1a1a', '#gold', '#white'],
            fonts: ['Times New Roman', 'Georgia', 'Garamond']
        });

        this.templates.set('logo-creative', {
            name: 'Creative Logo',
            description: 'Artistic and unique logo design',
            style: 'creative',
            colors: ['#ff6b6b', '#4ecdc4', '#45b7d1'],
            fonts: ['Comic Sans MS', 'Brush Script MT', 'Impact']
        });

        // Business card templates
        this.templates.set('business-card-professional', {
            name: 'Professional Business Card',
            description: 'Clean and professional business card',
            layout: 'standard',
            colors: ['#ffffff', '#1a1a1a', '#667eea'],
            size: { width: 3.5, height: 2 } // inches
        });

        this.templates.set('business-card-creative', {
            name: 'Creative Business Card',
            description: 'Modern and eye-catching design',
            layout: 'creative',
            colors: ['#2c3e50', '#e74c3c', '#ffffff'],
            size: { width: 3.5, height: 2 }
        });

        // Banner templates
        this.templates.set('banner-web', {
            name: 'Web Banner',
            description: 'Optimized for websites',
            size: { width: 1200, height: 600 }, // pixels
            format: 'web'
        });

        this.templates.set('banner-social', {
            name: 'Social Media Banner',
            description: 'Perfect for social media',
            size: { width: 1200, height: 630 }, // pixels
            format: 'social'
        });

        this.templates.set('banner-ad', {
            name: 'Advertisement Banner',
            description: 'Eye-catching advertisement',
            size: { width: 728, height: 90 }, // pixels
            format: 'ad'
        });
    }

    async createLogo(logoData) {
        const { text, template, color, style, size } = logoData;
        const templateConfig = this.templates.get(template) || this.templates.get('logo-modern');
        
        try {
            // Create canvas for logo
            const canvasSize = size || { width: 400, height: 200 };
            
            // Generate logo using Jimp
            const logo = await Jimp.create(canvasSize.width, canvasSize.height, '#ffffff');
            
            // Add background gradient or solid color
            if (templateConfig.style === 'modern') {
                const gradient = await this.createGradient(canvasSize, color || templateConfig.colors[0]);
                logo.composite(gradient, 0, 0);
            } else {
                logo.background(color || templateConfig.colors[0]);
            }
            
            // Add text
            const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            const textWidth = Jimp.measureText(font, text);
            const textHeight = Jimp.measureTextHeight(font, text);
            
            logo.print(
                font,
                (canvasSize.width - textWidth) / 2,
                (canvasSize.height - textHeight) / 2,
                text
            );
            
            // Add decorative elements
            if (templateConfig.style === 'creative') {
                await this.addDecorativeElements(logo, canvasSize);
            }
            
            // Save logo
            const filename = `logo-${Date.now()}.png`;
            const outputPath = path.join(process.cwd(), 'uploads', filename);
            await logo.writeAsync(outputPath);
            
            return {
                success: true,
                filename: filename,
                path: `/uploads/${filename}`,
                size: canvasSize
            };
        } catch (error) {
            throw new Error(`Logo creation failed: ${error.message}`);
        }
    }

    async createBusinessCard(cardData) {
        const { name, title, company, email, phone, website, template, color } = cardData;
        const templateConfig = this.templates.get(template) || this.templates.get('business-card-professional');
        
        try {
            // Create business card using PDF-lib for better quality
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([templateConfig.size.width * 72, templateConfig.size.height * 72]); // Convert inches to points
            
            // Set background color
            page.drawRectangle({
                x: 0,
                y: 0,
                width: templateConfig.size.width * 72,
                height: templateConfig.size.height * 72,
                color: rgb(1, 1, 1) // White background
            });
            
            // Add accent color bar
            const accentColor = this.hexToRgb(color || templateConfig.colors[0]);
            page.drawRectangle({
                x: 0,
                y: templateConfig.size.height * 72 - 60,
                width: templateConfig.size.width * 72,
                height: 60,
                color: accentColor
            });
            
            // Load fonts
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            
            // Add company name
            if (company) {
                page.drawText(company, {
                    x: 30,
                    y: templateConfig.size.height * 72 - 40,
                    size: 20,
                    font: helveticaBoldFont,
                    color: rgb(1, 1, 1)
                });
            }
            
            // Add name
            page.drawText(name, {
                x: 30,
                y: templateConfig.size.height * 72 - 100,
                size: 16,
                font: helveticaBoldFont,
                color: rgb(0, 0, 0)
            });
            
            // Add title
            if (title) {
                page.drawText(title, {
                    x: 30,
                    y: templateConfig.size.height * 72 - 125,
                    size: 12,
                    font: helveticaFont,
                    color: rgb(0.5, 0.5, 0.5)
                });
            }
            
            // Add contact information
            let yPos = 80;
            const contactInfo = [
                { icon: '📧', text: email },
                { icon: '📞', text: phone },
                { icon: '🌐', text: website }
            ];
            
            contactInfo.forEach(item => {
                if (item.text) {
                    page.drawText(`${item.icon} ${item.text}`, {
                        x: 30,
                        y: yPos,
                        size: 10,
                        font: helveticaFont,
                        color: rgb(0, 0, 0)
                    });
                    yPos -= 20;
                }
            });
            
            // Save PDF
            const pdfBytes = await pdfDoc.save();
            const filename = `business-card-${Date.now()}.pdf`;
            const outputPath = path.join(process.cwd(), 'uploads', filename);
            await fs.writeFile(outputPath, pdfBytes);
            
            return {
                success: true,
                filename: filename,
                path: `/uploads/${filename}`,
                type: 'business-card'
            };
        } catch (error) {
            throw new Error(`Business card creation failed: ${error.message}`);
        }
    }

    async createBanner(bannerData) {
        const { text, subtitle, template, color, image, callToAction } = bannerData;
        const templateConfig = this.templates.get(template) || this.templates.get('banner-web');
        
        try {
            // Create banner using Jimp
            const banner = await Jimp.create(templateConfig.size.width, templateConfig.size.height);
            
            // Add gradient background
            const gradient = await this.createGradient(templateConfig.size, color || '#667eea');
            banner.composite(gradient, 0, 0);
            
            // Add background image if provided
            if (image) {
                const backgroundImage = await Jimp.read(image.path);
                banner.composite(backgroundImage, 0, 0);
            }
            
            // Add semi-transparent overlay for text readability
            const overlay = await Jimp.create(templateConfig.size.width, templateConfig.size.height, 'rgba(0,0,0,0.4)');
            banner.composite(overlay, 0, 0);
            
            // Load fonts
            const titleFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
            const subtitleFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            const ctaFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
            
            // Add main text
            const titleText = text || 'Amazing Banner';
            const titleWidth = Jimp.measureText(titleFont, titleText);
            banner.print(
                titleFont,
                (templateConfig.size.width - titleWidth) / 2,
                100,
                titleText
            );
            
            // Add subtitle
            if (subtitle) {
                const subtitleWidth = Jimp.measureText(subtitleFont, subtitle);
                banner.print(
                    subtitleFont,
                    (templateConfig.size.width - subtitleWidth) / 2,
                    180,
                    subtitle
                );
            }
            
            // Add call-to-action button
            if (callToAction) {
                const buttonWidth = 200;
                const buttonHeight = 50;
                const buttonX = (templateConfig.size.width - buttonWidth) / 2;
                const buttonY = templateConfig.size.height - 150;
                
                // Draw button background
                const button = await Jimp.create(buttonWidth, buttonHeight, '#ffffff');
                banner.composite(button, buttonX, buttonY);
                
                // Add button text
                const ctaWidth = Jimp.measureText(ctaFont, callToAction);
                const ctaHeight = Jimp.measureTextHeight(ctaFont, callToAction);
                banner.print(
                    ctaFont,
                    buttonX + (buttonWidth - ctaWidth) / 2,
                    buttonY + (buttonHeight - ctaHeight) / 2,
                    callToAction
                );
            }
            
            // Save banner
            const filename = `banner-${Date.now()}.png`;
            const outputPath = path.join(process.cwd(), 'uploads', filename);
            await banner.writeAsync(outputPath);
            
            return {
                success: true,
                filename: filename,
                path: `/uploads/${filename}`,
                size: templateConfig.size,
                type: 'banner'
            };
        } catch (error) {
            throw new Error(`Banner creation failed: ${error.message}`);
        }
    }

    async createGradient(size, color) {
        const gradient = await Jimp.create(size.width, size.height, color);
        const gradientOverlay = await Jimp.create(size.width, size.height, 'rgba(255,255,255,0.2)');
        
        // Apply radial gradient effect
        const centerX = size.width / 2;
        const centerY = size.height / 2;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let x = 0; x < size.width; x++) {
            for (let y = 0; y < size.height; y++) {
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                const opacity = 1 - (distance / maxDistance);
                gradient.setPixelColor(
                    Jimp.rgbaToInt(255, 255, 255, opacity * 50),
                    x,
                    y
                );
            }
        }
        
        return gradient;
    }

    async addDecorativeElements(image, size) {
        // Add geometric shapes
        const shapeSize = 20;
        const positions = [
            { x: 50, y: 50 },
            { x: size.width - 50, y: 50 },
            { x: 50, y: size.height - 50 },
            { x: size.width - 50, y: size.height - 50 }
        ];
        
        for (const pos of positions) {
            const circle = await Jimp.create(shapeSize, shapeSize, 'rgba(102, 126, 234, 0.5)');
            // Create circular shape (simplified)
            image.composite(circle, pos.x - shapeSize/2, pos.y - shapeSize/2);
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 0, g: 0, b: 0 };
    }

    async generateDesignPreview(template, type) {
        const templateConfig = this.templates.get(template);
        if (!templateConfig) {
            throw new Error('Template not found');
        }
        
        let preview;
        
        switch (type) {
            case 'logo':
                preview = await this.createLogo({
                    text: 'Sample',
                    template: template,
                    size: { width: 200, height: 100 }
                });
                break;
            case 'business-card':
                preview = await this.createBusinessCard({
                    name: 'John Doe',
                    title: 'CEO',
                    company: 'Sample Company',
                    email: 'john@example.com',
                    phone: '+1234567890',
                    template: template
                });
                break;
            case 'banner':
                preview = await this.createBanner({
                    text: 'Amazing Banner',
                    subtitle: 'Click here to learn more',
                    template: template
                });
                break;
            default:
                throw new Error('Invalid design type');
        }
        
        return preview;
    }

    getAvailableTemplates(type) {
        const templates = Array.from(this.templates.entries())
            .filter(([id, template]) => id.includes(type))
            .map(([id, template]) => ({
                id: id,
                name: template.name,
                description: template.description,
                preview: `/previews/${id}.png` // You would need to generate these
            }));
        
        return templates;
    }

    async customizeDesign(designData, customizations) {
        const { filename, path: originalPath } = designData;
        
        try {
            // Load existing design
            const design = await Jimp.read(path.join(process.cwd(), 'uploads', filename));
            
            // Apply customizations
            if (customizations.brightness) {
                design.brightness(customizations.brightness);
            }
            
            if (customizations.contrast) {
                design.contrast(customizations.contrast);
            }
            
            if (customizations.saturation) {
                design.posterize(customizations.saturation);
            }
            
            if (customizations.rotation) {
                design.rotate(customizations.rotation);
            }
            
            if (customizations.flip) {
                if (customizations.flip === 'horizontal') {
                    design.flip(true, false);
                } else if (customizations.flip === 'vertical') {
                    design.flip(false, true);
                }
            }
            
            // Add text overlay if provided
            if (customizations.textOverlay) {
                const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
                design.print(
                    font,
                    customizations.textX || 50,
                    customizations.textY || 50,
                    customizations.textOverlay
                );
            }
            
            // Save customized design
            const customFilename = `custom-${Date.now()}-${filename}`;
            const outputPath = path.join(process.cwd(), 'uploads', customFilename);
            await design.writeAsync(outputPath);
            
            return {
                success: true,
                filename: customFilename,
                path: `/uploads/${customFilename}`,
                original: originalPath
            };
        } catch (error) {
            throw new Error(`Design customization failed: ${error.message}`);
        }
    }

    async exportDesign(filename, format, quality = 90) {
        try {
            const design = await Jimp.read(path.join(process.cwd(), 'uploads', filename));
            const exportFilename = `export-${Date.now()}.${format}`;
            const outputPath = path.join(process.cwd(), 'uploads', exportFilename);
            
            switch (format) {
                case 'jpg':
                case 'jpeg':
                    await design.quality(quality).writeAsync(outputPath);
                    break;
                case 'png':
                    await design.writeAsync(outputPath);
                    break;
                case 'webp':
                    await design.writeAsync(outputPath);
                    break;
                default:
                    throw new Error('Unsupported export format');
            }
            
            return {
                success: true,
                filename: exportFilename,
                path: `/uploads/${exportFilename}`,
                format: format,
                size: design.bitmap.width + 'x' + design.bitmap.height
            };
        } catch (error) {
            throw new Error(`Design export failed: ${error.message}`);
        }
    }
}

module.exports = DesignTools;