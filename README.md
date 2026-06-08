# API Gateway Documentation

A production-style Node.js + Express API Gateway that exposes a single entry point for multiple external APIs:
- Weather (OpenWeatherMap)
- News (NewsAPI)
- Crypto (CoinGecko)

It includes:
- Route-based API forwarding
- API Key + JWT authentication
- SQLite-backed API key management and request logging
- Redis response caching (optional but recommended)
- Rate limiting
- Aggregated dashboard endpoint
- Structured logging via Winston

---

## 1) Project Overview

This gateway lets clients call one service and get data from different providers without integrating each provider directly.

### Primary Endpoints
- `GET /weather?city=London`
- `GET /news?topic=technology`
- `GET /crypto?symbol=BTC`
- `GET /dashboard?city=London&crypto=BTC&topic=technology` (aggregation)

### Public Endpoint
- `GET /health`

### Auth & Admin Endpoints
- `POST /auth/token`
- `POST /auth/keys`
- `GET /auth/keys`
- `GET /auth/logs`

---

## 2) Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** SQLite (`better-sqlite3`)
- **Caching:** Redis (`ioredis`)
- **Auth:** API key + JWT (`jsonwebtoken`)
- **HTTP Client:** Axios
- **Logging:** Winston + Morgan

---

## 3) Project Structure

```txt
API Gateway/
├── src/
│   ├── config/
│   │   └── index.js
│   ├── db/
│   │   ├── database.js
│   │   ├── repositories.js
│   │   └── seed.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── cache.js
│   │   ├── rateLimiter.js
│   │   └── requestLogger.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── crypto.js
│   │   ├── dashboard.js
│   │   ├── news.js
│   │   └── weather.js
│   ├── services/
│   │   ├── cryptoService.js
│   │   ├── newsService.js
│   │   └── weatherService.js
│   ├── utils/
│   │   └── logger.js
│   └── server.js
├── .env
├── .env.example
├── gateway.db
├── package.json
└── README.md
```

---

## 4) Prerequisites

- Node.js 18+
- npm 9+
- Redis server (optional; without Redis, caching is auto-disabled)
- API keys:
  - OpenWeatherMap key
  - NewsAPI key

---

## 5) Environment Variables

Copy `.env.example` to `.env` and fill real values:

```env
PORT=3000
NODE_ENV=development

JWT_SECRET=your-super-secret-jwt-key-change-me

OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
NEWSAPI_API_KEY=your_newsapi_api_key

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

CACHE_TTL_WEATHER=300
CACHE_TTL_NEWS=300
CACHE_TTL_CRYPTO=60
```

---

## 6) Installation & Run

```bash
npm install
npm run seed
npm run dev
```

Alternative (without nodemon):

```bash
npm start
```

The service runs on:
- `http://localhost:3000`

---

## 7) Database (SQLite)

The gateway uses `gateway.db` with these tables:

### `api_keys`
- `id` (PK)
- `key` (unique)
- `owner`
- `active` (1/0)
- `created_at`

### `request_logs`
- `id` (PK)
- `api_key`
- `method`
- `path`
- `query`
- `status_code`
- `response_time_ms`
- `ip`
- `error`
- `created_at`

The `seed` script creates initial API keys for testing.

---

## 8) Authentication

Two supported auth modes:

### A) API Key (default)
Send header:
- `x-api-key: <your-api-key>`

### B) JWT Bearer Token
1. Exchange API key for JWT at `POST /auth/token`
2. Send header:
   - `Authorization: Bearer <token>`

### Auth Behavior
- `/health` is public
- `/auth/token` is public (requires API key in body)
- All business routes (`/weather`, `/news`, `/crypto`, `/dashboard`) require auth

---

## 9) Rate Limiting

- Default: **60 requests per minute** per API key/IP
- Configurable via:
  - `RATE_LIMIT_WINDOW_MS`
  - `RATE_LIMIT_MAX_REQUESTS`

Response headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

On limit exceeded:
- HTTP `429 Too Many Requests`
- `Retry-After` header

---

## 10) Caching (Redis)

Redis caching is route-level middleware.

Default TTLs:
- Weather: 300s
- News: 300s
- Crypto: 60s

If Redis is unavailable:
- Gateway continues normally
- Caching is disabled gracefully

---

## 11) Logging & Monitoring

### Request Logging
Every request (after auth layer) is logged to:
- SQLite `request_logs`
- Winston log files

### Log Files
- `logs/combined.log`
- `logs/error.log`

### Runtime Logs
Morgan prints concise HTTP logs in development.

---

## 12) API Reference

## 12.1 Health

### `GET /health`
Public health endpoint.

**Response 200**
```json
{
  "status": "ok",
  "uptime": 12.34
}
```

---

## 12.2 Auth

### `POST /auth/token`
Create JWT from API key.

**Request body**
```json
{
  "apiKey": "<existing-api-key>"
}
```

**Response 200**
```json
{
  "token": "<jwt>",
  "expiresIn": "24h"
}
```

**Errors**
- `400` missing `apiKey`
- `403` invalid/inactive API key

---

### `POST /auth/keys`
Create a new API key (requires auth).

Headers:
- `x-api-key` or `Authorization: Bearer ...`

**Request body**
```json
{
  "owner": "my-client-app"
}
```

**Response 201**
```json
{
  "key": "<uuid>",
  "owner": "my-client-app"
}
```

---

### `GET /auth/keys`
List API keys (requires auth).

