import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export interface ShipmentNotificationData {
  customerName: string
  orderNumber: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  estimatedDelivery?: string
}

export interface DeliveryNotificationData {
  customerName: string
  orderNumber: string
  deliveredAt: string
  customerEmail: string
}

export interface ExceptionNotificationData {
  customerName: string
  orderNumber: string
  exceptionMessage: string
  trackingUrl?: string
  supportEmail: string
}

/**
 * Send a generic email
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email send')
      return { success: false, error: 'Email service not configured' }
    }

    const response = await resend.emails.send({
      from: options.from || process.env.RESEND_FROM_EMAIL || 'orders@domainevallot.com',
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text
    })

    if (response.error) {
      console.error('Resend email error:', response.error)
      return { success: false, error: response.error.message }
    }

    console.log('Email sent successfully:', response.data?.id)
    return { success: true, messageId: response.data?.id }

  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send shipment notification to customer
 */
export async function sendShipmentNotification(
  customerEmail: string,
  data: ShipmentNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Shipped</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .content { padding: 20px; background: #f9f9f9; border-radius: 10px; margin-bottom: 20px; }
        .tracking-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .tracking-button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🍷 Your Wine Order Has Shipped!</h1>
        <p>Order #${data.orderNumber}</p>
      </div>

      <div class="content">
        <p>Dear ${data.customerName},</p>

        <p>Great news! Your wine order has been shipped and is on its way to you.</p>

        <div class="details">
          <h3>📦 Shipping Details</h3>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          ${data.carrier ? `<p><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
          ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
          ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
        </div>

        ${data.trackingUrl ? `
          <div class="tracking-box">
            <h3>📍 Track Your Package</h3>
            <p>Click the button below to track your shipment in real-time:</p>
            <a href="${data.trackingUrl}" class="tracking-button">Track Your Order</a>
          </div>
        ` : ''}

        <h3>🔞 Important Delivery Information</h3>
        <div class="details">
          <p><strong>Age Verification Required:</strong> Please ensure someone 18+ is available to receive the delivery and provide valid ID.</p>
          <p><strong>Signature Required:</strong> A signature will be required upon delivery for security.</p>
          <p><strong>Safe Storage:</strong> Once received, store your wines in a cool, dark place.</p>
        </div>

        <p>Thank you for choosing Domaine Vallot. We hope you enjoy your wines!</p>
      </div>

      <div class="footer">
        <p>Domaine Vallot | Burgundy, France</p>
        <p>If you have any questions, contact us at support@domainevallot.com</p>
      </div>
    </body>
    </html>
  `

  const text = `
Your Wine Order Has Shipped! - Order #${data.orderNumber}

Dear ${data.customerName},

Great news! Your wine order has been shipped and is on its way to you.

Shipping Details:
- Order Number: ${data.orderNumber}
${data.carrier ? `- Carrier: ${data.carrier}` : ''}
${data.trackingNumber ? `- Tracking Number: ${data.trackingNumber}` : ''}
${data.estimatedDelivery ? `- Estimated Delivery: ${data.estimatedDelivery}` : ''}

${data.trackingUrl ? `Track your package: ${data.trackingUrl}` : ''}

Important Delivery Information:
- Age Verification Required: Please ensure someone 18+ is available to receive the delivery and provide valid ID.
- Signature Required: A signature will be required upon delivery for security.
- Safe Storage: Once received, store your wines in a cool, dark place.

Thank you for choosing Domaine Vallot. We hope you enjoy your wines!

Domaine Vallot | Burgundy, France
Questions? Contact us at support@domainevallot.com
  `

  return sendEmail({
    to: customerEmail,
    subject: `🍷 Your Wine Order #${data.orderNumber} Has Shipped!`,
    html,
    text
  })
}

/**
 * Send delivery confirmation to customer
 */
export async function sendDeliveryNotification(
  customerEmail: string,
  data: DeliveryNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Order Has Been Delivered</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px 20px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .content { padding: 20px; background: #f9f9f9; border-radius: 10px; margin-bottom: 20px; }
        .celebration { text-align: center; font-size: 48px; margin: 20px 0; }
        .review-box { background: white; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .review-button { display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .care-tips { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="celebration">🎉🍷</div>
        <h1>Your Wine Order Has Been Delivered!</h1>
        <p>Order #${data.orderNumber}</p>
      </div>

      <div class="content">
        <p>Dear ${data.customerName},</p>

        <p>Wonderful news! Your wine order was successfully delivered on ${data.deliveredAt}.</p>

        <div class="care-tips">
          <h3>🍾 Wine Care & Storage Tips</h3>
          <ul>
            <li><strong>Temperature:</strong> Store at 12-15°C (54-59°F) for optimal aging</li>
            <li><strong>Position:</strong> Keep bottles on their side to keep corks moist</li>
            <li><strong>Light:</strong> Store in a dark place away from direct sunlight</li>
            <li><strong>Humidity:</strong> Maintain 60-70% humidity if possible</li>
            <li><strong>Vibration:</strong> Minimize movement and vibrations</li>
          </ul>
        </div>

        <div class="review-box">
          <h3>⭐ How Was Your Experience?</h3>
          <p>We'd love to hear about your experience with our wines and service.</p>
          <a href="mailto:${data.customerEmail}?subject=Review%20for%20Order%20${data.orderNumber}" class="review-button">Share Your Feedback</a>
        </div>

        <p>Thank you for choosing Domaine Vallot. We hope you thoroughly enjoy your wines and look forward to serving you again!</p>

        <p><em>Santé! 🥂</em></p>
      </div>

      <div class="footer">
        <p>Domaine Vallot | Burgundy, France</p>
        <p>Follow us for wine tips and updates: info@domainevallot.com</p>
      </div>
    </body>
    </html>
  `

  const text = `
Your Wine Order Has Been Delivered! - Order #${data.orderNumber}

Dear ${data.customerName},

Wonderful news! Your wine order was successfully delivered on ${data.deliveredAt}.

Wine Care & Storage Tips:
- Temperature: Store at 12-15°C (54-59°F) for optimal aging
- Position: Keep bottles on their side to keep corks moist
- Light: Store in a dark place away from direct sunlight
- Humidity: Maintain 60-70% humidity if possible
- Vibration: Minimize movement and vibrations

How Was Your Experience?
We'd love to hear about your experience with our wines and service.
Reply to this email to share your feedback.

Thank you for choosing Domaine Vallot. We hope you thoroughly enjoy your wines and look forward to serving you again!

Santé! 🥂

Domaine Vallot | Burgundy, France
Follow us for wine tips and updates: info@domainevallot.com
  `

  return sendEmail({
    to: customerEmail,
    subject: `🎉 Your Wine Order #${data.orderNumber} Has Been Delivered!`,
    html,
    text
  })
}

/**
 * Send exception notification to customer
 */
export async function sendExceptionNotification(
  customerEmail: string,
  data: ExceptionNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Update on Your Wine Order</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); color: white; padding: 30px 20px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .content { padding: 20px; background: #f9f9f9; border-radius: 10px; margin-bottom: 20px; }
        .alert-box { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .support-box { background: white; border: 2px solid #007bff; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .support-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
        .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 Update on Your Wine Order</h1>
        <p>Order #${data.orderNumber}</p>
      </div>

      <div class="content">
        <p>Dear ${data.customerName},</p>

        <p>We wanted to update you on the status of your wine order.</p>

        <div class="alert-box">
          <h3>⚠️ Delivery Update</h3>
          <p><strong>Status:</strong> ${data.exceptionMessage}</p>
          <p>There has been a temporary delay or issue with your delivery. Don't worry - we're working to resolve this quickly.</p>
        </div>

        <h3>What happens next?</h3>
        <ul>
          <li>Our shipping partner is actively working to resolve the issue</li>
          <li>Your order is safe and will be delivered as soon as possible</li>
          <li>We'll keep you updated on any changes to the delivery status</li>
          <li>No action is required from you at this time</li>
        </ul>

        ${data.trackingUrl ? `
          <p>You can continue to track your order here: <a href="${data.trackingUrl}">Track Your Order</a></p>
        ` : ''}

        <div class="support-box">
          <h3>🤝 Need Help?</h3>
          <p>If you have any questions or concerns, our support team is here to help.</p>
          <a href="mailto:${data.supportEmail}?subject=Order%20Exception%20-%20${data.orderNumber}" class="support-button">Contact Support</a>
        </div>

        <p>Thank you for your patience and for choosing Domaine Vallot.</p>
      </div>

      <div class="footer">
        <p>Domaine Vallot | Burgundy, France</p>
        <p>Support: ${data.supportEmail}</p>
      </div>
    </body>
    </html>
  `

  const text = `
Update on Your Wine Order - Order #${data.orderNumber}

Dear ${data.customerName},

We wanted to update you on the status of your wine order.

Delivery Update:
Status: ${data.exceptionMessage}

There has been a temporary delay or issue with your delivery. Don't worry - we're working to resolve this quickly.

What happens next?
- Our shipping partner is actively working to resolve the issue
- Your order is safe and will be delivered as soon as possible
- We'll keep you updated on any changes to the delivery status
- No action is required from you at this time

${data.trackingUrl ? `Track your order: ${data.trackingUrl}` : ''}

Need Help?
If you have any questions or concerns, contact our support team: ${data.supportEmail}

Thank you for your patience and for choosing Domaine Vallot.

Domaine Vallot | Burgundy, France
Support: ${data.supportEmail}
  `

  return sendEmail({
    to: customerEmail,
    subject: `📦 Update on Your Wine Order #${data.orderNumber}`,
    html,
    text
  })
}

/**
 * Send admin notification about delivery exception
 */
export async function sendAdminExceptionNotification(
  adminEmail: string,
  data: ExceptionNotificationData & { customerEmail: string }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Delivery Exception Alert</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🚨 Delivery Exception Alert</h1>
      </div>

      <div class="alert">
        <h3>Order Exception Reported</h3>
        <p>A delivery exception has been reported for order #${data.orderNumber}</p>
      </div>

      <div class="details">
        <h3>Order Details</h3>
        <p><strong>Order Number:</strong> ${data.orderNumber}</p>
        <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
        <p><strong>Exception:</strong> ${data.exceptionMessage}</p>
        <p><strong>Tracking URL:</strong> ${data.trackingUrl || 'Not available'}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      </div>

      <h3>Recommended Actions</h3>
      <ul>
        <li>Contact the shipping carrier to investigate the issue</li>
        <li>Update the customer with resolution timeline if needed</li>
        <li>Monitor the tracking status for updates</li>
        <li>Consider offering compensation if delivery is significantly delayed</li>
      </ul>

      <p><em>This is an automated notification from the Domaine Vallot order management system.</em></p>
    </body>
    </html>
  `

  return sendEmail({
    to: adminEmail,
    subject: `🚨 Delivery Exception - Order #${data.orderNumber}`,
    html
  })
}