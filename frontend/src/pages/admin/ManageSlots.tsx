import React, { useState, useCallback } from 'react';
import { Calendar, Clock, Plus, Trash2, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { AvailableSlot, CreateSlotForm } from '../../types';
import { slotsAPI, adminAPI } from '../../services/api';
import { formatDate, getErrorMessage, generateDateRange } from '../../lib/utils';
import { useSlotData } from '../../hooks/useSlotData';

const ManageSlots: React.FC = () => {
  const { slots, loading, error: slotError, refreshSlots, clearError } = useSlotData(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkForm, setBulkForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateSlotForm>();
  const { register: bulkRegister, handleSubmit: bulkHandleSubmit, formState: { errors: bulkErrors }, reset: bulkReset } = useForm();

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      setSuccess('');
      clearError();
      await refreshSlots();
      setSuccess('רשימת הזמנים עודכנה');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, [refreshSlots, clearError]);

  const handleCreateSlot = async (data: CreateSlotForm) => {
    try {
      setError('');
      setSuccess('');
      await slotsAPI.create(data);
      setSuccess('זמן חדש נוצר בהצלחה');
      reset();
      setShowCreateForm(false);
      await refreshSlots();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleBulkCreate = async (data: any) => {
    try {
      setError('');
      setSuccess('');
      
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      const dates = generateDateRange(startDate, endDate, data.exclude_weekends);
      
      await adminAPI.createBulkSlots({
        dates,
        start_time: data.start_time,
        end_time: data.end_time
      });
      
      setSuccess(`נוצרו ${dates.length} זמנים זמינים בהצלחה`);
      bulkReset();
      setBulkForm(false);
      await refreshSlots();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הזמן הזמין?')) {
      return;
    }

    try {
      await slotsAPI.delete(slotId);
      setSuccess('זמן זמין נמחק בהצלחה');
      await refreshSlots();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const groupSlotsByDate = (slots: AvailableSlot[]) => {
    const grouped: { [date: string]: AvailableSlot[] } = {};
    slots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  };

  const CreateSlotForm = () => (
    <Card className="mb-4 md:mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-reverse space-x-2 text-lg md:text-xl">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span>הוספת זמן זמין חדש</span>
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          הוסף זמן זמין בודד למערכת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleCreateSlot)} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">תאריך</label>
              <Input
                type="date"
                {...register('date', { required: 'תאריך הוא שדה חובה' })}
                className={`text-sm md:text-base ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs md:text-sm mt-1">{errors.date.message || 'שדה חובה'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">שעת התחלה</label>
              <Input
                type="time"
                {...register('start_time', { required: 'שעת התחלה היא שדה חובה' })}
                className={`text-sm md:text-base ${errors.start_time ? 'border-red-500' : ''}`}
              />
              {errors.start_time && (
                <p className="text-red-500 text-xs md:text-sm mt-1">{errors.start_time.message || 'שדה חובה'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">שעת סיום</label>
              <Input
                type="time"
                {...register('end_time', { required: 'שעת סיום היא שדה חובה' })}
                className={`text-sm md:text-base ${errors.end_time ? 'border-red-500' : ''}`}
              />
              {errors.end_time && (
                <p className="text-red-500 text-xs md:text-sm mt-1">{errors.end_time.message || 'שדה חובה'}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-reverse sm:space-x-2">
            <Button type="submit" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 ml-1" />
              הוסף זמן
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} className="w-full sm:w-auto">
              ביטול
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const BulkCreateForm = () => (
    <Card className="mb-4 md:mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-reverse space-x-2 text-lg md:text-xl">
          <Calendar className="w-4 h-4 md:w-5 md:h-5" />
          <span>יצירת זמנים בכמות גדולה</span>
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          צור זמנים זמינים עבור תקופה מסוימת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={bulkHandleSubmit(handleBulkCreate)} className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">תאריך התחלה</label>
              <Input
                type="date"
                {...bulkRegister('start_date', { required: 'תאריך התחלה הוא שדה חובה' })}
                className={`text-sm md:text-base ${bulkErrors.start_date ? 'border-red-500' : ''}`}
              />
              {bulkErrors.start_date && (
                <p className="text-red-500 text-xs md:text-sm mt-1">{String(bulkErrors.start_date.message) || 'שדה חובה'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">תאריך סיום</label>
              <Input
                type="date"
                {...bulkRegister('end_date', { required: 'תאריך סיום הוא שדה חובה' })}
                className={`text-sm md:text-base ${bulkErrors.end_date ? 'border-red-500' : ''}`}
              />
              {bulkErrors.end_date && (
                <p className="text-red-500 text-xs md:text-sm mt-1">{String(bulkErrors.end_date.message) || 'שדה חובה'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">שעת התחלה</label>
              <Input
                type="time"
                defaultValue="09:00"
                {...bulkRegister('start_time', { required: 'שעת התחלה היא שדה חובה' })}
                className={`text-sm md:text-base ${bulkErrors.start_time ? 'border-red-500' : ''}`}
              />
              {bulkErrors.start_time && (
                <p className="text-red-500 text-xs md:text-sm mt-1">{String(bulkErrors.start_time.message) || 'שדה חובה'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">שעת סיום</label>
              <Input
                type="time"
                defaultValue="17:00"
                {...bulkRegister('end_time', { required: 'שעת סיום היא שדה חובה' })}
                className={`text-sm md:text-base ${bulkErrors.end_time ? 'border-red-500' : ''}`}
              />
              {bulkErrors.end_time && (
                <p className="text-red-500 text-xs md:text-sm mt-1">{String(bulkErrors.end_time.message) || 'שדה חובה'}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-reverse space-x-2">
            <input
              type="checkbox"
              id="exclude_weekends"
              {...bulkRegister('exclude_weekends')}
              className="rounded border-gray-300 w-4 h-4"
            />
            <label htmlFor="exclude_weekends" className="text-sm md:text-base font-medium">
              אל תכלול סוף שבוע (שישי ושבת)
            </label>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-reverse sm:space-x-2">
            <Button type="submit" className="w-full sm:w-auto">
              <Calendar className="w-4 h-4 ml-1" />
              צור זמנים
            </Button>
            <Button type="button" variant="outline" onClick={() => setBulkForm(false)} className="w-full sm:w-auto">
              ביטול
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 md:py-8 px-4 md:px-6">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">ניהול זמנים זמינים</h1>
          <p className="text-sm md:text-base text-gray-600">
            כאן תוכל לנהל את הזמנים הזמינים לקביעת תורים
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-reverse sm:space-x-4">
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 ml-1" />
          הוסף זמן בודד
        </Button>
        <Button variant="outline" onClick={() => setBulkForm(!showBulkForm)}>
          <Calendar className="w-4 h-4 ml-1" />
          צור זמנים בכמות גדולה
        </Button>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ml-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'מרענן...' : 'רענן'}
        </Button>
        </div>

        {/* Create Forms */}
        {showCreateForm && <CreateSlotForm />}
        {showBulkForm && <BulkCreateForm />}

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-reverse space-x-2 text-green-700">
            <Check className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="text-sm md:text-base">{success}</span>
          </div>
        )}

        {(error || slotError) && (
          <div className="mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-reverse space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
            <span className="text-sm md:text-base">{error || slotError}</span>
          </div>
        )}

        {/* Slots List */}
        {loading ? (
          <div className="text-center py-8 md:py-12">
            <div className="animate-spin w-6 h-6 md:w-8 md:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-sm md:text-base text-gray-600">טוען זמנים זמינים...</p>
          </div>
        ) : slots.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 md:py-12">
              <Calendar className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm md:text-base text-gray-600 mb-4">אין זמנים זמינים במערכת</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 ml-1" />
                הוסף זמן ראשון
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {Object.entries(groupSlotsByDate(slots))
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([date, dateSlots]) => (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-reverse space-x-2 text-lg md:text-xl">
                      <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                      <span>{formatDate(date)}</span>
                      <span className="text-xs md:text-sm font-normal text-gray-500">
                        ({dateSlots.length} זמנים)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                      {dateSlots
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map((slot) => (
                          <div
                            key={slot.id}
                            className={`p-3 md:p-4 rounded-lg border transition-colors ${
                              slot.is_booked
                                ? 'bg-red-50 border-red-200'
                                : 'bg-green-50 border-green-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-reverse space-x-2">
                                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="text-sm md:text-base font-medium">
                                  {slot.start_time} - {slot.end_time}
                                </span>
                              </div>
                              <div className="flex items-center space-x-reverse space-x-2">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    slot.is_booked
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {slot.is_booked ? 'תפוס' : 'זמין'}
                                </span>
                                {!slot.is_booked && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteSlot(slot.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {slot.is_booked && slot.tech_requests && slot.tech_requests.length > 0 && (
                              <div className="mt-2 text-xs md:text-sm text-gray-600">
                                <span>תור לקוח: {slot.tech_requests[0].full_name}</span>
                                <div className="text-xs text-gray-500">
                                  סטטוס: {slot.tech_requests[0].status === 'pending' ? 'ממתין' :
                                           slot.tech_requests[0].status === 'in_progress' ? 'בטיפול' :
                                           slot.tech_requests[0].status === 'completed' ? 'הושלם' :
                                           slot.tech_requests[0].status === 'cancelled' ? 'בוטל' : slot.tech_requests[0].status}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageSlots;