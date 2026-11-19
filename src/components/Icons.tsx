import React, { useState } from 'react';
import { Shirt } from 'lucide-react';

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M16.004 3.2c-7.058 0-12.8 5.742-12.8 12.8 0 2.256.592 4.46 1.714 6.4L3.2 28.8l6.564-1.696a12.74 12.74 0 0 0 6.24 1.622h.006c7.056 0 12.796-5.742 12.796-12.8 0-3.418-1.33-6.632-3.748-9.05A12.715 12.715 0 0 0 16.004 3.2Zm0 23.364h-.004a10.58 10.58 0 0 1-5.398-1.48l-.388-.23-3.896 1.008 1.04-3.798-.252-.4a10.553 10.553 0 0 1-1.626-5.636c0-5.856 4.764-10.62 10.624-10.62 2.838 0 5.504 1.106 7.51 3.112a10.548 10.548 0 0 1 3.108 7.512c0 5.858-4.764 10.62-10.622 10.62Zm5.824-7.952c-.32-.16-1.888-.932-2.182-1.038-.292-.108-.506-.16-.718.16-.214.32-.826 1.038-1.012 1.252-.186.214-.372.24-.692.08-.32-.16-1.35-.498-2.572-1.588-.95-.848-1.592-1.894-1.778-2.214-.186-.32-.02-.492.14-.652.144-.144.32-.372.48-.558.16-.186.212-.32.32-.532.106-.214.054-.4-.026-.56-.08-.16-.718-1.732-.984-2.372-.26-.624-.524-.54-.718-.55l-.612-.01c-.214 0-.56.08-.852.4-.292.32-1.118 1.092-1.118 2.662 0 1.57 1.144 3.088 1.304 3.302.16.214 2.25 3.436 5.452 4.818.762.328 1.356.526 1.82.672.764.242 1.46.208 2.01.126.614-.092 1.888-.772 2.154-1.518.266-.746.266-1.384.186-1.518-.08-.134-.294-.214-.614-.374Z" />
    </svg>
  );
}

export function BigBenIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2L14.5 7H9.5L12 2Z" />
      <rect x="8.5" y="7" width="7" height="3" />
      <rect x="8" y="10" width="8" height="6" />
      <circle cx="12" cy="13" r="1.75" />
      <rect x="8.5" y="16" width="7" height="6" />
      <path d="M10.5 19V22M13.5 19V22" />
    </svg>
  );
}

export function UnionJackStripe({ className = '' }: { className?: string }) {
  return <div className={`union-jack-stripe w-full ${className}`} aria-hidden="true" />;
}

export function ResilientImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#E7E3DC] text-[#2B2B2B] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Shirt className="w-8 h-8 opacity-40 mb-2" />
        {fallbackTitle && (
          <span className="font-display text-xs uppercase tracking-wider opacity-60 line-clamp-2">
            {fallbackTitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
      loading="lazy"
    />
  );
}
