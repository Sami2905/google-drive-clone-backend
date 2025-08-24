class PerformanceMonitor {
  private metrics: { [key: string]: number[] } = {};
  private operationMetrics: { [key: string]: { [metric: string]: number[] } } = {};
  private totalMetricsCount = 0;
  private totalLoadTime = 0;

  measure(name: string, value: number) {
    if (!this.metrics[name]) {
      this.metrics[name] = [];
    }
    this.metrics[name].push(value);
    this.totalMetricsCount++;
    if (name === 'loadTime') {
      this.totalLoadTime += value;
    }
  }

  measureOperation(operation: string, metric: string, value: number) {
    if (!this.operationMetrics[operation]) {
      this.operationMetrics[operation] = {};
    }
    if (!this.operationMetrics[operation][metric]) {
      this.operationMetrics[operation][metric] = [];
    }
    this.operationMetrics[operation][metric].push(value);
  }

  getMetrics() {
    const result: { [key: string]: { avg: number; min: number; max: number } } = {};
    
    for (const [name, values] of Object.entries(this.metrics)) {
      const sum = values.reduce((a, b) => a + b, 0);
      result[name] = {
        avg: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }

    return result;
  }

  getMetricsForOperation(operation: string) {
    const metrics = this.operationMetrics[operation];
    if (!metrics) return {};

    const result: { [metric: string]: { avg: number; min: number; max: number } } = {};
    
    for (const [metric, values] of Object.entries(metrics)) {
      const sum = values.reduce((a, b) => a + b, 0);
      result[metric] = {
        avg: sum / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }

    return result;
  }

  checkPerformanceHealth() {
    const metrics = this.getMetrics();
    const health = {
      status: 'healthy',
      issues: [] as string[],
    };

    // Check response times
    if (metrics.responseTime?.avg > 1000) {
      health.status = 'degraded';
      health.issues.push('High average response time');
    }

    // Check error rates
    if (metrics.errorRate?.avg > 0.05) {
      health.status = 'unhealthy';
      health.issues.push('High error rate');
    }

    // Check memory usage
    if (metrics.memoryUsage?.avg > 0.9) {
      health.status = 'degraded';
      health.issues.push('High memory usage');
    }

    return health;
  }

  getStats() {
    return {
      metrics: this.getMetrics(),
      operations: Object.keys(this.operationMetrics).reduce((acc, operation) => {
        acc[operation] = this.getMetricsForOperation(operation);
        return acc;
      }, {} as { [key: string]: any }),
      totalMetrics: this.totalMetricsCount,
      averageLoadTime: this.totalLoadTime / (this.metrics.loadTime?.length || 1),
    };
  }

  clear() {
    this.metrics = {};
    this.operationMetrics = {};
    this.totalMetricsCount = 0;
    this.totalLoadTime = 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();