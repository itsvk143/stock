# Indian Stock Intelligence Platform

Production-grade AI-powered stock intelligence platform for Indian Equity Markets (NSE & BSE).

## Features
- **Real-time Data**: Integrated with Angel One SmartAPI for sub-second LTP updates.
- **AI Analysis**: LLM-powered reasoning grounded in fundamental and technical data.
- **Technical Charts**: High-performance candlestick charts using Lightweight Charts.
- **Instrument Master**: Automated daily sync of NSE/BSE instrument tokens.
- **Premium UI**: Modern dark-mode interface inspired by top trading platforms.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, ShadCN UI, Zustand, React Query.
- **Backend**: NestJS, PostgreSQL, Prisma, Redis, Socket.io.
- **AI**: OpenAI GPT-4o for financial reasoning.
- **Data**: Angel One SmartAPI.

## Getting Started

### Prerequisites
- Node.js v18+
- Docker & Docker Compose
- Angel One SmartAPI credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Root
   npm install
   
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. Setup environment variables:
   Copy `.env.example` to `backend/.env` and `frontend/.env.local`.

4. Start Infrastructure:
   ```bash
   docker-compose up -d
   ```

5. Run Migrations:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

6. Start Development Servers:
   ```bash
   # Backend
   npm run start:dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

## License
MIT
