# Tech Help 4U - Backend

Backend API for the Technical Help Volunteer Platform (עזרה טכנית בהתנדבות) - a platform connecting elderly people with technical assistance volunteers.

## 🏗️ Architecture

- **Framework**: Node.js with Express.js
- **Database**: SQLite with Prisma ORM
- **Language**: TypeScript
- **Authentication**: Session-based authentication
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment template and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (the defaults work for development).

### 3. Database Setup

Initialize the database and generate Prisma client:

```bash
# Generate Prisma client
npm run db:generate

# Create and migrate database
npm run db:push

# Seed database with default data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Public Endpoints
- `POST /api/requests` - Submit new tech help request
- `GET /api/slots/available` - Get available time slots

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Get current admin user
- `GET /api/auth/status` - Check authentication status

### Requests Management
- `GET /api/requests` - Get all requests (with filters)
- `GET /api/requests/:id` - Get specific request
- `PUT /api/requests/:id` - Update request status
- `DELETE /api/requests/:id` - Delete request

### Slots Management
- `GET /api/slots` - Get all slots (with filters)
- `POST /api/slots` - Create new slot (Admin only)
- `PUT /api/slots/:id/book` - Book a slot for a request
- `DELETE /api/slots/:id` - Delete slot (Admin only)

### Admin Panel
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/requests` - Admin view of all requests
- `POST /api/admin/slots/bulk` - Create multiple slots
- `GET /api/admin/notifications` - Notification logs
- `POST /api/admin/create-admin` - Create new admin user

## 🗄️ Database Schema

### TechRequest
- `id` - Auto-increment primary key
- `full_name` - Full name of requester
- `phone` - Phone number
- `address` - Full address
- `problem_description` - Description of technical issue
- `urgency_level` - Priority level (low, medium, high, urgent)
- `status` - Current status (pending, scheduled, in_progress, completed, cancelled)
- `scheduled_date` - Scheduled visit date
- `scheduled_time` - Scheduled visit time
- `notes` - Additional notes
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### AvailableSlot
- `id` - Auto-increment primary key
- `date` - Available date (YYYY-MM-DD)
- `start_time` - Start time (HH:MM)
- `end_time` - End time (HH:MM)
- `is_booked` - Whether slot is booked
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### AdminUser
- `id` - Auto-increment primary key
- `username` - Unique username
- `password_hash` - Encrypted password
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### NotificationLog
- `id` - Auto-increment primary key
- `type` - Notification type (sms, email, whatsapp)
- `recipient` - Notification recipient
- `message` - Notification message
- `sent_at` - Send timestamp
- `status` - Send status (pending, sent, failed)

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: API rate limiting to prevent abuse
- **Session Security**: Secure session configuration
- **Password Hashing**: bcrypt for password security
- **Input Validation**: Joi for request validation
- **SQL Injection Protection**: Prisma ORM prevents SQL injection

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Database
npm run db:generate # Generate Prisma client
npm run db:push     # Push schema to database
npm run db:migrate  # Create migration
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed database with default data
```

## 🌍 Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001
NODE_ENV=development

# Security
SESSION_SECRET=your-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=http://localhost:3000

# Default Admin
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "הודעה בעברית",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "message": "הודעת שגיאה בעברית"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## 🚨 Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Input validation with Hebrew error messages
- **Authentication Errors**: Session-based authentication
- **Database Errors**: Prisma error handling
- **Rate Limiting**: Automatic throttling
- **Global Error Handler**: Catches and formats all errors

## 🧪 Default Admin Account

After seeding the database:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: Change the default admin credentials in production!

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # (Future) Route controllers
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   ├── validation.ts # Input validation
│   │   └── errorHandler.ts # Error handling
│   ├── routes/          # API routes
│   │   ├── admin.ts     # Admin routes
│   │   ├── auth.ts      # Authentication routes
│   │   ├── requests.ts  # Request management
│   │   └── slots.ts     # Slot management
│   ├── services/        # (Future) Business logic
│   ├── utils/           # (Future) Utility functions
│   └── server.ts        # Main server file
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Database seeding
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## 🔄 Next Steps

1. Install dependencies: `npm install`
2. Set up database: `npm run db:push`
3. Seed database: `npm run db:seed`
4. Start development: `npm run dev`
5. Test API endpoints at `http://localhost:3001`

## 🤝 Contributing

1. Follow TypeScript best practices
2. Maintain Hebrew language support
3. Include comprehensive error handling
4. Write clear documentation
5. Test all endpoints thoroughly

## 📞 Support

For technical support with this backend implementation, refer to the API documentation or check the error logs.

---

**Built with ❤️ for the volunteer community**