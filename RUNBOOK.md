# 📘 TinyLink Runbook

Step-by-step commands to validate the TinyLink API and autograder requirements.

## Prerequisites
```bash
# Set your API base URL
export API_URL="http://localhost:3000"
# Or for production:
# export API_URL="https://your-deployed-backend.com"
```

---

## 1. Health Check

**Requirement**: GET /healthz returns 200 with `{"ok":true,"version":"1.0"}`
```bash
curl -i $API_URL/healthz
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{"ok":true,"version":"1.0"}
```

---

## 2. Create Link (Auto-Generated Code)

**Requirement**: POST /api/links creates a link and returns 201
```bash
curl -i -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://example.com"}'
```

**Expected Output**:
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "code": "AbC123",
  "target_url": "https://example.com",
  "short_url": "http://localhost:3000/AbC123",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Validation**:
- ✅ Status code is 201
- ✅ Response contains `code`, `target_url`, `short_url`, `created_at`
- ✅ Code is 6-8 alphanumeric characters

---

## 3. Create Link (Custom Code)

**Requirement**: Custom codes are accepted
```bash
curl -i -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://RetrySLContinuemarkdowngithub.com","code":"github"}'
```

**Expected Output**:
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "code": "github",
  "target_url": "https://github.com",
  "short_url": "http://localhost:3000/github",
  "created_at": "2024-01-15T10:31:00.000Z"
}
```

**Validation**:
- ✅ Status code is 201
- ✅ Returned code matches requested code
- ✅ Custom code is used in short_url

---

## 4. Duplicate Code (409 Conflict)

**Requirement**: Creating a link with an existing code returns 409

```bash
# First, create a link
curl -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://first.com","code":"test123"}'

# Try to create duplicate
curl -i -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://second.com","code":"test123"}'
```

**Expected Output**:
```
HTTP/1.1 409 Conflict
Content-Type: application/json

{"error":"Code already exists"}
```

**Validation**:
- ✅ Status code is 409
- ✅ Error message indicates conflict
- ✅ Original link remains unchanged

---

## 5. Invalid URL (400 Bad Request)

**Requirement**: Invalid URLs are rejected

```bash
curl -i -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"not-a-valid-url"}'
```

**Expected Output**:
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":"Invalid or missing target URL. Must be http or https."}
```

**Validation**:
- ✅ Status code is 400
- ✅ Error message explains validation failure

---

## 6. Invalid Custom Code (400 Bad Request)

**Requirement**: Invalid code formats are rejected

```bash
# Too short
curl -i -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://example.com","code":"ab"}'

# Invalid characters
curl -i -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://example.com","code":"test@123"}'
```

**Expected Output**:
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{"error":"Invalid code format. Must be 6-8 alphanumeric characters."}
```

**Validation**:
- ✅ Status code is 400
- ✅ Codes must match `/^[A-Za-z0-9]{6,8}$/`

---

## 7. Redirect and Increment Clicks

**Requirement**: `GET /:code` redirects (302) and increments click counter

```bash
# First, create a test link
RESPONSE=$(curl -s -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://example.org","code":"redir1"}')
echo $RESPONSE

# Get initial click count
curl -s $API_URL/api/links/redir1 | grep -o '"total_clicks":[0-9]*'

# Perform redirect (use -L to follow, or -i to see headers)
curl -i $API_URL/redir1

# Check updated click count
curl -s $API_URL/api/links/redir1 | grep -o '"total_clicks":[0-9]*'
```

**Expected Output**:
```
# Redirect response:
HTTP/1.1 302 Found
Location: https://example.org

# Click count before: "total_clicks":0
# Click count after: "total_clicks":1
```

**Validation**:
- ✅ Status code is 302
- ✅ Location header points to target_url
- ✅ total_clicks incremented by 1
- ✅ last_clicked timestamp updated

---

## 8. Non-Existent Link (404 Not Found)

**Requirement**: Redirecting to non-existent code returns 404

```bash
curl -i $API_URL/notexist
```

**Expected Output**:
```
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":"Link not found"}
```

**Validation**:
- ✅ Status code is 404
- ✅ Error message indicates link not found

---

## 9. List All Links

**Requirement**: `GET /api/links` returns array of links

```bash
curl -i $API_URL/api/links
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "code": "github",
    "target_url": "https://github.com",
    "created_at": "2024-01-15T10:31:00.000Z",
    "total_clicks": 5,
    "last_clicked": "2024-01-15T12:00:00.000Z",
    "is_active": true
  },
  ...
]
```

**Validation**:
- ✅ Status code is 200
- ✅ Response is an array
- ✅ Each link has required fields

---

## 10. Get Single Link Details

**Requirement**: `GET /api/links/:code` returns link metadata

```bash
curl -i $API_URL/api/links/github
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "code": "github",
  "target_url": "https://github.com",
  "created_at": "2024-01-15T10:31:00.000Z",
  "total_clicks": 5,
  "last_clicked": "2024-01-15T12:00:00.000Z",
  "is_active": true
}
```

---

## 11. Get Link Statistics

**Requirement**: `GET /api/links/:code/stats` returns detailed analytics

```bash
curl -i $API_URL/api/links/github/stats
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "code": "github",
  "target_url": "https://github.com",
  "total_clicks": 5,
  "created_at": "2024-01-15T10:31:00.000Z",
  "last_clicked": "2024-01-15T12:00:00.000Z",
  "click_history": [
    {"date": "2024-01-15", "clicks": 3},
    {"date": "2024-01-14", "clicks": 2}
  ],
  "top_referrers": [
    {"referrer": "Direct", "count": 3},
    {"referrer": "https://google.com", "count": 2}
  ],
  "device_breakdown": {
    "desktop": 4,
    "mobile": 1,
    "tablet": 0,
    "other": 0
  }
}
```

---

## 12. Delete Link (Soft Delete)

**Requirement**: `DELETE /api/links/:code` soft-deletes and returns 204

```bash
# Create a test link
curl -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://delete-me.com","code":"delete1"}'

