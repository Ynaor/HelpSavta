# עזרה טכנית בהתנדבות - Help-Savta (HelpSavta)

## Project Overview / סקירת הפרויקט

**עברית:**
מערכת מקוונת מקיפה לניהול שירות התנדבותי לעזרה טכנית לאוכלוסיית הגיל השלישי. המערכת מאפשרת לאזרחים ותיקים לבקש עזרה טכנית באמצעות טופס נגיש וידידותי, ולמתנדבים לנהל בקשות ולתזמן ביקורי עזרה בצורה יעילה ומקצועית.

**English:**
A comprehensive online system for managing volunteer technical help services for elderly citizens. The system enables senior citizens to request technical assistance through an accessible, user-friendly form, while allowing volunteers to efficiently manage requests and schedule help visits in a professional manner.

## 🌟 Key Features / תכונות מרכזיות

### 👥 Public User Features / תכונות למשתמש הציבור
- **🏠 Home Page** - Welcome interface with clear service overview (עמוד בית עם הסבר ברור על השירות)
- **📝 Help Request Form** - Simple, accessible form with Hebrew RTL support (טופס בקשת עזרה פשוט ונגיש)
  - Personal information collection (שם, טלפון, כתובת)
  - Detailed problem description (תיאור מפורט של הבעיה)
  - Urgency level selection (בחירת רמת דחיפות: נמוכה/בינונית/גבוהה/דחוף)
  - Additional notes field (שדה הערות נוסף)
- **⏰ Time Slot Selection** - Interactive calendar with available appointment times (בחירת זמן עם לוח זמנים אינטראקטיבי)
- **✅ Confirmation Process** - Request summary and submission confirmation (סיכום הבקשה ואישור שליחה)

### 🔧 Admin Features / תכונות מנהל
- **📊 Comprehensive Dashboard** - Statistics overview and recent activity (לוח בקרה עם סטטיסטיקות וסקירת פעילות)
- **📋 Request Management** - View, edit, filter, and search all requests (ניהול בקשות - צפייה, עריכה, סינון וחיפוש)
  - Status updates and assignment tracking (עדכון סטטוס ומעקב הקצאות)
  - Urgency-based filtering and color coding (סינון לפי דחיפות וקידוד צבעים)
  - Admin assignment and notes system (הקצאת מנהלים ומערכת הערות)
- **🕐 Time Slot Management** - Create and manage available appointment slots (ניהול שעות זמינות)
  - Individual and bulk slot creation (יצירת שעות בודדות ובכמות)
  - Calendar view and conflict detection (תצוגת לוח שנה וזיהוי התנגשויות)
- **👨‍💼 Admin User Management** - Secure authentication and multi-admin support (ניהול משתמשי מנהל ואימות מאובטח)
- **📧 Email Notifications** - Automated approval emails when requests are scheduled (התראות אימייל אוטומטיות)

## 🏗️ Technology Stack / מחסנית טכנולוגית

### Backend
- **Node.js + Express.js** - Modern server framework
- **TypeScript** - Type-safe development
- **Prisma ORM** - Database management with SQLite/PostgreSQL support
- **bcryptjs** - Secure password hashing
- **express-session** - Session management
- **Joi** - Comprehensive data validation
- **NodeMailer** - Email notifications
- **Helmet** - Security middleware

### Frontend
- **React 18 + TypeScript** - Modern UI development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Efficient form handling
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing
- **Lucide React** - Modern icon library

## 🚀 Quick Start / התחלה מהירה

### Prerequisites / דרישות מקדימות
- Node.js 18+
- npm or yarn

### Installation / התקנה

1. **Clone the repository / שכפל את הריפוזיטורי:**
```bash
git clone <repository-url>
cd HelpSavta
```

2. **One-command setup / הגדרה בפקודה אחת:**
```bash
./start.sh
```

**OR manual setup / או הגדרה ידנית:**

```bash
# Install dependencies / התקן תלויות
npm install
cd backend && npm install
cd ../frontend && npm install && cd ..

# Setup database / הגדר מסד נתונים
cd backend
npm run db:generate
npm run db:push
npm run db:seed
cd ..

# Start development servers / הפעל שרתי פיתוח
npm run dev
```

