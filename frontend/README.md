# Help-Savta Frontend

פרונטאנד לאפליקציית "עזרה טכנית בהתנדבות" - מערכת ניהול בקשות עזרה טכנית לגיל השלישי.

## טכנולוגיות

- **React 18** - ספריית UI
- **TypeScript** - שפת הפיתוח
- **Vite** - כלי Build וסביבת פיתוח
- **Tailwind CSS** - framework לעיצוב
- **React Router** - ניווט בין עמודים
- **React Hook Form** - ניהול טפסים
- **Axios** - בקשות HTTP
- **Lucide React** - אייקונים

## התקנה והרצה

### דרישות מקדימות
- Node.js (גרסה 18 ומעלה)
- npm או yarn

### התקנת התלויות
```bash
npm install
```

### הרצה בסביבת פיתוח
```bash
npm run dev
```
האפליקציה תפעל בכתובת: http://localhost:5173

### בניית הפרוייקט לייצור
```bash
npm run build
```

### תצוגה מקדימה של הבנייה
```bash
npm run preview
```

## מבנה הפרוייקט

```
src/
├── components/          # רכיבי UI משותפים
│   ├── ui/             # רכיבי UI בסיסיים (shadcn/ui)
│   └── layout/         # רכיבי פריסה
├── pages/              # דפי האפליקציה
│   ├── admin/          # דפי ניהול
│   ├── Home.tsx        # דף הבית
│   └── RequestHelp.tsx # דף הגשת בקשה
├── services/           # שירותי API
├── types/              # הגדרות TypeScript
├── lib/                # פונקציות עזר
├── App.tsx             # רכיב האפליקציה הראשי
├── main.tsx           # נקודת הכניסה
└── index.css          # סגנונות גלובליים
```

## עמודים ותכונות

### אזור ציבורי
- **דף הבית** (`/`) - מידע על השירות וקישורים לפעולות
- **הגשת בקשת עזרה** (`/request-help`) - טופס רב-שלבי להגשת בקשה

### אזור ניהול (מוגן בהתחברות)
- **התחברות מנהלים** (`/admin/login`) - כניסה למערכת הניהול
- **ניהול בקשות** (`/admin/requests`) - צפייה ועדכון בקשות עזרה
- **ניהול זמנים** (`/admin/slots`) - יצירה וניהול זמנים זמינים

## תמיכה ב-RTL (עברית)

האפליקציה תומכת באופן מלא בכיוון כתיבה מימין לשמאל:
- כל הטקסטים בעברית
- פריסת ממשק מותאמת לעברית
- סגנונות CSS מותאמים ל-RTL

## API Integration

השירותים ב-`src/services/api.ts` מתקשרים עם ה-backend:
- **Auth API** - אימות והרשאות
- **Requests API** - ניהול בקשות עזרה
- **Slots API** - ניהול זמנים זמינים
- **Admin API** - פעולות ניהול מתקדמות

## עיצוב ו-UI

- נעשה שימוש ב-Tailwind CSS לעיצוב מהיר ועקבי
- רכיבי UI בסיסיים מבוססים על shadcn/ui
- עיצוב responsive המתאים למכשירים שונים
- סכמת צבעים נגישה ומותאמת לגיל השלישי

## הגדרות סביבה

ניתן להגדיר את כתובת ה-backend בקובץ `.env.local`:
```
VITE_API_URL=http://localhost:3001
```

## תרומה לפרוייקט

1. צור fork של הפרוייקט
2. צור branch חדש לתכונה שלך
3. בצע commit לשינויים
4. שלח pull request

## רישיון

פרוייקט זה מיועד למטרות חינוכיות והתנדבותיות.