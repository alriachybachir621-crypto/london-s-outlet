import React from 'react';
import { Language, StoreInfo } from '../types';
import { getT } from '../i18n/translations';
import { UnionJackStripe } from './Icons';

interface FooterProps {
  lang: Language;
  storeInfo: StoreInfo;
}

export function Footer({ lang, storeInfo }: FooterProps) {
  const t = getT(lang);
  const address = lang === 'ar' ? storeInfo.addressAr : storeInfo.addressEn;
  const hours = lang === 'ar' ? storeInfo.hoursAr : storeInfo.hoursEn;
  const subtitle = lang === 'ar' ? storeInfo.heroSubtitleAr : storeInfo.heroSubtitleEn;

  return (
    <footer className="bg-[#0b0b0b] text-[#F5F3EF] border-t border-white/10">
      <UnionJackStripe />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="flex items-start gap-3.5">
          <img
            src="/logo.png"
            alt="London's Outlet"
            className="w-14 h-14 rounded-full border border-white/25 object-cover shrink-0"
          />
          <div>
            <p className="font-display text-lg font-bold uppercase tracking-wider text-white">
              {t.brandName}
            </p>
            <p className="text-xs text-[#F5F3EF]/70 mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-[#F5F3EF]/75 space-y-1.5">
          <p className="font-semibold text-white">{address}</p>
          <p>{hours}</p>
          <p dir="ltr" className="tabular-nums">
            {storeInfo.phoneDisplay}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider md:justify-end">
          <a href="#catalog" className="hover:text-[#C8312B] transition-colors">
            {t.navShop}
          </a>
          <a href="#categories" className="hover:text-[#C8312B] transition-colors">
            {t.navCategories}
          </a>
          <a href="#about" className="hover:text-[#C8312B] transition-colors">
            {t.navAbout}
          </a>
          <a
            href={storeInfo.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#C8312B] transition-colors"
          >
            Facebook
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto text-xs text-[#F5F3EF]/55 text-center sm:text-start">
          © {new Date().getFullYear()} {t.footerRights}
        </div>
      </div>
    </footer>
  );
}
