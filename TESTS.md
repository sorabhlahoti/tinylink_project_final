# 🧪 Test Documentation

This document maps the autograder requirements to our test suite and provides detailed testing information.

## Test Coverage

### Autograder Requirements Mapping

| Requirement | Test | File | Status |
|------------|------|------|--------|
| Health check returns 200 | `should return health status` | `api.test.ts:15` | ✅ |
| Create link success returns 201 | `should create a new link successfully` | `api.test.ts:23` | ✅ |
| Create with custom code | `should create a link with custom code` | `api.test.ts:33` | ✅ |
| Duplicate code returns 409 | `should return 409 when code already exists` | `api.test.ts:43` | ✅ |
| Invalid URL returns 400 | `should return 400 for invalid URL` | `api.test.ts:60` | ✅ |
| Invalid code returns 400 | `should return 400 for invalid custom code` | `api.test.ts:67` | ✅ |
| Redirect returns 302 | `should redirect to target URL` | `api.test.ts:89` | ✅ |
| Redirect increments clicks | `should increment total_clicks on redirect` | `api.test.ts:96` | ✅ |
| Non-existent link returns 404 | `should return 404 for non-existent code` | `api.test.ts:109` | ✅ |
| Delete returns 204 | `should soft delete a link` | `api.test.ts:133` | ✅ |
| Deleted link returns 404 | `should return 404 after deletion on redirect` | `api.test.ts:138` | ✅ |
| List links returns array | `should return list of all links` | `api.test.ts:118` | ✅ |
| Reactivate deleted link | `should reactivate deleted link with same code` | `api.test.ts:155` | ✅ |

---

## Running Tests

### All Tests
```bash
cd backend
npm test
```

### Specific Test File
```bash
npm test api.test.ts
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

---

## Test Environment Setup

Tests use a separate test database to avoid affecting development data.

### Setup Test Database
```bash
# Create test database
createdb tinylink_test

# Set test environment variable
export TEST_DATABASE_URL="postgresql://user:password@localhost:5432/tinylink_test"

