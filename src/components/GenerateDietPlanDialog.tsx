import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { PlatformPlanGenerateRequest } from "@/lib/platform-api";

// TODO: This component uses legacy DietPlanGenerateRequest structure.
// Platform API uses PlatformPlanGenerateRequest which requires assessment_id.
// This component needs to be updated to work with Platform NCP workflow.
type DietPlanGenerateRequest = PlatformPlanGenerateRequest & {
  duration_days?: number;
  name?: string;
  custom_goals?: string;
  custom_diet_type?: string;
  custom_allergies?: string;
  prefer_satvik?: boolean;
  include_regional_foods?: string;
  meal_variety?: string;
};

interface GenerateDietPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  clientName: string;
  onGenerate: (request: DietPlanGenerateRequest) => Promise<void>;
  isGenerating: boolean;
}

export const GenerateDietPlanDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
  onGenerate,
  isGenerating,
}: GenerateDietPlanDialogProps) => {
  const [formData, setFormData] = useState<DietPlanGenerateRequest>({
    client_id: clientId,
    duration_days: 7,
    name: `${clientName} - 7 Day Plan`,
    custom_goals: "",
    custom_diet_type: undefined,
    custom_allergies: "",
    prefer_satvik: true,
    include_regional_foods: undefined,
    meal_variety: "medium",
  });

  const handleGenerate = async () => {
    await onGenerate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate AI Diet Plan</DialogTitle>
          <DialogDescription>
            Create a personalized 7-day meal plan for {clientName} using AI-powered recommendations based on their health profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Weight Loss Plan - 7 Days"
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (Days)</Label>
            <Select
              value={formData.duration_days?.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, duration_days: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="21">21 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Goals */}
          <div className="space-y-2">
            <Label htmlFor="goals">
              Custom Goals <span className="text-muted-foreground text-sm">(Optional)</span>
            </Label>
            <Textarea
              id="goals"
              value={formData.custom_goals}
              onChange={(e) =>
                setFormData({ ...formData, custom_goals: e.target.value })
              }
              placeholder="e.g., Weight loss, muscle gain, improve digestion"
              rows={2}
            />
          </div>

          {/* Diet Type */}
          <div className="space-y-2">
            <Label htmlFor="diet_type">
              Diet Type <span className="text-muted-foreground text-sm">(Optional)</span>
            </Label>
            <Select
              value={formData.custom_diet_type || undefined}
              onValueChange={(value) =>
                setFormData({ ...formData, custom_diet_type: value === "auto" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Auto-detect from profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect from profile</SelectItem>
                <SelectItem value="veg">Vegetarian</SelectItem>
                <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="eggetarian">Eggetarian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Allergies */}
          <div className="space-y-2">
            <Label htmlFor="allergies">
              Custom Allergies <span className="text-muted-foreground text-sm">(Optional)</span>
            </Label>
            <Input
              id="allergies"
              value={formData.custom_allergies}
              onChange={(e) =>
                setFormData({ ...formData, custom_allergies: e.target.value })
              }
              placeholder="e.g., peanuts, dairy, gluten"
            />
          </div>

          {/* Regional Foods */}
          <div className="space-y-2">
            <Label htmlFor="regional">
              Regional Foods <span className="text-muted-foreground text-sm">(Optional)</span>
            </Label>
            <Select
              value={formData.include_regional_foods || undefined}
              onValueChange={(value) =>
                setFormData({ ...formData, include_regional_foods: value === "any" ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Include any regional cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Cuisine</SelectItem>
                <SelectItem value="North Indian">North Indian</SelectItem>
                <SelectItem value="South Indian">South Indian</SelectItem>
                <SelectItem value="East Indian">East Indian</SelectItem>
                <SelectItem value="West Indian">West Indian</SelectItem>
                <SelectItem value="Pan-Indian">Pan-Indian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meal Variety */}
          <div className="space-y-2">
            <Label htmlFor="variety">Meal Variety</Label>
            <Select
              value={formData.meal_variety}
              onValueChange={(value) =>
                setFormData({ ...formData, meal_variety: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select variety" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Similar meals</SelectItem>
                <SelectItem value="medium">Medium - Balanced</SelectItem>
                <SelectItem value="high">High - Maximum variety</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Satvik Preference */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="satvik" className="text-base">
                Prefer Satvik Foods
              </Label>
              <p className="text-sm text-muted-foreground">
                Prioritize pure, natural, and energizing foods following Ayurvedic principles
              </p>
            </div>
            <Switch
              id="satvik"
              checked={formData.prefer_satvik}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, prefer_satvik: checked })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Plan...
              </>
            ) : (
              "Generate Diet Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

