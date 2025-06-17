import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Bell,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { authAPI } from '../../services/api';
import { getErrorMessage } from '../../lib/utils';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsCheckingAuth(true);
        const status = await authAPI.status();
        setIsAuthenticated(status.authenticated);
        
        if (!status.authenticated) {
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Authentication check failed:', getErrorMessage(error));
        setIsAuthenticated(false);
        navigate('/admin/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">בודק הרשאות...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (isAuthenticated === false) {
    return null; // Component will unmount due to navigation
  }

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await authAPI.logout();
      navigate('/admin/login');
    } catch (err) {
      console.error('Logout failed:', getErrorMessage(err));
      // Even if logout fails, redirect to login
      navigate('/admin/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const navigationItems = [
    {
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      label: 'לוח בקרה',
      description: 'סקירה כללית'
    },
    {
      href: '/admin/calendar',
      icon: Calendar,
      label: 'לוח שנה',
      description: 'תצוגת לוח זמנים'
    },
    {
      href: '/admin/requests',
      icon: FileText,
      label: 'ניהול בקשות',
      description: 'בקשות עזרה טכנית'
    },
    {
      href: '/admin/slots',
      icon: Calendar,
      label: 'ניהול זמנים',
      description: 'זמנים פנויים'
    },
    {
      href: '/admin/notifications',
      icon: Bell,
      label: 'יומן הודעות',
      description: 'מעקב הודעות'
    },
    {
      href: '/admin/admins',
      icon: Users,
      label: 'ניהול מנהלים',
      description: 'משתמשי מנהל'
    }
  ];

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900">פאנל ניהול</h2>
            <p className="text-xs text-gray-600">HelpSavta Admin</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => {
                navigate(item.href);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-reverse space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg text-right transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <div className="flex-1 text-right">
                <div className={`text-sm md:text-base font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                  {item.label}
                </div>
                <div className="text-xs md:text-sm text-gray-500">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {loggingOut ? (
            <div className="flex items-center space-x-reverse space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
              <span>מתנתק...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-reverse space-x-2">
              <LogOut className="w-4 h-4" />
              <span>התנתק</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:w-80 lg:block z-30">
        <SidebarContent />
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 right-0 w-80 z-50 transition-transform transform lg:hidden ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="lg:pr-80">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <h1 className="text-sm md:text-base font-semibold">פאנל ניהול</h1>
            <div className="w-8 md:w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;