# JobConnect Final Validation Report — Demo Readiness Audit

**Author:** Lead QA Engineer & RAG Specialist  
**Date:** 2026-05-12  
**Type:** Pre-Demo Final Re-Audit

---

## 1. TYPE CONVERSION CHECK — 🟡 YELLOW

### 1.1 `embedding::text` → `JSON.parse` → `cosineSimilarity`

**Line 531-534** (`_getRelevantResumeChunks`):
```javascript
const vecA =
  typeof chunk.embedding === "string"
    ? JSON.parse(chunk.embedding)
    : chunk.embedding;
```
✅ Correct. The `typeof` guard handles both `::text` strings and potential native array returns.

**Line 555-582** (`cosineSimilarity`):
```javascript
if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) return 0;
// ...
const valA = Number(vecA[i]);
const valB = Number(vecB[i]);
```
✅ Correct. Array validation + numeric coercion prevent NaN.

### 1.2 🔴 Line 398 — Double-Bracket Bug (PARTIALLY FIXED)

```javascript
// jobChat.services.js:398
const resumeEmbeddings = vectors.map((v) => `[${v.embedding}]`);
```

**Problem:** `v.embedding` is already a string from `SELECT embedding::text` (line 382), which includes brackets: `"[0.1,0.2,...,0.384]"`. Wrapping in `[${...}]` produces `"[[0.1,0.2,...,0.384]]"` — double brackets. When passed to `unnest(${resumeEmbeddings}::vector[])`, pgvector cannot parse `[[0.1,...]]` as a valid vector → **PostgreSQL runtime error**.

**Previous bug (`.join(",")` crash) was fixed, but a new wrapping bug was introduced.**

**Fix:**
```javascript
const resumeEmbeddings = vectors.map((v) => v.embedding);
```

### 1.3 Line 224 — Dead Code (No-Op)

```javascript
// jobChat.services.js:223-225
const jobParsedEmbeddings = jobVectors.map((jv) =>
  JSON.parse(jv.embedding.replace("[", "[").replace("]", "]")),
);
```

`.replace("[", "[")` replaces `[` with `[` — a no-op. The `JSON.parse(jv.embedding)` would work identically. Harmless but suggests confusion about the data format. 🟡

---

## 2. LOGIC & TYPO SCRUB — 🟡 YELLOW

### 2.1 `location` Typo — ✅ FIXED

Previous `job.locaion` (line 429 in old report) is now `job.location` at line 429. Verified correct.

### 2.2 `salaryMin` / `salaryMax` — ✅ CORRECT

SQL aliases (`salaryMin`, `salaryMax` at line 401) match cleanResults references (line 428). Zero mismatch risk.

### 2.3 `DISTINCT ON (j.id)` — ✅ CORRECT, REDUNDANT

```sql
SELECT DISTINCT ON (j.id) 
  ...
  jv.similarity
FROM jobs j
CROSS JOIN LATERAL (
  SELECT MAX(1 - (jv.embedding <=> rv.embedding)) AS similarity
  ...
) jv ON true
...
ORDER BY j.id, jv.similarity DESC
```

The `MAX()` aggregate inside `CROSS JOIN LATERAL` already returns exactly **1 row per job**. `DISTINCT ON` is redundant but structurally correct — `ORDER BY j.id, jv.similarity DESC` satisfies the requirement that `DISTINCT ON` columns are the leftmost in `ORDER BY`.

### 2.4 Duplicate Column in SELECT — 🟡 MINOR

Lines 402-403:
```sql
j.location, j.description, j.job_type,
j.location, j.job_level, 
```

`j.location` appears twice. Harmless for correctness but sloppy.

### 2.5 `_handleGeeting` — 🟡 TYPO IN FUNCTION NAME

Line 507: `_handleGeeting` should be `_handleGreeting`. Not user-facing, but unprofessional for a demo code review.

---

## 3. BACKGROUND TASK SAFETY — 🔴 RED

### 3.1 `setImmediate` `throw err` — ✅ FIXED

**Previous:** `throw err` at line 49 would crash Node.js on API failure.  
**Current:** `console.error(...)` at line 41-44. **Fix confirmed.** ✅

### 3.2 🔴 Scheduler `isRuning` Lock — NEVER RESET

**File:** `src/scheduler/vectorRetry.scheduler.js:24-26`

```javascript
scheduledTask = cron.schedule("*/30 * * * *", async () => {
  if (isRuning) return;
  isRuning = true;
  // ... processing ...
  // NO finally block
});

// Line 94 — runs ONCE after setup, NOT after each cron execution
isRuning = false;
```

**Impact:** After first execution, `isRuning` stays `true`. All subsequent 30-min ticks bail out immediately. **Cron runs exactly once.**

**Fix:**
```javascript
scheduledTask = cron.schedule("*/30 * * * *", async () => {
  if (isRuning) return;
  isRuning = true;
  try {
    // ... existing processing ...
  } finally {
    isRuning = false;
  }
});
```

### 3.3 🔴 Silent Skip Path — Infinite Retry Loop

**File:** `src/services/jobVector.services.js:110-115`

```javascript
if (!cleanedText) {
  console.warn(`Job ${job.id} has insufficient content after cleaning. Skipping vectorization.`);
  return;  // ← Returns WITHOUT setting FAILED status
}
```

**Impact:** Job stays `PENDING`. Cron picks it up every 30 minutes. Forever. Same issue exists in `resumeVector.services.js:76-81`.

**Fix (both files):**
```javascript
if (!cleanedText) {
  await prisma.job.update({
    where: { id: job.id },
    data: { vectorStatus: "FAILED" },
  });
  return;
}
```

### 3.4 Scheduler Resume Batch — Missing `take: 5`

**File:** `src/scheduler/vectorRetry.scheduler.js:62-71`

```javascript
const incompleteResumes = await prisma.resume.findMany({
  where: {
    OR: [{ vectorStatus: "PENDING" }, { vectorStatus: "FAILED" }],
  },
  // No take: 5 limit! ← Could process unlimited resumes at once
});
```

🟡 Low risk for demo data, but inconsistent with the jobs query (which has `take: 5` at line 37).

---

## 4. ENTITY MATCHING — 🟢 GREEN

### 4.1 `contains` + `insensitive` Logic

**File:** `src/services/jobChat.services.js:108-111`, `141-143`, `202-204`

```javascript
OR: entities.map((name) => ({
  title: { contains: name, mode: "insensitive" },
})),
```

| Scenario | Match Behavior | Demo Verdict |
|---|---|---|
| User types "react" | Matches "React Developer", "React Native", "Senior React Engineer" | ✅ |
| User types "React" | Case-insensitive — same as "react" | ✅ |
| User types "FPT" | Matches "FPT Software", "FPT Shop" | ✅ |
| User types "ReactJS" | Matches "ReactJS Developer", **NOT** "React Developer" (substring limitation) | ⚠️ Edge case |

