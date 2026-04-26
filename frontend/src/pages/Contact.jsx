import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';

const Contact = () => {
  const { t } = useTranslation();
  
  const contactInfo = [
    {
      icon: <MapPin className="h-6 w-6 text-yellow-600" />,
      titleKey: 'contact.info.address',
      details: ['Str. Ratinului, nr.959', 'Crasna, Sălaj, Romania'],
      action: 'Get Directions',
      href: 'https://maps.app.goo.gl/WBzEgHZjskunGrJa7'
    },
    {
      icon: <Phone className="h-6 w-6 text-yellow-600" />,
      titleKey: 'contact.info.phone',
      details: ['+49 1573 5342854'],
      action: 'Call Now',
      href: 'tel:+4915735342854'
    },
    {
      icon: <Mail className="h-6 w-6 text-yellow-600" />,
      titleKey: 'contact.info.email',
      details: ['info@loyalhaarschnitt.de'],
      action: 'Send Email',
      href: 'mailto:info@loyalhaarschnitt.de'
    }
  ];

  const businessHours = [
    { dayKey: 'contact.schedule.weekdays', hours: '10:00 AM - 7:00 PM' },
    { dayKey: 'contact.schedule.saturday', hours: '9:00 AM - 4:00 PM' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 pt-16">
      {/* Header Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-heading text-zinc-900 mb-6">
            {t('contact.title')}
          </h1>
          <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold font-heading text-zinc-900 mb-6">
                  {t('contact.getInTouch.title')}
                </h2>
                <p className="text-lg text-zinc-600 mb-8">
                  {t('contact.getInTouch.subtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {contactInfo.map((info, index) => (
                  <a
                    key={index}
                    href={info.href}
                    target={info.href.startsWith('http') ? '_blank' : undefined}
                    rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="block"
                  >
                  <Card className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow hover:ring-2 hover:ring-yellow-400 cursor-pointer" data-testid={`contact-info-${index}`}>
                    <CardContent className="p-0">
                      <div className="flex items-start space-x-4">
                        <div className="bg-yellow-100 rounded-full p-3 flex-shrink-0">
                          {info.icon}
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-semibold text-zinc-900 mb-2">
                            {t(info.titleKey)}
                          </h3>
                          {info.details.map((detail, idx) => (
                            <p key={idx} className="text-zinc-600 text-sm">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  </a>
                ))}
              </div>

              {/* Business Hours */}
              <div className="max-w-3xl mx-auto">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span>{t('contact.info.hours')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {businessHours.map((schedule, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <span className="font-medium text-zinc-900">{t(schedule.dayKey)}</span>
                          <span className="text-zinc-600">{schedule.hours}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <CheckCircle className="h-4 w-4 inline mr-2" />
                        {t('contact.openDaysNote')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-zinc-900 mb-6">
              {t('contact.findUs')}
            </h2>
          </div>

          <div className="relative w-full h-[450px] rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2646.2610343501633!2d11.775377700000002!3d48.4515209!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479e41be23c3de65%3A0xc1c5d1f8ec58ee41!2sLoyal%20Haarschnitt!5e0!3m2!1shu!2sro!4v1776968319488!5m2!1shu!2sro"
              className="absolute top-0 left-0 w-full h-full"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;