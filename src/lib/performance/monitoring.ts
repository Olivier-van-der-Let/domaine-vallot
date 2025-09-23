'use client';

// Core Web Vitals metrics
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache';
}

export interface PerformanceMetrics {
  // Core Web Vitals
  cls?: number;
  fid?: number;
  fcp?: number;
  lcp?: number;
  ttfb?: number;
  inp?: number;

  // Custom metrics
  domComplete?: number;
  loadComplete?: number;
  firstByte?: number;
  domInteractive?: number;
  navigationStart?: number;

  // Page-specific metrics
  pageLoadTime?: number;
  resourceLoadTime?: number;
  apiResponseTime?: number;

  // User journey metrics
  timeToInteractive?: number;
  timeToFirstClick?: number;
}

export interface PerformanceReport {
  url: string;
  timestamp: number;
  metrics: PerformanceMetrics;
  userAgent: string;
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  device?: {
    memory: number;
    cores: number;
  };
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor();
    }
    return this.instance;
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.measureBasicMetrics();
    }
  }

  private initializeObservers(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Contentful Paint (FCP)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              this.reportMetric('FCP', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (e) {
        console.warn('FCP observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.metrics.cls = clsValue;
          this.reportMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.fid);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Interaction to Next Paint (INP) - newer metric
      try {
        const inpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.metrics.inp = entry.processingStart - entry.startTime;
            this.reportMetric('INP', this.metrics.inp);
          });
        });
        inpObserver.observe({ entryTypes: ['event'] });
        this.observers.push(inpObserver);
      } catch (e) {
        console.warn('INP observer not supported');
      }
    }
  }

  private measureBasicMetrics(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.domInteractive = navigation.domInteractive;
        this.metrics.domComplete = navigation.domComplete;
        this.metrics.loadComplete = navigation.loadEventEnd;
        this.metrics.navigationStart = navigation.startTime;
        this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.startTime;
      }

      // Measure when DOM is ready
      if (document.readyState === 'complete') {
        this.calculateTimeToInteractive();
      } else {
        document.addEventListener('readystatechange', () => {
          if (document.readyState === 'complete') {
            this.calculateTimeToInteractive();
          }
        });
      }
    }
  }

  private calculateTimeToInteractive(): void {
    if (window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.timeToInteractive = navigation.domInteractive - navigation.startTime;
      }
    }
  }

  private reportMetric(name: string, value: number): void {
    // Report to analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        custom_parameter_1: name,
        custom_parameter_2: Math.round(value),
        custom_parameter_3: this.getRating(name as any, value)
      });
    }

    // Report to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric: ${name} = ${value}ms (${this.getRating(name as any, value)})`);
    }
  }

  private getRating(name: WebVitalsMetric['name'], value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 }
    };

    const threshold = thresholds[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public generateReport(): PerformanceReport {
    const connection = this.getConnectionInfo();
    const device = this.getDeviceInfo();

    return {
      url: window.location.href,
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      userAgent: navigator.userAgent,
      connection,
      device
    };
  }

  private getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt
      };
    }
    return undefined;
  }

  private getDeviceInfo() {
    if ('deviceMemory' in navigator) {
      return {
        memory: (navigator as any).deviceMemory,
        cores: navigator.hardwareConcurrency
      };
    }
    return undefined;
  }

  public measureApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    const startTime = performance.now();

    return apiCall().then(
      (result) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.metrics.apiResponseTime = duration;
        this.reportMetric(`API_${endpoint}`, duration);

        return result;
      },
      (error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.reportMetric(`API_ERROR_${endpoint}`, duration);
        throw error;
      }
    );
  }

  public measureResourceLoad(resourceType: string): void {
    if (window.performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const relevantResources = resources.filter(resource =>
        resource.name.includes(resourceType)
      );

      if (relevantResources.length > 0) {
        const avgLoadTime = relevantResources.reduce((sum, resource) =>
          sum + (resource.responseEnd - resource.startTime), 0
        ) / relevantResources.length;

        this.metrics.resourceLoadTime = avgLoadTime;
        this.reportMetric(`RESOURCE_${resourceType}`, avgLoadTime);
      }
    }
  }

  public trackUserInteraction(action: string): void {
    const timestamp = performance.now();

    if (!this.metrics.timeToFirstClick && action === 'click') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.metrics.timeToFirstClick = timestamp - navigation.startTime;
        this.reportMetric('TIME_TO_FIRST_CLICK', this.metrics.timeToFirstClick);
      }
    }

    // Report user interaction
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'user_interaction', {
        action,
        timestamp: Math.round(timestamp)
      });
    }
  }

  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Web Vitals reporting function (compatible with web-vitals library)
export function reportWebVitals(metric: WebVitalsMetric): void {
  performanceMonitor.reportMetric(metric.name, metric.value);
}

// React hook for performance monitoring
export function usePerformanceMonitoring() {
  const monitor = performanceMonitor;

  const trackPageView = (pageName: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href
      });
    }
  };

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  };

  const getMetrics = () => monitor.getMetrics();
  const generateReport = () => monitor.generateReport();

  return {
    trackPageView,
    trackEvent,
    getMetrics,
    generateReport,
    trackUserInteraction: monitor.trackUserInteraction.bind(monitor),
    measureApiCall: monitor.measureApiCall.bind(monitor),
    measureResourceLoad: monitor.measureResourceLoad.bind(monitor)
  };
}

// Performance budget checker
export function checkPerformanceBudget(metrics: PerformanceMetrics): {
  passed: boolean;
  violations: string[];
} {
  const budget = {
    lcp: 2500, // 2.5s
    fcp: 1800, // 1.8s
    cls: 0.1,  // 0.1
    fid: 100,  // 100ms
    ttfb: 800, // 800ms
    pageLoadTime: 3000 // 3s
  };

  const violations: string[] = [];

  Object.entries(budget).forEach(([metric, threshold]) => {
    const value = metrics[metric as keyof PerformanceMetrics];
    if (value && value > threshold) {
      violations.push(`${metric}: ${value} > ${threshold}`);
    }
  });

  return {
    passed: violations.length === 0,
    violations
  };
}