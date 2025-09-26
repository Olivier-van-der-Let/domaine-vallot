import { Metadata } from 'next'
import AboutHero from '@/components/about/AboutHero'
import FamilyStoryTimeline from '@/components/about/FamilyStoryTimeline'
import TeamMemberSpotlight from '@/components/about/TeamMemberSpotlight'
import ValuesGrid from '@/components/about/ValuesGrid'
import VisitInfoSection from '@/components/about/VisitInfoSection'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Discover Domaine Vallot, a five-generation biodynamic winery in Vinsobres. From limestone terroir at 450m altitude, we craft authentic Côtes-du-Rhône wines expressing our unique high-country terroir.'
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  return (
    <div className="min-h-screen">
      <AboutHero locale={locale} />
      <FamilyStoryTimeline locale={locale} />
      <TeamMemberSpotlight locale={locale} />
      <ValuesGrid locale={locale} />
      <VisitInfoSection locale={locale} />
    </div>
  )
}