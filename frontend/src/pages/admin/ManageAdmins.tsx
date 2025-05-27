import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Users, 
  UserPlus, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle,
  Shield
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AdminUser, CreateAdminForm } from '../../types';
import { adminAPI } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../lib/utils';

const ManageAdmins: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateAdminForm>();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await adminAPI.getAdmins();
      setAdmins(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Error loading admins:', err);
      setError(getErrorMessage(err));
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateAdminForm) => {
    try {
      setCreating(true);
      setError('');
      setSuccessMessage('');
      
      await adminAPI.createAdmin(data);
      setSuccessMessage(`מנהל חדש נוצר בהצלחה: ${data.username}`);
      reset();
      setShowCreateForm(false);
      await loadAdmins();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול מנהלים</h1>
        <p className="text-gray-600">
          ניהול משתמשי מנהל במערכת
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-reverse space-x-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-reverse space-x-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Create Admin Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-2">
              <UserPlus className="w-5 h-5" />
              <span>יצירת מנהל חדש</span>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setError('');
                setSuccessMessage('');
              }}
            >
              {showCreateForm ? 'בטל' : 'הוסף מנהל'}
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showCreateForm && (
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">שם משתמש</label>
                  <Input
                    {...register('username', {
                      required: 'שם משתמש הוא שדה חובה',
                      minLength: {
                        value: 3,
                        message: 'שם משתמש חייב להכיל לפחות 3 תווים'
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'שם משתמש יכול להכיל רק אותיות באנגלית, ספרות וקו תחתון'
                      }
                    })}
                    placeholder="הזן שם משתמש"
                    className={errors.username ? 'border-red-500' : ''}
                    autoComplete="off"
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
                          value: 8,
                          message: 'סיסמה חייבת להכיל לפחות 8 תווים'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'סיסמה חייבת להכיל לפחות אות גדולה, אות קטנה וספרה'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="הזן סיסמה חזקה"
                      className={`${errors.password ? 'border-red-500' : ''} pl-10`}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה וספרה
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-reverse space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                    setError('');
                  }}
                >
                  בטל
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                >
                  {creating ? (
                    <div className="flex items-center space-x-reverse space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>יוצר...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-reverse space-x-2">
                      <UserPlus className="w-4 h-4" />
                      <span>צור מנהל</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-reverse space-x-2">
            <Users className="w-5 h-5" />
            <span>רשימת מנהלים</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-600">טוען רשימת מנהלים...</p>
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">לא נמצאו מנהלים במערכת</p>
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-reverse space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg text-gray-900">
                        {admin.username}
                      </h3>
                      <p className="text-sm text-gray-600">
                        מזהה: #{admin.id}
                      </p>
                    </div>
                  </div>

                  <div className="text-left text-sm text-gray-600">
                    <div>נוצר: {formatDateTime(admin.created_at)}</div>
                    <div>עודכן: {formatDateTime(admin.updated_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">הוראות לניהול מנהלים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start space-x-reverse space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
              <span>כל מנהל חדש יוכל להתחבר למערכת עם שם המשתמש והסיסמה שהוגדרו</span>
            </div>
            <div className="flex items-start space-x-reverse space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
              <span>יש לוודא שהסיסמה חזקה ומכילה אות גדולה, אות קטנה וספרה</span>
            </div>
            <div className="flex items-start space-x-reverse space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
              <span>מנהלים יכולים לגשת לכל הפונקציות של מערכת הניהול</span>
            </div>
            <div className="flex items-start space-x-reverse space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
              <span>כרגע אין אפשרות למחוק מנהלים דרך הממשק - פנה למפתח המערכת</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageAdmins;