'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
  showDetails?: boolean;
}

class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report to monitoring service if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError, showDetails = false }: ErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Oops! Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We apologize for the inconvenience. An unexpected error occurred.
          </p>
        </div>

        {showDetails && error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
            <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
              {error.message}
            </pre>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2">
                <summary className="text-xs font-medium text-red-800 cursor-pointer">
                  Stack Trace
                </summary>
                <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap break-words">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={resetError}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-wine-600 hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-500 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handleGoBack}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>

            <button
              onClick={handleGoHome}
              className="flex-1 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-500 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </button>
          </div>

          <button
            onClick={handleReload}
            className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Reload Page
          </button>
        </div>

        <div className="text-xs text-gray-500">
          <p>Error ID: {Date.now().toString(36)}</p>
          <p className="mt-1">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

// Specialized error boundaries for different contexts
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryClass showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundaryClass>
  );
}

export function ComponentErrorBoundary({
  children,
  fallback
}: {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}) {
  return (
    <ErrorBoundaryClass
      fallback={fallback || ComponentErrorFallback}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      {children}
    </ErrorBoundaryClass>
  );
}

function ComponentErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-6 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
      <h3 className="text-lg font-medium text-red-800 mb-2">
        Component Error
      </h3>
      <p className="text-sm text-red-600 mb-4">
        This component failed to load properly.
      </p>
      <button
        onClick={resetError}
        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </button>
    </div>
  );
}

export function AsyncErrorBoundary({
  children,
  onRetry
}: {
  children: React.ReactNode;
  onRetry?: () => void;
}) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <ErrorBoundaryClass
      fallback={({ resetError }) => (
        <AsyncErrorFallback
          resetError={() => {
            resetError();
            handleRetry();
          }}
        />
      )}
    >
      {children}
    </ErrorBoundaryClass>
  );
}

function AsyncErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Failed to Load Data
      </h3>
      <p className="text-sm text-gray-600 mb-6 max-w-sm text-center">
        There was an error loading the content. Please check your connection and try again.
      </p>
      <button
        onClick={resetError}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-wine-600 hover:bg-wine-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine-500"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </button>
    </div>
  );
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error:', error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
}

export default ErrorBoundaryClass;