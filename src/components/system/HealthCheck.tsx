import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { performanceMonitor } from '@/lib/performance-monitor';
import { errorHandler } from '@/lib/error-handler';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
}

interface SystemMetrics {
  averageLoadTime: number;
  totalOperations: number;
  errorRate: number;
  memoryUsage: number;
}

export default function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'healthy',
    issues: [],
  });
  const [metrics, setMetrics] = useState<SystemMetrics>({
    averageLoadTime: 0,
    totalOperations: 0,
    errorRate: 0,
    memoryUsage: 0,
  });
  const [loading, setLoading] = useState(false);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const perfStats = performanceMonitor.getStats();
      const errorMetrics = errorHandler.getErrors();
      const errorRate = perfStats.totalMetrics > 0 ? errorMetrics.length / perfStats.totalMetrics : 0;

      setMetrics({
        averageLoadTime: perfStats.metrics.loadTime?.avg || 0,
        totalOperations: perfStats.totalMetrics,
        errorRate,
        memoryUsage: perfStats.metrics.memoryUsage?.avg || 0,
      });

      const healthStatus = performanceMonitor.checkPerformanceHealth();
      setHealth({
        status: healthStatus.status as 'healthy' | 'degraded' | 'unhealthy',
        issues: healthStatus.issues,
      });
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth({
        status: 'unhealthy',
        issues: ['Failed to run health check'],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Health</CardTitle>
            <Badge className={getStatusColor(health.status)}>
              {health.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {health.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {health.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Load Time</span>
                <span>{metrics.averageLoadTime.toFixed(2)}ms</span>
              </div>
              <Progress value={Math.min(metrics.averageLoadTime / 10, 100)} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Error Rate</span>
                <span>{(metrics.errorRate * 100).toFixed(2)}%</span>
              </div>
              <Progress value={metrics.errorRate * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{(metrics.memoryUsage * 100).toFixed(2)}%</span>
              </div>
              <Progress value={metrics.memoryUsage * 100} />
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Operations</span>
              <span>{metrics.totalOperations}</span>
            </div>
          </div>
          <Button
            onClick={runHealthCheck}
            disabled={loading}
            className="mt-4 w-full"
          >
            {loading ? 'Running...' : 'Run Health Check'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}