# Delete it
curl -i -X DELETE $API_URL/api/links/delete1
```

**Expected Output**:
```
HTTP/1.1 204 No Content
```

**Validation**:
- ✅ Status code is 204
- ✅ No response body

---

## 13. Deleted Link Returns 404

**Requirement**: After deletion, `GET /:code` returns 404

```bash
# Try to redirect to deleted link
curl -i $API_URL/delete1
```

**Expected Output**:
```
HTTP/1.1 404 Not Found
Content-Type: application/json

{"error":"Link not found"}
```

**Validation**:
- ✅ Deleted links are not accessible
- ✅ is_active flag is false in database

---

## 14. Reactivate Deleted Link

**Requirement**: Creating a link with a deleted code reactivates it (returns 200)

```bash
# Create link
curl -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://first.com","code":"reactive"}'

# Delete it
curl -X DELETE $API_URL/api/links/reactive

# Verify 404
curl -i $API_URL/reactive

# Recreate with same code
curl -i -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://second.com","code":"reactive"}'

# Should return 200 (reactivation) not 201 (new)
# Verify redirect works again
curl -i $API_URL/reactive
```

**Expected Output**:
```
# Reactivation response:
HTTP/1.1 200 OK
Content-Type: application/json

{
  "code": "reactive",
  "target_url": "https://second.com",
  "short_url": "http://localhost:3000/reactive",
  "created_at": "2024-01-15T10:31:00.000Z"
}

# Redirect works:
HTTP/1.1 302 Found
Location: https://second.com
```

**Validation**:
- ✅ Status code is 200 (not 201)
- ✅ Link is reactivated with new target_url
- ✅ Redirect works to new target

---

## 15. Export Click Data (CSV)

**Requirement**: `GET /api/links/:code/export` returns CSV file

```bash
curl -i $API_URL/api/links/github/export
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="github-clicks.csv"

clicked_at,referrer,user_agent
2024-01-15T12:00:00.000Z,Direct,"Mozilla/5.0..."
2024-01-15T11:30:00.000Z,https://google.com,"Mozilla/5.0..."
```

---

## 16. AI Code Suggestions (Stub)

**Requirement**: `POST /api/ai/suggest-code` returns code suggestions

```bash
curl -i -X POST $API_URL/api/ai/suggest-code \
  -H "Content-Type: application/json" \
  -d '{"seed":"github"}'
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "suggestions": ["github", "githubb", "gogithu", "mygithu", "getgith"]
}
```

> Note: This is a stub. Replace with real LLM in production.

---

## 17. AI URL Categorization (Stub)

**Requirement**: `POST /api/ai/categorize` returns tags and description

```bash
curl -i -X POST $API_URL/api/ai/categorize \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/user/repo"}'
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "tags": ["code", "development", "repository"],
  "description": "A link to github.com"
}
```

---

## 18. AI Safety Check (Stub)

**Requirement**: `POST /api/ai/safety-check` validates URL safety

```bash
curl -i -X POST $API_URL/api/ai/safety-check \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "is_safe": true,
  "risk_level": "low",
  "reasons": ["No suspicious patterns detected"]
}
```

---

## 19. Rate Limiting

**Requirement**: Rate limits prevent abuse

```bash
# Rapid requests should eventually hit rate limit
for i in {1..110}; do
  curl -s -o /dev/null -w "%{http_code}\n" $API_URL/api/links
