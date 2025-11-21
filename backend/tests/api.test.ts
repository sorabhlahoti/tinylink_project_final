import request from 'supertest';
import { createApp } from '../src/app';
import { pool } from '../src/config/database';
import { Express } from 'express';

let app: Express;

beforeAll(async () => {
  app = createApp();
  
  // Clear test data before all tests
  await pool.query('DELETE FROM clicks');
  await pool.query('DELETE FROM links');
});

afterAll(async () => {
  await pool.end();
});

// Clear data between test suites to avoid conflicts
afterEach(async () => {
  // Optional: clean up after each test if needed
});

describe('TinyLink API Tests', () => {
  
  describe('GET /healthz', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/healthz');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true, version: '1.0' });
    });
  });

  describe('POST /api/links', () => {
    it('should create a new link successfully', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://example.com' });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('code');
      expect(res.body).toHaveProperty('target_url', 'https://example.com');
      expect(res.body).toHaveProperty('short_url');
      expect(res.body.code).toMatch(/^[A-Za-z0-9]{6}$/);
    });

    it('should create a link with custom code', async () => {
      // Use unique code for this test
      const uniqueCode = 'test' + Date.now().toString().slice(-4);
      
      const res = await request(app)
        .post('/api/links')
        .send({ 
          target_url: 'https://github.com',
          code: uniqueCode
        });
      
      expect(res.status).toBe(201);
      expect(res.body.code).toBe(uniqueCode);
    });

    it('should return 409 when code already exists', async () => {
      const code = 'dup' + Date.now().toString().slice(-4);
      
      // Create first link
      await request(app)
        .post('/api/links')
        .send({ 
          target_url: 'https://example.com',
          code: code
        });
      
      // Try to create duplicate
      const res = await request(app)
        .post('/api/links')
        .send({ 
          target_url: 'https://another.com',
          code: code
        });
      
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should return 400 for invalid URL', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'not-a-valid-url' });
      
      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid custom code', async () => {
      const res = await request(app)
        .post('/api/links')
        .send({ 
          target_url: 'https://example.com',
          code: 'ab' // Too short
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /:code', () => {
    let testCode: string;

    beforeAll(async () => {
      testCode = 'redir' + Date.now().toString().slice(-3);
      await request(app)
        .post('/api/links')
        .send({ 
          target_url: 'https://redirect-test.com',
          code: testCode
        });
    });

    it('should redirect to target URL', async () => {
      const res = await request(app)
        .get(`/${testCode}`)
        .redirects(0); // Don't follow redirects
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('https://redirect-test.com');
    });

    it('should increment total_clicks on redirect', async () => {
      // Get initial click count
      const before = await request(app).get(`/api/links/${testCode}`);
      const clicksBefore = before.body.total_clicks;
      
      // Perform redirect
      await request(app).get(`/${testCode}`).redirects(0);
      
      // Check updated click count
      const after = await request(app).get(`/api/links/${testCode}`);
      expect(after.body.total_clicks).toBe(clicksBefore + 1);
    });

    it('should return 404 for non-existent code', async () => {
      const res = await request(app)
        .get('/notexist')
        .redirects(0);
      
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/links', () => {
    it('should return list of all links', async () => {
      const res = await request(app).get('/api/links');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('DELETE /api/links/:code', () => {
    let deleteCode: string;

    beforeEach(async () => {
      // Create a fresh link for each delete test
      deleteCode = 'del' + Date.now().toString().slice(-4);
      await request(app)
        .post('/api/links')
        .send({ 
          target_url: 'https://delete-test.com',
          code: deleteCode
        });
    });

    it('should soft delete a link', async () => {
      const res = await request(app).delete(`/api/links/${deleteCode}`);
      
      expect(res.status).toBe(204);
    });

    it('should return 404 after deletion on redirect', async () => {
      // Delete the link
      await request(app).delete(`/api/links/${deleteCode}`);
      
      // Try to redirect
      const res = await request(app)
        .get(`/${deleteCode}`)
        .redirects(0);
      
      expect(res.status).toBe(404);
    });

    it('should return 404 when deleting non-existent link', async () => {
      const res = await request(app).delete('/api/links/notexist');
      
      expect(res.status).toBe(404);
    });
  });

  describe('Reactivation', () => {
    it('should reactivate deleted link with same code', async () => {
      const code = 'react' + Date.now().toString().slice(-3);
      
      // Create link
      await request(app)
        .post('/api/links')
        .send({ target_url: 'https://first.com', code });
      
      // Delete link
      await request(app).delete(`/api/links/${code}`);
      
      // Verify 404
      const check1 = await request(app).get(`/${code}`).redirects(0);
      expect(check1.status).toBe(404);
      
      // Recreate with same code
      const res = await request(app)
        .post('/api/links')
        .send({ target_url: 'https://second.com', code });
      
      expect(res.status).toBe(200); // 200 for reactivation
      expect(res.body.code).toBe(code);
      
      // Verify redirect works
      const check2 = await request(app).get(`/${code}`).redirects(0);
      expect(check2.status).toBe(302);
    });
  });
});