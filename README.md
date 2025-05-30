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

### Production Deployment

## 🚀 CI/CD Pipeline / צינור אינטגרציה ופריסה רציפה

HelpSavta includes a comprehensive GitHub Actions CI/CD pipeline that automates testing, building, and deployment processes. **Latest Update: Pipeline completely redesigned based on debug analysis (2025-05-30).**

### 📋 Pipeline Overview - REDESIGNED

#### 1. **Continuous Integration (CI)** - Pull Request Triggers
The CI pipeline ([`ci.yml`](.github/workflows/ci.yml)) runs automatically on pull requests to the main branch:

- ✅ **ALL Tests Execution** - Frontend (`npm run test:run`) and backend (`npm run test`) tests
- ✅ **Code Quality Checks** - ESLint validation and TypeScript compilation
- ✅ **Build Verification** - Both frontend and backend build processes
- ✅ **Artifact Generation** - Saves build artifacts for deployment stage
- ✅ **PR Approval Gate** - Tests MUST pass before PR can be approved

#### 2. **Production Deployment (CD)** - Main Branch Only
The deployment pipeline ([`deploy.yml`](.github/workflows/deploy.yml)) triggers on successful merges to main:

- ⏳ **CI Dependency** - Waits for CI completion before proceeding
- 📦 **Artifact Reuse** - Downloads and uses pre-built artifacts from CI
- 🔨 **Docker Build & Push** - Container images to Azure Container Registry
- 🎯 **Production Deployment** - Direct deploy to Azure App Service production
- 🔍 **Health Checks** - Comprehensive deployment verification
- ✅ **Deployment Verification** - API endpoint testing and health validation

#### 3. **Standalone Test Suite** - Manual & Reusable Testing
The test suite (`test.yml`) provides comprehensive testing capabilities:

- 🧪 **Backend Unit Tests** - Jest with PostgreSQL integration
- 🎨 **Frontend Component Tests** - Vitest with coverage reporting
- 🔗 **Integration Tests** - Full application testing
- 📊 **Performance Tests** - Lighthouse audits and load testing

### ✅ GitHub Secrets Configuration - COMPLETED

**All required GitHub secrets have been successfully configured (2025-05-30T11:04:28Z):**

```bash
# Azure Configuration ✅ CONFIGURED
AZURE_CREDENTIALS - Service principal authentication (JSON format)
AZURE_SUBSCRIPTION_ID - Azure subscription identifier
AZURE_CONTAINER_REGISTRY - Container registry URL
AZURE_CONTAINER_REGISTRY_USERNAME - Registry authentication username
AZURE_CONTAINER_REGISTRY_PASSWORD - Registry authentication password

# Database URLs ✅ CONFIGURED
STAGING_DATABASE_URL - PostgreSQL staging database connection
PRODUCTION_DATABASE_URL - PostgreSQL production database connection
```

### 🎯 Deployment Pipeline Status

✅ **Ready for Deployment**: All secrets validated and CI/CD pipeline operational
- Secrets configured and verified via GitHub CLI
- Workflows tested and ready for automated deployments
- Azure infrastructure automation prepared

### 🏗️ Workflow Details

#### CI Workflow Features:
- **Matrix Strategy** - Tests across multiple Node.js versions
- **Parallel Execution** - Backend and frontend tests run simultaneously
- **Dependency Caching** - Faster builds with npm cache
- **Coverage Reports** - Codecov integration for test coverage
- **Security Scanning** - Trivy and CodeQL for vulnerability detection

#### CD Workflow Features:
- **Blue-Green Deployment** - Zero-downtime deployments via slot swapping
- **Database Migrations** - Automatic Prisma migrations
- **Rollback Mechanism** - Automatic rollback on deployment failure
- **Environment Promotion** - Staging → Production workflow
- **Release Management** - Automatic GitHub releases for production deployments

### 🚦 Manual Deployment Triggers

You can trigger deployments manually using workflow dispatch:

```bash
# Trigger staging deployment
gh workflow run deploy.yml -f environment=staging

# Trigger production deployment
gh workflow run deploy.yml -f environment=production -f force_deploy=true

# Run comprehensive test suite
gh workflow run test.yml -f test-type=all
```

### 📊 Monitoring & Notifications

The pipeline includes comprehensive monitoring:

- **GitHub Actions Summary** - Detailed test results and metrics
- **Deployment Comments** - Automatic commit comments with deployment status
- **GitHub Releases** - Automatic releases for successful production deployments
- **Slack/Teams Integration** - (Configure webhook URLs for team notifications)

#### Database Migration (SQLite to PostgreSQL)
For production deployment, migrate from SQLite to PostgreSQL:

```bash
# Production database setup
cd backend
npm run db:migrate:postgresql

# Update environment variables for PostgreSQL
DATABASE_URL="postgresql://username:password@host:5432/database"
```

#### Docker Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.production.yml build

