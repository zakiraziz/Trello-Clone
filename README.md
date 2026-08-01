# Trello SaaS - Production-Ready Project Management

A fully-featured, production-ready Trello-like SaaS application built with modern technologies.

## Features

### Core Features
- **User Authentication**: Registration, login, password reset with refresh token rotation
- **Board Management**: Create, edit, archive, delete boards with real-time updates
- **List Management**: Add, edit, reorder, archive lists within boards
- **Card Management**: Full CRUD operations with detailed card views
- **Comments**: Add, edit, delete comments on cards
- **Checklists**: Create checklists with progress tracking
- **Labels**: Color-coded labels for organization
- **Due Dates**: Set and track due dates
- **Search**: Global search across boards, cards, comments, and users
- **Notifications**: Real-time in-app notifications with email preferences
- **Real-time Collaboration**: Socket.io-powered live updates

### Advanced Features
- **Admin Dashboard**: User management, activity logs, audit logs, email queue monitoring
- **Profile Management**: Edit profile, avatar upload, account settings
- **Settings**: Theme, language, timezone, notification preferences
- **Password Reset**: Secure password reset flow
- **Email Queue**: Reliable email delivery with retry logic
- **Audit Logging**: Comprehensive activity tracking
- **Rate Limiting**: Three-tier rate limiting for security
- **Health Checks**: /health, /health/ready, /health/live endpoints

### Security
- JWT authentication with refresh token rotation
- Role-based authorization (admin, user, pro tier)
- CSRF protection
- Content Security Policy (CSP)
- Secure file upload validation
- Input sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- Helmet security headers
- CORS configuration
- Environment validation

### Performance
- React Query for efficient data fetching and caching
- Debounced search
- Throttled event handlers
- API response caching
- Lazy loading
- Code splitting
- Optimized database queries
- Compression middleware
- Static asset caching

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- Socket.io for real-time communication
- JWT authentication
- Stripe for payments
- SendGrid/Resend/SMTP for emails
- Jest for testing

### Frontend
- React 18 with TypeScript
- TanStack Query (React Query)
- Socket.io client
- Tailwind CSS
- Shadcn/ui components
- React Router
- Sonner for toast notifications
- date-fns for date formatting

### Infrastructure
- Docker & Docker Compose
- Nginx reverse proxy
- Multi-stage builds
- Health checks
- SSL/TLS support

## Project Structure

```
trello-saas/
├── Backend/
│   ├── src/
│   │   ├── app.js                 # Express app configuration
│   │   ├── db/
│   │   │   └── pool.js           # Database connection pool
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT authentication
│   │   │   ├── adminAuth.js      # Admin authorization
│   │   │   ├── rateLimiter.js    # Rate limiting
│   │   │   ├── sanitize.js       # Input sanitization
│   │   │   ├── validation.js     # Request validation
│   │   │   └── security.js       # CSP, CSRF, file upload
│   │   ├── models/
│   │   │   ├── Board.js
│   │   │   ├── List.js
│   │   │   ├── Card.js
│   │   │   └── AuditLog.js
│   │   ├── routes/
│   │   │   ├── auth.js           # Authentication routes
│   │   │   ├── boards.js         # Board CRUD
│   │   │   ├── lists.js          # List CRUD
│   │   │   ├── cards.js          # Card CRUD
│   │   │   ├── users.js          # User management
│   │   │   ├── search.js         # Search functionality
│   │   │   ├── notifications.js  # Notifications
│   │   │   ├── admin.js          # Admin routes
│   │   │   ├── audit.js          # Audit logs
│   │   │   ├── email.js          # Email management
│   │   │   ├── webhook.js        # Stripe webhooks
│   │   │   └── health.js         # Health checks
│   │   ├── services/
│   │   │   ├── emailQueue.js     # Email queue processing
│   │   │   └── redis.js          # Redis caching
│   │   ├── sockets/
│   │   │   └── index.js          # Socket.io setup
│   │   └── utils/
│   │       └── logger.js         # Logging utility
│   └── __tests__/                 # API tests
├── Frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/             # Authentication pages
│   │   │   ├── boards/           # Board pages & components
│   │   │   ├── cards/            # Card components & modal
│   │   │   ├── notifications/    # Notification system
│   │   │   ├── admin/            # Admin dashboard
│   │   │   ├── profile/          # Profile page
│   │   │   ├── settings/         # Settings page
│   │   │   └── pages/            # Search, info pages
│   │   ├── components/
│   │   │   └── ui/               # Reusable UI components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── providers/            # Context providers
│   │   ├── lib/                  # Utilities
│   │   └── App.tsx               # Main app component
│   └── public/                   # Static assets
├── Database/
│   └── migrations/               # SQL migrations
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Docker Compose config
├── nginx.conf                    # Nginx configuration
└── .dockerignore                 # Docker ignore file
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trello-saas
```

