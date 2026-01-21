import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Loader2, Undo2, Redo2, RotateCcw, Plus, Search } from "lucide-react";
import { FoodCard, Food } from "./FoodCard";
import { AlternativeFoodsModal } from "./AlternativeFoodsModal";
import { SearchFoodsDialog } from "./SearchFoodsDialog";
// TODO: ⚠️ DEPRECATED - This component uses legacy dietPlanApi.
// Platform API does not yet have food retrieval endpoints.
// This component needs to be migrated to use Platform NCP workflow.
import { dietPlanApi, MoreFoodsRequest } from "@/lib/api";
import { toast } from "sonner";

interface FoodListState {
  [category: string]: Food[];
}

interface FiltersApplied {
  allergies?: string;
  diseases?: string;
  diet_type?: string;
  goals?: string;
}

interface FoodRetrievalEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  foodsByCategory: FoodListState;
  clientId: number;
  filtersApplied: FiltersApplied;
  onApprove: (foodsByCategory: FoodListState) => void;
}

export const FoodRetrievalEditor = ({
  open,
  onOpenChange,
  foodsByCategory: initialFoods,
  clientId,
  filtersApplied,
  onApprove,
}: FoodRetrievalEditorProps) => {
  const [foodsState, setFoodsState] = useState<FoodListState>(initialFoods);
  const [history, setHistory] = useState<FoodListState[]>([initialFoods]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [replacementFood, setReplacementFood] = useState<Food | null>(null);
  const [searchCategory, setSearchCategory] = useState<string | null>(null);
  const [removedFoods, setRemovedFoods] = useState<Set<number>>(new Set());

  const saveToHistory = useCallback((newState: FoodListState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const updateFoodsState = useCallback((updater: (prev: FoodListState) => FoodListState) => {
    setFoodsState((prev) => {
      const newState = updater(prev);
      saveToHistory(newState);
      return newState;
    });
  }, [saveToHistory]);

  const handleRemoveFood = (category: string, foodId: number) => {
    updateFoodsState((prev) => ({
      ...prev,
      [category]: prev[category]?.filter((f) => f.id !== foodId) || [],
    }));
    setRemovedFoods((prev) => new Set([...prev, foodId]));
    toast.success("Food removed");
  };

  const handleReplaceFood = (food: Food) => {
    setReplacementFood(food);
  };

  const handleSelectAlternative = (originalFood: Food, alternative: Food) => {
    const category = originalFood.category;
    updateFoodsState((prev) => ({
      ...prev,
      [category]: prev[category]?.map((f) =>
        f.id === originalFood.id ? alternative : f
      ) || [],
    }));
    toast.success(`Replaced ${originalFood.food_name} with ${alternative.food_name}`);
  };

  const handleShowMore = async (category: string) => {
    setLoadingStates((prev) => ({ ...prev, [category]: true }));
    try {
      const currentFoodIds = foodsState[category]?.map((f) => f.id) || [];
      const request: MoreFoodsRequest = {
        client_id: clientId,
        category: category,
        exclude_food_ids: currentFoodIds,
        limit: 8,
      };
      const response = await dietPlanApi.getMoreFoods(request);
      const newFoods = response.foods || [];
      
      updateFoodsState((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), ...newFoods],
      }));
      
      if (newFoods.length === 0) {
        toast.info("No more foods available in this category");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load more foods");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [category]: false }));
    }
  };

  const handleAddFromSearch = (food: Food) => {
    const category = food.category;
    updateFoodsState((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), food],
    }));
  };

  const handleResetCategory = (category: string) => {
    updateFoodsState((prev) => ({
      ...prev,
      [category]: initialFoods[category] || [],
    }));
    toast.success(`Reset ${category} to original list`);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFoodsState(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFoodsState(history[newIndex]);
    }
  };

  const handleApprove = () => {
    // Filter out removed foods
    const finalState: FoodListState = {};
    Object.entries(foodsState).forEach(([category, foods]) => {
      finalState[category] = foods.filter((f) => !removedFoods.has(f.id));
    });
    onApprove(finalState);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review & Edit Food Selection</DialogTitle>
            <DialogDescription>
              Modify the food list before proceeding. You can remove, replace, or add foods.
            </DialogDescription>
          </DialogHeader>

          {/* Filters Applied */}
          <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
            <Badge variant="outline">Allergies: {filtersApplied.allergies || "None"}</Badge>
            <Badge variant="outline">Diseases: {filtersApplied.diseases || "None"}</Badge>
            <Badge variant="outline">Diet: {filtersApplied.diet_type || "Auto"}</Badge>
            <Badge variant="outline">Goals: {filtersApplied.goals || "General"}</Badge>
          </div>

          {/* Undo/Redo Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo}
            >
              <Undo2 className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo}
            >
              <Redo2 className="h-4 w-4 mr-2" />
              Redo
            </Button>
          </div>

          {/* Food Categories Accordion */}
          <Accordion type="multiple" className="w-full">
            {Object.entries(foodsState).map(([category, foods]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="font-semibold">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{category} ({foods.length} foods)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {/* Category Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowMore(category)}
                        disabled={loadingStates[category]}
                      >
                        {loadingStates[category] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Show More
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchCategory(category)}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetCategory(category)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>

                    {/* Food Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {foods.map((food) => (
                        <FoodCard
                          key={food.id}
                          food={food}
                          isRemoved={removedFoods.has(food.id)}
                          onRemove={() => handleRemoveFood(category, food.id)}
                          onReplace={() => handleReplaceFood(food)}
                        />
                      ))}
                    </div>

                    {foods.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No foods in this category
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>
              Approve & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alternative Foods Modal */}
      {replacementFood && (
        <AlternativeFoodsModal
          open={!!replacementFood}
          onOpenChange={(open) => !open && setReplacementFood(null)}
          originalFood={replacementFood}
          clientId={clientId}
          onSelect={(alternative) => handleSelectAlternative(replacementFood, alternative)}
        />
      )}

      {/* Search Foods Dialog */}
      {searchCategory && (
        <SearchFoodsDialog
          open={!!searchCategory}
          onOpenChange={(open) => !open && setSearchCategory(null)}
          category={searchCategory}
          clientId={clientId}
          onAdd={handleAddFromSearch}
        />
      )}
    </>
  );
};

