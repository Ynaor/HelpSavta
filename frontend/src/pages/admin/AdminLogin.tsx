import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader } from '../../components/ui/card';
import { LoginForm } from '../../types';
import { authAPI } from '../../services/api';
import { getErrorMessage } from '../../lib/utils';

const AdminLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError('');
      
      await authAPI.login(data);
      
      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 brand-admin-icon-container mx-auto mb-4">
            <LogIn className="w-8 h-8 brand-admin-icon" />
          </div>
          {/* <CardTitle className="text-2xl">כניסת מנהלים</CardTitle> */}
          <CardDescription>
            היכנס עם פרטי המנהל שלך לגישה למערכת הניהול
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-4 brand-error-message">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">שם משתמש</label>
              <Input
                {...register('username', { 
                  required: 'שם משתמש הוא שדה חובה',
                  minLength: {
                    value: 3,
                    message: 'שם משתמש חייב להכיל לפחות 3 תווים'
                  }
                })}
                placeholder="הזן שם משתמש"
                className={errors.username ? 'border-red-500' : ''}
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">סיסמה</label>
              <div className="relative">
                <Input
                  {...register('password', { 
                    required: 'סיסמה היא שדה חובה',
                    minLength: {
                      value: 6,
                      message: 'סיסמה חייבת להכיל לפחות 6 תווים'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="הזן סיסמה"
                  className={`${errors.password ? 'border-red-500' : ''} pl-10`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 brand-password-toggle"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-reverse space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 brand-loading-spinner-on-primary rounded-full"></div>
                  <span>מתחבר...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-reverse space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>התחבר</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 brand-admin-footer">
            <p>משתמש רגיל?</p>
            <button
              onClick={() => navigate('/')}
              className="brand-admin-link"
            >
              חזור לדף הבית
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;