2. Install dependencies:
```bash
# Backend
cd Backend
npm install

# Frontend
cd ../Frontend
npm install
```

3. Set up environment variables:
```bash
# Backend
cp Backend/.env.example Backend/.env
# Edit Backend/.env with your configuration

# Frontend
cp Frontend/.env.example Frontend/.env
# Edit Frontend/.env with your configuration
```

4. Set up the database:
```bash
# Run migrations
psql -U postgres -d your_database -f Database/migrations/002_create_tables.sql
psql -U postgres -d your_database -f Database/migrations/001_optimize_indexes.sql
```

5. Start the development servers:
```bash
# Backend (from Backend directory)
npm run dev

# Frontend (from Frontend directory)
npm run dev
```

## Docker Deployment

### Quick Start with Docker Compose

1. Set environment variables in `.env` file:
```env
DATABASE_URL=postgresql://user:pass@db:5432/trello
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=https://yourdomain.com
# ... other required variables
```

2. Start the application:
```bash
docker-compose up -d
```

3. Run database migrations:
```bash
docker-compose exec backend psql -U postgres -d trello -f /app/Database/migrations/002_create_tables.sql
```

4. Access the application:
- Frontend: https://yourdomain.com
- Backend API: https://yourdomain.com/api
- Health check: https://yourdomain.com/health

### Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production deployment instructions.

## Testing

### Backend Tests
```bash
cd Backend
npm test
```

### Frontend Tests
```bash
cd Frontend
npm test
```

### E2E Tests
```bash
# Install Playwright
npm install -D @playwright/test

# Run tests
npx playwright test
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Board Endpoints
- `GET /api/boards` - Get all boards
- `POST /api/boards` - Create board
- `GET /api/boards/:id` - Get board by ID
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/archive` - Archive board

### List Endpoints
- `GET /api/boards/:boardId/lists` - Get all lists
- `POST /api/boards/:boardId/lists` - Create list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list
- `POST /api/lists/:id/archive` - Archive list

### Card Endpoints
- `GET /api/cards/:id` - Get card by ID
- `POST /api/cards` - Create card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `POST /api/cards/:id/comments` - Add comment
- `GET /api/cards/:id/comments` - Get comments
- `DELETE /api/cards/:id/comments/:commentId` - Delete comment
- `POST /api/cards/:id/checklists` - Add checklist
- `PUT /api/cards/:id/checklists/:checklistId/items/:itemId` - Toggle checklist item

### User Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update settings
- `GET /api/users/notification-settings` - Get notification settings
- `PUT /api/users/notification-settings` - Update notification settings

### Search Endpoints
- `GET /api/search?q=query` - Global search

### Notification Endpoints
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Admin Endpoints
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/activities` - Get activity logs
- `GET /api/audit/logs` - Get audit logs
- `GET /api/email/status` - Get email queue status

### Health Check Endpoints
- `GET /api/health` - Health check
- `GET /api/health/ready` - Readiness check
- `GET /api/health/live` - Liveness check

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/trello
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
CORS_ORIGIN=https://yourdomain.com
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook
FRONTEND_URL=https://yourdomain.com
```

### Frontend (.env)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
```

## Security Features

- JWT authentication with refresh token rotation
- Role-based access control
- CSRF protection
- Content Security Policy (CSP)
- Secure file upload validation
- Input sanitization
- SQL injection prevention
- XSS protection
- Rate limiting (global, auth, API)
- Helmet security headers
- CORS configuration
- Environment variable validation
- Secure cookie configuration
- Password hashing with bcrypt

## Performance Features

- React Query for efficient data fetching
- Debounced search inputs
- Throttled event handlers
- API response caching
- Lazy loading of components
- Code splitting
- Optimized database queries
- Database connection pooling
- Compression middleware
- Static asset caching
- Image optimization
- Bundle size optimization

## Monitoring & Logging

- Structured logging with Winston
- Health check endpoints
- Performance metrics
- Error tracking
- Audit logging
- Email queue monitoring
- Database connection monitoring
- Memory usage tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT

## Support

For support, email support@yourdomain.com or create an issue in the repository.