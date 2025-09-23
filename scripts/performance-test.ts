import { chromium, Browser, Page } from '@playwright/test';

interface PerformanceMetrics {
  lcp: number;
  fcp: number;
  cls: number;
  fid: number;
  ttfb: number;
  domContentLoaded: number;
  loadComplete: number;
  totalPageSize: number;
  imageCount: number;
  jsSize: number;
  cssSize: number;
}

interface PageTestResult {
  url: string;
  metrics: PerformanceMetrics;
  lighthouse: any;
  networkRequests: number;
  consoleErrors: string[];
  passed: boolean;
  violations: string[];
}

class PerformanceTester {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage({
      viewport: { width: 1920, height: 1080 }
    });

    // Set up network monitoring
    await this.page.route('**/*', (route) => {
      route.continue();
    });
  }

  async testPage(url: string): Promise<PageTestResult> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    console.log(`Testing performance for: ${url}`);

    const consoleErrors: string[] = [];
    let networkRequests = 0;

    // Monitor console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network requests
    this.page.on('request', () => {
      networkRequests++;
    });

    // Navigate to page and measure performance
    const navigationPromise = this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await navigationPromise;

    // Measure Core Web Vitals and other metrics
    const metrics = await this.measureMetrics();

    // Run Lighthouse audit
    const lighthouse = await this.runLighthouseAudit(url);

    // Check performance budget
    const budgetCheck = this.checkPerformanceBudget(metrics);

    return {
      url,
      metrics,
      lighthouse,
      networkRequests,
      consoleErrors,
      passed: budgetCheck.passed,
      violations: budgetCheck.violations
    };
  }

  private async measureMetrics(): Promise<PerformanceMetrics> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const metrics = await this.page.evaluate(() => {
      return new Promise<PerformanceMetrics>((resolve) => {
        // Wait for page to be fully loaded
        if (document.readyState !== 'complete') {
          window.addEventListener('load', measureMetrics);
        } else {
          measureMetrics();
        }

        function measureMetrics() {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          const paintEntries = performance.getEntriesByType('paint');

          let lcp = 0;
          let fcp = 0;
          let cls = 0;
          let fid = 0;

          // Get FCP
          const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
          if (fcpEntry) {
            fcp = fcpEntry.startTime;
          }

          // Get LCP using PerformanceObserver
          if ('PerformanceObserver' in window) {
            try {
              const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                if (entries.length > 0) {
                  lcp = entries[entries.length - 1].startTime;
                }
              });
              lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

              // Give it a moment to capture LCP
              setTimeout(() => {
                lcpObserver.disconnect();
                finalizeMeasurement();
              }, 1000);
            } catch (e) {
              finalizeMeasurement();
            }
          } else {
            finalizeMeasurement();
          }

          function finalizeMeasurement() {
            // Calculate resource sizes
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            let totalPageSize = 0;
            let imageCount = 0;
            let jsSize = 0;
            let cssSize = 0;

            resources.forEach((resource) => {
              const size = resource.transferSize || 0;
              totalPageSize += size;

              if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                imageCount++;
              } else if (resource.name.match(/\.js$/i)) {
                jsSize += size;
              } else if (resource.name.match(/\.css$/i)) {
                cssSize += size;
              }
            });

            resolve({
              lcp,
              fcp,
              cls, // CLS requires more complex measurement
              fid, // FID requires user interaction
              ttfb: navigation.responseStart - navigation.requestStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
              loadComplete: navigation.loadEventEnd - navigation.startTime,
              totalPageSize,
              imageCount,
              jsSize,
              cssSize
            });
          }
        }
      });
    });

    return metrics;
  }

  private async runLighthouseAudit(url: string): Promise<any> {
    // Simple lighthouse-like checks
    if (!this.page) return null;

    const lighthouseMetrics = await this.page.evaluate(() => {
      const images = Array.from(document.images);
      const unoptimizedImages = images.filter(img =>
        !img.src.includes('.webp') &&
        !img.src.includes('.avif') &&
        img.naturalWidth > 1920
      );

      const missingAltText = images.filter(img => !img.alt);

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const headingStructure = headings.map(h => h.tagName);

      return {
        unoptimizedImages: unoptimizedImages.length,
        missingAltText: missingAltText.length,
        headingStructure,
        hasMetaDescription: !!document.querySelector('meta[name="description"]'),
        hasMetaViewport: !!document.querySelector('meta[name="viewport"]'),
        totalImages: images.length
      };
    });

    return lighthouseMetrics;
  }

  private checkPerformanceBudget(metrics: PerformanceMetrics): {
    passed: boolean;
    violations: string[];
  } {
    const budget = {
      lcp: 2500,        // 2.5s
      fcp: 1800,        // 1.8s
      ttfb: 800,        // 800ms
      domContentLoaded: 2000, // 2s
      loadComplete: 4000,     // 4s
      totalPageSize: 3 * 1024 * 1024, // 3MB
      jsSize: 1 * 1024 * 1024,        // 1MB
      cssSize: 150 * 1024             // 150KB
    };

    const violations: string[] = [];

    Object.entries(budget).forEach(([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics];
      if (typeof value === 'number' && value > threshold) {
        const unit = metric.includes('Size') ? 'bytes' : 'ms';
        violations.push(`${metric}: ${value}${unit} > ${threshold}${unit}`);
      }
    });

    return {
      passed: violations.length === 0,
      violations
    };
  }

  async testMultiplePages(urls: string[]): Promise<PageTestResult[]> {
    const results: PageTestResult[] = [];

    for (const url of urls) {
      try {
        const result = await this.testPage(url);
        results.push(result);

        // Wait between tests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to test ${url}:`, error);
        results.push({
          url,
          metrics: {} as PerformanceMetrics,
          lighthouse: null,
          networkRequests: 0,
          consoleErrors: [`Failed to load page: ${error}`],
          passed: false,
          violations: ['Page failed to load']
        });
      }
    }

    return results;
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  generateReport(results: PageTestResult[]): void {
    console.log('\n📊 Performance Test Report');
    console.log('=' .repeat(50));

    let totalPassed = 0;
    let totalFailed = 0;

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.url}`);
      console.log(`   Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);

      if (result.passed) {
        totalPassed++;
      } else {
        totalFailed++;
      }

      if (result.metrics.lcp) {
        console.log(`   LCP: ${Math.round(result.metrics.lcp)}ms`);
      }
      if (result.metrics.fcp) {
        console.log(`   FCP: ${Math.round(result.metrics.fcp)}ms`);
      }
      if (result.metrics.ttfb) {
        console.log(`   TTFB: ${Math.round(result.metrics.ttfb)}ms`);
      }
      if (result.metrics.loadComplete) {
        console.log(`   Load: ${Math.round(result.metrics.loadComplete)}ms`);
      }
      if (result.metrics.totalPageSize) {
        console.log(`   Size: ${Math.round(result.metrics.totalPageSize / 1024)}KB`);
      }

      console.log(`   Requests: ${result.networkRequests}`);

      if (result.consoleErrors.length > 0) {
        console.log(`   Errors: ${result.consoleErrors.length}`);
      }

      if (result.violations.length > 0) {
        console.log('   Violations:');
        result.violations.forEach(violation => {
          console.log(`     - ${violation}`);
        });
      }

      if (result.lighthouse) {
        console.log(`   Images: ${result.lighthouse.totalImages} (${result.lighthouse.unoptimizedImages} unoptimized)`);
        console.log(`   Meta: ${result.lighthouse.hasMetaDescription ? '✅' : '❌'} description, ${result.lighthouse.hasMetaViewport ? '✅' : '❌'} viewport`);
      }
    });

    console.log('\n📈 Summary');
    console.log('=' .repeat(20));
    console.log(`Total pages tested: ${results.length}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success rate: ${Math.round((totalPassed / results.length) * 100)}%`);

    if (totalFailed > 0) {
      console.log('\n🚨 Pages that need attention:');
      results.filter(r => !r.passed).forEach(result => {
        console.log(`  - ${result.url}`);
      });
    }

    console.log('\n');
  }
}

async function runPerformanceTests() {
  const tester = new PerformanceTester();

  try {
    await tester.initialize();

    const testUrls = [
      'http://localhost:3000/fr',
      'http://localhost:3000/en',
      'http://localhost:3000/fr/products',
      'http://localhost:3000/en/products',
      'http://localhost:3000/fr/cart',
      'http://localhost:3000/en/cart'
    ];

    console.log('🚀 Starting performance tests...');
    console.log(`Testing ${testUrls.length} pages`);

    const results = await tester.testMultiplePages(testUrls);
    tester.generateReport(results);

  } catch (error) {
    console.error('Performance test failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests()
    .then(() => {
      console.log('✅ Performance tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Performance tests failed:', error);
      process.exit(1);
    });
}

export { PerformanceTester, runPerformanceTests };