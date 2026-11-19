import React from 'react';
import { Language } from '../types';
import { getT } from '../i18n/translations';
import { WhatsAppIcon } from './Icons';

interface FloatingWhatsAppProps {
  lang: Language;
  whatsappNumber: string;
}

export function FloatingWhatsApp({ lang, whatsappNumber }: FloatingWhatsAppProps) {
  const t = getT(lang);
  const clean = whatsappNumber.replace(/[^0-9]/g, '');
  const href = `https://wa.me/${clean}?text=${encodeURIComponent(t.whatsappGreeting)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.chatWhatsApp}
      className="fixed bottom-4 end-4 z-30 w-13 h-13 bg-[#25D366] hover:bg-[#1ebe5d] text-[#111111] rounded-full shadow-lg border border-[#111111]/15 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
    >
      <WhatsAppIcon className="w-7 h-7" />
    </a>
  );
}
