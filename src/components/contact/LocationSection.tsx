'use client'

import { MapPin, Navigation, Car, Clock, Phone } from 'lucide-react'

interface LocationSectionProps {
  locale: string
}

export default function LocationSection({ locale }: LocationSectionProps) {
  const content = {
    fr: {
      title: 'Nous trouver',
      subtitle: 'Domaine Vallot est situé au cœur des Côtes-du-Rhône à Vinsobres',
      address: {
        title: 'Adresse',
        street: '3176 route de Nyons – Le Coriançon',
        city: '26110 VINSOBRES',
        gps: 'GPS: N 44° 20\' 0" E 5° 05\' 44"'
      },
      directions: {
        title: 'Accès en voiture',
        subtitle: '3 sorties autoroute A7 vous permettent de nous rejoindre :',
        exits: [
          { name: 'Sortie 18 - Montélimar Sud', direction: 'En provenance du Nord' },
          { name: 'Sortie 19 - Bollène', direction: 'En provenance du Nord' },
          { name: 'Sortie 21 - Orange Centre', direction: 'En provenance du Sud' }
        ],
        parking: 'Parking gratuit disponible sur place'
      },
      visit: {
        title: 'Planifier votre visite',
        tasting: {
          title: 'Dégustation libre',
          description: 'Accessible pendant nos horaires d\'ouverture',
          price: 'Gratuite'
        },
        appointment: {
          title: 'Visite sur rendez-vous',
          description: 'Groupes jusqu\'à 20 personnes',
          contact: 'Contactez-nous pour organiser'
        }
      },
      contact: {
        title: 'Contact direct',
        description: 'Pour toute question sur l\'accès ou organiser votre visite'
      }
    },
    en: {
      title: 'Find Us',
      subtitle: 'Domaine Vallot is located in the heart of the Côtes-du-Rhône in Vinsobres',
      address: {
        title: 'Address',
        street: '3176 route de Nyons – Le Coriançon',
        city: '26110 VINSOBRES',
        gps: 'GPS: N 44° 20\' 0" E 5° 05\' 44"'
      },
      directions: {
        title: 'Driving Directions',
        subtitle: '3 A7 highway exits will allow you to reach us:',
        exits: [
          { name: 'Exit 18 - Montélimar Sud', direction: 'From the North' },
          { name: 'Exit 19 - Bollène', direction: 'From the North' },
          { name: 'Exit 21 - Orange Centre', direction: 'From the South' }
        ],
        parking: 'Free parking available on site'
      },
      visit: {
        title: 'Plan Your Visit',
        tasting: {
          title: 'Walk-in Tasting',
          description: 'Available during our opening hours',
          price: 'Free'
        },
        appointment: {
          title: 'Appointment Visit',
          description: 'Groups up to 20 people',
          contact: 'Contact us to arrange'
        }
      },
      contact: {
        title: 'Direct Contact',
        description: 'For any questions about access or to organize your visit'
      }
    }
  }

  const t = content[locale as keyof typeof content]

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=44.3333333,5.0955556&destination_place_id=ChIJ_____domaine_vallot`
  const addressForMaps = encodeURIComponent('3176 route de Nyons, Le Coriançon, 26110 VINSOBRES, France')

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.title}</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Address & GPS */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <MapPin className="h-6 w-6 text-wine-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{t.address.title}</h3>
            </div>

            <div className="space-y-2 text-gray-700">
              <p className="font-medium">{t.address.street}</p>
              <p className="font-medium">{t.address.city}</p>
              <p className="text-sm text-gray-500">{t.address.gps}</p>
            </div>

            <div className="mt-6 space-y-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${addressForMaps}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 transition-colors"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {locale === 'fr' ? 'Ouvrir dans Maps' : 'Open in Maps'}
              </a>

              <a
                href={`tel:+33475260324`}
                className="flex items-center justify-center w-full px-4 py-2 border border-wine-600 text-wine-600 rounded-lg hover:bg-wine-50 transition-colors"
              >
                <Phone className="h-4 w-4 mr-2" />
                {locale === 'fr' ? 'Appeler le domaine' : 'Call the winery'}
              </a>
            </div>
          </div>

          {/* Driving Directions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Car className="h-6 w-6 text-wine-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{t.directions.title}</h3>
            </div>

            <p className="text-gray-600 mb-4">{t.directions.subtitle}</p>

            <div className="space-y-3">
              {t.directions.exits.map((exit, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{exit.name}</p>
                  <p className="text-sm text-gray-600">{exit.direction}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 font-medium">{t.directions.parking}</p>
            </div>
          </div>

          {/* Visit Planning */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Clock className="h-6 w-6 text-wine-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">{t.visit.title}</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-wine-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{t.visit.tasting.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{t.visit.tasting.description}</p>
                <div className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  {t.visit.tasting.price}
                </div>
              </div>

              <div className="p-4 border border-wine-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{t.visit.appointment.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{t.visit.appointment.description}</p>
                <p className="text-xs text-wine-600 font-medium">{t.visit.appointment.contact}</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-wine-50 border border-wine-200 rounded-lg">
              <h4 className="font-medium text-wine-800 mb-1">{t.contact.title}</h4>
              <p className="text-sm text-wine-700">{t.contact.description}</p>
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-96 bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {locale === 'fr'
                    ? 'Carte interactive disponible'
                    : 'Interactive map available'
                  }
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${addressForMaps}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-wine-600 text-white rounded-lg hover:bg-wine-700 transition-colors"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {locale === 'fr' ? 'Voir sur Google Maps' : 'View on Google Maps'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}