import request from 'supertest';
import app from '../../backend/src/server';

describe('CORS Configuration', () => {
  describe('Production CORS behavior', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalFrontendUrl = process.env.FRONTEND_URL;
    const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.FRONTEND_URL = 'https://frontend-production-72eb.up.railway.app';
      delete process.env.ALLOWED_ORIGINS;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      if (originalFrontendUrl !== undefined) {
        process.env.FRONTEND_URL = originalFrontendUrl;
      } else {
        delete process.env.FRONTEND_URL;
      }
      if (originalAllowedOrigins !== undefined) {
        process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
      } else {
        delete process.env.ALLOWED_ORIGINS;
      }
    });

    it('should allow requests from configured frontend URL', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://frontend-production-72eb.up.railway.app');

      expect(response.headers['access-control-allow-origin']).toBe(
        'https://frontend-production-72eb.up.railway.app'
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject requests from non-configured origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious-site.com');

      // When CORS rejects, the Access-Control-Allow-Origin header should not be set
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should support multiple origins when ALLOWED_ORIGINS is set', async () => {
      process.env.ALLOWED_ORIGINS = 'https://frontend-production-72eb.up.railway.app,https://custom-domain.com';

      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://custom-domain.com');

      expect(response.headers['access-control-allow-origin']).toBe('https://custom-domain.com');
    });

    it('should handle ALLOWED_ORIGINS with whitespace correctly', async () => {
      process.env.ALLOWED_ORIGINS = ' https://frontend-production-72eb.up.railway.app , https://custom-domain.com ';

      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://custom-domain.com');

      expect(response.headers['access-control-allow-origin']).toBe('https://custom-domain.com');
    });

    it('should allow requests without Origin header (direct API calls)', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      // No CORS headers needed when no Origin is present
    });
  });

  describe('Development CORS behavior', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should allow any origin in development', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should allow requests from any domain in development', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://any-domain.com');

      expect(response.headers['access-control-allow-origin']).toBe('https://any-domain.com');
    });
  });

  describe('CORS headers configuration', () => {
    it('should include proper CORS headers in preflight requests', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
      expect(response.headers['access-control-allow-methods']).toContain('DELETE');
      expect(response.headers['access-control-allow-methods']).toContain('OPTIONS');
      
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
      expect(response.headers['access-control-allow-headers']).toContain('X-Requested-With');
      
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});