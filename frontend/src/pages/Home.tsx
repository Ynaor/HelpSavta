import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Computer, Smartphone, Tv, Wifi, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const Home: React.FC = () => {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-l from-orange-500 to-red-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            עזרה טכנית בהתנדבות
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed">
            שירות התנדבותי לעזרה טכנית לגיל השלישי
            <br />
            מתנדבים מקצועיים מגיעים עד הבית
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/request-help">
              <Button 
                size="lg" 
                className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-4"
              >
                <Phone className="ml-2 w-5 h-5" />
                בקש עזרה עכשיו
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-orange-600 text-lg px-8 py-4"
            >
              <Phone className="ml-2 w-5 h-5" />
              התקשר: 050-123-4567
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            השירותים שלנו
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            אנחנו מעניקים פתרונות טכנולוגיים מקיפים בבית הלקוח,
            בסבלנות ובהבנה לצרכים המיוחדים של גיל השלישי
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Computer className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">תיקון מחשבים</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                תיקון תקלות, התקנת תוכנות, הדרכה לשימוש במחשב
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">עזרה בסמארטפון</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                הכוונה לשימוש באפליקציות, הגדרות, פתרון בעיות
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tv className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">טלוויזיות חכמות</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-600">
                התקנה, הגדרה, הדרכה לשימוש בפלטפורמות וידאו
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">אינטרנט ורשתות</CardTitle>
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
      <section className="bg-beige-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              איך זה עובד?
            </h2>
            <p className="text-lg text-gray-600">
              תהליך פשוט ונוח לקבלת עזרה טכנית
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">הגש בקשה</h3>
              <p className="text-gray-600">
                מלא טופס קצר עם פרטי הבעיה הטכנית והזמן הנוח לך
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">קבע זמן</h3>
              <p className="text-gray-600">
                בחר מבין הזמנים הפנויים שמתאימים לך ביותר
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">קבל עזרה</h3>
              <p className="text-gray-600">
                מתנדב מקצועי יגיע אליך הביתה ויפתור את הבעיה
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-6">
            מוכן לקבל עזרה טכנית?
          </h2>
          <p className="text-xl mb-8">
            השירות שלנו חינמי לחלוטין ומוענק בהתנדבות מלאה
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/request-help">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-green-50 text-lg px-8 py-4"
              >
                הגש בקשת עזרה
                <ArrowLeft className="mr-2 w-5 h-5" />
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