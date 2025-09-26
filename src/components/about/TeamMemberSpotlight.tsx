'use client'

interface TeamMemberSpotlightProps {
  locale: string
}

export default function TeamMemberSpotlight({ locale }: TeamMemberSpotlightProps) {
  const content = {
    fr: {
      overline: 'Rencontrez Notre Équipe',
      francoisSection: {
        name: 'François Vallot',
        title: 'Pionnier de la Biodynamie',
        subtitle: 'Quatrième Génération',
        description: 'Visionnaire et gardien de l\'héritage familial, François a transformé le domaine en adoptant l\'agriculture biodynamique dès les années 1990. Sa passion pour le terroir et son respect profond de la nature ont établi les fondements de notre philosophie actuelle.',
        quote: '"Le vin doit exprimer la vérité de son terroir. Notre rôle est d\'accompagner cette expression, pas de la dominer."',
        achievements: [
          'Certification Ecocert (2003)',
          'Certification Demeter (2007)',
          'Pionnier biodynamique en Drôme',
          '30 ans d\'innovation respectueuse'
        ]
      },
      anaisSection: {
        name: 'Anaïs Vallot',
        title: 'Vision Globale, Racines Locales',
        subtitle: 'Cinquième Génération',
        description: 'Après une carrière internationale dans l\'hôtellerie de luxe (Four Seasons, hôtel 5 étoiles à Genève), Anaïs a choisi de revenir à ses racines en 2013. Son expertise en hospitalité et sa formation au Château d\'Yquem apportent une dimension nouvelle au domaine.',
        quote: '"J\'ai parcouru le monde pour comprendre l\'excellence. Aujourd\'hui, je la cultive dans nos vignes."',
        achievements: [
          'Formation Four Seasons International',
          'Stage Château d\'Yquem',
          'Management hôtellerie 5 étoiles',
          'Première femme à diriger le domaine'
        ]
      }
    },
    en: {
      overline: 'Meet Our Team',
      francoisSection: {
        name: 'François Vallot',
        title: 'Pioneer of Biodynamics',
        subtitle: 'Fourth Generation',
        description: 'Visionary and guardian of the family heritage, François transformed the domain by adopting biodynamic agriculture from the 1990s. His passion for terroir and deep respect for nature established the foundations of our current philosophy.',
        quote: '"Wine must express the truth of its terroir. Our role is to accompany this expression, not to dominate it."',
        achievements: [
          'Ecocert Certification (2003)',
          'Demeter Certification (2007)',
          'Biodynamic Pioneer in Drôme',
          '30 years of respectful innovation'
        ]
      },
      anaisSection: {
        name: 'Anaïs Vallot',
        title: 'Global Vision, Local Roots',
        subtitle: 'Fifth Generation',
        description: 'After an international career in luxury hospitality (Four Seasons, 5-star hotel in Geneva), Anaïs chose to return to her roots in 2013. Her hospitality expertise and training at Château d\'Yquem bring a new dimension to the domain.',
        quote: '"I traveled the world to understand excellence. Today, I cultivate it in our vines."',
        achievements: [
          'Four Seasons International Training',
          'Château d\'Yquem Internship',
          '5-star Hotel Management',
          'First woman to lead the domain'
        ]
      }
    }
  }

  const text = content[locale as keyof typeof content] || content.en

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-heritage-olive-600 font-serif text-sm md:text-base tracking-wider uppercase mb-4">
            {text.overline}
          </p>
        </div>

        <div className="space-y-24">
          {/* François Vallot */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Photo */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src="https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/team/francois-vallot-portrait.jpg"
                  alt={`${text.francoisSection.name} in vineyard`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-heritage-golden-100 rounded-lg -z-10"></div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div>
                <p className="text-heritage-rouge-600 font-medium text-sm tracking-wider uppercase mb-2">
                  {text.francoisSection.subtitle}
                </p>
                <h3 className="font-serif text-3xl lg:text-4xl font-bold text-heritage-slate-900 mb-2">
                  {text.francoisSection.name}
                </h3>
                <p className="text-heritage-golden-600 font-serif text-xl font-medium">
                  {text.francoisSection.title}
                </p>
              </div>

              <p className="text-heritage-slate-700 text-lg leading-relaxed">
                {text.francoisSection.description}
              </p>

              {/* Quote */}
              <blockquote className="border-l-4 border-heritage-rouge-500 pl-6 py-4 bg-heritage-rouge-50 rounded-r-lg">
                <p className="text-heritage-rouge-800 font-serif text-lg italic leading-relaxed">
                  {text.francoisSection.quote}
                </p>
              </blockquote>

              {/* Achievements */}
              <div>
                <h4 className="font-semibold text-heritage-slate-800 mb-3">
                  {locale === 'fr' ? 'Réalisations Clés' : 'Key Achievements'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {text.francoisSection.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-heritage-rouge-500 flex-shrink-0"></div>
                      <span className="text-heritage-slate-600 text-sm">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Anaïs Vallot - Reversed Layout */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Content - Left on Desktop */}
            <div className="space-y-6 lg:order-1">
              <div>
                <p className="text-heritage-golden-600 font-medium text-sm tracking-wider uppercase mb-2">
                  {text.anaisSection.subtitle}
                </p>
                <h3 className="font-serif text-3xl lg:text-4xl font-bold text-heritage-slate-900 mb-2">
                  {text.anaisSection.name}
                </h3>
                <p className="text-heritage-olive-600 font-serif text-xl font-medium">
                  {text.anaisSection.title}
                </p>
              </div>

              <p className="text-heritage-slate-700 text-lg leading-relaxed">
                {text.anaisSection.description}
              </p>

              {/* Quote */}
              <blockquote className="border-l-4 border-heritage-golden-500 pl-6 py-4 bg-heritage-golden-50 rounded-r-lg">
                <p className="text-heritage-golden-800 font-serif text-lg italic leading-relaxed">
                  {text.anaisSection.quote}
                </p>
              </blockquote>

              {/* Achievements */}
              <div>
                <h4 className="font-semibold text-heritage-slate-800 mb-3">
                  {locale === 'fr' ? 'Réalisations Clés' : 'Key Achievements'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {text.anaisSection.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-heritage-golden-500 flex-shrink-0"></div>
                      <span className="text-heritage-slate-600 text-sm">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Photo - Right on Desktop */}
            <div className="relative lg:order-2">
              <div className="aspect-[4/5] rounded-lg overflow-hidden shadow-2xl">
                <img
                  src="https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/team/anais-vallot-portrait.jpg"
                  alt={`${text.anaisSection.name} in cellar`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* Decorative Element */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-heritage-olive-100 rounded-lg -z-10"></div>
            </div>
          </div>
        </div>

        {/* Team Philosophy */}
        <div className="mt-24 text-center">
          <div className="max-w-3xl mx-auto bg-heritage-limestone-50 rounded-lg p-8 lg:p-12">
            <h3 className="font-serif text-2xl lg:text-3xl font-bold text-heritage-slate-900 mb-6">
              {locale === 'fr' ? 'Notre Philosophie d\'Équipe' : 'Our Team Philosophy'}
            </h3>
            <p className="text-heritage-slate-700 text-lg leading-relaxed">
              {locale === 'fr'
                ? 'Ensemble, nous formons plus qu\'une équipe - nous sommes une famille unie par la passion du terroir et le respect de notre héritage. Chaque membre apporte son expertise unique, créant une harmonie qui se reflète dans chacun de nos vins.'
                : 'Together, we form more than a team - we are a family united by passion for terroir and respect for our heritage. Each member brings their unique expertise, creating a harmony that is reflected in each of our wines.'
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}