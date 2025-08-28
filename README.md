# 🔐 Bona - Secure Creative Asset Management Platform

<div align="center">

![Bona Logo](public/professional-person-creative-director.png)

**Secure, collaborative file sharing and project management for creative teams**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green)](https://www.mongodb.com/)
[![AWS S3](https://img.shields.io/badge/AWS-S3-orange)](https://aws.amazon.com/s3/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com/)

[🚀 Live Demo](https://bona-platform.vercel.app) • [📖 Documentation](#documentation) • [🔧 Setup Guide](#quick-start)

</div>

---

## 🌟 Overview

Bona is a premium collaborative asset management platform designed specifically for creative teams, agencies, and design studios. Built with enterprise-grade security, zero-knowledge encryption, and an intuitive interface that puts creative workflow first.

### 🎯 Why Bona?

- **💰 Cost-Effective**: 50GB free tier vs. competitors charging $15+/user
- **🔒 Zero-Knowledge Security**: Your files, your keys, your control
- **⚡ Lightning Fast**: Direct AWS S3 integration with global CDN
- **🎨 Creative-First**: Built by creatives, for creatives
- **📱 Universal Access**: Works seamlessly across all devices

---

## ✨ Core Features

### 🛡️ **Enterprise Security**
- **Zero-knowledge encryption** for sensitive client assets
- **Role-based access control** (Owner/Admin/Member/Viewer)
- **Secret link invitations** for privacy-first collaboration
- **Audit logging** for compliance and accountability
- **SOC 2 Type II compliant** infrastructure

### 📁 **Advanced File Management**
- **Direct S3 uploads** with progress tracking and resume capability
- **Smart file organization** with tags, folders, and search
- **Version control** with automatic backup and history
- **Bulk operations** for efficient workflow management
- **Advanced previews** for 100+ file formats including:
  - Images (RAW, PSD, AI, SVG)
  - Videos (4K, HDR, professional codecs)
  - Documents (PDF, Office, InDesign, Figma)
  - 3D models and CAD files

### 👥 **Team Collaboration**
- **Real-time chat** with file attachments and mentions
- **Project workspaces** with customizable permissions
- **Activity feeds** to track all team actions
- **Comment system** on files and projects
- **@mentions and notifications** for seamless communication

### 🎨 **Creative Workflow Tools**
- **Asset libraries** for brand consistency
- **Approval workflows** for client reviews
- **Creative briefs** and project templates
- **Time tracking** and project analytics
- **Integration ready** for Adobe CC, Figma, and more

### 🚀 **Performance & Scale**
- **Global CDN** for worldwide access
- **Smart compression** without quality loss
- **Incremental sync** for large files
- **Bandwidth optimization** for remote teams
- **99.9% uptime SLA**

---

## 🛠️ Technology Stack

<table>
<tr>
<td><strong>Frontend</strong></td>
<td>Next.js 15, TypeScript, Tailwind CSS, Framer Motion</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>Next.js API Routes, Mongoose ODM, Zod Validation</td>
</tr>
<tr>
<td><strong>Database</strong></td>
<td>MongoDB Atlas (Production), Local MongoDB (Development)</td>
</tr>
<tr>
<td><strong>Storage</strong></td>
<td>AWS S3, CloudFront CDN, Presigned URLs</td>
</tr>
<tr>
<td><strong>Authentication</strong></td>
<td>Clerk Auth, Role-based Access Control</td>
</tr>
<tr>
<td><strong>UI/UX</strong></td>
<td>shadcn/ui, Radix UI, Lucide Icons</td>
</tr>
<tr>
<td><strong>Deployment</strong></td>
<td>Vercel, AWS Infrastructure</td>
</tr>
<tr>
<td><strong>Monitoring</strong></td>
<td>Vercel Analytics, Error Tracking</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- AWS S3 bucket
- Clerk account

### 1️⃣ Clone & Install
```bash
git clone https://github.com/srinathshrestha/Bona.git
cd Bona
npm install
```

### 2️⃣ Environment Setup
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
# Database
MONGODB_URI="mongodb://localhost:27017/bona" # or MongoDB Atlas

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-bucket-name"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3️⃣ Database Setup
```bash
# Start MongoDB locally (if using local instance)
mongod

# The app will automatically connect and create collections
```

### 4️⃣ AWS S3 Setup
```bash
# Configure CORS for your S3 bucket
node scripts/setup-s3-cors.js
```

### 5️⃣ Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and start building! 🎉

---

## 📊 Project Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                  # Authentication pages
│   │   ├── sign-in/             # Sign in page
│   │   └── sign-up/             # Sign up page
│   ├── admin/                   # Admin dashboard
│   │   └── testimonials/        # Testimonials management
│   ├── dashboard/               # Main application
│   │   ├── profile/             # User profile settings
│   │   └── projects/            # Project management
│   ├── join/[token]/           # Project invitation system
│   ├── testimonial/            # Public testimonial submission
│   ├── api/                    # API endpoints
│   │   ├── admin/              # Admin-only endpoints
│   │   ├── files/              # File management API
│   │   ├── invitations/        # Invitation system API
│   │   ├── projects/           # Project CRUD operations
│   │   ├── testimonials/       # Testimonials API
│   │   └── users/              # User management API
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   └── landing-page-content.tsx # Landing page content
├── components/                  # Reusable components
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx          # Button component
│   │   ├── card.tsx            # Card component
│   │   ├── dialog.tsx          # Modal dialog
│   │   ├── input.tsx           # Input component
│   │   ├── skeleton.tsx        # Loading skeleton
│   │   └── ...                 # Other UI components
│   ├── animated-elements.tsx   # Framer Motion animations
│   ├── dynamic-testimonials.tsx # Database testimonials
│   ├── file-upload-s3.tsx     # S3 file upload
│   ├── file-viewer.tsx        # File preview component
│   ├── project-chat.tsx       # Real-time chat
│   ├── project-file-manager.tsx # File management
│   ├── testimonial-form.tsx   # Testimonial submission
│   └── theme-provider.tsx     # Dark/light theme
├── lib/                        # Utilities and services
│   ├── models/                 # Database models
│   │   ├── user.model.ts       # User schema
│   │   ├── project.model.ts    # Project schema
│   │   ├── file.model.ts       # File schema
│   │   ├── testimonial.model.ts # Testimonial schema
│   │   └── ...                 # Other models
│   ├── services/               # Business logic
│   │   ├── user.service.ts     # User operations
│   │   ├── project.service.ts  # Project operations
│   │   ├── file.service.ts     # File operations
│   │   ├── testimonial.service.ts # Testimonial operations
│   │   └── ...                 # Other services
│   ├── database.ts             # Database connection
│   ├── mongodb.ts              # MongoDB utilities
│   ├── s3.ts                   # AWS S3 integration
│   └── utils.ts                # Helper functions
├── public/                     # Static assets
└── middleware.ts               # Next.js middleware
```

---

## 🔐 Security & Permissions

### Role-Based Access Control

| Permission | Owner | Admin | Member | Viewer |
|-----------|-------|-------|--------|--------|
| **Project Management** |
| Create Project | ✅ | ❌ | ❌ | ❌ |
| Delete Project | ✅ | ❌ | ❌ | ❌ |
| Edit Project Settings | ✅ | ✅ | ❌ | ❌ |
| Manage Invitations | ✅ | ✅ | ❌ | ❌ |
| **Member Management** |
| Invite Members | ✅ | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ |
| Change Roles | ✅ | ✅* | ❌ | ❌ |
| **File Operations** |
| View Files | ✅ | ✅ | ✅ | ✅ |
| Download Files | ✅ | ✅ | ✅ | ❌ |
| Upload Files | ✅ | ✅ | ✅ | ❌ |
| Delete Files | ✅ | ✅ | ❌ | ❌ |
| **Communication** |
| Send Messages | ✅ | ✅ | ✅ | ❌ |
| File Attachments | ✅ | ✅ | ✅ | ❌ |

*_Admins cannot modify other Admin roles_

### Security Features
- 🔐 **End-to-end encryption** for file transfers
- 🛡️ **CSRF protection** on all forms
- 🔒 **Secure session management** with Clerk
- 📝 **Audit logging** for all sensitive operations
- 🚫 **Rate limiting** on API endpoints
- ✅ **Input validation** with Zod schemas

---

## 🎨 User Experience

### Landing Page Features
- **Dynamic testimonials** from real users
- **Interactive animations** with Framer Motion
- **App preview** showcasing core features
- **Responsive design** for all devices
- **Dark/light mode** support

### Dashboard Features
- **Project overview** with real-time stats
- **File management** with drag-and-drop
- **Team collaboration** tools
- **Activity timeline** for project tracking
- **Search and filtering** capabilities

### Mobile Experience
- **Progressive Web App** (PWA) support
- **Touch-optimized** interface
- **Offline file access** (coming soon)
- **Native app feel** on mobile devices

---

## 📈 Roadmap & Future Plans

### 🎯 Phase 1: Core Platform (✅ Completed)
- [x] User authentication and authorization
- [x] Project creation and management
- [x] File upload and storage
- [x] Basic team collaboration
- [x] Testimonials system

### 🚀 Phase 2: Enhanced Collaboration (🔄 In Progress)
- [ ] Real-time collaborative editing
- [ ] Advanced commenting system
- [ ] Integration with design tools (Figma, Adobe CC)
- [ ] API for third-party integrations
- [ ] Mobile applications (iOS/Android)

### 🌟 Phase 3: Enterprise Features (📋 Planned)
- [ ] Advanced analytics and reporting
- [ ] Custom branding for teams
- [ ] Single Sign-On (SSO) integration
- [ ] Advanced security features
- [ ] Workflow automation
- [ ] AI-powered asset organization

### 🔮 Phase 4: AI Integration (🔮 Future)
- [ ] Intelligent file tagging
- [ ] Content recommendations
- [ ] Automated quality checks
- [ ] Smart collaboration suggestions
- [ ] Predictive project insights

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow our coding standards and commit conventions
4. Add tests for new features
5. Submit a pull request

### Coding Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Commit message format

### Areas for Contribution
- 🐛 **Bug fixes** and performance improvements
- ✨ **New features** and enhancements
- 📚 **Documentation** improvements
- 🧪 **Testing** and quality assurance
- 🌐 **Internationalization** (i18n)
- 🎨 **UI/UX** improvements

---

## 📞 Support & Community

### Get Help
- 📧 **Email**: support@bona-platform.com
- 💬 **Discord**: [Join our community](https://discord.gg/bona)
- 📖 **Documentation**: [docs.bona-platform.com](https://docs.bona-platform.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/srinathshrestha/Bona/issues)

### Stay Updated
- 🐦 **Twitter**: [@BonaplatForm](https://twitter.com/bonaplatform)
- 📱 **Product Hunt**: [Follow our launch](https://producthunt.com/@bona)
- 📰 **Blog**: [blog.bona-platform.com](https://blog.bona-platform.com)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** for the incredible framework
- **Vercel** for seamless deployment
- **shadcn** for beautiful UI components
- **Clerk** for authentication services
- **MongoDB** for reliable database solutions
- **AWS** for scalable cloud infrastructure

---

<div align="center">

**Built with ❤️ by creative teams, for creative teams**

[⭐ Star us on GitHub](https://github.com/srinathshrestha/Bona) • [🚀 Try Bona Today](https://bona-platform.vercel.app)

</div>