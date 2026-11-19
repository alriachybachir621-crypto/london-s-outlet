import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Language, StoreInfo } from '../types';
import { getT } from '../i18n/translations';
import { BigBenIcon, ResilientImage } from './Icons';

interface HeroProps {
  lang: Language;
  storeInfo: StoreInfo;
}

export function Hero({ lang, storeInfo }: HeroProps) {
  const t = getT(lang);
  const images =
    storeInfo.heroImages && storeInfo.heroImages.length > 0
      ? storeInfo.heroImages
      : ['/src/assets/images/hero_london_outlet_1795081753518.jpg'];

  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (slideIdx >= images.length) {
      setSlideIdx(0);
    }
  }, [images.length, slideIdx]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % images.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [images.length]);

  const title = lang === 'ar' ? storeInfo.heroTitleAr : storeInfo.heroTitleEn;
  const subtitle = lang === 'ar' ? storeInfo.heroSubtitleAr : storeInfo.heroSubtitleEn;

  return (
    <section id="top" className="bg-[#111111] text-[#F5F3EF] border-b border-[#111111]">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left / Typography Focal Column */}
        <div className="lg:col-span-5 px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16 flex flex-col justify-between gap-8 border-b lg:border-b-0 lg:border-e border-white/15">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="London's Outlet Big Ben Emblem"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/25 object-cover shrink-0"
            />
            <div className="text-xs uppercase tracking-[0.18em] text-[#F5F3EF]/75 flex items-center gap-2">
              <BigBenIcon className="w-4 h-4 text-[#C8312B] shrink-0" />
              <span>{lang === 'ar' ? 'زحلة · لبنان' : 'Zahle · Lebanon'}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1
              className="font-display font-bold uppercase tracking-tight leading-[0.95] text-white"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4.25rem)',
                textWrap: 'balance',
              }}
            >
              {title || "LONDON'S OUTLET"}
            </h1>
            <p className="text-base sm:text-lg text-[#F5F3EF]/85 max-w-md leading-relaxed">
              {subtitle || t.heroTaglineFallback}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#catalog"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#C8312B] text-white font-display text-sm sm:text-base font-semibold uppercase tracking-wider hover:bg-white hover:text-[#111111] transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t.shopNow}</span>
              <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </a>
            <a
              href="#new-sale"
              className="inline-flex items-center justify-center px-5 py-3.5 border border-white/30 text-[#F5F3EF] font-display text-sm sm:text-base font-semibold uppercase tracking-wider hover:border-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
            >
              {t.viewNewSale}
            </a>
          </div>
        </div>

        {/* Right / Full-bleed Hero Product Visual */}
        <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[400px] lg:min-h-[520px] bg-[#2B2B2B] overflow-hidden">
          <ResilientImage
            src={images[slideIdx]}
            alt={title}
            fallbackTitle={title}
            className="w-full h-full object-cover lg:absolute lg:inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/55 via-transparent to-transparent pointer-events-none" />

          {images.length > 1 && (
            <div className="absolute bottom-4 end-4 flex items-center gap-1.5 z-10">
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev - 1 + images.length) % images.length)}
                aria-label="Previous hero image"
                className="w-10 h-10 bg-[#111111]/85 text-white border border-white/25 flex items-center justify-center hover:bg-[#C8312B] transition-colors cursor-pointer"
              >
                <ChevronLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx((prev) => (prev + 1) % images.length)}
                aria-label="Next hero image"
                className="w-10 h-10 bg-[#111111]/85 text-white border border-white/25 flex items-center justify-center hover:bg-[#C8312B] transition-colors cursor-pointer"
              >
                <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom full-width strip */}
      <div className="bg-[#1C2A52] border-t border-white/15">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center text-center">
          <p className="font-display text-xs sm:text-sm uppercase tracking-[0.2em] text-[#F5F3EF]">
            {t.heroStrip}
          </p>
        </div>
      </div>
    </section>
  );
}
