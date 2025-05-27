import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, Mail, Home, Settings, LogOut, Users, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { authAPI } from '../../services/api';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Check authentication status on mount
  React.useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const status = await authAPI.status();
      setIsAuthenticated(status.authenticated);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };


  return (
    <div className="min-h-screen bg-orange-50 text-hebrew" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">עט</span>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  עזרה טכנית בהתנדבות
                </h1>
                <p className="text-sm text-gray-600">
                  שירות התנדבותי לעזרה טכנית לגיל השלישי
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-reverse space-x-6">
              <Link
                to="/"
                className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>דף הבית</span>
              </Link>

              <Link
                to="/request-help"
                className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/request-help'
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>בקשת עזרה</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/admin/requests"
                    className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/admin/requests'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>ניהול בקשות</span>
                  </Link>

                  <Link
                    to="/admin/slots"
                    className={`flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === '/admin/slots'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>ניהול זמנים</span>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-reverse space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>התנתקות</span>
                  </Button>
                </>
              )}

              {!isAuthenticated && (
                <Link
                  to="/admin/login"
                  className="flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50"
                >
                  <Settings className="w-4 h-4" />
                  <span>כניסת מנהלים</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                יצירת קשר
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-reverse space-x-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>050-123-4567</span>
                </div>
                <div className="flex items-center space-x-reverse space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>help@techhelp4u.org.il</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                השירותים שלנו
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li>תיקון מחשבים</li>
                <li>הכוונה לשימוש בסמארטפון</li>
                <li>התקנת טלוויזיות חכמות</li>
                <li>פתרון בעיות אינטרנט</li>
                <li>הדרכות דיגיטליות</li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                אודותינו
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                אנחנו ארגון התנדבותי שמטרתו לספק עזרה טכנית לגיל השלישי.
                המתנדבים שלנו מגיעים עד הבית ומעניקים פתרונות טכנולוגיים
                בסבלנות ובהבנה.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-orange-200 text-center text-gray-500 text-sm">
            <p>
              © 2024 עזרה טכנית בהתנדבות. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;