'use client'

interface ScrollIndicatorProps {
  locale: string
}

export default function ScrollIndicator({ locale }: ScrollIndicatorProps) {
  const handleScroll = () => {
    const nextSection = document.querySelector('section:nth-of-type(2)')
    nextSection?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleScroll()
    }
  }

  return (
    <div
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={locale === 'fr' ? 'Faire défiler vers le bas' : 'Scroll down'}
      onClick={handleScroll}
      onKeyDown={handleKeyDown}
    >
      <svg
        className="w-6 h-6 text-heritage-limestone opacity-70 hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  )
}