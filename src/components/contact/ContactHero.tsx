'use client'

import { Mail, Phone, MapPin } from 'lucide-react'

interface ContactHeroProps {
  locale: string
}

export default function ContactHero({ locale }: ContactHeroProps) {
  const content = {
    fr: {
      title: 'Contactez-nous',
      subtitle: 'Nous sommes là pour répondre à toutes vos questions sur nos vins, organiser votre visite ou discuter de partenariats.',
      quickContact: {
        phone: {
          label: 'Téléphone',
          value: '+33 (0)4 75 26 03 24'
        },
        email: {
          label: 'Email',
          value: 'anais@domainevallot.com'
        },
        address: {
          label: 'Adresse',
          value: '3176 route de Nyons – Le Coriançon – 26110 VINSOBRES'
        }
      }
    },
    en: {
      title: 'Contact Us',
      subtitle: 'We\'re here to answer all your questions about our wines, arrange your visit, or discuss partnerships.',
      quickContact: {
        phone: {
          label: 'Phone',
          value: '+33 (0)4 75 26 03 24'
        },
        email: {
          label: 'Email',
          value: 'anais@domainevallot.com'
        },
        address: {
          label: 'Address',
          value: '3176 route de Nyons – Le Coriançon – 26110 VINSOBRES'
        }
      }
    }
  }

  const t = content[locale as keyof typeof content]

  return (
    <div className="relative bg-gradient-to-br from-wine-900 to-wine-800 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.title}</h1>
          <p className="text-xl text-wine-100 max-w-3xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* Quick contact info */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <a
            href={`tel:${t.quickContact.phone.value.replace(/\s/g, '')}`}
            className="flex items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/15 transition-colors group"
          >
            <Phone className="h-8 w-8 text-wine-200 mb-3 group-hover:text-white transition-colors" />
            <div className="ml-4">
              <h3 className="font-semibold text-wine-100 group-hover:text-white transition-colors">
                {t.quickContact.phone.label}
              </h3>
              <p className="text-wine-200 group-hover:text-wine-100 transition-colors">
                {t.quickContact.phone.value}
              </p>
            </div>
          </a>

          <a
            href={`mailto:${t.quickContact.email.value}`}
            className="flex items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/15 transition-colors group"
          >
            <Mail className="h-8 w-8 text-wine-200 mb-3 group-hover:text-white transition-colors" />
            <div className="ml-4">
              <h3 className="font-semibold text-wine-100 group-hover:text-white transition-colors">
                {t.quickContact.email.label}
              </h3>
              <p className="text-wine-200 group-hover:text-wine-100 transition-colors">
                {t.quickContact.email.value}
              </p>
            </div>
          </a>

          <div className="flex items-center p-6 bg-white/10 backdrop-blur-sm rounded-lg">
            <MapPin className="h-8 w-8 text-wine-200 mb-3" />
            <div className="ml-4">
              <h3 className="font-semibold text-wine-100">
                {t.quickContact.address.label}
              </h3>
              <p className="text-wine-200 text-sm leading-relaxed">
                {t.quickContact.address.value}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}