done
```

**Expected Behavior**:
- First 100 requests: `200 OK`
- Subsequent requests: `429 Too Many Requests`

---

## 20. Analytics Summary

**Requirement**: `GET /api/links/analytics` returns overall stats

```bash
curl -i $API_URL/api/links/analytics
```

**Expected Output**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "total_links": 15,
  "total_clicks": 247,
  "top_links": [
    {"code": "github", "target_url": "https://github.com", "clicks": 85},
    {"code": "google", "target_url": "https://google.com", "clicks": 52}
  ],
  "avg_clicks_per_day": 12.3,
  "trending_links": [
    {"code": "trending1", "target_url": "https://...", "growth_rate": 2.5}
  ]
}
```

---

## Complete Flow Test

Run all autograder requirements in sequence:

```bash
#!/bin/bash
set -e

API_URL="http://localhost:3000"

echo "1. Health check..."
curl -f $API_URL/healthz

echo -e "\n2. Create link..."
LINK=$(curl -s -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://example.com","code":"test456"}')
echo $LINK

echo -e "\n3. Duplicate returns 409..."
curl -f -X POST $API_URL/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url":"https://other.com","code":"test456"}' \
  && echo "FAIL: Should return 409" || echo "PASS: Got 409"

echo -e "\n4. Redirect..."
curl -I $API_URL/test456

echo -e "\n5. Check clicks incremented..."
curl -s $API_URL/api/links/test456 | grep total_clicks

echo -e "\n6. Delete..."
curl -f -X DELETE $API_URL/api/links/test456

echo -e "\n7. Deleted returns 404..."
curl -f $API_URL/test456 \
  && echo "FAIL: Should return 404" || echo "PASS: Got 404"

echo -e "\n✅ All tests passed!"
```

---

## Troubleshooting Commands

**Check Database Connection**
```bash
curl $API_URL/healthz
```

**View Backend Logs**

_Local:_
```bash
cd backend && npm run dev
```

_Production (Render):_
- View logs in Render dashboard

**Test Database Queries**
```bash
psql $DATABASE_URL -c "SELECT * FROM links LIMIT 5;"
```

**Clear Test Data**
```bash
psql $DATABASE_URL -c "DELETE FROM clicks; DELETE FROM links;"
```

---

## Developer Checklist

Before merging to production:

- [ ] All curl commands above return expected results
- [ ] `npm test` passes all tests
- [ ] No console errors in browser
- [ ] Frontend can create/view/delete links
- [ ] Stats page displays correctly
- [ ] Rate limiting works
- [ ] Database migrations ran successfully
- [ ] Environment variables set correctly
- [ ] Health check responds
- [ ] No sensitive data in logs

---

## Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/healthz` | GET | Health check |
| `/api/links` | POST | Create link |
| `/api/links` | GET | List links |
| `/api/links/:code` | GET | Get link details |
| `/api/links/:code/stats` | GET | Get statistics |
| `/api/links/:code/export` | GET | Export CSV |
| `/api/links/:code` | DELETE | Delete link |
| `/:code` | GET | Redirect |
| `/api/ai/suggest-code` | POST | AI suggestions |
| `/api/ai/categorize` | POST | AI categorization |
| `/api/ai/safety-check` | POST | Safety check |

---

For deployment steps, see DEPLOY.md  
For test documentation, see TESTS.md

---


## RUNBOOK: Developer Checklist & PR Process

### Developer Checklist (10 Items)

Before committing code, ensure:

✅ All tests pass locally
```bash
cd backend && npm test
```

✅ Code compiles without errors
```bash
cd backend && npm run build
cd frontend && npm run build
```

✅ Linting passes (no warnings)
```bash
npm run lint
```

✅ Environment variables documented  
Update `.env.example` if new variables added. Document purpose in README or DEPLOY.md

✅ Database migrations are idempotent  
Can be run multiple times safely. Include `IF NOT EXISTS` clauses.

✅ API changes are documented  
Update RUNBOOK.md with new endpoints. Add curl examples.

✅ Security best practices followed  
No hardcoded secrets. SQL queries use parameterization. Input validation on all endpoints.

✅ Error handling is comprehensive  
Try-catch blocks around async operations. User-friendly error messages. Detailed server logs.

✅ UI is responsive and accessible  
Test on mobile viewport. ARIA labels on interactive elements. Keyboard navigation works.