This will start:
- **Backend API:** http://localhost:3001
- **Frontend App:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin/login

### Default Admin Credentials / פרטי מנהל ברירת מחדל
- **Username / שם משתמש:** `[Configure in backend/.env]`
- **Password / סיסמה:** `[Configure in backend/.env]`

⚠️ **Important: Change these credentials before production deployment!**

## 📁 Project Structure / מבנה הפרויקט

```
HelpSavta/
├── backend/                     # Backend server
│   ├── src/
│   │   ├── middleware/          # Express middleware (auth, validation, error handling)
│   │   ├── routes/             # API routes (admin, auth, requests, slots)
│   │   ├── services/           # Business logic (email service)
│   │   └── server.ts           # Main server file
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts            # Database seeding
│   └── package.json
├── frontend/                    # Frontend React app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page components (Home, RequestHelp, Admin)
│   │   ├── services/          # API services
│   │   └── types/             # TypeScript type definitions
│   └── package.json
├── README.md                    # This file
├── project_status.md           # Current development status for coding agents
├── start.sh                    # Development setup script
├── docker-compose.yml          # Docker development environment
├── docker-compose.production.yml # Docker production environment
└── package.json               # Root package.json
```

## 🔗 API Endpoints / נקודות קצה API

### Public Endpoints
- `GET /health` - Health check
- `GET /api/slots/available` - Get available time slots
- `POST /api/requests` - Create help request

### Admin Endpoints (Protected)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/requests` - Get all requests with filtering
- `PUT /api/admin/requests/:id` - Update request fields
- `POST /api/admin/requests/:id/take` - Assign request to admin
- `GET /api/admin/slots` - Manage time slots
- `POST /api/admin/slots/bulk` - Create multiple time slots

## 🔐 Security Features / תכונות אבטחה

- **Password Security** - bcrypt hashing with salt
- **Session Management** - Secure session-based authentication
- **Input Validation** - Comprehensive Joi validation schemas
- **CORS Protection** - Cross-origin request security
- **Rate Limiting** - API abuse prevention
- **XSS Protection** - Helmet security headers
- **SQL Injection Prevention** - Prisma ORM parameterized queries

## ♿ Accessibility Features / תכונות נגישות

- **RTL Support** - Complete Hebrew right-to-left layout
- **Elderly-Friendly Design** - Large fonts and high contrast colors
- **Keyboard Navigation** - Full keyboard accessibility
- **Screen Reader Support** - Semantic HTML and ARIA labels
- **Mobile-First Design** - Responsive design for all devices
- **Large Click Targets** - Easy interaction for elderly users

## 🌐 Browser Support / תמיכה בדפדפנים

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Development Scripts / סקריפטי פיתוח

### Root Level
```bash
npm run dev          # Start both backend and frontend
npm run build        # Build both projects
npm run health       # Check application health
./start.sh           # One-command development setup
./test-integration.sh # Run integration tests
```

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with initial data
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🌍 Basic Deployment / פריסה בסיסית

### Environment Variables / משתני סביבה
Create `backend/.env`:
```env
DATABASE_URL="file:./dev.db"
NODE_ENV=development
PORT=3001
SESSION_SECRET=your-very-long-random-secret-key
FRONTEND_URL=http://localhost:5173
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-this-password

# SendGrid Email Configuration (Recommended)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
EMAIL_FROM=noreply@helpsavta.com
EMAIL_FROM_NAME=Help Savta
EMAIL_REPLY_TO=support@helpsavta.com
SUPPORT_EMAIL=support@helpsavta.com

# SMTP Fallback Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🤝 Contributing / תרומה

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (run integration tests)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request


## 📄 License / רישיון

MIT License - see LICENSE file for details

---

**Made with ❤️ for the volunteer community / נוצר באהבה עבור קהילת המתנדבים**

*הפרויקט מיועד לסייע לאוכלוסיית הגיל השלישי לקבל עזרה טכנית באמצעות מתנדבים מסורים*

<!-- CI/CD Pipeline Test - 2025-05-30 18:23 --># GitHub Secrets Configuration Fixed - Fri May 30 23:37:49 IDT 2025
