import React from 'react';
import { Clock, ExternalLink, MapPin, Phone } from 'lucide-react';
import { Language, StoreInfo } from '../types';
import { getT } from '../i18n/translations';
import { BigBenIcon } from './Icons';

interface AboutMapSectionProps {
  lang: Language;
  storeInfo: StoreInfo;
}

export function AboutMapSection({ lang, storeInfo }: AboutMapSectionProps) {
  const t = getT(lang);
  const about = lang === 'ar' ? storeInfo.aboutAr : storeInfo.aboutEn;
  const address = lang === 'ar' ? storeInfo.addressAr : storeInfo.addressEn;
  const hours = lang === 'ar' ? storeInfo.hoursAr : storeInfo.hoursEn;

  return (
    <section id="about" className="py-12 sm:py-16 border-b border-[#111111]/12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left: Store Story & Info */}
        <div className="lg:col-span-5 bg-white border border-[#111111]/15 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 text-[#1C2A52]">
              <BigBenIcon className="w-5 h-5" />
              <span className="font-display text-xs uppercase tracking-[0.2em] font-semibold">
                {lang === 'ar' ? 'زحلة · البقاع' : 'Zahle · Bekaa'}
              </span>
            </div>

            <h2
              className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#111111]"
              style={{ textWrap: 'balance' }}
            >
              {t.aboutTitle}
            </h2>

            <p className="text-sm sm:text-base text-[#2B2B2B] leading-relaxed">{about}</p>
          </div>

          <div className="space-y-3.5 pt-4 border-t border-[#111111]/10 text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#C8312B] mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#2B2B2B]/65">
                  {t.locationLabel}
                </span>
                <span className="font-medium text-[#111111]">{address}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#C8312B] mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#2B2B2B]/65">
                  {t.hoursLabel}
                </span>
                <span className="font-medium text-[#111111]">{hours}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#C8312B] mt-0.5 shrink-0" />
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#2B2B2B]/65">
                  {t.phoneLabel}
                </span>
                <a
                  href={`tel:+961${storeInfo.phoneDisplay.replace(/\s+/g, '').replace(/^0/, '')}`}
                  dir="ltr"
                  className="font-semibold text-[#111111] hover:text-[#C8312B] tabular-nums"
                >
                  {storeInfo.phoneDisplay}
                </a>
              </div>
            </div>
          </div>

          {storeInfo.mapsLinkUrl && (
            <a
              href={storeInfo.mapsLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#111111] text-white font-display text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-[#C8312B] transition-colors self-start"
            >
              <span>{t.openInMaps}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Right: Google Maps Embed */}
        <div className="lg:col-span-7 min-h-[320px] sm:min-h-[420px] bg-[#ECE8E1] border border-[#111111]/15 overflow-hidden">
          <iframe
            title="London's Outlet Zahle Location Map"
            src={storeInfo.mapsEmbedUrl}
            className="w-full h-full min-h-[320px] sm:min-h-[420px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
