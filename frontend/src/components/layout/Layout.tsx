import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, Mail, Home, LogOut, Users, Calendar } from 'lucide-react';
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
    <div className="min-h-screen bg-blue-50 text-hebrew" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-reverse space-x-2 md:space-x-4">
              <div className="flex-shrink-0">
                <img
                  src="/assets/tab_image.png"
                  alt="לוגו עזרה טכנית בהתנדבות"
                  className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">
                  עזרה טכנית בהתנדבות
                </h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">
                  שירות התנדבותי לעזרה טכנית לגיל השלישי
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-reverse space-x-2 md:space-x-6">
              <Link
                to="/"
                className={`flex items-center space-x-reverse space-x-1 md:space-x-2 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Home className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">דף הבית</span>
              </Link>

              <Link
                to="/request-help"
                className={`flex items-center space-x-reverse space-x-1 md:space-x-2 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                  location.pathname === '/request-help'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Phone className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">בקשת עזרה</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/admin/requests"
                    className={`hidden md:flex items-center space-x-reverse space-x-1 md:space-x-2 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                      location.pathname === '/admin/requests'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Users className="w-3 h-3 md:w-4 md:h-4" />
                    <span>ניהול בקשות</span>
                  </Link>

                  <Link
                    to="/admin/slots"
                    className={`hidden md:flex items-center space-x-reverse space-x-1 md:space-x-2 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                      location.pathname === '/admin/slots'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                    <span>ניהול זמנים</span>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center space-x-reverse space-x-1 md:space-x-2 px-2 md:px-3 py-1 md:py-2"
                  >
                    <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline text-xs md:text-sm">התנתקות</span>
                  </Button>
                </>
              )}

              {!isAuthenticated && (
                <Link
                  to="/admin/login"
                  className="flex items-center space-x-reverse space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                >
                  {/* <Settings className="w-4 h-4" /> */}
                  {/* <span>כניסת מנהלים</span> */}
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
      <footer className="bg-white border-t border-blue-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Contact Info */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                יצירת קשר
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-reverse space-x-2 text-gray-600 text-sm md:text-base">
                  <Phone className="w-3 h-3 md:w-4 md:h-4" />
                  <span>050-123-4567</span>
                </div>
                <div className="flex items-center space-x-reverse space-x-2 text-gray-600 text-sm md:text-base">
                  <Mail className="w-3 h-3 md:w-4 md:h-4" />
                  <span>support@helpsavta.com</span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                השירותים שלנו
              </h3>
              <ul className="space-y-1 md:space-y-2 text-gray-600 text-sm md:text-base">
                <li>תיקון מחשבים</li>
                <li>הכוונה לשימוש בסמארטפון</li>
                <li>התקנת טלוויזיות חכמות</li>
                <li>פתרון בעיות אינטרנט</li>
                <li>הדרכות דיגיטליות</li>
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
                אודותינו
              </h3>
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                אנחנו ארגון התנדבותי שמטרתו לספק עזרה טכנית לגיל השלישי.
                המתנדבים שלנו מגיעים עד הבית ומעניקים פתרונות טכנולוגיים
                בסבלנות ובהבנה.
              </p>
            </div>
          </div>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-blue-200 text-center text-gray-500 text-xs md:text-sm">
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