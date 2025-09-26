import { Metadata } from 'next'
import ContactHero from '@/components/contact/ContactHero'
import ContactFormSection from '@/components/contact/ContactFormSection'
import ContactInfoSidebar from '@/components/contact/ContactInfoSidebar'
import LocationSection from '@/components/contact/LocationSection'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Domaine Vallot for wine tastings, group visits, orders, and business partnerships. Visit our family winery in Vinsobres or contact us directly.'
}

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen">
      <ContactHero locale={locale} />

      {/* Two-column layout */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information Sidebar */}
          <ContactInfoSidebar locale={locale} />

          {/* Contact Form */}
          <ContactFormSection locale={locale} />
        </div>
      </div>

      {/* Location & Directions */}
      <LocationSection locale={locale} />
    </div>
  )
}