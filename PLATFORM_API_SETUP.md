# Platform NCP API Setup & Migration Strategy

## Overview

This document explains the setup to ensure only the new Platform NCP APIs are used, preventing confusion and bugs from mixing old and new API flows.

## What Was Done

### 1. Separated Platform APIs into Dedicated File

**File**: `src/lib/platform-api.ts`

- Contains all Platform NCP API functions and types
- Clear documentation and comments
- Follows the NCP workflow: Client → Intake → Assessment → Diagnosis → MNT → Targets → Ayurveda → Plan

### 2. Added Deprecation Warnings to Legacy APIs

**File**: `src/lib/api.ts`

- All legacy APIs (`clientApi`, `healthProfileApi`, `dietPlanApi`, `comprehensiveHealthProfileApi`) now show deprecation warnings
- Warnings appear in console when deprecated APIs are used
- TypeScript `@deprecated` JSDoc tags added for IDE warnings

### 3. Created Configuration System

**File**: `src/lib/config.ts`

- `PLATFORM_ONLY_MODE`: When `true`, deprecated APIs throw errors instead of warnings
- `SHOW_DEPRECATION_WARNINGS`: Controls whether warnings are shown in console

### 4. Created Migration Guide

**File**: `MIGRATION_GUIDE.md`

- Complete migration instructions
- Code examples for each API migration
- Checklist for migration steps

## How to Enforce Platform-Only Mode

### Option 1: Enable Platform-Only Mode (Recommended for New Projects)

Edit `src/lib/config.ts`:

```typescript
export const PLATFORM_ONLY_MODE = true;  // Change to true
```

When enabled:
- Legacy APIs will throw errors immediately
- Forces developers to use Platform APIs
- Prevents accidental use of old APIs

### Option 2: Gradual Migration (Recommended for Existing Projects)

Keep `PLATFORM_ONLY_MODE = false` but:
- Show deprecation warnings (`SHOW_DEPRECATION_WARNINGS = true`)
- Gradually migrate components to Platform APIs
- Use warnings to identify where old APIs are still used

## Usage Examples

### ✅ Correct: Using Platform APIs

```typescript
import {
  platformClientApi,
  platformIntakeApi,
  platformAssessmentApi,
  platformPlanApi
} from '@/lib/platform-api';

// Create client
const client = await platformClientApi.create({
  name: "John Doe",
  age: 30,
  gender: "male"
});

// Create intake
const intake = await platformIntakeApi.create({
  client_id: client.id,
  raw_input: { /* ... */ }
});

// Create assessment
const assessment = await platformAssessmentApi.create({
  client_id: client.id,
  intake_id: intake.id,
  assessment_snapshot: { /* ... */ }
});

// Generate plan
const plan = await platformPlanApi.generate({
  client_id: client.id,
  assessment_id: assessment.id
});
```

### ❌ Incorrect: Using Legacy APIs (Deprecated)

```typescript
import { clientApi, dietPlanApi } from '@/lib/api';

// This will show deprecation warnings
const client = await clientApi.create({ /* ... */ });
const plan = await dietPlanApi.generate({ /* ... */ });
```

## Finding Old API Usage

### Using TypeScript/IDE

Most IDEs will show deprecation warnings when you hover over deprecated APIs.

### Using Console Warnings

When `SHOW_DEPRECATION_WARNINGS = true`, console warnings appear:
```
⚠️ DEPRECATED: clientApi.create is deprecated and will be removed in a future version. 
Please migrate to platformClientApi.create from '@/lib/platform-api'. 
See MIGRATION_GUIDE.md for migration instructions.
```

### Using Search

Search for deprecated API imports:
```bash
# Find files using old APIs
grep -r "from '@/lib/api'" src/ --include="*.ts" --include="*.tsx" | grep -E "(clientApi|healthProfileApi|dietPlanApi|comprehensiveHealthProfileApi)"
```

## Migration Checklist

- [ ] Set `PLATFORM_ONLY_MODE = false` initially (for gradual migration)
- [ ] Set `SHOW_DEPRECATION_WARNINGS = true` to see warnings
- [ ] Review `MIGRATION_GUIDE.md` for migration steps
- [ ] Migrate components one by one:
  - [ ] Update imports to use `platform-api.ts`
  - [ ] Update API calls to use Platform APIs
  - [ ] Update data structures (numeric IDs → UUIDs)
  - [ ] Test each migrated component
- [ ] Once all components migrated, set `PLATFORM_ONLY_MODE = true`
- [ ] Remove legacy API code from `api.ts` (future step)

## Benefits

1. **Clear Separation**: Platform APIs are in their own file, making it obvious which APIs to use
2. **Type Safety**: TypeScript types prevent mixing old and new data structures
3. **Runtime Warnings**: Console warnings help identify old API usage during development
4. **Enforcement**: Platform-only mode prevents accidental use of deprecated APIs
5. **Documentation**: Migration guide provides clear instructions

## Next Steps

1. **For New Features**: Always use Platform APIs from `platform-api.ts`
2. **For Existing Features**: Migrate gradually using the migration guide
3. **Before Production**: Set `PLATFORM_ONLY_MODE = true` to ensure no legacy APIs are used

## Questions?

- See `MIGRATION_GUIDE.md` for detailed migration instructions
- Check `src/lib/platform-api.ts` for API documentation
- Review backend API docs at `/docs` endpoint

