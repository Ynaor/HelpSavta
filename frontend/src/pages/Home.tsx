import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Computer, Smartphone, Tv, Wifi, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const Home: React.FC = () => {
  return (

    <div className="space-y-12 md:space-y-16 py-4 md:py-8">
      {/* Hero Section */}
      <section className="brand-hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4 md:mb-6">
            <img
              src="/tab_image.png"
              alt="לוגו עזרה טכנית בהתנדבות"
              className="brand-hero-logo"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6">
            עזרה טכנית בהתנדבות
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed">
            שירות התנדבותי לעזרה טכנית לגיל השלישי
            <br className="hidden sm:block" />
            <span className="sm:hidden"> - </span>מתנדבים מקצועיים מגיעים עד הבית
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/request-help">
              <Button
                size="lg"
                className="brand-hero-button"
              >
                <Phone className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                בקש עזרה עכשיו
              </Button>
            </Link>
            {/* <Button
              variant="outline"
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4"
            >
              <Phone className="ml-2 w-5 h-5" />
              התקשר: 050-123-4567
            </Button> */}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="brand-section-title">
            השירותים שלנו
          </h2>
          <p className="brand-section-description">
            אנחנו מעניקים פתרונות טכנולוגיים מקיפים בבית הלקוח,
            בסבלנות ובהבנה לצרכים המיוחדים של גיל השלישי
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="brand-service-icon-container">
                <Computer className="brand-service-icon" />
              </div>
              <CardTitle>תיקון מחשבים</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="brand-text-muted">
                תיקון תקלות, התקנת תוכנות, הדרכה לשימוש במחשב
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="brand-service-icon-container">
                <Smartphone className="brand-service-icon" />
              </div>
              <CardTitle>עזרה בסמארטפון</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="brand-text-muted">
                הכוונה לשימוש באפליקציות, הגדרות, פתרון בעיות
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="brand-service-icon-container">
                <Tv className="brand-service-icon" />
              </div>
              <CardTitle>טלוויזיות חכמות</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="brand-text-muted">
                התקנה, הגדרה, הדרכה לשימוש בפלטפורמות וידאו
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="brand-service-icon-container">
                <Wifi className="brand-service-icon" />
              </div>
              <CardTitle>אינטרנט ורשתות</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="brand-text-muted">
                פתרון בעיות חיבור, הגדרות אבטחה, שיפור ביצועים
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="brand-secondary-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="brand-section-title">
              איך זה עובד?
            </h2>
            <p className="brand-section-description">
              תהליך פשוט ונוח לקבלת עזרה טכנית
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="brand-step-indicator">
                1
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">הגש בקשה</h3>
              <p className="brand-text-muted text-sm md:text-base">
                מלא טופס קצר עם פרטי הבעיה הטכנית והזמן הנוח לך
              </p>
            </div>

            <div className="text-center">
              <div className="brand-step-indicator">
                2
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">קבע זמן</h3>
              <p className="brand-text-muted text-sm md:text-base">
                בחר מבין הזמנים הפנויים שמתאימים לך ביותר
              </p>
            </div>

            <div className="text-center">
              <div className="brand-step-indicator">
                3
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">קבל עזרה</h3>
              <p className="brand-text-muted text-sm md:text-base">
                מתנדב מקצועי יגיע אליך הביתה ויפתור את הבעיה
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="brand-cta-section">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
            מוכן לקבל עזרה טכנית?
          </h2>
          <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8">
            השירות שלנו חינמי לחלוטין ומוענק בהתנדבות מלאה
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/request-help">
              <Button
                size="lg"
                className="brand-hero-button"
              >
                הגש בקשת עזרה
                <ArrowLeft className="mr-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Admin Quick Access */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="brand-admin-card">
          <CardHeader>
            <CardTitle className="text-center">גישה למנהלי המערכת</CardTitle>
            <CardDescription className="text-center">
              כניסה לפאנל ניהול הבקשות והזמנים
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/admin/login">
              <Button variant="outline" size="lg">
                כניסת מנהלים
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;