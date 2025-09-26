'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle, Loader2, Calendar, Users } from 'lucide-react'
import { InputField, TextareaField, SelectField, CheckboxField } from '@/components/ui/form/FormField'
import { Button } from '@/components/ui/form/Button'
import { wineContactFormSchema, type WineContactFormData } from '@/lib/validators/schemas'

type ContactFormData = WineContactFormData

interface ContactFormSectionProps {
  locale: string
}

export default function ContactFormSection({ locale }: ContactFormSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const content = {
    fr: {
      title: 'Contactez-nous',
      subtitle: 'Remplissez ce formulaire et nous vous répondrons dans les plus brefs délais.',
      fields: {
        firstName: { label: 'Prénom', placeholder: 'Votre prénom' },
        lastName: { label: 'Nom', placeholder: 'Votre nom' },
        email: { label: 'Email', placeholder: 'votre@email.com' },
        phone: { label: 'Téléphone (optionnel)', placeholder: '+33 4 75 26 03 24' },
        company: { label: 'Entreprise (optionnel)', placeholder: 'Nom de votre entreprise' },
        inquiryType: {
          label: 'Type de demande',
          options: [
            { value: '', label: 'Sélectionnez le type de votre demande' },
            { value: 'wine_tasting', label: 'Dégustation de vins' },
            { value: 'group_visit', label: 'Visite de groupe' },
            { value: 'wine_orders', label: 'Commande de vins' },
            { value: 'business_partnership', label: 'Partenariat professionnel' },
            { value: 'press_media', label: 'Presse et médias' },
            { value: 'general_inquiry', label: 'Question générale' }
          ]
        },
        groupSize: { label: 'Nombre de personnes', placeholder: 'Ex: 8' },
        preferredDate: { label: 'Date souhaitée', placeholder: '' },
        message: {
          label: 'Message',
          placeholder: 'Décrivez votre demande en détail. N\'hésitez pas à mentionner vos préférences de vins, votre expérience œnologique, ou toute information utile...'
        },
        ageVerified: 'Je confirme avoir au moins 18 ans (requis pour les demandes liées au vin)',
        privacyAccepted: 'J\'accepte la politique de confidentialité et le traitement de mes données personnelles',
        marketingConsent: 'Je souhaite recevoir des informations sur les nouveautés et événements du domaine'
      },
      submit: 'Envoyer ma demande',
      submitting: 'Envoi en cours...',
      success: {
        title: 'Message envoyé avec succès !',
        message: 'Nous avons bien reçu votre demande et nous vous répondrons dans les 24 heures.',
        newMessage: 'Envoyer un nouveau message'
      },
      hints: {
        groupSize: 'Nous accueillons jusqu\'à 20 personnes par groupe',
        phone: 'Format français recommandé',
        message: 'Plus votre message est détaillé, mieux nous pourrons vous conseiller'
      }
    },
    en: {
      title: 'Contact Us',
      subtitle: 'Fill out this form and we\'ll get back to you as soon as possible.',
      fields: {
        firstName: { label: 'First Name', placeholder: 'Your first name' },
        lastName: { label: 'Last Name', placeholder: 'Your last name' },
        email: { label: 'Email', placeholder: 'your@email.com' },
        phone: { label: 'Phone (optional)', placeholder: '+33 4 75 26 03 24' },
        company: { label: 'Company (optional)', placeholder: 'Your company name' },
        inquiryType: {
          label: 'Inquiry Type',
          options: [
            { value: '', label: 'Select your inquiry type' },
            { value: 'wine_tasting', label: 'Wine Tasting' },
            { value: 'group_visit', label: 'Group Visit' },
            { value: 'wine_orders', label: 'Wine Orders' },
            { value: 'business_partnership', label: 'Business Partnership' },
            { value: 'press_media', label: 'Press & Media' },
            { value: 'general_inquiry', label: 'General Inquiry' }
          ]
        },
        groupSize: { label: 'Group Size', placeholder: 'e.g., 8' },
        preferredDate: { label: 'Preferred Date', placeholder: '' },
        message: {
          label: 'Message',
          placeholder: 'Describe your inquiry in detail. Feel free to mention your wine preferences, experience level, or any useful information...'
        },
        ageVerified: 'I confirm that I am at least 18 years old (required for wine-related inquiries)',
        privacyAccepted: 'I accept the privacy policy and the processing of my personal data',
        marketingConsent: 'I would like to receive information about domain news and events'
      },
      submit: 'Send My Inquiry',
      submitting: 'Sending...',
      success: {
        title: 'Message sent successfully!',
        message: 'We have received your inquiry and will respond within 24 hours.',
        newMessage: 'Send a new message'
      },
      hints: {
        groupSize: 'We welcome groups up to 20 people',
        phone: 'French format recommended',
        message: 'The more detailed your message, the better we can advise you'
      }
    }
  }

  const t = content[locale as keyof typeof content]

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<ContactFormData>({
    resolver: zodResolver(wineContactFormSchema),
    mode: 'onBlur'
  })

  const inquiryType = watch('inquiryType')
  const message = watch('message') || ''

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Une erreur est survenue')
      }

      setIsSubmitted(true)
      reset()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNewMessage = () => {
    setIsSubmitted(false)
    setSubmitError(null)
  }

  if (isSubmitted) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {t.success.title}
          </h3>
          <p className="text-gray-600 mb-6">
            {t.success.message}
          </p>
          <Button
            onClick={handleNewMessage}
            variant="primary"
          >
            {t.success.newMessage}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t.title}</h2>
      <p className="text-gray-600 mb-8">{t.subtitle}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <InputField
            {...register('firstName')}
            label={t.fields.firstName.label}
            placeholder={t.fields.firstName.placeholder}
            required
            error={errors.firstName?.message}
          />

          <InputField
            {...register('lastName')}
            label={t.fields.lastName.label}
            placeholder={t.fields.lastName.placeholder}
            required
            error={errors.lastName?.message}
          />
        </div>

        <InputField
          {...register('email')}
          type="email"
          label={t.fields.email.label}
          placeholder={t.fields.email.placeholder}
          required
          error={errors.email?.message}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <InputField
            {...register('phone')}
            type="tel"
            label={t.fields.phone.label}
            placeholder={t.fields.phone.placeholder}
            hint={t.hints.phone}
            error={errors.phone?.message}
          />

          <InputField
            {...register('company')}
            label={t.fields.company.label}
            placeholder={t.fields.company.placeholder}
            error={errors.company?.message}
          />
        </div>

        {/* Inquiry Type */}
        <SelectField
          {...register('inquiryType')}
          label={t.fields.inquiryType.label}
          options={t.fields.inquiryType.options}
          required
          error={errors.inquiryType?.message}
        />

        {/* Conditional fields based on inquiry type */}
        {(inquiryType === 'group_visit' || inquiryType === 'wine_tasting') && (
          <div className="grid md:grid-cols-2 gap-4 p-4 bg-wine-50 rounded-lg border border-wine-200">
            <div className="flex items-center text-wine-700 mb-2 md:col-span-2">
              <Users className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Informations sur la visite</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.fields.groupSize.label}
              </label>
              <input
                {...register('groupSize', { valueAsNumber: true })}
                type="number"
                min="1"
                max="20"
                placeholder={t.fields.groupSize.placeholder}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-wine-500 sm:text-sm"
              />
              <p className="text-xs text-wine-600 mt-1">{t.hints.groupSize}</p>
              {errors.groupSize && (
                <p className="text-sm text-red-600 mt-1">{errors.groupSize.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                {t.fields.preferredDate.label}
              </label>
              <input
                {...register('preferredDate')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-wine-500 focus:border-wine-500 sm:text-sm"
              />
              {errors.preferredDate && (
                <p className="text-sm text-red-600 mt-1">{errors.preferredDate.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <TextareaField
            {...register('message')}
            label={t.fields.message.label}
            placeholder={t.fields.message.placeholder}
            rows={5}
            required
            hint={t.hints.message}
            error={errors.message?.message}
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {message.length}/1500 caractères
          </div>
        </div>

        {/* Honeypot field (hidden) */}
        <input
          {...register('website')}
          type="text"
          className="absolute -left-9999px opacity-0"
          tabIndex={-1}
          autoComplete="off"
        />

        {/* Consent checkboxes */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <CheckboxField
            {...register('ageVerified')}
            error={errors.ageVerified?.message}
          >
            {t.fields.ageVerified}
          </CheckboxField>

          <CheckboxField
            {...register('privacyAccepted')}
            error={errors.privacyAccepted?.message}
          >
            {t.fields.privacyAccepted}
          </CheckboxField>

          <CheckboxField
            {...register('marketingConsent')}
          >
            {t.fields.marketingConsent}
          </CheckboxField>
        </div>

        {/* Submit button */}
        <div className="pt-6">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        </div>
      </form>
    </div>
  )
}