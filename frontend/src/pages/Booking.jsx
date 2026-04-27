import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Badge } from '../components/ui/badge';
import { CalendarIcon, Clock, DollarSign, User, Mail, Phone, CheckCircle, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Booking = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const selectedService = location.state?.selectedService || null;

  const nextStepRef = useRef(null);

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedServiceId, setExpandedServiceId] = useState(null);
  
  // Helper function to get localized field
  const getLocalizedField = (item, fieldName) => {
    const currentLang = i18n.language;
    const localizedFieldName = currentLang === 'de' ? `${fieldName}_de` : fieldName;
    return item[localizedFieldName] || item[fieldName] || '';
  };
  
  const [bookingData, setBookingData] = useState({
    serviceId: selectedService?.id || '',
    serviceName: selectedService?.name || '',
    serviceIds: selectedService?.id ? [selectedService.id] : [],
    serviceNames: selectedService?.name ? [selectedService.name] : [],
    barberServiceIds: [],
    barberId: '',
    barberName: '',
    barberServiceId: '',
    appointmentDate: null,
    appointmentTime: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Initialize data (barbers and services)
      await axios.post(`${API}/init-data`);
      
      // Fetch barbers first
      const barbersResponse = await axios.get(`${API}/barbers`);
      setBarbers(barbersResponse.data);
      
      // Don't fetch services yet - wait for barber selection
      setServices([]);
    } catch (err) {
      setError('Failed to load booking data');
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

  const fetchAvailableSlots = async (barberId, date, serviceId, serviceIds) => {
    if (!barberId || !date || !serviceId) return;
    
    try {
      setLoadingSlots(true);
      const allIds = serviceIds && serviceIds.length > 0 ? serviceIds : [serviceId];
      const response = await axios.get(`${API}/barbers/${barberId}/available-slots`, {
        params: {
          date: format(date, 'yyyy-MM-dd'),
          service_id: serviceId,
          service_ids: allIds.join(',')
        }
      });
      setAvailableSlots(response.data.slots || []);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      toast.error('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceSelect = (barberServiceId) => {
    const barberService = services.find(s => s.id === barberServiceId);
    const newServiceId = barberService?.service_id || '';
    const newServiceName = getLocalizedField(barberService, 'service_name');

    setBookingData(prev => {
      // Toggle selection: add if not present, remove if already selected
      const alreadySelected = prev.barberServiceIds.includes(barberServiceId);
      const newBarberServiceIds = alreadySelected
        ? prev.barberServiceIds.filter(id => id !== barberServiceId)
        : [...prev.barberServiceIds, barberServiceId];

      // Build service_ids and service_names arrays from selected barberServiceIds
      const selectedServices = newBarberServiceIds.map(bid => services.find(s => s.id === bid)).filter(Boolean);
      const newServiceIds = selectedServices.map(s => s.service_id);
      const newServiceNames = selectedServices.map(s => getLocalizedField(s, 'service_name'));

      // Primary service is the first selected
      const primaryServiceId = newServiceIds[0] || '';
      const primaryServiceName = newServiceNames[0] || '';
      const primaryBarberServiceId = newBarberServiceIds[0] || '';

      const newState = {
        ...prev,
        serviceId: primaryServiceId,
        serviceName: primaryServiceName,
        serviceIds: newServiceIds,
        serviceNames: newServiceNames,
        barberServiceId: primaryBarberServiceId,
        barberServiceIds: newBarberServiceIds,
        appointmentTime: '' // Reset time when service changes
      };

      // Fetch available slots if we have date and barber selected
      if (prev.barberId && prev.appointmentDate && primaryServiceId) {
        fetchAvailableSlots(prev.barberId, prev.appointmentDate, primaryServiceId, newServiceIds);
      }

      return newState;
    });

    if (nextStepRef.current) {
      setTimeout(() => {
        nextStepRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  const handleBarberSelect = (barberId) => {
    const barber = barbers.find(b => b.id === barberId);
    setBookingData(prev => ({
      ...prev,
      barberId: barberId,
      barberName: barber?.name || '',
      serviceId: '', // Reset service selection when barber changes
      serviceName: '',
      serviceIds: [],
      serviceNames: [],
      barberServiceId: '',
      barberServiceIds: []
    }));
    
    // Fetch services for this barber
    fetchBarberServices(barberId);
  };

  const handleDateSelect = (date) => {
    setBookingData(prev => ({
      ...prev,
      appointmentDate: date,
      appointmentTime: '' // Reset time when date changes
    }));
    
    // Fetch available slots if we have barber and service selected
    if (bookingData.barberId && bookingData.serviceId) {
      fetchAvailableSlots(bookingData.barberId, date, bookingData.serviceId, bookingData.serviceIds);
    }
  };

  const handleTimeSelect = (time) => {
    setBookingData(prev => ({
      ...prev,
      appointmentTime: time
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleServiceDescription = (serviceId) => {
    setExpandedServiceId(expandedServiceId === serviceId ? null : serviceId);
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 1:
        return bookingData.barberId !== '' && bookingData.serviceIds.length > 0;
      case 2:
        return bookingData.appointmentDate && bookingData.appointmentTime !== '';
      case 3:
        return bookingData.customerName !== '' && 
               bookingData.customerEmail !== '' && 
               bookingData.customerPhone !== '';
      default:
        return false;
    }
  };

  const canProceedToNext = (step) => {
    return isStepComplete(step);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const appointmentPayload = {
        customer_name: bookingData.customerName,
        customer_email: bookingData.customerEmail,
        customer_phone: bookingData.customerPhone,
        service_id: bookingData.serviceId,
        service_name: bookingData.serviceName,
        service_ids: bookingData.serviceIds,
        service_names: bookingData.serviceNames,
        barber_id: bookingData.barberId,
        barber_name: bookingData.barberName,
        barber_service_id: bookingData.barberServiceId,
        appointment_date: format(bookingData.appointmentDate, 'yyyy-MM-dd'),
        appointment_time: bookingData.appointmentTime + ':00'
      };

      const response = await axios.post(`${API}/appointments`, appointmentPayload);
      
      if (response.data) {
        toast.success('Appointment booked successfully! We\'ll contact you to confirm.');
        setCurrentStep(4); // Success step
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(t('booking.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedServiceDetails = services.find(s => s.id === bookingData.barberServiceId);
  const selectedServicesDetails = bookingData.barberServiceIds.map(bid => services.find(s => s.id === bid)).filter(Boolean);
  const totalSelectedDuration = selectedServicesDetails.reduce((sum, s) => sum + (s?.duration || 0), 0);
  const totalSelectedPrice = selectedServicesDetails.reduce((sum, s) => sum + (s?.price || 0), 0);

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
    <div className="min-h-screen bg-zinc-50 pt-16">
      <section className="section-padding">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
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
                    <div className={`w-12 h-1 ${
                      currentStep > step ? 'bg-yellow-600' : 'bg-zinc-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step Content */}
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

              {/* Step 1: Barber & Service Selection */}
              {currentStep === 1 && (
                <div className="space-y-8" data-testid="service-selection-step">
                  {/* Barber Selection */}
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
                              <h4 className="font-semibold text-zinc-900 mb-1">{barber.name}</h4>
                              <p className="text-sm text-zinc-600 mb-2">{getLocalizedField(barber, 'description')}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Service Selection - Only show after barber is selected */}
                  {bookingData.barberId && (
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                        {t('booking.chooseService')} {bookingData.barberName}
                      </h3>
                      <p className="text-sm text-zinc-500 mb-4">
                        Mehrere Services wählen möglich – Preise und Dauer werden addiert.
                      </p>
                      {services.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p>{t('booking.loadingServices')}</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {['Core Services', 'Color Services', 'Perm', 'Highlights / Bleaching', 'Waxing', 'Eyebrows'].map((category) => {
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
                                  {categoryServices.map((service) => (
                                    <div
                                      key={service.id}
                                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        bookingData.barberServiceIds.includes(service.id)
                                          ? 'border-yellow-600 bg-yellow-50'
                                          : 'border-zinc-200 hover:border-zinc-300'
                                      }`}
                                      onClick={() => handleServiceSelect(service.id)}
                                      data-testid={`service-option-${service.id}`}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1">
                                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            bookingData.barberServiceIds.includes(service.id)
                                              ? 'bg-yellow-600 border-yellow-600'
                                              : 'border-zinc-300'
                                          }`}>
                                            {bookingData.barberServiceIds.includes(service.id) && (
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
                                            aria-label="Toggle description"
                                          >
                                            <Info className="h-4 w-4 text-zinc-500" />
                                          </button>
                                        )}
                                      </div>
                                      
                                      {/* Collapsible Description */}
                                      {expandedServiceId === service.id && getLocalizedField(service, 'service_description') && (
                                        <p className="text-sm text-zinc-600 mb-3 pb-3 border-b border-zinc-200">
                                          {getLocalizedField(service, 'service_description')}
                                        </p>
                                      )}
                                      
                                      <div className="flex justify-between items-center">
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
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selection Summary */}
                  {bookingData.barberId && bookingData.barberServiceIds.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">{t('booking.selectionSummary')}</h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <p><strong>{t('booking.hairStylist')}:</strong> {bookingData.barberName}</p>
                        <div>
                          <strong>{t('booking.service')}:</strong>
                          <ul className="mt-1 ml-4 list-disc">
                            {bookingData.barberServiceIds.map(bid => {
                              const svc = services.find(s => s.id === bid);
                              if (!svc) return null;
                              return (
                                <li key={bid}>
                                  {getLocalizedField(svc, 'service_name')} &ndash; {svc.duration} min &ndash; {svc.price} EUR
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        {bookingData.barberServiceIds.length > 1 && (() => {
                          const selectedSvcs = bookingData.barberServiceIds.map(bid => services.find(s => s.id === bid)).filter(Boolean);
                          const totalDur = selectedSvcs.reduce((sum, s) => sum + s.duration, 0);
                          const totalPrice = selectedSvcs.reduce((sum, s) => sum + s.price, 0);
                          return (
                            <p className="mt-2 font-semibold border-t border-green-200 pt-2">
                              Gesamt: {totalDur} min &ndash; {totalPrice.toFixed(2)} EUR
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Date & Time Selection */}
              {currentStep === 2 && (
                <div className="space-y-6" data-testid="datetime-selection-step">
                  {selectedServicesDetails.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                      <h3 className="font-semibold text-zinc-900 mb-3">{t('booking.appointmentSummary')}:</h3>
                      <div className="space-y-2">
                        {bookingData.barberName && (
                          <p className="text-zinc-700"><strong>{t('booking.hairStylist')}:</strong> {bookingData.barberName}</p>
                        )}
                        {selectedServicesDetails.map(svc => (
                          <div key={svc.id} className="flex items-center justify-between">
                            <span className="text-zinc-700">{getLocalizedField(svc, 'service_name')}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">{svc.duration} min</Badge>
                              <span className="font-semibold text-green-600">{svc.price} EUR</span>
                            </div>
                          </div>
                        ))}
                        {selectedServicesDetails.length > 1 && (
                          <div className="flex items-center justify-between border-t border-yellow-200 pt-2 mt-2">
                            <span className="font-semibold text-zinc-800">Gesamt</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">{totalSelectedDuration} min</Badge>
                              <span className="font-semibold text-green-600">{totalSelectedPrice.toFixed(2)} EUR</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Calendar */}
                    <div>
                      <Label className="text-lg font-semibold text-zinc-900 mb-4 block">
                        {t('booking.selectDate')}
                      </Label>
                      <div className="calendar-container">
                        <Calendar
                          mode="single"
                          selected={bookingData.appointmentDate}
                          onSelect={handleDateSelect}
                          disabled={(date) => {
                            // Get today at midnight for accurate comparison
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const checkDate = new Date(date);
                            checkDate.setHours(0, 0, 0, 0);
                            
                            // Disable past dates (before today) and Sundays
                            return checkDate < today || date.getDay() === 0;
                          }}
                          className="rounded-md border bg-white relative z-10"
                          data-testid="appointment-calendar"
                        />
                      </div>
                    </div>

                    {/* Available Time Slots */}
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
                            >
                              {slot.time}
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
                        <strong>{t('booking.selected')}:</strong> {format(bookingData.appointmentDate, 'EEEE, MMMM d, yyyy')} at {bookingData.appointmentTime}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Contact Information */}
              {currentStep === 3 && (
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-info-step">
                  <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                    <h3 className="font-semibold text-zinc-900 mb-2">{t('booking.appointmentSummary')}:</h3>
                    <div className="space-y-1 text-sm text-zinc-700">
                      <p><strong>{t('booking.hairStylist')}:</strong> {bookingData.barberName}</p>
                      <div>
                        <strong>{t('booking.service')}:</strong>
                        {selectedServicesDetails.length === 1 ? (
                          <span> {bookingData.serviceName}</span>
                        ) : (
                          <ul className="ml-4 mt-1 list-disc">
                            {selectedServicesDetails.map(s => (
                              <li key={s.id}>{getLocalizedField(s, 'service_name')} ({s.duration} min, {s.price} EUR)</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <p><strong>{t('booking.date')}:</strong> {bookingData.appointmentDate && format(bookingData.appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
                      <p><strong>{t('booking.time')}:</strong> {bookingData.appointmentTime}</p>
                      <p><strong>{t('booking.duration')}:</strong> {totalSelectedDuration} {t('booking.minutes')}</p>
                      <p><strong>{t('booking.price')}:</strong> {totalSelectedPrice.toFixed(2)} EUR</p>
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
                      <p><strong>{t('booking.hairStylist')}:</strong> {bookingData.barberName}</p>
                      <div>
                        <strong>{t('booking.service')}:</strong>
                        {bookingData.serviceNames && bookingData.serviceNames.length > 1 ? (
                          <ul className="ml-4 mt-1 list-disc">
                            {bookingData.serviceNames.map((name, i) => <li key={i}>{name}</li>)}
                          </ul>
                        ) : (
                          <span> {bookingData.serviceName}</span>
                        )}
                      </div>
                      <p><strong>{t('booking.date')}:</strong> {bookingData.appointmentDate && format(bookingData.appointmentDate, 'EEEE, MMMM d, yyyy')}</p>
                      <p><strong>{t('booking.time')}:</strong> {bookingData.appointmentTime}</p>
                      <p><strong>{t('booking.success.customer')}:</strong> {bookingData.customerName}</p>
                      <p><strong>{t('booking.success.contact')}:</strong> {bookingData.customerEmail}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={() => {
                      setCurrentStep(1);
                      setBookingData({
                        serviceId: '',
                        serviceName: '',
                        serviceIds: [],
                        serviceNames: [],
                        barberId: '',
                        barberName: '',
                        barberServiceId: '',
                        barberServiceIds: [],
                        appointmentDate: null,
                        appointmentTime: '',
                        customerName: '',
                        customerEmail: '',
                        customerPhone: ''
                      });
                          
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }, 0);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    data-testid="book-another-btn"
                  >
                    {t('booking.success.bookAnother')}
                  </Button>
                </div>
              )}

              {/* Navigation Buttons */}
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
                          setTimeout(() => {
                             window.scrollTo({ top: 0, behavior: "smooth" });
                           }, 0);
                      }}
                      disabled={!canProceedToNext(currentStep)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      data-testid="next-step-btn"
                    >
                      {t('booking.nextStep')}
                    </Button>
                  ) : (
                    <Button
                      onClick={(e) => {
                        handleSubmit(e);

                        setTimeout(() => {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }, 0);
                      }}
                      disabled={!canProceedToNext(currentStep) || submitting}
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
    </div>
  );
};

export default Booking;