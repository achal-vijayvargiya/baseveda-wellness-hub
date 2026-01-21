import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Calendar,
  Target,
  Utensils,
  FileText,
  TrendingUp,
  Heart,
  Leaf,
  Loader2,
  Sparkles,
  Eye,
  Download,
  Trash2,
  Bot,
  ChevronDown,
  ChefHat,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { 
  platformClientApi,
  platformAssessmentApi,
  platformIntakeApi,
  platformPlanApi,
  type PlatformClientResponse,
  type PlatformClientUpdate,
  type PlatformAssessmentResponse,
  type PlatformIntakeResponse,
  type PlatformPlanResponse,
  type PlatformPlanGenerateRequest,
} from "@/lib/platform-api";
import { toast } from "sonner";
import { NCPProcessFlow } from "@/components/NCPProcessFlow";
// TODO: Update these components to use Platform APIs
// import { GenerateDietPlanDialog } from "@/components/GenerateDietPlanDialog";
// import { GenerateDietPlanAIDialog } from "@/components/GenerateDietPlanAIDialog";
// import { DietPlanChatInterface } from "@/components/DietPlanChatInterface";
// import { FoodRetrievalEditor } from "@/components/FoodRetrievalEditor";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ClientDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [client, setClient] = useState<PlatformClientResponse | null>(null);
  const [latestAssessment, setLatestAssessment] = useState<PlatformAssessmentResponse | null>(null);
  const [assessmentSnapshot, setAssessmentSnapshot] = useState<Record<string, any> | null>(null);
  const [latestIntake, setLatestIntake] = useState<PlatformIntakeResponse | null>(null);
  const [intakeRawInput, setIntakeRawInput] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dietPlans, setDietPlans] = useState<PlatformPlanResponse[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showFoodRetrievalEditor, setShowFoodRetrievalEditor] = useState(false);
  const [retrievedFoods, setRetrievedFoods] = useState<any>(null);
  const [isRetrievingFoods, setIsRetrievingFoods] = useState(false);
  const [approvedFoodsForPlan, setApprovedFoodsForPlan] = useState<any>(null);
  const [approvedFiltersForPlan, setApprovedFiltersForPlan] = useState<Record<string, string> | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState<PlatformClientUpdate>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClientData(id);
    }
  }, [id]);

  const fetchClientData = async (clientId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch client data
      const clientData = await platformClientApi.getById(clientId);
      setClient(clientData);
      
      // Fetch assessments to get health profile data from assessment_snapshot
      try {
        const assessments = await platformAssessmentApi.getByClientId(clientId);
        if (assessments && assessments.length > 0) {
          // Get latest assessment (most recent)
          const latest = assessments.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          setLatestAssessment(latest);
          if (latest.assessment_snapshot) {
            setAssessmentSnapshot(latest.assessment_snapshot);
          }
        }
      } catch (assessmentError) {
        console.log("No assessments found for client");
      }

      // Fetch intakes to get raw_input data
      try {
        const intakes = await platformIntakeApi.getByClientId(clientId);
        if (intakes && intakes.length > 0) {
          // Get latest intake (most recent)
          const latest = intakes.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          setLatestIntake(latest);
          if (latest.raw_input) {
            setIntakeRawInput(latest.raw_input);
          }
        }
      } catch (intakeError) {
        console.log("No intakes found for client");
      }

      // Fetch diet plans
      await fetchDietPlans(clientId);
    } catch (error: any) {
      console.error("Failed to fetch client data:", error);
      toast.error(error.message || "Failed to load client data");
      
      // If client not found or unauthorized, redirect back
      if (error.message?.includes("401") || error.message?.includes("404")) {
        navigate("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDietPlans = async (clientId: string) => {
    try {
      setIsLoadingPlans(true);
      const plans = await platformPlanApi.getByClientId(clientId);
      setDietPlans(plans || []);
    } catch (error: any) {
      console.log("No diet plans found for client or error:", error);
      setDietPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleGeneratePlan = async (request: PlatformPlanGenerateRequest) => {
    try {
      setIsGeneratingPlan(true);
      toast.loading("Generating your personalized diet plan...", { id: "generate-plan" });
      
      const newPlan = await platformPlanApi.generate(request);
      
      toast.success("Diet plan generated successfully!", { id: "generate-plan" });
      setShowGenerateDialog(false);
      
      // Refresh diet plans
      if (id) {
        await fetchDietPlans(id);
      }
      
      // Navigate to the new plan
      navigate(`/diet-plan/${newPlan.id}`);
    } catch (error: any) {
      console.error("Failed to generate diet plan:", error);
      toast.error(error.message || "Failed to generate diet plan", { id: "generate-plan" });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSmartRetrieval = async () => {
    if (!id) return;
    
    // TODO: Smart food retrieval not yet implemented in platform API
    // For now, show a message that this feature is coming soon
    toast.info("Smart food retrieval feature is coming soon in the platform API");
    
    // Uncomment when platform API implements this:
    // try {
    //   setIsRetrievingFoods(true);
    //   toast.loading("Retrieving foods...", { id: "retrieve-foods" });
    //   
    //   // Platform API implementation will go here
    //   
    // } catch (error: any) {
    //   console.error("Failed to retrieve foods:", error);
    //   toast.error(error.message || "Failed to retrieve foods", { id: "retrieve-foods" });
    // } finally {
    //   setIsRetrievingFoods(false);
    // }
  };

  const handleFoodsApproved = (foodsByCategory: any) => {
    // After user approves the food selection, open the AI dialog with these foods preloaded
    setApprovedFoodsForPlan(foodsByCategory);
    setApprovedFiltersForPlan(retrievedFoods?.filtersApplied || {});
    setShowFoodRetrievalEditor(false);
    setShowAIDialog(true);
    toast.success("Food selection approved! Proceed to Generate Diet Plan to use these foods.");
  };

  const handleViewPlan = (planId: string) => {
    navigate(`/diet-plan/${planId}`);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to delete this diet plan?")) return;
    
    // TODO: Platform API doesn't have delete method yet
    // For now, show a message that this feature is coming soon
    toast.info("Plan deletion feature is coming soon in the platform API");
    
    // Uncomment when platform API implements this:
    // try {
    //   toast.loading("Deleting diet plan...", { id: "delete-plan" });
    //   await platformPlanApi.delete(planId);
    //   toast.success("Diet plan deleted successfully", { id: "delete-plan" });
    //   
    //   // Refresh diet plans
    //   if (id) {
    //     await fetchDietPlans(id);
    //   }
    // } catch (error: any) {
    //   console.error("Failed to delete diet plan:", error);
    //   toast.error(error.message || "Failed to delete diet plan", { id: "delete-plan" });
    // }
  };

  const handleEditProfile = () => {
    if (!id) return;
    // Navigate to edit client page with client ID
    navigate(`/client/${id}/edit`);
  };

  const handleUpdateProfile = async () => {
    if (!id || !client) return;
    
    try {
      setIsUpdating(true);
      toast.loading("Updating client profile...", { id: "update-profile" });
      
      const updatedClient = await platformClientApi.update(id, editFormData);
      setClient(updatedClient);
      
      toast.success("Profile updated successfully!", { id: "update-profile" });
      setShowEditDialog(false);
    } catch (error: any) {
      console.error("Failed to update client:", error);
      toast.error(error.message || "Failed to update profile", { id: "update-profile" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      toast.loading("Deleting client...", { id: "delete-client" });
      
      await platformClientApi.delete(id);
      
      toast.success("Client deleted successfully!", { id: "delete-client" });
      setShowDeleteDialog(false);
      
      // Navigate back to dashboard after successful deletion
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Failed to delete client:", error);
      toast.error(error.message || "Failed to delete client", { id: "delete-client" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartNCPProcess = async () => {
    if (!id) return;
    
    try {
      setIsCreatingAssessment(true);
      toast.loading("Creating assessment and starting NCP process...", { id: "start-ncp" });
      
      // First, create an intake if one doesn't exist
      let intakeId: string | undefined;
      if (!latestIntake) {
        const intake = await platformIntakeApi.create({
          client_id: id,
          raw_input: {},
          source: "manual",
        });
        intakeId = intake.id;
      } else {
        intakeId = latestIntake.id;
      }
      
      // Create assessment
      const assessment = await platformAssessmentApi.create({
        client_id: id,
        intake_id: intakeId,
        assessment_snapshot: {},
      });
      
      toast.success("Assessment created! NCP Process Flow is now available.", { id: "start-ncp" });
      
      // Refresh client data to show the new assessment
      await fetchClientData(id);
    } catch (error: any) {
      console.error("Failed to start NCP process:", error);
      toast.error(error.message || "Failed to start NCP process", { id: "start-ncp" });
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getFullName = () => {
    if (!client) return "";
    // Try to get from intake raw_input first (first_name + last_name)
    if (intakeRawInput?.first_name || intakeRawInput?.last_name) {
      return `${intakeRawInput.first_name || ""} ${intakeRawInput.last_name || ""}`.trim() || client.name;
    }
    return client.name;
  };

  const getClientAge = () => {
    // Platform client has age directly
    if (client?.age) return client.age;
    // Fallback to assessment snapshot if available
    if (assessmentSnapshot?.client_context?.age) {
      return assessmentSnapshot.client_context.age;
    }
    // Calculate from date_of_birth in intakeRawInput
    if (intakeRawInput?.date_of_birth) {
      const birthDate = new Date(intakeRawInput.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return null;
  };

  const getBMI = () => {
    // Try to get from assessment snapshot first
    if (assessmentSnapshot?.clinical_data?.anthropometry?.bmi) {
      return assessmentSnapshot.clinical_data.anthropometry.bmi.toString();
    }
    // Calculate from client or snapshot data
    const weight = client?.weight_kg || assessmentSnapshot?.client_context?.weight_kg || intakeRawInput?.weight_kg;
    const height = client?.height_cm || assessmentSnapshot?.client_context?.height_cm || intakeRawInput?.height_cm;
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return (weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No client found
  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Client not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const fullName = getFullName();
  const age = getClientAge();
  const bmi = getBMI();
  
  // Extract health profile data from assessment snapshot
  const snapshot = assessmentSnapshot;
  
  // Extract goals - combine primary and secondary goals
  const extractGoals = () => {
    const goalsList: string[] = [];
    if (snapshot?.goals?.primary_goal) {
      goalsList.push(snapshot.goals.primary_goal);
    }
    if (snapshot?.goals?.secondary_goals && Array.isArray(snapshot.goals.secondary_goals)) {
      goalsList.push(...snapshot.goals.secondary_goals);
    }
    // Also check intake raw_input for goals
    if (intakeRawInput?.goals_extended?.primary_goal) {
      if (!goalsList.includes(intakeRawInput.goals_extended.primary_goal)) {
        goalsList.push(intakeRawInput.goals_extended.primary_goal);
      }
    }
    if (intakeRawInput?.goals_extended?.secondary_goals && Array.isArray(intakeRawInput.goals_extended.secondary_goals)) {
      intakeRawInput.goals_extended.secondary_goals.forEach((goal: string) => {
        if (!goalsList.includes(goal)) {
          goalsList.push(goal);
        }
      });
    }
    // Also check if goals is a string in intake
    if (intakeRawInput?.goals && typeof intakeRawInput.goals === 'string') {
      const goalsFromString = intakeRawInput.goals.split(',').map((g: string) => g.trim()).filter((g: string) => g);
      goalsFromString.forEach((goal: string) => {
        if (!goalsList.includes(goal)) {
          goalsList.push(goal);
        }
      });
    }
    return goalsList;
  };

  // Extract dietary preferences
  const extractDietaryPreferences = () => {
    const preferences: string[] = [];
    // From assessment snapshot
    if (snapshot?.diet_data?.dietary_preferences && Array.isArray(snapshot.diet_data.dietary_preferences)) {
      preferences.push(...snapshot.diet_data.dietary_preferences);
    }
    // From intake raw_input
    if (intakeRawInput?.dietary_preferences && Array.isArray(intakeRawInput.dietary_preferences)) {
      intakeRawInput.dietary_preferences.forEach((pref: string) => {
        if (!preferences.includes(pref)) {
          preferences.push(pref);
        }
      });
    }
    // Also check diet_type from intake
    if (intakeRawInput?.diet_type && !preferences.includes(intakeRawInput.diet_type)) {
      preferences.push(intakeRawInput.diet_type);
    }
    return preferences;
  };

  const goalsList = extractGoals();
  const dietaryPreferencesList = extractDietaryPreferences();

  const healthProfileData = {
    height: client?.height_cm || snapshot?.client_context?.height_cm || intakeRawInput?.height_cm,
    weight: client?.weight_kg || snapshot?.client_context?.weight_kg || intakeRawInput?.weight_kg,
    age: age,
    activity_level: snapshot?.client_context?.activity_level || intakeRawInput?.activity_level,
    goals: goalsList.length > 0 ? goalsList.join(", ") : "",
    goalsList: goalsList, // Keep as array for easier rendering
    diet_type: dietaryPreferencesList.length > 0 ? dietaryPreferencesList[0] : "",
    dietaryPreferencesList: dietaryPreferencesList, // Keep as array for easier rendering
    disease: snapshot?.clinical_data?.medical_history?.conditions?.join(", ") || intakeRawInput?.disease || "",
    allergies: "", // Allergies would be in structured format in snapshot
    sleep_cycle: snapshot?.lifestyle_data?.daily_routine || intakeRawInput?.sleep_cycle || intakeRawInput?.lifestyle?.daily_routine || "",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Client Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Client Info Card */}
        <div className="wellness-card wellness-gradient">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-semibold">{fullName}</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                  <span>
                    {age ? `${age} years` : 'Age not specified'}
                    {(intakeRawInput?.gender || client.gender) && ` • ${(intakeRawInput?.gender || client.gender).charAt(0).toUpperCase() + (intakeRawInput?.gender || client.gender).slice(1)}`}
                  </span>
                  {(client.location || intakeRawInput?.city) && (
                    <>
                      <span>•</span>
                      <span>{client.location || intakeRawInput?.city}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-lg font-semibold">
                    {healthProfileData.weight ? `${healthProfileData.weight} kg` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="text-lg font-semibold">
                    {healthProfileData.height ? `${healthProfileData.height} cm` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">BMI</p>
                  <p className="text-lg font-semibold">{bmi || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-xl">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Diet Plan
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => handleSmartRetrieval()}>
                    <ChefHat className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Smart Retrieval</span>
                      <span className="text-xs text-muted-foreground">Review & edit foods before planning</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAIDialog(true)}>
                    <Bot className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">AI-Powered (Recommended)</span>
                      <span className="text-xs text-muted-foreground">Smart retrieval + AI meal planning</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowGenerateDialog(true)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Traditional</span>
                      <span className="text-xs text-muted-foreground">Instant rule-based generation</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="rounded-xl" onClick={handleEditProfile}>
                Edit Profile
              </Button>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Client
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the client
                      {client && ` "${client.name}"`} and all associated data including intake records,
                      assessments, and diet plans.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteClient}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* NCP Process Flow Section */}
        {latestAssessment ? (
          <NCPProcessFlow
            assessmentId={latestAssessment.id}
            clientId={id!}
          />
        ) : (
          <Card className="wellness-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">NCP Process Flow</CardTitle>
                  <CardDescription className="mt-2">
                    Start the Nutrition Care Process to begin step-by-step assessment and plan generation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                  <h4 className="font-semibold text-lg mb-2">What is the NCP Process?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The Nutrition Care Process (NCP) is a systematic approach to providing high-quality nutrition care.
                    It follows these steps:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>1. Intake - Collect client data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>2. Assessment - Comprehensive health evaluation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>3. Diagnosis - Identify nutrition problems</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>4. MNT Constraints - Apply medical nutrition therapy rules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>5. Targets - Calculate nutrition targets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>6. Meal Structure - Define meal structure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>7. Exchange Allocation - Allocate exchanges</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>8. Ayurveda - Apply lifestyle guidelines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>9. Food Intervention - Apply food interventions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span>10. Recipe + Plan Generation - Generate recipes and final plan</span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleStartNCPProcess}
                  disabled={isCreatingAssessment}
                  className="w-full"
                  size="lg"
                >
                  {isCreatingAssessment ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Starting NCP Process...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5 mr-2" />
                      Start NCP Process
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Health Goals */}
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Health Goals</h3>
            </div>
            <div className="space-y-2">
              {healthProfileData.goalsList && healthProfileData.goalsList.length > 0 ? (
                healthProfileData.goalsList.map((goal, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                  >
                    <Heart className="w-4 h-4 text-primary" />
                    <span>{goal}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm p-3">No health goals specified yet</p>
              )}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Dietary Preferences</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {healthProfileData.dietaryPreferencesList && healthProfileData.dietaryPreferencesList.length > 0 ? (
                healthProfileData.dietaryPreferencesList.map((pref: string, index: number) => (
                  <span key={index} className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                    {pref}
                  </span>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No dietary preferences specified yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="wellness-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Basic Information</h3>
          </div>

          <div className="space-y-6">
            {/* Personal Details */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
              <h4 className="font-semibold text-lg mb-3">Personal Details</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {intakeRawInput?.first_name && (
                  <div>
                    <span className="text-muted-foreground">First Name: </span>
                    <span className="font-medium">{intakeRawInput.first_name}</span>
                  </div>
                )}
                {intakeRawInput?.last_name && (
                  <div>
                    <span className="text-muted-foreground">Last Name: </span>
                    <span className="font-medium">{intakeRawInput.last_name}</span>
                  </div>
                )}
                {intakeRawInput?.date_of_birth && (
                  <div>
                    <span className="text-muted-foreground">Date of Birth: </span>
                    <span className="font-medium">{new Date(intakeRawInput.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                {(intakeRawInput?.gender || client.gender) && (
                  <div>
                    <span className="text-muted-foreground">Gender: </span>
                    <span className="font-medium capitalize">{intakeRawInput?.gender || client.gender}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
              <h4 className="font-semibold text-lg mb-3">Contact Information</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {intakeRawInput?.email && (
                  <div>
                    <span className="text-muted-foreground">Email: </span>
                    <span className="font-medium">{intakeRawInput.email}</span>
                  </div>
                )}
                {intakeRawInput?.phone && (
                  <div>
                    <span className="text-muted-foreground">Phone: </span>
                    <span className="font-medium">{intakeRawInput.phone}</span>
                  </div>
                )}
                {intakeRawInput?.address && (
                  <div>
                    <span className="text-muted-foreground">Address: </span>
                    <span className="font-medium">{intakeRawInput.address}</span>
                  </div>
                )}
                {intakeRawInput?.city && (
                  <div>
                    <span className="text-muted-foreground">City: </span>
                    <span className="font-medium">{intakeRawInput.city}</span>
                  </div>
                )}
                {(client.location || intakeRawInput?.city) && (
                  <div>
                    <span className="text-muted-foreground">Location: </span>
                    <span className="font-medium">{client.location || intakeRawInput?.city}</span>
                  </div>
                )}
                {intakeRawInput?.emergency_contact && (
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Emergency Contact: </span>
                    <span className="font-medium">
                      {intakeRawInput.emergency_contact.name}
                      {intakeRawInput.emergency_contact.phone && ` - ${intakeRawInput.emergency_contact.phone}`}
                      {intakeRawInput.emergency_contact.relation && ` (${intakeRawInput.emergency_contact.relation})`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Medical History (Basic) */}
            {intakeRawInput?.medical_history && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                <h4 className="font-semibold text-lg mb-3">Medical History</h4>
                <p className="text-sm">{intakeRawInput.medical_history}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lifestyle Section */}
        {(intakeRawInput?.lifestyle || snapshot?.lifestyle_data) && (
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Lifestyle Information</h3>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {(intakeRawInput?.lifestyle?.work_nature || snapshot?.lifestyle_data?.work_nature) && (
                    <div>
                      <span className="text-muted-foreground">Work Nature: </span>
                      <span className="font-medium">{intakeRawInput?.lifestyle?.work_nature || snapshot?.lifestyle_data?.work_nature}</span>
                    </div>
                  )}
                  {(intakeRawInput?.lifestyle?.daily_routine || snapshot?.lifestyle_data?.daily_routine || intakeRawInput?.sleep_cycle) && (
                    <div>
                      <span className="text-muted-foreground">Daily Routine / Sleep Cycle: </span>
                      <span className="font-medium">{intakeRawInput?.lifestyle?.daily_routine || snapshot?.lifestyle_data?.daily_routine || intakeRawInput?.sleep_cycle}</span>
                    </div>
                  )}
                  {(intakeRawInput?.lifestyle?.water_intake || snapshot?.lifestyle_data?.water_intake) && (
                    <div>
                      <span className="text-muted-foreground">Water Intake: </span>
                      <span className="font-medium">{intakeRawInput?.lifestyle?.water_intake || snapshot?.lifestyle_data?.water_intake} L/day</span>
                    </div>
                  )}
                  {(intakeRawInput?.lifestyle?.screen_time || snapshot?.lifestyle_data?.screen_time) && (
                    <div>
                      <span className="text-muted-foreground">Screen Time: </span>
                      <span className="font-medium">{intakeRawInput?.lifestyle?.screen_time || snapshot?.lifestyle_data?.screen_time} hours/day</span>
                    </div>
                  )}
                  {(intakeRawInput?.lifestyle?.social_eating || snapshot?.lifestyle_data?.social_eating) && (
                    <div>
                      <span className="text-muted-foreground">Eating Out: </span>
                      <span className="font-medium">{intakeRawInput?.lifestyle?.social_eating || snapshot?.lifestyle_data?.social_eating}</span>
                    </div>
                  )}
                  {(intakeRawInput?.activity_level || snapshot?.client_context?.activity_level) && (
                    <div>
                      <span className="text-muted-foreground">Activity Level: </span>
                      <span className="font-medium capitalize">{intakeRawInput?.activity_level || snapshot?.client_context?.activity_level}</span>
                    </div>
                  )}
                </div>

                {/* Exercise Routine */}
                {(intakeRawInput?.lifestyle?.exercise_routine || snapshot?.lifestyle_data?.exercise_routine) && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h5 className="font-semibold mb-2">Exercise Routine</h5>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      {(intakeRawInput?.lifestyle?.exercise_routine?.type || snapshot?.lifestyle_data?.exercise_routine?.type) && (
                        <div>
                          <span className="text-muted-foreground">Type: </span>
                          <span className="font-medium">{intakeRawInput?.lifestyle?.exercise_routine?.type || snapshot?.lifestyle_data?.exercise_routine?.type}</span>
                        </div>
                      )}
                      {(intakeRawInput?.lifestyle?.exercise_routine?.frequency || snapshot?.lifestyle_data?.exercise_routine?.frequency) && (
                        <div>
                          <span className="text-muted-foreground">Frequency: </span>
                          <span className="font-medium">{intakeRawInput?.lifestyle?.exercise_routine?.frequency || snapshot?.lifestyle_data?.exercise_routine?.frequency}</span>
                        </div>
                      )}
                      {(intakeRawInput?.lifestyle?.exercise_routine?.intensity || snapshot?.lifestyle_data?.exercise_routine?.intensity) && (
                        <div>
                          <span className="text-muted-foreground">Intensity: </span>
                          <span className="font-medium">{intakeRawInput?.lifestyle?.exercise_routine?.intensity || snapshot?.lifestyle_data?.exercise_routine?.intensity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Substance Use */}
                {(intakeRawInput?.lifestyle?.substance_use || snapshot?.lifestyle_data?.substance_use) && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <h5 className="font-semibold mb-2">Substance Use</h5>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      {(intakeRawInput?.lifestyle?.substance_use?.smoking !== undefined || snapshot?.lifestyle_data?.substance_use?.smoking !== undefined) && (
                        <div>
                          <span className="text-muted-foreground">Smoking: </span>
                          <span className="font-medium">{intakeRawInput?.lifestyle?.substance_use?.smoking || snapshot?.lifestyle_data?.substance_use?.smoking ? "Yes" : "No"}</span>
                        </div>
                      )}
                      {(intakeRawInput?.lifestyle?.substance_use?.alcohol !== undefined || snapshot?.lifestyle_data?.substance_use?.alcohol !== undefined) && (
                        <div>
                          <span className="text-muted-foreground">Alcohol: </span>
                          <span className="font-medium">{intakeRawInput?.lifestyle?.substance_use?.alcohol || snapshot?.lifestyle_data?.substance_use?.alcohol ? "Yes" : "No"}</span>
                        </div>
                      )}
                      {(intakeRawInput?.lifestyle?.substance_use?.other || snapshot?.lifestyle_data?.substance_use?.other) && (
                        <div>
                          <span className="text-muted-foreground">Other: </span>
                          <span className="font-medium">{intakeRawInput?.lifestyle?.substance_use?.other || snapshot?.lifestyle_data?.substance_use?.other}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Goals Section (Extended) */}
        {(intakeRawInput?.goals_extended || snapshot?.goals) && (
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Health Goals</h3>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
              <div className="space-y-3 text-sm">
                {(intakeRawInput?.goals_extended?.primary_goal || snapshot?.goals?.primary_goal) && (
                  <div>
                    <span className="text-muted-foreground">Primary Goal: </span>
                    <span className="font-medium">{intakeRawInput?.goals_extended?.primary_goal || snapshot?.goals?.primary_goal}</span>
                  </div>
                )}
                {((intakeRawInput?.goals_extended?.secondary_goals && intakeRawInput.goals_extended.secondary_goals.length > 0) || 
                  (snapshot?.goals?.secondary_goals && snapshot.goals.secondary_goals.length > 0)) && (
                  <div>
                    <span className="text-muted-foreground">Secondary Goals: </span>
                    <span className="font-medium">
                      {(intakeRawInput?.goals_extended?.secondary_goals || snapshot?.goals?.secondary_goals || []).join(", ")}
                    </span>
                  </div>
                )}
                {(intakeRawInput?.goals_extended?.timeframe || snapshot?.goals?.timeframe) && (
                  <div>
                    <span className="text-muted-foreground">Timeframe: </span>
                    <span className="font-medium">{intakeRawInput?.goals_extended?.timeframe || snapshot?.goals?.timeframe}</span>
                  </div>
                )}
                {(intakeRawInput?.goals_extended?.motivation_level || snapshot?.goals?.motivation_level) && (
                  <div>
                    <span className="text-muted-foreground">Motivation Level: </span>
                    <span className="font-medium">{intakeRawInput?.goals_extended?.motivation_level || snapshot?.goals?.motivation_level}</span>
                  </div>
                )}
                {(intakeRawInput?.goals_extended?.past_attempts || snapshot?.goals?.past_attempts) && (
                  <div>
                    <span className="text-muted-foreground">Past Attempts: </span>
                    <span className="font-medium">{intakeRawInput?.goals_extended?.past_attempts || snapshot?.goals?.past_attempts}</span>
                  </div>
                )}
                {(intakeRawInput?.goals_extended?.readiness_to_change !== undefined || snapshot?.goals?.readiness_to_change !== undefined) && (
                  <div>
                    <span className="text-muted-foreground">Readiness to Change: </span>
                    <span className="font-medium">
                      {intakeRawInput?.goals_extended?.readiness_to_change || snapshot?.goals?.readiness_to_change}/10
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Medical History Section */}
        {(intakeRawInput?.diagnosed_conditions || intakeRawInput?.surgery_history || intakeRawInput?.blood_report || 
          intakeRawInput?.structured_allergies || intakeRawInput?.allergies || 
          intakeRawInput?.structured_medications || intakeRawInput?.medications || 
          intakeRawInput?.supplements || snapshot?.clinical_data?.medical_history) && (
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Medical History</h3>
            </div>

            <div className="space-y-6">
              {/* Diagnosed Conditions */}
              {(intakeRawInput?.diagnosed_conditions && intakeRawInput.diagnosed_conditions.length > 0) || 
               (snapshot?.clinical_data?.medical_history?.conditions && snapshot.clinical_data.medical_history.conditions.length > 0) ? (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                  <h4 className="font-semibold text-lg mb-3">Diagnosed Conditions</h4>
                  <div className="space-y-2">
                    {intakeRawInput?.diagnosed_conditions?.map((condition: any, index: number) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{condition.condition}</span>
                        {condition.severity && (
                          <span className="text-muted-foreground ml-2">({condition.severity})</span>
                        )}
                      </div>
                    ))}
                    {snapshot?.clinical_data?.medical_history?.conditions?.map((condition: string, index: number) => (
                      <div key={index} className="text-sm font-medium">{condition}</div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Allergies */}
              {(intakeRawInput?.structured_allergies || intakeRawInput?.allergies || 
                snapshot?.diet_data?.food_preferences?.excluded_ingredients) && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                  <h4 className="font-semibold text-lg mb-3">Allergies</h4>
                  <div className="text-sm">
                    {intakeRawInput?.structured_allergies && intakeRawInput.structured_allergies.length > 0 ? (
                      <span className="font-medium">{intakeRawInput.structured_allergies.join(", ")}</span>
                    ) : intakeRawInput?.allergies ? (
                      <span className="font-medium">{intakeRawInput.allergies}</span>
                    ) : snapshot?.diet_data?.food_preferences?.excluded_ingredients && snapshot.diet_data.food_preferences.excluded_ingredients.length > 0 ? (
                      <span className="font-medium">{snapshot.diet_data.food_preferences.excluded_ingredients.join(", ")}</span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Medications */}
              {(intakeRawInput?.structured_medications || intakeRawInput?.medications) && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                  <h4 className="font-semibold text-lg mb-3">Medications</h4>
                  <div className="space-y-2 text-sm">
                    {intakeRawInput?.structured_medications && intakeRawInput.structured_medications.length > 0 ? (
                      intakeRawInput.structured_medications.map((med: any, index: number) => (
                        <div key={index} className="font-medium">
                          {med.name}
                          {med.timing && <span className="text-muted-foreground ml-2">({med.timing})</span>}
                        </div>
                      ))
                    ) : intakeRawInput?.medications ? (
                      <span className="font-medium">{intakeRawInput.medications}</span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Supplements */}
              {intakeRawInput?.supplements && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                  <h4 className="font-semibold text-lg mb-3">Supplements</h4>
                  <p className="text-sm font-medium">{intakeRawInput.supplements}</p>
                </div>
              )}

              {/* Blood Report / Lab Results */}
              {(intakeRawInput?.blood_report || snapshot?.clinical_data?.labs) && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                  <h4 className="font-semibold text-lg mb-3">Lab Results</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {(intakeRawInput?.blood_report?.hb || snapshot?.clinical_data?.labs?.hb) && (
                      <div>
                        <span className="text-muted-foreground">Hemoglobin (Hb): </span>
                        <span className="font-medium">{intakeRawInput?.blood_report?.hb || snapshot?.clinical_data?.labs?.hb} g/dL</span>
                      </div>
                    )}
                    {(intakeRawInput?.blood_report?.rbc || snapshot?.clinical_data?.labs?.rbc) && (
                      <div>
                        <span className="text-muted-foreground">RBC Count: </span>
                        <span className="font-medium">{intakeRawInput?.blood_report?.rbc || snapshot?.clinical_data?.labs?.rbc} million/µL</span>
                      </div>
                    )}
                    {(intakeRawInput?.blood_report?.wbc || snapshot?.clinical_data?.labs?.wbc) && (
                      <div>
                        <span className="text-muted-foreground">WBC Count: </span>
                        <span className="font-medium">{intakeRawInput?.blood_report?.wbc || snapshot?.clinical_data?.labs?.wbc} thousand/µL</span>
                      </div>
                    )}
                    {(intakeRawInput?.blood_report?.platelets || snapshot?.clinical_data?.labs?.platelets) && (
                      <div>
                        <span className="text-muted-foreground">Platelets: </span>
                        <span className="font-medium">{intakeRawInput?.blood_report?.platelets || snapshot?.clinical_data?.labs?.platelets} thousand/µL</span>
                      </div>
                    )}
                    {(intakeRawInput?.blood_report?.report_date || snapshot?.clinical_data?.labs?.report_date) && (
                      <div>
                        <span className="text-muted-foreground">Report Date: </span>
                        <span className="font-medium">
                          {intakeRawInput?.blood_report?.report_date || snapshot?.clinical_data?.labs?.report_date}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dietary Preferences Section */}
        {(intakeRawInput?.dietary_preferences || intakeRawInput?.food_preferences || intakeRawInput?.diet_type ||
          snapshot?.diet_data?.dietary_preferences || snapshot?.diet_data?.food_preferences) && (
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Dietary Preferences</h3>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                <div className="space-y-4 text-sm">
                  {/* Diet Type */}
                  {(intakeRawInput?.diet_type || dietaryPreferencesList.length > 0) && (
                    <div>
                      <span className="text-muted-foreground">Diet Type: </span>
                      <span className="font-medium">
                        {intakeRawInput?.diet_type || dietaryPreferencesList[0] || "Not specified"}
                      </span>
                    </div>
                  )}

                  {/* Dietary Preferences List */}
                  {dietaryPreferencesList.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Dietary Preferences: </span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dietaryPreferencesList.map((pref: string, index: number) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Food Preferences */}
                  {(intakeRawInput?.food_preferences || snapshot?.diet_data?.food_preferences) && (
                    <div className="space-y-3">
                      {(intakeRawInput?.food_preferences?.favorite_foods || snapshot?.diet_data?.food_preferences?.favorite_foods) && 
                       (intakeRawInput?.food_preferences?.favorite_foods?.length > 0 || snapshot?.diet_data?.food_preferences?.favorite_foods?.length > 0) && (
                        <div>
                          <span className="text-muted-foreground">Favorite Foods: </span>
                          <span className="font-medium">
                            {(intakeRawInput?.food_preferences?.favorite_foods || snapshot?.diet_data?.food_preferences?.favorite_foods || []).join(", ")}
                          </span>
                        </div>
                      )}
                      {(intakeRawInput?.food_preferences?.likes || snapshot?.diet_data?.food_preferences?.likes) && 
                       (intakeRawInput?.food_preferences?.likes?.length > 0 || snapshot?.diet_data?.food_preferences?.likes?.length > 0) && (
                        <div>
                          <span className="text-muted-foreground">Likes: </span>
                          <span className="font-medium">
                            {(intakeRawInput?.food_preferences?.likes || snapshot?.diet_data?.food_preferences?.likes || []).join(", ")}
                          </span>
                        </div>
                      )}
                      {(intakeRawInput?.food_preferences?.dislikes || snapshot?.diet_data?.food_preferences?.dislikes) && 
                       (intakeRawInput?.food_preferences?.dislikes?.length > 0 || snapshot?.diet_data?.food_preferences?.dislikes?.length > 0) && (
                        <div>
                          <span className="text-muted-foreground">Dislikes: </span>
                          <span className="font-medium">
                            {(intakeRawInput?.food_preferences?.dislikes || snapshot?.diet_data?.food_preferences?.dislikes || []).join(", ")}
                          </span>
                        </div>
                      )}
                      {(intakeRawInput?.food_preferences?.excluded_ingredients || snapshot?.diet_data?.food_preferences?.excluded_ingredients) && 
                       (intakeRawInput?.food_preferences?.excluded_ingredients?.length > 0 || snapshot?.diet_data?.food_preferences?.excluded_ingredients?.length > 0) && (
                        <div>
                          <span className="text-muted-foreground">Excluded Ingredients: </span>
                          <span className="font-medium">
                            {(intakeRawInput?.food_preferences?.excluded_ingredients || snapshot?.diet_data?.food_preferences?.excluded_ingredients || []).join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dosha Quiz Section */}
        {(intakeRawInput?.dosha_answers || snapshot?.ayurveda_data?.ayurveda_quiz?.dosha_scores) && (
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Ayurveda Dosha Assessment</h3>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
              {snapshot?.ayurveda_data?.ayurveda_quiz?.dosha_scores ? (
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">Vata Score</p>
                    <p className="text-2xl font-bold text-primary">
                      {snapshot.ayurveda_data.ayurveda_quiz.dosha_scores.vata || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">Pitta Score</p>
                    <p className="text-2xl font-bold text-primary">
                      {snapshot.ayurveda_data.ayurveda_quiz.dosha_scores.pitta || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-muted-foreground mb-1">Kapha Score</p>
                    <p className="text-2xl font-bold text-primary">
                      {snapshot.ayurveda_data.ayurveda_quiz.dosha_scores.kapha || 0}
                    </p>
                  </div>
                </div>
              ) : intakeRawInput?.dosha_answers ? (
                <div className="text-sm text-muted-foreground">
                  <p>Dosha quiz completed. Scores will be calculated and displayed after assessment processing.</p>
                  <p className="mt-2">Number of questions answered: {Object.keys(intakeRawInput.dosha_answers).length}</p>
                </div>
              ) : null}
            </div>
          </div>
        )}

              {/* Surgery History */}
              {((intakeRawInput?.surgery_history && intakeRawInput.surgery_history.length > 0) || 
                (snapshot?.clinical_data?.medical_history?.surgery_history && snapshot.clinical_data.medical_history.surgery_history.length > 0)) && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
                  <h4 className="font-semibold text-lg mb-3">Surgery History</h4>
                  <div className="space-y-2">
                    {intakeRawInput?.surgery_history?.map((surgery: any, index: number) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{surgery.type}</span>
                        {surgery.date && <span className="text-muted-foreground ml-2">({surgery.date})</span>}
                        {surgery.notes && <p className="text-muted-foreground mt-1">{surgery.notes}</p>}
                      </div>
                    ))}
                    {snapshot?.clinical_data?.medical_history?.surgery_history?.map((surgery: any, index: number) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium">{surgery.type}</span>
                        {surgery.date && <span className="text-muted-foreground ml-2">({surgery.date})</span>}
                        {surgery.notes && <p className="text-muted-foreground mt-1">{surgery.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

        {/* Menstruation Cycle (for females) */}
        {((intakeRawInput?.menstruation_cycle || snapshot?.menstruation_cycle) && 
          (client.gender === "female" || intakeRawInput?.gender === "female")) && (
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-primary/10">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Menstruation Cycle</h3>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {(intakeRawInput?.menstruation_cycle?.cycle_length || snapshot?.menstruation_cycle?.cycle_length) && (
                  <div>
                    <span className="text-muted-foreground">Cycle Length: </span>
                    <span className="font-medium">
                      {intakeRawInput?.menstruation_cycle?.cycle_length || snapshot?.menstruation_cycle?.cycle_length} days
                    </span>
                  </div>
                )}
                {(intakeRawInput?.menstruation_cycle?.period_length || snapshot?.menstruation_cycle?.period_length) && (
                  <div>
                    <span className="text-muted-foreground">Period Length: </span>
                    <span className="font-medium">
                      {intakeRawInput?.menstruation_cycle?.period_length || snapshot?.menstruation_cycle?.period_length} days
                    </span>
                  </div>
                )}
                {(intakeRawInput?.menstruation_cycle?.last_period || snapshot?.menstruation_cycle?.last_period) && (
                  <div>
                    <span className="text-muted-foreground">Last Period: </span>
                    <span className="font-medium">
                      {intakeRawInput?.menstruation_cycle?.last_period || snapshot?.menstruation_cycle?.last_period}
                    </span>
                  </div>
                )}
                {((intakeRawInput?.menstruation_cycle?.irregularities && intakeRawInput.menstruation_cycle.irregularities.length > 0) ||
                  (snapshot?.menstruation_cycle?.irregularities && snapshot.menstruation_cycle.irregularities.length > 0)) && (
                  <div>
                    <span className="text-muted-foreground">Irregularities: </span>
                    <span className="font-medium">
                      {(intakeRawInput?.menstruation_cycle?.irregularities || snapshot?.menstruation_cycle?.irregularities || []).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Waist Circumference */}
        {(intakeRawInput?.waist_circumference || snapshot?.clinical_data?.anthropometry?.waist_circumference) && (
          <div className="wellness-card">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Waist Circumference</p>
              <p className="font-semibold text-lg">
                {intakeRawInput?.waist_circumference || snapshot?.clinical_data?.anthropometry?.waist_circumference} cm
              </p>
            </div>
          </div>
        )}

        {/* Diet Plans Section */}
        <div className="wellness-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Utensils className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Diet Plans</h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-xl">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate New Plan
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setShowAIDialog(true)}>
                  <Bot className="w-4 h-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">AI-Powered (Recommended)</span>
                    <span className="text-xs text-muted-foreground">Smart retrieval + AI meal planning</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowGenerateDialog(true)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  <div className="flex flex-col">
                    <span className="font-medium">Traditional</span>
                    <span className="text-xs text-muted-foreground">Instant rule-based generation</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoadingPlans ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : dietPlans.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {dietPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">Diet Plan v{plan.plan_version || 1}</h4>
                      <p className="text-sm text-muted-foreground">Created {new Date(plan.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge
                      variant={plan.status === "active" ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {plan.status || "active"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Version {plan.plan_version || 1}</span>
                    </div>
                    {plan.meal_plan && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span>Meal plan available</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-xl"
                      onClick={() => handleViewPlan(plan.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Plan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Utensils className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-4">
                No diet plans created yet. Generate a personalized plan to get started!
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-xl">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Your First Plan
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  <DropdownMenuItem onClick={() => setShowAIDialog(true)}>
                    <Bot className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">AI-Powered (Recommended)</span>
                      <span className="text-xs text-muted-foreground">Smart retrieval + AI meal planning</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowGenerateDialog(true)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Traditional</span>
                      <span className="text-xs text-muted-foreground">Instant rule-based generation</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </main>

      {/* Generate Diet Plan Dialogs */}
      {client && (
        <>
          {/* Smart Food Retrieval Editor */}
          {/* TODO: Update FoodRetrievalEditor to use Platform APIs and UUID strings */}
          {/* {retrievedFoods && (
            <FoodRetrievalEditor
              open={showFoodRetrievalEditor}
              onOpenChange={setShowFoodRetrievalEditor}
              foodsByCategory={retrievedFoods.foodsByCategory}
              clientId={client.id}
              filtersApplied={retrievedFoods.filtersApplied}
              onApprove={handleFoodsApproved}
            />
          )} */}
          
          {/* Traditional Diet Plan Dialog */}
          {/* TODO: Update GenerateDietPlanDialog to use Platform APIs */}
          {/* <GenerateDietPlanDialog
            open={showGenerateDialog}
            onOpenChange={setShowGenerateDialog}
            clientId={id!}
            clientName={getFullName()}
            onGenerate={handleGeneratePlan}
            isGenerating={isGeneratingPlan}
          /> */}
          
          {/* AI-Powered Diet Plan Dialog (with Smart Retrieval integrated) */}
          {/* TODO: Update GenerateDietPlanAIDialog to use Platform APIs */}
          {/* <GenerateDietPlanAIDialog
            open={showAIDialog}
            onOpenChange={setShowAIDialog}
            clientId={id!}
            clientName={getFullName()}
            healthProfile={healthProfileData}
            prefilledFoodsByCategory={approvedFoodsForPlan}
            prefilledFilters={approvedFiltersForPlan}
            onClearPrefill={() => {
              setApprovedFoodsForPlan(null);
              setApprovedFiltersForPlan(null);
            }}
            onComplete={() => {
              if (id) {
                fetchDietPlans(id);
              }
            }}
          /> */}
        </>
      )}

      {/* AI Chat Assistant - Floating Button */}
      {client && (
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
          <SheetTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 z-50"
              size="icon"
            >
              <Bot className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-[600px] p-0">
            {/* TODO: Update DietPlanChatInterface to use Platform APIs */}
            {/* <DietPlanChatInterface
              clientId={id!}
              clientName={getFullName()}
              onClose={() => setIsChatOpen(false)}
            /> */}
          </SheetContent>
        </Sheet>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client Profile</DialogTitle>
            <DialogDescription>
              Update client information. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-age">Age</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editFormData.age || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Age in years"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Select
                  value={editFormData.gender || ""}
                  onValueChange={(value) => setEditFormData({ ...editFormData, gender: value })}
                >
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
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="City, State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-height">Height (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  step="0.1"
                  value={editFormData.height_cm || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, height_cm: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="Height in centimeters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weight">Weight (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.1"
                  value={editFormData.weight_kg || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, weight_kg: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="Weight in kilograms"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdating || !editFormData.name}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetails;
