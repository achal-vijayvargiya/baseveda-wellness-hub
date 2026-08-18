/**
 * Platform NCP API Client
 * 
 * This file contains the NEW Platform NCP API functions.
 * These APIs follow the NCP (Nutrition Care Process) workflow:
 * Client → Intake → Assessment → Diagnosis → MNT → Targets → Ayurveda → Plan
 * 
 * IMPORTANT: Use these APIs for all new development.
 * The old APIs in api.ts are deprecated and will be removed in future versions.
 * 
 * Migration Guide: See MIGRATION_GUIDE.md
 */

// Re-export fetchWithAuth helper from api.ts
// Note: We import from api.ts to share the same authentication logic
import { fetchWithAuth } from "./api";
import { API_BASE_URL } from "./config";

// ============================================================================
// PLATFORM NCP API TYPES
// ============================================================================

export interface PlatformLoginRequest {
  username: string;
  password: string;
}

export interface PlatformTokenResponse {
  access_token: string;
  token_type: string;
}

export interface PlatformUserResponse {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface PlatformClientCreate {
  name: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  location?: string;
  external_client_id?: string;
  wake_time?: string;
  sleep_time?: string;
  work_schedule_start?: string;
  work_schedule_end?: string;
}

export interface PlatformClientUpdate {
  name?: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  location?: string;
  wake_time?: string;
  sleep_time?: string;
  work_schedule_start?: string;
  work_schedule_end?: string;
}

export interface PlatformClientResponse {
  id: string;
  external_client_id?: string;
  name: string;
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  location?: string;
  wake_time?: string;
  sleep_time?: string;
  work_schedule_start?: string;
  work_schedule_end?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformIntakeCreate {
  client_id: string;
  raw_input?: Record<string, any>;
  source?: "manual" | "upload" | "ai_extracted";
}

export interface PlatformIntakeResponse {
  id: string;
  client_id: string;
  raw_input?: Record<string, any>;
  normalized_input?: Record<string, any>;
  source?: string;
  created_at: string;
}

export interface PlatformIntakeUpdate {
  raw_input?: Record<string, any>;
  source?: string;
}

export interface PlatformAssessmentUpdate {
  assessment_snapshot?: Record<string, any>;
  assessment_status?: string;
}

export interface PlatformAssessmentCreate {
  client_id: string;
  intake_id?: string;
  assessment_snapshot?: Record<string, any>;
}

export interface PlatformAssessmentResponse {
  id: string;
  client_id: string;
  intake_id?: string;
  assessment_status?: string;
  assessment_snapshot?: Record<string, any>;
  created_at: string;
}

export interface PlatformDiagnosisResponse {
  medical_conditions: Array<Record<string, any>>;
  nutrition_diagnoses: Array<Record<string, any>>;
}

export interface PlatformMNTResponse {
  macro_constraints: Record<string, any>;
  micro_constraints: Record<string, any>;
  food_exclusions: string[];
  rule_ids_used: string[];
}

export interface PlatformTargetResponse {
  calories_target: number;
  macros: Record<string, any>;
  key_micros: Record<string, any>;
  calculation_source: string;
}

export interface PlatformMealStructureResponse {
  meal_count: number;
  meals: string[];
  timing_windows: Record<string, string[]>;
  calorie_split: Record<string, number>;
  protein_split: Record<string, number>;
  macro_guardrails: Record<string, Record<string, number[]>>;
  flags: string[];
}

export interface PlatformAyurvedaResponse {
  dosha_primary?: string;
  dosha_secondary?: string;
  vikriti_notes?: Record<string, any>;
  lifestyle_guidelines?: Record<string, any>;
}

export interface PlatformExchangeAllocationResponse {
  exchanges_per_meal: Record<string, Record<string, number>>;
  daily_exchange_allocation?: Record<string, number>;
  per_meal_nutrition?: Record<string, Record<string, number>>;
  daily_nutrition?: Record<string, number>;
  notes?: Record<string, any>;
}

export interface PlatformInterventionResponse {
  assessment_id: string;
  plan_id?: string;
  plan_version?: number;
  meal_plan: Record<string, any>;
  explanations?: Record<string, any>;
  constraints_snapshot?: Record<string, any>;
}

export interface PlatformFoodAllocationResponse {
  assessment_id: string;
  plan_id?: string;
  plan_version?: number;
  meal_allocation: Record<string, any>;  // Phase 1 output with allocated foods
  variety_metrics?: Record<string, any>;
  nutrition_summary?: Record<string, any>;
}

export interface PlatformFoodApprovalRequest {
  assessment_id: string;
  approvals: Record<string, Record<string, boolean>>;  // {day_number: {meal_name: is_approved}}
  notes?: Record<string, Record<string, string>>;  // Optional notes per meal
}

export interface PlatformFoodApprovalResponse {
  assessment_id: string;
  approved_meals: Array<{ day_number: string; meal_name: string }>;
  total_approved: number;
  total_pending: number;
}

export interface PlatformRecipeResponse {
  assessment_id: string;
  plan_id?: string;
  plan_version?: number;
  seven_day_plan: Record<string, any>;
  variety_metrics?: Record<string, any>;
}

export interface PlatformNCPStatusResponse {
  assessment_id: string;
  steps: {
    intake: boolean;
    assessment: boolean;
    diagnosis: boolean;
    mnt: boolean;
    targets: boolean;
    meal_structure: boolean;
    exchange_allocation: boolean;
    ayurveda: boolean;
    intervention: boolean;
    food_allocation: boolean;
    recipe_generation: boolean;
  };
  current_step: string;
}

export interface PlatformPlanGenerateRequest {
  client_id: string;
  assessment_id: string;
  client_preferences?: Record<string, any>;
  enable_ayurveda?: boolean;
}

export interface PlatformPlanResponse {
  id: string;
  client_id: string;
  assessment_id: string;
  plan_version?: number;
  status?: string;
  meal_plan?: Record<string, any>;
  explanations?: Record<string, any>;
  constraints_snapshot?: Record<string, any>;
  created_at: string;
}

export interface PlatformQuizQuestion {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c?: string;
  dosha_a?: string;
  dosha_b?: string;
  dosha_c?: string;
  state_a?: string;
  state_b?: string;
  state_c?: string;
  question_type?: "radio" | "checkbox";
}

export interface QuestionnaireSection {
  section_id: string;
  section_title: string;
  section_description?: string;
  questions: PlatformQuizQuestion[];
}

export interface AyurvedaAssessmentQuestionsResponse {
  sections: QuestionnaireSection[];
}

// ============================================================================
// PLATFORM NCP API FUNCTIONS
// ============================================================================

/**
 * Platform Authentication API
 * 
 * Handles user authentication for the Platform API.
 * Provides login, user info retrieval, and logout functionality.
 */
export const platformAuthApi = {
  /**
   * Login with username and password
   * 
   * Authenticates the user and stores the access token in localStorage.
   * Uses FormData for OAuth2PasswordRequestForm compatibility.
   * 
   * @param username - User's username
   * @param password - User's password
   * @returns Promise resolving to token response with access_token and token_type
   */
  login: async (username: string, password: string): Promise<PlatformTokenResponse> => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/platform/auth/login`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }

    const data = await response.json();
    localStorage.setItem("auth_token", data.access_token);
    return data;
  },

  /**
   * Get current authenticated user information
   * 
   * Retrieves the currently authenticated user's profile information.
   * Requires a valid authentication token.
   * 
   * @returns Promise resolving to user information
   */
  getCurrentUser: async (): Promise<PlatformUserResponse> => {
    return fetchWithAuth("/platform/auth/me");
  },

  /**
   * Logout current user
   * 
   * Removes the authentication token from localStorage.
   * Optionally redirects to login page.
   */
  logout: (): void => {
    localStorage.removeItem("auth_token");
    // Optional: redirect to login page
    // window.location.href = "/login";
  },
};

/**
 * Platform Client API
 * 
 * Manages platform clients following the NCP workflow.
 * Clients are identified by UUID and can have external IDs for integration.
 */
export const platformClientApi = {
  /**
   * List all platform clients with optional pagination
   * 
   * Retrieves all platform clients with optional skip and limit for pagination.
   * 
   * @param skip - Number of records to skip (default: 0)
   * @param limit - Maximum number of records to return (default: 100)
   * @returns Promise resolving to array of clients
   */
  list: async (skip: number = 0, limit: number = 100): Promise<PlatformClientResponse[]> => {
    return fetchWithAuth(`/platform/clients/?skip=${skip}&limit=${limit}`);
  },

  create: async (client: PlatformClientCreate): Promise<PlatformClientResponse> => {
    return fetchWithAuth("/platform/clients/", {
      method: "POST",
      body: JSON.stringify(client),
    });
  },

  getById: async (id: string): Promise<PlatformClientResponse> => {
    return fetchWithAuth(`/platform/clients/${id}`);
  },

  update: async (id: string, updates: PlatformClientUpdate): Promise<PlatformClientResponse> => {
    return fetchWithAuth(`/platform/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchWithAuth(`/platform/clients/${id}`, {
      method: "DELETE",
    });
  },
};

/**
 * Platform Intake API
 * 
 * Creates intake records - the first step in the NCP workflow.
 * Intake collects raw user input (labs, vitals, medical history, etc.)
 */
export const platformIntakeApi = {
  create: async (intake: PlatformIntakeCreate): Promise<PlatformIntakeResponse> => {
    return fetchWithAuth("/platform/assessments/intake", {
      method: "POST",
      body: JSON.stringify(intake),
    });
  },

  getById: async (id: string): Promise<PlatformIntakeResponse> => {
    return fetchWithAuth(`/platform/assessments/intake/${id}`);
  },

  getByClientId: async (clientId: string): Promise<PlatformIntakeResponse[]> => {
    return fetchWithAuth(`/platform/assessments/intake/client/${clientId}`);
  },

  update: async (id: string, updates: PlatformIntakeUpdate): Promise<PlatformIntakeResponse> => {
    return fetchWithAuth(`/platform/assessments/intake/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },
};

/**
 * Platform Assessment API
 * 
 * Manages assessments and processes them through the NCP pipeline:
 * - Create assessments from intake data
 * - Process diagnosis (medical conditions & nutrition diagnoses)
 * - Process MNT constraints (mandatory nutrition therapy rules)
 * - Calculate nutrition targets (calories, macros, micros)
 * - Process Ayurveda advisory (dosha assessment & lifestyle guidelines)
 */
export const platformAssessmentApi = {
  create: async (assessment: PlatformAssessmentCreate): Promise<PlatformAssessmentResponse> => {
    return fetchWithAuth("/platform/assessments/", {
      method: "POST",
      body: JSON.stringify(assessment),
    });
  },

  getById: async (id: string): Promise<PlatformAssessmentResponse> => {
    return fetchWithAuth(`/platform/assessments/${id}`);
  },

  getByClientId: async (clientId: string): Promise<PlatformAssessmentResponse[]> => {
    return fetchWithAuth(`/platform/assessments/client/${clientId}`);
  },

  update: async (id: string, updates: PlatformAssessmentUpdate): Promise<PlatformAssessmentResponse> => {
    return fetchWithAuth(`/platform/assessments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  extractBloodReport: async (file: File): Promise<{
    success: boolean;
    blood_report: {
      report_date?: string | null;
      hb?: number | null;
      rbc?: number | null;
      wbc?: number | null;
      platelets?: number | null;
      fbs?: number | null;
      hba1c?: number | null;
      cholesterol?: number | null;
      triglycerides?: number | null;
      hdl?: number | null;
      ldl?: number | null;
      alt?: number | null;
      ast?: number | null;
      bilirubin?: number | null;
      albumin?: number | null;
      creatinine?: number | null;
      urea?: number | null;
      egfr?: number | null;
      vitamin_d?: number | null;
      vitamin_b12?: number | null;
      tsh?: number | null;
      ferritin?: number | null;
    };
    message: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/platform/assessments/extract-blood-report`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to extract blood report");
    }

    return response.json();
  },

  processDiagnosis: async (assessmentId: string): Promise<PlatformDiagnosisResponse> => {
    return fetchWithAuth("/platform/assessments/diagnosis", {
      method: "POST",
      body: JSON.stringify({ assessment_id: assessmentId }),
    });
  },

  processMNT: async (assessmentId: string): Promise<PlatformMNTResponse> => {
    return fetchWithAuth("/platform/assessments/mnt", {
      method: "POST",
      body: JSON.stringify({ assessment_id: assessmentId }),
    });
  },

  processTargets: async (assessmentId: string, activityLevel?: string): Promise<PlatformTargetResponse> => {
    return fetchWithAuth("/platform/assessments/targets", {
      method: "POST",
      body: JSON.stringify({
        assessment_id: assessmentId,
        activity_level: activityLevel,
      }),
    });
  },

  processMealStructure: async (assessmentId: string, clientPreferences?: Record<string, any>): Promise<PlatformMealStructureResponse> => {
    return fetchWithAuth("/platform/assessments/meal-structure", {
      method: "POST",
      body: JSON.stringify({
        assessment_id: assessmentId,
        client_preferences: clientPreferences,
      }),
    });
  },

  getExchangeCategories: async (assessmentId?: string): Promise<any[]> => {
    const url = assessmentId 
      ? `/platform/assessments/exchange-categories?assessment_id=${assessmentId}`
      : "/platform/assessments/exchange-categories";
    return fetchWithAuth(url);
  },

  processExchangeAllocation: async (assessmentId: string, mandatoryExchangesPerMeal?: Record<string, string[]>, clientPreferences?: Record<string, any>): Promise<PlatformExchangeAllocationResponse> => {
    return fetchWithAuth("/platform/assessments/exchange-allocation", {
      method: "POST",
      body: JSON.stringify({
        assessment_id: assessmentId,
        client_preferences: clientPreferences,
        mandatory_exchanges_per_meal: mandatoryExchangesPerMeal,
      }),
    });
  },

  processAyurveda: async (assessmentId: string): Promise<PlatformAyurvedaResponse> => {
    return fetchWithAuth("/platform/assessments/ayurveda", {
      method: "POST",
      body: JSON.stringify({ assessment_id: assessmentId }),
    });
  },

  processIntervention: async (assessmentId: string, clientPreferences?: Record<string, any>, enableAyurveda?: boolean): Promise<PlatformInterventionResponse> => {
    return fetchWithAuth("/platform/assessments/intervention", {
      method: "POST",
      body: JSON.stringify({
        assessment_id: assessmentId,
        client_preferences: clientPreferences,
        enable_ayurveda: enableAyurveda ?? true,
      }),
    });
  },

  processFoodAllocation: async (assessmentId: string, clientPreferences?: Record<string, any>): Promise<PlatformFoodAllocationResponse> => {
    return fetchWithAuth("/platform/assessments/food-allocation", {
      method: "POST",
      body: JSON.stringify({
        assessment_id: assessmentId,
        client_preferences: clientPreferences,
      }),
    });
  },

  getFoodAllocation: async (assessmentId: string): Promise<PlatformFoodAllocationResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/food-allocation`);
  },

  approveFoodAllocation: async (assessmentId: string, approvals: Record<string, Record<string, boolean>>, notes?: Record<string, Record<string, string>>): Promise<PlatformFoodApprovalResponse> => {
    return fetchWithAuth("/platform/assessments/food-allocation/approve", {
      method: "POST",
      body: JSON.stringify({
        assessment_id: assessmentId,
        approvals: approvals,
        notes: notes,
      }),
    });
  },

  getFoodAllocationApprovals: async (assessmentId: string): Promise<PlatformFoodApprovalResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/food-allocation/approvals`);
  },

  processRecipeGeneration: async (assessmentId: string, clientPreferences?: Record<string, any>): Promise<PlatformRecipeResponse> => {
    return fetchWithAuth("/platform/assessments/recipe-generation", {
      method: "POST",
      body: JSON.stringify({
        assessment_id: assessmentId,
        client_preferences: clientPreferences,
      }),
    });
  },

  // GET endpoints - Retrieve step results
  getDiagnosis: async (assessmentId: string): Promise<PlatformDiagnosisResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/diagnosis`);
  },

