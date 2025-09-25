// Email notification service for order status changes
import { Resend } from 'resend'
import { OrderStatus } from '@/hooks/useOrderTracking'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface OrderEmailData {
  order: OrderStatus
  customer: {
    name: string
    email: string
    locale: 'en' | 'fr'
  }
  estimatedDelivery?: string
  trackingNumber?: string
}

export class OrderNotificationService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                   process.env.NEXT_PUBLIC_BASE_URL ||
                   (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000')
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    const template = this.getOrderConfirmationTemplate(data)
    return this.sendEmail(data.customer.email, template)
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(data: OrderEmailData): Promise<boolean> {
    const template = this.getPaymentConfirmationTemplate(data)
    return this.sendEmail(data.customer.email, template)
  }

  /**
   * Send order processing notification
   */
  async sendProcessingNotification(data: OrderEmailData): Promise<boolean> {
    const template = this.getProcessingTemplate(data)
    return this.sendEmail(data.customer.email, template)
  }

  /**
   * Send shipping notification with tracking info
   */
  async sendShippingNotification(data: OrderEmailData): Promise<boolean> {
    const template = this.getShippingTemplate(data)
    return this.sendEmail(data.customer.email, template)
  }

  /**
   * Send delivery confirmation
   */
  async sendDeliveryConfirmation(data: OrderEmailData): Promise<boolean> {
    const template = this.getDeliveryTemplate(data)
    return this.sendEmail(data.customer.email, template)
  }

  /**
   * Send order status update notification
   */
  async sendOrderUpdate(data: OrderEmailData, message: string): Promise<boolean> {
    const template = this.getUpdateTemplate(data, message)
    return this.sendEmail(data.customer.email, template)
  }

  /**
   * Generic email sender
   */
  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      await resend.emails.send({
        from: 'Domaine Vallot <orders@domaine-vallot.com>',
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  /**
   * Order confirmation email template
   */
  private getOrderConfirmationTemplate(data: OrderEmailData): EmailTemplate {
    const { order, customer } = data
    const locale = customer.locale
    const orderUrl = `${this.baseUrl}/${locale}/orders/${order.id}`

    const subject = locale === 'fr'
      ? `Confirmation de commande #${order.id.slice(-8)} - Domaine Vallot`
      : `Order Confirmation #${order.id.slice(-8)} - Domaine Vallot`

    const itemsList = order.items.map(item =>
      `${item.quantity}x ${item.product_name} - €${(item.quantity * item.price).toFixed(2)}`
    ).join('\n')

    const text = locale === 'fr' ? `
Bonjour ${customer.name},

Merci pour votre commande ! Nous avons bien reçu votre commande #${order.id.slice(-8)}.

Détails de la commande:
${itemsList}

Total: €${order.total_amount.toFixed(2)}

Vous pouvez suivre votre commande à tout moment en visitant: ${orderUrl}

Nous vous tiendrons informé(e) de l'avancement de votre commande.

Cordialement,
L'équipe Domaine Vallot
` : `
Hello ${customer.name},

Thank you for your order! We have received your order #${order.id.slice(-8)}.

Order details:
${itemsList}

Total: €${order.total_amount.toFixed(2)}

You can track your order at any time by visiting: ${orderUrl}

We'll keep you updated on your order progress.

Best regards,
The Domaine Vallot Team
`

    const html = this.getEmailHTML({
      locale,
      title: locale === 'fr' ? 'Commande confirmée' : 'Order Confirmed',
      customerName: customer.name,
      orderId: order.id.slice(-8),
      items: order.items,
      total: order.total_amount,
      orderUrl,
      message: locale === 'fr'
        ? 'Merci pour votre commande ! Nous avons bien reçu votre commande et nous la préparons avec soin.'
        : 'Thank you for your order! We have received your order and are preparing it with care.'
    })

    return { subject, html, text }
  }

  /**
   * Payment confirmation email template
   */
  private getPaymentConfirmationTemplate(data: OrderEmailData): EmailTemplate {
    const { order, customer } = data
    const locale = customer.locale
    const orderUrl = `${this.baseUrl}/${locale}/orders/${order.id}`

    const subject = locale === 'fr'
      ? `Paiement confirmé - Commande #${order.id.slice(-8)}`
      : `Payment Confirmed - Order #${order.id.slice(-8)}`

    const text = locale === 'fr' ? `
Bonjour ${customer.name},

Votre paiement de €${order.total_amount.toFixed(2)} pour la commande #${order.id.slice(-8)} a été confirmé.

Nous commençons maintenant la préparation de votre commande.

Suivez votre commande: ${orderUrl}

Cordialement,
L'équipe Domaine Vallot
` : `
Hello ${customer.name},

Your payment of €${order.total_amount.toFixed(2)} for order #${order.id.slice(-8)} has been confirmed.

We are now starting to prepare your order.

Track your order: ${orderUrl}

Best regards,
The Domaine Vallot Team
`

    const html = this.getEmailHTML({
      locale,
      title: locale === 'fr' ? 'Paiement confirmé' : 'Payment Confirmed',
      customerName: customer.name,
      orderId: order.id.slice(-8),
      items: order.items,
      total: order.total_amount,
      orderUrl,
      message: locale === 'fr'
        ? 'Votre paiement a été confirmé. Nous commençons maintenant la préparation de votre commande.'
        : 'Your payment has been confirmed. We are now starting to prepare your order.'
    })

    return { subject, html, text }
  }

  /**
   * Shipping notification email template
   */
  private getShippingTemplate(data: OrderEmailData): EmailTemplate {
    const { order, customer, trackingNumber } = data
    const locale = customer.locale
    const orderUrl = `${this.baseUrl}/${locale}/orders/${order.id}`

    const subject = locale === 'fr'
      ? `Votre commande est expédiée - #${order.id.slice(-8)}`
      : `Your order has been shipped - #${order.id.slice(-8)}`

    const text = locale === 'fr' ? `
Bonjour ${customer.name},

Excellente nouvelle ! Votre commande #${order.id.slice(-8)} a été expédiée.

${trackingNumber ? `Numéro de suivi: ${trackingNumber}` : ''}

Suivez votre commande: ${orderUrl}

Cordialement,
L'équipe Domaine Vallot
` : `
Hello ${customer.name},

Great news! Your order #${order.id.slice(-8)} has been shipped.

${trackingNumber ? `Tracking number: ${trackingNumber}` : ''}

Track your order: ${orderUrl}

Best regards,
The Domaine Vallot Team
`

    const html = this.getEmailHTML({
      locale,
      title: locale === 'fr' ? 'Commande expédiée' : 'Order Shipped',
      customerName: customer.name,
      orderId: order.id.slice(-8),
      items: order.items,
      total: order.total_amount,
      orderUrl,
      message: locale === 'fr'
        ? `Excellente nouvelle ! Votre commande a été expédiée.${trackingNumber ? ` Numéro de suivi: ${trackingNumber}` : ''}`
        : `Great news! Your order has been shipped.${trackingNumber ? ` Tracking number: ${trackingNumber}` : ''}`
    })

    return { subject, html, text }
  }

  /**
   * Processing notification email template
   */
  private getProcessingTemplate(data: OrderEmailData): EmailTemplate {
    const { order, customer } = data
    const locale = customer.locale

    const subject = locale === 'fr'
      ? `Votre commande est en préparation - #${order.id.slice(-8)}`
      : `Your order is being prepared - #${order.id.slice(-8)}`

    const text = locale === 'fr' ? `
Bonjour ${customer.name},

Votre commande #${order.id.slice(-8)} est maintenant en préparation.

Nos experts sélectionnent soigneusement vos vins pour vous garantir la meilleure qualité.

Cordialement,
L'équipe Domaine Vallot
` : `
Hello ${customer.name},

Your order #${order.id.slice(-8)} is now being prepared.

Our experts are carefully selecting your wines to ensure the best quality.

Best regards,
The Domaine Vallot Team
`

    const html = this.getEmailHTML({
      locale,
      title: locale === 'fr' ? 'Commande en préparation' : 'Order Being Prepared',
      customerName: customer.name,
      orderId: order.id.slice(-8),
      items: order.items,
      total: order.total_amount,
      orderUrl: `${this.baseUrl}/${locale}/orders/${order.id}`,
      message: locale === 'fr'
        ? 'Votre commande est maintenant en préparation. Nos experts sélectionnent soigneusement vos vins.'
        : 'Your order is now being prepared. Our experts are carefully selecting your wines.'
    })

    return { subject, html, text }
  }

  /**
   * Delivery confirmation email template
   */
  private getDeliveryTemplate(data: OrderEmailData): EmailTemplate {
    const { order, customer } = data
    const locale = customer.locale

    const subject = locale === 'fr'
      ? `Votre commande a été livrée - #${order.id.slice(-8)}`
      : `Your order has been delivered - #${order.id.slice(-8)}`

    const text = locale === 'fr' ? `
Bonjour ${customer.name},

Votre commande #${order.id.slice(-8)} a été livrée avec succès !

Nous espérons que vous apprécierez vos vins. N'hésitez pas à nous faire part de vos impressions.

Merci de votre confiance !

Cordialement,
L'équipe Domaine Vallot
` : `
Hello ${customer.name},

Your order #${order.id.slice(-8)} has been successfully delivered!

We hope you enjoy your wines. Feel free to share your impressions with us.

Thank you for your trust!

Best regards,
The Domaine Vallot Team
`

    const html = this.getEmailHTML({
      locale,
      title: locale === 'fr' ? 'Commande livrée' : 'Order Delivered',
      customerName: customer.name,
      orderId: order.id.slice(-8),
      items: order.items,
      total: order.total_amount,
      orderUrl: `${this.baseUrl}/${locale}/orders/${order.id}`,
      message: locale === 'fr'
        ? 'Votre commande a été livrée avec succès ! Nous espérons que vous apprécierez vos vins.'
        : 'Your order has been successfully delivered! We hope you enjoy your wines.'
    })

    return { subject, html, text }
  }

  /**
   * General update notification template
   */
  private getUpdateTemplate(data: OrderEmailData, message: string): EmailTemplate {
    const { order, customer } = data
    const locale = customer.locale

    const subject = locale === 'fr'
      ? `Mise à jour de commande - #${order.id.slice(-8)}`
      : `Order Update - #${order.id.slice(-8)}`

    const text = locale === 'fr' ? `
Bonjour ${customer.name},

Mise à jour concernant votre commande #${order.id.slice(-8)}:

${message}

Cordialement,
L'équipe Domaine Vallot
` : `
Hello ${customer.name},

Update regarding your order #${order.id.slice(-8)}:

${message}

Best regards,
The Domaine Vallot Team
`

    const html = this.getEmailHTML({
      locale,
      title: locale === 'fr' ? 'Mise à jour de commande' : 'Order Update',
      customerName: customer.name,
      orderId: order.id.slice(-8),
      items: order.items,
      total: order.total_amount,
      orderUrl: `${this.baseUrl}/${locale}/orders/${order.id}`,
      message
    })

    return { subject, html, text }
  }

  /**
   * Generate HTML email template
   */
  private getEmailHTML(data: {
    locale: 'en' | 'fr'
    title: string
    customerName: string
    orderId: string
    items: any[]
    total: number
    orderUrl: string
    message: string
  }): string {
    return `
<!DOCTYPE html>
<html lang="${data.locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .order-info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .items-list { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .button { display: inline-block; background: #1f2937; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Domaine Vallot</h1>
      <h2>${data.title}</h2>
    </div>
    <div class="content">
      <p>${data.locale === 'fr' ? 'Bonjour' : 'Hello'} ${data.customerName},</p>
      <p>${data.message}</p>

      <div class="order-info">
        <h3>${data.locale === 'fr' ? 'Commande' : 'Order'} #${data.orderId}</h3>
        <p><strong>${data.locale === 'fr' ? 'Total:' : 'Total:'}</strong> €${data.total.toFixed(2)}</p>
      </div>

      <div class="items-list">
        <h4>${data.locale === 'fr' ? 'Articles:' : 'Items:'}</h4>
        ${data.items.map(item => `
          <div class="item">
            <span>${item.quantity}x ${item.product_name}</span>
            <span>€${(item.quantity * item.price).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>

      <a href="${data.orderUrl}" class="button">
        ${data.locale === 'fr' ? 'Suivre la commande' : 'Track Order'}
      </a>
    </div>
    <div class="footer">
      <p>Domaine Vallot - ${data.locale === 'fr' ? 'Vins d\'exception' : 'Exceptional Wines'}</p>
    </div>
  </div>
</body>
</html>
`
  }
}

// Export singleton instance
export const orderNotificationService = new OrderNotificationService()

// Helper function to send notification based on order status
export async function sendOrderStatusNotification(
  order: OrderStatus,
  customer: { name: string; email: string; locale: 'en' | 'fr' },
  previousStatus?: string
): Promise<boolean> {
  const data: OrderEmailData = { order, customer }

  try {
    switch (order.status) {
      case 'pending':
        if (order.payment_status === 'paid') {
          return await orderNotificationService.sendPaymentConfirmation(data)
        } else {
          return await orderNotificationService.sendOrderConfirmation(data)
        }

      case 'processing':
        if (previousStatus !== 'processing') {
          return await orderNotificationService.sendProcessingNotification(data)
        }
        break

      case 'shipped':
        if (previousStatus !== 'shipped') {
          return await orderNotificationService.sendShippingNotification({
            ...data,
            trackingNumber: order.tracking_number
          })
        }
        break

      case 'delivered':
        if (previousStatus !== 'delivered') {
          return await orderNotificationService.sendDeliveryConfirmation(data)
        }
        break
    }

    return true
  } catch (error) {
    console.error('Failed to send order status notification:', error)
    return false
  }
}