# Deploy with production configuration
docker-compose -f docker-compose.production.yml up -d
```

#### Azure Deployment
Azure infrastructure setup includes:
- **Azure App Service** - Backend API hosting with KeyVault integration
- **Azure PostgreSQL** - Production database
- **Azure Key Vault** - Secure secrets management for SendGrid API keys
- **Application Insights** - Monitoring

**✅ KeyVault Integration Complete:**
```bash
# Setup SendGrid API key and production secrets in Azure KeyVault
cd scripts
./update-sendgrid-keyvault.sh

# This script will:
# - Store SendGrid API key securely in KeyVault
# - Configure email settings (host, port, user)
# - Generate secure session secrets and admin credentials
# - Update App Service to use KeyVault references
```

Production environment variables use KeyVault references:
```env
SENDGRID_API_KEY="@Microsoft.KeyVault(SecretUri=https://helpsavta-production-kv.vault.azure.net/secrets/sendgrid-api-key/)"
EMAIL_FROM="@Microsoft.KeyVault(SecretUri=https://helpsavta-production-kv.vault.azure.net/secrets/email-from/)"
SESSION_SECRET="@Microsoft.KeyVault(SecretUri=https://helpsavta-production-kv.vault.azure.net/secrets/session-secret/)"
```

## 🧪 Testing / בדיקות

### SendGrid Email Testing
```bash
# Test SendGrid configuration and email delivery
cd backend
npm run test:sendgrid-standalone your-email@example.com

# Test specific email types
npm run test:sendgrid-standalone your-email@example.com simple
npm run test:sendgrid-standalone your-email@example.com template
npm run test:sendgrid-standalone your-email@example.com both
```

**Note:** Before testing emails, you need to:
1. Set up SendGrid account and get API key
2. Update `SENDGRID_API_KEY` in `backend/.env`
3. See [`SENDGRID_SETUP_INSTRUCTIONS.md`](SENDGRID_SETUP_INSTRUCTIONS.md) for complete setup guide

### Integration Testing
```bash
# Run full integration test suite
./test-integration.sh

# Test admin-specific features
./test-admin-features.sh

# Manual health check
curl http://localhost:3001/health
```

### Manual Testing Checklist
- [ ] Home page loads with Hebrew content
- [ ] Help request form submission works
- [ ] Time slot selection functions
- [ ] Admin login and authentication
- [ ] Dashboard displays statistics
- [ ] Request management (view, edit, filter)
- [ ] Time slot management
- [ ] Email notifications (if configured)
- [ ] Mobile responsiveness
- [ ] Browser compatibility

## 📊 Current Status / סטטוס נוכחי

**Production Ready: ✅ CI/CD Pipeline Completely Redesigned and Fixed**

The HelpSavta application is fully functional and ready for production deployment. **Latest Critical Updates:**
- ✅ **CI/CD Pipeline Completely Redesigned** - Based on comprehensive debug analysis (2025-05-30T23:32)
  - ALL tests now execute in CI (frontend + backend)
  - Artifact-based deployment (no rebuilding in deploy stage)
  - Mandatory test gates for PR approval
  - Production-only deployment (staging environment removed)
  - Comprehensive health checks and deployment verification
- ✅ **Database Configuration Fixed** - Uses `DATABASE_URL_PRODUCTION` for proper environment separation
- ✅ **Test Execution Enhanced** - Frontend: `npm run test:run`, Backend: `npm run test`
- ✅ **Sequential Pipeline** - Deploy waits for CI completion before proceeding
- ✅ **GitHub Secrets Configuration Complete** - All 7 required deployment secrets configured (2025-05-30T11:04:28Z)
- ✅ **Email RTL Alignment Fixed** - Hebrew text now properly right-aligned in all email templates
- ✅ **Azure KeyVault Integration Complete** - Secure production API key storage configured

**🚀 Deployment Status**: CI/CD pipeline completely redesigned based on debug findings, all critical issues resolved, ready for production deployment.

All core features have been implemented and tested. For detailed project status, completion metrics, and technical achievements, see [`project_status.md`](project_status.md).

## 🤝 Contributing / תרומה

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly (run integration tests)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📞 Support / תמיכה

For support, questions, or feature requests:
- **Issues**: Create an issue in the repository
- **Current Status**: Check [`project_status.md`](project_status.md) for system metrics and known issues
- **Email Setup**: See [`SENDGRID_SETUP_INSTRUCTIONS.md`](SENDGRID_SETUP_INSTRUCTIONS.md) for complete SendGrid configuration guide
- **Email System**: SendGrid integration with Hebrew RTL templates (✅ RTL alignment fixed), SMTP fallback, and Azure KeyVault production configuration

## 📄 License / רישיון

MIT License - see LICENSE file for details

---

**Made with ❤️ for the volunteer community / נוצר באהבה עבור קהילת המתנדבים**

*הפרויקט מיועד לסייע לאוכלוסיית הגיל השלישי לקבל עזרה טכנית באמצעות מתנדבים מסורים*

<!-- CI/CD Pipeline Test - 2025-05-30 18:23 --># GitHub Secrets Configuration Fixed - Fri May 30 23:37:49 IDT 2025
