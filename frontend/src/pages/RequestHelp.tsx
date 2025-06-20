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
      <div className="max-w-2xl mx-auto py-8 md:py-16 px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="brand-success-icon-container w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4">
              <Check className="brand-success-icon w-6 h-6 md:w-8 md:h-8" />
            </div>
            <CardTitle className="text-xl md:text-2xl brand-success-title">
              בקשתך נשלחה בהצלחה!
            </CardTitle>
            <CardDescription>
              קיבלנו את פרטי הבקשה שלך וניצור איתך קשר בהקדם
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSlot && (
              <div className="brand-success-section">
                <h3 className="font-medium mb-2">זמני הבקשה שנבחרו:</h3>
                <p className="text-sm brand-text-muted">
                  {formatDate(selectedSlot.date)} בשעה {selectedSlot.start_time}-{selectedSlot.end_time}
                </p>
              </div>
            )}
            <div className="text-sm brand-text-muted">
              <p>מתנדב יקבל את הבקשה ויצור איתך קשר לתיאום פרטים נוספים.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 px-4">
      {/* Progress Bar */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-center space-x-reverse space-x-2 md:space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-medium ${
                  step <= currentStep
                    ? 'brand-progress-step-active'
                    : 'brand-progress-step-inactive'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-8 md:w-16 h-1 mx-1 md:mx-2 ${
                    step < currentStep ? 'brand-progress-bar-active' : 'brand-progress-bar-inactive'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-3 md:mt-4 space-x-reverse space-x-4 md:space-x-8">
          <span className={`text-xs md:text-sm ${currentStep >= 1 ? 'brand-progress-label-active' : 'brand-progress-label-inactive'}`}>
            פרטים אישיים
          </span>
          <span className={`text-xs md:text-sm ${currentStep >= 2 ? 'brand-progress-label-active' : 'brand-progress-label-inactive'}`}>
            בחירת זמן
          </span>
          <span className={`text-xs md:text-sm ${currentStep >= 3 ? 'brand-progress-label-active' : 'brand-progress-label-inactive'}`}>
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
            <div className="mb-6 p-4 brand-error-message">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm md:text-base font-medium mb-2">שם מלא *</label>
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
                  <label className="block text-sm md:text-base font-medium mb-2">מספר טלפון *</label>
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
                  <label className="block text-sm md:text-base font-medium mb-2">כתובת דוא"ל *</label>
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
                  <label className="block text-sm md:text-base font-medium mb-2">כתובת מלאה *</label>
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
                  <label className="block text-sm md:text-base font-medium mb-2">תיאור הבעיה הטכנית *</label>
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
                  <label className="block text-sm md:text-base font-medium mb-2">רמת דחיפות</label>
                  <Select {...register('urgency_level')} defaultValue="medium">
                    <option value="low">{URGENCY_LABELS.low}</option>
                    <option value="medium">{URGENCY_LABELS.medium}</option>
                    <option value="high">{URGENCY_LABELS.high}</option>
                    <option value="urgent">{URGENCY_LABELS.urgent}</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm md:text-base font-medium mb-2">הערות נוספות</label>
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
                    <div className="animate-spin w-8 h-8 border-4 brand-loading-spinner rounded-full mx-auto"></div>
                    <p className="mt-4 brand-loading-text">טוען זמנים זמינים...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="brand-text-muted">אין זמנים זמינים כרגע</p>
                    <p className="text-sm brand-text-muted opacity-70 mt-2">אנא נסה שוב מאוחר יותר</p>
                  </div>
                ) : (
                  <div>
                    {/* Time slots container with fixed height and scroll */}
                    <div className="brand-time-slots-container">
                      <div className="space-y-6">
                        {Object.entries(groupSlotsByDate(availableSlots)).map(([date, slots]) => (
                          <div key={date}>
                            <h3 className="brand-time-slot-header">
                              {formatDate(date)}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                              {slots.map((slot) => (
                                <button
                                  key={slot.id}
                                  type="button"
                                  onClick={() => handleSlotSelection(slot)}
                                  className={`p-2 md:p-3 rounded-lg border text-sm md:text-base transition-colors ${
                                    selectedSlot?.id === slot.id
                                      ? 'brand-time-slot-selected'
                                      : 'brand-time-slot-unselected'
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
                      <div className="mt-4 p-3 brand-selected-slot-indicator">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <Check className="w-4 h-4 brand-selected-slot-text" />
                          <span className="text-sm font-medium brand-selected-slot-text">
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
                <div className="brand-summary-container">
                  <h3 className="font-medium text-base md:text-lg">סיכום הבקשה</h3>
                  
                  <div className="space-y-3 text-xs md:text-sm">
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium w-full sm:w-24 mb-1 sm:mb-0">שם:</span>
                      <span className="break-words">{watch('full_name')}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium w-full sm:w-24 mb-1 sm:mb-0">טלפון:</span>
                      <span className="break-all">{watch('phone')}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium w-full sm:w-24 mb-1 sm:mb-0">דוא"ל:</span>
                      <span className="break-all">{watch('email')}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium w-full sm:w-24 mb-1 sm:mb-0">כתובת:</span>
                      <span className="break-words">{watch('address')}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium w-full sm:w-24 mb-1 sm:mb-0">דחיפות:</span>
                      <span>{URGENCY_LABELS[watch('urgency_level') as keyof typeof URGENCY_LABELS]}</span>
                    </div>
                    {selectedSlot && (
                      <div className="flex flex-col sm:flex-row">
                        <span className="font-medium w-full sm:w-24 mb-1 sm:mb-0">זמן:</span>
                        <span className="break-words">{formatDate(selectedSlot.date)} בשעה {selectedSlot.start_time}-{selectedSlot.end_time}</span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">תיאור הבעיה:</span>
                      <span className="mt-1 brand-summary-field">{watch('problem_description')}</span>
                    </div>
                    {watch('notes') && (
                      <div className="flex flex-col">
                        <span className="font-medium">הערות:</span>
                        <span className="mt-1 brand-summary-field">{watch('notes')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleStepBack}
                disabled={currentStep === 1}
                className="flex items-center justify-center space-x-reverse space-x-2 order-2 sm:order-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>הקודם</span>
              </Button>

              <Button
                type="submit"
                disabled={loading || (currentStep === 2 && !selectedSlot)}
                className="flex items-center justify-center space-x-reverse space-x-2 order-1 sm:order-2"
              >
                {loading ? (
                  <div className="animate-spin w-4 h-4 border-2 brand-loading-spinner-on-primary rounded-full"></div>
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