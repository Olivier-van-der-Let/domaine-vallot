'use client'

import React, { useState } from 'react'

interface CheckoutFormProps {
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
  cart?: any
}

export default function CheckoutForm({ onSubmit, loading = false, cart }: CheckoutFormProps) {
  const [step, setStep] = useState<'customer' | 'shipping' | 'payment'>('customer')
  const [formData, setFormData] = useState({
    customer: {
      email: '',
      firstName: '',
      lastName: '',
      phone: ''
    },
    shipping: {
      address: '',
      city: '',
      postalCode: '',
      country: 'FR'
    },
    payment: {
      method: 'mollie'
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <div className="max-w-2xl mx-auto" data-testid="checkout-form">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6" data-testid="checkout-title">Checkout</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" data-testid="customer-email-label">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  data-testid="customer-email"
                  value={formData.customer.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, email: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.customer.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, phone: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  data-testid="customer-firstname"
                  value={formData.customer.firstName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, firstName: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  data-testid="customer-lastname"
                  value={formData.customer.lastName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer, lastName: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  data-testid="shipping-address"
                  value={formData.shipping.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    shipping: { ...prev.shipping, address: e.target.value }
                  }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    data-testid="shipping-city"
                    value={formData.shipping.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, city: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Postal Code</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    data-testid="shipping-postal-code"
                    value={formData.shipping.postalCode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, postalCode: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    data-testid="shipping-country"
                    value={formData.shipping.country}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      shipping: { ...prev.shipping, country: e.target.value }
                    }))}
                  >
                    <option value="FR">France</option>
                    <option value="DE">Germany</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="BE">Belgium</option>
                    <option value="NL">Netherlands</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="payment"
                  value="mollie"
                  checked={formData.payment.method === 'mollie'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    payment: { method: e.target.value }
                  }))}
                  className="mr-3"
                />
                <span>Credit Card / PayPal / Bank Transfer</span>
              </label>
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                required
                className="mt-1 mr-3"
                data-testid="terms-checkbox"
              />
              <span className="text-sm text-gray-600">
                I agree to the terms and conditions and privacy policy
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
            data-testid="proceed-to-payment-button"
          >
            {loading ? 'Processing...' : 'Complete Order'}
          </button>
        </form>
      </div>
    </div>
  )
}