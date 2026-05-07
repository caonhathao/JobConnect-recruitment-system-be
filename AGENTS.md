# AGENTS.md - JobConnect Recruitment System Backend

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload via nodemon)
npm run dev

# Run in production mode
npm start

# Database commands
npm run db:push          # Push Prisma schema changes to database
npm run db:migrate       # Run Prisma migrations
npm run generate         # Generate Prisma client (output: prisma/src/generated/)
npm run studio            # Open Prisma Studio on port 8888

# Testing (Jest + Supertest)
npm test                  # Run all integration tests in tests/integration/

# Run a single test file:
npx jest tests/integration/auth.test.js

# Run tests matching a pattern:
npx jest --testNamePattern="login"
```

## Code Style Guidelines

### Language & Imports
- **JavaScript** (CommonJS) using `require()` / `module.exports`
- No TypeScript in source files (despite `tsconfig.json` existing for tooling support)
- Group imports in order: Node built-ins → npm packages → local modules
- Use relative paths for local imports: `require('../services/authService')`
- Example:
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ROLES = require('../constants/roles');
```

### Naming Conventions
- **Files**: camelCase with some inconsistencies allowed (e.g., `authController.js`, `ResumeService.js`, `candidate_Routes.js`)
- **Variables/functions**: camelCase (`fullName`, `accessToken`, `matchPassword`)
- **Database columns**: snake_case in Prisma schema (`full_name`, `avatar_url`, `created_at`)
- **Constants**: UPPER_SNAKE_CASE (`ROLES` in `src/constants/roles.js`)
- **Models/Classes**: PascalCase (`User`, `Company`, `Candidate_profile`)
- **Routes**: Use `[resource]_Routes.js` or `[resource]Routes.js` pattern

### Architecture Pattern
Follow the **Controller-Service-Model** layered architecture:
- `src/controllers/` - HTTP request handlers, extract input from req.body/params, format responses
- `src/services/` - Business logic, input validation, database operations
- `prisma/schema/` - Prisma schema files for database schema management (multi-file structure)
- `src/routes/` - Express route definitions with middleware chains
- `src/middleware/` - Auth (`protect`, `authorize`), upload handlers, request processing
- `src/config/` - Database config, multer configs
- `src/utils/` - Token utilities (`generateToken`), helpers
- `src/constants/` - Role definitions (`CANDIDATE`, `RECRUITER`, `ADMIN`), enums

### ORM Setup (Prisma Primary)
- **Prisma** is the primary ORM for all runtime database operations
- Schema files in `prisma/schema/` (multi-file structure: `auth.prisma`, `job.prisma`, `candidate.prisma`, `company.prisma`, `rag.prisma`)
- `prisma/schema/schema.prisma` is the root file that includes others
- Generated Prisma client outputs to `prisma/src/generated/`
- Model definitions in Prisma: `String @id @default(uuid())` for UUID primary keys
- Timestamps mapping: `@map("created_at")` in Prisma schema to snake_case DB columns
- Code uses camelCase for all Prisma queries: `prisma.user.findMany({ where: { fullName: ... } })`
- Sequelize models may exist in `src/models/` but Prisma is used for all current operations

### Error Handling
- Use try-catch blocks in controllers and services
- Throw errors with Vietnamese messages: `throw new Error('Email đã được sử dụng')`
- Return appropriate HTTP status codes:
  - `400` for validation errors
  - `401` for authentication failures
  - `403` for authorization failures
  - `404` for not found
  - `500` for server errors
- Controller pattern:
```javascript
try {
    const result = await service.method(data);
    return res.status(200).json({ status: 'success', data: result });
} catch (error) {
    console.error(error);
    if (error.message === 'Specific error') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi server', error: error.message });
}
```

### Validation
- Input validation in **service layer** (not controllers)
- Use regex patterns for format validation (email, phone, etc.)
- Prisma model validations for schema-level checks
- Trim inputs: `data.email?.trim()`
- Check for empty strings and null values before processing
- **Current standard**: All API fields use **camelCase** (`fullName`, `jobId`, `salaryMin`, `jobType`, `dateOfBirth`)

### Response Format
```javascript
// Success
res.status(200).json({ status: 'success', data: result })

// Error
res.status(400).json({ message: 'Error message' })

// List responses
res.status(200).json({ status: 'success', data: items, total: count })
```

### Authentication & Authorization
- JWT-based with access/refresh token pattern
- Tokens stored in database (`refreshToken` field in users table)
- Auth middleware: `protect` (verify JWT) and `authorize` (check roles)
- Roles defined in `src/constants/roles.js`: `CANDIDATE`, `RECRUITER`, `ADMIN`
- Role-based access: `router.post('/jobs', protect, authorize('RECRUITER'), createJob)`

### Environment & Security
- Use `dotenv` for environment variables (load in `server.js`)
- Never commit `.env` files - check `.gitignore`
- Password hashing with `bcryptjs` (salt: 10 rounds)
- Helmet for security headers, CORS enabled, rate limiting with `express-rate-limit`
- Static file serving: `app.use('/uploads', express.static(...))`

### File Uploads
- `multer` for handling multipart/form-data
- Configs in `src/config/multer.js` with destination and filename logic
- Middleware in `src/middleware/` (`uploadAvatar.js`, `uploadResumes.js`, `logoCompany.js`)
- Image processing with `sharp` for resizing/optimization
- Store files in `uploads/` directory with organized subfolders

### Linting & Quality Tools
- No ESLint, Prettier, or other linting/formatting tools configured
- Agents must manually maintain code consistency with existing patterns
- Avoid introducing new formatting conventions not present in current codebase
- No TypeScript linting rules (tsconfig.json exists only for editor tooling support)

### Notes for Agents
- Server entry point: `server.js` (not `src/index.js`)
- No linting or formatting tools configured (no ESLint/Prettier) - maintain consistency manually
- Comments in codebase are bilingual (Vietnamese and English) - follow this pattern
- When adding new features, follow existing controller-service-model pattern
- **CamelCase Standard**: All API request/response fields use camelCase (updated 2026-05)
- **Vector Search**: Current APIs use traditional string-matching; RAG/vector features will have dedicated endpoints later
- **Ghost APIs Removed**: Endpoints not in `API.md` have been removed from routes (2026-05)
- No Cursor rules (`.cursorrules`, `.cursor/rules/`) or GitHub Copilot rules (`.github/copilot-instructions.md`) exist in this repository
