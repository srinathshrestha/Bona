# Bona - Collaborative Media Asset Management

A secure, real-time collaboration platform for creative teams to share, manage, and collaborate on media assets.

## Features

- **Secret Link Invitations** - Privacy-first project invitations
- **Role-Based Permissions** - Owner/Admin/Member/Viewer access control
- **Direct S3 Uploads** - Fast, scalable file handling
- **Real-Time Chat** - Team communication with file sharing
- **File Previews** - Image, video, and document previews
- **Mobile Responsive** - Works on all devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk
- **Storage**: AWS S3
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Server-Sent Events
- **Email**: Mailgun

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd bona
npm install

# Setup environment
cp .env.example .env.local
# Fill in your credentials

# Database setup
npx prisma migrate dev
npx prisma generate

# Run development server
npm run dev
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# AWS S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="bona-assets"

# Mailgun
MAILGUN_API_KEY="..."
MAILGUN_DOMAIN="..."
```

## Project Structure

```
src/
├── app/
│   ├── dashboard/          # Main app
│   ├── join/[token]/       # Invitation acceptance
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn components
│   └── ...                 # Custom components
├── lib/
│   ├── database.ts         # Database services
│   ├── s3.ts              # File upload logic
│   └── utils.ts           # Utilities
└── prisma/
    └── schema.prisma       # Database schema
```

## Permission Matrix

| Role | View | Download | Upload | Delete | Chat | Manage |
|------|------|----------|--------|--------|------|--------|
| Owner | ✅   | ✅       | ✅     | ✅     | ✅    | ✅.    |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Member | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Viewer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

*Admin can't remove other admins

## Key Features

### Invitation System
- One secret link per project
- Owner controls admissions (open/close)
- New users auto-register and join
- Default MEMBER role on join

### File Management
- Direct S3 uploads with progress tracking
- Role-based download permissions
- Automatic thumbnail generation
- File access logging

### Real-Time Features
- Live chat with file attachments
- Member activity notifications
- Role change updates
- Upload progress updates

## Development

```bash
# Database commands
npm run db:migrate     # Run migrations
npm run db:reset       # Reset database
npm run db:studio      # Open Prisma Studio

# Build commands
npm run build          # Production build
npm run start          # Start production server
npm run lint           # Run ESLint
```

## Deployment

1. Deploy to Vercel/Railway/etc.
2. Set environment variables
3. Run database migrations
4. Configure S3 bucket CORS
5. Set up Mailgun domain

## Contributing

1. Fork the repo
2. Create feature branch
3. Make changes
4. Run tests
5. Submit PR

## License

MIT