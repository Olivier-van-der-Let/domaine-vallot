'use client'

interface TeamMemberSpotlightProps {
  locale: string
}

export default function TeamMemberSpotlight({ locale }: TeamMemberSpotlightProps) {
  const content = {
    fr: {
      overline: 'Notre Équipe',
      hero: {
        title: 'La Famille Vallot',
        subtitle: 'Générations Unies par la Passion du Terroir',
        description: 'Depuis cinq générations, la famille Vallot cultive les vignes avec passion et respect. François et Anaïs, père et fille, unissent leurs forces pour perpétuer l\'héritage familial tout en innovant vers l\'avenir. Ensemble, ils incarnent la parfaite harmonie entre tradition et modernité.',
        quote: '"La force de notre domaine réside dans la transmission des savoirs entre générations et notre engagement commun envers l\'excellence biodynamique."'
      },
      collaboration: {
        title: 'Une Collaboration Exceptionnelle',
        description: 'L\'union des expériences de François, pionnier de la biodynamie depuis 30 ans, et d\'Anaïs, forte de son expertise internationale en hospitalité, crée une synergie unique. Cette collaboration multigénérationnelle permet au domaine de conjuguer savoir-faire ancestral et vision moderne.'
      },
      achievements: {
        title: 'Nos Réalisations Collectives',
        items: [
          {
            title: 'Certifications Biodynamiques',
            description: 'Ecocert (2003) et Demeter (2007) - Pionniers en Drôme'
          },
          {
            title: 'Innovation & Tradition',
            description: '30 ans d\'excellence biodynamique avec vision internationale'
          },
          {
            title: 'Leadership Familial',
            description: 'Transmission réussie vers la 5ème génération'
          },
          {
            title: 'Reconnaissance Mondiale',
            description: 'Expertise reconnue du terroir aux marchés internationaux'
          }
        ]
      },
      philosophy: {
        title: 'Notre Philosophie Commune',
        description: 'Nous croyons que l\'excellence naît de la collaboration harmonieuse entre générations. Chaque décision est prise ensemble, chaque innovation respecte notre héritage, et chaque vin reflète notre vision partagée du terroir.'
      }
    },
    en: {
      overline: 'Our Team',
      hero: {
        title: 'The Vallot Family',
        subtitle: 'Generations United by Passion for Terroir',
        description: 'For five generations, the Vallot family has cultivated vines with passion and respect. François and Anaïs, father and daughter, unite their strengths to perpetuate the family heritage while innovating toward the future. Together, they embody the perfect harmony between tradition and modernity.',
        quote: '"The strength of our domain lies in the transmission of knowledge between generations and our shared commitment to biodynamic excellence."'
      },
      collaboration: {
        title: 'An Exceptional Collaboration',
        description: 'The union of François\' experience, a biodynamic pioneer for 30 years, and Anaïs\' international hospitality expertise creates a unique synergy. This multigenerational collaboration allows the domain to combine ancestral know-how with modern vision.'
      },
      achievements: {
        title: 'Our Collective Achievements',
        items: [
          {
            title: 'Biodynamic Certifications',
            description: 'Ecocert (2003) and Demeter (2007) - Pioneers in Drôme'
          },
          {
            title: 'Innovation & Tradition',
            description: '30 years of biodynamic excellence with international vision'
          },
          {
            title: 'Family Leadership',
            description: 'Successful transmission to the 5th generation'
          },
          {
            title: 'Global Recognition',
            description: 'Expertise recognized from terroir to international markets'
          }
        ]
      },
      philosophy: {
        title: 'Our Shared Philosophy',
        description: 'We believe that excellence is born from harmonious collaboration between generations. Every decision is made together, every innovation respects our heritage, and every wine reflects our shared vision of terroir.'
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

        {/* Hero Team Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-24">
          {/* Team Photo */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
              <img
                src="https://vmtudbupajnjyauvqnej.supabase.co/storage/v1/object/public/Public/decorative/Team-vallot.jpg"
                alt="François and Anaïs Vallot working together in vineyard"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Decorative Elements */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-heritage-golden-100 rounded-lg -z-10"></div>
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-heritage-olive-100 rounded-lg -z-10"></div>
          </div>

          {/* Hero Content */}
          <div className="space-y-8">
            <div>
              <p className="text-heritage-rouge-600 font-medium text-sm tracking-wider uppercase mb-3">
                {text.hero.subtitle}
              </p>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-heritage-slate-900 mb-4">
                {text.hero.title}
              </h2>
            </div>

            <p className="text-heritage-slate-700 text-xl leading-relaxed">
              {text.hero.description}
            </p>

            {/* Team Quote */}
            <blockquote className="border-l-4 border-heritage-golden-500 pl-6 py-6 bg-heritage-golden-50 rounded-r-lg">
              <p className="text-heritage-golden-800 font-serif text-xl italic leading-relaxed">
                {text.hero.quote}
              </p>
              <footer className="mt-4 text-heritage-golden-700 font-medium">
                — {locale === 'fr' ? 'François & Anaïs Vallot' : 'François & Anaïs Vallot'}
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Collaboration Section */}
        <div className="mb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="font-serif text-3xl lg:text-4xl font-bold text-heritage-slate-900 mb-8">
              {text.collaboration.title}
            </h3>
            <p className="text-heritage-slate-700 text-lg leading-relaxed">
              {text.collaboration.description}
            </p>
          </div>
        </div>

        {/* Collective Achievements */}
        <div className="mb-20">
          <h3 className="font-serif text-3xl lg:text-4xl font-bold text-heritage-slate-900 text-center mb-12">
            {text.achievements.title}
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            {text.achievements.items.map((achievement, index) => (
              <div
                key={index}
                className="bg-heritage-limestone-50 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-3 h-3 rounded-full bg-heritage-rouge-500 flex-shrink-0 mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-heritage-slate-900 text-lg mb-2">
                      {achievement.title}
                    </h4>
                    <p className="text-heritage-slate-600 leading-relaxed">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Philosophy */}
        <div className="text-center">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-heritage-olive-50 to-heritage-golden-50 rounded-lg p-8 lg:p-12">
            <h3 className="font-serif text-3xl lg:text-4xl font-bold text-heritage-slate-900 mb-8">
              {text.philosophy.title}
            </h3>
            <p className="text-heritage-slate-700 text-xl leading-relaxed">
              {text.philosophy.description}
            </p>

            {/* Heritage Timeline */}
            <div className="mt-12 flex justify-center items-center space-x-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-heritage-rouge-100 rounded-full flex items-center justify-center mb-3">
                  <span className="font-serif font-bold text-heritage-rouge-700 text-lg">4e</span>
                </div>
                <p className="text-heritage-slate-600 font-medium text-sm">
                  {locale === 'fr' ? 'François' : 'François'}
                </p>
              </div>

              <div className="w-12 h-0.5 bg-heritage-golden-300"></div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-heritage-golden-100 rounded-full flex items-center justify-center mb-3 border-4 border-heritage-golden-200">
                  <span className="font-serif font-bold text-heritage-golden-700 text-xl">❤️</span>
                </div>
                <p className="text-heritage-slate-600 font-medium text-sm">
                  {locale === 'fr' ? 'Collaboration' : 'Collaboration'}
                </p>
              </div>

              <div className="w-12 h-0.5 bg-heritage-golden-300"></div>

              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-heritage-olive-100 rounded-full flex items-center justify-center mb-3">
                  <span className="font-serif font-bold text-heritage-olive-700 text-lg">5e</span>
                </div>
                <p className="text-heritage-slate-600 font-medium text-sm">
                  {locale === 'fr' ? 'Anaïs' : 'Anaïs'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}