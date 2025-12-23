# X-Coder Platform

A comprehensive web development platform that provides professional services for building, deploying, and managing digital projects. Features include web development, design services, hosting, automation, and deployment tools.

## 🚀 Features

### Core Services
- **Web Development**: Professional HTML/CSS/JavaScript development with modern frameworks
- **Design Services**: Logo design, business cards, banners, and brand identity
- **Web Hosting**: Reliable cloud hosting with automatic deployment
- **WhatsApp Bots**: Build and deploy WhatsApp chatbots for automation
- **File Management**: Advanced file upload and management system
- **Analytics & Insights**: Real-time analytics and performance monitoring

### Platform Features
- **User Authentication**: Secure login/registration with role-based access
- **Admin Panel**: Complete administration dashboard
- **Project Management**: Organize and manage all your projects
- **Service Marketplace**: Offer and discover services
- **Real-time Updates**: Live notifications and updates
- **Responsive Design**: Mobile-friendly interface

### Technical Features
- **File Upload**: Drag-and-drop file upload with image processing
- **Deployment**: Deploy to multiple platforms (Render, Vercel, Netlify, GitHub Pages)
- **API Integration**: RESTful APIs with comprehensive documentation
- **Security**: Advanced security features and data protection
- **Scalability**: Built to scale with microservices architecture

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Sharp** for image processing
- **Socket.io** for real-time features
- **Bull** for background jobs

### Frontend
- **EJS** templating engine
- **Tailwind CSS** for styling
- **Vanilla JavaScript** with ES6+
- **Font Awesome** for icons
- **Chart.js** for analytics

### DevOps & Deployment
- **Render.com** for hosting
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **AWS S3** for file storage
- **Redis** for caching

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- MongoDB 5.0+
- Redis (optional, for caching)

### Local Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/xcoder-platform.git
cd xcoder-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo

# Or install locally
mongod
```

5. **Start the application**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. **Access the application**
- Open http://localhost:3000 in your browser
- Default admin credentials: username: `admin`, password: `admin123`

## 🌐 Deployment

### Deploy to Render.com

1. **Fork and push to GitHub**
```bash
git remote add origin https://github.com/your-username/xcoder-platform.git
git push -u origin main
```

2. **Create Render account**
- Sign up at [render.com](https://render.com)
- Connect your GitHub account

3. **Deploy web service**
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Use the provided `render.yaml` configuration
- Set environment variables in Render dashboard

4. **Deploy database**
- Add MongoDB database from Render marketplace
- Update `MONGODB_URI` in environment variables

5. **Deploy background worker** (optional)
- Add worker service for background jobs

### Environment Variables Required for Production

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
SESSION_SECRET=your-secure-secret
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📁 Project Structure

```
xcoder-platform/
├── controllers/          # Route controllers
├── middleware/           # Express middleware
├── models/              # MongoDB models
├── routes/              # API routes
├── services/            # Business logic services
├── utils/               # Utility functions
├── views/               # EJS templates
│   ├── auth/           # Authentication pages
│   ├── admin/          # Admin dashboard
│   ├── user/           # User dashboard
│   ├── pages/          # Static pages
│   └── partials/       # Template partials
├── public/              # Static assets
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   ├── images/         # Image assets
│   └── uploads/        # User uploads
├── config/              # Configuration files
├── uploads/             # File upload storage
├── .env.example         # Environment template
├── render.yaml          # Render deployment config
├── package.json         # Dependencies and scripts
└── server.js            # Main application file
```

## 🔧 Configuration

### Environment Variables

Key environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `SESSION_SECRET` | Session encryption secret | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `STRIPE_SECRET_KEY` | Stripe payment processing | Optional |
| `AWS_ACCESS_KEY_ID` | AWS S3 access | Optional |
| `SMTP_HOST` | Email server configuration | Optional |

### Database Setup

**MongoDB Collections:**
- `users` - User accounts and profiles
- `services` - Service listings and details
- `projects` - User projects and deployments
- `files` - File upload metadata
- `analytics` - Analytics data

**Indexes for Performance:**
```javascript
// Users collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })

// Services collection
db.services.createIndex({ "category": 1, "status": 1 })
db.services.createIndex({ "user": 1, "status": 1 })

// Projects collection
db.projects.createIndex({ "user": 1, "status": 1 })
```

## 🔐 Security

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (user, admin, coder)
- Session management with secure cookies
- Password hashing with bcrypt

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection with helmet.js
- CSRF protection
- Rate limiting

### File Upload Security
- File type validation
- Size limits
- Virus scanning (optional)
- Secure storage with AWS S3

## 📊 Monitoring & Analytics

### Application Monitoring
- Health check endpoint: `/health`
- Performance metrics
- Error tracking with Sentry (optional)
- Log aggregation

### Business Analytics
- User registration and activity
- Service usage statistics
- Project deployment metrics
- Revenue tracking (with Stripe)

## 🚀 API Documentation

### Authentication Endpoints
```
POST /auth/login          - User login
POST /auth/register       - User registration
GET  /auth/status         - Check auth status
POST /auth/logout         - User logout
```

### User Endpoints
```
GET  /user/dashboard      - User dashboard
GET  /user/projects       - List user projects
POST /user/projects       - Create new project
PUT  /user/projects/:id   - Update project
GET  /user/profile        - User profile
PUT  /user/profile        - Update profile
```

### Service Endpoints
```
GET  /service             - List all services
GET  /service/:id         - Get service details
POST /service/create      - Create new service
PUT  /service/:id         - Update service
DELETE /service/:id       - Delete service
```

### File Upload Endpoints
```
POST /upload/single       - Upload single file
POST /upload/multiple     - Upload multiple files
POST /upload/image        - Upload and process image
DELETE /upload/:filename  - Delete file
GET  /upload/list         - List user files
```

### Deployment Endpoints
```
POST /deploy/:projectId   - Deploy project
GET  /deploy/status/:id   - Get deployment status
POST /deploy/redeploy/:id - Redeploy project
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/auth.test.js

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Use ESLint for code formatting
- Follow conventional commit messages
- Write tests for new features
- Update documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- 📧 Email: support@xcoderplatform.com
- 💬 Discord: [Join our community](https://discord.gg/xcoder)
- 📖 Documentation: [docs.xcoderplatform.com](https://docs.xcoderplatform.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/xcoder-platform/issues)

### FAQ

**Q: How do I reset the admin password?**
A: Run `npm run reset-admin-password` in the terminal.

**Q: Can I use a different database?**
A: Currently only MongoDB is supported, but PostgreSQL support is planned.

**Q: How do I add custom themes?**
A: Modify the CSS files in `public/css/` or create custom themes in the admin panel.

**Q: Is self-hosting supported?**
A: Yes, the platform can be self-hosted on any Node.js compatible server.

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] API rate limiting and quotas
- [ ] Custom domain management
- [ ] Email template builder
- [ ] Advanced SEO tools
- [ ] Multi-language support
- [ ] Plugin system
- [ ] WebSocket real-time collaboration

### Version History
- **v2.0.0** - Complete rewrite with modern stack
- **v1.5.0** - Added WhatsApp bot builder
- **v1.0.0** - Initial release with core features

---

**Built with ❤️ by the X-Coder Team**