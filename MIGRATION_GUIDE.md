# Migration Guide: Legacy APIs to Platform NCP APIs

## Overview

This guide helps you migrate from the legacy APIs to the new Platform NCP (Nutrition Care Process) APIs. The Platform NCP APIs follow a standardized workflow and provide better structure for nutrition care management.

## Why Migrate?

1. **Standardized Workflow**: Platform APIs follow the NCP workflow: Client → Intake → Assessment → Diagnosis → MNT → Targets → Ayurveda → Plan
2. **Better Data Structure**: Uses UUIDs instead of numeric IDs, better for distributed systems
3. **Separation of Concerns**: Clear separation between intake, assessment, and plan generation
4. **Future-Proof**: Legacy APIs will be removed in future versions

## Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { clientApi, healthProfileApi, dietPlanApi } from '@/lib/api';
```

**After:**
```typescript
import { 
  platformClientApi, 
  platformAssessmentApi, 
  platformPlanApi 
} from '@/lib/platform-api';
```

### 2. Client Management

#### Create Client

**Before:**
```typescript
const client = await clientApi.create({
  first_name: "John",
  last_name: "Doe",
  email: "john@example.com",
  // ... other fields
});
```

**After:**
```typescript
const client = await platformClientApi.create({
  name: "John Doe",  // Single name field instead of first_name/last_name
  age: 30,
  gender: "male",
  height_cm: 175,
  weight_kg: 70,
  location: "Mumbai",
  external_client_id: "optional-external-id"  // For integration with external systems
});
```

#### Get Client

**Before:**
```typescript
const client = await clientApi.getById(123);  // numeric ID
```

**After:**
```typescript
const client = await platformClientApi.getById("uuid-string");  // UUID string
```

#### Update Client

**Before:**
```typescript
const updated = await clientApi.update(123, { first_name: "Jane" });
```

**After:**
```typescript
const updated = await platformClientApi.update("uuid-string", { 
  name: "Jane Doe" 
});
```

### 3. Health Profile → Assessment

The old health profile APIs are replaced by the Platform Assessment workflow.

#### Old Approach (Multi-step, unstructured)
```typescript
// Create health profile
const profile = await healthProfileApi.create({
  client_id: 123,
  height: 175,
  weight: 70,
  // ... other fields
});

// Create comprehensive profile
const comprehensive = await comprehensiveHealthProfileApi.create({
  client_id: 123,
  basic_profile: { ... },
  medical_conditions: { ... },
  // ... many nested fields
});
```

#### New Approach (Structured NCP workflow)
```typescript
// Step 1: Create Intake (raw user input)
const intake = await platformIntakeApi.create({
  client_id: "client-uuid",
  raw_input: {
    labs: { HbA1c: 7.5, FBS: 140 },
    vitals: { height_cm: 175, weight_kg: 70 },
    medical_history: ["diabetes", "hypertension"],
    // ... other raw data
  },
  source: "manual"  // or "upload" or "ai_extracted"
});

// Step 2: Create Assessment (structured snapshot)
const assessment = await platformAssessmentApi.create({
  client_id: "client-uuid",
  intake_id: intake.id,  // Link to intake
  assessment_snapshot: {
    client_context: {
      age: 30,
      gender: "male",
      height_cm: 175,
      weight_kg: 70,
      activity_level: "moderately_active"
    },
    clinical_data: {
      labs: { HbA1c: 7.5, FBS: 140 },
      anthropometry: { bmi: 22.9 }
    },
    diet_data: {
      diet_history: {
        carb_intake_percent: 60,
        fiber_g: 18,
        calorie_intake: 2500
      }
    }
  }
});

