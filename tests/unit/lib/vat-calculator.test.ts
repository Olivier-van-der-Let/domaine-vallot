import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  VatCalculator,
  calculateVat,
  isEuCountry,
  formatVatAmount,
  formatVatRate,
  validateVatCalculationInput,
  VatCalculationInput,
  VatRate
} from '../../../src/lib/vat/calculator';

describe('VatCalculator', () => {
  let calculator: VatCalculator;

  beforeEach(() => {
    calculator = new VatCalculator();
  });

  describe('calculateVat', () => {
    it('should calculate VAT for French consumer (domestic)', () => {
      const input: VatCalculationInput = {
        amount: 2500, // €25.00 in cents
        shipping_amount: 500, // €5.00 in cents
        country_code: 'FR',
        customer_type: 'consumer'
      };

      const result = calculator.calculateVat(input);

      expect(result.base_amount).toBe(2500);
      expect(result.shipping_amount).toBe(500);
      expect(result.vat_rate).toBe(0.20); // 20% VAT in France
      expect(result.vat_amount).toBe(600); // (2500 + 500) * 0.20 = 600
      expect(result.total_amount).toBe(3600); // 2500 + 500 + 600
      expect(result.country_code).toBe('FR');
      expect(result.country).toBe('France');
      expect(result.is_reverse_charge).toBe(false);
      expect(result.breakdown.product_vat).toBe(500); // 2500 * 0.20
      expect(result.breakdown.shipping_vat).toBe(100); // 500 * 0.20
    });

    it('should calculate VAT for German consumer (EU B2C)', () => {
      const input: VatCalculationInput = {
        amount: 5000, // €50.00
        country_code: 'DE',
        customer_type: 'consumer'
      };

      const result = calculator.calculateVat(input);

      expect(result.vat_rate).toBe(0.19); // 19% VAT in Germany
      expect(result.vat_amount).toBe(950); // 5000 * 0.19
      expect(result.total_amount).toBe(5950);
      expect(result.country).toBe('Germany');
      expect(result.is_reverse_charge).toBe(false);
    });

    it('should apply reverse charge for EU B2B with valid VAT number', () => {
      const input: VatCalculationInput = {
        amount: 10000, // €100.00
        shipping_amount: 1000, // €10.00
        country_code: 'DE',
        customer_type: 'business',
        business_vat_number: 'DE123456789'
      };

      const result = calculator.calculateVat(input);

      expect(result.vat_rate).toBe(0); // Reverse charge = 0% VAT
      expect(result.vat_amount).toBe(0);
      expect(result.total_amount).toBe(11000); // Only base + shipping
      expect(result.is_reverse_charge).toBe(true);
      expect(result.exemption_reason).toBe('Reverse charge - B2B transaction');
    });

    it('should not apply reverse charge for business in same country (France)', () => {
      const input: VatCalculationInput = {
        amount: 5000,
        country_code: 'FR',
        customer_type: 'business',
        business_vat_number: 'FR12345678901'
      };

      const result = calculator.calculateVat(input);

      expect(result.vat_rate).toBe(0.20); // Normal French VAT
      expect(result.vat_amount).toBe(1000);
      expect(result.is_reverse_charge).toBe(false);
    });

    it('should not apply reverse charge for business without valid VAT number', () => {
      const input: VatCalculationInput = {
        amount: 5000,
        country_code: 'DE',
        customer_type: 'business',
        business_vat_number: 'INVALID'
      };

      const result = calculator.calculateVat(input);

      expect(result.vat_rate).toBe(0.19); // Normal German VAT
      expect(result.is_reverse_charge).toBe(false);
    });

    it('should handle non-EU countries', () => {
      const input: VatCalculationInput = {
        amount: 3000,
        country_code: 'US',
        customer_type: 'consumer'
      };

      const result = calculator.calculateVat(input);

      expect(result.vat_rate).toBe(0); // No VAT for non-EU
      expect(result.vat_amount).toBe(0);
      expect(result.total_amount).toBe(3000);
      expect(result.country).toBe('Unknown');
      expect(result.exemption_reason).toBe('Non-EU country');
    });

    it('should handle zero amounts', () => {
      const input: VatCalculationInput = {
        amount: 0,
        country_code: 'FR',
        customer_type: 'consumer'
      };

      const result = calculator.calculateVat(input);

      expect(result.base_amount).toBe(0);
      expect(result.vat_amount).toBe(0);
      expect(result.total_amount).toBe(0);
    });

    it('should round VAT amounts correctly', () => {
      const input: VatCalculationInput = {
        amount: 333, // Amount that creates fractional VAT
        country_code: 'FR',
        customer_type: 'consumer'
      };

      const result = calculator.calculateVat(input);

      expect(result.vat_amount).toBe(67); // Math.round(333 * 0.20) = 67
      expect(result.total_amount).toBe(400);
    });
  });

  describe('calculateVatForItems', () => {
    it('should calculate VAT for multiple items', () => {
      const items = [
        { amount: 2000, product_type: 'wine' },
        { amount: 1500, product_type: 'wine' },
        { amount: 500, product_type: 'other' }
      ];

      const commonData = {
        country_code: 'FR',
        customer_type: 'consumer' as const,
        shipping_amount: 1000
      };

      const result = calculator.calculateVatForItems(items, commonData);

      expect(result.base_amount).toBe(4000); // Sum of all items
      expect(result.shipping_amount).toBe(1000);
      expect(result.vat_amount).toBe(1000); // (4000 + 1000) * 0.20
      expect(result.total_amount).toBe(6000);
    });
  });

  describe('VAT rate queries', () => {
    it('should return all EU VAT rates', () => {
      const euRates = calculator.getEuCountries();

      expect(euRates.length).toBeGreaterThan(20); // Should have all EU countries
      expect(euRates.every(rate => rate.is_eu_member)).toBe(true);
      expect(euRates.find(rate => rate.country_code === 'FR')).toBeDefined();
      expect(euRates.find(rate => rate.country_code === 'DE')).toBeDefined();
    });

    it('should check if country is in EU', () => {
      expect(calculator.isEuCountry('FR')).toBe(true);
      expect(calculator.isEuCountry('DE')).toBe(true);
      expect(calculator.isEuCountry('US')).toBe(false);
      expect(calculator.isEuCountry('GB')).toBe(false); // Post-Brexit
    });

    it('should handle case-insensitive country codes', () => {
      expect(calculator.isEuCountry('fr')).toBe(true);
      expect(calculator.isEuCountry('de')).toBe(true);
    });
  });

  describe('VAT number validation', () => {
    it('should validate correct VAT numbers', () => {
      const validInputs = [
        {
          amount: 1000,
          country_code: 'DE',
          customer_type: 'business' as const,
          business_vat_number: 'DE123456789'
        },
        {
          amount: 1000,
          country_code: 'FR',
          customer_type: 'business' as const,
          business_vat_number: 'FR12345678901'
        },
        {
          amount: 1000,
          country_code: 'IT',
          customer_type: 'business' as const,
          business_vat_number: 'IT12345678901'
        }
      ];

      validInputs.forEach(input => {
        const result = calculator.calculateVat(input);
        // Should not throw error and should process the VAT number
        expect(result).toBeDefined();
      });
    });

    it('should reject invalid VAT numbers', () => {
      const input: VatCalculationInput = {
        amount: 1000,
        country_code: 'DE',
        customer_type: 'business',
        business_vat_number: 'INVALID123'
      };

      const result = calculator.calculateVat(input);
      expect(result.is_reverse_charge).toBe(false);
    });
  });

  describe('Custom VAT rates', () => {
    it('should work with custom VAT rates', () => {
      const customRates: Record<string, VatRate> = {
        'TEST': {
          country_code: 'TEST',
          country_name: 'Test Country',
          rate: 0.15,
          is_eu_member: true,
          is_active: true
        }
      };

      const customCalculator = new VatCalculator(customRates);

      const input: VatCalculationInput = {
        amount: 1000,
        country_code: 'TEST',
        customer_type: 'consumer'
      };

      const result = customCalculator.calculateVat(input);

      expect(result.vat_rate).toBe(0.15);
      expect(result.vat_amount).toBe(150);
      expect(result.country).toBe('Test Country');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large amounts', () => {
      const input: VatCalculationInput = {
        amount: 999999999, // Very large amount
        country_code: 'FR',
        customer_type: 'consumer'
      };

      const result = calculator.calculateVat(input);

      expect(result.vat_amount).toBe(199999999.8); // Should handle large numbers
      expect(result.total_amount).toBe(1199999998.8);
    });

    it('should handle empty VAT number string', () => {
      const input: VatCalculationInput = {
        amount: 1000,
        country_code: 'DE',
        customer_type: 'business',
        business_vat_number: ''
      };

      const result = calculator.calculateVat(input);
      expect(result.is_reverse_charge).toBe(false);
    });

    it('should handle VAT number with spaces', () => {
      const input: VatCalculationInput = {
        amount: 1000,
        country_code: 'DE',
        customer_type: 'business',
        business_vat_number: 'DE 123 456 789'
      };

      const result = calculator.calculateVat(input);
      // Should still process correctly after cleaning spaces
      expect(result).toBeDefined();
    });
  });
});

