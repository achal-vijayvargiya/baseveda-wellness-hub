// Import configuration
import { PLATFORM_ONLY_MODE, SHOW_DEPRECATION_WARNINGS, API_BASE_URL } from "./config";

/**
 * Helper function to warn/error when deprecated APIs are used
 */
function checkDeprecatedApi(apiName: string, alternative: string) {
  if (PLATFORM_ONLY_MODE) {
    throw new Error(
      `❌ ${apiName} is deprecated and disabled in Platform-Only Mode. ` +
      `Please use ${alternative} from '@/lib/platform-api' instead. ` +
      `See MIGRATION_GUIDE.md for migration instructions.`
    );
  }
  
  if (SHOW_DEPRECATION_WARNINGS) {
    console.warn(
      `⚠️ DEPRECATED: ${apiName} is deprecated and will be removed in a future version. ` +
      `Please migrate to ${alternative} from '@/lib/platform-api'. ` +
      `See MIGRATION_GUIDE.md for migration instructions.`
    );
  }
}

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};

// Helper function for fetch with auth
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}, raw: boolean = false) {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    ...options.headers,
  };
  // Set JSON content type only when not doing raw fetch and body is likely JSON
  if (!raw && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `HTTP Error ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  if (raw) {
    return response;
  }

  return response.json();
}

// Types
export interface Client {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id?: number;
  username: string;
  email: string;
  full_name: string;
  is_active?: boolean;
  created_at?: string;
}

export interface HealthProfile {
  id?: number;
  client_id: number;
  height?: number;
  weight?: number;
  age?: number;
  date_of_birth?: string;
  blood_group?: string;
  activity_level?: string;
  dietary_preference?: string;
  allergies?: string;
  medical_conditions?: string;
  medications?: string;
  goals?: string;
  diet_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DietPlan {
  id?: number;
  client_id: number;
  name: string;
  description?: string;
  duration_days: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  health_goals?: string;
  dosha_type?: string;
  diet_type?: string;
  allergies?: string;
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  created_by_id?: number;
  created_at?: string;
  updated_at?: string;
  meals?: DietPlanMeal[];
}

export interface DietPlanMeal {
  id?: number;
  diet_plan_id: number;
  day_number: number;
  meal_time: string;
  meal_type: string;
  order_in_day: number;
  food_dish: string;
  food_item_ids?: string;
  healing_purpose?: string;
  portion?: string;
  dosha_notes?: string;
  notes?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

export interface DietPlanGenerateRequest {
  client_id: number;
  duration_days: number;
  name?: string;
  start_date?: string;
  custom_goals?: string;
  custom_diet_type?: string;
  custom_allergies?: string;
  prefer_satvik?: boolean;
  include_regional_foods?: string;
  meal_variety?: string;
}

export interface MoreFoodsRequest {
  client_id: number;
  category: string;
  exclude_food_ids?: number[];
  limit?: number;
}

export interface SearchFoodsRequest {
  client_id: number;
  category: string;
  query: string;
  limit?: number;
}

export interface AlternativeFoodsRequest {
  client_id: number;
  food_id: number;
  limit?: number;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  category: string;
  vata_weight?: number;
  pitta_weight?: number;
  kapha_weight?: number;
}

export interface DoshaQuizData {
  client_id: number;
  answers: Record<number, number>;
}

export interface GutHealthQuizData {
  client_id: number;
  answers: Record<number, number>;
}

// ============================================================================
// DEPRECATED LEGACY APIs
// ============================================================================
// 
// ⚠️ WARNING: These APIs are deprecated and will be removed in a future version.
// 
// For new development, use the Platform NCP APIs from '@/lib/platform-api':
//   - platformClientApi (instead of clientApi)
//   - platformAssessmentApi (instead of healthProfileApi/comprehensiveHealthProfileApi)
//   - platformPlanApi (instead of dietPlanApi)
// 
// The Platform NCP APIs follow the proper NCP workflow:
//   Client → Intake → Assessment → Diagnosis → MNT → Targets → Ayurveda → Plan
// 
// See MIGRATION_GUIDE.md for migration instructions.
// ============================================================================

// Client API
/**
 * @deprecated Use platformClientApi from '@/lib/platform-api' instead.
 * This API will be removed in a future version.
 */
export const clientApi = {
  list: async (): Promise<Client[]> => {
    checkDeprecatedApi("clientApi.list", "platformClientApi");
    return fetchWithAuth("/clients/");
  },

  getById: async (id: number): Promise<Client> => {
    checkDeprecatedApi("clientApi.getById", "platformClientApi.getById");
    return fetchWithAuth(`/clients/${id}`);
  },

  create: async (client: Client): Promise<Client> => {
    checkDeprecatedApi("clientApi.create", "platformClientApi.create");
    return fetchWithAuth("/clients/", {
      method: "POST",
      body: JSON.stringify(client),
    });
  },

  update: async (id: number, client: Partial<Client>): Promise<Client> => {
    checkDeprecatedApi("clientApi.update", "platformClientApi.update");
    return fetchWithAuth(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(client),
    });
  },

  delete: async (id: number): Promise<void> => {
    checkDeprecatedApi("clientApi.delete", "platformClientApi.delete");
    return fetchWithAuth(`/clients/${id}`, {
      method: "DELETE",
    });
  },
};

// Health Profile API
/**
 * @deprecated Use platformAssessmentApi from '@/lib/platform-api' instead.
 * This API will be removed in a future version.
 */
export const healthProfileApi = {
  getByClientId: async (clientId: number): Promise<HealthProfile> => {
    checkDeprecatedApi("healthProfileApi.getByClientId", "platformAssessmentApi.getByClientId");
    return fetchWithAuth(`/health-profiles/client/${clientId}`);
  },

  create: async (profile: HealthProfile): Promise<HealthProfile> => {
    checkDeprecatedApi("healthProfileApi.create", "platformAssessmentApi.create");
    return fetchWithAuth("/health-profiles/", {
      method: "POST",
      body: JSON.stringify(profile),
    });
  },

  update: async (id: number, profile: Partial<HealthProfile>): Promise<HealthProfile> => {
    checkDeprecatedApi("healthProfileApi.update", "platformAssessmentApi");
    return fetchWithAuth(`/health-profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  },
};

