import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Language, Product } from '../types';
import { getT } from '../i18n/translations';
import { ResilientImage } from './Icons';

interface NewAndSaleSectionProps {
  lang: Language;
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onSelectProduct: (product: Product) => void;
}

export function NewAndSaleSection({
  lang,
  products,
  wishlist,
  onToggleWishlist,
  onSelectProduct,
}: NewAndSaleSectionProps) {
  const t = getT(lang);
  const [tab, setTab] = useState<'all' | 'new' | 'sale'>('all');

  const featured = products.filter((p) => {
    if (tab === 'new') return p.isNew;
    if (tab === 'sale') return p.isSale;
    return p.isNew || p.isSale;
  });

  if (products.filter((p) => p.isNew || p.isSale).length === 0) {
    return null;
  }

  return (
    <section id="new-sale" className="py-12 sm:py-16 bg-[#ECE8E1] border-b border-[#111111]/12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#111111]">
              {t.newSaleTitle}
            </h2>
            <p className="text-sm text-[#2B2B2B]/80 mt-1">{t.newSaleSubtitle}</p>
          </div>

          <div className="inline-flex bg-white border border-[#111111]/15 p-1 self-start md:self-auto">
            {(['all', 'new', 'sale'] as const).map((key) => {
              const label =
                key === 'all' ? t.allDrops : key === 'new' ? t.newOnly : t.saleOnly;
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? key === 'sale'
                        ? 'bg-[#C8312B] text-white'
                        : 'bg-[#111111] text-white'
                      : 'text-[#2B2B2B] hover:text-[#111111]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.slice(0, 8).map((product) => {
            const name = lang === 'ar' ? product.nameAr : product.nameEn;
            const isSaved = wishlist.includes(product.id);
            const tag = !product.inStock
              ? { label: t.soldOut, cls: 'bg-[#2B2B2B] text-white' }
              : product.isSale
                ? { label: t.saleTag, cls: 'bg-[#C8312B] text-white' }
                : product.isNew
                  ? { label: t.newTag, cls: 'bg-[#111111] text-white' }
                  : null;

            return (
              <article
                key={product.id}
                className="group bg-white border border-[#111111]/12 flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] bg-[#E7E3DC] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product)}
                    className="w-full h-full block cursor-pointer text-start"
                  >
                    <ResilientImage
                      src={product.images[0]}
                      alt={name}
                      fallbackTitle={name}
                      className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        !product.inStock ? 'opacity-65 grayscale' : ''
                      }`}
                    />
                  </button>

                  {tag && (
                    <span
                      className={`absolute top-2.5 start-2.5 px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wider ${tag.cls}`}
                    >
                      {tag.label}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    aria-label={isSaved ? t.removeWishlist : t.addWishlist}
                    className={`absolute top-2.5 end-2.5 w-9 h-9 flex items-center justify-center border transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-[#C8312B] border-[#C8312B] text-white'
                        : 'bg-white/90 border-[#111111]/15 text-[#111111] hover:bg-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between text-start cursor-pointer"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2B2B2B]/70">
                      {product.brand}
                    </p>
                    <h3 className="text-sm sm:text-base font-semibold text-[#111111] mt-1 line-clamp-2">
                      {name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#111111]/8 flex items-baseline gap-2 tabular-nums">
                    <span className="text-base font-bold text-[#111111]">
                      ${product.priceUsd}
                    </span>
                    {product.isSale &&
                      product.oldPriceUsd != null &&
                      product.oldPriceUsd > product.priceUsd && (
                        <span className="text-xs text-[#2B2B2B]/55 line-through">
                          ${product.oldPriceUsd}
                        </span>
                      )}
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
