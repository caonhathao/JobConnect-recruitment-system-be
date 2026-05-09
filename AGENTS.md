# AGENTS.md - JobConnect Recruitment System Backend

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev mode with nodemon auto-reload
npm start            # Production mode (node server.js)
npm run seed         # Seed database (node prisma/seed.js)

# Database (Prisma)
npm run db:push      # Push schema to DB
npm run db:migrate   # Run migrations
npm run generate     # Generate Prisma client (output: prisma/src/generated/)
npm run studio       # Open Prisma Studio on port 8888

# Testing
npm test                               # All integration tests (tests/integration/)
npx jest tests/integration/auth.test.js # Single test file
npx jest --testNamePattern="login"     # Tests matching pattern
```

## Code Style Guidelines

### Language & Imports
- **JavaScript** (CommonJS) — `require()` / `module.exports`
- No TypeScript in source (tsconfig.json exists only for editor tooling)
- No ESM import/export syntax in runtime code
- Import order: Node built-ins → npm packages → local modules
- Relative paths for local imports: `require('../services/authService')`
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ROLES = require('../constants/roles');
```

### Naming Conventions
- **Files**: camelCase (some inconsistency allowed: `authController.js`, `ResumeService.js`, `candidate_Routes.js`)
- **Variables/functions**: camelCase (`fullName`, `accessToken`, `matchPassword`)
- **Database columns**: snake_case in Prisma schema (`full_name`, `avatar_url`, `created_at`)
- **Constants**: UPPER_SNAKE_CASE (`ROLES` in `src/constants/roles.js`)
- **Models/Classes**: PascalCase (`User`, `Company`, `Candidate_profile`)
- **Routes**: `[resource]_Routes.js` or `[resource]Routes.js` pattern
- **Controllers/services**: `[resource]Controller.js` / `[resource]Service.js` (PascalCase resource prefix common)

### Architecture Pattern
**Controller-Service** layered architecture (no model layer — Prisma is the ORM):
- `src/controllers/` — HTTP handlers, extract input from req, format responses
- `src/services/` — Business logic, validation, DB operations via Prisma
- `src/routes/` — Express route definitions with middleware chains
- `src/middleware/` — Auth (`protect`, `authorize`), file upload handlers
- `src/config/` — Prisma client init, multer configs
- `src/utils/` — Token utils (`generateAccessToken`, `generateRefreshToken`, `verifyRefreshToken`), text preprocessing
- `src/constants/` — Role definitions (`CANDIDATE`, `RECRUITER`, `ADMIN`), enums
- `src/scheduler/` — Cron jobs via `node-cron` (e.g., `jobVectorRetry.js`)
- `src/lib/models/` — Legacy Sequelize models (not actively used)

### Prisma ORM
- Primary ORM for all runtime DB operations
- Schema: `prisma/schema/schema.prisma` (root) + includes: `auth.prisma`, `job.prisma`, `candidate.prisma`, `company.prisma`, `rag.prisma`, `chats.prisma`, `other.prisma`
- Client: `prisma/src/generated/` (output of `npm run generate`)
- Connection: `src/config/prisma.js` uses `@prisma/adapter-pg` with `pg` Pool (global singleton in dev)
- UUID primary keys: `String @id @default(uuid())`
- Timestamps mapped to snake_case: `@map("created_at")`
- Prisma queries use camelCase: `prisma.user.findMany({ where: { fullName: ... } })`
- Transactions: `prisma.$transaction(async (tx) => { ... })`

### Error Handling
- try-catch in controllers + services
- Errors thrown with **Vietnamese messages**: `throw new Error('Email đã được sử dụng')`
- Controller maps error.message to status codes:
  - `400` — validation/user errors
  - `401` — auth failures
  - `403` — forbidden/refresh token invalid
  - `404` — not found
  - `500` — server errors
- Array-based error matching pattern (controllers match known error messages):
```javascript
catch (error) {
    const clientErrors = ['Email đã được sử dụng', 'Số điện thoại đã được sử dụng'];
    if (clientErrors.includes(error.message)) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
}
```

### Response Format
```javascript
// Success
res.status(200).json({ status: 'success', data: result })
// Error
res.status(400).json({ message: 'Error message' })
// List
res.status(200).json({ status: 'success', data: items, total: count })
```

### Input Validation
- In **service layer** (not controllers)
- Regex validation (email: `/^[a-zA-Z0-9.]+@gmail\.com$/`, phone: `/^0\d{9}$/`, name: `/^[a-zA-ZÀ-ỹ\s]+$/`)
- Trim inputs: `data.email?.trim()`
- All API request/response fields use **camelCase** (`fullName`, `jobId`, `salaryMin`, `dateOfBirth`)

### Authentication & Authorization
- JWT access + refresh token pattern
- **Access token**: `jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '15m' })`
- **Refresh token**: stored in DB (`user.refreshToken`), `jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: '7d' })`
- Middleware: `protect` (verifies Bearer token, sets `req.user`) and `authorize('RECRUITER')` (checks role)
- Roles: `ADMIN`, `CANDIDATE`, `RECRUITER` (from `src/constants/roles.js`, also exports `ROLE_LIST` array)

### Environment & Security
- `dotenv` loaded in `server.js` and `src/config/prisma.js`
- Never commit `.env` — in `.gitignore`
- Password: `bcryptjs` with salt rounds 10
- Helmet (CORS policy: `cross-origin`), CORS enabled, morgan logging (dev)
- Rate limiting: `express-rate-limit` (installed but commented out in server.js)
- Static files: `app.use('/uploads', express.static(...))`

### File Uploads (multer + sharp)
- Configs: `src/config/multer.js` (destination/filename logic)
- Middleware: `uploadAvatar.js`, `uploadResumes.js`, `logoCompany.js`
- Image processing with `sharp` for resize/optimization
- Files stored in `src/uploads/` with organized subfolders

### Route Mounting (server.js)
```javascript
app.use('/api/auth', authRoutes);
app.use('/api/candidate', candidate_profile);
app.use('/api/employer/profile', employerRoutes);
app.use('/api/admin/companies', adminCompanyRoutes);
// ... etc
```
- Server exports `app` and `server` for test cleanup: `module.exports = app; module.exports.server = server;`
- Test files require server: `app = require('../../server');`

### Testing (Jest + Supertest)
- All tests in `tests/integration/`
- Pattern: `beforeAll` imports server, tests use `supertest(app)`, `afterAll` not typically used for cleanup
- Data-dependent tests often query DB via `prisma.user.findFirst()` for real credentials
- Seed data is populated before test runs (presumably via `npm run seed`)

### Linting & Quality
- **ESLint** configured: `eslint.config.mjs` with `@eslint/js` recommended rules (CommonJS source type)
- No npm script for linting — run manually: `npx eslint .`
- No Prettier or other formatters
- Maintain consistency manually with existing patterns
- tsconfig.json exists for editor tooling only

### Notes for Agents
- Server entry: `server.js`
- Comments bilingual (Vietnamese + English) — follow this pattern
- No Cursor rules (`.cursorrules`, `.cursor/rules/`) or Copilot rules (`.github/copilot-instructions.md`) exist
- **Ghost APIs Removed** (2026-05): Endpoints not in `API.md` removed from routes
- **Vector Search**: Current APIs use string-matching; RAG/vector features planned for dedicated endpoints
- Scheduled task: `setupVectorSchedule()` runs daily via `node-cron` for vector retry
- Scheduler code: `src/scheduler/jobVectorRetry.js`
