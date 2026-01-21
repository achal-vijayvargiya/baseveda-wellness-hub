import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Food {
  id: number;
  food_name: string;
  category: string;
  energy_kcal?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  composite_score?: number;
  dosha_effects_detailed?: Record<string, string>;
  [key: string]: any;
}

interface FoodCardProps {
  food: Food;
  onRemove?: () => void;
  onReplace?: () => void;
  isRemoved?: boolean;
  isSelected?: boolean;
}

export const FoodCard = ({
  food,
  onRemove,
  onReplace,
  isRemoved = false,
  isSelected = false,
}: FoodCardProps) => {
  return (
    <Card
      className={cn(
        "relative transition-all",
        isRemoved && "opacity-50 bg-muted",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{food.food_name}</h4>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {food.energy_kcal !== undefined && (
                <div>Energy: {food.energy_kcal} kcal/100g</div>
              )}
              <div className="flex gap-2">
                {food.protein_g !== undefined && (
                  <span>P: {food.protein_g}g</span>
                )}
                {food.carbs_g !== undefined && (
                  <span>C: {food.carbs_g}g</span>
                )}
                {food.fat_g !== undefined && (
                  <span>F: {food.fat_g}g</span>
                )}
              </div>
              {food.composite_score !== undefined && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Score: {food.composite_score.toFixed(1)}
                </Badge>
              )}
              {food.dosha_effects_detailed && Object.keys(food.dosha_effects_detailed).length > 0 && (
                <div className="text-xs mt-1">
                  {Object.entries(food.dosha_effects_detailed).map(([dosha, effect]) => (
                    <span key={dosha} className="mr-2">
                      {dosha}: {effect}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRemove}
                title="Remove"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {onReplace && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onReplace}
                title="Replace"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