// Step 3: Process through NCP pipeline
const diagnosis = await platformAssessmentApi.processDiagnosis(assessment.id);
const mnt = await platformAssessmentApi.processMNT(assessment.id);
const targets = await platformAssessmentApi.processTargets(assessment.id, "moderately_active");
const ayurveda = await platformAssessmentApi.processAyurveda(assessment.id);
```

### 4. Diet Plan Generation

#### Old Approach
```typescript
const plan = await dietPlanApi.generate({
  client_id: 123,
  duration_days: 7,
  name: "Weekly Plan",
  // ... many optional fields
});
```

#### New Approach
```typescript
// First ensure you have an assessment (see above)
// Then generate plan from assessment
const plan = await platformPlanApi.generate({
  client_id: "client-uuid",
  assessment_id: assessment.id,  // Required - links to assessment
  client_preferences: {
    meal_timing: "early_dinner",
    spice_level: "medium"
  },
  enable_ayurveda: true  // Optional, defaults to true
});
```

### 5. Get Plans

#### Old Approach
```typescript
const plans = await dietPlanApi.getByClientId(123);
const plan = await dietPlanApi.getById(456);
```

#### New Approach
```typescript
const plans = await platformPlanApi.getByClientId("client-uuid");
const plan = await platformPlanApi.getById("plan-uuid");
const activePlan = await platformPlanApi.getActivePlan("client-uuid");
```

## Key Differences

### ID Types
- **Legacy**: Numeric IDs (`number`)
- **Platform**: UUID strings (`string`)

### Client Structure
- **Legacy**: `first_name`, `last_name`, `email`, `phone`, etc.
- **Platform**: `name` (single field), `age`, `gender`, `height_cm`, `weight_kg`, `location`

### Workflow
- **Legacy**: Direct plan generation from client/profile
- **Platform**: Structured NCP workflow: Intake → Assessment → Diagnosis → MNT → Targets → Ayurveda → Plan

### Data Organization
- **Legacy**: Flat or nested structures in health profiles
- **Platform**: Structured `assessment_snapshot` with clear sections (client_context, clinical_data, diet_data)

## Complete Example: Full NCP Workflow

```typescript
import {
  platformClientApi,
  platformIntakeApi,
  platformAssessmentApi,
  platformPlanApi
} from '@/lib/platform-api';

// 1. Create Client
const client = await platformClientApi.create({
  name: "John Doe",
  age: 45,
  gender: "male",
  height_cm: 170,
  weight_kg: 80,
  location: "Mumbai"
});

// 2. Create Intake
const intake = await platformIntakeApi.create({
  client_id: client.id,
  raw_input: {
    labs: { HbA1c: 7.5, FBS: 140, cholesterol: 220 },
    vitals: { height_cm: 170, weight_kg: 80 },
    medical_history: ["Type 2 Diabetes", "Hypertension"],
    diet_history: {
      carb_intake_percent: 60,
      fiber_g: 18,
      calorie_intake: 2500
    }
  },
  source: "manual"
});

// 3. Create Assessment
const assessment = await platformAssessmentApi.create({
  client_id: client.id,
  intake_id: intake.id,
  assessment_snapshot: {
    client_context: {
      age: 45,
      gender: "male",
      height_cm: 170,
      weight_kg: 80,
      activity_level: "moderately_active"
    },
    clinical_data: {
      labs: { HbA1c: 7.5, FBS: 140, cholesterol: 220 },
      anthropometry: { bmi: 27.7 }
    },
    diet_data: {
      diet_history: {
        carb_intake_percent: 60,
        fiber_g: 18,
        calorie_intake: 2500,
        protein_g_per_kg: 0.7
      }
    }
  }
});

// 4. Process NCP Pipeline
const diagnosis = await platformAssessmentApi.processDiagnosis(assessment.id);
const mnt = await platformAssessmentApi.processMNT(assessment.id);
const targets = await platformAssessmentApi.processTargets(assessment.id, "moderately_active");
const ayurveda = await platformAssessmentApi.processAyurveda(assessment.id);

// 5. Generate Plan
const plan = await platformPlanApi.generate({
  client_id: client.id,
  assessment_id: assessment.id,
  client_preferences: {
    meal_timing: "early_dinner",
    spice_level: "medium"
  },
  enable_ayurveda: true
});

// 6. Get Active Plan
const activePlan = await platformPlanApi.getActivePlan(client.id);
```

## Checklist

- [ ] Update all imports to use `platform-api.ts`
- [ ] Replace `clientApi` with `platformClientApi`
- [ ] Replace `healthProfileApi`/`comprehensiveHealthProfileApi` with `platformAssessmentApi`
- [ ] Replace `dietPlanApi` with `platformPlanApi`
- [ ] Convert numeric IDs to UUID strings
- [ ] Update client creation to use `name` instead of `first_name`/`last_name`
- [ ] Restructure health profile data into assessment workflow
- [ ] Update plan generation to require `assessment_id`
- [ ] Test all API calls with new structure

## Need Help?

If you encounter issues during migration:
1. Check the TypeScript types in `platform-api.ts` for expected structures
2. Review the backend API documentation at `/docs` endpoint
3. Check backend tests in `backend/tests/platform/api/` for examples

## Timeline

- **Phase 1 (Current)**: Both APIs available, deprecation warnings shown
- **Phase 2 (Next Release)**: Legacy APIs still work but show stronger warnings
- **Phase 3 (Future)**: Legacy APIs removed, only Platform APIs available