✅ Git commit message is descriptive  
Follow format: `type: description`  
Types: feat, fix, docs, test, refactor, chore

---

### Opening and Merging Pull Requests

**Opening a PR**

Create a feature branch
```bash
git checkout -b feature/add-analytics-export
```

Make your changes and commit
```bash
git add .
git commit -m "feat: add CSV export for link analytics"
```

Push to remote
```bash
git push origin feature/add-analytics-export
```

Open PR on GitHub and fill PR template:
```markdown
## Description
Adds CSV export functionality for link click data

## Changes
- Created /api/links/:code/export endpoint
- Added exportClicksCSV service function
- Updated frontend to show export button

## Testing
- [ ] Unit tests pass
- [ ] Manual testing with curl
- [ ] UI tested in browser

## Related Issues
Closes #42
```

Request review: Tag at least one reviewer and link related issues.

**Merging a PR Safely**

Review checklist:
- CI/CD pipeline passes
- At least one approval from reviewer
- No merge conflicts
- Branch is up to date with main

Update your branch if needed:
```bash
git checkout main
git pull origin main
git checkout feature/add-analytics-export
git merge main
# Resolve conflicts if any
git push origin feature/add-analytics-export
```

Merge strategies:
- Squash and Merge (recommended)
- Rebase and Merge
- Merge Commit

Delete branch after merge:
```bash
git branch -d feature/add-analytics-export
git push origin --delete feature/add-analytics-export
```

Verify deployment: Check CI/CD deployed successfully and monitor logs.

---

## 8 Small, Testable PR-by-PR Features

Each feature below includes branch name, description, implementation details, and exact test commands.

### Feature 1: Link Expiration
**Branch**: `feature/link-expiration`  
**Description**: Add optional expiration date to links. After expiration, links return `410 Gone` instead of redirecting.  
**Changes**:
- Add `expires_at TIMESTAMP WITH TIME ZONE NULL` to links table
- Update CREATE endpoint to accept optional `expires_at`
- Modify redirect logic to check expiration
- Add expired links filter to dashboard

**Migration**:
```sql
ALTER TABLE links ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL;
CREATE INDEX IF NOT EXISTS idx_links_expires ON links(expires_at) WHERE expires_at IS NOT NULL;
```

**Test Commands**:
```bash
# Create link with expiration (2 hours from now)
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://example.com",
    "code": "expire1",
    "expires_at": "'$(date -u -d '+2 hours' +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# Verify link works
curl -I http://localhost:3000/expire1

# Create expired link (in the past)
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://example.com",
    "code": "expired",
    "expires_at": "2020-01-01T00:00:00Z"
  }'

# Should return 410 Gone
curl -I http://localhost:3000/expired
```

### Feature 2: Link Password Protection
**Branch**: `feature/link-password`  
**Description**: Allow users to password-protect links. Requires password query parameter to redirect.  
**Changes**:
- Add `password_hash TEXT NULL` to links table
- Update CREATE endpoint to hash and store password
- Modify redirect to check for password in query string
- Return 401 if password missing or incorrect

**Migration**:
```sql
ALTER TABLE links ADD COLUMN IF NOT EXISTS password_hash TEXT NULL;
```

**Test Commands**:
```bash
# Create password-protected link
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://secret.com",
    "code": "secret1",
    "password": "mypassword123"
  }'

# Try without password (should fail)
curl -I http://localhost:3000/secret1

# Try with wrong password (should fail)
curl -I "http://localhost:3000/secret1?password=wrong"

# Try with correct password (should redirect)
curl -I "http://localhost:3000/secret1?password=mypassword123"
```

### Feature 3: Link Preview API
**Branch**: `feature/link-preview`  
**Description**: Endpoint to fetch Open Graph metadata from target URLs for rich previews.  
**Changes**:
- Create `GET /api/links/:code/preview` endpoint
- Fetch target URL and parse HTML
- Extract `og:title`, `og:description`, `og:image`
- Return JSON with preview data

**New Dependencies**:
```bash
npm install axios cheerio
```

**Test Commands**:
```bash
# Create a link
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url": "https://github.com", "code": "gh"}'

# Get preview data
curl http://localhost:3000/api/links/gh/preview
```

### Feature 4: Bulk Link Creation
**Branch**: `feature/bulk-create`  
**Description**: Upload CSV file with multiple URLs to create links in batch.  
**Changes**:
- Create `POST /api/links/bulk` endpoint
- Accept CSV file upload (multipart/form-data)
- Parse CSV with columns: `target_url`, `code` (optional)
- Return array of created links with success/failure status

**New Dependencies**:
```bash
npm install multer
```

