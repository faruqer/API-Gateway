<div align="center">

# ⚡ API Gateway

### A production-grade Node.js gateway that unifies multiple third-party APIs behind a single authenticated, cached, and rate-limited endpoint.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Redis](https://img.shields.io/badge/Redis-Caching-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## What is this?

Most applications that consume multiple third-party APIs end up with scattered integration logic, duplicated auth handling, inconsistent error formats, and no caching strategy. This project solves that by introducing a **single gateway layer** that every client talks to — regardless of which upstream provider it needs.

Clients send one authenticated request. The gateway handles auth validation, rate limiting, cache lookup, upstream forwarding, response logging, and error normalisation — then returns a consistent JSON response. Upstream API details are completely hidden from the client.

---

## Architecture

```
                         ┌─────────────────────────────────────────────────────┐
                         │                    API Gateway                      │
                         │                                                     │
  React Frontend  ──────▶│  Auth MW  ──▶  Rate Limiter  ──▶  Cache (Redis)   │
  (or any client)        │                                        │            │
                         │                                        ▼            │
                         │                                    Router           │
                         │                               ┌──────┼──────┐      │
                         │                               ▼      ▼      ▼      │
                         │                           Weather  News  Crypto    │
                         │                           Service  Svc   Service   │
                         │                               │      │      │      │
                         └───────────────────────────────┼──────┼──────┼──────┘
                                                         ▼      ▼      ▼
                                                    OpenWX  NewsAPI CoinGecko
                                                    
                         ┌─────────────┐    ┌──────────────┐    ┌────────────┐
                         │   SQLite    │    │    Redis     │    │  Winston   │
                         │  API keys  │    │  Response    │    │  Logging   │
                         │  Req logs  │    │  Cache TTL   │    │  + Morgan  │
                         └─────────────┘    └──────────────┘    └────────────┘
```

### Why this architecture?

**Middleware pipeline** — Auth, rate limiting, and caching are implemented as Express middleware in a deliberate order. Auth runs first so unauthenticated requests never touch the rate limiter or cache. The rate limiter runs second to reject over-quota requests before any expensive operations. The cache runs last in the pipeline — a hit returns immediately without invoking any service logic.

**Dual authentication** — API keys are the long-lived credentials stored in SQLite. They are used to generate short-lived JWTs, which are what clients actually send on every request. This means raw API keys are never transmitted repeatedly, and token expiry provides a natural revocation window without invalidating the underlying key.

**SQLite for key management and logging** — API key storage and request logging are write-light, read-light workloads that don't benefit from the operational complexity of a full RDBMS. SQLite runs in-process, has zero network latency, and its file-based nature makes it trivial to inspect and back up. The tradeoff (no horizontal write scaling) is irrelevant for this use case.

**Redis as an optional dependency** — the cache layer checks for Redis availability at startup. If Redis is unreachable, the gateway continues serving all requests without caching. This means Redis failure never causes gateway downtime — it only degrades cache performance. Upstream APIs absorb the extra load, which is the correct graceful degradation behaviour.

**Service layer isolation** — each upstream integration (weather, news, crypto) lives in its own service module. Routes don't call Axios directly. This means changing a provider (e.g. swapping NewsAPI for a different news source) requires touching exactly one file and nothing else.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js 18+ | Native fetch, stable ESM, long-term support |
| Framework | Express 4 | Minimal, composable, widely understood middleware model |
| Database | SQLite via `better-sqlite3` | Zero-config, in-process, synchronous API suits low-concurrency admin ops |
| Caching | Redis via `ioredis` | Sub-millisecond TTL-based cache, optional with auto-fallback |
| Auth | `jsonwebtoken` | Stateless JWT — no session store needed for protected routes |
| HTTP client | Axios | Interceptors, timeout config, consistent error shape across providers |
| Logging | Winston + Morgan | Structured JSON logs (Winston) + per-request HTTP logs (Morgan) |
| Frontend | React | Interactive live API explorer with real-time request tracing |

---

## Project Structure

