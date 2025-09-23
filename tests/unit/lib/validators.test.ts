import { describe, it, expect } from '@jest/globals';
import {
  ageVerificationSchema,
  customerRegistrationSchema,
  customerLoginSchema,
  addressSchema,
  checkoutCustomerSchema,
  checkoutPaymentSchema,
  addToCartSchema,
  updateCartItemSchema,
  productSchema,
  orderSchema,
  contactFormSchema,
  newsletterSchema,
  adminLoginSchema,
  inventoryAdjustmentSchema,
  shippingRateSchema,
  vatCalculationSchema,
  productSearchSchema,
  imageUploadSchema,
  validateSchema,
  getErrorMessage,
  hasErrors
} from '../../../src/lib/validators/schemas';

describe('Age Verification Schema', () => {
  it('should validate correct age verification data', () => {
    const validData = {
      birthDay: 15,
      birthMonth: 6,
      birthYear: 1990,
      documentType: 'passport' as const,
      documentNumber: 'P123456789',
      country: 'FR'
    };

    const result = ageVerificationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid birth dates', () => {
    const invalidData = {
      birthDay: 32, // Invalid day
      birthMonth: 6,
      birthYear: 1990
    };

    const result = ageVerificationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject future birth years', () => {
    const invalidData = {
      birthDay: 15,
      birthMonth: 6,
      birthYear: new Date().getFullYear() + 1
    };

    const result = ageVerificationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate birth date logic', () => {
    const invalidData = {
      birthDay: 31,
      birthMonth: 2, // February doesn't have 31 days
      birthYear: 1990
    };

    const result = ageVerificationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Customer Registration Schema', () => {
  it('should validate correct registration data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33123456789',
      birthDate: '1990-06-15',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptMarketing: false,
      country: 'FR'
    };

    const result = customerRegistrationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject weak passwords', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak',
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: '1990-06-15',
      acceptTerms: true,
      acceptPrivacy: true,
      country: 'FR'
    };

    const result = customerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(issue =>
      issue.path.includes('password') && issue.message.includes('8 characters')
    )).toBe(true);
  });

  it('should reject mismatched passwords', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'DifferentPass456!',
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: '1990-06-15',
      acceptTerms: true,
      acceptPrivacy: true,
      country: 'FR'
    };

    const result = customerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some(issue =>
      issue.message.includes('Passwords do not match')
    )).toBe(true);
  });

  it('should reject users under 16', () => {
    const tooYoung = new Date();
    tooYoung.setFullYear(tooYoung.getFullYear() - 15); // 15 years old

    const invalidData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: tooYoung.toISOString().split('T')[0],
      acceptTerms: true,
      acceptPrivacy: true,
      country: 'FR'
    };

    const result = customerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should require terms acceptance', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'Jean',
      lastName: 'Dupont',
      birthDate: '1990-06-15',
      acceptTerms: false, // Not accepted
      acceptPrivacy: true,
      country: 'FR'
    };

    const result = customerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate name characters', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'Jean123', // Numbers not allowed
      lastName: 'Dupont',
      birthDate: '1990-06-15',
      acceptTerms: true,
      acceptPrivacy: true,
      country: 'FR'
    };

    const result = customerRegistrationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Address Schema', () => {
  it('should validate correct address data', () => {
    const validData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      company: 'Acme Corp',
      address: '123 Rue de la Paix',
      address2: 'Appartement 4B',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
      phone: '+33123456789'
    };

    const result = addressSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should require minimum address length', () => {
    const invalidData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      address: '123', // Too short
      city: 'Paris',
      postalCode: '75001',
      country: 'FR'
    };

    const result = addressSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should validate postal code format', () => {
    const invalidData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '12', // Too short
      country: 'FR'
    };

    const result = addressSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should require 2-letter country code', () => {
    const invalidData = {
      firstName: 'Jean',
      lastName: 'Dupont',
      address: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'FRA' // Too long
    };

    const result = addressSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Cart Schemas', () => {
  describe('Add to Cart Schema', () => {
    it('should validate correct add to cart data', () => {
      const validData = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 2,
        variantId: '550e8400-e29b-41d4-a716-446655440001'
      };

      const result = addToCartSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid product ID', () => {
      const invalidData = {
        productId: 'invalid-uuid',
        quantity: 2
      };

      const result = addToCartSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject quantity over 24', () => {
      const invalidData = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 25 // Too many
      };

      const result = addToCartSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject zero or negative quantity', () => {
      const invalidData = {
        productId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0
      };

      const result = addToCartSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Update Cart Item Schema', () => {
    it('should validate correct update data', () => {
      const validData = {
        itemId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 3
      };

      const result = updateCartItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should allow zero quantity for removal', () => {
      const validData = {
        itemId: '550e8400-e29b-41d4-a716-446655440000',
        quantity: 0
      };

      const result = updateCartItemSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

describe('Product Schema', () => {
  it('should validate correct product data', () => {
    const validData = {
      name: 'Châteauneuf-du-Pape Rouge',
      sku: 'CDP-R-2020',
      description: 'Un excellent vin rouge de la vallée du Rhône avec des notes complexes.',
      price: 45.99,
      stockQuantity: 24,
      category: 'red_wine' as const,
      vintage: 2020,
      alcoholContent: 14.5,
      grapeVariety: 'Grenache, Syrah',
      region: 'Rhône Valley',
      producer: 'Domaine Vallot',
      volume: 750,
      servingTemperature: '16-18°C',
      agingPotential: '10-15 years',
      pairingNotes: 'Viande rouge, fromages affinés',
      status: 'active' as const,
      isFeatured: true,
      isOrganic: false,
      imageUrl: 'https://example.com/wine.jpg',
      galleryImages: ['https://example.com/wine2.jpg']
    };

    const result = productSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid SKU format', () => {
    const invalidData = {
      name: 'Test Wine',
      sku: 'invalid-sku-format!', // Contains invalid characters
      description: 'A test wine description that is long enough.',
      price: 20,
      stockQuantity: 10,
      category: 'red_wine' as const,
      status: 'active' as const
    };

    const result = productSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject unrealistic vintage', () => {
    const invalidData = {
      name: 'Test Wine',
      sku: 'TEST-001',
      description: 'A test wine description that is long enough.',
      price: 20,
      stockQuantity: 10,
      category: 'red_wine' as const,
      vintage: 1500, // Too old
      status: 'active' as const
    };

    const result = productSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject excessive alcohol content', () => {
    const invalidData = {
      name: 'Test Wine',
      sku: 'TEST-001',
      description: 'A test wine description that is long enough.',
      price: 20,
      stockQuantity: 10,
      category: 'red_wine' as const,
      alcoholContent: 25, // Too high
      status: 'active' as const
    };

    const result = productSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should limit gallery images', () => {
    const tooManyImages = Array(15).fill('https://example.com/image.jpg');

    const invalidData = {
      name: 'Test Wine',
      sku: 'TEST-001',
      description: 'A test wine description that is long enough.',
      price: 20,
      stockQuantity: 10,
      category: 'red_wine' as const,
      status: 'active' as const,
      galleryImages: tooManyImages // Too many images
    };

    const result = productSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Contact Form Schema', () => {
  it('should validate correct contact form data', () => {
    const validData = {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      subject: 'Question about wine selection',
      message: 'I would like to know more about your wine selection and recommendations.',
      phone: '+33123456789',
      category: 'products' as const
    };

    const result = contactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should require minimum message length', () => {
    const invalidData = {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      subject: 'Question',
      message: 'Too short', // Too short
      category: 'general' as const
    };

    const result = contactFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should limit message length', () => {
    const longMessage = 'A'.repeat(1001); // Too long

    const invalidData = {
      name: 'Jean Dupont',
      email: 'jean@example.com',
      subject: 'Long message',
      message: longMessage,
      category: 'general' as const
    };

    const result = contactFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('VAT Calculation Schema', () => {
  it('should validate correct VAT calculation data', () => {
    const validData = {
      amount: 2500, // €25.00 in cents
      shippingAmount: 500, // €5.00 in cents
      country: 'FR',
      customerType: 'consumer' as const,
      vatNumber: 'FR12345678901'
    };

    const result = vatCalculationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject negative amounts', () => {
    const invalidData = {
      amount: -100,
      country: 'FR'
    };

    const result = vatCalculationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should require 2-letter country code', () => {
    const invalidData = {
      amount: 2500,
      country: 'FRA' // Too long
    };

    const result = vatCalculationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Product Search Schema', () => {
  it('should validate correct search data', () => {
    const validData = {
      query: 'Châteauneuf',
      category: 'red_wine' as const,
      minPrice: 20,
      maxPrice: 100,
      vintage: 2020,
      region: 'Rhône',
      inStock: true,
      isOrganic: false,
      sortBy: 'price' as const,
      sortOrder: 'asc' as const,
      limit: 20,
      offset: 0
    };

    const result = productSearchSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject excessive limit', () => {
    const invalidData = {
      query: 'wine',
      limit: 150 // Too high
    };

    const result = productSearchSchema.safeParse(validData);
    expect(result.success).toBe(false);
  });

  it('should reject negative prices', () => {
    const invalidData = {
      query: 'wine',
      minPrice: -10
    };

    const result = productSearchSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Image Upload Schema', () => {
  it('should validate correct image file', () => {
    // Mock File object
    const mockFile = new File(['dummy content'], 'test.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    // Mock file size
    Object.defineProperty(mockFile, 'size', {
      value: 1024 * 1024, // 1MB
      writable: false
    });

    const validData = {
      file: mockFile,
      alt: 'Wine bottle image'
    };

    const result = imageUploadSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject oversized files', () => {
    const mockFile = new File(['dummy content'], 'test.jpg', {
      type: 'image/jpeg'
    });

    // Mock large file size
    Object.defineProperty(mockFile, 'size', {
      value: 10 * 1024 * 1024, // 10MB (too large)
      writable: false
    });

    const invalidData = {
      file: mockFile
    };

    const result = imageUploadSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid file types', () => {
    const mockFile = new File(['dummy content'], 'test.txt', {
      type: 'text/plain' // Invalid type
    });

    Object.defineProperty(mockFile, 'size', {
      value: 1024,
      writable: false
    });

    const invalidData = {
      file: mockFile
    };

    const result = imageUploadSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('Helper Functions', () => {
  describe('validateSchema', () => {
    it('should return success for valid data', () => {
      const data = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = validateSchema(customerLoginSchema, data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', () => {
      const data = {
        email: 'invalid-email',
        password: ''
      };

      const result = validateSchema(customerLoginSchema, data);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors?.email).toContain('Please enter a valid email address');
      expect(result.errors?.password).toContain('Password is required');
    });

    it('should handle nested field errors', () => {
      const data = {
        customer: {
          email: 'invalid-email'
        },
        shipping: {
          firstName: 'A' // Too short
        }
      };

      const result = validateSchema(checkoutCustomerSchema, data);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('getErrorMessage', () => {
    it('should return first error message for field', () => {
      const errors = {
        email: ['Please enter a valid email address', 'Email is required'],
        password: ['Password is required']
      };

      expect(getErrorMessage(errors, 'email')).toBe('Please enter a valid email address');
      expect(getErrorMessage(errors, 'password')).toBe('Password is required');
      expect(getErrorMessage(errors, 'nonexistent')).toBe('');
    });
  });

  describe('hasErrors', () => {
    it('should return true when errors exist', () => {
      const errors = {
        email: ['Invalid email']
      };

      expect(hasErrors(errors)).toBe(true);
    });

    it('should return false when no errors exist', () => {
      const errors = {};

      expect(hasErrors(errors)).toBe(false);
    });
  });
});

describe('Email and Phone Validation', () => {
  it('should validate correct email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'user+tag@example.org',
      'user123@test-domain.com'
    ];

    validEmails.forEach(email => {
      const result = customerLoginSchema.safeParse({
        email,
        password: 'password123'
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid email formats', () => {
    const invalidEmails = [
      'invalid-email',
      '@domain.com',
      'user@',
      'user..name@domain.com',
      'user name@domain.com'
    ];

    invalidEmails.forEach(email => {
      const result = customerLoginSchema.safeParse({
        email,
        password: 'password123'
      });
      expect(result.success).toBe(false);
    });
  });

  it('should validate phone number formats', () => {
    const validPhones = [
      '+33123456789',
      '0123456789',
      '+1-555-123-4567'
    ];

    validPhones.forEach(phone => {
      const result = addressSchema.safeParse({
        firstName: 'Jean',
        lastName: 'Dupont',
        address: '123 Rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'FR',
        phone
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Password Validation', () => {
  it('should require password complexity', () => {
    const weakPasswords = [
      'password', // No uppercase, no numbers, no special chars
      'PASSWORD', // No lowercase, no numbers, no special chars
      '12345678', // No letters, no special chars
      'Pass123',  // Too short
      'Password123' // No special characters
    ];

    weakPasswords.forEach(password => {
      const result = customerRegistrationSchema.safeParse({
        email: 'test@example.com',
        password,
        confirmPassword: password,
        firstName: 'Jean',
        lastName: 'Dupont',
        birthDate: '1990-06-15',
        acceptTerms: true,
        acceptPrivacy: true,
        country: 'FR'
      });
      expect(result.success).toBe(false);
    });
  });

  it('should accept strong passwords', () => {
    const strongPasswords = [
      'SecurePass123!',
      'MyP@ssw0rd2024',
      'C0mplex&Strong'
    ];

    strongPasswords.forEach(password => {
      const result = customerRegistrationSchema.safeParse({
        email: 'test@example.com',
        password,
        confirmPassword: password,
        firstName: 'Jean',
        lastName: 'Dupont',
        birthDate: '1990-06-15',
        acceptTerms: true,
        acceptPrivacy: true,
        country: 'FR'
      });
      expect(result.success).toBe(true);
    });
  });
});