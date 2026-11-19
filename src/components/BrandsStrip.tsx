import React from 'react';
import { Brand, Language } from '../types';
import { getT } from '../i18n/translations';

interface BrandsStripProps {
  lang: Language;
  brands: Brand[];
  selectedBrand: string;
  onSelectBrand: (brandName: string) => void;
}

export function BrandsStrip({
  lang,
  brands,
  selectedBrand,
  onSelectBrand,
}: BrandsStripProps) {
  const t = getT(lang);

  if (brands.length === 0) return null;

  return (
    <section className="py-10 sm:py-12 bg-[#111111] text-[#F5F3EF] border-b border-white/15">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-wider text-white">
              {t.brandsTitle}
            </h2>
            <p className="text-xs sm:text-sm text-[#F5F3EF]/70 mt-0.5">{t.brandsSubtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {brands.map((brand) => {
            const active = selectedBrand.toLowerCase() === brand.name.toLowerCase();
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => onSelectBrand(active ? 'all' : brand.name)}
                className={`h-14 px-3 border font-display text-sm sm:text-base font-bold uppercase tracking-widest transition-colors flex items-center justify-center text-center cursor-pointer ${
                  active
                    ? 'bg-[#C8312B] border-[#C8312B] text-white'
                    : 'bg-[#1a1a1a] border-white/15 text-[#F5F3EF] hover:border-white hover:bg-white hover:text-[#111111]'
                }`}
              >
                <span className="truncate">{brand.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
