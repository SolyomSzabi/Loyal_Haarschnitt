import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';

const Datenschutz = () => {
  const { t } = useTranslation();

  const Section = ({ titleKey, children }) => (
    <div className="p-8 border-b border-zinc-100 last:border-b-0">
      <h2 className="text-xl font-semibold text-zinc-900 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-yellow-600 rounded-full inline-block shrink-0"></span>
        {t(titleKey)}
      </h2>
      <div className="text-zinc-700 leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-600 p-2 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold font-heading text-zinc-900">
              {t('datenschutz.title')}
            </h1>
          </div>
          <div className="w-16 h-1 bg-yellow-600 rounded-full ml-14"></div>
          <p className="mt-4 text-zinc-500 text-sm ml-14">
            {t('datenschutz.lastUpdated')}: Juni 2026
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">

          {/* 1. Verantwortlicher */}
          <Section titleKey="datenschutz.s1.title">
            <p>{t('datenschutz.s1.text')}</p>
            <div className="bg-zinc-50 rounded-lg p-4 text-sm">
              <p className="font-semibold text-zinc-900">Loyal Haarschnitt</p>
              <p>{t('datenschutz.s1.owner')}: Sarok Mustafa Ahmed Omer</p>
              <p>Moosburger Str. 12A, 85406 Zolling</p>
              <p>Tel.: +49 155 69167244</p>
              <p>E-Mail: info@loyalhaarschnitt.de</p>
            </div>
          </Section>

          {/* 2. Erhebung und Speicherung personenbezogener Daten */}
          <Section titleKey="datenschutz.s2.title">
            <p>{t('datenschutz.s2.text')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('datenschutz.s2.item1')}</li>
              <li>{t('datenschutz.s2.item2')}</li>
              <li>{t('datenschutz.s2.item3')}</li>
              <li>{t('datenschutz.s2.item4')}</li>
            </ul>
          </Section>

          {/* 3. Terminbuchung */}
          <Section titleKey="datenschutz.s3.title">
            <p>{t('datenschutz.s3.text')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('datenschutz.s3.item1')}</li>
              <li>{t('datenschutz.s3.item2')}</li>
              <li>{t('datenschutz.s3.item3')}</li>
            </ul>
            <p>{t('datenschutz.s3.legal')}</p>
          </Section>

          {/* 4. Kontaktformular */}
          <Section titleKey="datenschutz.s4.title">
            <p>{t('datenschutz.s4.text')}</p>
            <p>{t('datenschutz.s4.legal')}</p>
          </Section>

          {/* 5. Weitergabe von Daten */}
          <Section titleKey="datenschutz.s5.title">
            <p>{t('datenschutz.s5.text')}</p>
          </Section>

          {/* 6. Speicherdauer */}
          <Section titleKey="datenschutz.s6.title">
            <p>{t('datenschutz.s6.text')}</p>
          </Section>

          {/* 7. Ihre Rechte */}
          <Section titleKey="datenschutz.s7.title">
            <p>{t('datenschutz.s7.intro')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>{t('datenschutz.s7.r1.name')}:</strong> {t('datenschutz.s7.r1.desc')}</li>
              <li><strong>{t('datenschutz.s7.r2.name')}:</strong> {t('datenschutz.s7.r2.desc')}</li>
              <li><strong>{t('datenschutz.s7.r3.name')}:</strong> {t('datenschutz.s7.r3.desc')}</li>
              <li><strong>{t('datenschutz.s7.r4.name')}:</strong> {t('datenschutz.s7.r4.desc')}</li>
              <li><strong>{t('datenschutz.s7.r5.name')}:</strong> {t('datenschutz.s7.r5.desc')}</li>
              <li><strong>{t('datenschutz.s7.r6.name')}:</strong> {t('datenschutz.s7.r6.desc')}</li>
            </ul>
            <p>{t('datenschutz.s7.contact')}: <a href="mailto:info@loyalhaarschnitt.de" className="text-yellow-600 hover:underline">info@loyalhaarschnitt.de</a></p>
            <p>{t('datenschutz.s7.supervisory')}: <a href="https://www.lda.bayern.de" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)</a></p>
          </Section>

          {/* 8. Cookies */}
          <Section titleKey="datenschutz.s8.title">
            <p>{t('datenschutz.s8.text')}</p>
          </Section>

          {/* 9. Änderungen */}
          <Section titleKey="datenschutz.s9.title">
            <p>{t('datenschutz.s9.text')}</p>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default Datenschutz;
