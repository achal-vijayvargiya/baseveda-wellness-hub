import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Circle,
  Play,
  Eye,
  Activity,
  FileText,
  Stethoscope,
  Target,
  Utensils,
  Sparkles,
  ChefHat,
} from "lucide-react";
import {
  platformAssessmentApi,
  platformClientApi,
  type PlatformNCPStatusResponse,
  type PlatformAssessmentResponse,
  type PlatformClientResponse,
} from "@/lib/platform-api";
import { toast } from "sonner";
import { NCPProcessFlow } from "@/components/NCPProcessFlow";

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
  },
  {
    id: "mnt",
    name: "MNT Constraints",
    description: "Medical Nutrition Therapy constraints",
    icon: Target,
  },
  {
    id: "targets",
    name: "Nutrition Targets",
    description: "Calories, macros, and micronutrients",
    icon: Target,
  },
  {
    id: "meal_structure",
    name: "Meal Structure",
    description: "Meal count, timing, and calorie distribution",
    icon: Utensils,
  },
  {
    id: "exchange_allocation",
    name: "Exchange Allocation",
    description: "Allocate exchanges per meal",
    icon: Target,
  },
  {
    id: "ayurveda",
    name: "Ayurveda Advisory",
    description: "Dosha assessment & lifestyle guidelines",
    icon: Sparkles,
  },
  {
    id: "intervention",
    name: "Food Intervention",
    description: "Generate meal plan with foods",
    icon: Utensils,
  },
  {
    id: "food_allocation",
    name: "Food Allocation",
    description: "Allocate foods to meals (Phase 1)",
    icon: Utensils,
  },
  {
    id: "recipe_generation",
    name: "Recipe Generation",
    description: "Generate recipes for approved meals (Phase 2)",
    icon: ChefHat,
  },
];

const NCPProcessPage = () => {
  const navigate = useNavigate();
  const { clientId, assessmentId } = useParams<{ clientId: string; assessmentId?: string }>();
  const [client, setClient] = useState<PlatformClientResponse | null>(null);
  const [assessment, setAssessment] = useState<PlatformAssessmentResponse | null>(null);
  const [status, setStatus] = useState<PlatformNCPStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  useEffect(() => {
    if (clientId) {
      fetchData();
    }
  }, [clientId, assessmentId]);

  const fetchData = async () => {
    if (!clientId) return;

    try {
      setLoading(true);

      // Fetch client data
      const clientData = await platformClientApi.getById(clientId);
      setClient(clientData);

      // Fetch assessments
      const assessments = await platformAssessmentApi.getByClientId(clientId);
      if (assessments && assessments.length > 0) {
        // Use provided assessmentId or get latest
        let selectedAssessment: PlatformAssessmentResponse;
        if (assessmentId) {
          selectedAssessment = assessments.find((a) => a.id === assessmentId) || assessments[0];
        } else {
          selectedAssessment = assessments.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
        }
        setAssessment(selectedAssessment);

        // Fetch NCP status
        const statusData = await platformAssessmentApi.getNCPStatus(selectedAssessment.id);
        setStatus(statusData);

        // Set current step index based on current_step
        const stepIndex = NCP_STEPS.findIndex((s) => s.id === statusData.current_step);
        if (stepIndex >= 0) {
          setSelectedStepIndex(stepIndex);
        }
      } else {
        toast.error("No assessment found for this client");
        navigate(`/client/${clientId}`);
      }
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      toast.error(error.message || "Failed to load data");
      navigate(`/client/${clientId}`);
    } finally {
      setLoading(false);
    }
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

  const getCompletedStepsCount = (): number => {
    if (!status) return 0;
    return NCP_STEPS.filter((step) => isStepCompleted(step.id)).length;
  };

  const getProgressPercentage = (): number => {
    return (getCompletedStepsCount() / NCP_STEPS.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client || !assessment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Client or Assessment not found</h2>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/client/${clientId}`)}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary">NCP Process Flow</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {client.name} • Step-by-step Nutrition Care Process execution
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold">
                  {getCompletedStepsCount()}/{NCP_STEPS.length} Steps Completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - All Steps Overview */}
          <aside className="col-span-12 lg:col-span-3">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-lg">All Steps Overview</h3>
                
                {/* Progress Bar */}
                <div className="mb-6">
                  <Progress value={getProgressPercentage()} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round(getProgressPercentage())}% Complete
                  </p>
                </div>

                {/* Steps List */}
                <div className="space-y-2">
                  {NCP_STEPS.map((step, index) => {
                    const completed = isStepCompleted(step.id);
                    const active = isStepActive(step.id);
                    const Icon = step.icon;
                    const isSelected = selectedStepIndex === index;

                    return (
                      <button
                        key={step.id}
                        onClick={() => setSelectedStepIndex(index)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isSelected
                            ? "bg-primary/10 border-2 border-primary"
                            : active
                            ? "bg-primary/5 border border-primary/20"
                            : completed
                            ? "bg-muted/50 border border-border"
                            : "bg-background border border-border hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : active ? (
                              <Circle className="w-5 h-5 text-primary fill-primary" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium text-sm">
                                Step {index + 1}: {step.name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {step.description}
                            </p>
                            {completed && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                Completed
                              </Badge>
                            )}
                            {active && !completed && (
                              <Badge variant="default" className="mt-2 text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right Content Area - Current Step Details */}
          <div className="col-span-12 lg:col-span-9">
            <NCPProcessFlow
              assessmentId={assessment.id}
              clientId={clientId}
              hideOverview={true}
              currentStepIndex={selectedStepIndex}
              onStepChange={setSelectedStepIndex}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default NCPProcessPage;