```
api-gateway/
├── frontend/                   # React frontend (interactive demo UI)
├── src/
│   ├── config/
│   │   └── index.js            # Centralised env config with validation
│   ├── db/
│   │   ├── database.js         # SQLite initialisation, table creation
│   │   ├── repositories.js     # All DB queries (createApiKey, logRequest, etc.)
│   │   └── seed.js             # Seeds initial API keys on first run
│   ├── middleware/
│   │   ├── auth.js             # JWT verification + API key lookup
│   │   ├── cache.js            # Redis get/set with TTL, graceful miss handling
│   │   ├── rateLimiter.js      # Per-key sliding window rate limiting
│   │   └── requestLogger.js    # Writes each request to SQLite via repository
│   ├── routes/
│   │   ├── auth.js             # POST /auth/token, POST|GET /auth/keys, GET /auth/logs
│   │   ├── weather.js          # GET /weather
│   │   ├── news.js             # GET /news
│   │   ├── crypto.js           # GET /crypto
│   │   └── dashboard.js        # GET /dashboard (aggregation via Promise.all)
│   ├── services/
│   │   ├── weatherService.js   # OpenWeatherMap integration
│   │   ├── newsService.js      # NewsAPI integration
│   │   └── cryptoService.js    # CoinGecko integration
│   ├── utils/
│   │   └── logger.js           # Winston instance (file + console transports)
│   └── server.js               # Express app bootstrap, middleware registration
├── .env.example
├── gateway.db                  # SQLite database file (auto-created)
├── package.json
└── README.md
```

---

## API Reference

### Public

```
GET /health
```
Returns gateway status and uptime. No authentication required.

---

### Authentication

```
POST /auth/token
Content-Type: application/json

{ "apiKey": "your-api-key" }
```
Returns a signed JWT valid for subsequent requests.

```
POST /auth/keys          # Create a new API key (admin)
GET  /auth/keys          # List all API keys (admin)
GET  /auth/logs          # View all request logs (admin)
```

---

### Protected Endpoints

All requests below require:
```
Authorization: Bearer <jwt>
```

```
GET /weather?city=London
GET /news?topic=technology
GET /crypto?symbol=BTC
GET /dashboard?city=London&topic=technology&crypto=BTC
```

The `/dashboard` endpoint fires all three upstream requests in parallel using `Promise.all` and returns a unified response — one round-trip instead of three.

---

### Example: full flow with curl

```bash
# 1. Get a token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"your-key-here"}' | jq -r '.token')

# 2. Call a protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/dashboard?city=London&crypto=BTC&topic=technology"
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Redis (optional — caching auto-disables if unavailable)
- An [OpenWeatherMap](https://openweathermap.org/api) API key
- A [NewsAPI](https://newsapi.org) API key

### Installation

```bash
git clone https://github.com/faruqer/api-gateway.git
cd api-gateway
npm install
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3000
NODE_ENV=development

JWT_SECRET=your-super-secret-jwt-key-change-me

OPENWEATHERMAP_API_KEY=your_key_here
NEWSAPI_API_KEY=your_key_here

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

CACHE_TTL_WEATHER=300
CACHE_TTL_NEWS=300
CACHE_TTL_CRYPTO=60
```

### Run

```bash
# Seed the database with an initial API key
npm run seed

# Start with hot reload
npm run dev

# Or production start
npm start
```

Gateway runs at `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Key Design Decisions

**Why not use an existing API gateway (Kong, AWS API Gateway, etc.)?**
Those tools are operationally heavy for a project of this scope. Building it from scratch demonstrates understanding of what gateways actually do — auth pipelines, cache strategies, rate limiting algorithms — rather than just configuration.

**Why synchronous `better-sqlite3` instead of an async driver?**
API key lookups and request logging are low-frequency, low-contention operations. The synchronous API is simpler, avoids promise chains in middleware, and performs identically to async drivers at this concurrency level. For a high-throughput multi-instance deployment, migrating to `pg` (PostgreSQL) with a connection pool would be the natural next step.

**Why two auth layers (API key + JWT)?**
API keys alone require a DB lookup on every request. JWTs are stateless and verifiable without I/O. The two-layer design means the hot path (JWT verification) has zero DB cost, while the cold path (key-to-token exchange) pays the SQLite lookup once per session.

---

## Author

Built by [@faruqer](https://github.com/faruqer)

---

## License

MIT