**Test Commands**:
```bash
# Create test CSV file
cat > links.csv << EOF
target_url,code
https://google.com,google
https://github.com,gh
https://stackoverflow.com,
EOF

# Upload bulk links
curl -X POST http://localhost:3000/api/links/bulk \
  -F "file=@links.csv"
```

Expected output example:
```json
{
  "created": 3,
  "failed": 0,
  "results": [
    {"code": "google", "status": "success"},
    {"code": "gh", "status": "success"},
    {"code": "AbC123", "status": "success"}
  ]
}
```

Verify links:
```bash
curl -I http://localhost:3000/google
curl -I http://localhost:3000/gh
```

### Feature 5: QR Code Generation
**Branch**: `feature/qr-codes`  
**Description**: Generate QR codes for short links that can be downloaded or displayed.  
**Changes**:
- Create `GET /api/links/:code/qr` endpoint
- Generate QR code image for short URL
- Return PNG image
- Add download button to frontend stats page

**New Dependencies**:
```bash
npm install qrcode
```

**Test Commands**:
```bash
# Create a link
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url": "https://example.com", "code": "qrtest"}'

# Generate QR code
curl http://localhost:3000/api/links/qrtest/qr --output qrcode.png

# Verify it's a valid PNG
file qrcode.png
# Output: qrcode.png: PNG image data, 200 x 200, 8-bit/color RGB, non-interlaced

# Open in browser
open qrcode.png  # or xdg-open on Linux
```

### Feature 6: Link Tags/Categories
**Branch**: `feature/link-tags`  
**Description**: Add tags to links for organization and filtering.  
**Changes**:
- Create `link_tags` table (link_code, tag)
- Update CREATE endpoint to accept `tags` array
- Add `GET /api/links?tag=:tag` filter
- Add tag chips to dashboard UI

**Migration**:
```sql
CREATE TABLE IF NOT EXISTS link_tags (
    link_code VARCHAR(8) NOT NULL REFERENCES links(code) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (link_code, tag)
);
CREATE INDEX IF NOT EXISTS idx_link_tags_tag ON link_tags(tag);
```

**Test Commands**:
```bash
# Create link with tags
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://docs.example.com",
    "code": "docs",
    "tags": ["documentation", "reference", "technical"]
  }'

# Filter by tag
curl "http://localhost:3000/api/links?tag=documentation"

# Get all tags
curl http://localhost:3000/api/tags
```

Expected tags output example:
```json
["documentation", "reference", "technical", "personal", "work"]
```

### Feature 7: Link Usage Limits
**Branch**: `feature/usage-limits`  
**Description**: Set maximum click limit for links. After limit reached, return `429 Too Many Requests`.  
**Changes**:
- Add `max_clicks INTEGER NULL` to links table
- Update CREATE endpoint to accept `max_clicks`
- Modify redirect to check click count against limit
- Show progress bar in UI when approaching limit

**Migration**:
```sql
ALTER TABLE links ADD COLUMN IF NOT EXISTS max_clicks INTEGER NULL;
```

**Test Commands**:
```bash
# Create link with 5-click limit
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://limited.com",
    "code": "limited",
    "max_clicks": 5
  }'

# Click 5 times
for i in {1..5}; do
  curl -I http://localhost:3000/limited
  echo "Click $i"
done

# 6th click should fail
curl -I http://localhost:3000/limited
# Expected: HTTP/1.1 429 Too Many Requests

# Check status
curl http://localhost:3000/api/links/limited
# Output should show: "total_clicks": 5, "max_clicks": 5
```

### Feature 8: Webhook Notifications
**Branch**: `feature/webhooks`  
**Description**: Send webhook notifications when links are created, clicked, or deleted.  
**Changes**:
- Add `webhooks` table (url, events, secret)
- Create `POST /api/webhooks` endpoint to register webhooks
- Trigger webhook POST on link events
- Include HMAC signature for verification

**Migration**:
```sql
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);
```

**Test Commands**:
```bash
# Start a webhook receiver (for testing)
# Use webhook.site or requestbin.com, or run locally:
# python3 -m http.server 8080

# Register webhook
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/your-unique-id",
    "events": ["link.created", "link.clicked", "link.deleted"],
    "secret": "my-webhook-secret"
  }'

# Create a link (should trigger webhook)
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"target_url": "https://example.com", "code": "webhook1"}'

# Click the link (should trigger webhook)
curl -I http://localhost:3000/webhook1

# Delete the link (should trigger webhook)
curl -X DELETE http://localhost:3000/api/links/webhook1

# Check webhook.site to see received payloads
```

