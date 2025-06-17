import request from 'supertest';
import express from 'express';

// Mock Express app for testing
const createTestApp = () => {
  const app = express();
  
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV 
    });
  });
  
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });
  
  return app;
};

describe('Health Endpoints', () => {
  let app: express.Application;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        environment: 'test'
      });
    });
  });
  
  describe('GET /api/health', () => {
    it('should return 200 and API health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toEqual({
        status: 'ok',
        database: 'connected',
        timestamp: expect.any(String)
      });
    });
  });
});

describe('Environment Setup', () => {
  it('should be running in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
  
  it('should have database URL configured', () => {
    expect(process.env.DATABASE_URL).toBeDefined();
  });
});