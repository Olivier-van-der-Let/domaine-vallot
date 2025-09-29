/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import CheckoutForm from './CheckoutForm'

const mockCart = {
  items: [
    {
      id: '1',
      productId: 'ce3fc7d1-559b-4d20-b387-bf906ec4df67',
      name: 'Test Wine 1',
      price: 11,
      quantity: 4
    },
    {
      id: '2',
      productId: '795e4f5e-5af8-4c91-a560-875c43599ae9',
      name: 'Test Wine 2',
      price: 8.5,
      quantity: 1
    }
  ],
  total: 52.5
}

const mockUser = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe'
}

describe('CheckoutForm MVP flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const fillContactAndAddress = () => {
    fireEvent.change(screen.getByTestId('customer-email'), {
      target: { value: 'customer@example.com' }
    })
    fireEvent.change(screen.getByTestId('customer-firstname'), {
      target: { value: 'Jane' }
    })
    fireEvent.change(screen.getByTestId('customer-lastname'), {
      target: { value: 'Doe' }
    })
    fireEvent.change(screen.getByTestId('shipping-address-line1'), {
      target: { value: '123 Rue du Vin' }
    })
    fireEvent.change(screen.getByTestId('shipping-postal-code'), {
      target: { value: '75001' }
    })
    fireEvent.change(screen.getByTestId('shipping-city'), {
      target: { value: 'Paris' }
    })
  }

  const advanceToPaymentStep = (shippingOptionTestId: string) => {
    fireEvent.click(screen.getByRole('button', { name: /continue to shipping/i }))
    fireEvent.click(screen.getByTestId(shippingOptionTestId))
    fireEvent.click(screen.getByRole('button', { name: /continue to payment/i }))
  }

  const acceptTermsAndAge = () => {
    fireEvent.click(screen.getByTestId('terms-checkbox'))
    fireEvent.click(
      screen.getByLabelText(/i confirm i am at least 18 years old/i)
    )
  }

  it('submits delivery order with correct totals', async () => {
    const onSubmit = jest.fn()

    render(
      <CheckoutForm
        cart={mockCart}
        user={mockUser}
        onSubmit={onSubmit}
        isProcessing={false}
        locale="en"
        updateShippingCost={jest.fn()}
        onShippingOptionChange={jest.fn()}
      />
    )

    fillContactAndAddress()
    advanceToPaymentStep('shipping-option-delivery')
    acceptTermsAndAge()
    fireEvent.click(screen.getByTestId('proceed-to-payment-button'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    const submissionData = onSubmit.mock.calls[0][0]

    expect(submissionData.subtotal).toBe(5250)
    expect(submissionData.shippingCost).toBe(1500)
    expect(submissionData.vatAmount).toBe(1350)
    expect(submissionData.totalAmount).toBe(8100)
    expect(submissionData.shipping_option.option_code).toBe('standard_home')
  })

  it('submits pickup order with zero shipping cost', async () => {
    const onSubmit = jest.fn()

    render(
      <CheckoutForm
        cart={mockCart}
        user={mockUser}
        onSubmit={onSubmit}
        isProcessing={false}
        locale="en"
        updateShippingCost={jest.fn()}
        onShippingOptionChange={jest.fn()}
      />
    )

    fillContactAndAddress()
    advanceToPaymentStep('shipping-option-pickup')
    acceptTermsAndAge()
    fireEvent.click(screen.getByTestId('proceed-to-payment-button'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    const submissionData = onSubmit.mock.calls[0][0]

    expect(submissionData.subtotal).toBe(5250)
    expect(submissionData.shippingCost).toBe(0)
    expect(submissionData.vatAmount).toBe(1050)
    expect(submissionData.totalAmount).toBe(6300)
    expect(submissionData.shipping_option.option_code).toBe('pickup_estate')
  })
})