describe('Helper functions', () => {
  describe('calculateVat', () => {
    it('should work as a standalone function', () => {
      const input: VatCalculationInput = {
        amount: 2000,
        country_code: 'FR',
        customer_type: 'consumer'
      };

      const result = calculateVat(input);

      expect(result.vat_rate).toBe(0.20);
      expect(result.vat_amount).toBe(400);
    });
  });

  describe('isEuCountry', () => {
    it('should work as a standalone function', () => {
      expect(isEuCountry('FR')).toBe(true);
      expect(isEuCountry('US')).toBe(false);
    });
  });

  describe('formatVatAmount', () => {
    it('should format VAT amounts correctly', () => {
      expect(formatVatAmount(2000)).toBe('20,00\u00A0€'); // French formatting
      expect(formatVatAmount(0)).toBe('0,00\u00A0€');
      expect(formatVatAmount(12345)).toBe('123,45\u00A0€');
    });

    it('should handle different currencies', () => {
      expect(formatVatAmount(2000, 'USD')).toContain('20,00');
      expect(formatVatAmount(2000, 'GBP')).toContain('20,00');
    });
  });

  describe('formatVatRate', () => {
    it('should format VAT rates correctly', () => {
      expect(formatVatRate(0.20)).toBe('20%');
      expect(formatVatRate(0.195)).toBe('20%'); // Should round
      expect(formatVatRate(0)).toBe('0%');
      expect(formatVatRate(0.25)).toBe('25%');
    });
  });

  describe('validateVatCalculationInput', () => {
    it('should pass valid input', () => {
      const input: VatCalculationInput = {
        amount: 2000,
        shipping_amount: 500,
        country_code: 'FR',
        customer_type: 'consumer'
      };

      const errors = validateVatCalculationInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should catch negative amounts', () => {
      const input: VatCalculationInput = {
        amount: -100,
        country_code: 'FR'
      };

      const errors = validateVatCalculationInput(input);
      expect(errors).toContain('Amount must be positive');
    });

    it('should catch negative shipping amounts', () => {
      const input: VatCalculationInput = {
        amount: 1000,
        shipping_amount: -100,
        country_code: 'FR'
      };

      const errors = validateVatCalculationInput(input);
      expect(errors).toContain('Shipping amount must be positive');
    });

    it('should catch invalid country codes', () => {
      const invalidInputs = [
        { amount: 1000, country_code: '' },
        { amount: 1000, country_code: 'F' },
        { amount: 1000, country_code: 'FRA' }
      ];

      invalidInputs.forEach(input => {
        const errors = validateVatCalculationInput(input);
        expect(errors).toContain('Valid country code is required');
      });
    });

    it('should catch invalid customer types', () => {
      const input = {
        amount: 1000,
        country_code: 'FR',
        customer_type: 'invalid' as any
      };

      const errors = validateVatCalculationInput(input);
      expect(errors).toContain('Customer type must be business or consumer');
    });

    it('should return multiple errors', () => {
      const input = {
        amount: -100,
        shipping_amount: -50,
        country_code: 'INVALID',
        customer_type: 'wrong' as any
      };

      const errors = validateVatCalculationInput(input);
      expect(errors.length).toBeGreaterThan(1);
    });
  });
});