// Dosha Quiz API
export const doshaQuizApi = {
  getQuestions: async (): Promise<QuizQuestion[]> => {
    return fetchWithAuth("/dosha-quiz/questions");
  },

  create: async (quizData: DoshaQuizData) => {
    return fetchWithAuth("/dosha-quiz/", {
      method: "POST",
      body: JSON.stringify(quizData),
    });
  },

  getByClientId: async (clientId: number) => {
    return fetchWithAuth(`/dosha-quiz/client/${clientId}/latest`);
  },

  getResult: async (quizId: number) => {
    return fetchWithAuth(`/dosha-quiz/${quizId}/result`);
  },
};

// Gut Health Quiz API
export const gutHealthQuizApi = {
  getQuestions: async (): Promise<QuizQuestion[]> => {
    return fetchWithAuth("/gut-health-quiz/questions");
  },

  create: async (quizData: GutHealthQuizData) => {
    return fetchWithAuth("/gut-health-quiz/", {
      method: "POST",
      body: JSON.stringify(quizData),
    });
  },

  getByClientId: async (clientId: number) => {
    return fetchWithAuth(`/gut-health-quiz/client/${clientId}/latest`);
  },

  getResult: async (quizId: number) => {
    return fetchWithAuth(`/gut-health-quiz/${quizId}/result`);
  },
};

