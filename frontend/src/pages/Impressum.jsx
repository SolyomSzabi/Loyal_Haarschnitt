import React from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, Mail, User, Globe } from 'lucide-react';

const Impressum = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold font-heading text-zinc-900 mb-3">
            {t('impressum.title')}
          </h1>
          <div className="w-16 h-1 bg-yellow-600 rounded-full"></div>
          <p className="mt-4 text-zinc-500 text-sm">
            {t('impressum.legalNote')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          {/* Section: Angaben gemäß § 5 TMG */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block"></span>
              {t('impressum.section1.title')}
            </h2>
            <div className="space-y-3 text-zinc-700">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-zinc-900">Loyal Haarschnitt</p>
                  <p>{t('impressum.section1.owner')}: Sarok Ahmed Omar</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div>
                  <p>Moosburger Str. 12A</p>
                  <p>85406 Zolling</p>
                  <p>Deutschland</p>
                </div>
              </div>
              <p className="pl-8">{t('impressum.steuernummer')}: {t('impressum.steuernummerValue')}</p>
            </div>
          </div>

          {/* Section: Kontakt */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-xl font-semibold text-zinc-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block"></span>
              {t('impressum.section2.title')}
            </h2>
            <div className="space-y-3 text-zinc-700">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-yellow-600 shrink-0" />
                <a href="tel:+4915569167244" className="hover:text-yellow-600 transition-colors">
                  +49 155 691 672 44
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-yellow-600 shrink-0" />
                <a href="mailto:info@loyalhaarschnitt.de" className="hover:text-yellow-600 transition-colors">
                  info@loyalhaarschnitt.de
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-yellow-600 shrink-0" />
                <a href="https://www.loyalhaarschnitt.de" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-600 transition-colors">
                  www.loyalhaarschnitt.de
                </a>
              </div>
            </div>
          </div>

          {/* Section: Verantwortlich für den Inhalt */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block"></span>
              {t('impressum.section3.title')}
            </h2>
            <p className="text-zinc-700">{t('impressum.section3.text')}</p>
            <div className="mt-3 text-zinc-700">
              <p className="font-semibold">Sarok Ahmed Omar</p>
              <p>Moosburger Str. 12A</p>
              <p>85406 Zolling</p>
            </div>
          </div>

          {/* Section: Berufsrechtliche Regelungen */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block"></span>
              {t('impressum.section4.title')}
            </h2>
            <div className="text-zinc-700 space-y-2">
              <p>{t('impressum.section4.berufsbezeichnung')}: {t('impressum.section4.berufsbezeichnungValue')}</p>
              <p>{t('impressum.section4.zustaendigeKammer')}: {t('impressum.section4.zustaendigeKammerValue')}</p>
              <p>{t('impressum.section4.betriebsNr')}: {t('impressum.section4.betriebsNrValue')}</p>
              <p>{t('impressum.section4.eingetragenSeit')}: {t('impressum.section4.eingetragenSeitValue')}</p>
              <p>{t('impressum.section4.verliehen')}: {t('impressum.section4.verliehenValue')}</p>
            </div>
          </div>

          {/* Section: Streitschlichtung */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block"></span>
              {t('impressum.section5.title')}
            </h2>
            <div className="text-zinc-700 space-y-3">
              <p>{t('impressum.section5.euText')}</p>
              <p>
                {t('impressum.section5.euLink')}:{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p>{t('impressum.section5.noObligation')}</p>
            </div>
          </div>

          {/* Section: Haftung für Inhalte */}
          <div className="p-8 border-b border-zinc-100">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block"></span>
              {t('impressum.section6.title')}
            </h2>
            <p className="text-zinc-700 leading-relaxed">
              {t('impressum.section6.text')}
            </p>
          </div>

          {/* Section: Haftung für Links */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block"></span>
              {t('impressum.section7.title')}
            </h2>
            <p className="text-zinc-700 leading-relaxed">
              {t('impressum.section7.text')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Impressum;
