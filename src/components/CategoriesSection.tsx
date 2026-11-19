import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Category, Language } from '../types';
import { getT } from '../i18n/translations';
import { ResilientImage } from './Icons';

interface CategoriesSectionProps {
  lang: Language;
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
}

export function CategoriesSection({
  lang,
  categories,
  onSelectCategory,
}: CategoriesSectionProps) {
  const t = getT(lang);

  return (
    <section id="categories" className="py-12 sm:py-16 border-b border-[#111111]/12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#111111]">
              {t.categoriesTitle}
            </h2>
            <p className="text-sm text-[#2B2B2B]/80 mt-1">{t.categoriesSubtitle}</p>
          </div>
          <span className="text-xs font-medium uppercase tracking-widest text-[#2B2B2B]/70 tabular-nums">
            {t.itemsCount(categories.length)}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const name = lang === 'ar' ? cat.nameAr : cat.nameEn;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="group relative aspect-[4/3] w-full overflow-hidden bg-[#2B2B2B] border border-[#111111]/15 text-start cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C8312B]"
              >
                <ResilientImage
                  src={cat.image}
                  alt={name}
                  fallbackTitle={name}
                  className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/85 via-[#111111]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-2">
                  <h3 className="font-display text-lg sm:text-2xl font-bold uppercase tracking-wide text-white">
                    {name}
                  </h3>
                  <ArrowUpRight className="w-5 h-5 text-white/80 group-hover:text-[#C8312B] transition-colors shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
