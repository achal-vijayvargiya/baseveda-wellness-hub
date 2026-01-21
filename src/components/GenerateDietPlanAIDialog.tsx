import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Sparkles, 
  ChefHat, 
  CheckCircle, 
  Info,
  Bot,
  Edit,
  ChevronRight
} from "lucide-react";
// TODO: ⚠️ DEPRECATED - This component uses legacy dietPlanApi.
// Platform API does not yet have AI-powered diet plan generation endpoints.
// These legacy endpoints (generateAIStep1, generateAIStep2, smartFoodRetrieval) 
// need to be migrated to Platform NCP workflow.
// 
// Platform workflow: Client → Intake → Assessment → Diagnosis → MNT → Targets → Ayurveda → Plan
// This component will need significant updates to align with Platform NCP architecture.
import { DietPlanGenerateRequest, dietPlanApi } from "@/lib/api";
import { toast } from "sonner";
import { FoodRetrievalEditor } from "@/components/FoodRetrievalEditor";
import { Food } from "@/components/FoodCard";

interface GenerateDietPlanAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientName: string;
  healthProfile: any;  // Health profile with pre-filled goals
  onComplete: () => void;
}

type Step = "config" | "retrieving" | "review" | "generating" | "complete";

interface IntermediateStep {
  step_number: number;
  tool: string;
  tool_input: any;
  observation: string;
}

interface Step1Response {
  status: string;
  step: number;
  session_id?: string;  // NEW: Session ID for unified flow
  client_id: number;
  dosha_type?: string;
  response: string;
  intermediate_steps: IntermediateStep[];
  message: string;
  foods_by_category?: Record<string, Food[]>;
  filters_applied?: Record<string, string>;
}

interface Step2Response {
  status: string;
  step: number;
  response: string;
  intermediate_steps: IntermediateStep[];
  message: string;
}

