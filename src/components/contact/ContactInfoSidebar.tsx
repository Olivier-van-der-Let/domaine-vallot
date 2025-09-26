'use client'

import { Phone, Mail, Clock, Users, Wine, Award } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ContactInfoSidebarProps {
  locale: string
}

export default function ContactInfoSidebar({ locale }: ContactInfoSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Check if currently open
  useEffect(() => {
    const checkBusinessHours = () => {
      const now = new Date()
      const day = now.getDay() // 0 = Sunday, 1 = Monday, etc.
      const hour = now.getHours()
      const month = now.getMonth() + 1 // 0 = January, 1 = February, etc.

      // Closed on Sundays (except by appointment)
      if (day === 0) {
        setIsOpen(false)
        return
      }

      // Monday to Saturday
      if (day >= 1 && day <= 6) {
        // Morning hours: 9h-12h
        // Afternoon hours: 14h-19h (18h from January to March)
        const afternoonClose = (month >= 1 && month <= 3) ? 18 : 19

        if ((hour >= 9 && hour < 12) || (hour >= 14 && hour < afternoonClose)) {
          setIsOpen(true)
        } else {
          setIsOpen(false)
        }
      }
    }

    checkBusinessHours()
    // Update every minute
    const interval = setInterval(checkBusinessHours, 60000)
    return () => clearInterval(interval)
  }, [])

  const content = {
    fr: {
      contact: {
        title: 'Nous contacter',
        phone: 'Téléphone',
        email: 'Email professionnel'
      },
      hours: {
        title: 'Horaires d\'ouverture',
        open: 'Ouvert maintenant',
        closed: 'Fermé actuellement',
        weekdays: 'Lundi - Samedi',
        weekdaysHours: '9h-12h, 14h-19h',
        winter: 'Janvier - Mars',
        winterHours: '18h au lieu de 19h',
        sunday: 'Dimanche',
        sundayHours: 'Sur rendez-vous uniquement',
        holidays: 'Jours fériés : Sur rendez-vous'
      },
      services: {
        title: 'Nos services',
        tasting: {
          title: 'Dégustation gratuite',
          description: 'Découvrez nos vins dans notre caveau'
        },
        groups: {
          title: 'Accueil de groupes',
          description: 'Jusqu\'à 20 personnes sur rendez-vous'
        },
        expertise: {
          title: 'Conseil expert',
          description: 'Accompagnement personnalisé pour vos choix'
        }
      },
      recognition: {
        title: 'Reconnaissance',
        award: 'Classé 3 feuilles par Inter Rhône',
        description: 'Label d\'accueil d\'excellence'
      }
    },
    en: {
      contact: {
        title: 'Contact Us',
        phone: 'Phone',
        email: 'Business Email'
      },
      hours: {
        title: 'Business Hours',
        open: 'Open now',
        closed: 'Currently closed',
        weekdays: 'Monday - Saturday',
        weekdaysHours: '9am-12pm, 2pm-7pm',
        winter: 'January - March',
        winterHours: '6pm instead of 7pm',
        sunday: 'Sunday',
        sundayHours: 'By appointment only',
        holidays: 'Public holidays: By appointment'
      },
      services: {
        title: 'Our Services',
        tasting: {
          title: 'Free Wine Tasting',
          description: 'Discover our wines in our tasting room'
        },
        groups: {
          title: 'Group Reception',
          description: 'Up to 20 people by appointment'
        },
        expertise: {
          title: 'Expert Advice',
          description: 'Personalized guidance for your selections'
        }
      },
      recognition: {
        title: 'Recognition',
        award: 'Rated 3 leaves by Inter Rhône',
        description: 'Excellence in hospitality label'
      }
    }
  }

  const t = content[locale as keyof typeof content]

  return (
    <div className="space-y-6">
      {/* Quick Contact */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.contact.title}</h3>

        <div className="space-y-4">
          <a
            href="tel:+33475260324"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <Phone className="h-5 w-5 text-wine-600 group-hover:text-wine-700" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">{t.contact.phone}</p>
              <p className="font-medium text-gray-900">+33 (0)4 75 26 03 24</p>
            </div>
          </a>

          <a
            href="mailto:anais@domainevallot.com"
            className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <Mail className="h-5 w-5 text-wine-600 group-hover:text-wine-700" />
            <div className="ml-3">
              <p className="text-sm text-gray-600">{t.contact.email}</p>
              <p className="font-medium text-gray-900">anais@domainevallot.com</p>
            </div>
          </a>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{t.hours.title}</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {isOpen ? t.hours.open : t.hours.closed}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">{t.hours.weekdays}</span>
            <span className="font-medium">{t.hours.weekdaysHours}</span>
          </div>

          <div className="text-sm text-gray-500 pl-2 border-l-2 border-gray-200">
            <div className="flex justify-between">
              <span>{t.hours.winter}</span>
              <span>{t.hours.winterHours}</span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">{t.hours.sunday}</span>
            <span className="font-medium text-wine-600">{t.hours.sundayHours}</span>
          </div>

          <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            {t.hours.holidays}
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.services.title}</h3>

        <div className="space-y-4">
          <div className="flex items-start">
            <Wine className="h-5 w-5 text-wine-600 mt-1 flex-shrink-0" />
            <div className="ml-3">
              <h4 className="font-medium text-gray-900">{t.services.tasting.title}</h4>
              <p className="text-sm text-gray-600">{t.services.tasting.description}</p>
            </div>
          </div>

          <div className="flex items-start">
            <Users className="h-5 w-5 text-wine-600 mt-1 flex-shrink-0" />
            <div className="ml-3">
              <h4 className="font-medium text-gray-900">{t.services.groups.title}</h4>
              <p className="text-sm text-gray-600">{t.services.groups.description}</p>
            </div>
          </div>

          <div className="flex items-start">
            <Award className="h-5 w-5 text-wine-600 mt-1 flex-shrink-0" />
            <div className="ml-3">
              <h4 className="font-medium text-gray-900">{t.services.expertise.title}</h4>
              <p className="text-sm text-gray-600">{t.services.expertise.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recognition */}
      <div className="bg-gradient-to-br from-wine-50 to-wine-100 p-6 rounded-lg border border-wine-200">
        <h3 className="text-lg font-semibold text-wine-900 mb-2">{t.recognition.title}</h3>
        <div className="flex items-center">
          <Award className="h-6 w-6 text-wine-600 mr-2" />
          <div>
            <p className="font-medium text-wine-800">{t.recognition.award}</p>
            <p className="text-sm text-wine-600">{t.recognition.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}