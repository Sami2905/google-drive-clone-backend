import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

describe('Enhanced Logging', () => {
  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(mockConsole.log);
    jest.spyOn(console, 'error').mockImplementation(mockConsole.error);
    jest.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockConsole.log.mockClear();
    mockConsole.error.mockClear();
    mockConsole.warn.mockClear();
  });

  describe('Logger Utility', () => {
    it('should log info messages with timestamp', () => {
      const logger = {
        info: (message: string, meta?: Record<string, unknown>) => {
          console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta || '');
        },
        error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
          const errorDetails = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error;
          console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
            error: errorDetails,
            ...meta
          });
        },
        warn: (message: string, meta?: Record<string, unknown>) => {
          console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, meta || '');
        },
        debug: (message: string, meta?: Record<string, unknown>) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta || '');
          }
        }
      };

      logger.info('Test info message');
      logger.warn('Test warning message');
      logger.error('Test error message');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\[INFO\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Test info message$/),
        ''
      );

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringMatching(/^\[WARN\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Test warning message$/),
        ''
      );

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[ERROR\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Test error message$/),
        expect.objectContaining({
          error: undefined
        })
      );
    });

    it('should log error messages with structured error details', () => {
      const logger = {
        error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
          const errorDetails = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error;
          console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
            error: errorDetails,
            ...meta
          });
        }
      };

      const testError = new Error('Test error message');
      testError.stack = 'Error: Test error message\n    at test.js:1:1';
      testError.name = 'TestError';

      logger.error('Operation failed', testError, { operation: 'test', userId: '123' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[ERROR\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Operation failed$/),
        expect.objectContaining({
          error: {
            message: 'Test error message',
            stack: 'Error: Test error message\n    at test.js:1:1',
            name: 'TestError'
          },
          operation: 'test',
          userId: '123'
        })
      );
    });

    it('should log debug messages only in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test in development environment
      process.env.NODE_ENV = 'development';
      
      const logger = {
        debug: (message: string, meta?: Record<string, unknown>) => {
          if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, meta || '');
          }
        }
      };

      logger.debug('Debug message in development');

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\[DEBUG\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Debug message in development$/),
        ''
      );

      // Test in production environment
      process.env.NODE_ENV = 'production';
      mockConsole.log.mockClear();

      logger.debug('Debug message in production');

      expect(mockConsole.log).not.toHaveBeenCalled();

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle metadata in log messages', () => {
      const logger = {
        info: (message: string, meta?: Record<string, unknown>) => {
          console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta || '');
        }
      };

      const metadata = {
        userId: '123',
        operation: 'file_upload',
        fileSize: 1024,
        fileName: 'test.pdf'
      };

      logger.info('File upload completed', metadata);

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\[INFO\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: File upload completed$/),
        metadata
      );
    });
  });

  describe('Request Logging Middleware', () => {
    it('should log incoming requests with metadata', () => {
      const mockRequest = {
        method: 'POST',
        url: '/api/files/upload',
        get: jest.fn((header: string) => {
          if (header === 'User-Agent') return 'Test User Agent';
          return undefined;
        }),
        ip: '127.0.0.1',
        user: { id: 'user123' }
      };

      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event: string, callback: () => void) => {
          if (event === 'finish') {
            callback();
          }
        })
      };

      const mockNext = jest.fn();

      const requestLoggingMiddleware = (req: any, res: any, next: any) => {
        const start = Date.now();
        
        const logger = {
          info: (message: string, meta?: Record<string, unknown>) => {
            console.log(`[INFO] ${new Date().toISOString()}: ${message}`, meta || '');
          }
        };

        logger.info('Incoming request', {
          method: req.method,
          url: req.url,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          userId: req.user?.id
        });
        
        res.on('finish', () => {
          const duration = Date.now() - start;
          logger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            userId: req.user?.id
          });
        });
        
        next();
      };

      requestLoggingMiddleware(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));

      // Verify incoming request log
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\[INFO\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Incoming request$/),
        expect.objectContaining({
          method: 'POST',
          url: '/api/files/upload',
          userAgent: 'Test User Agent',
          ip: '127.0.0.1',
          userId: 'user123'
        })
      );

      // Verify request completed log
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringMatching(/^\[INFO\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Request completed$/),
        expect.objectContaining({
          method: 'POST',
          url: '/api/files/upload',
          statusCode: 200,
          duration: expect.stringMatching(/^\d+ms$/),
          userId: 'user123'
        })
      );
    });
  });

  describe('Error Logging', () => {
    it('should log errors with proper structure', () => {
      const logger = {
        error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
          const errorDetails = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error;
          console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
            error: errorDetails,
            ...meta
          });
        }
      };

      const testError = new Error('Database connection failed');
      testError.stack = 'Error: Database connection failed\n    at db.js:10:5';
      testError.name = 'DatabaseError';

      logger.error('Failed to connect to database', testError, {
        endpoint: '/test-connection',
        timestamp: '2024-01-01T00:00:00.000Z'
      });

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[ERROR\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Failed to connect to database$/),
        expect.objectContaining({
          error: {
            message: 'Database connection failed',
            stack: 'Error: Database connection failed\n    at db.js:10:5',
            name: 'DatabaseError'
          },
          endpoint: '/test-connection',
          timestamp: '2024-01-01T00:00:00.000Z'
        })
      );
    });

    it('should handle unknown error types gracefully', () => {
      const logger = {
        error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
          const errorDetails = error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
          } : error;
          console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, {
            error: errorDetails,
            ...meta
          });
        }
      };

      const unknownError = 'Unknown error occurred';
      const metadata = { context: 'file_upload' };

      logger.error('Operation failed', unknownError, metadata);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[ERROR\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Operation failed$/),
        expect.objectContaining({
          error: 'Unknown error occurred',
          context: 'file_upload'
        })
      );
    });
  });
});