**Limitation:** `contains` is substring-based. "React" matches all React titles, but "ReactJS" does NOT match "React Developer" (the reverse substring doesn't hold). For demo scenarios where entity extraction is clean (e.g., "React" not "ReactJS"), this works reliably.

---

## 5. UI DATA COMPLETENESS — 🟡 YELLOW

### 5.1 Group 2 (CV Search) SQL — ✅ FETCHED

Lines 404-406 in SQL:
```sql
c.name as "companyName", 
c.address as "companyAddress", 
c.city as "companyCity",
```

Both `companyAddress` and `companyCity` are present. No `undefined` crash risk. ✅

### 5.2 Group 1 (Job Search) — Same ✅

Lines 314-315:
```sql
c.address as "companyAddress",
c.city as "companyCity",
```

### 5.3 🔴 Missing Null Guard on `companyCity`

**Line 339** (Group 1 cleanResults):
```javascript
"Địa điểm": `${job.companyAddress ?? ""}, ${job.companyCity}`,
```

**Line 430** (Group 2 cleanResults):
```javascript
"Địa chỉ": `${job.companyAddress ?? ""}, ${job.companyCity}`,
```

`job.companyCity` has no `?? ""` fallback. If `c.city` is NULL in the database (which is allowed), the output becomes `"SomeAddress, null"` or `"SomeAddress, undefined"`.

**Fix:**
```javascript
"Địa điểm": `${job.companyAddress ?? ""}, ${job.companyCity ?? ""}`,
```

---

## 6. SUMMARY OF ALL FINDINGS

### 🔴 CRITICAL (Must Fix Before Demo)

| # | File:Line | Issue | Risk |
|---|---|---|---|
| **1** | `jobChat.services.js:398` | Double brackets: `[${v.embedding}]` → `[[0.1,...]]` instead of `[0.1,...]`. PostgreSQL will reject `[[0.1,...]]::vector`. **Group 2 (CV search) is broken.** | **Crash** |
| **2** | `vectorRetry.scheduler.js:24-26` | `isRuning` never reset in `finally` — cron runs **once only**. Background retry is dead. | **Silent failure** |
| **3** | `jobVector.services.js:110-115` | `cleanedText` returns null → early return without `FAILED` status → infinite retry every 30 min | **Resource leak** |
| **4** | `resumeVector.services.js:76-81` | Same silent skip path for resumes | **Resource leak** |

### 🟡 HIGH PRIORITY

| # | File:Line | Issue |
|---|---|---|
| 5 | `jobChat.services.js:339,430` | `job.companyCity` missing `?? ""` null guard |
| 6 | `vectorRetry.scheduler.js:62-71` | Resume batch missing `take: 5` limit |
| 7 | `jobChat.services.js:223-225` | `jv.embedding.replace("[", "[")` — dead code no-op |
| 8 | `jobChat.services.js:402-403` | Duplicate `j.location` in SELECT |
| 9 | `jobChat.services.js:507` | `_handleGeeting` typo |

### 🟢 PREVIOUSLY FIXED & VERIFIED

| Issue | Status |
|---|---|
| `v.embedding.join(",")` crash (line 398, old) | ✅ `.join()` removed, though double-bracket bug introduced |
| `job.locaion` typo → `job.location` | ✅ Fixed at line 429 |
| `throw err` in `setImmediate` → process crash | ✅ Fixed to `console.error` at line 41 |
| `JSON.parse` guard in `_getRelevantResumeChunks` | ✅ typeof-guard at line 531-534 |
| `cosineSimilarity` array validation + Number() coercion | ✅ Lines 555-582 |
| `!isNaN(c.score)` filter in chunk selection | ✅ Line 543 |
| Scheduler `job.userId` pass to `processAndStoreResumeVector` | ✅ Line 79 |
| HNSW indexes | ⚠️ Still dropped in migration, needs recreation |

---

## 7. DEMO READINESS SCORE

### Raw Scoring

| Category | Weight | Score | Weighted |
|---|---|---|---|
| 1. Type Conversion | 25% | 70% (1 red: double brackets) | 17.5 |
| 2. Logic & Typo Scrub | 20% | 85% (minor cosmetics) | 17.0 |
| 3. Background Task Safety | 25% | 30% (2 reds: cron lock + infinite retry) | 7.5 |
| 4. Entity Matching | 15% | 95% (works for demo scenarios) | 14.25 |
| 5. UI Data Completeness | 15% | 80% (missing null guards) | 12.0 |

### Final Score: **68%** — ⚠️ CONDITIONAL PASS

### Critical Path Analysis

| Flow | Impact of Open Bugs | Demo Risk |
|---|---|---|
| **Group 1** (Job Search) | Clean — no reds. `companyCity` null guard missing but data-dependent. | 🟢 Low |
| **Group 2** (CV Search) | **CRITICAL** — Line 398 double brackets crash PostgreSQL. **This flow will fail.** | 🔴 **Guaranteed crash** |
| **Group 3** (CV_VS_JOB) | Clean — JSON.parse guard works, cosineSimilarity safe. | 🟢 Low |
| **Background Upload** | Clean — `throw err` fixed to `console.error`. | 🟢 Low |
| **Scheduler Retry** | Cron runs once only. Silent skip creates infinite loops. | 🟡 Medium |

### Pre-Demo Quick Fixes (3-5 minutes)

```bash
# 1. Fix double brackets — change line 398
# OLD: vectors.map((v) => `[${v.embedding}]`)
# NEW: vectors.map((v) => v.embedding)

# 2. Add finally block to cron — around line 24-89
# Wrap try/catch contents in try/finally with isRuning = false

# 3. Add FAILED status on silent skip — jobVector.services.js:113
# await prisma.job.update({ where: { id: job.id }, data: { vectorStatus: "FAILED" } })

# 4. Same for resumeVector.services.js:79

# 5. Add null guard on companyCity — lines 339, 430
# ${job.companyCity ?? ""}
```

After these fixes, the score rises to **~90%**. The only remaining issue would be the dropped HNSW indexes, which don't affect demo performance with small datasets.
