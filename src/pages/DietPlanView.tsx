import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  TrendingUp,
  Leaf,
  Heart,
  Download,
  Loader2,
  Utensils,
  Clock,
} from "lucide-react";
import { platformPlanApi, type PlatformPlanResponse } from "@/lib/platform-api";
import { toast } from "sonner";

// Legacy types for backward compatibility with UI
interface DietPlanMeal {
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

interface DietPlan {
  id?: number;
  name: string;
  description?: string;
  duration_days: number;
  status?: string;
  target_calories?: number;
  target_protein_g?: number;
  target_carbs_g?: number;
  target_fat_g?: number;
  diet_type?: string;
  dosha_type?: string;
  meals?: DietPlanMeal[];
}

const DietPlanView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("1");

  // Helper function to map platform meal_plan structure to DietPlanMeal[]
  const mapMealPlanToMeals = (mealPlan: Record<string, any>): DietPlanMeal[] => {
    // TODO: Implement proper mapping based on platform meal_plan structure
    // Platform meal_plan structure needs to be defined/standardized
    // For now, return empty array
    return [];
  };

  useEffect(() => {
    if (id) {
      fetchPlanData(id); // UUID string
    }
  }, [id]);

  const fetchPlanData = async (planId: string) => {
    try {
      setIsLoading(true);
      const data = await platformPlanApi.getById(planId);
      // Map PlatformPlanResponse to DietPlan format for UI compatibility
      const mappedPlan: DietPlan = {
        id: parseInt(data.id.replace(/-/g, "").substring(0, 8), 16), // Convert UUID to number for compatibility
        name: `Diet Plan v${data.plan_version || 1}`,
        description: `Created ${new Date(data.created_at).toLocaleDateString()}`,
        duration_days: 7, // Default, should come from plan data
        status: data.status || "active",
        target_calories: data.constraints_snapshot?.calories_target,
        diet_type: data.constraints_snapshot?.diet_type,
        meals: data.meal_plan ? mapMealPlanToMeals(data.meal_plan) : [],
      };
      setPlan(mappedPlan);
    } catch (error: any) {
      console.error("Failed to fetch diet plan:", error);
      toast.error(error.message || "Failed to load diet plan");
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const getMealsByDay = (dayNumber: number): DietPlanMeal[] => {
    if (!plan?.meals) return [];
    return plan.meals
      .filter((meal) => meal.day_number === dayNumber)
      .sort((a, b) => a.order_in_day - b.order_in_day);
  };

  const handleExport = async (format: "json" | "pdf") => {
    try {
      toast.loading(`Exporting diet plan as ${format.toUpperCase()}...`, { id: "export" });
      
      // TODO: Platform API doesn't have export endpoint yet
      // For now, export the plan data we have
      if (!plan) {
        throw new Error("No plan data available");
      }

      if (format === "json") {
        const data = {
          id: plan.id,
          name: plan.name,
          description: plan.description,
          duration_days: plan.duration_days,
          status: plan.status,
          target_calories: plan.target_calories,
          meals: plan.meals,
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `diet-plan-${plan.name?.replace(/\s+/g, "-")}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Diet plan exported successfully!", { id: "export" });
      } else {
        // PDF export not available in platform API yet
        toast.error("PDF export is not yet available in Platform API", { id: "export" });
      }
    } catch (error: any) {
      console.error("Failed to export diet plan:", error);
      toast.error(error.message || "Failed to export diet plan", { id: "export" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Diet plan not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const daysArray = Array.from(
    { length: plan.duration_days || 7 },
    (_, i) => i + 1
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">{plan.name}</h1>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                {plan.status || "active"}
              </Badge>
              <div className="flex items-center gap-2">
                <Button onClick={() => handleExport("pdf")} variant="default" className="rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={() => handleExport("json")} variant="outline" className="rounded-xl">
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Plan Overview */}
        <div className="wellness-card wellness-gradient">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold">{plan.duration_days} days</p>
              </div>
            </div>

            {plan.target_calories && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Calories</p>
                  <p className="text-lg font-semibold">{plan.target_calories}</p>
                </div>
              </div>
            )}

            {plan.diet_type && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Leaf className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Diet Type</p>
                  <p className="text-lg font-semibold capitalize">{plan.diet_type}</p>
                </div>
              </div>
            )}

            {plan.dosha_type && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dosha Type</p>
                  <p className="text-lg font-semibold">{plan.dosha_type}</p>
                </div>
              </div>
            )}

            {plan.meals && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Utensils className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Meals</p>
                  <p className="text-lg font-semibold">{plan.meals.length}</p>
                </div>
              </div>
            )}
          </div>

          {/* Nutritional Targets */}
          {(plan.target_protein_g || plan.target_carbs_g || plan.target_fat_g) && (
            <div className="mt-6 pt-6 border-t border-border/50">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Daily Nutritional Targets
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {plan.target_protein_g && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {plan.target_protein_g}g
                    </p>
                  </div>
                )}
                {plan.target_carbs_g && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20">
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                      {plan.target_carbs_g}g
                    </p>
                  </div>
                )}
                {plan.target_fat_g && (
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20">
                    <p className="text-xs text-muted-foreground">Fat</p>
                    <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {plan.target_fat_g}g
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Meal Plan Tabs */}
        <div className="wellness-card">
          <h2 className="text-2xl font-semibold mb-6">Meal Plan</h2>
          
          <Tabs value={selectedDay} onValueChange={setSelectedDay}>
            <TabsList className="mb-6">
              {daysArray.map((day) => (
                <TabsTrigger key={day} value={day.toString()}>
                  Day {day}
                </TabsTrigger>
              ))}
            </TabsList>

            {daysArray.map((day) => (
              <TabsContent key={day} value={day.toString()}>
                <div className="space-y-4">
                  {getMealsByDay(day).length > 0 ? (
                    getMealsByDay(day).map((meal) => (
                      <div
                        key={meal.id}
                        className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">{meal.meal_type}</Badge>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{meal.meal_time}</span>
                              </div>
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{meal.food_dish}</h3>
                            {meal.healing_purpose && (
                              <p className="text-sm text-muted-foreground mb-2">
                                <span className="font-medium text-primary">Healing Purpose:</span>{" "}
                                {meal.healing_purpose}
                              </p>
                            )}
                          </div>
                          {meal.calories && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">{meal.calories}</p>
                              <p className="text-xs text-muted-foreground">calories</p>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {meal.portion && (
                            <div>
                              <p className="text-xs text-muted-foreground">Portion</p>
                              <p className="font-medium">{meal.portion}</p>
                            </div>
                          )}
                          {meal.protein_g !== undefined && meal.protein_g !== null && (
                            <div>
                              <p className="text-xs text-muted-foreground">Protein</p>
                              <p className="font-medium">{meal.protein_g}g</p>
                            </div>
                          )}
                          {meal.carbs_g !== undefined && meal.carbs_g !== null && (
                            <div>
                              <p className="text-xs text-muted-foreground">Carbs</p>
                              <p className="font-medium">{meal.carbs_g}g</p>
                            </div>
                          )}
                          {meal.fat_g !== undefined && meal.fat_g !== null && (
                            <div>
                              <p className="text-xs text-muted-foreground">Fat</p>
                              <p className="font-medium">{meal.fat_g}g</p>
                            </div>
                          )}
                        </div>

                        {meal.dosha_notes && (
                          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <p className="text-sm">
                              <span className="font-medium text-primary">Dosha Notes:</span>{" "}
                              {meal.dosha_notes}
                            </p>
                          </div>
                        )}

                        {meal.notes && (
                          <div className="mt-3 p-3 rounded-xl bg-muted/50">
                            <p className="text-sm">
                              <span className="font-medium">Notes:</span> {meal.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground">No meals planned for this day</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DietPlanView;

