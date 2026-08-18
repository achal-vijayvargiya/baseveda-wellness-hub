import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Play,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  Target,
  Utensils,
  Sparkles,
  FileText,
  Activity,
  ChefHat,
  Table,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  platformAssessmentApi,
  platformPlanApi,
  platformClientApi,
  type PlatformNCPStatusResponse,
  type PlatformDiagnosisResponse,
  type PlatformMNTResponse,
  type PlatformTargetResponse,
  type PlatformMealStructureResponse,
  type PlatformExchangeAllocationResponse,
  type PlatformAyurvedaResponse,
  type PlatformInterventionResponse,
  type PlatformRecipeResponse,
  type PlatformFoodAllocationResponse,
  type PlatformFoodApprovalResponse,
  type PlatformAssessmentResponse,
  type PlatformPlanResponse,
} from "@/lib/platform-api";
import { toast } from "sonner";

interface NCPProcessFlowProps {
  assessmentId: string;
  clientId: string;
  hideOverview?: boolean; // Hide the "All Steps Overview" section at the bottom
  currentStepIndex?: number; // Controlled current step index
  onStepChange?: (index: number) => void; // Callback when step changes
}

interface StepResult {
  assessment?: PlatformAssessmentResponse | null;
  diagnosis?: PlatformDiagnosisResponse | null;
  mnt?: PlatformMNTResponse | null;
  targets?: PlatformTargetResponse | null;
  meal_structure?: PlatformMealStructureResponse | null;
  exchange_allocation?: PlatformExchangeAllocationResponse | null;
  ayurveda?: PlatformAyurvedaResponse | null;
  intervention?: PlatformInterventionResponse | null;
  food_allocation?: PlatformFoodAllocationResponse | null;
  food_approval?: PlatformFoodApprovalResponse | null;
  recipe_generation?: PlatformRecipeResponse | null;
}

const NCP_STEPS = [
  {
    id: "intake",
    name: "Intake",
    description: "Client intake data collection",
    icon: FileText,
    alwaysCompleted: true,
  },
  {
    id: "assessment",
    name: "Assessment",
    description: "Comprehensive health assessment",
    icon: FileText,
    alwaysCompleted: true,
  },
  {
    id: "diagnosis",
    name: "Diagnosis",
    description: "Medical conditions & nutrition diagnoses",
    icon: Stethoscope,
    executeEndpoint: "processDiagnosis",
    getEndpoint: "getDiagnosis",
  },
  {
    id: "mnt",
    name: "MNT Constraints",
    description: "Medical Nutrition Therapy constraints",
    icon: Target,
    executeEndpoint: "processMNT",
    getEndpoint: "getMNT",
  },
  {
    id: "targets",
    name: "Nutrition Targets",
    description: "Calories, macros, and micronutrients",
    icon: Target,
    executeEndpoint: "processTargets",
    getEndpoint: "getTargets",
  },
  {
    id: "meal_structure",
    name: "Meal Structure",
    description: "Meal count, timing, and calorie distribution",
    icon: Utensils,
    executeEndpoint: "processMealStructure",
    getEndpoint: "getMealStructure",
  },
  {
    id: "exchange_allocation",
    name: "Exchange Allocation",
    description: "Allocate exchanges per meal",
    icon: Target,
    executeEndpoint: "processExchangeAllocation",
    getEndpoint: "getExchangeAllocation",
  },
  {
    id: "ayurveda",
    name: "Ayurveda Advisory",
    description: "Dosha assessment & lifestyle guidelines",
    icon: Sparkles,
    executeEndpoint: "processAyurveda",
    getEndpoint: "getAyurveda",
  },
  {
    id: "intervention",
    name: "Food Intervention",
    description: "Generate meal plan with foods",
    icon: Utensils,
    executeEndpoint: "processIntervention",
    getEndpoint: "getIntervention",
  },
  {
    id: "food_allocation",
    name: "Food Allocation",
    description: "Allocate foods to meals (Phase 1)",
    icon: Utensils,
    executeEndpoint: "processFoodAllocation",
    getEndpoint: "getFoodAllocation",
  },
  {
    id: "recipe_generation",
    name: "Recipe Generation",
    description: "Generate recipes for approved meals (Phase 2)",
    icon: ChefHat,
    executeEndpoint: "processRecipeGeneration",
    getEndpoint: "getRecipeGeneration",
  },
];

