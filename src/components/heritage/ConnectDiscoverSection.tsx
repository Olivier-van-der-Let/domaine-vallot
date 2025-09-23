'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ConnectDiscoverSectionProps {
  locale: string
}

interface DiscoveryPath {
  id: string
  title: string
  description: string
  icon: string
  href: string
  cta: string
  highlight?: boolean
}

interface NewsletterFormData {
  email: string
  interests: string[]
}

export default function ConnectDiscoverSection({ locale }: ConnectDiscoverSectionProps) {
  const [newsletterForm, setNewsletterForm] = useState<NewsletterFormData>({
    email: '',
    interests: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const discoveryPaths: DiscoveryPath[] = locale === 'fr' ? [
    {
      id: 'terroir',
      title: 'Explorer par Terroir',
      description: 'Découvrez nos vins organisés par parcelles et expressions de terroir',
      icon: '🏔️',
      href: `/${locale}/wines/by-terroir`,
      cta: 'Explorer les Terroirs'
    },
    {
      id: 'vintage',
      title: 'Parcourir par Millésime',
      description: 'Voyagez à travers nos millésimes et leurs histoires uniques',
      icon: '📅',
      href: `/${locale}/wines/by-vintage`,
      cta: 'Voir les Millésimes'
    },
    {
      id: 'visit',
      title: 'Visiter le Domaine',
      description: 'Réservez une dégustation privée et découvrez nos installations',
      icon: '🍷',
      href: `/${locale}/visit`,
      cta: 'Réserver une Visite',
      highlight: true
    },
    {
      id: 'story',
      title: 'Notre Histoire',
      description: 'Plongez dans l\'héritage familial et les traditions du domaine',
      icon: '📖',
      href: `/${locale}/heritage`,
      cta: 'Lire Notre Histoire'
    }
  ] : [
    {
      id: 'terroir',
      title: 'Explore by Terroir',
      description: 'Discover our wines organized by plots and terroir expressions',
      icon: '🏔️',
      href: `/${locale}/wines/by-terroir`,
      cta: 'Explore Terroirs'
    },
    {
      id: 'vintage',
      title: 'Browse by Vintage',
      description: 'Journey through our vintages and their unique stories',
      icon: '📅',
      href: `/${locale}/wines/by-vintage`,
      cta: 'View Vintages'
    },
    {
      id: 'visit',
      title: 'Visit the Estate',
      description: 'Book a private tasting and discover our facilities',
      icon: '🍷',
      href: `/${locale}/visit`,
      cta: 'Book a Visit',
      highlight: true
    },
    {
      id: 'story',
      title: 'Our Story',
      description: 'Dive into family heritage and estate traditions',
      icon: '📖',
      href: `/${locale}/heritage`,
      cta: 'Read Our Story'
    }
  ]

  const interestOptions = locale === 'fr' ? [
    { id: 'nouvelles-cuvees', label: 'Nouvelles cuvées' },
    { id: 'evenements', label: 'Événements au domaine' },
    { id: 'process-vinification', label: 'Processus de vinification' },
    { id: 'biodynamie', label: 'Biodynamie et terroir' },
    { id: 'degustation', label: 'Notes de dégustation' }
  ] : [
    { id: 'new-releases', label: 'New releases' },
    { id: 'events', label: 'Estate events' },
    { id: 'winemaking', label: 'Winemaking process' },
    { id: 'biodynamics', label: 'Biodynamics and terroir' },
    { id: 'tasting', label: 'Tasting notes' }
  ]

  const content = {
    fr: {
      overline: 'Connectez-vous',
      title: 'Découvrez Votre Chemin',
      subtitle: 'Choisissez Votre Voyage de Découverte',
      description: 'Que vous soyez passionné de terroir, amateur d\'histoire ou en quête d\'expériences authentiques, trouvez votre propre chemin pour explorer notre univers.',
      newsletter: {
        title: 'Histoires du Vignoble',
        description: 'Recevez nos récits de saison, les actualités du domaine et invitations exclusives',
        emailPlaceholder: 'Votre adresse email',
        interestsTitle: 'Vos centres d\'intérêt',
        subscribe: 'S\'abonner',
        submitting: 'Inscription...',
        success: 'Merci ! Vous recevrez bientôt nos histoires du vignoble.',
        privacy: 'Nous respectons votre vie privée. Désabonnement possible à tout moment.'
      },
      technical: {
        title: 'Ressources Techniques',
        description: 'Accédez à nos analyses de sol, fiches techniques et données de viticulture',
        links: [
          { label: 'Analyses de Sol', href: '/resources/soil-analysis' },
          { label: 'Fiches Techniques', href: '/resources/technical-sheets' },
          { label: 'Données Climatiques', href: '/resources/climate-data' }
        ]
      }
    },
    en: {
      overline: 'Connect',
      title: 'Discover Your Path',
      subtitle: 'Choose Your Discovery Journey',
      description: 'Whether you\'re passionate about terroir, love history, or seek authentic experiences, find your own path to explore our universe.',
      newsletter: {
        title: 'Vineyard Stories',
        description: 'Receive our seasonal stories, estate news and exclusive invitations',
        emailPlaceholder: 'Your email address',
        interestsTitle: 'Your interests',
        subscribe: 'Subscribe',
        submitting: 'Subscribing...',
        success: 'Thank you! You\'ll soon receive our vineyard stories.',
        privacy: 'We respect your privacy. Unsubscribe anytime.'
      },
      technical: {
        title: 'Technical Resources',
        description: 'Access our soil analyses, technical sheets and viticulture data',
        links: [
          { label: 'Soil Analysis', href: '/resources/soil-analysis' },
          { label: 'Technical Sheets', href: '/resources/technical-sheets' },
          { label: 'Climate Data', href: '/resources/climate-data' }
        ]
      }
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  const handleInterestToggle = (interestId: string) => {
    setNewsletterForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))

    setSubmitted(true)
    setIsSubmitting(false)
  }

  return (
    <section className="py-16 lg:py-24 bg-heritage-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <p className="text-heritage-golden-400 font-serif text-sm md:text-base tracking-wider uppercase mb-4">
            {text.overline}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {text.title}
          </h2>
          <p className="text-heritage-limestone-200 font-serif text-xl md:text-2xl font-medium mb-6">
            {text.subtitle}
          </p>
          <p className="text-heritage-limestone-300 text-lg leading-relaxed max-w-3xl mx-auto">
            {text.description}
          </p>
        </div>

        {/* Discovery Paths */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {discoveryPaths.map((path) => (
            <Link
              key={path.id}
              href={path.href}
              className={`group block p-6 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-2 ${
                path.highlight
                  ? 'bg-heritage-golden-600 hover:bg-heritage-golden-700 hover:shadow-2xl'
                  : 'bg-heritage-slate-800 hover:bg-heritage-slate-700 hover:shadow-xl'
              }`}
            >
              <div className="text-center space-y-4">
                <div className="text-4xl mb-4">{path.icon}</div>
                <h3 className={`font-serif text-xl font-semibold ${
                  path.highlight ? 'text-heritage-slate-900' : 'text-white'
                }`}>
                  {path.title}
                </h3>
                <p className={`text-sm leading-relaxed ${
                  path.highlight ? 'text-heritage-slate-700' : 'text-heritage-limestone-300'
                }`}>
                  {path.description}
                </p>
                <div className={`inline-flex items-center text-sm font-medium transition-colors ${
                  path.highlight
                    ? 'text-heritage-slate-800 group-hover:text-heritage-slate-900'
                    : 'text-heritage-golden-400 group-hover:text-heritage-golden-300'
                }`}>
                  {path.cta}
                  <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter and Resources */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Newsletter Signup */}
          <div className="bg-heritage-slate-800 rounded-lg p-8">
            <div className="mb-6">
              <h3 className="font-serif text-2xl font-bold mb-3">
                {text.newsletter.title}
              </h3>
              <p className="text-heritage-limestone-300 leading-relaxed">
                {text.newsletter.description}
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleNewsletterSubmit} className="space-y-6">
                {/* Email Input */}
                <div>
                  <input
                    type="email"
                    value={newsletterForm.email}
                    onChange={(e) => setNewsletterForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={text.newsletter.emailPlaceholder}
                    required
                    className="w-full px-4 py-3 bg-heritage-slate-700 border border-heritage-slate-600 rounded-md text-white placeholder-heritage-limestone-400 focus:ring-2 focus:ring-heritage-golden-500 focus:border-transparent transition-colors"
                  />
                </div>

                {/* Interests */}
                <div>
                  <h4 className="font-medium mb-3">{text.newsletter.interestsTitle}</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {interestOptions.map((option) => (
                      <label key={option.id} className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newsletterForm.interests.includes(option.id)}
                          onChange={() => handleInterestToggle(option.id)}
                          className="mr-3 rounded bg-heritage-slate-700 border-heritage-slate-600 text-heritage-golden-500 focus:ring-heritage-golden-500"
                        />
                        <span className="text-sm text-heritage-limestone-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !newsletterForm.email}
                  className="w-full px-6 py-3 bg-heritage-golden-500 text-heritage-slate-900 font-semibold rounded-md hover:bg-heritage-golden-600 focus:ring-2 focus:ring-heritage-golden-500 focus:ring-offset-2 focus:ring-offset-heritage-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? text.newsletter.submitting : text.newsletter.subscribe}
                </button>

                {/* Privacy Note */}
                <p className="text-xs text-heritage-limestone-400">
                  {text.newsletter.privacy}
                </p>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-heritage-golden-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-heritage-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-heritage-limestone-200">{text.newsletter.success}</p>
              </div>
            )}
          </div>

          {/* Technical Resources */}
          <div className="bg-heritage-slate-800 rounded-lg p-8">
            <div className="mb-6">
              <h3 className="font-serif text-2xl font-bold mb-3">
                {text.technical.title}
              </h3>
              <p className="text-heritage-limestone-300 leading-relaxed">
                {text.technical.description}
              </p>
            </div>

            <div className="space-y-4">
              {text.technical.links.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="group flex items-center justify-between p-4 bg-heritage-slate-700 rounded-md hover:bg-heritage-slate-600 transition-colors"
                >
                  <span className="text-heritage-limestone-200 group-hover:text-white">
                    {link.label}
                  </span>
                  <svg className="w-5 h-5 text-heritage-golden-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-6 border-t border-heritage-slate-600">
              <div className="text-sm text-heritage-limestone-400 space-y-2">
                <p>
                  <span className="font-medium text-heritage-limestone-300">
                    {locale === 'fr' ? 'Domaine Vallot' : 'Domaine Vallot'}
                  </span>
                </p>
                <p>26110 Vinsobres, France</p>
                <p>+33 (0)4 75 27 65 07</p>
                <p>contact@domainevallot.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}