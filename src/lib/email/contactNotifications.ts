import { Resend } from 'resend';
import { EmailTemplate } from './notifications';

// Contact inquiry types and data structures
export type ContactInquiryType =
  | 'wine_tasting'
  | 'group_visit'
  | 'wine_orders'
  | 'business_partnership'
  | 'press_media'
  | 'general_inquiry';

export interface ContactInquiryData {
  inquiry_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  inquiry_type: ContactInquiryType;
  group_size?: number;
  preferred_date?: string;
  message: string;
  wine_preferences?: string;
  budget_range?: string;
  special_requirements?: string;
  marketing_consent: boolean;
  created_at: string;
}

export interface ContactAutoResponseData extends ContactInquiryData {
  language: 'fr' | 'en';
  reference_number: string;
}

export interface ContactAdminNotificationData extends ContactInquiryData {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  requires_immediate_attention: boolean;
  estimated_revenue?: number;
}

export class ContactEmailService {
  private resend: Resend;
  private from_email: string;
  private contact_email: string; // anais@domainevallot.com
  private base_url: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(apiKey);
    this.from_email = process.env.FROM_EMAIL || 'contact@domainevallot.com';
    this.contact_email = process.env.CONTACT_EMAIL || 'anais@domainevallot.com';
    this.base_url = process.env.NEXT_PUBLIC_SITE_URL || 'https://domainevallot.com';
  }

  /**
   * Send auto-response email to customer
   */
  async sendAutoResponse(data: ContactAutoResponseData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.buildAutoResponseTemplate(data);

      const result = await this.resend.emails.send({
        from: this.from_email,
        to: data.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'contact_auto_response' },
          { name: 'inquiry_type', value: data.inquiry_type },
          { name: 'inquiry_id', value: data.inquiry_id },
          { name: 'language', value: data.language },
        ],
      });

      if (result.error) {
        console.error('Auto-response email failed:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Auto-response email error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send notification email to Domaine Vallot staff
   */
  async sendAdminNotification(data: ContactAdminNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.buildAdminNotificationTemplate(data);

      const result = await this.resend.emails.send({
        from: this.from_email,
        to: this.contact_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'contact_admin_notification' },
          { name: 'inquiry_type', value: data.inquiry_type },
          { name: 'priority', value: data.priority },
          { name: 'inquiry_id', value: data.inquiry_id },
        ],
      });

      if (result.error) {
        console.error('Admin notification email failed:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Admin notification email error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Build auto-response email template
   */
  private buildAutoResponseTemplate(data: ContactAutoResponseData): EmailTemplate {
    const inquiryTypeLabels: Record<ContactInquiryType, { fr: string; en: string }> = {
      wine_tasting: { fr: 'Dégustation de vins', en: 'Wine Tasting' },
      group_visit: { fr: 'Visite de groupe', en: 'Group Visit' },
      wine_orders: { fr: 'Commande de vins', en: 'Wine Orders' },
      business_partnership: { fr: 'Partenariat commercial', en: 'Business Partnership' },
      press_media: { fr: 'Presse et médias', en: 'Press & Media' },
      general_inquiry: { fr: 'Demande générale', en: 'General Inquiry' }
    };

    const isEnglish = data.language === 'en';
    const inquiryTypeLabel = inquiryTypeLabels[data.inquiry_type][data.language];

    const subject = isEnglish
      ? `Thank you for contacting Domaine Vallot - Ref: ${data.reference_number}`
      : `Merci de nous avoir contactés - Domaine Vallot - Réf: ${data.reference_number}`;

    const greeting = isEnglish ? 'Dear' : 'Bonjour';
    const thankYouMessage = isEnglish
      ? 'Thank you for contacting Domaine Vallot.'
      : 'Merci de nous avoir contactés.';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #faf9f7;
    }
    .header {
      background: linear-gradient(135deg, #722f37 0%, #8b3a42 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 12px 12px 0 0;
      box-shadow: 0 2px 10px rgba(114, 47, 55, 0.2);
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: normal;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      background-color: white;
      padding: 30px;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .inquiry-summary {
      background-color: #f8f6f4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #722f37;
    }
    .inquiry-summary h3 {
      margin-top: 0;
      color: #722f37;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: bold;
      color: #666;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
    .signature {
      font-style: italic;
      color: #722f37;
      margin-top: 20px;
    }
    .wine-decoration {
      font-size: 24px;
      color: #722f37;
      margin: 10px 0;
    }
    .next-steps {
      background-color: #e8f4f0;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 3px solid #4a90a4;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="wine-decoration">🍷</div>
    <h1>${isEnglish ? 'Thank you for contacting us!' : 'Merci de nous avoir contactés !'}</h1>
    <p>Domaine Vallot</p>
  </div>

  <div class="content">
    <p>${greeting} ${data.first_name},</p>

    <p>${thankYouMessage}</p>

    <div class="inquiry-summary">
      <h3>${isEnglish ? 'Your Inquiry Summary' : 'Récapitulatif de votre demande'}</h3>

      <div class="detail-row">
        <span class="detail-label">${isEnglish ? 'Reference Number:' : 'Numéro de référence :'}</span>
        <span><strong>${data.reference_number}</strong></span>
      </div>

      <div class="detail-row">
        <span class="detail-label">${isEnglish ? 'Inquiry Type:' : 'Type de demande :'}</span>
        <span>${inquiryTypeLabel}</span>
      </div>

      ${data.group_size ? `
        <div class="detail-row">
          <span class="detail-label">${isEnglish ? 'Group Size:' : 'Nombre de personnes :'}</span>
          <span>${data.group_size} ${isEnglish ? 'people' : 'personnes'}</span>
        </div>
      ` : ''}

      ${data.preferred_date ? `
        <div class="detail-row">
          <span class="detail-label">${isEnglish ? 'Preferred Date:' : 'Date préférée :'}</span>
          <span>${new Date(data.preferred_date).toLocaleDateString(isEnglish ? 'en-GB' : 'fr-FR')}</span>
        </div>
      ` : ''}

      ${data.company ? `
        <div class="detail-row">
          <span class="detail-label">${isEnglish ? 'Company:' : 'Société :'}</span>
          <span>${data.company}</span>
        </div>
      ` : ''}
    </div>

    <div class="next-steps">
      <h4>${isEnglish ? 'What happens next?' : 'Et maintenant ?'}</h4>
      ${this.getNextStepsContent(data.inquiry_type, isEnglish)}
    </div>

    ${this.getInquirySpecificContent(data.inquiry_type, isEnglish)}

    <p class="signature">
      ${isEnglish ? 'Looking forward to welcoming you to our estate!' : 'Nous avons hâte de vous accueillir dans notre domaine !'}
      <br><br>
      ${isEnglish ? 'The Domaine Vallot Team' : 'L\'équipe Domaine Vallot'}
    </p>
  </div>

  <div class="footer">
    <p><strong>Domaine Vallot</strong></p>
    <p>${this.base_url} | ${this.contact_email}</p>
    <p>${isEnglish ? 'This email was sent automatically, please do not reply directly.' : 'Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.'}</p>
  </div>
</body>
</html>`;

    const text = `
${greeting} ${data.first_name},

${thankYouMessage}

${isEnglish ? 'Your Inquiry Summary' : 'Récapitulatif de votre demande'}:
${isEnglish ? 'Reference Number' : 'Numéro de référence'}: ${data.reference_number}
${isEnglish ? 'Inquiry Type' : 'Type de demande'}: ${inquiryTypeLabel}
${data.group_size ? `${isEnglish ? 'Group Size' : 'Nombre de personnes'}: ${data.group_size} ${isEnglish ? 'people' : 'personnes'}` : ''}
${data.preferred_date ? `${isEnglish ? 'Preferred Date' : 'Date préférée'}: ${new Date(data.preferred_date).toLocaleDateString(isEnglish ? 'en-GB' : 'fr-FR')}` : ''}
${data.company ? `${isEnglish ? 'Company' : 'Société'}: ${data.company}` : ''}

${this.getNextStepsText(data.inquiry_type, isEnglish)}

${isEnglish ? 'Looking forward to welcoming you to our estate!' : 'Nous avons hâte de vous accueillir dans notre domaine !'}

${isEnglish ? 'The Domaine Vallot Team' : 'L\'équipe Domaine Vallot'}

${this.base_url}
${this.contact_email}`;

    return { subject, html, text };
  }

  /**
   * Build admin notification template
   */
  private buildAdminNotificationTemplate(data: ContactAdminNotificationData): EmailTemplate {
    const priorityEmojis = {
      low: '🟢',
      normal: '🟡',
      high: '🟠',
      urgent: '🔴'
    };

    const inquiryTypeLabels: Record<ContactInquiryType, string> = {
      wine_tasting: 'Dégustation de vins',
      group_visit: 'Visite de groupe',
      wine_orders: 'Commande de vins',
      business_partnership: 'Partenariat commercial',
      press_media: 'Presse et médias',
      general_inquiry: 'Demande générale'
    };

    const subject = `${priorityEmojis[data.priority]} Nouvelle demande: ${inquiryTypeLabels[data.inquiry_type]} - ${data.first_name} ${data.last_name}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background-color: #722f37; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .priority-${data.priority} { background-color: ${this.getPriorityColor(data.priority)}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .contact-info { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .inquiry-details { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .message-content { background-color: #fff; padding: 15px; border-left: 4px solid #722f37; margin: 15px 0; }
    .action-required { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; width: 30%; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📨 Nouvelle Demande de Contact</h1>
    <p>Domaine Vallot - Administration</p>
  </div>

  <div class="content">
    <div class="priority-${data.priority}">
      Priorité: ${data.priority.toUpperCase()} ${priorityEmojis[data.priority]}
    </div>

    <div class="contact-info">
      <h3>👤 Informations Contact</h3>
      <table>
        <tr><td class="label">Nom:</td><td><strong>${data.first_name} ${data.last_name}</strong></td></tr>
        <tr><td class="label">Email:</td><td><a href="mailto:${data.email}">${data.email}</a></td></tr>
        ${data.phone ? `<tr><td class="label">Téléphone:</td><td><a href="tel:${data.phone}">${data.phone}</a></td></tr>` : ''}
        ${data.company ? `<tr><td class="label">Société:</td><td>${data.company}</td></tr>` : ''}
        <tr><td class="label">Date de soumission:</td><td>${new Date(data.created_at).toLocaleString('fr-FR')}</td></tr>
      </table>
    </div>

    <div class="inquiry-details">
      <h3>📋 Détails de la Demande</h3>
      <table>
        <tr><td class="label">Type:</td><td><strong>${inquiryTypeLabels[data.inquiry_type]}</strong></td></tr>
        <tr><td class="label">Réf. interne:</td><td>#${data.inquiry_id.substring(0, 8).toUpperCase()}</td></tr>
        ${data.group_size ? `<tr><td class="label">Taille du groupe:</td><td>${data.group_size} personnes</td></tr>` : ''}
        ${data.preferred_date ? `<tr><td class="label">Date préférée:</td><td>${new Date(data.preferred_date).toLocaleDateString('fr-FR')}</td></tr>` : ''}
        ${data.budget_range ? `<tr><td class="label">Budget:</td><td>${data.budget_range}</td></tr>` : ''}
        ${data.wine_preferences ? `<tr><td class="label">Préférences vinicoles:</td><td>${data.wine_preferences}</td></tr>` : ''}
        ${data.special_requirements ? `<tr><td class="label">Exigences spéciales:</td><td>${data.special_requirements}</td></tr>` : ''}
        <tr><td class="label">Consentement marketing:</td><td>${data.marketing_consent ? '✅ Oui' : '❌ Non'}</td></tr>
      </table>
    </div>

    <div class="message-content">
      <h3>💬 Message</h3>
      <p style="white-space: pre-wrap; font-style: italic;">"${data.message}"</p>
    </div>

    ${data.requires_immediate_attention ? `
      <div class="action-required">
        <h4>⚠️ Action Immédiate Requise</h4>
        <p>Cette demande nécessite une attention immédiate selon nos critères automatiques.</p>
        ${data.estimated_revenue ? `<p><strong>Revenus estimés:</strong> ${data.estimated_revenue}€</p>` : ''}
      </div>
    ` : ''}

    <div style="text-align: center; margin: 20px 0;">
      <a href="${this.base_url}/admin/inquiries/${data.inquiry_id}"
         style="background-color: #722f37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Gérer cette demande
      </a>
    </div>
  </div>

  <div class="footer">
    <p>Interface d'administration Domaine Vallot</p>
    <p>Cet email a été généré automatiquement par le système de gestion des contacts</p>
  </div>
</body>
</html>`;

    const text = `
Nouvelle Demande de Contact - Priorité: ${data.priority.toUpperCase()}

Contact: ${data.first_name} ${data.last_name}
Email: ${data.email}
${data.phone ? `Téléphone: ${data.phone}` : ''}
${data.company ? `Société: ${data.company}` : ''}

Type de demande: ${inquiryTypeLabels[data.inquiry_type]}
${data.group_size ? `Taille du groupe: ${data.group_size} personnes` : ''}
${data.preferred_date ? `Date préférée: ${new Date(data.preferred_date).toLocaleDateString('fr-FR')}` : ''}
${data.budget_range ? `Budget: ${data.budget_range}` : ''}

Message:
"${data.message}"

${data.wine_preferences ? `Préférences vinicoles: ${data.wine_preferences}` : ''}
${data.special_requirements ? `Exigences spéciales: ${data.special_requirements}` : ''}

Consentement marketing: ${data.marketing_consent ? 'Oui' : 'Non'}
Date de soumission: ${new Date(data.created_at).toLocaleString('fr-FR')}

Gérer cette demande: ${this.base_url}/admin/inquiries/${data.inquiry_id}`;

    return { subject, html, text };
  }

  private getPriorityColor(priority: string): string {
    const colors = {
      low: '#28a745',
      normal: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    return colors[priority as keyof typeof colors] || '#6c757d';
  }

  private getNextStepsContent(inquiryType: ContactInquiryType, isEnglish: boolean): string {
    const content: Record<ContactInquiryType, { en: string; fr: string }> = {
      wine_tasting: {
        en: '<p>Our team will contact you within <strong>24-48 hours</strong> to confirm availability and arrange your wine tasting experience.</p>',
        fr: '<p>Notre équipe vous recontactera dans les <strong>24-48 heures</strong> pour confirmer les disponibilités et organiser votre dégustation.</p>'
      },
      group_visit: {
        en: '<p>We will reach out within <strong>2-3 business days</strong> to discuss your group visit requirements and provide a customized proposal.</p>',
        fr: '<p>Nous vous contacterons dans les <strong>2-3 jours ouvrés</strong> pour discuter de vos besoins et vous proposer une visite sur mesure.</p>'
      },
      wine_orders: {
        en: '<p>Our sales team will contact you within <strong>24 hours</strong> with availability, pricing, and shipping information.</p>',
        fr: '<p>Notre équipe commerciale vous contactera dans les <strong>24 heures</strong> avec les disponibilités, tarifs et informations de livraison.</p>'
      },
      business_partnership: {
        en: '<p>A member of our business development team will reach out within <strong>3-5 business days</strong> to discuss partnership opportunities.</p>',
        fr: '<p>Un membre de notre équipe développement commercial vous contactera dans les <strong>3-5 jours ouvrés</strong> pour discuter des opportunités de partenariat.</p>'
      },
      press_media: {
        en: '<p>Our communications team will respond within <strong>24 hours</strong> with the requested information and media assets.</p>',
        fr: '<p>Notre équipe communication vous répondra dans les <strong>24 heures</strong> avec les informations et ressources médias demandées.</p>'
      },
      general_inquiry: {
        en: '<p>We will respond to your inquiry within <strong>48 hours</strong> with the information you requested.</p>',
        fr: '<p>Nous répondrons à votre demande dans les <strong>48 heures</strong> avec les informations demandées.</p>'
      }
    };

    return content[inquiryType][isEnglish ? 'en' : 'fr'];
  }

  private getNextStepsText(inquiryType: ContactInquiryType, isEnglish: boolean): string {
    const content: Record<ContactInquiryType, { en: string; fr: string }> = {
      wine_tasting: {
        en: 'Our team will contact you within 24-48 hours to confirm availability and arrange your wine tasting experience.',
        fr: 'Notre équipe vous recontactera dans les 24-48 heures pour confirmer les disponibilités et organiser votre dégustation.'
      },
      group_visit: {
        en: 'We will reach out within 2-3 business days to discuss your group visit requirements and provide a customized proposal.',
        fr: 'Nous vous contacterons dans les 2-3 jours ouvrés pour discuter de vos besoins et vous proposer une visite sur mesure.'
      },
      wine_orders: {
        en: 'Our sales team will contact you within 24 hours with availability, pricing, and shipping information.',
        fr: 'Notre équipe commerciale vous contactera dans les 24 heures avec les disponibilités, tarifs et informations de livraison.'
      },
      business_partnership: {
        en: 'A member of our business development team will reach out within 3-5 business days to discuss partnership opportunities.',
        fr: 'Un membre de notre équipe développement commercial vous contactera dans les 3-5 jours ouvrés pour discuter des opportunités de partenariat.'
      },
      press_media: {
        en: 'Our communications team will respond within 24 hours with the requested information and media assets.',
        fr: 'Notre équipe communication vous répondra dans les 24 heures avec les informations et ressources médias demandées.'
      },
      general_inquiry: {
        en: 'We will respond to your inquiry within 48 hours with the information you requested.',
        fr: 'Nous répondrons à votre demande dans les 48 heures avec les informations demandées.'
      }
    };

    return content[inquiryType][isEnglish ? 'en' : 'fr'];
  }

  private getInquirySpecificContent(inquiryType: ContactInquiryType, isEnglish: boolean): string {
    const content: Record<ContactInquiryType, { en: string; fr: string }> = {
      wine_tasting: {
        en: `
          <div style="background-color: #f8f6f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>🍷 About Our Wine Tastings</h4>
            <ul>
              <li>Duration: 1.5-2 hours</li>
              <li>Includes: Estate tour, cellar visit, tasting of 4-5 selected wines</li>
              <li>Price: €15 per person (free with purchases over €100)</li>
              <li>Group discounts available for 10+ people</li>
            </ul>
          </div>
        `,
        fr: `
          <div style="background-color: #f8f6f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>🍷 À Propos de Nos Dégustations</h4>
            <ul>
              <li>Durée : 1h30-2h</li>
              <li>Comprend : Visite du domaine, visite des chais, dégustation de 4-5 vins sélectionnés</li>
              <li>Tarif : 15€ par personne (gratuit pour les achats supérieurs à 100€)</li>
              <li>Tarifs de groupe disponibles pour 10+ personnes</li>
            </ul>
          </div>
        `
      },
      group_visit: {
        en: `
          <div style="background-color: #f8f6f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>👥 Group Visits</h4>
            <ul>
              <li>Customized experiences for groups of 8-50 people</li>
              <li>Educational presentations about our winemaking process</li>
              <li>Special group rates and packages available</li>
              <li>Can be combined with local restaurant recommendations</li>
            </ul>
          </div>
        `,
        fr: `
          <div style="background-color: #f8f6f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>👥 Visites de Groupe</h4>
            <ul>
              <li>Expériences personnalisées pour groupes de 8-50 personnes</li>
              <li>Présentations pédagogiques sur notre processus de vinification</li>
              <li>Tarifs et forfaits groupe spéciaux disponibles</li>
              <li>Peut être combiné avec des recommandations de restaurants locaux</li>
            </ul>
          </div>
        `
      },
      business_partnership: {
        en: `
          <div style="background-color: #f8f6f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>🤝 Partnership Opportunities</h4>
            <p>We're always interested in exploring mutually beneficial partnerships with:</p>
            <ul>
              <li>Restaurants and hospitality venues</li>
              <li>Wine distributors and importers</li>
              <li>Tourism and event companies</li>
              <li>Corporate clients for gifts and events</li>
            </ul>
          </div>
        `,
        fr: `
          <div style="background-color: #f8f6f4; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4>🤝 Opportunités de Partenariat</h4>
            <p>Nous sommes toujours intéressés par des partenariats mutuellement bénéfiques avec :</p>
            <ul>
              <li>Restaurants et établissements hôteliers</li>
              <li>Distributeurs et importateurs de vins</li>
              <li>Entreprises de tourisme et d'événementiel</li>
              <li>Clients corporate pour cadeaux et événements</li>
            </ul>
          </div>
        `
      },
      wine_orders: {
        en: '',
        fr: ''
      },
      press_media: {
        en: '',
        fr: ''
      },
      general_inquiry: {
        en: '',
        fr: ''
      }
    };

    return content[inquiryType][isEnglish ? 'en' : 'fr'];
  }
}

export const createContactEmailService = () => {
  return new ContactEmailService();
};