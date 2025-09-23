'use client';

import { useTranslations } from 'next-intl';

interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

export default function SkipLinks({ links }: SkipLinksProps) {
  const t = useTranslations('accessibility');

  const defaultLinks = [
    { href: '#main-content', label: t?.('skipToMain') || 'Skip to main content' },
    { href: '#navigation', label: t?.('skipToNav') || 'Skip to navigation' },
    { href: '#footer', label: t?.('skipToFooter') || 'Skip to footer' },
  ];

  const skipLinks = links || defaultLinks;

  const handleSkipLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href) as HTMLElement;
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remove tabindex after focus to prevent confusion
      target.addEventListener('blur', () => {
        target.removeAttribute('tabindex');
      }, { once: true });
    }
  };

  return (
    <div className="skip-links">
      {skipLinks.map((link, index) => (
        <a
          key={index}
          href={link.href}
          onClick={(e) => handleSkipLinkClick(e, link.href)}
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2 focus:bg-wine-600 focus:text-white focus:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-wine-600"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}