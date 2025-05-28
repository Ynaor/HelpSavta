import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CreateTechRequestForm, AvailableSlot, URGENCY_LABELS } from '../types';
import { requestsAPI, slotsAPI } from '../services/api';
import { formatDate, getErrorMessage } from '../lib/utils';

interface RequestFormData extends CreateTechRequestForm {
  selectedSlotId?: number;
}

const RequestHelp: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<RequestFormData>();

  useEffect(() => {
    if (currentStep === 2) {
      loadAvailableSlots();
    }
  }, [currentStep]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const slots = await slotsAPI.getAvailable();
      setAvailableSlots(slots);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStepForward = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: RequestFormData) => {
    if (currentStep === 1) {
      handleStepForward();
      return;
    }

    if (currentStep === 2) {
      if (!selectedSlot) {
        setError('אנא בחר זמן זמין');
        return;
      }
      handleStepForward();
      return;
    }

    if (currentStep === 3) {
      try {
        setLoading(true);
        setError('');

        console.log('Creating request with data:', {
          full_name: data.full_name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          problem_description: data.problem_description,
          urgency_level: data.urgency_level,
          notes: data.notes
        });

        // Create the request
        const request = await requestsAPI.create({
          full_name: data.full_name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          problem_description: data.problem_description,
          urgency_level: data.urgency_level,
          notes: data.notes
        });

        console.log('Request created successfully:', request);

        // Book the selected slot
        if (selectedSlot) {
          console.log('Booking slot:', selectedSlot.id, 'for request:', request.id);
          await slotsAPI.book(selectedSlot.id, request.id);
          console.log('Slot booked successfully');
        }

        setSuccess(true);
      } catch (err) {
        console.error('Error in request submission:', err);
        const errorMessage = getErrorMessage(err);
        console.error('Parsed error message:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSlotSelection = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setValue('selectedSlotId', slot.id);
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

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              בקשתך נשלחה בהצלחה!
            </CardTitle>
            <CardDescription>
              קיבלנו את פרטי הבקשה שלך וניצור איתך קשר בהקדם
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSlot && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">זמני הבקשה שנבחרו:</h3>
                <p className="text-sm text-gray-600">
                  {formatDate(selectedSlot.date)} בשעה {selectedSlot.start_time}-{selectedSlot.end_time}
                </p>
              </div>
            )}
            <div className="text-sm text-gray-600">
              <p>מתנדב יקבל את הבקשה ויצור איתך קשר לתיאום פרטים נוספים.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-reverse space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4 space-x-reverse space-x-8">
          <span className={`text-sm ${currentStep >= 1 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
            פרטים אישיים
          </span>
          <span className={`text-sm ${currentStep >= 2 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
            בחירת זמן
          </span>
          <span className={`text-sm ${currentStep >= 3 ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>
            אישור
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'פרטים אישיים ותיאור הבעיה'}
            {currentStep === 2 && 'בחירת זמן זמין'}
            {currentStep === 3 && 'אישור פרטי הבקשה'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'אנא מלא את הפרטים הבאים כדי שנוכל לעזור לך'}
            {currentStep === 2 && 'בחר את הזמן הנוח לך ביותר מהאפשרויות הזמינות'}
            {currentStep === 3 && 'אשר את פרטי הבקשה לפני השליחה'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-reverse space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">שם מלא *</label>
                  <Input
                    {...register('full_name', { required: 'שם מלא הוא שדה חובה' })}
                    placeholder="הזן את שמך המלא"
                    className={errors.full_name ? 'border-red-500' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">מספר טלפון *</label>
                  <Input
                    {...register('phone', {
                      required: 'מספר טלפון הוא שדה חובה',
                      pattern: {
                        value: /^0[2-9]\d{7,8}$/,
                        message: 'מספר טלפון לא תקין'
                      },
                      setValueAs: (value) => value?.replace(/[-\s]/g, '') || ''
                    })}
                    placeholder="0501234567"
                    className={errors.phone ? 'border-red-500' : ''}
                    onInput={(e) => {
                      // Remove dashes and spaces from phone number as user types
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/[-\s]/g, '');
                    }}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">כתובת דוא"ל *</label>
                  <Input
                    {...register('email', {
                      required: 'כתובת דוא"ל היא שדה חובה',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'כתובת דוא"ל לא תקינה'
                      }
                    })}
                    type="email"
                    placeholder="your.email@example.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">כתובת מלאה *</label>
                  <Input
                    {...register('address', { required: 'כתובת היא שדה חובה' })}
                    placeholder="רחוב, מספר בית, עיר"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">תיאור הבעיה הטכנית *</label>
                  <Textarea
                    {...register('problem_description', { required: 'תיאור הבעיה הוא שדה חובה' })}
                    placeholder="תאר בפירוט את הבעיה הטכנית שבה אתה זקוק לעזרה"
                    className={errors.problem_description ? 'border-red-500' : ''}
                    rows={4}
                  />
                  {errors.problem_description && (
                    <p className="text-red-500 text-sm mt-1">{errors.problem_description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">רמת דחיפות</label>
                  <Select {...register('urgency_level')} defaultValue="medium">
                    <option value="low">{URGENCY_LABELS.low}</option>
                    <option value="medium">{URGENCY_LABELS.medium}</option>
                    <option value="high">{URGENCY_LABELS.high}</option>
                    <option value="urgent">{URGENCY_LABELS.urgent}</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">הערות נוספות</label>
                  <Textarea
                    {...register('notes')}
                    placeholder="הערות או בקשות מיוחדות (אופציונלי)"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Time Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-600">טוען זמנים זמינים...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">אין זמנים זמינים כרגע</p>
                    <p className="text-sm text-gray-500 mt-2">אנא נסה שוב מאוחר יותר</p>
                  </div>
                ) : (
                  <div>
                    {/* Time slots container with fixed height and scroll */}
                    <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                      <div className="space-y-6">
                        {Object.entries(groupSlotsByDate(availableSlots)).map(([date, slots]) => (
                          <div key={date}>
                            <h3 className="font-medium mb-3 sticky top-0 bg-gray-50 py-2 border-b border-gray-200">
                              {formatDate(date)}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {slots.map((slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => handleSlotSelection(slot)}
                                  className={`p-3 rounded-lg border text-sm transition-colors ${
                                    selectedSlot?.id === slot.id
                                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                  }`}
                                >
                                  {slot.start_time} - {slot.end_time}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Selected slot indicator - always visible below the scrollable area */}
                    {selectedSlot && (
                      <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <Check className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-700">
                            זמן נבחר: {formatDate(selectedSlot.date)} בשעה {selectedSlot.start_time}-{selectedSlot.end_time}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <h3 className="font-medium text-lg">סיכום הבקשה</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex">
                      <span className="font-medium w-24">שם:</span>
                      <span>{watch('full_name')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">טלפון:</span>
                      <span>{watch('phone')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">דוא"ל:</span>
                      <span>{watch('email')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">כתובת:</span>
                      <span>{watch('address')}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">דחיפות:</span>
                      <span>{URGENCY_LABELS[watch('urgency_level') as keyof typeof URGENCY_LABELS]}</span>
                    </div>
                    {selectedSlot && (
                      <div className="flex">
                        <span className="font-medium w-24">זמן:</span>
                        <span>{formatDate(selectedSlot.date)} בשעה {selectedSlot.start_time}-{selectedSlot.end_time}</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">תיאור הבעיה:</span>
                      <span className="mt-1 bg-white p-3 rounded border">{watch('problem_description')}</span>
                    </div>
                    {watch('notes') && (
                      <div className="flex flex-col">
                        <span className="font-medium">הערות:</span>
                        <span className="mt-1 bg-white p-3 rounded border">{watch('notes')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleStepBack}
                disabled={currentStep === 1}
                className="flex items-center space-x-reverse space-x-2"
              >
                <ChevronRight className="w-4 h-4" />
                <span>הקודם</span>
              </Button>

              <Button
                type="submit"
                disabled={loading || (currentStep === 2 && !selectedSlot)}
                className="flex items-center space-x-reverse space-x-2"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <span>
                      {currentStep === 3 ? 'שלח בקשה' : 'הבא'}
                    </span>
                    {currentStep < 3 && <ChevronLeft className="w-4 h-4" />}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestHelp;