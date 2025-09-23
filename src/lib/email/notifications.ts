import { Resend } from 'resend';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface OrderConfirmationData {
  order_id: string;
  customer_name: string;
  customer_email: string;
  order_total: number;
  currency: string;
  order_date: string;
  items: Array<{
    id: string;
    name: string;
    vintage: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  billing_address: {
    name: string;
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  payment_method: string;
  tracking_url?: string;
}

export interface ShippingNotificationData {
  order_id: string;
  customer_name: string;
  customer_email: string;
  tracking_number: string;
  tracking_url: string;
  carrier: string;
  estimated_delivery: string;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

export interface WelcomeEmailData {
  customer_name: string;
  customer_email: string;
  verification_url?: string;
  is_age_verified: boolean;
}

export interface PasswordResetData {
  customer_name: string;
  customer_email: string;
  reset_url: string;
  expires_at: string;
}

export interface AdminNotificationData {
  type: 'new_order' | 'low_stock' | 'order_issue' | 'contact_form';
  subject: string;
  data: any;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NewsletterData {
  customer_name: string;
  customer_email: string;
  subject: string;
  featured_wines?: Array<{
    name: string;
    vintage: string;
    image_url: string;
    price: number;
    url: string;
  }>;
  news_content: string;
  unsubscribe_url: string;
}

export class EmailNotificationService {
  private resend: Resend;
  private from_email: string;
  private admin_email: string;
  private base_url: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(apiKey);
    this.from_email = process.env.FROM_EMAIL || 'noreply@domainevallot.com';
    this.admin_email = process.env.ADMIN_EMAIL || 'admin@domainevallot.com';
    this.base_url = process.env.NEXT_PUBLIC_SITE_URL || 'https://domainevallot.com';
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.buildOrderConfirmationTemplate(data);

      const result = await this.resend.emails.send({
        from: this.from_email,
        to: data.customer_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'order_confirmation' },
          { name: 'order_id', value: data.order_id },
        ],
      });

      if (result.error) {
        console.error('Order confirmation email failed:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Order confirmation email error:', error);
      return { success: false, error: String(error) };
    }
  }

  async sendShippingNotification(data: ShippingNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.buildShippingNotificationTemplate(data);

      const result = await this.resend.emails.send({
        from: this.from_email,
        to: data.customer_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'shipping_notification' },
          { name: 'order_id', value: data.order_id },
        ],
      });

      if (result.error) {
        console.error('Shipping notification email failed:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Shipping notification email error:', error);
      return { success: false, error: String(error) };
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.buildWelcomeTemplate(data);

      const result = await this.resend.emails.send({
        from: this.from_email,
        to: data.customer_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'welcome' },
          { name: 'age_verified', value: data.is_age_verified.toString() },
        ],
      });

      if (result.error) {
        console.error('Welcome email failed:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: String(error) };
    }
  }

  async sendPasswordReset(data: PasswordResetData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.buildPasswordResetTemplate(data);

      const result = await this.resend.emails.send({
        from: this.from_email,
        to: data.customer_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'password_reset' },
        ],
      });

      if (result.error) {
        console.error('Password reset email failed:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: String(error) };
    }
  }

  async sendAdminNotification(data: AdminNotificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.buildAdminNotificationTemplate(data);

      const result = await this.resend.emails.send({
        from: this.from_email,
        to: this.admin_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'admin_notification' },
          { name: 'type', value: data.type },
          { name: 'priority', value: data.priority },
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

  async sendNewsletter(data: NewsletterData): Promise<{ success: boolean; error?: string }> {
    try {
      const template = this.buildNewsletterTemplate(data);

      const result = await this.resend.emails.send({
        from: this.from_email,
        to: data.customer_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        tags: [
          { name: 'category', value: 'newsletter' },
        ],
      });

      if (result.error) {
        console.error('Newsletter email failed:', result.error);
        return { success: false, error: result.error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Newsletter email error:', error);
      return { success: false, error: String(error) };
    }
  }

  private buildOrderConfirmationTemplate(data: OrderConfirmationData): EmailTemplate {
    const subject = `Confirmation de commande #${data.order_id} - Domaine Vallot`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #722f37; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .order-summary { background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .item { border-bottom: 1px solid #eee; padding: 15px 0; display: flex; align-items: center; }
    .item:last-child { border-bottom: none; }
    .item-image { width: 80px; height: 80px; margin-right: 15px; border-radius: 4px; }
    .item-details { flex: 1; }
    .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #722f37; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
    .address { background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
    .button { background-color: #722f37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Merci pour votre commande !</h1>
    <p>Domaine Vallot</p>
  </div>

  <div class="content">
    <p>Bonjour ${data.customer_name},</p>

    <p>Nous avons bien reçu votre commande #${data.order_id} passée le ${new Date(data.order_date).toLocaleDateString('fr-FR')}.</p>

    <div class="order-summary">
      <h2>Récapitulatif de votre commande</h2>

      ${data.items.map(item => `
        <div class="item">
          ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" class="item-image">` : ''}
          <div class="item-details">
            <h3>${item.name} ${item.vintage}</h3>
            <p>Quantité: ${item.quantity}</p>
            <p>Prix unitaire: ${item.price.toFixed(2)} ${data.currency}</p>
            <p><strong>Sous-total: ${(item.quantity * item.price).toFixed(2)} ${data.currency}</strong></p>
          </div>
        </div>
      `).join('')}

      <div class="total">
        Total: ${data.order_total.toFixed(2)} ${data.currency}
      </div>
    </div>

    <div class="address">
      <h3>Adresse de livraison</h3>
      <p>
        ${data.shipping_address.name}<br>
        ${data.shipping_address.street}<br>
        ${data.shipping_address.postal_code} ${data.shipping_address.city}<br>
        ${data.shipping_address.country}
      </p>
    </div>

    <div class="address">
      <h3>Adresse de facturation</h3>
      <p>
        ${data.billing_address.name}<br>
        ${data.billing_address.street}<br>
        ${data.billing_address.postal_code} ${data.billing_address.city}<br>
        ${data.billing_address.country}
      </p>
    </div>

    <p><strong>Mode de paiement:</strong> ${data.payment_method}</p>

    ${data.tracking_url ? `<a href="${data.tracking_url}" class="button">Suivre ma commande</a>` : ''}

    <p>Nous vous enverrons un email de confirmation d'expédition dès que votre commande aura été expédiée.</p>

    <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>

    <p>Cordialement,<br>L'équipe Domaine Vallot</p>
  </div>

  <div class="footer">
    <p>Domaine Vallot | ${this.base_url}</p>
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body>
</html>`;

    const text = `
Merci pour votre commande !

Bonjour ${data.customer_name},

Nous avons bien reçu votre commande #${data.order_id} passée le ${new Date(data.order_date).toLocaleDateString('fr-FR')}.

Récapitulatif:
${data.items.map(item => `- ${item.name} ${item.vintage} (x${item.quantity}) - ${(item.quantity * item.price).toFixed(2)} ${data.currency}`).join('\n')}

Total: ${data.order_total.toFixed(2)} ${data.currency}

Adresse de livraison:
${data.shipping_address.name}
${data.shipping_address.street}
${data.shipping_address.postal_code} ${data.shipping_address.city}
${data.shipping_address.country}

Mode de paiement: ${data.payment_method}

Nous vous enverrons un email de confirmation d'expédition dès que votre commande aura été expédiée.

Cordialement,
L'équipe Domaine Vallot
${this.base_url}`;

    return { subject, html, text };
  }

  private buildShippingNotificationTemplate(data: ShippingNotificationData): EmailTemplate {
    const subject = `Votre commande #${data.order_id} a été expédiée - Domaine Vallot`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #722f37; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .tracking-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .button { background-color: #722f37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
    .address { background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 Votre commande est en route !</h1>
    <p>Domaine Vallot</p>
  </div>

  <div class="content">
    <p>Bonjour ${data.customer_name},</p>

    <p>Excellente nouvelle ! Votre commande #${data.order_id} a été expédiée.</p>

    <div class="tracking-info">
      <h2>Informations de suivi</h2>
      <p><strong>Transporteur:</strong> ${data.carrier}</p>
      <p><strong>Numéro de suivi:</strong> ${data.tracking_number}</p>
      <p><strong>Livraison estimée:</strong> ${new Date(data.estimated_delivery).toLocaleDateString('fr-FR')}</p>

      <a href="${data.tracking_url}" class="button">Suivre mon colis</a>
    </div>

    <div class="address">
      <h3>Adresse de livraison</h3>
      <p>
        ${data.shipping_address.name}<br>
        ${data.shipping_address.street}<br>
        ${data.shipping_address.postal_code} ${data.shipping_address.city}<br>
        ${data.shipping_address.country}
      </p>
    </div>

    <p>Vous pouvez suivre votre colis en temps réel en cliquant sur le lien ci-dessus ou en utilisant le numéro de suivi sur le site du transporteur.</p>

    <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>

    <p>Cordialement,<br>L'équipe Domaine Vallot</p>
  </div>

  <div class="footer">
    <p>Domaine Vallot | ${this.base_url}</p>
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body>
</html>`;

    const text = `
Votre commande est en route !

Bonjour ${data.customer_name},

Excellente nouvelle ! Votre commande #${data.order_id} a été expédiée.

Informations de suivi:
- Transporteur: ${data.carrier}
- Numéro de suivi: ${data.tracking_number}
- Livraison estimée: ${new Date(data.estimated_delivery).toLocaleDateString('fr-FR')}

Suivi en ligne: ${data.tracking_url}

Adresse de livraison:
${data.shipping_address.name}
${data.shipping_address.street}
${data.shipping_address.postal_code} ${data.shipping_address.city}
${data.shipping_address.country}

Cordialement,
L'équipe Domaine Vallot
${this.base_url}`;

    return { subject, html, text };
  }

  private buildWelcomeTemplate(data: WelcomeEmailData): EmailTemplate {
    const subject = 'Bienvenue chez Domaine Vallot !';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #722f37; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { background-color: #722f37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍷 Bienvenue chez Domaine Vallot !</h1>
  </div>

  <div class="content">
    <p>Bonjour ${data.customer_name},</p>

    <p>Merci de nous avoir rejoint ! Nous sommes ravis de vous accueillir dans la famille Domaine Vallot.</p>

    ${data.verification_url && !data.is_age_verified ? `
      <p><strong>Vérification d'âge requise</strong></p>
      <p>Pour pouvoir acheter nos vins, vous devez confirmer que vous avez l'âge légal (18 ans minimum en France).</p>
      <a href="${data.verification_url}" class="button">Vérifier mon âge</a>
    ` : ''}

    <p>Découvrez notre sélection de vins d'exception produits avec passion dans notre domaine familial.</p>

    <a href="${this.base_url}/products" class="button">Découvrir nos vins</a>

    <p>Si vous avez des questions, notre équipe est là pour vous accompagner.</p>

    <p>À bientôt,<br>L'équipe Domaine Vallot</p>
  </div>

  <div class="footer">
    <p>Domaine Vallot | ${this.base_url}</p>
  </div>
</body>
</html>`;

    const text = `
Bienvenue chez Domaine Vallot !

Bonjour ${data.customer_name},

Merci de nous avoir rejoint ! Nous sommes ravis de vous accueillir dans la famille Domaine Vallot.

${data.verification_url && !data.is_age_verified ? `
Vérification d'âge requise:
Pour pouvoir acheter nos vins, vous devez confirmer que vous avez l'âge légal (18 ans minimum en France).
Lien de vérification: ${data.verification_url}
` : ''}

Découvrez notre sélection de vins d'exception produits avec passion dans notre domaine familial.

Nos vins: ${this.base_url}/products

À bientôt,
L'équipe Domaine Vallot
${this.base_url}`;

    return { subject, html, text };
  }

  private buildPasswordResetTemplate(data: PasswordResetData): EmailTemplate {
    const subject = 'Réinitialisation de votre mot de passe - Domaine Vallot';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #722f37; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { background-color: #722f37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
    .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Réinitialisation de mot de passe</h1>
    <p>Domaine Vallot</p>
  </div>

  <div class="content">
    <p>Bonjour ${data.customer_name},</p>

    <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Domaine Vallot.</p>

    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

    <a href="${data.reset_url}" class="button">Réinitialiser mon mot de passe</a>

    <div class="warning">
      <p><strong>⚠️ Important :</strong></p>
      <p>Ce lien expire le ${new Date(data.expires_at).toLocaleDateString('fr-FR')} à ${new Date(data.expires_at).toLocaleTimeString('fr-FR')}.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
    </div>

    <p>Pour votre sécurité, ce lien ne peut être utilisé qu'une seule fois.</p>

    <p>Si vous avez des questions, contactez notre support.</p>

    <p>Cordialement,<br>L'équipe Domaine Vallot</p>
  </div>

  <div class="footer">
    <p>Domaine Vallot | ${this.base_url}</p>
    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
  </div>
</body>
</html>`;

    const text = `
Réinitialisation de mot de passe

Bonjour ${data.customer_name},

Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Domaine Vallot.

Lien de réinitialisation: ${data.reset_url}

IMPORTANT:
- Ce lien expire le ${new Date(data.expires_at).toLocaleDateString('fr-FR')} à ${new Date(data.expires_at).toLocaleTimeString('fr-FR')}
- Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email
- Ce lien ne peut être utilisé qu'une seule fois

Cordialement,
L'équipe Domaine Vallot
${this.base_url}`;

    return { subject, html, text };
  }

  private buildAdminNotificationTemplate(data: AdminNotificationData): EmailTemplate {
    const subject = `[${data.priority.toUpperCase()}] ${data.subject} - Domaine Vallot Admin`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .data { background-color: white; padding: 15px; border-radius: 4px; margin: 15px 0; font-family: monospace; white-space: pre-wrap; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚨 Notification Admin</h1>
    <p>Priorité: ${data.priority.toUpperCase()}</p>
  </div>

  <div class="content">
    <h2>${data.subject}</h2>

    <p><strong>Type:</strong> ${data.type}</p>
    <p><strong>Heure:</strong> ${new Date().toLocaleString('fr-FR')}</p>

    <div class="data">
${JSON.stringify(data.data, null, 2)}
    </div>

    <p>Connectez-vous à l'interface d'administration pour plus de détails.</p>
  </div>

  <div class="footer">
    <p>Domaine Vallot Admin | ${this.base_url}/admin</p>
  </div>
</body>
</html>`;

    const text = `
Notification Admin - ${data.priority.toUpperCase()}

${data.subject}

Type: ${data.type}
Heure: ${new Date().toLocaleString('fr-FR')}

Données:
${JSON.stringify(data.data, null, 2)}

Interface admin: ${this.base_url}/admin`;

    return { subject, html, text };
  }

  private buildNewsletterTemplate(data: NewsletterData): EmailTemplate {
    const subject = data.subject;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #722f37; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .wine-card { background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0; display: flex; align-items: center; }
    .wine-image { width: 100px; height: 100px; margin-right: 15px; border-radius: 4px; }
    .wine-info { flex: 1; }
    .button { background-color: #722f37; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 5px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍷 Newsletter Domaine Vallot</h1>
  </div>

  <div class="content">
    <p>Bonjour ${data.customer_name},</p>

    <div>
      ${data.news_content}
    </div>

    ${data.featured_wines && data.featured_wines.length > 0 ? `
      <h2>Nos vins à découvrir</h2>
      ${data.featured_wines.map(wine => `
        <div class="wine-card">
          <img src="${wine.image_url}" alt="${wine.name}" class="wine-image">
          <div class="wine-info">
            <h3>${wine.name} ${wine.vintage}</h3>
            <p><strong>${wine.price.toFixed(2)} EUR</strong></p>
            <a href="${wine.url}" class="button">Découvrir</a>
          </div>
        </div>
      `).join('')}
    ` : ''}

    <p>Cordialement,<br>L'équipe Domaine Vallot</p>
  </div>

  <div class="footer">
    <p>Domaine Vallot | ${this.base_url}</p>
    <p><a href="${data.unsubscribe_url}">Se désabonner</a></p>
  </div>
</body>
</html>`;

    const text = `
Newsletter Domaine Vallot

Bonjour ${data.customer_name},

${data.news_content}

${data.featured_wines && data.featured_wines.length > 0 ? `
Nos vins à découvrir:
${data.featured_wines.map(wine => `- ${wine.name} ${wine.vintage} - ${wine.price.toFixed(2)} EUR - ${wine.url}`).join('\n')}
` : ''}

Cordialement,
L'équipe Domaine Vallot

${this.base_url}
Se désabonner: ${data.unsubscribe_url}`;

    return { subject, html, text };
  }
}

export const createEmailNotificationService = () => {
  return new EmailNotificationService();
};