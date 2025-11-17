# Node.js Backend Boilerplate

A professional, production-ready Node.js backend boilerplate you can clone and use immediately. Designed for fast onboarding, clear structure, and best practices (ESM, dotenv, ESLint, Prettier, testing, Docker-ready).

---

## Key features

* ✅ ES Modules (ESM) ready
* ✅ Environment configuration using `.env`
* ✅ Centralized configuration and constants
* ✅ MongoDB (Mongoose) connection helper
* ✅ Structured folder layout (controllers, routes, services, models, middlewares)
* ✅ Request validation (Joi or Zod) example
* ✅ Error handling middleware and HTTP error helper
* ✅ Logging (winston/optional) setup example
* ✅ Basic auth middleware (JWT) example
* ✅ Unit test & integration test scaffold (Jest)
* ✅ Dockerfile & `docker-compose` example
* ✅ GitHub Actions CI example (lint, test)

---

## Quick start

```bash
# clone
git clone <repo-url> my-backend
cd my-backend

# install
npm install

# copy .env.example to .env and edit
cp .env.example .env

# run in development
npm run dev

# build + start (production)
npm run build
npm start
```

---

## Prerequisites

* Node.js v18+ (v20+ recommended)
* npm or yarn
* MongoDB (Atlas or local) or any other DB configured in `src/config` (examples provided)
* Docker (optional, for containerized run)

---

## `.env.example`

```ini
# Server
PORT=4000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/myDatabase

# JWT
JWT_SECRET=change-me-to-a-strong-secret
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info

# Optional
SENTRY_DSN=
```

> If your password contains special characters, URL encode it (e.g. `@` → `%40`).

---

## Available npm scripts

```json
{
  "dev": "nodemon src/index.js",
  "start": "node dist/index.js",
  "build": "babel src -d dist --copy-files || tsc",
  "lint": "eslint . --ext .js,.mjs",
  "format": "prettier --write .",
  "test": "jest --coverage",
  "prepare": "husky install"
}
```

> Adjust build step to your toolchain (Babel/TypeScript). Boilerplate includes a sample `build` and `start` flow.

---

## Recommended folder structure

```
├── src
│   ├── config         # environment + constants
│   ├── db             # database connection, models
│   ├── controller        # feature modules (users, auth, products)
│   │   ├── users
│   │   │   ├── users.controller.js
│   │   │   ├── users.service.js
│   │   │   ├── users.routes.js
│   │   │   └── users.model.js
│   ├── middlewares    # auth, error, validation
│   ├── utils          # helpers, logger, errors
│   ├── routes.js      # main router
│   ├── app.js         # express app (no server.listen here)
│   └── index.js       # entrypoint (load env, connect db, start server)
├── test               # tests (unit & integration)
├── .env.example
├── .eslintrc
├── .prettierrc
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Best practices included

* Keep `app` and `server` separate (`app.js` vs `index.js`) to make testing easier.
* Centralize configuration in `src/config/index.js` and only read `process.env` there.
* Use structured error objects and an error handling middleware to format API errors.
* Keep controllers skinny — delegate business logic to services.
* Validate incoming requests at the route level using middleware.
* Use `async/await` with a wrapper to catch errors (or use `express-async-errors`).

---


## Contributing

* Follow branch-per-feature workflow.
* Run `npm run lint` and `npm run test` before raising a PR.
* Add unit tests for new logi
