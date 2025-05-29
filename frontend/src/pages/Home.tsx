import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Computer, Smartphone, Tv, Wifi, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const Home: React.FC = () => {
  return (
    <div className="space-y-12 md:space-y-16 py-4 md:py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-l from-blue-500 to-blue-600 text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
                className="bg-white text-blue-600 hover:bg-blue-50 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto"
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
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
            השירותים שלנו
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            אנחנו מעניקים פתרונות טכנולוגיים מקיפים בבית הלקוח,
            בסבלנות ובהבנה לצרכים המיוחדים של גיל השלישי
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Computer className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <CardTitle>תיקון מחשבים</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                תיקון תקלות, התקנת תוכנות, הדרכה לשימוש במחשב
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Smartphone className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <CardTitle>עזרה בסמארטפון</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                הכוונה לשימוש באפליקציות, הגדרות, פתרון בעיות
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Tv className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <CardTitle>טלוויזיות חכמות</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                התקנה, הגדרה, הדרכה לשימוש בפלטפורמות וידאו
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Wifi className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <CardTitle>אינטרנט ורשתות</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                פתרון בעיות חיבור, הגדרות אבטחה, שיפור ביצועים
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-beige-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              איך זה עובד?
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-gray-600">
              תהליך פשוט ונוח לקבלת עזרה טכנית
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">הגש בקשה</h3>
              <p className="text-gray-600 text-sm md:text-base">
                מלא טופס קצר עם פרטי הבעיה הטכנית והזמן הנוח לך
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">קבע זמן</h3>
              <p className="text-gray-600 text-sm md:text-base">
                בחר מבין הזמנים הפנויים שמתאימים לך ביותר
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 text-xl md:text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">קבל עזרה</h3>
              <p className="text-gray-600 text-sm md:text-base">
                מתנדב מקצועי יגיע אליך הביתה ויפתור את הבעיה
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-12 md:py-16">
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
                className="bg-white text-green-600 hover:bg-green-50 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 w-full sm:w-auto"
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
        <Card className="bg-gray-50">
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