export const GenerateDietPlanAIDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  healthProfile,
  onComplete,
  prefilledFoodsByCategory,
  prefilledFilters,
  onClearPrefill,
}: GenerateDietPlanAIDialogProps & {
  prefilledFoodsByCategory?: Record<string, Food[]> | null;
  prefilledFilters?: Record<string, string> | null;
  onClearPrefill?: () => void;
}) => {
  const [currentStep, setCurrentStep] = useState<Step>("config");
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState<DietPlanGenerateRequest>({
    client_id: clientId,
    duration_days: 7,
    name: `${clientName} - AI Generated Plan`,
    custom_goals: healthProfile?.goals || "",
    custom_diet_type: undefined,
    custom_allergies: healthProfile?.allergies || "",
    prefer_satvik: true,
    include_regional_foods: undefined,
    meal_variety: "moderate",
  });

  // Update form data when health profile changes
  useEffect(() => {
    if (healthProfile) {
      setFormData(prev => ({
        ...prev,
        custom_goals: healthProfile.goals || "",
        custom_allergies: healthProfile.allergies || "",
      }));
    }
  }, [healthProfile]);

  const [step1Response, setStep1Response] = useState<Step1Response | null>(null);
  const [step2Response, setStep2Response] = useState<Step2Response | null>(null);
  const [userFeedback, setUserFeedback] = useState("");
  const [modifications, setModifications] = useState<Record<string, string>>({});
  const [foodsByCategory, setFoodsByCategory] = useState<Record<string, Food[]> | null>(null);
  const [filtersApplied, setFiltersApplied] = useState<Record<string, string> | null>(null);
  const [showFoodEditor, setShowFoodEditor] = useState(false);
  const [approvedFoods, setApprovedFoods] = useState<Record<string, Food[]> | null>(null);
  const [hasEditedFoods, setHasEditedFoods] = useState(false);

  // When foods are passed in from Smart Retrieval, seed the review step directly
  useEffect(() => {
    if (open && prefilledFoodsByCategory) {
      setFoodsByCategory(prefilledFoodsByCategory);
      setApprovedFoods(prefilledFoodsByCategory);
      setFiltersApplied(prefilledFilters || null);
      setHasEditedFoods(true);
      setCurrentStep("review");
      // Create a lightweight step1 response so the UI renders tabs
      setStep1Response((prev) =>
        prev || {
          status: "prefilled",
          step: 1,
          client_id: clientId,
          response: "Foods loaded from Smart Retrieval.",
          intermediate_steps: [],
          message: "Review and generate the plan using the approved foods.",
          foods_by_category: prefilledFoodsByCategory,
          filters_applied: prefilledFilters || undefined,
        }
      );
    }
  }, [open, prefilledFoodsByCategory, prefilledFilters, clientId]);

  const handleStep1 = async () => {
    setIsLoading(true);
    setCurrentStep("retrieving");
    
    try {
      // UNIFIED FLOW: Use AI agent Step 1 which returns session_id
      const response = await dietPlanApi.generateAIStep1(formData);
      
      setStep1Response(response);
      setCurrentStep("review");
      if (response.foods_by_category) {
        setFoodsByCategory(response.foods_by_category);
        setFiltersApplied(response.filters_applied || null);
        setApprovedFoods(null);
        setHasEditedFoods(false);
        setShowFoodEditor(true);
      } else {
        setFoodsByCategory(null);
        setFiltersApplied(null);
        setApprovedFoods(null);
        setHasEditedFoods(false);
      }
      
      if (response.session_id) {
        console.log("Session created:", response.session_id);
      }
      
      toast.success("Foods retrieved successfully!");
    } catch (error: any) {
      console.error("Step 1 error:", error);
      toast.error(error.message || "Failed to retrieve foods");
      setCurrentStep("config");
    } finally {
      setIsLoading(false);
    }
  };

  const formatFoodsByCategory = (foodsByCategory: any): string => {
    let formatted = "Retrieved Foods Organized by Category:\n\n";
    
    Object.entries(foodsByCategory).forEach(([category, foods]: [string, any]) => {
      formatted += `\n━━━ ${category} (${foods.length} foods) ━━━\n\n`;
      foods.forEach((food: any, idx: number) => {
        formatted += `${idx + 1}. ${food.food_name}\n`;
        formatted += `   Energy: ${food.energy_kcal} kcal/100g\n`;
        formatted += `   Protein: ${food.protein_g}g | Carbs: ${food.carbs_g}g | Fat: ${food.fat_g}g\n`;
        if (food.dosha_impact) {
          formatted += `   Dosha: ${food.dosha_impact}\n`;
        }
        if (food.composite_score) {
          formatted += `   Score: ${Math.round(food.composite_score)}/100\n`;
        }
        formatted += '\n';
      });
    });
    
    return formatted;
  };

  const handleStep2 = async () => {
    setIsLoading(true);
    setCurrentStep("generating");
    
    try {
      // UNIFIED FLOW: Pass session_id from Step 1
      const response = await dietPlanApi.generateAIStep2(
        clientId,
        userFeedback || "confirm",
        Object.keys(modifications).length > 0 ? modifications : undefined,
        formData.duration_days,
        step1Response?.session_id,  // Pass session_id for conversation context
        approvedFoods || foodsByCategory || undefined
      );
      console.log("Step 2 Response:", response);
      
      // Check if response is a saved plan (new format) or just text (old format)
      if (response.id && response.meals) {
        // New format: Plan is saved in database
        console.log("Diet plan saved successfully with ID:", response.id);
        toast.success(`Diet plan created successfully with ${response.meals.length} meals!`);
        
        // Close dialog and notify parent
        setTimeout(() => {
          handleClose();
          if (onComplete) {
            onComplete();
          }
        }, 1500);
      } else if (response.response) {
        // Old format: Text response (for backward compatibility)
        console.log("Response text length:", response.response?.length || 0);
        setStep2Response(response);
        setCurrentStep("complete");
        toast.success("Diet plan generated successfully!");
      } else {
        // Unknown format
        throw new Error("Unexpected response format from server");
      }
      
    } catch (error: any) {
      console.error("Step 2 error:", error);
      toast.error(error.message || "Failed to generate plan");
      setCurrentStep("review");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep("config");
    setStep1Response(null);
    setStep2Response(null);
    setUserFeedback("");
    setModifications({});
    setFoodsByCategory(null);
    setFiltersApplied(null);
    setApprovedFoods(null);
    setHasEditedFoods(false);
    setShowFoodEditor(false);
    if (onClearPrefill) {
      onClearPrefill();
    }
    onOpenChange(false);
  };

  const handleFoodsApproved = (updatedFoods: Record<string, Food[]>) => {
    setApprovedFoods(updatedFoods);
    setHasEditedFoods(true);
    setShowFoodEditor(false);
    toast.success("Food selection saved. Continue to generate the plan.");
  };

  const addModification = () => {
    const key = `modification_${Object.keys(modifications).length + 1}`;
    setModifications({ ...modifications, [key]: "" });
  };

  const updateModification = (key: string, value: string) => {
    setModifications({ ...modifications, [key]: value });
  };

  const removeModification = (key: string) => {
    const newMods = { ...modifications };
    delete newMods[key];
    setModifications(newMods);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <DialogTitle>AI-Powered Diet Plan Generator</DialogTitle>
          </div>
          <DialogDescription>
            Create a personalized meal plan for {clientName} using intelligent AI agents
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 py-2">
          <Badge variant={currentStep === "config" ? "default" : "outline"}>
            1. Configure
          </Badge>
          <ChevronRight className="h-4 w-4" />
          <Badge variant={currentStep === "retrieving" || currentStep === "review" ? "default" : "outline"}>
            2. Review Foods
          </Badge>
          <ChevronRight className="h-4 w-4" />
          <Badge variant={currentStep === "generating" || currentStep === "complete" ? "default" : "outline"}>
            3. Generate Plan
          </Badge>
        </div>

        {/* Step: Configuration */}
        {currentStep === "config" && (
          <div className="space-y-4 py-4">
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertDescription>
                Using Smart Food Retrieval: We'll get top 8 foods per category filtered by the client's 
                health profile, then use AI to generate the personalized meal plan.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="goals">
                Health Goals 
                {healthProfile?.goals && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (from profile - you can modify)
                  </span>
                )}
              </Label>
              <Textarea
                id="goals"
                value={formData.custom_goals}
                onChange={(e) =>
                  setFormData({ ...formData, custom_goals: e.target.value })
                }
                placeholder="e.g., Weight loss, muscle gain, improve digestion, boost energy"
                rows={2}
              />
              {healthProfile?.goals && formData.custom_goals === healthProfile.goals && (
                <p className="text-xs text-green-600">✓ Using goals from health profile</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (Days)</Label>
                <Select
                  value={formData.duration_days?.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, duration_days: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="21">21 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Meal Variety</Label>
                <Select
                  value={formData.meal_variety}
                  onValueChange={(value) =>
                    setFormData({ ...formData, meal_variety: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Similar meals</SelectItem>
                    <SelectItem value="moderate">Moderate - Balanced</SelectItem>
                    <SelectItem value="high">High - Maximum variety</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Dietary Restrictions/Allergies
                {healthProfile?.allergies && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (from profile - you can modify)
                  </span>
                )}
              </Label>
              <Input
                value={formData.custom_allergies}
                onChange={(e) =>
                  setFormData({ ...formData, custom_allergies: e.target.value })
                }
                placeholder="e.g., peanuts, dairy, gluten"
              />
              {healthProfile?.allergies && formData.custom_allergies === healthProfile.allergies && (
                <p className="text-xs text-green-600">✓ Using allergies from health profile</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Prefer Satvik Foods</Label>
                <p className="text-sm text-muted-foreground">
                  Prioritize pure, energizing foods following Ayurvedic principles
                </p>
              </div>
              <Switch
                checked={formData.prefer_satvik}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, prefer_satvik: checked })
                }
              />
            </div>
          </div>
        )}

        {/* Step: Retrieving Foods */}
        {currentStep === "retrieving" && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                <Bot className="h-6 w-6 absolute top-3 left-3 text-purple-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">AI Agent Working...</h3>
                <p className="text-muted-foreground">
                  Calculating nutritional needs and retrieving appropriate foods
                </p>
              </div>
              <div className="w-full max-w-md space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Analyzing health profile...</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Calculating nutritional requirements...</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-4 w-4" />
                  <span>Searching food database...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Review Foods */}
        {currentStep === "review" && step1Response && (
          <div className="space-y-4 py-4">
            <Alert>
              <ChefHat className="h-4 w-4" />
              <AlertDescription>
                The AI agent has retrieved foods based on the client's needs. 
                Review them and provide feedback or confirm to proceed.
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="foods" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="foods">Retrieved Foods</TabsTrigger>
                <TabsTrigger value="reasoning">Agent Reasoning</TabsTrigger>
                <TabsTrigger value="tools">Tools Used</TabsTrigger>
              </TabsList>

              <TabsContent value="foods" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Food Recommendations</CardTitle>
                    <CardDescription>
                      {step1Response.dosha_type && `Balanced for ${step1Response.dosha_type} dosha`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                {foodsByCategory ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Review the retrieved foods. Remove, replace, or add items before generating the plan.
                        </p>
                        {hasEditedFoods && (
                          <Badge variant="secondary">Custom edits applied</Badge>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowFoodEditor(true)}>
                        Edit Foods
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(approvedFoods || foodsByCategory).map(([category, foods]) => (
                        <div key={category} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm">
                              {category} ({foods.length})
                            </span>
                            <Badge variant="outline">Preview</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {foods.slice(0, 3).map((food) => (
                              <div key={food.id || food.food_name} className="truncate">
                                • {food.food_name}
                              </div>
                            ))}
                            {foods.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                + {foods.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {filtersApplied && (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">Allergies: {filtersApplied.allergies || "None"}</Badge>
                        <Badge variant="outline">Diet: {filtersApplied.diet_type || "Auto"}</Badge>
                        <Badge variant="outline">Goals: {filtersApplied.goals || "General"}</Badge>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {step1Response.response}
                  </div>
                )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Your Feedback (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={userFeedback}
                      onChange={(e) => setUserFeedback(e.target.value)}
                      placeholder="e.g., 'Looks good!', 'Please replace paneer with tofu', 'I prefer South Indian foods'"
                      rows={3}
                    />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Specific Modifications</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addModification}
                        >
                          Add Modification
                        </Button>
                      </div>
                      {Object.entries(modifications).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <Input
                            value={value}
                            onChange={(e) => updateModification(key, e.target.value)}
                            placeholder="e.g., 'replace_paneer: tofu (vegan alternative)'"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeModification(key)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reasoning">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Agent's Reasoning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground">{step1Response.message}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tools" className="space-y-2">
                {step1Response.intermediate_steps.map((step) => (
                  <Card key={step.step_number}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Step {step.step_number}</Badge>
                        <CardTitle className="text-sm">{step.tool}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {step.observation}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step: Generating Plan */}
        {currentStep === "generating" && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
                <ChefHat className="h-6 w-6 absolute top-3 left-3 text-purple-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold">Generating Your Meal Plan...</h3>
                <p className="text-muted-foreground">
                  Creating a complete {formData.duration_days}-day personalized plan
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {currentStep === "complete" && step2Response && (
          <div className="space-y-4 py-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Diet plan generated successfully! The plan will be saved and you'll be redirected.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Generated Plan Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {step2Response.response}
                </div>
              </CardContent>
            </Card>

            {step2Response.intermediate_steps.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Validation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {step2Response.intermediate_steps.map((step) => (
                    <div key={step.step_number} className="text-sm">
                      <p className="text-muted-foreground">{step.observation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          {currentStep === "config" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStep1} disabled={isLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                Start AI Generation
              </Button>
            </>
          )}

          {currentStep === "review" && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep("config")}>
                Back
              </Button>
              <Button onClick={handleStep2} disabled={isLoading}>
                Generate Complete Plan
              </Button>
            </>
          )}

          {currentStep === "complete" && (
            <Button onClick={() => {
              onComplete();
              handleClose();
            }}>
              Close
            </Button>
          )}
        </DialogFooter>
        </DialogContent>
      </Dialog>

      {foodsByCategory && (
        <FoodRetrievalEditor
          key={`${step1Response?.session_id || "food-editor"}-${hasEditedFoods ? "edited" : "base"}`}
          open={showFoodEditor}
          onOpenChange={setShowFoodEditor}
          foodsByCategory={approvedFoods || foodsByCategory}
          clientId={clientId}
          filtersApplied={filtersApplied || {}}
          onApprove={handleFoodsApproved}
        />
      )}
    </>
  );
};