**Response 200**
```json
{
  "keys": [
    {
      "id": 1,
      "key": "...",
      "owner": "test-user",
      "active": 1,
      "created_at": "2026-02-27 07:00:00"
    }
  ]
}
```

---

### `GET /auth/logs?limit=50`
Get recent request logs (requires auth).

**Response 200**
```json
{
  "logs": [
    {
      "id": 1,
      "api_key": "...",
      "method": "GET",
      "path": "/crypto",
      "status_code": 200,
      "response_time_ms": 120.5,
      "created_at": "2026-02-27 07:00:00"
    }
  ]
}
```

---

## 12.3 Business Endpoints

All endpoints below require authentication.

### `GET /weather?city=London`
Fetch weather from OpenWeatherMap.

**Response 200**
```json
{
  "source": "openweathermap",
  "data": {
    "city": "London",
    "country": "GB",
    "temperature": 10.2,
    "feelsLike": 8.3,
    "humidity": 71,
    "description": "light rain",
    "windSpeed": 4.5,
    "icon": "10d"
  }
}
```

---

### `GET /news?topic=technology&pageSize=5`
Fetch recent topic news from NewsAPI.

**Response 200**
```json
{
  "source": "newsapi",
  "data": {
    "topic": "technology",
    "totalResults": 123,
    "articles": [
      {
        "title": "...",
        "source": "TechCrunch",
        "url": "https://...",
        "publishedAt": "2026-02-27T06:00:00Z",
        "description": "..."
      }
    ]
  }
}
```

---

### `GET /crypto?symbol=BTC`
Fetch crypto price from CoinGecko.

**Response 200**
```json
{
  "source": "coingecko",
  "data": {
    "symbol": "BTC",
    "coinId": "bitcoin",
    "priceUsd": 67561,
    "change24h": -0.84,
    "marketCapUsd": 1350534500640.59
  }
}
```

**Errors**
- `400` missing `symbol`
- `404` symbol not found

---

### `GET /dashboard?city=London&crypto=BTC&topic=technology`
Aggregate multiple providers in one response.

Query params are optional individually, but at least one is required.

**Response 200**
```json
{
  "data": {
    "weather": { "...": "..." },
    "crypto": { "...": "..." },
    "news": { "...": "..." }
  },
  "errors": {
    "weather": "Invalid API key"
  }
}
```

Notes:
- Partial failures do not fail the whole request.
- Successful sections are returned in `data`; failed sections appear in `errors`.

---

## 13) cURL Examples

Set API key once:

```bash
export API_KEY=<your-api-key>
```

### Health
```bash
curl http://localhost:3000/health
```

### Crypto
```bash
curl -H "x-api-key: $API_KEY" "http://localhost:3000/crypto?symbol=BTC"
```

### Weather
```bash
curl -H "x-api-key: $API_KEY" "http://localhost:3000/weather?city=London"
```

### News
```bash
curl -H "x-api-key: $API_KEY" "http://localhost:3000/news?topic=technology"
```

### Dashboard
```bash
curl -H "x-api-key: $API_KEY" "http://localhost:3000/dashboard?city=London&crypto=BTC&topic=technology"
```

### Get JWT
```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"'$API_KEY'"}'
```

### JWT-authenticated call
```bash
curl -H "Authorization: Bearer <jwt>" "http://localhost:3000/crypto?symbol=ETH"
```

---

## 14) PowerShell Examples (Windows)

```powershell
$apiKey = "<your-api-key>"
Invoke-RestMethod -Uri "http://localhost:3000/crypto?symbol=BTC" -Headers @{"x-api-key"=$apiKey}
```

Get JWT and call with bearer token:

```powershell
$body = @{ apiKey = $apiKey } | ConvertTo-Json
$tokenResp = Invoke-RestMethod -Uri "http://localhost:3000/auth/token" -Method POST -ContentType "application/json" -Body $body
$token = $tokenResp.token
Invoke-RestMethod -Uri "http://localhost:3000/crypto?symbol=ETH" -Headers @{ Authorization = "Bearer $token" }
```

---

## 15) Error Handling

Common status codes:
- `400` bad input (missing query/body values)
- `401` missing auth
- `403` invalid API key
- `404` route/symbol not found
- `429` rate limit exceeded
- `5xx` upstream or internal errors

All errors are JSON with an `error` field.

---

## 16) Troubleshooting

### Redis connection refused
If you see `ECONNREFUSED 127.0.0.1:6379`, Redis is not running.
- Start Redis locally
- Or ignore for local testing (gateway still works without cache)

### Weather/News failing with API key errors
Set real keys in `.env`:
- `OPENWEATHERMAP_API_KEY`
- `NEWSAPI_API_KEY`

### 401 Unauthorized
Add one auth header:
- `x-api-key: ...`
- or `Authorization: Bearer ...`

### 429 Too Many Requests
Wait for rate-limit window reset or increase limits in `.env`.

---

## 17) Security Notes

- Rotate API keys regularly.
- Use strong `JWT_SECRET` in production.
- Put gateway behind HTTPS and reverse proxy.
- Move in-memory rate limiter to Redis for multi-instance deployments.
- Restrict admin/auth routes via role checks if needed.

---

## 18) Future Improvements

- Redis-backed distributed rate limiting
- Request validation (Joi/Zod)
- OpenAPI/Swagger docs endpoint
- Unit/integration tests
- Circuit breaker/retry policies for upstream APIs
- Role-based access control for key management

---

## 19) License

MIT
