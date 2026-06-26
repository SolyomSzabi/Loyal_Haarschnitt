import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Badge } from '../components/ui/badge';
import { CalendarIcon, Clock, CheckCircle, Loader2, Info, X, Award } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';
import masterCertificate from '../assets/master-certificate.jpeg';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getBerlinNow = () => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year  = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day   = parts.find(p => p.type === 'day').value;
    return new Date(`${year}-${month}-${day}T00:00:00`);
  } catch {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
};

const BARBER_PROFILES = ['Sarok'];

const Booking = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const nextStepRef = useRef(null);

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  const [selectedBarberProfile, setSelectedBarberProfile] = useState(null);
  const [widerrufsAgreed, setWiderrufsAgreed] = useState(false);

  const getLocalizedField = (item, fieldName) => {
    const currentLang = i18n.language;
    const localizedFieldName = currentLang === 'de' ? `${fieldName}_de` : fieldName;
    return item[localizedFieldName] || item[fieldName] || '';
  };

  const [bookingData, setBookingData] = useState({
    barberId: '',
    barberName: '',
    appointmentDate: null,
    appointmentTime: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/init-data`);
      const barbersResponse = await axios.get(`${API}/barbers`);
      setBarbers(barbersResponse.data);
      setServices([]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarberServices = async (barberId) => {
    try {
      const response = await axios.get(`${API}/barbers/${barberId}/services`);
      setServices(response.data);
    } catch (err) {
      console.error('Error fetching barber services:', err);
      toast.error('Failed to load services for selected barber');
      setServices([]);
    }
  };

  const fetchAvailableSlotsWithDuration = async (barberId, date, duration, services) => {
    if (!barberId || !date || duration <= 0 || services.length === 0) return;
    try {
      setLoadingSlots(true);
      const firstServiceId = services[0]?.service_id;
      const response = await axios.get(`${API}/barbers/${barberId}/available-slots`, {
        params: {
          date: format(date, 'yyyy-MM-dd'),
          service_id: firstServiceId,
          override_duration: duration
        }
      });
      setAvailableSlots(response.data.slots || []);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const alreadySelected = prev.some(s => s.id === service.id);
      const updated = alreadySelected
        ? prev.filter(s => s.id !== service.id)
        : [...prev, service];

      if (bookingData.barberId && bookingData.appointmentDate) {
        const newDuration = updated.reduce((sum, s) => sum + (s.duration || 0), 0);
        if (newDuration > 0) {
          fetchAvailableSlotsWithDuration(bookingData.barberId, bookingData.appointmentDate, newDuration, updated);
        } else {
          setAvailableSlots([]);
        }
      }

      setBookingData(prev => ({ ...prev, appointmentTime: '' }));
      return updated;
    });
  };

  const handleBarberSelect = (barberId) => {
    const barber = barbers.find(b => b.id === barberId);
    setBookingData(prev => ({
      ...prev,
      barberId: barberId,
      barberName: barber?.name || '',
      appointmentTime: ''
    }));
    setSelectedServices([]);
    setAvailableSlots([]);
    fetchBarberServices(barberId);
  };

  const handleDateSelect = (date) => {
    setBookingData(prev => ({
      ...prev,
      appointmentDate: date,
      appointmentTime: ''
    }));

    if (bookingData.barberId && totalDuration > 0) {
      fetchAvailableSlotsWithDuration(bookingData.barberId, date, totalDuration, selectedServices);
    }
  };

  const handleTimeSelect = (time) => {
    setBookingData(prev => ({ ...prev, appointmentTime: time }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const toggleServiceDescription = (serviceId) => {
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 1:
        return bookingData.barberId !== '' && selectedServices.length > 0;
      case 2:
        return bookingData.appointmentDate && bookingData.appointmentTime !== '';
      case 3:
        return bookingData.customerName !== '' &&
               bookingData.customerEmail !== '' &&
               bookingData.customerPhone !== '' &&
               widerrufsAgreed;
      default:
        return false;
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    try {
      let currentTime = bookingData.appointmentTime;

      for (let i = 0; i < selectedServices.length; i++) {
        const service = selectedServices[i];

        const appointmentPayload = {
          customer_name: bookingData.customerName,
          customer_email: bookingData.customerEmail,
          customer_phone: bookingData.customerPhone,
          service_id: service.service_id,
          service_name: getLocalizedField(service, 'service_name'),
          barber_id: bookingData.barberId,
          barber_name: bookingData.barberName,
          barber_service_id: service.id,
          appointment_date: format(bookingData.appointmentDate, 'yyyy-MM-dd'),
          appointment_time: currentTime + ':00',
          duration: service.duration,
          ...(i === 0 && {
            all_service_names: selectedServices.map(s => getLocalizedField(s, 'service_name')),
            all_service_durations: selectedServices.map(s => s.duration),
            all_service_prices: selectedServices.map(s => s.price),
          })
        };

        await axios.post(`${API}/appointments`, appointmentPayload);

        const [h, m] = currentTime.split(':').map(Number);
        const nextMinutes = h * 60 + m + service.duration;
        const nextH = Math.floor(nextMinutes / 60);
        const nextM = nextMinutes % 60;
        currentTime = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
      }

      toast.success(t('booking.success.title'));
      setCurrentStep(4);
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(t('booking.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-yellow-600" />
          <p className="text-zinc-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-16" translate="no">
      <section className="section-padding">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-zinc-900 mb-6">
              {t('booking.title')}
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              {t('booking.subtitle')}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                    currentStep >= step
                      ? 'bg-yellow-600 text-white'
                      : isStepComplete(step)
                        ? 'bg-green-600 text-white'
                        : 'bg-zinc-200 text-zinc-600'
                  }`}>
                    {isStepComplete(step) && currentStep > step ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 ${currentStep > step ? 'bg-yellow-600' : 'bg-zinc-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-zinc-900">
                {currentStep === 1 && t('booking.steps.selectService')}
                {currentStep === 2 && t('booking.steps.datetime')}
                {currentStep === 3 && t('booking.steps.contactInfo')}
                {currentStep === 4 && t('booking.steps.confirmed')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-8" data-testid="service-selection-step">

                  {/* Barber selection */}
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                      {t('booking.selectBarber')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {barbers.map((barber) => (
                        <div
                          key={barber.id}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            bookingData.barberId === barber.id
                              ? 'border-yellow-600 bg-yellow-50'
                              : 'border-zinc-200 hover:border-zinc-300'
                          }`}
                          onClick={() => handleBarberSelect(barber.id)}
                          data-testid={`barber-option-${barber.id}`}
                        >
                          <div className="flex items-start space-x-3">
                            <img
                              src={barber.image_url}
                              alt={barber.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-zinc-900">{barber.name}</h4>
                                {BARBER_PROFILES.includes(barber.name) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBarberProfile({
                                        ...barber,
                                        title: t('barberProfile.masterBarber'),
                                        bio: [
                                          t('barberProfile.bio.line1'),
                                          t('barberProfile.bio.line2'),
                                          t('barberProfile.bio.line3'),
                                        ],
                                        certificate: masterCertificate,
                                      });
                                    }}
                                    className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-2 py-0.5 rounded-full transition-colors"
                                    title={t('barberProfile.masterBarber')}
                                  >
                                    <Award className="h-3 w-3" />
                                    <span>{t('barberProfile.masterBarber')}</span>
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-zinc-600">{getLocalizedField(barber, 'description')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Multi-service selection */}
                  {bookingData.barberId && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {t('booking.chooseService')} {bookingData.barberName}
                        </h3>
                        <span className="text-sm text-zinc-400 italic">
                          {i18n.language === 'de'
                            ? 'Mehrere Services wählbar'
                            : 'Select one or more services'}
                        </span>
                      </div>

                      {selectedServices.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                          <h4 className="font-semibold text-yellow-800 mb-3 text-sm">
                            {i18n.language === 'de' ? 'Ausgewählte Services' : 'Selected Services'}
                          </h4>
                          <div className="space-y-2">
                            {selectedServices.map((s) => (
                              <div key={s.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleServiceToggle(s)}
                                    className="text-yellow-600 hover:text-red-500 transition-colors"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="text-sm text-zinc-800">{getLocalizedField(s, 'service_name')}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <span className="text-zinc-500">{s.duration} min</span>
                                  <span className="font-medium text-green-700">{s.price} EUR</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-yellow-200 mt-3 pt-3 flex justify-between text-sm font-semibold text-yellow-900">
                            <span>{i18n.language === 'de' ? 'Gesamt' : 'Total'}</span>
                            <span>{totalPrice} EUR &nbsp;·&nbsp; {totalDuration} min</span>
                          </div>
                        </div>
                      )}

                      {services.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p>{t('booking.loadingServices')}</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {['Core Services', 'Color Services', 'Dauerwelle (Perm)', 'Highlights / Bleaching', 'Waxing', 'Eyebrows'].map((category) => {
                            const categoryServices = services.filter(s => s.category === category);
                            if (categoryServices.length === 0) return null;

                            return (
                              <div key={category}>
                                <h4 className="text-md font-semibold text-zinc-700 mb-3 flex items-center">
                                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                                    {category}
                                  </span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {categoryServices.map((service) => {
                                    const isSelected = selectedServices.some(s => s.id === service.id);
                                    return (
                                      <div
                                        key={service.id}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                          isSelected
                                            ? 'border-yellow-600 bg-yellow-50'
                                            : 'border-zinc-200 hover:border-zinc-300'
                                        }`}
                                        onClick={() => handleServiceToggle(service)}
                                        data-testid={`service-option-${service.id}`}
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2 flex-1">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                              isSelected ? 'border-yellow-600 bg-yellow-600' : 'border-zinc-300'
                                            }`}>
                                              {isSelected && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                              )}
                                            </div>
                                            <h4 className="font-semibold text-zinc-900">
                                              {getLocalizedField(service, 'service_name')}
                                            </h4>
                                          </div>
                                          {getLocalizedField(service, 'service_description').trim() !== '' && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleServiceDescription(service.id);
                                              }}
                                              className="ml-2 p-1 hover:bg-zinc-100 rounded-full transition-colors"
                                            >
                                              <Info className="h-4 w-4 text-zinc-500" />
                                            </button>
                                          )}
                                        </div>

                                        {expandedServiceId === service.id && getLocalizedField(service, 'service_description') && (
                                          <p className="text-sm text-zinc-600 mb-3 pb-3 border-b border-zinc-200 ml-7">
                                            {getLocalizedField(service, 'service_description')}
                                          </p>
                                        )}

                                        <div className="flex justify-between items-center ml-7">
                                          <div className="flex items-center space-x-3">
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                              <Clock className="h-3 w-3 mr-1" />
                                              {service.duration} min
                                            </Badge>
                                            <div className="text-green-600 font-semibold text-sm">
                                              {service.price} EUR
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {bookingData.barberId && selectedServices.length === 0 && services.length > 0 && (
                    <p className="text-sm text-amber-600 text-center">
                      {i18n.language === 'de'
                        ? 'Bitte wählen Sie mindestens einen Service aus.'
                        : 'Please select at least one service to continue.'}
                    </p>
                  )}
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-6" data-testid="datetime-selection-step">

                  <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-zinc-900 mb-3">{t('booking.appointmentSummary')}:</h3>
                    <div className="space-y-2">
                      {selectedServices.map((s) => (
                        <div key={s.id} className="flex items-center justify-between text-sm">
                          <span className="text-zinc-700">{getLocalizedField(s, 'service_name')}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{s.duration} min</Badge>
                            <span className="font-semibold text-green-600">{s.price} EUR</span>
                          </div>
                        </div>
                      ))}
                      {selectedServices.length > 1 && (
                        <div className="border-t border-yellow-200 pt-2 mt-2 flex justify-between text-sm font-semibold text-zinc-800">
                          <span>{i18n.language === 'de' ? 'Gesamt' : 'Total'}</span>
                          <span>{totalPrice} EUR &nbsp;·&nbsp; {totalDuration} min</span>
                        </div>
                      )}
                      {bookingData.barberName && (
                        <p className="text-sm text-zinc-700 pt-1">
                          <strong>{t('booking.hairStylist')}:</strong> {bookingData.barberName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <Label className="text-lg font-semibold text-zinc-900 mb-4 block">
                        {t('booking.selectDate')}
                      </Label>
                      <div className="calendar-container">
                        <Calendar
                          weekStartsOn={1}
                          mode="single"
                          selected={bookingData.appointmentDate}
                          onSelect={handleDateSelect}
                          disabled={(date) => {
                            const today = getBerlinNow();
                            today.setHours(0, 0, 0, 0);
                            const checkDate = new Date(date);
                            checkDate.setHours(0, 0, 0, 0);
                            return checkDate < today || date.getDay() === 0;
                          }}
                          className="rounded-md border bg-white relative z-10"
                          data-testid="appointment-calendar"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-lg font-semibold text-zinc-900 mb-4 block">
                        {t('booking.availableSlots')}
                      </Label>
                      {!bookingData.appointmentDate ? (
                        <div className="text-center py-8 text-zinc-500">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                          <p>{t('booking.pleaseSelectDate')}</p>
                        </div>
                      ) : loadingSlots ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-yellow-600" />
                          <p className="text-zinc-600">{t('booking.loadingSlots')}</p>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-zinc-300" />
                          <p>{t('booking.noAvailableSlots')}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                          {availableSlots.map((slot) => (
                            <Button
                              key={slot.time}
                              variant={bookingData.appointmentTime === slot.time ? "default" : "outline"}
                              onClick={() => slot.available && handleTimeSelect(slot.time)}
                              disabled={!slot.available}
                              className={`text-sm ${
                                bookingData.appointmentTime === slot.time
                                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                  : slot.available
                                    ? 'border-zinc-300 hover:bg-zinc-50'
                                    : 'border-red-200 bg-red-50 text-red-400 cursor-not-allowed'
                              }`}
                              data-testid={`time-slot-${slot.time}`}
                              translate="no"
                            >
                              <span translate="no">{slot.time}</span>
                              {!slot.available && (
                                <span className="block text-xs mt-1">{t('booking.unavailable')}</span>
                              )}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {bookingData.appointmentDate && bookingData.appointmentTime && (
                    <div className="bg-green-50 p-4 rounded-lg mt-6">
                      <p className="text-green-800">
                        <strong>{t('booking.selected')}:</strong>{' '}
                        <span translate="no">{format(bookingData.appointmentDate, 'EEEE, MMMM d, yyyy')} at {bookingData.appointmentTime}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3 */}
              {currentStep === 3 && (
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-info-step">

                  <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-zinc-900 mb-2">{t('booking.appointmentSummary')}:</h3>
                    <div className="space-y-1 text-sm text-zinc-700">
                      {selectedServices.map((s, i) => (
                        <p key={s.id}>
                          {i === 0
                            ? <><strong>{t('booking.service')}:</strong> {getLocalizedField(s, 'service_name')} ({s.duration} min, {s.price} EUR)</>
                            : <>+ {getLocalizedField(s, 'service_name')} ({s.duration} min, {s.price} EUR)</>
                          }
                        </p>
                      ))}
                      {selectedServices.length > 1 && (
                        <p className="font-semibold pt-1 border-t border-yellow-200 mt-1">
                          {i18n.language === 'de' ? 'Gesamt' : 'Total'}: {totalPrice} EUR · {totalDuration} min
                        </p>
                      )}
                      <p><strong>{t('booking.hairStylist')}:</strong> {bookingData.barberName}</p>
                      <p><strong>{t('booking.date')}:</strong> {bookingData.appointmentDate && format(bookingData.appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
                      <p><strong>{t('booking.time')}:</strong> {bookingData.appointmentTime}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="customerName" className="text-zinc-700 font-medium">
                        {t('booking.fullName')} *
                      </Label>
                      <Input
                        id="customerName"
                        name="customerName"
                        type="text"
                        required
                        value={bookingData.customerName}
                        onChange={handleInputChange}
                        className="mt-2 form-input"
                        placeholder={t('booking.fullName')}
                        data-testid="customer-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone" className="text-zinc-700 font-medium">
                        {t('booking.phone')} *
                      </Label>
                      <Input
                        id="customerPhone"
                        name="customerPhone"
                        type="tel"
                        required
                        value={bookingData.customerPhone}
                        onChange={handleInputChange}
                        className="mt-2 form-input"
                        placeholder={t('booking.phone')}
                        data-testid="customer-phone-input"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerEmail" className="text-zinc-700 font-medium">
                      {t('booking.email')} *
                    </Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      required
                      value={bookingData.customerEmail}
                      onChange={handleInputChange}
                      className="mt-2 form-input"
                      placeholder={t('booking.email')}
                      data-testid="customer-email-input"
                    />
                  </div>

                  <div className="bg-zinc-50 p-4 rounded-lg">
                    <p className="text-sm text-zinc-600">
                      <strong>{t('booking.note')}:</strong> {t('booking.noteText')}
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800 mb-3">
                      {t('booking.widerrufshinweis')}
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={widerrufsAgreed}
                        onChange={(e) => setWiderrufsAgreed(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-amber-400 accent-yellow-600 shrink-0"
                        data-testid="widerruf-checkbox"
                      />
                      <span className="text-sm text-amber-900 font-medium">
                        {t('booking.widerrufsCheckbox')}
                      </span>
                    </label>
                  </div>
                </form>
              )}

              {/* Step 4: Success */}
              {currentStep === 4 && (
                <div className="text-center py-8" data-testid="booking-success">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-zinc-900 mb-4">
                    {t('booking.success.title')}
                  </h2>
                  <p className="text-zinc-600 mb-6">
                    {t('booking.success.message')}
                  </p>

                  <div className="bg-zinc-50 p-6 rounded-lg text-left max-w-md mx-auto mb-6">
                    <h3 className="font-semibold text-zinc-900 mb-3">{t('booking.success.details')}:</h3>
                    <div className="space-y-2 text-sm">
                      {selectedServices.map((s, i) => (
                        <p key={s.id}>
                          <strong>{i === 0 ? t('booking.service') : '+'}</strong>{' '}
                          {getLocalizedField(s, 'service_name')}
                        </p>
                      ))}
                      <p><strong>{t('booking.hairStylist')}:</strong> {bookingData.barberName}</p>
                      <p><strong>{t('booking.date')}:</strong> {bookingData.appointmentDate && format(bookingData.appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
                      <p><strong>{t('booking.time')}:</strong> {bookingData.appointmentTime}</p>
                      <p><strong>{t('booking.success.customer')}:</strong> {bookingData.customerName}</p>
                      <p><strong>{t('booking.success.contact')}:</strong> {bookingData.customerEmail}</p>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      setCurrentStep(1);
                      setSelectedServices([]);
                      setBookingData({
                        barberId: '',
                        barberName: '',
                        appointmentDate: null,
                        appointmentTime: '',
                        customerName: '',
                        customerEmail: '',
                        customerPhone: ''
                      });
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    data-testid="book-another-btn"
                  >
                    {t('booking.success.bookAnother')}
                  </Button>
                </div>
              )}

              {/* Navigation */}
              {currentStep < 4 && (
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    data-testid="prev-step-btn"
                  >
                    {t('booking.previous')}
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      ref={nextStepRef}
                      onClick={() => {
                        setCurrentStep(currentStep + 1);
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
                      }}
                      disabled={!isStepComplete(currentStep)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      data-testid="next-step-btn"
                    >
                      {t('booking.nextStep')}
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => {
                        handleSubmit(e);
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
                      }}
                      disabled={!isStepComplete(currentStep) || submitting}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      data-testid="book-appointment-btn"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t('booking.booking')}
                        </>
                      ) : (
                        t('booking.bookingButton')
                      )}
                    </Button>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </section>

      {/* Barber Profile Modal */}
      {selectedBarberProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedBarberProfile(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-zinc-900 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedBarberProfile.image_url}
                  alt={selectedBarberProfile.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400"
                />
                <div>
                  <h2 className="text-white font-bold text-xl">{selectedBarberProfile.name}</h2>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <Award className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">{selectedBarberProfile.title}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedBarberProfile(null)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Bio */}
            <div className="px-6 py-5 space-y-3">
              {selectedBarberProfile.bio.map((line, i) => (
                <p key={i} className="text-zinc-700 text-sm leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Certificate */}
            <div className="px-6 pb-6">
              <div className="border border-zinc-200 rounded-xl overflow-hidden">
                <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-semibold text-zinc-700">{t('barberProfile.certificate')}</span>
                </div>
                <img
                  src={selectedBarberProfile.certificate}
                  alt="Meisterbrief"
                  className="w-full object-contain max-h-72"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div
                  style={{ display: 'none' }}
                  className="items-center justify-center py-8 text-zinc-400 text-sm"
                >
                  {t('barberProfile.certificateSoon')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;