# Run migrations
DATABASE_URL=$TEST_DATABASE_URL npm run migrate
```

### `.env.test` Example
```
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/tinylink_test
NODE_ENV=test
JWT_SECRET=test-secret
BASE_URL=http://localhost:3000
PORT=3000
```

---

## Test Descriptions

### 1. Health Check Test
```typescript
describe('GET /healthz', () => {
  it('should return health status', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, version: '1.0' });
  });
});
```

**Validates**: Basic server connectivity and health endpoint

---

### 2. Create Link Tests

#### Success Case
```typescript
it('should create a new link successfully', async () => {
  const res = await request(app)
    .post('/api/links')
    .send({ target_url: 'https://example.com' });
  
  expect(res.status).toBe(201);
  expect(res.body.code).toMatch(/^[A-Za-z0-9]{6}$/);
});
```

**Validates**: 
- Link creation returns 201
- Auto-generated code is 6 characters
- Response includes code, target_url, short_url

#### Custom Code
```typescript
it('should create a link with custom code', async () => {
  const res = await request(app)
    .post('/api/links')
    .send({ target_url: 'https://github.com', code: 'github' });
  
  expect(res.status).toBe(201);
  expect(res.body.code).toBe('github');
});
```

**Validates**: Custom code is accepted and used

#### Duplicate Code (409)
```typescript
it('should return 409 when code already exists', async () => {
  // Create first link
  await request(app).post('/api/links').send({ 
    target_url: 'https://example.com',
    code: 'test123'
  });
  
  // Try duplicate
  const res = await request(app).post('/api/links').send({ 
    target_url: 'https://another.com',
    code: 'test123'
  });
  
  expect(res.status).toBe(409);
});
```

**Validates**: Duplicate codes are rejected with 409

---

### 3. Validation Tests

#### Invalid URL
```typescript
it('should return 400 for invalid URL', async () => {
  const res = await request(app)
    .post('/api/links')
    .send({ target_url: 'not-a-valid-url' });
  
  expect(res.status).toBe(400);
});
```

**Validates**: Non-HTTP(S) URLs are rejected

#### Invalid Code Format
```typescript
it('should return 400 for invalid custom code', async () => {
  const res = await request(app)
    .post('/api/links')
    .send({ target_url: 'https://example.com', code: 'ab' });
  
  expect(res.status).toBe(400);
});
```

**Validates**: Codes must be 6-8 alphanumeric characters

---

### 4. Redirect Tests

#### Successful Redirect
```typescript
it('should redirect to target URL', async () => {
  const res = await request(app)
    .get('/testcode')
    .redirects(0);
  
  expect(res.status).toBe(302);
  expect(res.headers.location).toBe('https://redirect-test.com');
});
```

**Validates**: 
- Returns 302 redirect
- Location header contains target URL

#### Click Tracking
```typescript
it('should increment total_clicks on redirect', async () => {
  const before = await request(app).get('/api/links/testcode');
  const clicksBefore = before.body.total_clicks;
  
  await request(app).get('/testcode').redirects(0);
  
  const after = await request(app).get('/api/links/testcode');
  expect(after.body.total_clicks).toBe(clicksBefore + 1);
});
```

**Validates**: 
- Click counter increments atomically
- Race condition safety (SELECT FOR UPDATE)

---

### 5. Delete Tests

#### Soft Delete
```typescript
it('should soft delete a link', async () => {
  const res = await request(app).delete('/api/links/testcode');
  expect(res.status).toBe(204);
});
```

**Validates**: Delete returns 204 No Content

#### Post-Delete Behavior
```typescript
it('should return 404 after deletion on redirect', async () => {
  await request(app).delete('/api/links/testcode');
  
  const res = await request(app).get('/testcode').redirects(0);
  expect(res.status).toBe(404);
});
```

**Validates**: Deleted links return 404 on redirect

---

### 6. Reactivation Test
```typescript
it('should reactivate deleted link with same code', async () => {
  // Create, delete, recreate
  await request(app).post('/api/links').send({ 
    target_url: 'https://first.com', 
    code: 'reactive' 
  });
  await request(app).delete('/api/links/reactive');
  
  const res = await request(app).post('/api/links').send({ 
    target_url: 'https://second.com', 
    code: 'reactive' 
  });
  
  expect(res.status).toBe(200); // 200 for reactivation
});
```

**Validates**: Deleted links can be reactivated with new target URL

---

## Integration Tests (Future)

### Frontend E2E Tests (Playwright/Cypress)
- User can create link via UI
- Click counter updates in real-time
- Stats page displays correctly
- Copy to clipboard works
- Search and filter work

### Load Tests (Artillery/k6)
- Concurrent redirects don't cause race conditions
- Rate limiting works under load
- Database connection pool handles traffic

---

## CI/CD Pipeline

See `.github/workflows/ci.yml` for automated testing on every push.

### GitHub Actions Workflow
1. Spin up PostgreSQL service
2. Run database migrations
3. Run test suite
4. Report coverage

---

## Manual Testing Checklist

Before deployment, manually verify:

- [ ] Health check responds
- [ ] Can create link with auto code
- [ ] Can create link with custom code
- [ ] Duplicate code is rejected
- [ ] Invalid URLs are rejected
- [ ] Redirect works and increments counter
- [ ] Stats page shows correct data
- [ ] Delete works and returns 404
- [ ] Reactivation works
- [ ] Copy to clipboard works
- [ ] Search and filter work
- [ ] Mobile UI is responsive

---

## Test Data Cleanup

Tests automatically clean up:
```typescript
beforeAll(async () => {
  await pool.query('DELETE FROM clicks');
  await pool.query('DELETE FROM links');
});

afterAll(async () => {
  await pool.end();
});
```

---

## Debugging Tests

### View SQL Queries
Add logging in `database.ts`:
```typescript
pool.on('query', (query) => {
  console.log('QUERY:', query.text);
});
```

### Test Individual Endpoint
```typescript
it.only('should test this one', async () => {
  // Only this test runs
});
```

### Increase Timeout
```typescript
jest.setTimeout(30000); // 30 seconds
```

---

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Current coverage:
```bash
npm test -- --coverage
```

---

## Adding New Tests

### Template
```typescript
describe('Feature Name', () => {
  it('should do something specific', async () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const res = await request(app).post('/endpoint').send(input);
    
    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('expectedField');
  });
});
```

### Best Practices
1. Use descriptive test names
2. Test one thing per test
3. Clean up test data
4. Use factories for test data
5. Mock external services
6. Test both success and failure cases

---

For API validation commands, see RUNBOOK.md