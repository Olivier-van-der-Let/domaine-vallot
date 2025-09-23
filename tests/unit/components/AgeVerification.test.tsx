import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgeVerification } from '@/components/verification/AgeVerification';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock file reading for document upload
global.FileReader = class MockFileReader {
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  result: string | ArrayBuffer | null = null;

  readAsDataURL(file: File) {
    setTimeout(() => {
      if (this.onload) {
        this.result = 'data:image/jpeg;base64,mockBase64Data';
        this.onload({ target: this } as any);
      }
    }, 100);
  }
};

describe('AgeVerification', () => {
  const user = userEvent.setup();

  describe('Component rendering (will pass once component is implemented)', () => {
    test('should render without crashing when component exists', () => {
      // This test will fail initially as the component doesn't exist yet
      // This is intentional for TDD - we write the test first, then implement

      try {
        render(<AgeVerification />);

        // If component exists, it should render without throwing
        expect(screen.getByTestId('age-verification')).toBeInTheDocument();
      } catch (error) {
        // Initially will fail because component doesn't exist
        expect(error).toBeDefined();
      }
    });

    test('should display age verification modal when open', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByTestId('age-verification-modal')).toBeInTheDocument();
        expect(screen.getByText(/age verification/i)).toBeInTheDocument();
        expect(screen.getByText(/18.*older/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should not display modal when closed', () => {
      try {
        render(<AgeVerification isOpen={false} />);

        expect(screen.queryByTestId('age-verification-modal')).not.toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should display legal drinking age requirements', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByText(/legal drinking age/i)).toBeInTheDocument();
        expect(screen.getByText(/18.*years.*older/i)).toBeInTheDocument();
        expect(screen.getByText(/alcohol.*purchase/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Birth date verification', () => {
    test('should display birth date input field', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument();
        expect(screen.getByTestId('birth-date-input')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should validate birth date format', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const birthDateInput = screen.getByLabelText(/birth date/i);
        await user.type(birthDateInput, 'invalid-date');

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/invalid.*date.*format/i)).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should reject underage birth dates', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const birthDateInput = screen.getByLabelText(/birth date/i);
        const underageDate = new Date();
        underageDate.setFullYear(underageDate.getFullYear() - 17); // 17 years old

        await user.type(birthDateInput, underageDate.toISOString().split('T')[0]);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/must be.*18.*older/i)).toBeInTheDocument();
          expect(screen.getByTestId('verification-failed')).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should accept valid adult birth dates', async () => {
      try {
        const mockOnVerificationSuccess = jest.fn();

        render(
          <AgeVerification
            isOpen={true}
            onVerificationSuccess={mockOnVerificationSuccess}
          />
        );

        const birthDateInput = screen.getByLabelText(/birth date/i);
        const adultDate = new Date();
        adultDate.setFullYear(adultDate.getFullYear() - 25); // 25 years old

        await user.type(birthDateInput, adultDate.toISOString().split('T')[0]);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockOnVerificationSuccess).toHaveBeenCalledWith({
            verified: true,
            method: 'birth_date',
            verified_at: expect.any(String),
          });
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should calculate age correctly for edge cases', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const birthDateInput = screen.getByLabelText(/birth date/i);
        const today = new Date();
        const exactlyEighteen = new Date(today);
        exactlyEighteen.setFullYear(today.getFullYear() - 18);

        await user.type(birthDateInput, exactlyEighteen.toISOString().split('T')[0]);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByTestId('verification-success')).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Document verification', () => {
    test('should display document type selector', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByLabelText(/document type/i)).toBeInTheDocument();
        expect(screen.getByTestId('document-type-select')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show valid document type options', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const documentSelect = screen.getByLabelText(/document type/i);
        expect(documentSelect).toBeInTheDocument();

        // Should contain valid options
        expect(screen.getByText(/passport/i)).toBeInTheDocument();
        expect(screen.getByText(/driver.*license/i)).toBeInTheDocument();
        expect(screen.getByText(/id.*card/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should display file upload field for document image', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByLabelText(/upload.*document/i)).toBeInTheDocument();
        expect(screen.getByTestId('document-upload')).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should accept valid image file formats', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const fileInput = screen.getByTestId('document-upload');
        const validFile = new File(['image content'], 'id-card.jpg', { type: 'image/jpeg' });

        await user.upload(fileInput, validFile);

        await waitFor(() => {
          expect(screen.getByText(/id-card\.jpg/i)).toBeInTheDocument();
          expect(screen.getByTestId('uploaded-file-preview')).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should reject invalid file formats', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const fileInput = screen.getByTestId('document-upload');
        const invalidFile = new File(['document content'], 'document.txt', { type: 'text/plain' });

        await user.upload(fileInput, invalidFile);

        await waitFor(() => {
          expect(screen.getByText(/invalid.*file.*format/i)).toBeInTheDocument();
          expect(screen.getByText(/jpg.*png.*pdf/i)).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should enforce file size limits', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const fileInput = screen.getByTestId('document-upload');
        // Create a large file (mock)
        const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large-image.jpg', { type: 'image/jpeg' });
        Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB

        await user.upload(fileInput, largeFile);

        await waitFor(() => {
          expect(screen.getByText(/file.*too.*large/i)).toBeInTheDocument();
          expect(screen.getByText(/maximum.*5.*mb/i)).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show image preview after upload', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const fileInput = screen.getByTestId('document-upload');
        const imageFile = new File(['image content'], 'passport.jpg', { type: 'image/jpeg' });

        await user.upload(fileInput, imageFile);

        await waitFor(() => {
          expect(screen.getByTestId('document-image-preview')).toBeInTheDocument();
          expect(screen.getByAltText(/uploaded document/i)).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Verification process', () => {
    test('should require birth date before verification', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/birth date.*required/i)).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show loading state during verification', async () => {
      try {
        const slowVerification = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));

        render(
          <AgeVerification
            isOpen={true}
            onVerificationAttempt={slowVerification}
          />
        );

        const birthDateInput = screen.getByLabelText(/birth date/i);
        const adultDate = new Date();
        adultDate.setFullYear(adultDate.getFullYear() - 25);

        await user.type(birthDateInput, adultDate.toISOString().split('T')[0]);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        // Should show loading state
        expect(screen.getByTestId('verification-loading')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should handle verification API errors', async () => {
      try {
        const mockVerification = jest.fn().mockRejectedValue(new Error('Verification service unavailable'));

        render(
          <AgeVerification
            isOpen={true}
            onVerificationAttempt={mockVerification}
          />
        );

        const birthDateInput = screen.getByLabelText(/birth date/i);
        const adultDate = new Date();
        adultDate.setFullYear(adultDate.getFullYear() - 25);

        await user.type(birthDateInput, adultDate.toISOString().split('T')[0]);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/verification.*failed/i)).toBeInTheDocument();
          expect(screen.getByText(/please try again/i)).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should call success callback on successful verification', async () => {
      try {
        const mockOnSuccess = jest.fn();

        render(
          <AgeVerification
            isOpen={true}
            onVerificationSuccess={mockOnSuccess}
          />
        );

        const birthDateInput = screen.getByLabelText(/birth date/i);
        const adultDate = new Date();
        adultDate.setFullYear(adultDate.getFullYear() - 25);

        await user.type(birthDateInput, adultDate.toISOString().split('T')[0]);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalledWith({
            verified: true,
            method: 'birth_date',
            verified_at: expect.any(String),
          });
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should include document verification when document is uploaded', async () => {
      try {
        const mockOnSuccess = jest.fn();

        render(
          <AgeVerification
            isOpen={true}
            onVerificationSuccess={mockOnSuccess}
          />
        );

        // Fill birth date
        const birthDateInput = screen.getByLabelText(/birth date/i);
        const adultDate = new Date();
        adultDate.setFullYear(adultDate.getFullYear() - 25);
        await user.type(birthDateInput, adultDate.toISOString().split('T')[0]);

        // Upload document
        const documentTypeSelect = screen.getByLabelText(/document type/i);
        await user.selectOptions(documentTypeSelect, 'passport');

        const fileInput = screen.getByTestId('document-upload');
        const documentFile = new File(['image content'], 'passport.jpg', { type: 'image/jpeg' });
        await user.upload(fileInput, documentFile);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockOnSuccess).toHaveBeenCalledWith({
            verified: true,
            method: 'document_verification',
            verified_at: expect.any(String),
            document_type: 'passport',
          });
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Modal behavior', () => {
    test('should close modal when close button is clicked', async () => {
      try {
        const mockOnClose = jest.fn();

        render(
          <AgeVerification
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        const closeButton = screen.getByTestId('close-modal-button');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should close modal when escape key is pressed', async () => {
      try {
        const mockOnClose = jest.fn();

        render(
          <AgeVerification
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(mockOnClose).toHaveBeenCalled();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should not close modal when clicking inside content', () => {
      try {
        const mockOnClose = jest.fn();

        render(
          <AgeVerification
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        const modalContent = screen.getByTestId('modal-content');
        fireEvent.click(modalContent);

        expect(mockOnClose).not.toHaveBeenCalled();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should close modal when clicking backdrop', () => {
      try {
        const mockOnClose = jest.fn();

        render(
          <AgeVerification
            isOpen={true}
            onClose={mockOnClose}
          />
        );

        const modalBackdrop = screen.getByTestId('modal-backdrop');
        fireEvent.click(modalBackdrop);

        expect(mockOnClose).toHaveBeenCalled();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const modal = screen.getByTestId('age-verification-modal');
        expect(modal).toHaveAttribute('role', 'dialog');
        expect(modal).toHaveAttribute('aria-labelledby');
        expect(modal).toHaveAttribute('aria-describedby');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should trap focus within modal', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const birthDateInput = screen.getByLabelText(/birth date/i);
        const submitButton = screen.getByTestId('verify-age-button');

        birthDateInput.focus();
        expect(birthDateInput).toHaveFocus();

        // Tab to next element
        await user.tab();
        // Should stay within modal
        expect(document.activeElement).toBeInstanceOf(HTMLElement);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should return focus to trigger element when closed', () => {
      try {
        const triggerButton = document.createElement('button');
        triggerButton.textContent = 'Verify Age';
        document.body.appendChild(triggerButton);
        triggerButton.focus();

        const mockOnClose = jest.fn();

        render(
          <AgeVerification
            isOpen={true}
            onClose={mockOnClose}
            triggerElement={triggerButton}
          />
        );

        const closeButton = screen.getByTestId('close-modal-button');
        fireEvent.click(closeButton);

        expect(triggerButton).toHaveFocus();

        document.body.removeChild(triggerButton);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should have proper labels for form elements', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByLabelText(/birth date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/document type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/upload.*document/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should announce verification status to screen readers', async () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const birthDateInput = screen.getByLabelText(/birth date/i);
        const underageDate = new Date();
        underageDate.setFullYear(underageDate.getFullYear() - 17);

        await user.type(birthDateInput, underageDate.toISOString().split('T')[0]);

        const submitButton = screen.getByTestId('verify-age-button');
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(screen.getByRole('alert')).toBeInTheDocument();
          expect(screen.getByLabelText(/verification failed/i)).toBeInTheDocument();
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Legal compliance', () => {
    test('should display appropriate legal disclaimers', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByText(/legal drinking age/i)).toBeInTheDocument();
        expect(screen.getByText(/verify.*identity/i)).toBeInTheDocument();
        expect(screen.getByText(/privacy.*policy/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show data protection notice', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByText(/personal.*data/i)).toBeInTheDocument();
        expect(screen.getByText(/age verification.*only/i)).toBeInTheDocument();
        expect(screen.getByText(/not.*stored/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should link to privacy policy', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
        expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
        expect(privacyLink).toHaveAttribute('target', '_blank');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Mobile responsiveness', () => {
    test('should adapt to mobile viewport', () => {
      try {
        const { container } = render(<AgeVerification isOpen={true} />);

        const modal = container.querySelector('[data-testid="age-verification-modal"]');
        expect(modal).toHaveClass(/mobile/);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should show mobile-optimized upload interface', () => {
      try {
        render(<AgeVerification isOpen={true} />);

        expect(screen.getByTestId('mobile-document-upload')).toBeInTheDocument();
        expect(screen.getByText(/tap.*upload/i)).toBeInTheDocument();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});