export const NCPProcessFlow = ({ 
  assessmentId, 
  clientId, 
  hideOverview = false,
  currentStepIndex: controlledStepIndex,
  onStepChange
}: NCPProcessFlowProps) => {
  const [status, setStatus] = useState<PlatformNCPStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [executingStep, setExecutingStep] = useState<string | null>(null);
  const [stepResults, setStepResults] = useState<StepResult>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [internalStepIndex, setInternalStepIndex] = useState(0);
  
  // Use controlled index if provided, otherwise use internal state
  const currentStepIndex = controlledStepIndex !== undefined ? controlledStepIndex : internalStepIndex;
  const setCurrentStepIndex = (index: number) => {
    if (onStepChange) {
      onStepChange(index);
    } else {
      setInternalStepIndex(index);
    }
  };
  const [showTargetsDialog, setShowTargetsDialog] = useState(false);
  const [showMealStructureDialog, setShowMealStructureDialog] = useState(false);
  const [showExchangeSelectionDialog, setShowExchangeSelectionDialog] = useState(false);
  const [showExchangeTableDialog, setShowExchangeTableDialog] = useState(false);
  const [showInterventionFoodsDialog, setShowInterventionFoodsDialog] = useState(false);
  const [showFoodAllocationApprovalDialog, setShowFoodAllocationApprovalDialog] = useState(false);
  const [mealStructure, setMealStructure] = useState<PlatformMealStructureResponse | null>(null);
  const [loadingMealStructure, setLoadingMealStructure] = useState(false);
  const [selectedExchangesPerMeal, setSelectedExchangesPerMeal] = useState<Record<string, Set<string>>>({});
  const [mealApprovals, setMealApprovals] = useState<Record<string, Record<string, boolean>>>({});  // {day_number: {meal_name: is_approved}}
  const [clientData, setClientData] = useState<any>(null);
  
  // Hardcoded exchange categories from core_food_groups_kb.json
  const exchangeCategories = [
    { exchange_category_id: "cereal", display_name: "Cereal/Grain" },
    { exchange_category_id: "pulse", display_name: "Pulse/Legume" },
    { exchange_category_id: "vegetable_non_starchy", display_name: "Non-Starchy Vegetable" },
    { exchange_category_id: "vegetable_starchy", display_name: "Starchy Vegetable" },
    { exchange_category_id: "fruit", display_name: "Fruit" },
    { exchange_category_id: "milk", display_name: "Milk & Dairy" },
    { exchange_category_id: "egg_whites", display_name: "Egg" },
    { exchange_category_id: "paneer", display_name: "Paneer/Cheese" },
    { exchange_category_id: "nuts_seeds", display_name: "Nuts & Seeds" },
    { exchange_category_id: "fat", display_name: "Fat/Oil" },
    { exchange_category_id: "jaggery", display_name: "Sugar/Jaggery" },
  ];

  useEffect(() => {
    fetchStatus();
    // Fetch client data for fallback
    if (clientId) {
      platformClientApi.getById(clientId).then(setClientData).catch(console.error);
    }
  }, [assessmentId, clientId]);

  // Fetch meal structure when exchange selection dialog opens
  useEffect(() => {
    if (showExchangeSelectionDialog && assessmentId) {
      const fetchMealStructure = async () => {
        try {
          setLoadingMealStructure(true);
          const mealStructureData = await platformAssessmentApi.getMealStructure(assessmentId);
          setMealStructure(mealStructureData);
          
          // Initialize selectedExchangesPerMeal with empty sets for each meal
          const initialPerMeal: Record<string, Set<string>> = {};
          mealStructureData.meals.forEach((meal) => {
            initialPerMeal[meal] = new Set();
          });
          setSelectedExchangesPerMeal(initialPerMeal);
        } catch (error: any) {
          console.error("Failed to fetch meal structure:", error);
          toast.error("Failed to load meal structure");
        } finally {
          setLoadingMealStructure(false);
        }
      };
      fetchMealStructure();
    }
  }, [showExchangeSelectionDialog, assessmentId]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const statusData = await platformAssessmentApi.getNCPStatus(assessmentId);
      setStatus(statusData);
      
      // Set current step index based on current_step (only if not controlled)
      if (controlledStepIndex === undefined) {
        const stepIndex = NCP_STEPS.findIndex((s) => s.id === statusData.current_step);
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
      }

      // Fetch results for completed steps
      await fetchCompletedStepResults(statusData);
    } catch (error: any) {
      console.error("Failed to fetch NCP status:", error);
      toast.error(error.message || "Failed to load NCP status");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedStepResults = async (statusData: PlatformNCPStatusResponse) => {
    const results: StepResult = {};

    // Fetch assessment data (always available if assessment exists)
    try {
      const assessment = await platformAssessmentApi.getById(assessmentId);
      results.assessment = assessment;
    } catch (error) {
      console.error("Failed to fetch assessment results:", error);
    }

    try {
      if (statusData.steps.diagnosis) {
        const diagnosis = await platformAssessmentApi.getDiagnosis(assessmentId);
        results.diagnosis = diagnosis;
      }
    } catch (error) {
      console.error("Failed to fetch diagnosis results:", error);
    }

    try {
      if (statusData.steps.mnt) {
        const mnt = await platformAssessmentApi.getMNT(assessmentId);
        results.mnt = mnt;
      }
    } catch (error) {
      console.error("Failed to fetch MNT results:", error);
    }

    try {
      if (statusData.steps.targets) {
        const targets = await platformAssessmentApi.getTargets(assessmentId);
        results.targets = targets;
      }
    } catch (error) {
      console.error("Failed to fetch targets results:", error);
    }

    try {
      if (statusData.steps.meal_structure) {
        const mealStructure = await platformAssessmentApi.getMealStructure(assessmentId);
        results.meal_structure = mealStructure;
      }
    } catch (error) {
      console.error("Failed to fetch meal structure results:", error);
    }

    try {
      if (statusData.steps.exchange_allocation) {
        const exchangeAllocation = await platformAssessmentApi.getExchangeAllocation(assessmentId);
        results.exchange_allocation = exchangeAllocation;
      }
    } catch (error) {
      console.error("Failed to fetch exchange allocation results:", error);
    }

    try {
      if (statusData.steps.ayurveda) {
        const ayurveda = await platformAssessmentApi.getAyurveda(assessmentId);
        results.ayurveda = ayurveda;
      }
    } catch (error) {
      console.error("Failed to fetch Ayurveda results:", error);
    }

    try {
      if (statusData.steps.intervention) {
        const intervention = await platformAssessmentApi.getIntervention(assessmentId);
        results.intervention = intervention;
      }
    } catch (error) {
      console.error("Failed to fetch intervention results:", error);
    }

    try {
      if (statusData.steps.food_allocation) {
        const foodAllocation = await platformAssessmentApi.getFoodAllocation(assessmentId);
        results.food_allocation = foodAllocation;
        
        // Also fetch approval status
        try {
          const approvals = await platformAssessmentApi.getFoodAllocationApprovals(assessmentId);
          results.food_approval = approvals;
          
          // Build approval map for UI
          const approvalMap: Record<string, Record<string, boolean>> = {};
          if (foodAllocation.meal_allocation?.days) {
            Object.keys(foodAllocation.meal_allocation.days).forEach((dayKey) => {
              const dayData = foodAllocation.meal_allocation.days[dayKey];
              const dayNumber = `day_${dayData.day_number}`;
              approvalMap[dayNumber] = {};
              
              Object.keys(dayData.meals || {}).forEach((mealName) => {
                // Check if this meal is approved
                const isApproved = approvals.approved_meals.some(
                  (m) => m.day_number === dayNumber && m.meal_name === mealName
                );
                approvalMap[dayNumber][mealName] = isApproved;
              });
            });
          }
          setMealApprovals(approvalMap);
        } catch (error) {
          console.error("Failed to fetch approval status:", error);
          // Initialize empty approval map if fetch fails
          const approvalMap: Record<string, Record<string, boolean>> = {};
          if (foodAllocation.meal_allocation?.days) {
            Object.keys(foodAllocation.meal_allocation.days).forEach((dayKey) => {
              const dayData = foodAllocation.meal_allocation.days[dayKey];
              const dayNumber = `day_${dayData.day_number}`;
              approvalMap[dayNumber] = {};
              Object.keys(dayData.meals || {}).forEach((mealName) => {
                approvalMap[dayNumber][mealName] = false;
              });
            });
          }
          setMealApprovals(approvalMap);
        }
      }
    } catch (error) {
      console.error("Failed to fetch food allocation results:", error);
    }

    try {
      if (statusData.steps.recipe_generation) {
        const recipeGeneration = await platformAssessmentApi.getRecipeGeneration(assessmentId);
        results.recipe_generation = recipeGeneration;
      }
    } catch (error) {
      console.error("Failed to fetch recipe generation results:", error);
    }

    setStepResults(results);
  };

  const executeStep = async (stepId: string) => {
    if (!status) return;

    try {
      setExecutingStep(stepId);
      toast.loading(`Executing ${NCP_STEPS.find((s) => s.id === stepId)?.name}...`, {
        id: `execute-${stepId}`,
      });

      let result;
      const step = NCP_STEPS.find((s) => s.id === stepId);

      if (stepId === "diagnosis") {
        result = await platformAssessmentApi.processDiagnosis(assessmentId);
        setStepResults((prev) => ({ ...prev, diagnosis: result }));
        
        // Check if diagnosis returned empty results
        if (result && (!result.medical_conditions || result.medical_conditions.length === 0) && 
            (!result.nutrition_diagnoses || result.nutrition_diagnoses.length === 0)) {
          toast.warning("Diagnosis completed but no conditions were found. Check assessment data.", { 
            id: `execute-${stepId}`,
            duration: 5000 
          });
        } else {
          toast.success(`${step?.name} completed successfully!`, { id: `execute-${stepId}` });
        }
      } else if (stepId === "mnt") {
        result = await platformAssessmentApi.processMNT(assessmentId);
        setStepResults((prev) => ({ ...prev, mnt: result }));
        toast.success(`${step?.name} completed successfully!`, { id: `execute-${stepId}` });
      } else if (stepId === "targets") {
        result = await platformAssessmentApi.processTargets(assessmentId);
        setStepResults((prev) => ({ ...prev, targets: result }));
        toast.success(`${step?.name} completed successfully!`, { id: `execute-${stepId}` });
      } else if (stepId === "meal_structure") {
        result = await platformAssessmentApi.processMealStructure(assessmentId);
        setStepResults((prev) => ({ ...prev, meal_structure: result }));
        toast.success(`${step?.name} completed successfully!`, { id: `execute-${stepId}` });
      } else if (stepId === "exchange_allocation") {
        // Show exchange selection dialog
        setShowExchangeSelectionDialog(true);
        setExecutingStep(null); // Reset executing step since actual execution happens after selection
        return; // Return early, actual execution happens after selection
      } else if (stepId === "ayurveda") {
        result = await platformAssessmentApi.processAyurveda(assessmentId);
        setStepResults((prev) => ({ ...prev, ayurveda: result }));
        toast.success(`${step?.name} completed successfully!`, { id: `execute-${stepId}` });
      } else if (stepId === "intervention") {
        result = await platformAssessmentApi.processIntervention(assessmentId);
        setStepResults((prev) => ({ ...prev, intervention: result }));
        toast.success(`${step?.name} completed successfully!`, { id: `execute-${stepId}` });
      } else if (stepId === "food_allocation") {
        result = await platformAssessmentApi.processFoodAllocation(assessmentId);
        setStepResults((prev) => ({ ...prev, food_allocation: result }));
        
        // Initialize approval map for all meals (default to false)
        const approvalMap: Record<string, Record<string, boolean>> = {};
        if (result.meal_allocation?.days) {
          Object.keys(result.meal_allocation.days).forEach((dayKey) => {
            const dayData = result.meal_allocation.days[dayKey];
            const dayNumber = `day_${dayData.day_number}`;
            approvalMap[dayNumber] = {};
            Object.keys(dayData.meals || {}).forEach((mealName) => {
              approvalMap[dayNumber][mealName] = false;  // Default to not approved
            });
          });
        }
        setMealApprovals(approvalMap);
        
        toast.success(`${step?.name} completed successfully!`, { id: `execute-${stepId}` });
        
        // Show approval dialog after food allocation
        setShowFoodAllocationApprovalDialog(true);
        setExecutingStep(null);
        return;
      } else if (stepId === "recipe_generation") {
        // Check if meals are approved
        const approvals = await platformAssessmentApi.getFoodAllocationApprovals(assessmentId);
        if (approvals.total_approved === 0) {
          toast.error("Please approve food allocations before generating recipes", {
            id: `execute-${stepId}`,
            duration: 5000
          });
          setExecutingStep(null);
          return;
        }
        
        result = await platformAssessmentApi.processRecipeGeneration(assessmentId);
        setStepResults((prev) => ({ ...prev, recipe_generation: result }));
        toast.success(`${step?.name} completed successfully!`, { id: `execute-${stepId}` });
      }
      
      // Refresh status after execution
      await fetchStatus();
    } catch (error: any) {
      console.error(`Failed to execute ${stepId}:`, error);
      toast.error(error.message || `Failed to execute ${stepId}`, {
        id: `execute-${stepId}`,
      });
    } finally {
      setExecutingStep(null);
    }
  };

  const handleApproveFoodAllocation = async () => {
    if (!status) return;

    try {
      setExecutingStep("food_allocation");
      toast.loading("Saving food allocation approvals...", {
        id: "approve-food-allocation",
      });

      const result = await platformAssessmentApi.approveFoodAllocation(
        assessmentId,
        mealApprovals
      );

      setStepResults((prev) => ({ ...prev, food_approval: result }));
      setShowFoodAllocationApprovalDialog(false);
      
      toast.success(
        `Approved ${result.total_approved} meals. You can now generate recipes.`,
        { id: "approve-food-allocation", duration: 5000 }
      );

      // Refresh status
      await fetchStatus();
    } catch (error: any) {
      console.error("Failed to approve food allocation:", error);
      toast.error(error.message || "Failed to approve food allocation", {
        id: "approve-food-allocation",
      });
    } finally {
      setExecutingStep(null);
    }
  };

  const handleExecuteExchangeAllocation = async () => {
    if (!status) return;

    try {
      setExecutingStep("exchange_allocation");
      toast.loading(`Executing Exchange Allocation...`, {
        id: "execute-exchange_allocation",
      });

      // Convert per-meal selected exchanges to format expected by API
      const mandatoryExchangesPerMeal: Record<string, string[]> = {};
      Object.entries(selectedExchangesPerMeal).forEach(([mealName, exchangeSet]) => {
        if (exchangeSet.size > 0) {
          mandatoryExchangesPerMeal[mealName] = Array.from(exchangeSet);
        }
      });

      const result = await platformAssessmentApi.processExchangeAllocation(
        assessmentId,
        Object.keys(mandatoryExchangesPerMeal).length > 0 ? mandatoryExchangesPerMeal : undefined
      );
      setStepResults((prev) => ({ ...prev, exchange_allocation: result }));
      toast.success(`Exchange Allocation completed successfully!`, { id: "execute-exchange_allocation" });
      setShowExchangeSelectionDialog(false);
      setSelectedExchangesPerMeal({});

      // Refresh status after execution (but don't refetch results since we already have them)
      try {
        const statusData = await platformAssessmentApi.getNCPStatus(assessmentId);
        setStatus(statusData);
        // Update current step index based on current_step
        const stepIndex = NCP_STEPS.findIndex((s) => s.id === statusData.current_step);
        setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
      } catch (error) {
        console.error("Failed to refresh status:", error);
      }
    } catch (error: any) {
      console.error("Failed to execute exchange_allocation:", error);
      toast.error(error.message || "Failed to execute exchange allocation", {
        id: "execute-exchange_allocation",
      });
    } finally {
      setExecutingStep(null);
    }
  };

  const canExecuteStep = (stepId: string): boolean => {
    if (!status) return false;

    const stepIndex = NCP_STEPS.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return false;

    // First two steps are always completed
    if (stepIndex < 2) return false;

    // Check if previous step is completed
    const previousStep = NCP_STEPS[stepIndex - 1];
    if (previousStep) {
      const prevStepId = previousStep.id;
      return status.steps[prevStepId as keyof typeof status.steps] === true;
    }

    return false;
  };

  const isStepCompleted = (stepId: string): boolean => {
    if (!status) return false;
    const step = NCP_STEPS.find((s) => s.id === stepId);
    if (step?.alwaysCompleted) return true;
    return status.steps[stepId as keyof typeof status.steps] === true;
  };

  const isStepActive = (stepId: string): boolean => {
    return status?.current_step === stepId;
  };

  const handleNext = () => {
    if (currentStepIndex < NCP_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const exportResults = (stepId: string, data: any) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${stepId}_results.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported");
  };

  const renderStepResult = (stepId: string) => {
    const step = NCP_STEPS.find((s) => s.id === stepId);
    if (!step) return null;

    const result = stepResults[stepId as keyof StepResult];
    if (!result) {
      // Check if step is completed but result not loaded yet
      if (status?.steps[stepId as keyof typeof status.steps]) {
        return (
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Results are available. Please refresh to load them.
            </p>
          </div>
        );
      }
      return null;
    }

    // For assessment and intake, show results directly (not in accordion)
    const showDirectly = stepId === "assessment" || stepId === "intake";

    const resultContent = (
      <div className="space-y-4 pt-2">
              {stepId === "assessment" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Assessment Status</p>
                      <p className="text-lg font-semibold capitalize">
                        {(result as PlatformAssessmentResponse).assessment_status || "Draft"}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Created At</p>
                      <p className="text-sm font-medium">
                        {new Date((result as PlatformAssessmentResponse).created_at).toLocaleDateString()}
                      </p>
                    </Card>
                  </div>
                  {(result as PlatformAssessmentResponse).assessment_snapshot && 
                   Object.keys((result as PlatformAssessmentResponse).assessment_snapshot).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Assessment Snapshot</h4>
                      <Card className="p-4">
                        <div className="space-y-4">
                          {/* Client Context */}
                          {(result as PlatformAssessmentResponse).assessment_snapshot.client_context && (
                            <div>
                              <h5 className="font-medium mb-2 text-sm">Client Context</h5>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify((result as PlatformAssessmentResponse).assessment_snapshot.client_context, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Clinical Data */}
                          {(result as PlatformAssessmentResponse).assessment_snapshot.clinical_data && (
                            <div>
                              <h5 className="font-medium mb-2 text-sm">Clinical Data</h5>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify((result as PlatformAssessmentResponse).assessment_snapshot.clinical_data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Lifestyle Data */}
                          {(result as PlatformAssessmentResponse).assessment_snapshot.lifestyle_data && (
                            <div>
                              <h5 className="font-medium mb-2 text-sm">Lifestyle Data</h5>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify((result as PlatformAssessmentResponse).assessment_snapshot.lifestyle_data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Diet Data */}
                          {(result as PlatformAssessmentResponse).assessment_snapshot.diet_data && (
                            <div>
                              <h5 className="font-medium mb-2 text-sm">Diet Data</h5>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify((result as PlatformAssessmentResponse).assessment_snapshot.diet_data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Goals */}
                          {(result as PlatformAssessmentResponse).assessment_snapshot.goals && (
                            <div>
                              <h5 className="font-medium mb-2 text-sm">Goals</h5>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify((result as PlatformAssessmentResponse).assessment_snapshot.goals, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Ayurveda Data */}
                          {(result as PlatformAssessmentResponse).assessment_snapshot.ayurveda_data && (
                            <div>
                              <h5 className="font-medium mb-2 text-sm">Ayurveda Data</h5>
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify((result as PlatformAssessmentResponse).assessment_snapshot.ayurveda_data, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                          
                          {/* Full Snapshot (if other sections don't exist) */}
                          {!(result as PlatformAssessmentResponse).assessment_snapshot.client_context &&
                           !(result as PlatformAssessmentResponse).assessment_snapshot.clinical_data &&
                           !(result as PlatformAssessmentResponse).assessment_snapshot.lifestyle_data &&
                           !(result as PlatformAssessmentResponse).assessment_snapshot.diet_data &&
                           !(result as PlatformAssessmentResponse).assessment_snapshot.goals &&
                           !(result as PlatformAssessmentResponse).assessment_snapshot.ayurveda_data && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <pre className="text-xs overflow-auto">
                                {JSON.stringify((result as PlatformAssessmentResponse).assessment_snapshot, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  )}
                  {(!(result as PlatformAssessmentResponse).assessment_snapshot || 
                    Object.keys((result as PlatformAssessmentResponse).assessment_snapshot).length === 0) && (
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Assessment snapshot is empty. Assessment data will be populated as you progress through the NCP steps.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {stepId === "diagnosis" && (
                <div className="space-y-4">
                  {((result as any).medical_conditions?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Medical Conditions</h4>
                      <div className="space-y-2">
                        {(result as any).medical_conditions.map((condition: any, idx: number) => (
                          <Card key={idx} className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{condition.diagnosis_id}</p>
                                {condition.severity_score && (
                                  <p className="text-sm text-muted-foreground">
                                    Severity: {condition.severity_score}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {((result as any).nutrition_diagnoses?.length ?? 0) > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Nutrition Diagnoses</h4>
                      <div className="space-y-2">
                        {(result as any).nutrition_diagnoses.map((diagnosis: any, idx: number) => (
                          <Card key={idx} className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{diagnosis.diagnosis_id}</p>
                                {diagnosis.severity_score && (
                                  <p className="text-sm text-muted-foreground">
                                    Severity: {diagnosis.severity_score}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {(((result as any).medical_conditions?.length ?? 0) === 0) &&
                    (((result as any).nutrition_diagnoses?.length ?? 0) === 0) && (
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Diagnosis ran successfully, but no conditions or nutrition diagnoses were found.
                        </p>
                      </div>
                    )}
                </div>
              )}

              {stepId === "mnt" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Macro Constraints</h4>
                    <Card className="p-3">
                      <pre className="text-sm overflow-auto">
                        {JSON.stringify((result as PlatformMNTResponse).macro_constraints, null, 2)}
                      </pre>
                    </Card>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Micro Constraints</h4>
                    <Card className="p-3">
                      <pre className="text-sm overflow-auto">
                        {JSON.stringify((result as PlatformMNTResponse).micro_constraints, null, 2)}
                      </pre>
                    </Card>
                  </div>
                  {(result as PlatformMNTResponse).food_exclusions?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Food Exclusions</h4>
                      <div className="flex flex-wrap gap-2">
                        {(result as PlatformMNTResponse).food_exclusions.map((food: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {food}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {stepId === "targets" && result && (result as any).calories_target !== undefined && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click "View Table" below to see the complete nutrition targets breakdown.
                  </p>
                </div>
              )}

              {stepId === "meal_structure" && result && ((result as any).meal_count !== undefined || (result as any).meals) && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Click "View Table" below to see the complete meal structure breakdown.
                  </p>
                </div>
              )}

              {stepId === "exchange_allocation" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Exchanges Per Meal</h4>
                    <Card className="p-3">
                      <div className="space-y-3">
                        {Object.entries((result as PlatformExchangeAllocationResponse).exchanges_per_meal || {}).map(([meal, exchanges]) => (
                          <div key={meal}>
                            <p className="font-medium capitalize mb-2">{meal}</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {Object.entries(exchanges as Record<string, number>).map(([category, count]) => (
                                <div key={category} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                  <span className="text-sm capitalize">{category}:</span>
                                  <span className="text-sm font-medium">{count}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                  {(result as PlatformExchangeAllocationResponse).notes && Object.keys((result as PlatformExchangeAllocationResponse).notes).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Notes</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto">
                          {JSON.stringify((result as PlatformExchangeAllocationResponse).notes, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {stepId === "ayurveda" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {(result as PlatformAyurvedaResponse).dosha_primary && (
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Primary Dosha</p>
                        <p className="text-xl font-bold capitalize">{(result as PlatformAyurvedaResponse).dosha_primary}</p>
                      </Card>
                    )}
                    {(result as PlatformAyurvedaResponse).dosha_secondary && (
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Secondary Dosha</p>
                        <p className="text-xl font-bold capitalize">
                          {(result as PlatformAyurvedaResponse).dosha_secondary}
                        </p>
                      </Card>
                    )}
                  </div>
                  {(result as PlatformAyurvedaResponse).lifestyle_guidelines && (
                    <div>
                      <h4 className="font-semibold mb-2">Lifestyle Guidelines</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto">
                          {JSON.stringify((result as PlatformAyurvedaResponse).lifestyle_guidelines, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {stepId === "intervention" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan ID</p>
                      <p className="text-xs font-mono truncate">
                        {(result as PlatformInterventionResponse).plan_id || "N/A"}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan Version</p>
                      <p className="text-lg font-semibold">
                        {(result as PlatformInterventionResponse).plan_version || "1"}
                      </p>
                    </Card>
                  </div>
                  {(result as PlatformInterventionResponse).meal_plan && (
                    <div>
                      <h4 className="font-semibold mb-2">Meal Plan</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto max-h-96">
                          {JSON.stringify((result as PlatformInterventionResponse).meal_plan, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                  {(result as PlatformInterventionResponse).explanations && (
                    <div>
                      <h4 className="font-semibold mb-2">Explanations</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto max-h-96">
                          {JSON.stringify((result as PlatformInterventionResponse).explanations, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {stepId === "food_allocation" && (result as PlatformFoodAllocationResponse) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan ID</p>
                      <p className="text-xs font-mono truncate">
                        {(result as PlatformFoodAllocationResponse).plan_id || "N/A"}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan Version</p>
                      <p className="text-lg font-semibold">
                        {(result as PlatformFoodAllocationResponse).plan_version || "1"}
                      </p>
                    </Card>
                    {(result as PlatformFoodAllocationResponse).variety_metrics && (
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Variety Score</p>
                        <p className="text-lg font-semibold">
                          {(result as PlatformFoodAllocationResponse).variety_metrics?.variety_score || "N/A"}
                        </p>
                      </Card>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Meal Allocation Summary</h4>
                    <Card className="p-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        Food allocation completed. Please review and approve meals to generate recipes.
                      </p>
                      <Button
                        onClick={() => setShowFoodAllocationApprovalDialog(true)}
                        variant="outline"
                        size="sm"
                      >
                        Review & Approve Meals
                      </Button>
                    </Card>
                  </div>
                  {(result as PlatformFoodAllocationResponse).meal_allocation && (
                    <div>
                      <h4 className="font-semibold mb-2">Allocated Foods (Preview)</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto max-h-96">
                          {JSON.stringify((result as PlatformFoodAllocationResponse).meal_allocation, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {stepId === "recipe_generation" && (result as PlatformRecipeResponse) && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan ID</p>
                      <p className="text-xs font-mono truncate">
                        {(result as PlatformRecipeResponse).plan_id || "N/A"}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan Version</p>
                      <p className="text-lg font-semibold">
                        {(result as PlatformRecipeResponse).plan_version || "1"}
                      </p>
                    </Card>
                    {(result as PlatformRecipeResponse).variety_metrics && (
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">Variety Score</p>
                        <p className="text-lg font-semibold">
                          {(result as PlatformRecipeResponse).variety_metrics?.variety_score || "N/A"}
                        </p>
                      </Card>
                    )}
                  </div>
                  {(result as PlatformRecipeResponse).seven_day_plan && (
                    <div>
                      <h4 className="font-semibold mb-2">7-Day Meal Plan with Recipes</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto max-h-96">
                          {JSON.stringify((result as PlatformRecipeResponse).seven_day_plan, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                </div>
              )}

              {stepId === "plan" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan Status</p>
                      <p className="text-lg font-semibold capitalize">
                        {(result as PlatformPlanResponse).status || "Draft"}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan Version</p>
                      <p className="text-lg font-semibold">
                        {(result as PlatformPlanResponse).plan_version || "1"}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Created At</p>
                      <p className="text-sm font-medium">
                        {new Date((result as PlatformPlanResponse).created_at).toLocaleDateString()}
                      </p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Plan ID</p>
                      <p className="text-xs font-mono truncate">
                        {(result as PlatformPlanResponse).id}
                      </p>
                    </Card>
                  </div>
                  {(result as PlatformPlanResponse).meal_plan && (
                    <div>
                      <h4 className="font-semibold mb-2">Meal Plan</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto max-h-96">
                          {JSON.stringify((result as PlatformPlanResponse).meal_plan, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                  {(result as PlatformPlanResponse).explanations && (
                    <div>
                      <h4 className="font-semibold mb-2">Explanations</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto max-h-96">
                          {JSON.stringify((result as PlatformPlanResponse).explanations, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                  {(result as PlatformPlanResponse).constraints_snapshot && (
                    <div>
                      <h4 className="font-semibold mb-2">Constraints Snapshot</h4>
                      <Card className="p-3">
                        <pre className="text-sm overflow-auto max-h-96">
                          {JSON.stringify((result as PlatformPlanResponse).constraints_snapshot, null, 2)}
                        </pre>
                      </Card>
                    </div>
                  )}
                  {!(result as PlatformPlanResponse).meal_plan && !(result as PlatformPlanResponse).explanations && !(result as PlatformPlanResponse).constraints_snapshot && (
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Plan data is being generated. Please refresh to see the complete plan.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {stepId === "targets" && result && (result as any).calories_target !== undefined && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTargetsDialog(true)}
                  >
                    <Table className="w-4 h-4 mr-2" />
                    View Table
                  </Button>
                )}
                {stepId === "meal_structure" && result && ((result as any).meal_count !== undefined || (result as any).meals) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMealStructureDialog(true)}
                  >
                    <Table className="w-4 h-4 mr-2" />
                    View Table
                  </Button>
                )}
                {stepId === "exchange_allocation" && result && (result as any).exchanges_per_meal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowExchangeTableDialog(true)}
                  >
                    <Table className="w-4 h-4 mr-2" />
                    View Table
                  </Button>
                )}
                {stepId === "intervention" && result && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInterventionFoodsDialog(true)}
                  >
                    <Table className="w-4 h-4 mr-2" />
                    View Table
                  </Button>
                )}
              </div>
            </div>
    );

    // Show assessment results directly without accordion
    if (showDirectly) {
      return resultContent;
    }

    // Other steps use accordion
    return (
      <Accordion
        type="single"
        collapsible
        value={expandedResults[stepId] ? stepId : undefined}
        onValueChange={(value) =>
          setExpandedResults((prev) => ({ ...prev, [stepId]: value === stepId }))
        }
      >
        <AccordionItem value={stepId} className="border-none">
          <AccordionTrigger className="py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">View Results</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {resultContent}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  if (loading) {
    return (
      <Card className="wellness-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="wellness-card">
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Failed to load NCP status</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedSteps = Object.values(status.steps).filter(Boolean).length;
  const totalSteps = NCP_STEPS.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const currentStep = NCP_STEPS[currentStepIndex];

  return (
    <>
    <Card className="wellness-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              NCP Process Flow
            </CardTitle>
            <CardDescription className="mt-2">
              Step-by-step Nutrition Care Process execution
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-sm">
            {completedSteps}/{totalSteps} Steps Completed
          </Badge>
        </div>
        <div className="mt-4">
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Step Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {currentStep.icon && (
                  <div className="p-2 rounded-xl bg-primary/10">
                    <currentStep.icon className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">
                    Step {currentStepIndex + 1}: {currentStep.name}
                  </CardTitle>
                  <CardDescription>{currentStep.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isStepCompleted(currentStep.id) ? (
                  <Badge variant="default" className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </Badge>
                ) : isStepActive(currentStep.id) ? (
                  <Badge variant="secondary" className="gap-2">
                    <Circle className="w-4 h-4" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-2">
                    <Circle className="w-4 h-4" />
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isStepCompleted(currentStep.id) ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This step has been completed. Review the results below and approve to continue to the next step.
                </p>
                {renderStepResult(currentStep.id) || (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">
                      Results are being loaded. Please wait or refresh the page.
                    </p>
                  </div>
                )}
                {currentStep.id === "food_allocation" && stepResults.food_allocation && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => setShowFoodAllocationApprovalDialog(true)}
                      variant="outline"
                      className="w-full"
                    >
                      Review & Approve Meals
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
                {currentStep.id !== "intake" && currentStep.id !== "food_allocation" && currentStep.id !== "recipe_generation" && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleNext}
                      disabled={currentStepIndex === NCP_STEPS.length - 1}
                      className="w-full"
                    >
                      Approve & Continue to Next Step
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            ) : canExecuteStep(currentStep.id) ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This step is ready to execute. Click the button below to proceed.
                </p>
                <Button
                  onClick={() => executeStep(currentStep.id)}
                  disabled={executingStep === currentStep.id}
                  className="w-full"
                >
                  {executingStep === currentStep.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute {currentStep.name}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-4 bg-muted/50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Prerequisites not met</p>
                  <p className="text-sm text-muted-foreground">
                    Complete the previous step before executing this one.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Step
          </Button>
          <div className="flex gap-2">
            {NCP_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? "bg-primary w-8"
                    : isStepCompleted(step.id)
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
                aria-label={`Go to step ${idx + 1}: ${step.name}`}
              />
            ))}
          </div>
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentStepIndex === NCP_STEPS.length - 1}
          >
            Next Step
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* All Steps Overview */}
        {!hideOverview && (
          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-4">All Steps Overview</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {NCP_STEPS.map((step, idx) => {
                const completed = isStepCompleted(step.id);
                const active = isStepActive(step.id);
                const Icon = step.icon || Circle;

                return (
                  <Card
                    key={step.id}
                    className={`cursor-pointer transition-all ${
                      idx === currentStepIndex ? "border-primary border-2" : ""
                    }`}
                    onClick={() => setCurrentStepIndex(idx)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              completed ? "bg-primary/10" : "bg-muted"
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                completed ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{step.name}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : active ? (
                          <Circle className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    {/* Targets Table Dialog */}
    {stepResults.targets && stepResults.targets.calories_target !== undefined && (
      <Dialog open={showTargetsDialog} onOpenChange={setShowTargetsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nutrition Targets - Detailed View</DialogTitle>
            <DialogDescription>
              Complete nutrition targets breakdown in table format
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Section 1: Calories Target */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                1. Calories Target
              </h3>
              <Card>
                <CardContent className="p-4">
                  {/* Client Information */}
                  {(() => {
                    const snapshot = stepResults.assessment?.assessment_snapshot;
                    const height = snapshot?.client_context?.height_cm || clientData?.height_cm;
                    const weight = snapshot?.client_context?.weight_kg || clientData?.weight_kg;
                    const bmi = snapshot?.clinical_data?.anthropometry?.bmi;
                    const goals = snapshot?.goals;
                    const hasAnyData = height || weight || bmi || goals;
                    
                    if (!hasAnyData) return null;
                    
                    // Calculate BMI if not available but height and weight are
                    let calculatedBMI: number | null = null;
                    if (!bmi && height && weight) {
                      const heightInMeters = height / 100;
                      calculatedBMI = weight / (heightInMeters * heightInMeters);
                    }
                    const displayBMI = bmi || calculatedBMI;
                    
                    return (
                      <div className="mb-6 pb-6 border-b">
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Client Information</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Height */}
                          {height && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Height</p>
                              <p className="text-lg font-semibold">
                                {height} cm
                              </p>
                            </div>
                          )}
                          
                          {/* Weight */}
                          {weight && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Weight</p>
                              <p className="text-lg font-semibold">
                                {weight} kg
                              </p>
                            </div>
                          )}
                          
                          {/* BMI */}
                          {displayBMI && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">BMI</p>
                              <p className="text-lg font-semibold">
                                {typeof displayBMI === 'number'
                                  ? displayBMI.toFixed(1)
                                  : displayBMI}
                              </p>
                            </div>
                          )}
                          
                          {/* Goals */}
                          {goals && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Primary Goal</p>
                              <p className="text-lg font-semibold capitalize line-clamp-2">
                                {goals.primary_goal || 
                                 (Array.isArray(goals.secondary_goals) && 
                                  goals.secondary_goals.length > 0
                                  ? goals.secondary_goals[0]
                                  : "N/A")}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Secondary Goals if available */}
                        {goals?.secondary_goals && 
                         Array.isArray(goals.secondary_goals) &&
                         goals.secondary_goals.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Secondary Goals</p>
                            <div className="flex flex-wrap gap-2">
                              {goals.secondary_goals.map((goal: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {goal}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Calories Target */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Daily Calories</p>
                      <p className="text-3xl font-bold text-primary">
                        {stepResults.targets.calories_target?.toLocaleString() || "N/A"} kcal
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Calculation Method</p>
                      <p className="text-lg font-semibold capitalize">
                        {stepResults.targets.calculation_source?.replace(/_/g, " ") || "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 2: Macros */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                2. Macronutrients
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Macronutrient</th>
                          <th className="text-right p-3 font-semibold">Grams (g)</th>
                          <th className="text-right p-3 font-semibold">Percentage (%)</th>
                          <th className="text-right p-3 font-semibold">Calories (kcal)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stepResults.targets.macros?.proteins && (
                          <tr className="border-b">
                            <td className="p-3 font-medium">Proteins</td>
                            <td className="p-3 text-right">{stepResults.targets.macros.proteins.g?.toFixed(2) || "N/A"}</td>
                            <td className="p-3 text-right">{stepResults.targets.macros.proteins.percent?.toFixed(2) || "N/A"}%</td>
                            <td className="p-3 text-right">
                              {stepResults.targets.macros.proteins.g 
                                ? (stepResults.targets.macros.proteins.g * 4).toFixed(2) 
                                : "N/A"}
                            </td>
                          </tr>
                        )}
                        {stepResults.targets.macros?.fats && (
                          <tr className="border-b">
                            <td className="p-3 font-medium">Fats</td>
                            <td className="p-3 text-right">{stepResults.targets.macros.fats.g?.toFixed(2) || "N/A"}</td>
                            <td className="p-3 text-right">{stepResults.targets.macros.fats.percent?.toFixed(2) || "N/A"}%</td>
                            <td className="p-3 text-right">
                              {stepResults.targets.macros.fats.g 
                                ? (stepResults.targets.macros.fats.g * 9).toFixed(2) 
                                : "N/A"}
                            </td>
                          </tr>
                        )}
                        {stepResults.targets.macros?.carbohydrates && (
                          <tr className="border-b">
                            <td className="p-3 font-medium">Carbohydrates</td>
                            <td className="p-3 text-right">{stepResults.targets.macros.carbohydrates.g?.toFixed(2) || "N/A"}</td>
                            <td className="p-3 text-right">{stepResults.targets.macros.carbohydrates.percent?.toFixed(2) || "N/A"}%</td>
                            <td className="p-3 text-right">
                              {stepResults.targets.macros.carbohydrates.g 
                                ? (stepResults.targets.macros.carbohydrates.g * 4).toFixed(2) 
                                : "N/A"}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-muted/30 font-semibold">
                          <td className="p-3">Total</td>
                          <td className="p-3 text-right">
                            {stepResults.targets.macros?.proteins?.g && stepResults.targets.macros?.fats?.g && stepResults.targets.macros?.carbohydrates?.g
                              ? (stepResults.targets.macros.proteins.g + stepResults.targets.macros.fats.g + stepResults.targets.macros.carbohydrates.g).toFixed(2)
                              : "N/A"}
                          </td>
                          <td className="p-3 text-right">100%</td>
                          <td className="p-3 text-right">
                            {stepResults.targets.calories_target?.toFixed(2) || "N/A"} kcal
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 3: Key Micronutrients */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                3. Key Micronutrients
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Nutrient</th>
                          <th className="text-right p-3 font-semibold">Minimum</th>
                          <th className="text-right p-3 font-semibold">Maximum</th>
                          <th className="text-left p-3 font-semibold">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stepResults.targets.key_micros && Object.entries(stepResults.targets.key_micros).map(([nutrient, data]: [string, any]) => (
                          <tr key={nutrient} className="border-b">
                            <td className="p-3 font-medium capitalize">
                              {nutrient.replace(/_/g, " ").replace(/mg|g|iu/gi, (match) => ` ${match.toUpperCase()}`)}
                            </td>
                            <td className="p-3 text-right">
                              {data.min !== null && data.min !== undefined 
                                ? `${data.min}${nutrient.includes('mg') ? ' mg' : nutrient.includes('g') ? ' g' : nutrient.includes('iu') ? ' IU' : ''}`
                                : "N/A"}
                            </td>
                            <td className="p-3 text-right">
                              {data.max !== null && data.max !== undefined 
                                ? `${data.max}${nutrient.includes('mg') ? ' mg' : nutrient.includes('g') ? ' g' : nutrient.includes('iu') ? ' IU' : ''}`
                                : "N/A"}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {data.note || "—"}
                            </td>
                          </tr>
                        ))}
                        {(!stepResults.targets.key_micros || Object.keys(stepResults.targets.key_micros).length === 0) && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground">
                              No micronutrient data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    {/* Meal Structure Table Dialog */}
    {stepResults.meal_structure && (
      <Dialog open={showMealStructureDialog} onOpenChange={setShowMealStructureDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Meal Structure - Detailed View</DialogTitle>
            <DialogDescription>
              Complete meal structure breakdown in table format
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Section 1: Meal Count */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                1. Meal Count
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">Total Meals:</p>
                    <p className="text-3xl font-bold text-primary">
                      {stepResults.meal_structure.meal_count || "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 2: Meals */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                2. Meals
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {stepResults.meal_structure.meals && stepResults.meal_structure.meals.length > 0 ? (
                      stepResults.meal_structure.meals.map((meal, idx) => (
                        <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">
                          {meal}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No meals defined</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 3: Timing Windows */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                3. Timing Windows
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Meal</th>
                          <th className="text-left p-3 font-semibold">Time Window</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stepResults.meal_structure.timing_windows && Object.keys(stepResults.meal_structure.timing_windows).length > 0 ? (
                          Object.entries(stepResults.meal_structure.timing_windows).map(([meal, times]) => (
                            <tr key={meal} className="border-b">
                              <td className="p-3 font-medium capitalize">{meal}</td>
                              <td className="p-3">
                                {Array.isArray(times) && times.length > 0 ? (
                                  <span className="text-sm">
                                    {times.length === 2 ? `${times[0]} - ${times[1]}` : times.join(", ")}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="p-4 text-center text-muted-foreground">
                              No timing windows defined
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 4: Energy Weight */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                4. Energy Weight
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Meal</th>
                          <th className="text-right p-3 font-semibold">Energy Weight</th>
                          <th className="text-right p-3 font-semibold">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stepResults.meal_structure.energy_weight && Object.keys(stepResults.meal_structure.energy_weight).length > 0 ? (
                          Object.entries(stepResults.meal_structure.energy_weight).map(([meal, weight]) => (
                            <tr key={meal} className="border-b">
                              <td className="p-3 font-medium capitalize">{meal}</td>
                              <td className="p-3 text-right">
                                {typeof weight === 'number' ? weight.toFixed(3) : String(weight)}
                              </td>
                              <td className="p-3 text-right">
                                {typeof weight === 'number' ? `${(weight * 100).toFixed(1)}%` : "N/A"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-muted-foreground">
                              No energy weight data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    {/* Exchange Selection Dialog */}
    <Dialog open={showExchangeSelectionDialog} onOpenChange={setShowExchangeSelectionDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Mandatory Exchanges</DialogTitle>
          <DialogDescription>
            Select the food exchange categories that must be included for each meal. 
            You can select multiple exchanges per meal. These will be prioritized during allocation.
          </DialogDescription>
        </DialogHeader>
        
        {loadingMealStructure ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading meal structure...</span>
          </div>
        ) : mealStructure && mealStructure.meals && mealStructure.meals.length > 0 ? (
          <div className="space-y-6 mt-4">
            {mealStructure.meals.map((meal) => {
              const mealSelectedExchanges = selectedExchangesPerMeal[meal] || new Set<string>();
              return (
                <div key={meal} className="space-y-3">
                  <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    {meal}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {exchangeCategories.map((category) => {
                      const isSelected = mealSelectedExchanges.has(category.exchange_category_id);
                      return (
                        <div
                          key={`${meal}-${category.exchange_category_id}`}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          }`}
                          onClick={() => {
                            const newPerMeal = { ...selectedExchangesPerMeal };
                            const mealSet = new Set(mealSelectedExchanges);
                            if (mealSet.has(category.exchange_category_id)) {
                              mealSet.delete(category.exchange_category_id);
                            } else {
                              mealSet.add(category.exchange_category_id);
                            }
                            newPerMeal[meal] = mealSet;
                            setSelectedExchangesPerMeal(newPerMeal);
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newPerMeal = { ...selectedExchangesPerMeal };
                              const mealSet = new Set(mealSelectedExchanges);
                              if (checked) {
                                mealSet.add(category.exchange_category_id);
                              } else {
                                mealSet.delete(category.exchange_category_id);
                              }
                              newPerMeal[meal] = mealSet;
                              setSelectedExchangesPerMeal(newPerMeal);
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{category.display_name}</h4>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No meal structure found. Please generate meal structure first.
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setShowExchangeSelectionDialog(false);
              setSelectedExchangesPerMeal({});
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExecuteExchangeAllocation}
            disabled={executingStep === "exchange_allocation" || loadingMealStructure}
          >
            {executingStep === "exchange_allocation" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Execute Exchange Allocation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    {/* Exchange Allocation Table Dialog */}
    {stepResults.exchange_allocation && (stepResults.exchange_allocation as any).exchanges_per_meal && (
      <Dialog open={showExchangeTableDialog} onOpenChange={setShowExchangeTableDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exchange Allocation - Detailed View</DialogTitle>
            <DialogDescription>
              Complete exchange allocation breakdown in table format
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Section 1: Exchanges Per Meal */}
            {(stepResults.exchange_allocation as any).exchanges_per_meal && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Utensils className="w-5 h-5" />
                  1. Exchanges Per Meal
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-semibold">Exchange Category</th>
                            {Object.keys((stepResults.exchange_allocation as any).exchanges_per_meal).map((meal) => (
                              <th key={meal} className="text-right p-3 font-semibold capitalize">
                                {meal}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Get all unique exchange categories across all meals
                            const allCategories = new Set<string>();
                            Object.values((stepResults.exchange_allocation as any).exchanges_per_meal).forEach((mealExchanges: any) => {
                              Object.keys(mealExchanges).forEach(cat => allCategories.add(cat));
                            });
                            const sortedCategories = Array.from(allCategories).sort();
                            
                            return sortedCategories.map((category) => (
                              <tr key={category} className="border-b">
                                <td className="p-3 font-medium capitalize">
                                  {category.replace(/_/g, " ")}
                                </td>
                                {Object.keys((stepResults.exchange_allocation as any).exchanges_per_meal).map((meal) => {
                                  const mealExchanges = (stepResults.exchange_allocation as any).exchanges_per_meal[meal];
                                  const value = mealExchanges?.[category] || 0;
                                  return (
                                    <td key={meal} className="p-3 text-right">
                                      {value > 0 ? value.toFixed(2) : "—"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section 2: Daily Exchange Allocation */}
            {(stepResults.exchange_allocation as any).daily_exchange_allocation && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  2. Daily Exchange Allocation
                </h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-semibold">Exchange Category</th>
                            <th className="text-right p-3 font-semibold">Daily Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries((stepResults.exchange_allocation as any).daily_exchange_allocation)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([category, value]: [string, any]) => (
                              <tr key={category} className="border-b">
                                <td className="p-3 font-medium capitalize">
                                  {category.replace(/_/g, " ")}
                                </td>
                                <td className="p-3 text-right font-semibold">
                                  {typeof value === 'number' ? value.toFixed(2) : value}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Section 3: Per Meal Nutrition */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                3. Per Meal Nutrition
              </h3>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-semibold">Meal</th>
                          <th className="text-right p-3 font-semibold">Total Calories (kcal)</th>
                          <th className="text-right p-3 font-semibold">Total Protein (g)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(stepResults.exchange_allocation as any).per_meal_nutrition ? (
                          Object.entries((stepResults.exchange_allocation as any).per_meal_nutrition)
                            .map(([meal, nutrition]: [string, any]) => (
                              <tr key={meal} className="border-b">
                                <td className="p-3 font-medium capitalize">{meal}</td>
                                <td className="p-3 text-right">
                                  {nutrition?.total_calories !== undefined && nutrition?.total_calories !== null
                                    ? nutrition.total_calories.toFixed(1)
                                    : "—"}
                                </td>
                                <td className="p-3 text-right">
                                  {nutrition?.total_protein_g !== undefined && nutrition?.total_protein_g !== null
                                    ? nutrition.total_protein_g.toFixed(1)
                                    : "—"}
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-muted-foreground">
                              No per-meal nutrition data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section 4: Daily Nutrition */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                4. Daily Nutrition
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Calories</p>
                      <p className="text-3xl font-bold text-primary">
                        {(stepResults.exchange_allocation as any).daily_nutrition?.total_calories !== undefined &&
                         (stepResults.exchange_allocation as any).daily_nutrition?.total_calories !== null
                          ? (stepResults.exchange_allocation as any).daily_nutrition.total_calories.toFixed(1)
                          : "N/A"} kcal
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Protein</p>
                      <p className="text-3xl font-bold text-primary">
                        {(stepResults.exchange_allocation as any).daily_nutrition?.total_protein_g !== undefined &&
                         (stepResults.exchange_allocation as any).daily_nutrition?.total_protein_g !== null
                          ? (stepResults.exchange_allocation as any).daily_nutrition.total_protein_g.toFixed(1)
                          : "N/A"} g
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}

    {/* Food Allocation Approval Dialog */}
    {stepResults.food_allocation && (
      <Dialog open={showFoodAllocationApprovalDialog} onOpenChange={setShowFoodAllocationApprovalDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approve Food Allocations</DialogTitle>
            <DialogDescription>
              Review and approve food selections for each meal. Only approved meals will have recipes generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {(() => {
              const mealAllocation = stepResults.food_allocation?.meal_allocation;
              const days = mealAllocation?.days || {};
              
              return Object.entries(days).map(([dayKey, dayData]: [string, any]) => {
                const dayNumber = `day_${dayData.day_number}`;
                const meals = dayData.meals || {};
                
                return (
                  <Card key={dayKey} className="p-4">
                    <h3 className="text-lg font-semibold mb-4">
                      {dayData.day_name} - {dayData.date}
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(meals).map(([mealName, mealData]: [string, any]) => {
                        const allocatedFoods = mealData.allocated_foods || [];
                        const isApproved = mealApprovals[dayNumber]?.[mealName] || false;
                        
                        return (
                          <div key={mealName} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold capitalize">{mealName}</h4>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={isApproved}
                                  onCheckedChange={(checked) => {
                                    setMealApprovals((prev) => ({
                                      ...prev,
                                      [dayNumber]: {
                                        ...prev[dayNumber],
                                        [mealName]: checked === true,
                                      },
                                    }));
                                  }}
                                />
                                <span className="text-sm">
                                  {isApproved ? "Approved" : "Pending"}
                                </span>
                              </div>
                            </div>
                            
                            {allocatedFoods.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Allocated Foods:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {allocatedFoods.map((food: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                                    >
                                      <span className="font-medium">{food.display_name}</span>
                                      <span className="text-muted-foreground">
                                        {food.quantity_g?.toFixed(1)}g ({food.exchanges} exchanges)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                {mealData.total_nutrition && (
                                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                    Nutrition: {mealData.total_nutrition.calories?.toFixed(0)} kcal,{" "}
                                    {mealData.total_nutrition.protein_g?.toFixed(1)}g protein
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No foods allocated</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              });
            })()}
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {Object.values(mealApprovals).reduce(
                (total, dayApprovals) =>
                  total + Object.values(dayApprovals).filter((approved) => approved).length,
                0
              )}{" "}
              meals approved
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFoodAllocationApprovalDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveFoodAllocation}
                disabled={executingStep === "food_allocation"}
              >
                {executingStep === "food_allocation" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Approvals
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}

    {/* Intervention Foods Table Dialog */}
    {stepResults.intervention && (
      <Dialog open={showInterventionFoodsDialog} onOpenChange={setShowInterventionFoodsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Foods by Exchange Category</DialogTitle>
            <DialogDescription>
              View all available foods grouped by exchange category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {(() => {
              const interventionData = stepResults.intervention;
              const categoryWiseFoods = interventionData?.meal_plan?.category_wise_foods || {};
              return Object.entries(categoryWiseFoods).map(
                ([exchangeCategory, foods]: [string, any]) => (
                  <div key={exchangeCategory} className="space-y-2">
                    <h3 className="text-lg font-semibold capitalize">
                      {exchangeCategory.replace(/_/g, " ")}
                    </h3>
                    <Card>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="p-3 text-left font-semibold">Food Name</th>
                                <th className="p-3 text-right font-semibold">Serving Size (g)</th>
                                <th className="p-3 text-right font-semibold">Rank</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(foods) && foods.length > 0 ? (
                                foods.map((food: any, index: number) => (
                                  <tr key={food.food_id || index} className="border-b">
                                    <td className="p-3">
                                      {food.display_name || food.food_id || "N/A"}
                                    </td>
                                    <td className="p-3 text-right">
                                      {food.serving_size_per_exchange_g !== undefined && food.serving_size_per_exchange_g !== null
                                        ? typeof food.serving_size_per_exchange_g === 'number'
                                          ? food.serving_size_per_exchange_g.toFixed(1)
                                          : food.serving_size_per_exchange_g
                                        : "—"}
                                    </td>
                                    <td className="p-3 text-right">
                                      {food.ranking?.rank !== undefined && food.ranking?.rank !== null
                                        ? food.ranking.rank
                                        : "—"}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                    No foods available in this category
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              );
            })()}
            {(() => {
              const interventionData = stepResults.intervention;
              const categoryWiseFoods = interventionData?.meal_plan?.category_wise_foods || {};
              return Object.keys(categoryWiseFoods).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No food categories available
                </div>
              ) : null;
            })()}
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};