// Auth API
export const authApi = {
  login: async (username: string, password: string) => {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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

  register: async (userData: {
    username: string;
    email: string;
    password: string;
    full_name: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(error.detail || "Registration failed");
    }

    return response.json();
  },

  logout: () => {
    localStorage.removeItem("auth_token");
  },
};

// Diet Plan API
/**
 * @deprecated Use platformPlanApi from '@/lib/platform-api' instead.
 * This API will be removed in a future version.
 */
export const dietPlanApi = {
  generate: async (request: DietPlanGenerateRequest): Promise<DietPlan> => {
    checkDeprecatedApi("dietPlanApi.generate", "platformPlanApi.generate");
    return fetchWithAuth("/diet-plans/generate", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  getByClientId: async (clientId: number): Promise<DietPlan[]> => {
    checkDeprecatedApi("dietPlanApi.getByClientId", "platformPlanApi.getByClientId");
    return fetchWithAuth(`/diet-plans/client/${clientId}`);
  },

  getById: async (planId: number): Promise<DietPlan> => {
    checkDeprecatedApi("dietPlanApi.getById", "platformPlanApi.getById");
    return fetchWithAuth(`/diet-plans/${planId}`);
  },

  list: async (clientId?: number, status?: string): Promise<DietPlan[]> => {
    let query = "";
    const params = new URLSearchParams();
    if (clientId) params.append("client_id", clientId.toString());
    if (status) params.append("status", status);
    if (params.toString()) query = `?${params.toString()}`;
    return fetchWithAuth(`/diet-plans/${query}`);
  },

  update: async (planId: number, updates: Partial<DietPlan>): Promise<DietPlan> => {
    return fetchWithAuth(`/diet-plans/${planId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  delete: async (planId: number): Promise<void> => {
    return fetchWithAuth(`/diet-plans/${planId}`, {
      method: "DELETE",
    });
  },

  getSummary: async (planId: number) => {
    return fetchWithAuth(`/diet-plans/${planId}/summary`);
  },

  export: async (planId: number, format: string = "json") => {
    // For JSON we return parsed JSON; for PDF we return a Blob
    if (format === "pdf") {
      const res = await fetchWithAuth(`/diet-plans/${planId}/export?format=pdf`, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      }, true); // raw Response
      const blob = await res.blob();
      return blob;
    }
    return fetchWithAuth(`/diet-plans/${planId}/export?format=${format}`);
  },

  // AI-Powered Generation (Two-Step Process)
  generateAIStep1: async (request: DietPlanGenerateRequest) => {
    return fetchWithAuth("/diet-plans/generate-ai/step1", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  generateAIStep2: async (
    clientId: number,
    userFeedback: string = "confirm",
    modifications?: Record<string, string>,
    durationDays: number = 7,
    sessionId?: string,
    approvedFoodsByCategory?: Record<string, any[]>  // Optional curated foods list
  ) => {
    return fetchWithAuth("/diet-plans/generate-ai/step2", {
      method: "POST",
      body: JSON.stringify({
        client_id: clientId,
        session_id: sessionId,
        user_feedback: userFeedback,
        modifications,
        duration_days: durationDays,
        approved_foods_by_category: approvedFoodsByCategory,
      }),
    });
  },

  chatWithAgent: async (message: string) => {
    return fetchWithAuth("/diet-plans/generate-ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  // Smart Food Retrieval (Enhanced KB - Category-based)
  smartFoodRetrieval: async (request: DietPlanGenerateRequest) => {
    return fetchWithAuth("/diet-plans/smart-food-retrieval", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Get more foods for a category
  getMoreFoods: async (request: MoreFoodsRequest) => {
    return fetchWithAuth("/diet-plans/smart-food-retrieval/more-foods", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Search foods in a category
  searchFoods: async (request: SearchFoodsRequest) => {
    return fetchWithAuth("/diet-plans/smart-food-retrieval/search", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Get alternative foods
  getAlternativeFoods: async (request: AlternativeFoodsRequest) => {
    return fetchWithAuth("/diet-plans/smart-food-retrieval/alternatives", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};

// Comprehensive Health Profile API
export interface ComprehensiveHealthProfileData {
  client_id: number;
  basic_profile?: {
    age?: number;
    gender?: string;
    height_cm?: number;
    weight_kg?: number;
    target_weight_kg?: number;
    waist_circumference?: number;
  };
  activity_level?: string;
  goals?: {
    primary_goal?: string;
    secondary_goals?: string[];
    timeframe?: string;
    motivation_level?: string;
    past_attempts?: string;
    readiness_to_change?: number;
  };
  medical_conditions?: {
    conditions?: string[];
    severity?: Record<string, string>;
  };
  surgery_history?: Array<{ type: string; date?: string; notes?: string }>;
  blood_report?: {
    hb?: number;
    rbc?: number;
    wbc?: number;
    platelets?: number;
    report_file_url?: string;
    report_date?: string;
  };
  menstruation_cycle?: {
    cycle_length?: number;
    period_length?: number;
    last_period?: string;
    irregularities?: string[];
  };
  allergies?: string[];
  medications?: Array<{ name: string; timing?: string }>;
  supplements?: string[];
  ayurveda?: {
    prakriti?: string;
    dosha_imbalance?: string[];
    agni?: string;
  };
  gut_health?: {
    bloating?: boolean;
    constipation?: boolean;
    acidity?: boolean;
    gas?: boolean;
    stool_type?: number;
    food_intolerance?: string[];
  };
  dietary_preferences?: string[];
  food_preferences?: {
    likes?: string[];
    dislikes?: string[];
    favorite_foods?: string[];
    excluded_ingredients?: string[];
  };
  lifestyle?: {
    region?: string;
    meal_timing?: string;
    spicy_tolerance?: string;
    sleep_hours?: number;
    stress?: string;
    work_nature?: string;
    daily_routine?: string;
    exercise_routine?: { type?: string; frequency?: string; intensity?: string };
    water_intake?: number;
    substance_use?: { smoking?: boolean; alcohol?: boolean; other?: string };
    screen_time?: number;
    social_eating?: string;
  };
}

/**
 * @deprecated Use platformAssessmentApi from '@/lib/platform-api' instead.
 * This API will be removed in a future version.
 */
export const comprehensiveHealthProfileApi = {
  getByClientId: async (clientId: number): Promise<ComprehensiveHealthProfileData> => {
    checkDeprecatedApi("comprehensiveHealthProfileApi.getByClientId", "platformAssessmentApi.getByClientId");
    return fetchWithAuth(`/comprehensive-health-profiles/client/${clientId}`);
  },

  create: async (profile: ComprehensiveHealthProfileData): Promise<ComprehensiveHealthProfileData> => {
    checkDeprecatedApi("comprehensiveHealthProfileApi.create", "platformAssessmentApi.create");
    return fetchWithAuth("/comprehensive-health-profiles/", {
      method: "POST",
      body: JSON.stringify(profile),
    });
  },

  update: async (
    clientId: number,
    profile: Partial<ComprehensiveHealthProfileData>
  ): Promise<ComprehensiveHealthProfileData> => {
    checkDeprecatedApi("comprehensiveHealthProfileApi.update", "platformAssessmentApi");
    return fetchWithAuth(`/comprehensive-health-profiles/client/${clientId}`, {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  },
};

// ============================================================================
// DEPRECATED: Platform NCP APIs have been moved to platform-api.ts
// ============================================================================
// 
// ⚠️ IMPORTANT: All Platform NCP APIs have been moved to a separate file.
// Please import from '@/lib/platform-api' instead:
// 
//   import { platformClientApi, platformAssessmentApi, ... } from '@/lib/platform-api'
// 
// The old APIs below are kept for backward compatibility but will be removed
// in a future version. See MIGRATION_GUIDE.md for migration instructions.
// ============================================================================

// Re-export Platform APIs from platform-api.ts for backward compatibility
export {
  platformAuthApi,
  platformClientApi,
  platformIntakeApi,
  platformAssessmentApi,
  platformPlanApi,
  type PlatformLoginRequest,
  type PlatformTokenResponse,
  type PlatformUserResponse,
  type PlatformClientCreate,
  type PlatformClientUpdate,
  type PlatformClientResponse,
  type PlatformIntakeCreate,
  type PlatformIntakeResponse,
  type PlatformAssessmentCreate,
  type PlatformAssessmentResponse,
  type PlatformDiagnosisResponse,
  type PlatformMNTResponse,
  type PlatformTargetResponse,
  type PlatformAyurvedaResponse,
  type PlatformPlanGenerateRequest,
  type PlatformPlanResponse,
} from "./platform-api";

