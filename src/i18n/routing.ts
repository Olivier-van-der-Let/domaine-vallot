import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'fr'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Pathnames for different locales
  pathnames: {
    '/': '/',
    '/products': {
      en: '/products',
      fr: '/produits'
    },
    '/products/[slug]': {
      en: '/products/[slug]',
      fr: '/produits/[slug]'
    },
    '/cart': {
      en: '/cart',
      fr: '/panier'
    },
    '/checkout': {
      en: '/checkout',
      fr: '/commande'
    },
    '/about': {
      en: '/about',
      fr: '/a-propos'
    },
    '/contact': {
      en: '/contact',
      fr: '/contact'
    },
    '/login': {
      en: '/login',
      fr: '/connexion'
    },
    '/register': {
      en: '/register',
      fr: '/inscription'
    },
    '/forgot-password': {
      en: '/forgot-password',
      fr: '/mot-de-passe-oublie'
    },
    '/reset-password': {
      en: '/reset-password',
      fr: '/reinitialiser-mot-de-passe'
    },
    '/profile': {
      en: '/profile',
      fr: '/profil'
    },
    '/orders': {
      en: '/orders',
      fr: '/commandes'
    },
    '/admin': '/admin'
  }
})