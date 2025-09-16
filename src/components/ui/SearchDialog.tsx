import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recentSearches = [
  "My summer vacation story",
  "Q4 business review keynote",
  "Product launch presentation",
];

const suggestions = [
  { title: "Dashboard Analytics", type: "page" },
  { title: "Create New Story", type: "action" },
  { title: "Story Templates", type: "feature" },
  { title: "Export Settings", type: "setting" },
];

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl p-0 gap-0">
        {/* Search Input */}
        <div className="flex items-center border-b border-border-soft px-4">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <Input
            placeholder="Search stories, keynotes, and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent p-4 focus-visible:ring-0 text-base"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-4">
          {query.length === 0 ? (
            <div className="space-y-6">
              {/* Recent Searches */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Recent searches
                </h3>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-auto p-3 rounded-xl"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{search}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Suggestions
                </h3>
                <div className="space-y-1">
                  {suggestions.map((item, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-between h-auto p-3 rounded-xl group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span>{item.title}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {item.type}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-apple" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No results found for "{query}"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-soft px-4 py-3">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="kbd">↵</kbd> to select • <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> to navigate
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}