import React from 'react';
import { ExternalLink, Phone } from 'lucide-react';
import { Language, StoreInfo } from '../types';
import { getT } from '../i18n/translations';
import { ResilientImage, WhatsAppIcon } from './Icons';

interface GalleryContactSectionProps {
  lang: Language;
  storeInfo: StoreInfo;
}

export function GalleryContactSection({ lang, storeInfo }: GalleryContactSectionProps) {
  const t = getT(lang);
  const cleanWa = storeInfo.whatsappNumber.replace(/[^0-9]/g, '');
  const waHref = `https://wa.me/${cleanWa}?text=${encodeURIComponent(t.whatsappGreeting)}`;
  const telHref = `tel:+961${storeInfo.phoneDisplay.replace(/\s+/g, '').replace(/^0/, '')}`;

  return (
    <>
      {/* Gallery / Social Section */}
      <section className="py-12 sm:py-16 bg-[#ECE8E1] border-b border-[#111111]/12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-[#111111]">
                {t.galleryTitle}
              </h2>
              <p className="text-sm text-[#2B2B2B]/80 mt-1">{t.gallerySubtitle}</p>
            </div>
            <a
              href={storeInfo.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#1C2A52] text-white font-display text-xs sm:text-sm font-semibold uppercase tracking-wider hover:bg-[#111111] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <span>{t.followFacebook}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {storeInfo.galleryImages.map((img, idx) => (
              <a
                key={`${img}-${idx}`}
                href={storeInfo.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group aspect-square bg-[#2B2B2B] border border-[#111111]/15 overflow-hidden block"
              >
                <ResilientImage
                  src={img}
                  alt={`London's Outlet Lookbook ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Direct Contact Section */}
      <section id="contact" className="py-12 sm:py-16 bg-[#111111] text-[#F5F3EF]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white">
              {t.contactTitle}
            </h2>
            <p className="text-sm sm:text-base text-[#F5F3EF]/80">{t.contactSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 h-12 px-6 bg-[#25D366] text-[#111111] font-display text-sm sm:text-base font-bold uppercase tracking-wider hover:bg-[#1ebe5d] transition-colors whitespace-nowrap shrink-0"
            >
              <WhatsAppIcon className="w-5 h-5" />
              <span>{t.chatWhatsApp}</span>
            </a>

            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 border border-white/30 text-white font-display text-sm sm:text-base font-semibold uppercase tracking-wider hover:bg-white hover:text-[#111111] transition-colors whitespace-nowrap shrink-0 tabular-nums"
            >
              <Phone className="w-4 h-4" />
              <span dir="ltr">{storeInfo.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
