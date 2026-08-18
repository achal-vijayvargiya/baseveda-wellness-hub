import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Loader2, User, Brain, Activity, X, Stethoscope, Target, Utensils, Upload } from "lucide-react";
import {
  type Client,
  type HealthProfile,
} from "@/lib/api";
import {
  platformClientApi,
  platformIntakeApi,
  platformAssessmentApi,
  platformPlanApi,
  platformQuizApi,
  type PlatformClientCreate,
  type PlatformClientUpdate,
  type PlatformIntakeCreate,
  type PlatformAssessmentCreate,
  type PlatformQuizQuestion,
  type QuestionnaireSection,
} from "@/lib/platform-api";
import { AyurvedaAssessment } from "@/components/AyurvedaAssessment";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: string): number | null {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Map frontend gender values to backend format
 */
function mapGender(gender?: string): "male" | "female" | "other" | undefined {
  if (!gender) return undefined;
  const normalized = gender.toLowerCase();
  if (normalized === "male" || normalized === "female" || normalized === "other") {
    return normalized as "male" | "female" | "other";
  }
  return "other";
}

/**
 * Map frontend activity levels to backend format
 */
function mapActivityLevel(activityLevel?: string): "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active" | undefined {
  if (!activityLevel) return undefined;
  const normalized = activityLevel.toLowerCase();
  
  // Map frontend values to backend values
  const mapping: Record<string, "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active"> = {
    "sedentary": "sedentary",
    "lightly_active": "lightly_active",
    "moderately_active": "moderately_active",
    "very_active": "very_active",
    "extremely_active": "extremely_active",
  };
  
  return mapping[normalized] || "moderately_active";
}

/**
 * Calculate BMI from height and weight
 */
function calculateBMI(heightCm?: number, weightKg?: number): number | undefined {
  if (!heightCm || !weightKg) return undefined;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}


/**
 * Build assessment snapshot from form data
 */
function buildAssessmentSnapshot(
  clientData: Client,
  healthProfile: HealthProfile,
  diagnosedConditions: Array<{condition: string, severity: string}>,
  surgeryHistory: Array<{type: string, date?: string, notes?: string}>,
  bloodReport: {
    // CBC
    hb?: number, rbc?: number, wbc?: number, platelets?: number,
    // FBS + HbA1c
    fbs?: number, hba1c?: number,
    // Lipid Profile
    cholesterol?: number, triglycerides?: number, hdl?: number, ldl?: number,
    // LFT
    alt?: number, ast?: number, bilirubin?: number, albumin?: number,
    // KFT
    creatinine?: number, urea?: number, egfr?: number,
    // Vitamins
    vitamin_d?: number, vitamin_b12?: number,
    // TSH
    tsh?: number,
    // Ferritin
    ferritin?: number,
    // Metadata
    report_file_url?: string, report_date?: string
  } | null,
  waistCircumference?: number,
  foodPreferences: {likes?: string[], dislikes?: string[], favorite_foods?: string[], excluded_ingredients?: string[]},
  dietaryPreferencesList: string[],
  ayurvedaAnswers: Record<string, string | string[]>,
  lifestyleExtended: {work_nature?: string, daily_routine?: string, exercise_routine?: {type?: string, frequency?: string, intensity?: string}, water_intake?: number, substance_use?: {smoking?: boolean, alcohol?: boolean, other?: string}, screen_time?: number, social_eating?: string},
  menstruationCycle?: {cycle_length?: number, period_length?: number, last_period?: string, irregularities?: string[]} | null,
  goalsExtended?: {primary_goal?: string, secondary_goals?: string[], timeframe?: string, motivation_level?: string, past_attempts?: string, readiness_to_change?: number},
  wakeTime?: string,
  sleepTime?: string,
  workScheduleStart?: string,
  workScheduleEnd?: string,
  mealPreferences?: {
    explicit_meal_count?: number;
    snack_preference?: boolean;
    liquid_meal_allowed?: boolean;
    fasting_window?: string;
    max_meals?: number;
  }
): Record<string, any> {
  const age = calculateAge(clientData.date_of_birth || "");
  const bmi = calculateBMI(healthProfile.height, healthProfile.weight);
  
  
  return {
    client_context: {
      age: age || undefined,
      gender: mapGender(clientData.gender),
      height_cm: healthProfile.height,
      weight_kg: healthProfile.weight,
      activity_level: mapActivityLevel(healthProfile.activity_level),
      wake_time: wakeTime || undefined,
      sleep_time: sleepTime || undefined,
      work_schedule: (workScheduleStart && workScheduleEnd) ? {
        start: workScheduleStart,
        end: workScheduleEnd
      } : undefined,
    },
    clinical_data: {
      labs: bloodReport ? {
        // CBC
        hb: bloodReport.hb,
        rbc: bloodReport.rbc,
        wbc: bloodReport.wbc,
        platelets: bloodReport.platelets,
        // FBS + HbA1c
        fbs: bloodReport.fbs,
        hba1c: bloodReport.hba1c,
        // Lipid Profile
        cholesterol: bloodReport.cholesterol,
        triglycerides: bloodReport.triglycerides,
        hdl: bloodReport.hdl,
        ldl: bloodReport.ldl,
        // LFT
        alt: bloodReport.alt,
        ast: bloodReport.ast,
        bilirubin: bloodReport.bilirubin,
        albumin: bloodReport.albumin,
        // KFT
        creatinine: bloodReport.creatinine,
        urea: bloodReport.urea,
        egfr: bloodReport.egfr,
        // Vitamins
        vitamin_d: bloodReport.vitamin_d,
        vitamin_b12: bloodReport.vitamin_b12,
        // TSH
        tsh: bloodReport.tsh,
        // Ferritin
        ferritin: bloodReport.ferritin,
      } : undefined,
      anthropometry: {
        bmi: bmi,
        waist_circumference: waistCircumference,
      },
      medical_history: {
        conditions: diagnosedConditions.map(c => c.condition).filter(c => c),
        severity: diagnosedConditions.reduce((acc, c) => {
          if (c.condition) acc[c.condition] = c.severity;
          return acc;
        }, {} as Record<string, string>),
        surgery_history: surgeryHistory.filter(s => s.type).map(s => ({
          type: s.type,
          date: s.date,
          notes: s.notes,
        })),
      },
    },
    diet_data: {
      dietary_preferences: dietaryPreferencesList.length > 0 ? dietaryPreferencesList : undefined,
      food_preferences: {
        likes: foodPreferences.likes,
        dislikes: foodPreferences.dislikes,
        favorite_foods: foodPreferences.favorite_foods,
        excluded_ingredients: foodPreferences.excluded_ingredients,
      },
    },
    ayurveda_data: Object.keys(ayurvedaAnswers).length > 0 ? {
      ayurveda_assessment: ayurvedaAnswers,
    } : undefined,
    lifestyle_data: {
      work_nature: lifestyleExtended.work_nature,
      daily_routine: lifestyleExtended.daily_routine,
      exercise_routine: lifestyleExtended.exercise_routine,
      water_intake: lifestyleExtended.water_intake,
      substance_use: lifestyleExtended.substance_use,
      screen_time: lifestyleExtended.screen_time,
      social_eating: lifestyleExtended.social_eating,
      meal_preferences: mealPreferences && Object.keys(mealPreferences).length > 0 ? mealPreferences : undefined,
    },
    ...(menstruationCycle && clientData.gender === "female" ? {
      menstruation_cycle: menstruationCycle
    } : {}),
    ...(goalsExtended ? {
      goals: goalsExtended
    } : {}),
  };
}

const EditClient = () => {
  const navigate = useNavigate();
  const { id: clientId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form data states
  const [clientData, setClientData] = useState<Client>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: "",
    city: "",
    medical_history: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
  });

  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    age: undefined,
    weight: undefined,
    height: undefined,
    goals: "",
    activity_level: "",
    disease: "",
    allergies: "",
    supplements: "",
    medications: "",
    diet_type: "",
    sleep_cycle: "",
  });

  // New comprehensive fields state
  const [waistCircumference, setWaistCircumference] = useState<number | undefined>();
  const [diagnosedConditions, setDiagnosedConditions] = useState<Array<{condition: string, severity: string}>>([]);
  const [surgeryHistory, setSurgeryHistory] = useState<Array<{type: string, date?: string, notes?: string}>>([]);
  const [bloodReport, setBloodReport] = useState<{hb?: number, rbc?: number, wbc?: number, platelets?: number, report_file_url?: string, report_date?: string} | null>(null);
  const [menstruationCycle, setMenstruationCycle] = useState<{cycle_length?: number, period_length?: number, last_period?: string, irregularities?: string[]} | null>(null);
  const [goalsExtended, setGoalsExtended] = useState<{primary_goal?: string, secondary_goals?: string[], timeframe?: string, motivation_level?: string, past_attempts?: string, readiness_to_change?: number}>({});
  const [foodPreferences, setFoodPreferences] = useState<{likes?: string[], dislikes?: string[], favorite_foods?: string[], excluded_ingredients?: string[]}>({});
  const [lifestyleExtended, setLifestyleExtended] = useState<{work_nature?: string, daily_routine?: string, exercise_routine?: {type?: string, frequency?: string, intensity?: string}, water_intake?: number, substance_use?: {smoking?: boolean, alcohol?: boolean, other?: string}, screen_time?: number, social_eating?: string}>({});
  const [wakeTime, setWakeTime] = useState<string>("");
  const [sleepTime, setSleepTime] = useState<string>("");
  const [workScheduleStart, setWorkScheduleStart] = useState<string>("");
  const [workScheduleEnd, setWorkScheduleEnd] = useState<string>("");
  const [mealPreferences, setMealPreferences] = useState<{
    explicit_meal_count?: number;
    snack_preference?: boolean;
    liquid_meal_allowed?: boolean;
    fasting_window?: string;
    max_meals?: number;
  }>({
    snack_preference: true,
    liquid_meal_allowed: false,
    max_meals: 5
  });
  const [structuredMedications, setStructuredMedications] = useState<Array<{name: string, timing?: string}>>([]);
  const [structuredAllergies, setStructuredAllergies] = useState<string[]>([]);
  const [dietaryPreferencesList, setDietaryPreferencesList] = useState<string[]>([]);

  const [ayurvedaAnswers, setAyurvedaAnswers] = useState<Record<string, string | string[]>>({});
  const [ayurvedaSections, setAyurvedaSections] = useState<QuestionnaireSection[]>([]);

  // Load existing client data
  useEffect(() => {
    const loadClientData = async () => {
      if (!clientId) {
        toast({
          title: "Error",
          description: "Client ID is required.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      try {
        setIsLoadingData(true);
        
        // Load client, intake, and assessment data
        const [client, intakes, assessments] = await Promise.all([
          platformClientApi.getById(clientId),
          platformIntakeApi.getByClientId(clientId),
          platformAssessmentApi.getByClientId(clientId),
        ]);

        // Get latest intake and assessment
        const latestIntake = intakes.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        const latestAssessment = assessments.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        const rawInput = latestIntake?.raw_input || {};
        const snapshot = latestAssessment?.assessment_snapshot || {};

        // Pre-fill client data
        const nameParts = client.name.split(" ");
        setClientData({
          first_name: nameParts[0] || "",
          last_name: nameParts.slice(1).join(" ") || "",
          email: rawInput.email || client.external_client_id || "",
          phone: rawInput.phone || "",
          date_of_birth: rawInput.date_of_birth || "",
          gender: rawInput.gender || client.gender || "",
          address: rawInput.address || "",
          city: rawInput.city || client.location || "",
          medical_history: rawInput.medical_history || "",
          emergency_contact_name: rawInput.emergency_contact?.name || "",
          emergency_contact_phone: rawInput.emergency_contact?.phone || "",
          emergency_contact_relation: rawInput.emergency_contact?.relation || "",
        });

        // Pre-fill health profile
        setHealthProfile({
          age: client.age,
          weight: rawInput.weight_kg || client.weight_kg,
          height: rawInput.height_cm || client.height_cm,
          goals: rawInput.goals || "",
          activity_level: rawInput.activity_level || snapshot.client_context?.activity_level || "",
          disease: rawInput.disease || "",
          allergies: rawInput.allergies || "",
          supplements: rawInput.supplements || "",
          medications: rawInput.medications || "",
          diet_type: rawInput.diet_type || "",
          sleep_cycle: rawInput.sleep_cycle || "",
        });

        // Pre-fill other fields
        setWaistCircumference(rawInput.waist_circumference);
        setDiagnosedConditions(rawInput.diagnosed_conditions || []);
        setSurgeryHistory(rawInput.surgery_history || []);
        setBloodReport(rawInput.blood_report || null);
        setMenstruationCycle(rawInput.menstruation_cycle || null);
        setGoalsExtended(rawInput.goals_extended || {});
        setFoodPreferences(rawInput.food_preferences || {});
        setLifestyleExtended(rawInput.lifestyle || {});
        setStructuredMedications(rawInput.structured_medications || []);
        setStructuredAllergies(rawInput.structured_allergies || []);
        setDietaryPreferencesList(rawInput.dietary_preferences || []);
        // Load Ayurveda assessment answers (support both old and new format)
        const ayurvedaData = rawInput.ayurveda_assessment || rawInput.dosha_answers || {};
        setAyurvedaAnswers(ayurvedaData);
        
        // Load schedule and meal preferences from snapshot
        const clientContext = snapshot?.client_context || {};
        setWakeTime(clientContext.wake_time || "");
        setSleepTime(clientContext.sleep_time || "");
        if (clientContext.work_schedule) {
          setWorkScheduleStart(clientContext.work_schedule.start || "");
          setWorkScheduleEnd(clientContext.work_schedule.end || "");
        }
        
        const lifestyleData = snapshot?.lifestyle_data || {};
        if (lifestyleData.meal_preferences) {
          setMealPreferences(lifestyleData.meal_preferences);
        }
        
        // Also try to load from raw_input if not in snapshot
        if (rawInput.wake_time) setWakeTime(rawInput.wake_time);
        if (rawInput.sleep_time) setSleepTime(rawInput.sleep_time);
        if (rawInput.work_schedule) {
          setWorkScheduleStart(rawInput.work_schedule.start || "");
          setWorkScheduleEnd(rawInput.work_schedule.end || "");
        }
        if (rawInput.explicit_meal_count !== undefined || rawInput.snack_preference !== undefined || 
            rawInput.liquid_meal_allowed !== undefined || rawInput.fasting_window || rawInput.max_meals !== undefined) {
          setMealPreferences({
            explicit_meal_count: rawInput.explicit_meal_count,
            snack_preference: rawInput.snack_preference,
            liquid_meal_allowed: rawInput.liquid_meal_allowed,
            fasting_window: rawInput.fasting_window,
            max_meals: rawInput.max_meals,
          });
        }
      } catch (error: any) {
        console.error("Error loading client data:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load client data.",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (clientId) {
      loadClientData();
    }
  }, [clientId, navigate, toast]);

  // Load quiz questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoadingQuestions(true);
        const response = await platformQuizApi.getAyurvedaAssessmentQuestions();
        setAyurvedaSections(response.sections);
      } catch (error) {
        console.error("Error loading quiz questions:", error);
        toast({
          title: "Error",
          description: "Failed to load quiz questions. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadQuestions();
  }, [toast]);

  const steps = [
    { number: 1, title: "Basic Info", icon: User, description: "Administrative & basic details" },
    { number: 2, title: "Medical History", icon: Stethoscope, description: "Medical conditions & history" },
    { number: 3, title: "Lifestyle", icon: Activity, description: "Lifestyle assessment" },
    { number: 4, title: "Goals", icon: Target, description: "Health & fitness goals" },
    { number: 5, title: "Dietary", icon: Utensils, description: "Dietary preferences & assessment" },
    { number: 6, title: "Dosha Quiz", icon: Brain, description: "Ayurvedic constitution" },
  ];

  const progress = (currentStep / steps.length) * 100;

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!clientData.first_name || !clientData.last_name) {
          toast({
            title: "Validation Error",
            description: "First name and last name are required.",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 2:
      case 3:
      case 4:
      case 5:
        // Medical, Lifestyle, Goals, and Dietary steps are optional
        return true;

      case 6:
        // Validate Ayurveda assessment - check if all questions in all sections are answered
        const allQuestionIds = ayurvedaSections.flatMap((section) => 
          section.questions.map((q) => q.id)
        );
        const missingAnswers = allQuestionIds.filter((qId) => {
          const answer = ayurvedaAnswers[qId];
          if (Array.isArray(answer)) {
            return answer.length === 0;
          }
          // Check if answer is missing (undefined, null, or empty string)
          // Note: false is a valid answer (means "No"), so we explicitly check for undefined/null/empty
          return answer === undefined || answer === null || answer === '';
        });
        if (missingAnswers.length > 0) {
          toast({
            title: "Validation Error",
            description: `Please answer all Ayurveda assessment questions. ${missingAnswers.length} questions remaining.`,
            variant: "destructive",
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Step 1: Update platform client
      const platformClientData: PlatformClientUpdate = {
        name: `${clientData.first_name} ${clientData.last_name}`.trim(),
        age: calculateAge(clientData.date_of_birth || "") || undefined,
        gender: mapGender(clientData.gender),
        height_cm: healthProfile.height,
        weight_kg: healthProfile.weight,
        location: clientData.city || undefined,
        external_client_id: clientData.email || undefined,
        wake_time: wakeTime || undefined,
        sleep_time: sleepTime || undefined,
        work_schedule_start: workScheduleStart || undefined,
        work_schedule_end: workScheduleEnd || undefined,
      };

      await platformClientApi.update(clientId, platformClientData);

      // Step 2: Create intake with all raw form data
      const rawInputData: Record<string, any> = {
        // Basic info
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        email: clientData.email,
        phone: clientData.phone,
        date_of_birth: clientData.date_of_birth,
        gender: clientData.gender,
        address: clientData.address,
        city: clientData.city,
        emergency_contact: {
          name: clientData.emergency_contact_name,
          phone: clientData.emergency_contact_phone,
          relation: clientData.emergency_contact_relation,
        },
        // Health profile
        height_cm: healthProfile.height,
        weight_kg: healthProfile.weight,
        waist_circumference: waistCircumference,
        activity_level: healthProfile.activity_level,
        goals: healthProfile.goals,
        disease: healthProfile.disease,
        allergies: healthProfile.allergies,
        supplements: healthProfile.supplements,
        medications: healthProfile.medications,
        diet_type: healthProfile.diet_type,
        sleep_cycle: healthProfile.sleep_cycle,
        // Medical history
        diagnosed_conditions: diagnosedConditions,
        surgery_history: surgeryHistory,
        structured_medications: structuredMedications,
        structured_allergies: structuredAllergies,
        blood_report: bloodReport,
        menstruation_cycle: menstruationCycle,
        // Lifestyle
        lifestyle: lifestyleExtended,
        // Daily schedule
        wake_time: wakeTime || undefined,
        sleep_time: sleepTime || undefined,
        work_schedule: (workScheduleStart && workScheduleEnd) ? {
          start: workScheduleStart,
          end: workScheduleEnd
        } : undefined,
        // Meal preferences
        explicit_meal_count: mealPreferences.explicit_meal_count,
        snack_preference: mealPreferences.snack_preference,
        liquid_meal_allowed: mealPreferences.liquid_meal_allowed,
        fasting_window: mealPreferences.fasting_window,
        max_meals: mealPreferences.max_meals,
        // Goals
        goals_extended: goalsExtended,
        // Dietary
        dietary_preferences: dietaryPreferencesList,
        food_preferences: foodPreferences,
        // Quiz answers
        ayurveda_assessment: ayurvedaAnswers,
      };

      // Step 2: Get or create intake
      const intakes = await platformIntakeApi.getByClientId(clientId);
      const latestIntake = intakes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      let intakeId = latestIntake?.id;
      
      if (intakeId) {
        // Update existing intake
        await platformIntakeApi.update(intakeId, {
          raw_input: rawInputData,
        });
      } else {
        // Create new intake if none exists
        const newIntake = await platformIntakeApi.create({
          client_id: clientId,
          raw_input: rawInputData,
          source: "manual",
        });
        intakeId = newIntake.id;
      }

      // Step 3: Build assessment snapshot from form data
      const assessmentSnapshot = buildAssessmentSnapshot(
        clientData,
        healthProfile,
        diagnosedConditions,
        surgeryHistory,
        bloodReport,
        waistCircumference,
        foodPreferences,
        dietaryPreferencesList,
        ayurvedaAnswers,
        lifestyleExtended,
        menstruationCycle,
        goalsExtended,
        wakeTime,
        sleepTime,
        workScheduleStart,
        workScheduleEnd,
        mealPreferences
      );

      // Step 4: Get or update assessment
      const assessments = await platformAssessmentApi.getByClientId(clientId);
      const latestAssessment = assessments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      if (latestAssessment?.id) {
        // Update existing assessment
        await platformAssessmentApi.update(latestAssessment.id, {
          assessment_snapshot: assessmentSnapshot,
        });
      } else {
        // Create new assessment if none exists
        await platformAssessmentApi.create({
          client_id: clientId,
          intake_id: intakeId,
          assessment_snapshot: assessmentSnapshot,
        });
      }

      toast({
        title: "Success!",
        description: "Client profile updated successfully.",
      });

      // Navigate to client details page
      navigate(`/client/${clientId}`);
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (loadingQuestions && currentStep === 6) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return <BasicInfoStep clientData={clientData} setClientData={setClientData} waistCircumference={waistCircumference} setWaistCircumference={setWaistCircumference} healthProfile={healthProfile} setHealthProfile={setHealthProfile} />;
      case 2:
        return <MedicalHistoryStep 
          diagnosedConditions={diagnosedConditions} 
          setDiagnosedConditions={setDiagnosedConditions}
          structuredMedications={structuredMedications}
          setStructuredMedications={setStructuredMedications}
          structuredAllergies={structuredAllergies}
          setStructuredAllergies={setStructuredAllergies}
          surgeryHistory={surgeryHistory}
          setSurgeryHistory={setSurgeryHistory}
          bloodReport={bloodReport}
          setBloodReport={setBloodReport}
          menstruationCycle={menstruationCycle}
          setMenstruationCycle={setMenstruationCycle}
          gender={clientData.gender}
        />;
      case 3:
        return <LifestyleStep 
          lifestyleExtended={lifestyleExtended}
          setLifestyleExtended={setLifestyleExtended}
          healthProfile={healthProfile}
          setHealthProfile={setHealthProfile}
          wakeTime={wakeTime}
          setWakeTime={setWakeTime}
          sleepTime={sleepTime}
          setSleepTime={setSleepTime}
          workScheduleStart={workScheduleStart}
          setWorkScheduleStart={setWorkScheduleStart}
          workScheduleEnd={workScheduleEnd}
          setWorkScheduleEnd={setWorkScheduleEnd}
          mealPreferences={mealPreferences}
          setMealPreferences={setMealPreferences}
        />;
      case 4:
        return <GoalsStep 
          goalsExtended={goalsExtended}
          setGoalsExtended={setGoalsExtended}
        />;
      case 5:
        return <DietaryStep 
          dietaryPreferencesList={dietaryPreferencesList}
          setDietaryPreferencesList={setDietaryPreferencesList}
          foodPreferences={foodPreferences}
          setFoodPreferences={setFoodPreferences}
        />;
      case 6:
        return <AyurvedaAssessment sections={ayurvedaSections} answers={ayurvedaAnswers} setAnswers={setAyurvedaAnswers} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-primary">Edit Client</h1>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;

              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground scale-110"
                          : isCompleted
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <p className={`text-sm font-medium mt-2 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-4 rounded ${isCompleted ? "bg-primary" : "bg-secondary"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || loading}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={loading} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Update Client
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

// Step 1: Basic Info
const BasicInfoStep = ({
  clientData,
  setClientData,
  waistCircumference,
  setWaistCircumference,
  healthProfile,
  setHealthProfile,
}: {
  clientData: Client;
  setClientData: React.Dispatch<React.SetStateAction<Client>>;
  waistCircumference?: number;
  setWaistCircumference: React.Dispatch<React.SetStateAction<number | undefined>>;
  healthProfile: HealthProfile;
  setHealthProfile: React.Dispatch<React.SetStateAction<HealthProfile>>;
}) => {
  // Calculate BMI
  const calculateBMI = () => {
    if (healthProfile.weight && healthProfile.height) {
      const heightInMeters = healthProfile.height / 100;
      return (healthProfile.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="first_name"
            value={clientData.first_name}
            onChange={(e) => setClientData({ ...clientData, first_name: e.target.value })}
            placeholder="Enter first name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="last_name"
            value={clientData.last_name}
            onChange={(e) => setClientData({ ...clientData, last_name: e.target.value })}
            placeholder="Enter last name"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={clientData.email}
            onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
            placeholder="client@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={clientData.phone}
            onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={clientData.date_of_birth}
            onChange={(e) => setClientData({ ...clientData, date_of_birth: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={clientData.gender} onValueChange={(value) => setClientData({ ...clientData, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">Height (cm)</Label>
          <Input
            id="height"
            type="number"
            min="0"
            step="0.1"
            value={healthProfile.height || ""}
            onChange={(e) => setHealthProfile({ ...healthProfile, height: parseFloat(e.target.value) || undefined })}
            placeholder="Height in cm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            min="0"
            step="0.1"
            value={healthProfile.weight || ""}
            onChange={(e) => setHealthProfile({ ...healthProfile, weight: parseFloat(e.target.value) || undefined })}
            placeholder="Weight in kg"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>BMI (Calculated)</Label>
          <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted">
            <span className="text-sm">{bmi || "Enter height & weight"}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="waist_circumference">Waist Circumference (cm)</Label>
          <Input
            id="waist_circumference"
            type="number"
            min="0"
            step="0.1"
            value={waistCircumference || ""}
            onChange={(e) => setWaistCircumference(parseFloat(e.target.value) || undefined)}
            placeholder="Waist in cm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={clientData.city || ""}
          onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
          placeholder="Enter city"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={clientData.address}
          onChange={(e) => setClientData({ ...clientData, address: e.target.value })}
          placeholder="Enter complete address"
          rows={3}
        />
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Name</Label>
            <Input
              id="emergency_contact_name"
              value={clientData.emergency_contact_name || ""}
              onChange={(e) => setClientData({ ...clientData, emergency_contact_name: e.target.value })}
              placeholder="Emergency contact name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              value={clientData.emergency_contact_phone || ""}
              onChange={(e) => setClientData({ ...clientData, emergency_contact_phone: e.target.value })}
              placeholder="Emergency contact phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_relation">Relation</Label>
            <Input
              id="emergency_contact_relation"
              value={clientData.emergency_contact_relation || ""}
              onChange={(e) => setClientData({ ...clientData, emergency_contact_relation: e.target.value })}
              placeholder="e.g., Spouse, Parent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 2: Health Profile
const HealthProfileStep = ({
  healthProfile,
  setHealthProfile,
  clientData,
}: {
  healthProfile: HealthProfile;
  setHealthProfile: React.Dispatch<React.SetStateAction<HealthProfile>>;
  clientData: Client;
}) => {
  // Calculate age from date of birth
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge(clientData.date_of_birth || "");

  // Height unit toggle
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [heightFeet, setHeightFeet] = useState<number>(0);
  const [heightInches, setHeightInches] = useState<number>(0);

  // Convert cm to feet/inches and vice versa
  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  const feetInchesToCm = (feet: number, inches: number) => {
    return Math.round((feet * 12 + inches) * 2.54 * 10) / 10;
  };

  useEffect(() => {
    if (healthProfile.height && heightUnit === "ft") {
      const { feet, inches } = cmToFeetInches(healthProfile.height);
      setHeightFeet(feet);
      setHeightInches(inches);
    }
  }, [healthProfile.height, heightUnit]);

  // Health goals - multi-select
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const availableGoals = [
    "Weight Loss",
    "Weight Gain",
    "Muscle Building",
    "Better Digestion",
    "Increased Energy",
    "Stress Management",
    "Better Sleep",
    "Skin Health",
    "Hair Health",
    "Hormonal Balance",
    "Immunity Boost",
    "Disease Management",
    "General Wellness",
  ];

  useEffect(() => {
    if (selectedGoals.length > 0) {
      setHealthProfile({ ...healthProfile, goals: selectedGoals.join(", ") });
    }
  }, [selectedGoals]);

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  // Sleep cycle slider
  const [sleepTime, setSleepTime] = useState<[number, number]>([23, 7]); // 11 PM to 7 AM
  
  useEffect(() => {
    const formatHour = (hour: number) => {
      if (hour === 0 || hour === 24) return "12 AM";
      if (hour < 12) return `${hour} AM`;
      if (hour === 12) return "12 PM";
      return `${hour - 12} PM`;
    };
    
    setHealthProfile({ 
      ...healthProfile, 
      sleep_cycle: `${formatHour(sleepTime[0])} - ${formatHour(sleepTime[1])}` 
    });
  }, [sleepTime]);

  const formatHour = (hour: number) => {
    if (hour === 0 || hour === 24) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  return (
    <div className="grid gap-6">
      {/* Age Display (Calculated) and Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Age (Calculated from DOB)</Label>
          <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted">
            <span className="text-sm">
              {calculatedAge !== null ? `${calculatedAge} years` : "Date of birth not provided"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            min="0"
            step="0.1"
            value={healthProfile.weight || ""}
            onChange={(e) => setHealthProfile({ ...healthProfile, weight: parseFloat(e.target.value) || undefined })}
            placeholder="Weight in kg"
          />
        </div>
      </div>

      {/* Height with Unit Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Height</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={heightUnit === "cm" ? "default" : "outline"}
              onClick={() => setHeightUnit("cm")}
            >
              cm
            </Button>
            <Button
              type="button"
              size="sm"
              variant={heightUnit === "ft" ? "default" : "outline"}
              onClick={() => setHeightUnit("ft")}
            >
              ft/in
            </Button>
          </div>
        </div>
        
        {heightUnit === "cm" ? (
          <Input
            type="number"
            min="0"
            step="0.1"
            value={healthProfile.height || ""}
            onChange={(e) => setHealthProfile({ ...healthProfile, height: parseFloat(e.target.value) || undefined })}
            placeholder="Height in centimeters"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max="8"
                value={heightFeet || ""}
                onChange={(e) => {
                  const feet = parseInt(e.target.value) || 0;
                  setHeightFeet(feet);
                  setHealthProfile({ ...healthProfile, height: feetInchesToCm(feet, heightInches) });
                }}
                placeholder="Feet"
              />
              <p className="text-xs text-muted-foreground">Feet</p>
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max="11"
                value={heightInches || ""}
                onChange={(e) => {
                  const inches = parseInt(e.target.value) || 0;
                  setHeightInches(inches);
                  setHealthProfile({ ...healthProfile, height: feetInchesToCm(heightFeet, inches) });
                }}
                placeholder="Inches"
              />
              <p className="text-xs text-muted-foreground">Inches</p>
            </div>
          </div>
        )}
      </div>

      {/* Health & Fitness Goals - Multi-select */}
      <div className="space-y-3">
        <Label>Health & Fitness Goals</Label>
        <div className="flex flex-wrap gap-2 p-3 rounded-md border min-h-[60px]">
          {selectedGoals.map((goal) => (
            <Badge key={goal} variant="secondary" className="gap-1">
              {goal}
              <X className="h-3 w-3 cursor-pointer" onClick={() => toggleGoal(goal)} />
            </Badge>
          ))}
          {selectedGoals.length === 0 && (
            <span className="text-sm text-muted-foreground">Select goals below</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableGoals.map((goal) => (
            <Button
              key={goal}
              type="button"
              size="sm"
              variant={selectedGoals.includes(goal) ? "default" : "outline"}
              onClick={() => toggleGoal(goal)}
              className="justify-start"
            >
              {goal}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Level and Diet Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="activity_level">Activity Level</Label>
          <Select
            value={healthProfile.activity_level}
            onValueChange={(value) => setHealthProfile({ ...healthProfile, activity_level: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select activity level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
              <SelectItem value="lightly_active">Lightly Active (1-3 days/week)</SelectItem>
              <SelectItem value="moderately_active">Moderately Active (3-5 days/week)</SelectItem>
              <SelectItem value="very_active">Very Active (6-7 days/week)</SelectItem>
              <SelectItem value="extremely_active">Extremely Active (athlete)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diet_type">Diet Type</Label>
          <Select
            value={healthProfile.diet_type}
            onValueChange={(value) => setHealthProfile({ ...healthProfile, diet_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select diet type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="veg">Vegetarian</SelectItem>
              <SelectItem value="non_veg">Non-Vegetarian</SelectItem>
              <SelectItem value="vegan">Vegan</SelectItem>
              <SelectItem value="eggetarian">Eggetarian</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Diseases / Health Conditions */}
      <div className="space-y-2">
        <Label htmlFor="disease">Current Diseases / Health Conditions</Label>
        <p className="text-xs text-muted-foreground">Will be prepopulated from knowledge base in future updates</p>
        <Textarea
          id="disease"
          value={healthProfile.disease}
          onChange={(e) => setHealthProfile({ ...healthProfile, disease: e.target.value })}
          placeholder="Diabetes, hypertension, thyroid, PCOS, IBS, etc."
          rows={2}
        />
      </div>

      {/* Allergies */}
      <div className="space-y-2">
        <Label htmlFor="allergies">Allergies</Label>
        <Textarea
          id="allergies"
          value={healthProfile.allergies}
          onChange={(e) => setHealthProfile({ ...healthProfile, allergies: e.target.value })}
          placeholder="Food allergies, environmental allergies, etc."
          rows={2}
        />
      </div>

      {/* Supplements and Medications */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplements">Current Supplements</Label>
          <Textarea
            id="supplements"
            value={healthProfile.supplements}
            onChange={(e) => setHealthProfile({ ...healthProfile, supplements: e.target.value })}
            placeholder="Vitamins, minerals, herbs, etc."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="medications">Current Medications</Label>
          <Textarea
            id="medications"
            value={healthProfile.medications}
            onChange={(e) => setHealthProfile({ ...healthProfile, medications: e.target.value })}
            placeholder="List all current medications"
            rows={2}
          />
        </div>
      </div>

      {/* Sleep Cycle - Time Range Slider */}
      <div className="space-y-3">
        <Label>Sleep Cycle</Label>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Bedtime:</span>
              <Badge variant="outline">{formatHour(sleepTime[0])}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Wake up:</span>
              <Badge variant="outline">{formatHour(sleepTime[1])}</Badge>
            </div>
          </div>
          <div className="px-2">
            <Slider
              value={sleepTime}
              onValueChange={(value) => setSleepTime(value as [number, number])}
              min={0}
              max={24}
              step={0.5}
              minStepsBetweenThumbs={4}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-2">
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span>6 PM</span>
            <span>12 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 2: Medical History
const MedicalHistoryStep = ({
  diagnosedConditions,
  setDiagnosedConditions,
  structuredMedications,
  setStructuredMedications,
  structuredAllergies,
  setStructuredAllergies,
  surgeryHistory,
  setSurgeryHistory,
  bloodReport,
  setBloodReport,
  menstruationCycle,
  setMenstruationCycle,
  gender,
}: {
  diagnosedConditions: Array<{condition: string, severity: string}>;
  setDiagnosedConditions: React.Dispatch<React.SetStateAction<Array<{condition: string, severity: string}>>>;
  structuredMedications: Array<{name: string, timing?: string}>;
  setStructuredMedications: React.Dispatch<React.SetStateAction<Array<{name: string, timing?: string}>>>;
  structuredAllergies: string[];
  setStructuredAllergies: React.Dispatch<React.SetStateAction<string[]>>;
  surgeryHistory: Array<{type: string, date?: string, notes?: string}>;
  setSurgeryHistory: React.Dispatch<React.SetStateAction<Array<{type: string, date?: string, notes?: string}>>>;
  bloodReport: {
    // CBC
    hb?: number, rbc?: number, wbc?: number, platelets?: number,
    // FBS + HbA1c
    fbs?: number, hba1c?: number,
    // Lipid Profile
    cholesterol?: number, triglycerides?: number, hdl?: number, ldl?: number,
    // LFT
    alt?: number, ast?: number, bilirubin?: number, albumin?: number,
    // KFT
    creatinine?: number, urea?: number, egfr?: number,
    // Vitamins
    vitamin_d?: number, vitamin_b12?: number,
    // TSH
    tsh?: number,
    // Ferritin
    ferritin?: number,
    // Metadata
    report_file_url?: string, report_date?: string
  } | null;
  setBloodReport: React.Dispatch<React.SetStateAction<{
    hb?: number, rbc?: number, wbc?: number, platelets?: number,
    fbs?: number, hba1c?: number,
    cholesterol?: number, triglycerides?: number, hdl?: number, ldl?: number,
    alt?: number, ast?: number, bilirubin?: number, albumin?: number,
    creatinine?: number, urea?: number, egfr?: number,
    vitamin_d?: number, vitamin_b12?: number,
    tsh?: number,
    ferritin?: number,
    report_file_url?: string, report_date?: string
  } | null>>;
  menstruationCycle: {cycle_length?: number, period_length?: number, last_period?: string, irregularities?: string[]} | null;
  setMenstruationCycle: React.Dispatch<React.SetStateAction<{cycle_length?: number, period_length?: number, last_period?: string, irregularities?: string[]} | null>>;
  gender?: string;
}) => {
  const [selectedAllergy, setSelectedAllergy] = useState<string>("");
  const [customAllergyInput, setCustomAllergyInput] = useState<string>("");
  const [uploadingReport, setUploadingReport] = useState(false);
  const { toast } = useToast();
  
  // Medical conditions from MNT rules KB - all available diagnoses
  const medicalConditions = [
    { value: "type_1_diabetes", label: "Type 1 Diabetes" },
    { value: "type_2_diabetes", label: "Type 2 Diabetes" },
    { value: "prediabetes", label: "Prediabetes" },
    { value: "gestational_diabetes", label: "Gestational Diabetes" },
    { value: "excess_carbohydrate_intake", label: "Excess Carbohydrate Intake" },
    { value: "hypertension", label: "Hypertension" },
    { value: "metabolic_syndrome", label: "Metabolic Syndrome" },
    { value: "dyslipidemia", label: "Dyslipidemia" },
    { value: "obesity", label: "Obesity" },
    { value: "overweight", label: "Overweight" },
    { value: "underweight", label: "Underweight" },
    { value: "inadequate_fiber_intake", label: "Inadequate Fiber Intake" },
    { value: "inadequate_protein_intake", label: "Inadequate Protein Intake" },
    { value: "pcos", label: "PCOS (Polycystic Ovary Syndrome)" },
    { value: "hypothyroidism", label: "Hypothyroidism" },
    { value: "ibs", label: "IBS (Irritable Bowel Syndrome)" },
    { value: "ibd", label: "IBD (Inflammatory Bowel Disease)" },
    { value: "ckd", label: "CKD (Chronic Kidney Disease)" },
    { value: "fatty_liver_disease", label: "Fatty Liver Disease" },
    { value: "osteoporosis", label: "Osteoporosis" },
    { value: "cardiovascular_disease", label: "Cardiovascular Disease" },
    { value: "iron_deficiency_anemia", label: "Iron Deficiency Anemia" },
    { value: "anemia", label: "Anemia" },
    { value: "gastritis", label: "Gastritis" },
    { value: "gerd", label: "GERD (Gastroesophageal Reflux Disease)" },
  ];

  const severityOptions = ["mild", "moderate", "severe"];

  // Get already selected conditions to prevent duplicates
  const selectedConditions = diagnosedConditions.map(c => c.condition);

  const addCondition = () => {
    setDiagnosedConditions([...diagnosedConditions, {condition: "", severity: "mild"}]);
  };

  const removeCondition = (index: number) => {
    setDiagnosedConditions(diagnosedConditions.filter((_, i) => i !== index));
  };

  const addMedication = () => {
    setStructuredMedications([...structuredMedications, {name: "", timing: ""}]);
  };

  const removeMedication = (index: number) => {
    setStructuredMedications(structuredMedications.filter((_, i) => i !== index));
  };

  const addSurgery = () => {
    setSurgeryHistory([...surgeryHistory, {type: "", date: "", notes: ""}]);
  };

  const removeSurgery = (index: number) => {
    setSurgeryHistory(surgeryHistory.filter((_, i) => i !== index));
  };

  return (
    <div className="grid gap-6">
      {/* Diagnosed Conditions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Diagnosed Conditions</Label>
          <Button type="button" size="sm" variant="outline" onClick={addCondition}>
            Add Condition
          </Button>
        </div>
        {diagnosedConditions.map((cond, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Select
                value={cond.condition}
                onValueChange={(value) => {
                  const updated = [...diagnosedConditions];
                  updated[index].condition = value;
                  setDiagnosedConditions(updated);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {medicalConditions.map((condition) => (
                    <SelectItem 
                      key={condition.value} 
                      value={condition.value}
                      disabled={selectedConditions.includes(condition.value) && cond.condition !== condition.value}
                    >
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Select
                value={cond.severity}
                onValueChange={(value) => {
                  const updated = [...diagnosedConditions];
                  updated[index].severity = value;
                  setDiagnosedConditions(updated);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {severityOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => removeCondition(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Medications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Medications</Label>
          <Button type="button" size="sm" variant="outline" onClick={addMedication}>
            Add Medication
          </Button>
        </div>
        {structuredMedications.map((med, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Input
                placeholder="Medication name"
                value={med.name}
                onChange={(e) => {
                  const updated = [...structuredMedications];
                  updated[index].name = e.target.value;
                  setStructuredMedications(updated);
                }}
              />
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Timing (e.g., morning)"
                value={med.timing || ""}
                onChange={(e) => {
                  const updated = [...structuredMedications];
                  updated[index].timing = e.target.value;
                  setStructuredMedications(updated);
                }}
              />
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={() => removeMedication(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Allergies */}
      <div className="space-y-3">
        <Label>Food Allergies</Label>
        
        {/* Selected Allergies Display */}
        {structuredAllergies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {structuredAllergies.map((allergy) => (
              <Badge key={allergy} variant="secondary" className="gap-1 pr-1">
                {allergy}
                <button
                  type="button"
                  onClick={() => setStructuredAllergies(structuredAllergies.filter(a => a !== allergy))}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        {/* Dropdown for Common Allergies */}
        <div className="space-y-2">
          <Select
            value={selectedAllergy}
            onValueChange={(value) => {
              if (value && !structuredAllergies.includes(value)) {
                setStructuredAllergies([...structuredAllergies, value]);
                setSelectedAllergy(""); // Reset select after adding
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select common allergies (Peanuts, Dairy, Gluten, etc.)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Peanuts">Peanuts</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
              <SelectItem value="Gluten">Gluten</SelectItem>
              <SelectItem value="Tree Nuts">Tree Nuts</SelectItem>
              <SelectItem value="Soy">Soy</SelectItem>
              <SelectItem value="Egg">Egg</SelectItem>
              <SelectItem value="Fish">Fish</SelectItem>
              <SelectItem value="Shellfish">Shellfish</SelectItem>
              <SelectItem value="Sesame">Sesame</SelectItem>
              <SelectItem value="Lactose">Lactose</SelectItem>
              <SelectItem value="Wheat">Wheat</SelectItem>
              <SelectItem value="Sulfites">Sulfites</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Custom Allergy Input */}
        <div className="space-y-2">
          <Input
            placeholder="Or enter a custom allergy and press Enter"
            value={customAllergyInput}
            onChange={(e) => setCustomAllergyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const value = customAllergyInput.trim();
                if (value && !structuredAllergies.includes(value)) {
                  setStructuredAllergies([...structuredAllergies, value]);
                  setCustomAllergyInput(""); // Clear input after adding
                }
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Type a custom allergy and press Enter to add it
          </p>
        </div>
      </div>

      {/* Surgery History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Surgery History</Label>
          <Button type="button" size="sm" variant="outline" onClick={addSurgery}>
            Add Surgery
          </Button>
        </div>
        {surgeryHistory.map((surgery, index) => (
          <div key={index} className="grid grid-cols-4 gap-4">
            <Input
              placeholder="Surgery type"
              value={surgery.type}
              onChange={(e) => {
                const updated = [...surgeryHistory];
                updated[index].type = e.target.value;
                setSurgeryHistory(updated);
              }}
            />
            <Input
              type="date"
              placeholder="Date"
              value={surgery.date || ""}
              onChange={(e) => {
                const updated = [...surgeryHistory];
                updated[index].date = e.target.value;
                setSurgeryHistory(updated);
              }}
            />
            <Input
              placeholder="Notes"
              value={surgery.notes || ""}
              onChange={(e) => {
                const updated = [...surgeryHistory];
                updated[index].notes = e.target.value;
                setSurgeryHistory(updated);
              }}
            />
            <Button type="button" size="sm" variant="ghost" onClick={() => removeSurgery(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Blood Report */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label>Blood Report (Optional)</Label>
          <Input
            type="date"
            placeholder="Report Date"
            value={bloodReport?.report_date || ""}
            onChange={(e) => setBloodReport({...bloodReport || {}, report_date: e.target.value || undefined})}
            className="w-auto"
          />
        </div>
        
        {/* File Upload Section */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Upload Blood Report</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                try {
                  setUploadingReport(true);
                  const result = await platformAssessmentApi.extractBloodReport(file);
                  
                  if (result.success && result.blood_report) {
                    // Merge extracted values with existing blood report
                    setBloodReport({
                      ...bloodReport || {},
                      ...result.blood_report,
                      report_file_url: file.name, // Store filename
                    });
                    
                    toast({
                      title: "Success",
                      description: "Blood report values extracted successfully!",
                    });
                  }
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to extract blood report values",
                    variant: "destructive",
                  });
                } finally {
                  setUploadingReport(false);
                  // Reset file input
                  e.target.value = "";
                }
              }}
              disabled={uploadingReport}
              className="flex-1"
            />
            {uploadingReport && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload a PDF or image of your blood report. Values will be automatically extracted using AI.
          </p>
        </div>
        
        {/* CBC */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">CBC (Complete Blood Count)</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              placeholder="Hemoglobin (Hb) g/dL"
              value={bloodReport?.hb || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, hb: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="RBC (million/µL)"
              value={bloodReport?.rbc || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, rbc: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="WBC (thousand/µL)"
              value={bloodReport?.wbc || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, wbc: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Platelets (thousand/µL)"
              value={bloodReport?.platelets || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, platelets: parseFloat(e.target.value) || undefined})}
            />
          </div>
        </div>

        {/* FBS + HbA1c */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">FBS + HbA1c</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              placeholder="FBS (Fasting Blood Sugar) mg/dL"
              value={bloodReport?.fbs || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, fbs: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="HbA1c (%)"
              value={bloodReport?.hba1c || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, hba1c: parseFloat(e.target.value) || undefined})}
            />
          </div>
        </div>

        {/* Lipid Profile */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Lipid Profile</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              placeholder="Total Cholesterol (mg/dL)"
              value={bloodReport?.cholesterol || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, cholesterol: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Triglycerides (mg/dL)"
              value={bloodReport?.triglycerides || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, triglycerides: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="HDL (mg/dL)"
              value={bloodReport?.hdl || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, hdl: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="LDL (mg/dL)"
              value={bloodReport?.ldl || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, ldl: parseFloat(e.target.value) || undefined})}
            />
          </div>
        </div>

        {/* LFT */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">LFT (Liver Function Tests)</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              placeholder="ALT (U/L)"
              value={bloodReport?.alt || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, alt: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="AST (U/L)"
              value={bloodReport?.ast || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, ast: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Bilirubin (mg/dL)"
              value={bloodReport?.bilirubin || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, bilirubin: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Albumin (g/dL)"
              value={bloodReport?.albumin || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, albumin: parseFloat(e.target.value) || undefined})}
            />
          </div>
        </div>

        {/* KFT */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">KFT (Kidney Function Tests)</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              placeholder="Creatinine (mg/dL)"
              value={bloodReport?.creatinine || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, creatinine: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Urea (mg/dL)"
              value={bloodReport?.urea || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, urea: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="eGFR (mL/min/1.73m²)"
              value={bloodReport?.egfr || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, egfr: parseFloat(e.target.value) || undefined})}
            />
          </div>
        </div>

        {/* Vitamins */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Vitamin D + B12</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              placeholder="Vitamin D (ng/mL)"
              value={bloodReport?.vitamin_d || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, vitamin_d: parseFloat(e.target.value) || undefined})}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="Vitamin B12 (pg/mL)"
              value={bloodReport?.vitamin_b12 || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, vitamin_b12: parseFloat(e.target.value) || undefined})}
            />
          </div>
        </div>

        {/* TSH */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">TSH</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.01"
              placeholder="TSH (mIU/L)"
              value={bloodReport?.tsh || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, tsh: parseFloat(e.target.value) || undefined})}
            />
          </div>
        </div>

        {/* Ferritin */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Ferritin</Label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              step="0.1"
              placeholder="Ferritin (ng/mL)"
              value={bloodReport?.ferritin || ""}
              onChange={(e) => setBloodReport({...bloodReport || {}, ferritin: parseFloat(e.target.value) || undefined})}
            />
          </div>
        </div>
      </div>

      {/* Menstruation Cycle (only for females) */}
      {gender === "female" && (
        <div className="space-y-4 border-t pt-4">
          <Label>Menstruation Cycle</Label>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              placeholder="Cycle Length (days)"
              value={menstruationCycle?.cycle_length || ""}
              onChange={(e) => setMenstruationCycle({...menstruationCycle || {}, cycle_length: parseInt(e.target.value) || undefined})}
            />
            <Input
              type="number"
              placeholder="Period Length (days)"
              value={menstruationCycle?.period_length || ""}
              onChange={(e) => setMenstruationCycle({...menstruationCycle || {}, period_length: parseInt(e.target.value) || undefined})}
            />
            <Input
              type="date"
              placeholder="Last Period"
              value={menstruationCycle?.last_period || ""}
              onChange={(e) => setMenstruationCycle({...menstruationCycle || {}, last_period: e.target.value || undefined})}
            />
          </div>
          <Textarea
            placeholder="Irregularities (separated by commas)"
            value={menstruationCycle?.irregularities?.join(", ") || ""}
            onChange={(e) => setMenstruationCycle({...menstruationCycle || {}, irregularities: e.target.value.split(",").map(i => i.trim()).filter(i => i)})}
            rows={2}
          />
        </div>
      )}
    </div>
  );
};

// Step 3: Lifestyle
const LifestyleStep = ({
  lifestyleExtended,
  setLifestyleExtended,
  healthProfile,
  setHealthProfile,
  wakeTime,
  setWakeTime,
  sleepTime,
  setSleepTime,
  workScheduleStart,
  setWorkScheduleStart,
  workScheduleEnd,
  setWorkScheduleEnd,
  mealPreferences,
  setMealPreferences,
}: {
  lifestyleExtended: {work_nature?: string, daily_routine?: string, exercise_routine?: {type?: string, frequency?: string, intensity?: string}, water_intake?: number, substance_use?: {smoking?: boolean, alcohol?: boolean, other?: string}, screen_time?: number, social_eating?: string};
  setLifestyleExtended: React.Dispatch<React.SetStateAction<any>>;
  healthProfile: HealthProfile;
  setHealthProfile: React.Dispatch<React.SetStateAction<HealthProfile>>;
  wakeTime: string;
  setWakeTime: React.Dispatch<React.SetStateAction<string>>;
  sleepTime: string;
  setSleepTime: React.Dispatch<React.SetStateAction<string>>;
  workScheduleStart: string;
  setWorkScheduleStart: React.Dispatch<React.SetStateAction<string>>;
  workScheduleEnd: string;
  setWorkScheduleEnd: React.Dispatch<React.SetStateAction<string>>;
  mealPreferences: {
    explicit_meal_count?: number;
    snack_preference?: boolean;
    liquid_meal_allowed?: boolean;
    fasting_window?: string;
    max_meals?: number;
  };
  setMealPreferences: React.Dispatch<React.SetStateAction<{
    explicit_meal_count?: number;
    snack_preference?: boolean;
    liquid_meal_allowed?: boolean;
    fasting_window?: string;
    max_meals?: number;
  }>>;
}) => {
  return (
    <div className="grid gap-6">
      <div className="space-y-2">
        <Label>Work Nature</Label>
        <Select
          value={lifestyleExtended.work_nature || ""}
          onValueChange={(value) => setLifestyleExtended({...lifestyleExtended, work_nature: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select work nature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desk_job">Desk Job</SelectItem>
            <SelectItem value="field_work">Field Work</SelectItem>
            <SelectItem value="shift_work">Shift Work</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 border-t pt-4">
        <Label className="text-base font-semibold">Daily Schedule</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wake_time">Wake Time</Label>
            <Input
              id="wake_time"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sleep_time">Sleep Time</Label>
            <Input
              id="sleep_time"
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="work_start">Work Start Time</Label>
            <Input
              id="work_start"
              type="time"
              value={workScheduleStart}
              onChange={(e) => setWorkScheduleStart(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="work_end">Work End Time</Label>
            <Input
              id="work_end"
              type="time"
              value={workScheduleEnd}
              onChange={(e) => setWorkScheduleEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <Label className="text-base font-semibold">Meal Preferences</Label>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="explicit_meal_count">Explicit Meal Count (optional)</Label>
            <Input
              id="explicit_meal_count"
              type="number"
              min="1"
              max="7"
              placeholder="e.g., 4"
              value={mealPreferences.explicit_meal_count || ""}
              onChange={(e) => setMealPreferences({
                ...mealPreferences,
                explicit_meal_count: e.target.value ? parseInt(e.target.value) : undefined
              })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="snack_preference"
              checked={mealPreferences.snack_preference ?? true}
              onChange={(e) => setMealPreferences({
                ...mealPreferences,
                snack_preference: e.target.checked
              })}
            />
            <Label htmlFor="snack_preference">Snack Preference</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="liquid_meal_allowed"
              checked={mealPreferences.liquid_meal_allowed ?? false}
              onChange={(e) => setMealPreferences({
                ...mealPreferences,
                liquid_meal_allowed: e.target.checked
              })}
            />
            <Label htmlFor="liquid_meal_allowed">Liquid Meal Allowed</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fasting_window">Fasting Window (optional, e.g., 16:8)</Label>
            <Input
              id="fasting_window"
              placeholder="e.g., 16:8"
              value={mealPreferences.fasting_window || ""}
              onChange={(e) => setMealPreferences({
                ...mealPreferences,
                fasting_window: e.target.value || undefined
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_meals">Max Meals</Label>
            <Input
              id="max_meals"
              type="number"
              min="1"
              max="7"
              value={mealPreferences.max_meals || 5}
              onChange={(e) => setMealPreferences({
                ...mealPreferences,
                max_meals: e.target.value ? parseInt(e.target.value) : 5
              })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Physical Activity Level</Label>
        <Select
          value={healthProfile.activity_level || ""}
          onValueChange={(value) => setHealthProfile({...healthProfile, activity_level: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select activity level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sedentary">Sedentary</SelectItem>
            <SelectItem value="lightly_active">Lightly Active</SelectItem>
            <SelectItem value="moderately_active">Moderately Active</SelectItem>
            <SelectItem value="very_active">Very Active</SelectItem>
            <SelectItem value="extremely_active">Extremely Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 border-t pt-4">
        <Label>Exercise Routine</Label>
        <div className="grid grid-cols-3 gap-4">
          <Input
            placeholder="Type (e.g., Running)"
            value={lifestyleExtended.exercise_routine?.type || ""}
            onChange={(e) => setLifestyleExtended({...lifestyleExtended, exercise_routine: {...lifestyleExtended.exercise_routine, type: e.target.value}})}
          />
          <Input
            placeholder="Frequency (e.g., 3x/week)"
            value={lifestyleExtended.exercise_routine?.frequency || ""}
            onChange={(e) => setLifestyleExtended({...lifestyleExtended, exercise_routine: {...lifestyleExtended.exercise_routine, frequency: e.target.value}})}
          />
          <Input
            placeholder="Intensity (e.g., Moderate)"
            value={lifestyleExtended.exercise_routine?.intensity || ""}
            onChange={(e) => setLifestyleExtended({...lifestyleExtended, exercise_routine: {...lifestyleExtended.exercise_routine, intensity: e.target.value}})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Water Intake (liters per day)</Label>
        <Input
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g., 2.5"
          value={lifestyleExtended.water_intake || ""}
          onChange={(e) => setLifestyleExtended({...lifestyleExtended, water_intake: parseFloat(e.target.value) || undefined})}
        />
      </div>

      <div className="space-y-4 border-t pt-4">
        <Label>Substance Use</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={lifestyleExtended.substance_use?.smoking || false}
              onChange={(e) => setLifestyleExtended({...lifestyleExtended, substance_use: {...lifestyleExtended.substance_use, smoking: e.target.checked}})}
            />
            <Label>Smoking</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={lifestyleExtended.substance_use?.alcohol || false}
              onChange={(e) => setLifestyleExtended({...lifestyleExtended, substance_use: {...lifestyleExtended.substance_use, alcohol: e.target.checked}})}
            />
            <Label>Alcohol</Label>
          </div>
          <Input
            placeholder="Other substances"
            value={lifestyleExtended.substance_use?.other || ""}
            onChange={(e) => setLifestyleExtended({...lifestyleExtended, substance_use: {...lifestyleExtended.substance_use, other: e.target.value}})}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Screen Time (hours per day)</Label>
        <Input
          type="number"
          min="0"
          max="24"
          placeholder="e.g., 6"
          value={lifestyleExtended.screen_time || ""}
          onChange={(e) => setLifestyleExtended({...lifestyleExtended, screen_time: parseFloat(e.target.value) || undefined})}
        />
      </div>

      <div className="space-y-2">
        <Label>Social Life & Eating Out Frequency</Label>
        <Select
          value={lifestyleExtended.social_eating || ""}
          onValueChange={(value) => setLifestyleExtended({...lifestyleExtended, social_eating: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="few_times_week">Few times a week</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="rarely">Rarely</SelectItem>
            <SelectItem value="never">Never</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Step 4: Goals
const GoalsStep = ({
  goalsExtended,
  setGoalsExtended,
}: {
  goalsExtended: {primary_goal?: string, secondary_goals?: string[], timeframe?: string, motivation_level?: string, past_attempts?: string, readiness_to_change?: number};
  setGoalsExtended: React.Dispatch<React.SetStateAction<any>>;
}) => {
  const goalOptions = ["Weight Loss", "Weight Gain", "Muscle Gain", "Fat Loss", "Hormonal Balance", "Gut Health", "Overall Wellness"];
  const secondaryGoalOptions = ["PCOS", "Thyroid", "Diabetes", "Cholesterol", "Skin Health", "Hair Health", "Strength & Endurance"];

  return (
    <div className="grid gap-6">
      <div className="space-y-2">
        <Label>Primary Goal</Label>
        <Select
          value={goalsExtended.primary_goal || ""}
          onValueChange={(value) => setGoalsExtended({...goalsExtended, primary_goal: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select primary goal" />
          </SelectTrigger>
          <SelectContent>
            {goalOptions.map((goal) => (
              <SelectItem key={goal} value={goal.toLowerCase().replace(/\s+/g, "_")}>{goal}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Secondary Goals</Label>
        <div className="flex flex-wrap gap-2">
          {secondaryGoalOptions.map((goal) => {
            const value = goal.toLowerCase().replace(/\s+/g, "_");
            const isSelected = goalsExtended.secondary_goals?.includes(value);
            return (
              <Badge
                key={goal}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const current = goalsExtended.secondary_goals || [];
                  if (isSelected) {
                    setGoalsExtended({...goalsExtended, secondary_goals: current.filter(g => g !== value)});
                  } else {
                    setGoalsExtended({...goalsExtended, secondary_goals: [...current, value]});
                  }
                }}
              >
                {goal}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Timeframe Expectation</Label>
        <Input
          placeholder="e.g., 3 months, 6 months"
          value={goalsExtended.timeframe || ""}
          onChange={(e) => setGoalsExtended({...goalsExtended, timeframe: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <Label>Motivation Level</Label>
        <Select
          value={goalsExtended.motivation_level || ""}
          onValueChange={(value) => setGoalsExtended({...goalsExtended, motivation_level: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select motivation level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Past Attempts & What Didn't Work</Label>
        <Textarea
          placeholder="Describe past attempts and what didn't work"
          value={goalsExtended.past_attempts || ""}
          onChange={(e) => setGoalsExtended({...goalsExtended, past_attempts: e.target.value})}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Readiness to Change: {goalsExtended.readiness_to_change || 5}/10</Label>
        <Slider
          value={[goalsExtended.readiness_to_change || 5]}
          onValueChange={(value) => setGoalsExtended({...goalsExtended, readiness_to_change: value[0]})}
          min={1}
          max={10}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 - Not Ready</span>
          <span>10 - Very Ready</span>
        </div>
      </div>
    </div>
  );
};

// Step 5: Dietary Assessment
const DietaryStep = ({
  dietaryPreferencesList,
  setDietaryPreferencesList,
  foodPreferences,
  setFoodPreferences,
}: {
  dietaryPreferencesList: string[];
  setDietaryPreferencesList: React.Dispatch<React.SetStateAction<string[]>>;
  foodPreferences: {likes?: string[], dislikes?: string[], favorite_foods?: string[], excluded_ingredients?: string[]};
  setFoodPreferences: React.Dispatch<React.SetStateAction<any>>;
}) => {
  const preferenceOptions = ["Veg", "Vegan", "Egg", "Dairy", "Jain", "Gluten-free", "Lactose-free"];

  return (
    <div className="grid gap-6">
      <div className="space-y-2">
        <Label>Food Preferences</Label>
        <div className="flex flex-wrap gap-2">
          {preferenceOptions.map((pref) => {
            const isSelected = dietaryPreferencesList.includes(pref);
            return (
              <Badge
                key={pref}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  if (isSelected) {
                    setDietaryPreferencesList(dietaryPreferencesList.filter(p => p !== pref));
                  } else {
                    setDietaryPreferencesList([...dietaryPreferencesList, pref]);
                  }
                }}
              >
                {pref}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Foods You Like</Label>
        <Textarea
          placeholder="Enter foods you like, separated by commas"
          value={foodPreferences.likes?.join(", ") || ""}
          onChange={(e) => setFoodPreferences({...foodPreferences, likes: e.target.value.split(",").map(f => f.trim()).filter(f => f)})}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Foods You Dislike</Label>
        <Textarea
          placeholder="Enter foods you dislike, separated by commas"
          value={foodPreferences.dislikes?.join(", ") || ""}
          onChange={(e) => setFoodPreferences({...foodPreferences, dislikes: e.target.value.split(",").map(f => f.trim()).filter(f => f)})}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Favorite Foods</Label>
        <Textarea
          placeholder="Enter your favorite foods, separated by commas"
          value={foodPreferences.favorite_foods?.join(", ") || ""}
          onChange={(e) => setFoodPreferences({...foodPreferences, favorite_foods: e.target.value.split(",").map(f => f.trim()).filter(f => f)})}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Ingredients You Don't Eat</Label>
        <Textarea
          placeholder="Enter ingredients you don't eat, separated by commas"
          value={foodPreferences.excluded_ingredients?.join(", ") || ""}
          onChange={(e) => setFoodPreferences({...foodPreferences, excluded_ingredients: e.target.value.split(",").map(f => f.trim()).filter(f => f)})}
          rows={3}
        />
      </div>
    </div>
  );
};

export default EditClient;