  getMNT: async (assessmentId: string): Promise<PlatformMNTResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/mnt`);
  },

  getTargets: async (assessmentId: string): Promise<PlatformTargetResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/targets`);
  },

  getMealStructure: async (assessmentId: string): Promise<PlatformMealStructureResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/meal-structure`);
  },

  getExchangeAllocation: async (assessmentId: string): Promise<PlatformExchangeAllocationResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/exchange-allocation`);
  },

  getAyurveda: async (assessmentId: string): Promise<PlatformAyurvedaResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/ayurveda`);
  },

  getIntervention: async (assessmentId: string): Promise<PlatformInterventionResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/intervention`);
  },

  getRecipeGeneration: async (assessmentId: string): Promise<PlatformRecipeResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/recipe-generation`);
  },

  getNCPStatus: async (assessmentId: string): Promise<PlatformNCPStatusResponse> => {
    return fetchWithAuth(`/platform/assessments/${assessmentId}/status`);
  },
};

/**
 * Platform Plan API
 * 
 * Generates and manages diet plans following the complete NCP workflow.
 * Plan generation orchestrates: Intake → Assessment → Diagnosis → MNT → Targets → Ayurveda → Intervention
 */
export const platformPlanApi = {
  generate: async (request: PlatformPlanGenerateRequest): Promise<PlatformPlanResponse> => {
    return fetchWithAuth("/platform/plans/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Generate plan by running only the intervention stage.
   * Uses existing MNT, Targets, and Ayurveda data from previous NCP steps.
   */
  generateIntervention: async (request: PlatformPlanGenerateRequest): Promise<PlatformPlanResponse> => {
    return fetchWithAuth("/platform/plans/generate-intervention", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  getById: async (planId: string): Promise<PlatformPlanResponse> => {
    return fetchWithAuth(`/platform/plans/${planId}`);
  },

  getByClientId: async (clientId: string): Promise<PlatformPlanResponse[]> => {
    return fetchWithAuth(`/platform/plans/client/${clientId}`);
  },

  getActivePlan: async (clientId: string): Promise<PlatformPlanResponse | null> => {
    return fetchWithAuth(`/platform/plans/client/${clientId}/active`);
  },
};

/**
 * Platform Quiz Questions API
 * 
 * Provides read-only access to quiz questions for frontend forms.
 * These endpoints are public and do not require authentication.
 * Quiz answers are stored in assessment_snapshot.ayurveda_data.
 */
export const platformQuizApi = {
  /**
   * Get dosha quiz questions
   * 
   * Retrieves all dosha quiz questions with dosha mappings for each option.
   * Used by frontend to display the dosha assessment quiz form.
   * 
   * @returns Promise resolving to array of dosha quiz questions
   */
  /**
   * Get comprehensive Ayurveda assessment questionnaire
   * 
   * Retrieves structured questionnaire with sections for Prakriti, Vikriti, Agni, and Ama assessment.
   * This replaces the old dosha quiz with a comprehensive assessment.
   * 
   * @returns Promise resolving to questionnaire sections and questions
   */
  getAyurvedaAssessmentQuestions: async (): Promise<AyurvedaAssessmentQuestionsResponse> => {
    const response = await fetchWithAuth("/platform/quizzes/ayurveda-assessment/questions");
    return response;
  },

  /**
   * @deprecated Use getAyurvedaAssessmentQuestions instead
   * Get dosha quiz questions (deprecated - kept for backward compatibility)
   */
  getDoshaQuestions: async (): Promise<PlatformQuizQuestion[]> => {
    const response = await fetchWithAuth("/platform/quizzes/dosha/questions");
    return response.questions;
  },

  /**
   * Get gut health quiz questions
   * 
   * Retrieves all gut health quiz questions with state mappings for each option.
   * Used by frontend to display the gut health assessment quiz form.
   * 
   * @returns Promise resolving to array of gut health quiz questions
   */
  getGutHealthQuestions: async (): Promise<PlatformQuizQuestion[]> => {
    const response = await fetchWithAuth("/platform/quizzes/gut-health/questions");
    return response.questions;
  },
};

