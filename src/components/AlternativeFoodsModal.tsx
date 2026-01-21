import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FoodCard, Food } from "./FoodCard";
// TODO: ⚠️ DEPRECATED - This component uses legacy dietPlanApi.
// Platform API does not yet have alternative foods endpoints.
// This component needs to be migrated to use Platform NCP workflow.
import { dietPlanApi, AlternativeFoodsRequest } from "@/lib/api";
import { toast } from "sonner";

interface AlternativeFoodsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFood: Food;
  clientId: number;
  onSelect: (food: Food) => void;
}

export const AlternativeFoodsModal = ({
  open,
  onOpenChange,
  originalFood,
  clientId,
  onSelect,
}: AlternativeFoodsModalProps) => {
  const [alternatives, setAlternatives] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && originalFood.id) {
      fetchAlternatives();
    }
  }, [open, originalFood.id]);

  const fetchAlternatives = async () => {
    setLoading(true);
    try {
      const request: AlternativeFoodsRequest = {
        client_id: clientId,
        food_id: originalFood.id,
        limit: 5,
      };
      const response = await dietPlanApi.getAlternativeFoods(request);
      setAlternatives(response.alternatives || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch alternatives");
      console.error("Error fetching alternatives:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (food: Food) => {
    onSelect(food);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alternative Foods</DialogTitle>
          <DialogDescription>
            Select an alternative to replace "{originalFood.food_name}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : alternatives.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No alternatives found for this food.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {alternatives.map((food) => (
              <div key={food.id} className="relative">
                <FoodCard food={food} />
                <Button
                  className="w-full mt-2"
                  size="sm"
                  onClick={() => handleSelect(food)}
                >
                  Select This
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

