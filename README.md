# 🔗 TinyLink - URL Shortener

A modern, full-stack URL shortener built with Node.js, Express, React, and PostgreSQL.

## Features

- ✨ Create custom short links or auto-generate codes
- 📊 Detailed analytics with click tracking
- 🎨 Beautiful, playful UI with animations
- 🔒 Secure with rate limiting and input validation
- 🚀 Fast redirects with optimized database queries
- 📱 Responsive design for all devices
- 🤖 AI-powered vanity code suggestions (stub ready for LLM integration)
- 📈 7-day sparkline charts and device breakdown
- 💾 Soft delete with reactivation support

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd tinylink
```

2. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

3. **Database Setup**
```bash
# Run migrations
npm run migrate
# OR if psql is not available:
npm run migrate:node
```

4. **Frontend Setup**
```bash
cd ../frontend
npm install
cp .env.example .env
```

5. **Start Development Servers**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Visit http://localhost:5173 🎉

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/tinylink
PORT=3000
BASE_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your-secret-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
VITE_BASE_URL=http://localhost:3000
```

## Running Tests
```bash
cd backend
npm test
```

Tests include:
- Health check endpoint
- Link creation (success and duplicate)
- Redirects with click tracking
- Link deletion
- Reactivation flow

## Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ folder with your preferred static host
```

## Docker

Run with Docker Compose:
```bash
docker-compose up
```

This starts PostgreSQL, backend, and serves the application.

## Project Structure
```
tinylink/
├── backend/          # Node.js + Express API
├── frontend/         # React + Vite UI
├── DOCS/            # Additional documentation
├── DEPLOY.md        # Deployment guide
├── TESTS.md         # Test documentation
└── RUNBOOK.md       # API validation commands
```

## API Endpoints

- `GET /healthz` - Health check
- `POST /api/links` - Create short link
- `GET /api/links` - List all links
- `GET /api/links/:code` - Get link details
- `GET /api/links/:code/stats` - Get link statistics
- `DELETE /api/links/:code` - Delete link
- `GET /:code` - Redirect to target URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open a GitHub issue.