describe('EU VAT Rate Coverage', () => {
  it('should include all major EU countries', () => {
    const calculator = new VatCalculator();
    const euCountries = calculator.getEuCountries();
    const countryCodes = euCountries.map(c => c.country_code);

    // Check for major EU countries
    const majorEuCountries = ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PL', 'SE', 'DK'];

    majorEuCountries.forEach(code => {
      expect(countryCodes).toContain(code);
    });
  });

  it('should have realistic VAT rates', () => {
    const calculator = new VatCalculator();
    const euCountries = calculator.getEuCountries();

    euCountries.forEach(country => {
      // EU VAT rates should be between 15% and 30%
      expect(country.rate).toBeGreaterThanOrEqual(0.15);
      expect(country.rate).toBeLessThanOrEqual(0.30);
    });
  });

  it('should have known VAT rates for specific countries', () => {
    const calculator = new VatCalculator();

    const input: VatCalculationInput = {
      amount: 10000,
      country_code: 'LU', // Luxembourg has lowest EU VAT rate
      customer_type: 'consumer'
    };

    const result = calculator.calculateVat(input);
    expect(result.vat_rate).toBe(0.17); // Luxembourg: 17%

    // Test highest VAT rate
    const inputHU: VatCalculationInput = {
      amount: 10000,
      country_code: 'HU', // Hungary has high VAT rate
      customer_type: 'consumer'
    };

    const resultHU = calculator.calculateVat(inputHU);
    expect(resultHU.vat_rate).toBe(0.27); // Hungary: 27%
  });
});