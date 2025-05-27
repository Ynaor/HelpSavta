# עזרה טכנית בהתנדבות - TechHelp4U

## Project Overview / סקירת הפרויקט

**עברית:**
מערכת מקוונת לניהול שירות התנדבותי לעזרה טכנית לאוכלוסיית הגיל השלישי. המערכת מאפשרת לאזרחים ותיקים לבקש עזרה טכנית באמצעות טופס פשוט, ולמתנדבים לנהל את הבקשות ולתזמן ביקורי עזרה.

**English:**
An online system for managing volunteer technical help services for elderly population. The system allows senior citizens to request technical help through a simple form, and volunteers to manage requests and schedule help visits.

## Features / תכונות

### Public Features / תכונות ציבוריות
- **בקשת עזרה פשוטה** - טופס נגיש וידידותי לקשישים
- **בחירת זמן נוח** - מערכת תזמון גמישה עם שעות זמינות
- **תמיכה בעברית** - ממשק מותאם לעברית עם RTL
- **עיצוב רספונסיבי** - תמיכה במכשירים ניידים

### Admin Features / תכונות מנהל
- **לוח בקרה מקיף** - סטטיסטיקות וסקירה כללית
- **ניהול בקשות** - צפייה, עדכון וחיפוש בקשות
- **ניהול שעות זמינות** - יצירה ועריכה של שעות פנויות
- **יצירה בכמות** - הוספת מספר שעות פנויות בבת אחת
- **אימות והרשאות** - מערכת התחברות מאובטחת

## Technology Stack / מחסנית טכנולוגית

### Backend
- **Node.js** with **Express.js** - Server framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **SQLite** - Database (development)
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **Joi** - Data validation
- **Helmet** - Security middleware

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **Lucide React** - Icon library

## Project Structure / מבנה הפרויקט

```
techhelp4u/
├── backend/                    # Backend server
│   ├── src/
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/            # API routes
│   │   └── server.ts          # Main server file
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts           # Database seeding
│   └── package.json
├── frontend/                   # Frontend React app
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── types/            # TypeScript types
│   └── package.json
├── README.md                   # This file
├── DEPLOYMENT.md              # Deployment guide
├── FEATURES.md               # Detailed features
└── package.json              # Root package.json
```

## Quick Start / התחלה מהירה

### Prerequisites / דרישות מקדימות
- Node.js 18+ 
- npm or yarn

### Installation / התקנה

1. **Clone the repository / שכפל את הריפוזיטורי:**
```bash
git clone <repository-url>
cd techhelp4u
```

2. **Install dependencies / התקן תלויות:**
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

3. **Setup database / הגדר מסד נתונים:**
```bash
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

4. **Start development servers / הפעל שרתי פיתוח:**
```bash
# From root directory
npm run dev
```

This will start:
- Backend API: http://localhost:3001
- Frontend App: http://localhost:5173

### Default Admin Credentials / פרטי מנהל ברירת מחדל
- **Username / שם משתמש:** admin
- **Password / סיסמה:** admin123

⚠️ **Change these credentials in production!**

## API Endpoints / נקודות קצה API

### Public Endpoints
- `GET /health` - Health check
- `GET /api/slots/available` - Get available slots
- `POST /api/requests` - Create help request

### Admin Endpoints (Protected)
- `POST /api/auth/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/requests` - Manage requests
- `POST /api/admin/slots/bulk` - Create multiple slots

## Environment Variables / משתני סביבה

### Backend (.env)
```env
DATABASE_URL="file:./dev.db"
PORT=3001
NODE_ENV=development
SESSION_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

## Development Scripts / סקריפטי פיתוח

### Root Level
- `npm run dev` - Start both backend and frontend
- `npm run build` - Build both projects
- `npm run db:setup` - Setup database
- `npm run db:reset` - Reset database

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Database Schema / סכמת מסד הנתונים

### Tables / טבלאות
- **tech_requests** - Help requests from users
- **available_slots** - Available time slots for volunteers
- **admin_users** - Admin user accounts
- **notification_logs** - Notification history

## Testing / בדיקות

### Manual Testing Checklist
- [ ] Home page loads correctly
- [ ] Request help form submission works
- [ ] Time slot selection functions
- [ ] Admin login works
- [ ] Admin dashboard displays data
- [ ] Request management works
- [ ] Slot management works
- [ ] Hebrew/RTL layout works correctly
- [ ] Mobile responsiveness works

### API Testing
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test available slots
curl http://localhost:3001/api/slots/available
```

## Security Features / תכונות אבטחה

- Password hashing with bcrypt
- Session-based authentication
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet middleware)

## Accessibility / נגישות

- RTL (Right-to-Left) support for Hebrew
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- High contrast colors
- Large click targets for elderly users

## Browser Support / תמיכה בדפדפנים

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing / תרומה

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License / רישיון

MIT License - see LICENSE file for details

## Support / תמיכה

For support or questions, please create an issue in the repository or contact the development team.

---

**Made with ❤️ for the volunteer community / נוצר באהבה עבור קהילת המתנדבים**