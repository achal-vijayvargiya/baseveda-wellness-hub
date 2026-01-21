import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { FoodCard, Food } from "./FoodCard";
// TODO: ⚠️ DEPRECATED - This component uses legacy dietPlanApi.
// Platform API does not yet have food search endpoints.
// This component needs to be migrated to use Platform NCP workflow.
import { dietPlanApi, SearchFoodsRequest } from "@/lib/api";
import { toast } from "sonner";

interface SearchFoodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  clientId: number;
  onAdd: (food: Food) => void;
}

export const SearchFoodsDialog = ({
  open,
  onOpenChange,
  category,
  clientId,
  onAdd,
}: SearchFoodsDialogProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear timer on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const request: SearchFoodsRequest = {
        client_id: clientId,
        category: category,
        query: searchQuery,
        limit: 10,
      };
      const response = await dietPlanApi.searchFoods(request);
      setResults(response.foods || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to search foods");
      console.error("Error searching foods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer for debounced search
    const timer = setTimeout(() => {
      handleSearch(value);
    }, 300);

    setDebounceTimer(timer);
  };

  const handleAdd = (food: Food) => {
    onAdd(food);
    toast.success(`Added ${food.food_name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Foods in {category}</DialogTitle>
          <DialogDescription>
            Search for foods to add to this category
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by food name..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No foods found matching "{query}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((food) => (
                <div key={food.id} className="relative">
                  <FoodCard food={food} />
                  <Button
                    className="w-full mt-2"
                    size="sm"
                    onClick={() => handleAdd(food)}
                  >
                    Add to List
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

