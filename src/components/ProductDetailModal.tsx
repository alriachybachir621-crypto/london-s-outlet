import React, { useEffect, useState } from 'react';
import { Heart, X } from 'lucide-react';
import { Language, Product } from '../types';
import { getT } from '../i18n/translations';
import { ResilientImage, WhatsAppIcon } from './Icons';

interface ProductDetailModalProps {
  lang: Language;
  product: Product | null;
  whatsappNumber: string;
  isSaved: boolean;
  onToggleWishlist: (productId: string) => void;
  onClose: () => void;
}

export function ProductDetailModal({
  lang,
  product,
  whatsappNumber,
  isSaved,
  onToggleWishlist,
  onClose,
}: ProductDetailModalProps) {
  const t = getT(lang);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (product) {
      setSelectedImageIdx(0);
      setSelectedSize(product.sizes[0] || 'Standard');
      setSelectedColor(product.colors[0] || 'Default');
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [product, onClose]);

  if (!product) return null;

  const name = lang === 'ar' ? product.nameAr : product.nameEn;
  const description = lang === 'ar' ? product.descriptionAr : product.descriptionEn;
  const images = product.images.length > 0 ? product.images : [''];
  const cleanWa = whatsappNumber.replace(/[^0-9]/g, '');

  const waText = encodeURIComponent(
    t.whatsappOrderMessage({
      name,
      brand: product.brand,
      size: selectedSize || 'Standard',
      color: selectedColor || 'Default',
      price: product.priceUsd,
    }),
  );
  const waHref = `https://wa.me/${cleanWa}?text=${waText}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111111]/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div
        className="bg-[#F5F3EF] w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-[#111111] grid grid-cols-1 md:grid-cols-12 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 end-3 z-20 w-10 h-10 bg-white border border-[#111111]/20 text-[#111111] flex items-center justify-center hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image Gallery */}
        <div className="md:col-span-6 bg-[#ECE8E1] p-4 sm:p-6 flex flex-col gap-3">
          <div className="relative aspect-[4/3] bg-white border border-[#111111]/10 overflow-hidden">
            <ResilientImage
              src={images[selectedImageIdx]}
              alt={name}
              fallbackTitle={name}
              className={`w-full h-full object-cover ${!product.inStock ? 'opacity-65 grayscale' : ''}`}
            />
            {!product.inStock ? (
              <span className="absolute top-3 start-3 px-3 py-1 bg-[#2B2B2B] text-white font-display text-xs font-bold uppercase tracking-wider">
                {t.soldOut}
              </span>
            ) : product.isSale ? (
              <span className="absolute top-3 start-3 px-3 py-1 bg-[#C8312B] text-white font-display text-xs font-bold uppercase tracking-wider">
                {t.saleTag}
              </span>
            ) : product.isNew ? (
              <span className="absolute top-3 start-3 px-3 py-1 bg-[#111111] text-white font-display text-xs font-bold uppercase tracking-wider">
                {t.newTag}
              </span>
            ) : null}
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-16 h-16 shrink-0 border-2 overflow-hidden bg-white cursor-pointer ${
                    idx === selectedImageIdx ? 'border-[#C8312B]' : 'border-[#111111]/15'
                  }`}
                >
                  <ResilientImage
                    src={img}
                    alt={`${name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="md:col-span-6 p-5 sm:p-7 flex flex-col justify-between gap-6 bg-white">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#2B2B2B]/70">
                <span>{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span className={product.inStock ? 'text-[#1C2A52]' : 'text-[#C8312B]'}>
                  {product.inStock ? t.inStock : t.soldOut}
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#111111] mt-1.5 pe-10">
                {name}
              </h2>
            </div>

            <div className="flex items-baseline gap-3 tabular-nums">
              <span className="font-display text-3xl font-bold text-[#111111]">
                ${product.priceUsd}
              </span>
              {product.isSale &&
                product.oldPriceUsd != null &&
                product.oldPriceUsd > product.priceUsd && (
                  <span className="text-base text-[#2B2B2B]/50 line-through">
                    ${product.oldPriceUsd}
                  </span>
                )}
            </div>

            {description && (
              <p className="text-sm text-[#2B2B2B] leading-relaxed border-t border-[#111111]/10 pt-3">
                {description}
              </p>
            )}

            {/* Size picker */}
            {product.sizes.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  {t.selectSize}
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const active = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[44px] h-10 px-3 border text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#111111] border-[#111111] text-white'
                            : 'bg-[#F5F3EF] border-[#111111]/20 text-[#111111] hover:border-[#111111]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color picker */}
            {product.colors.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#111111]">
                  {t.selectColor}
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => {
                    const active = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`h-10 px-3.5 border text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#1C2A52] border-[#1C2A52] text-white'
                            : 'bg-[#F5F3EF] border-[#111111]/20 text-[#111111] hover:border-[#111111]'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-4 border-t border-[#111111]/10">
            {product.inStock ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 px-5 bg-[#25D366] hover:bg-[#1ebe5d] text-[#111111] font-display text-sm sm:text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>{t.orderWhatsApp}</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full h-12 px-5 bg-[#2B2B2B] text-white/75 font-display text-sm sm:text-base font-bold uppercase tracking-wider cursor-not-allowed"
              >
                {t.soldOut}
              </button>
            )}

            <button
              type="button"
              onClick={() => onToggleWishlist(product.id)}
              className={`w-full h-11 px-4 border flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-[#C8312B]/10 border-[#C8312B] text-[#C8312B]'
                  : 'bg-white border-[#111111]/20 text-[#111111] hover:border-[#111111]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              <span>{isSaved ? t.removeWishlist : t.addWishlist}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
