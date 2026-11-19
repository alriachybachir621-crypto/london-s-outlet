import React, { useRef, useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { Language } from '../types';
import { getT } from '../i18n/translations';
import { UnionJackStripe } from './Icons';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  wishlistCount: number;
  wishlistFilterActive: boolean;
  onToggleWishlistView: () => void;
  onSecretLogoTrigger: () => void;
}

export function Navbar({
  lang,
  onToggleLang,
  wishlistCount,
  wishlistFilterActive,
  onToggleWishlistView,
  onSecretLogoTrigger,
}: NavbarProps) {
  const t = getT(lang);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tapTimestampsRef = useRef<number[]>([]);

  const handleLogoTap = (e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    const recent = tapTimestampsRef.current.filter((ts) => now - ts < 3500);
    recent.push(now);
    tapTimestampsRef.current = recent;
    if (recent.length >= 5) {
      tapTimestampsRef.current = [];
      onSecretLogoTrigger();
    }
  };

  const navLinks = [
    { href: '#catalog', label: t.navShop },
    { href: '#new-sale', label: t.navNewSale },
    { href: '#categories', label: t.navCategories },
    { href: '#about', label: t.navAbout },
    { href: '#contact', label: t.navContact },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#F5F3EF]/95 backdrop-blur-sm border-b border-[#111111]/12">
      <UnionJackStripe />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand lockup with 5-tap emblem */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleLogoTap}
            aria-label="London's Outlet Emblem"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-[#111111]/20 shrink-0 focus-visible:outline-2 focus-visible:outline-[#C8312B] cursor-pointer transition-transform active:scale-95"
          >
            <img
              src="/logo.png"
              alt="London's Outlet Logo"
              className="w-full h-full object-cover"
            />
          </button>
          <a
            href="#top"
            className="font-display text-lg sm:text-xl font-bold uppercase tracking-wider text-[#111111] whitespace-nowrap shrink-0"
          >
            {t.brandName}
          </a>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-[#2B2B2B]"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#111111] border-b-2 border-transparent hover:border-[#C8312B] py-1 transition-colors whitespace-nowrap shrink-0"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Language switch + Wishlist + Mobile Menu */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLang}
            className="h-10 px-3 border border-[#111111]/20 bg-white text-[#111111] text-xs font-semibold tracking-wide hover:bg-[#111111] hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.langSwitch}
          </button>

          <button
            type="button"
            onClick={onToggleWishlistView}
            aria-label={t.savedOnly}
            className={`relative h-10 px-3 border flex items-center gap-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              wishlistFilterActive
                ? 'bg-[#C8312B] border-[#C8312B] text-white'
                : 'bg-white border-[#111111]/20 text-[#111111] hover:border-[#111111]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${wishlistFilterActive || wishlistCount > 0 ? 'fill-current' : ''}`}
            />
            <span className="tabular-nums">{wishlistCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle Menu"
            className="md:hidden h-10 w-10 flex items-center justify-center border border-[#111111]/20 bg-white text-[#111111] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile"
          className="md:hidden border-t border-[#111111]/10 bg-[#F5F3EF] px-4 py-3 flex flex-col gap-1"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-2 text-sm font-semibold text-[#111111] hover:bg-[#111111]/5 border-b border-[#111111]/8 last:border-b-0"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
