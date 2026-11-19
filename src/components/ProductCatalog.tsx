import React from 'react';
import { Heart, RotateCcw, Search } from 'lucide-react';
import { Brand, Category, Language, PriceRange, Product } from '../types';
import { getT } from '../i18n/translations';
import { ResilientImage } from './Icons';

interface ProductCatalogProps {
  lang: Language;
  products: Product[];
  categories: Category[];
  brands: Brand[];
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  selectedBrand: string;
  onBrandChange: (val: string) => void;
  selectedSize: string;
  onSizeChange: (val: string) => void;
  priceRange: PriceRange;
  onPriceRangeChange: (val: PriceRange) => void;
  wishlistOnly: boolean;
  onToggleWishlistOnly: () => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onResetFilters: () => void;
  onSelectProduct: (product: Product) => void;
}

export function ProductCatalog({
  lang,
  products,
  categories,
  brands,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  selectedSize,
  onSizeChange,
  priceRange,
  onPriceRangeChange,
  wishlistOnly,
  onToggleWishlistOnly,
  wishlist,
  onToggleWishlist,
  onResetFilters,
  onSelectProduct,
}: ProductCatalogProps) {
  const t = getT(lang);

  // Gather unique sizes across catalog for the size filter
  const allSizes = Array.from(
    new Set(products.flatMap((p) => p.sizes || [])),
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const filtered = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (selectedBrand !== 'all' && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }
    if (selectedSize !== 'all' && !(p.sizes || []).includes(selectedSize)) return false;
    if (priceRange === 'under40' && p.priceUsd >= 40) return false;
    if (priceRange === '40to80' && (p.priceUsd < 40 || p.priceUsd > 80)) return false;
    if (priceRange === 'over80' && p.priceUsd <= 80) return false;
    if (wishlistOnly && !wishlist.includes(p.id)) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchEn = p.nameEn.toLowerCase().includes(q);
      const matchAr = p.nameAr.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchEn && !matchAr && !matchBrand && !matchCat) return false;
    }
    return true;
  });

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedSize !== 'all' ||
    priceRange !== 'all' ||
    wishlistOnly;

  return (
    <section id="catalog" className="py-12 sm:py-16 border-b border-[#111111]/12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#111111]">
              {t.catalogTitle}
            </h2>
            <p className="text-sm text-[#2B2B2B]/80 mt-1">{t.catalogSubtitle}</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2B2B2B]/75 tabular-nums">
            {t.itemsCount(filtered.length)}
          </span>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-[#111111]/15 p-3.5 sm:p-4 mb-8 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-[#2B2B2B]/60 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full h-11 ps-10 pe-3 bg-[#F5F3EF] border border-[#111111]/15 text-sm text-[#111111] placeholder:text-[#2B2B2B]/55 focus:outline-none focus:border-[#111111]"
              />
            </div>

            {/* Brand select */}
            <div className="md:col-span-2">
              <select
                value={selectedBrand}
                onChange={(e) => onBrandChange(e.target.value)}
                aria-label={t.allBrands}
                className="w-full h-11 px-3 bg-[#F5F3EF] border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
              >
                <option value="all">{t.allBrands}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Size select */}
            <div className="md:col-span-2">
              <select
                value={selectedSize}
                onChange={(e) => onSizeChange(e.target.value)}
                aria-label={t.allSizes}
                className="w-full h-11 px-3 bg-[#F5F3EF] border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
              >
                <option value="all">{t.allSizes}</option>
                {allSizes.map((sz) => (
                  <option key={sz} value={sz}>
                    {sz}
                  </option>
                ))}
              </select>
            </div>

            {/* Price select */}
            <div className="md:col-span-2">
              <select
                value={priceRange}
                onChange={(e) => onPriceRangeChange(e.target.value as PriceRange)}
                aria-label={t.allPrices}
                className="w-full h-11 px-3 bg-[#F5F3EF] border border-[#111111]/15 text-sm text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
              >
                <option value="all">{t.allPrices}</option>
                <option value="under40">{t.priceUnder40}</option>
                <option value="40to80">{t.price40to80}</option>
                <option value="over80">{t.priceOver80}</option>
              </select>
            </div>

            {/* Wishlist filter toggle */}
            <div className="md:col-span-2 flex gap-2">
              <button
                type="button"
                onClick={onToggleWishlistOnly}
                className={`flex-1 h-11 px-3 border flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  wishlistOnly
                    ? 'bg-[#C8312B] border-[#C8312B] text-white'
                    : 'bg-[#F5F3EF] border-[#111111]/15 text-[#111111] hover:border-[#111111]'
                }`}
              >
                <Heart className={`w-4 h-4 ${wishlistOnly ? 'fill-current' : ''}`} />
                <span>{t.savedOnly}</span>
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  title={t.clearFilters}
                  aria-label={t.clearFilters}
                  className="h-11 w-11 border border-[#111111]/15 bg-[#F5F3EF] text-[#111111] hover:bg-[#111111] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category segmented filter bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => onCategoryChange('all')}
              className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#111111] border-[#111111] text-white'
                  : 'bg-[#F5F3EF] border-[#111111]/15 text-[#2B2B2B] hover:border-[#111111]'
              }`}
            >
              {t.allCategories}
            </button>
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.id)}
                  className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#111111] border-[#111111] text-white'
                      : 'bg-[#F5F3EF] border-[#111111]/15 text-[#2B2B2B] hover:border-[#111111]'
                  }`}
                >
                  {lang === 'ar' ? cat.nameAr : cat.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#111111]/15 p-10 text-center space-y-4">
            <p className="text-sm sm:text-base text-[#2B2B2B]">{t.noResults}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="px-5 py-2.5 bg-[#111111] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C8312B] transition-colors cursor-pointer"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((product) => {
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
                      {product.sizes.length > 0 && (
                        <p className="text-xs text-[#2B2B2B]/70 mt-1.5 truncate">
                          {product.sizes.join(' · ')}
                        </p>
                      )}
                      {product.colors.length > 0 && (
                        <p className="text-xs text-[#2B2B2B]/60 mt-0.5 truncate">
                          {product.colors.join(' / ')}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#111111]/8 flex items-baseline justify-between gap-2 tabular-nums">
                      <div className="flex items-baseline gap-2">
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
                      {!product.inStock && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C8312B]">
                          {t.soldOut}
                        </span>
                      )}
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
