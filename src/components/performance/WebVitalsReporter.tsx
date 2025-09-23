'use client';

import { useEffect } from 'react';
import { performanceMonitor, reportWebVitals } from '@/lib/performance/monitoring';

export default function WebVitalsReporter() {
  useEffect(() => {
    // Initialize performance monitoring
    if (typeof window !== 'undefined') {
      // Import and setup web-vitals if available
      const setupWebVitals = async () => {
        try {
          // Try to use web-vitals library if installed
          const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');

          getCLS(reportWebVitals);
          getFID(reportWebVitals);
          getFCP(reportWebVitals);
          getLCP(reportWebVitals);
          getTTFB(reportWebVitals);
        } catch (error) {
          // Fallback to our custom implementation
          console.log('Using custom performance monitoring');
        }
      };

      setupWebVitals();

      // Track page interactions
      const handleClick = () => {
        performanceMonitor.trackUserInteraction('click');
      };

      const handleKeyDown = () => {
        performanceMonitor.trackUserInteraction('keydown');
      };

      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleKeyDown);

      // Measure resource loading
      performanceMonitor.measureResourceLoad('image');
      performanceMonitor.measureResourceLoad('js');
      performanceMonitor.measureResourceLoad('css');

      // Generate performance report after page load
      const generateReport = () => {
        setTimeout(() => {
          const report = performanceMonitor.generateReport();

          // Send to analytics in production
          if (process.env.NODE_ENV === 'production') {
            // You can send this to your analytics service
            console.log('Performance report:', report);
          }

          // Log performance budget violations in development
          if (process.env.NODE_ENV === 'development') {
            const { checkPerformanceBudget } = require('@/lib/performance/monitoring');
            const budgetCheck = checkPerformanceBudget(report.metrics);

            if (!budgetCheck.passed) {
              console.warn('Performance budget violations:', budgetCheck.violations);
            } else {
              console.log('✅ Performance budget passed');
            }
          }
        }, 3000); // Wait 3 seconds for metrics to stabilize
      };

      if (document.readyState === 'complete') {
        generateReport();
      } else {
        window.addEventListener('load', generateReport);
      }

      // Cleanup
      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('keydown', handleKeyDown);
        performanceMonitor.cleanup();
      };
    }
  }, []);

  // This component doesn't render anything
  return null;
}