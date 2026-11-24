"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  className?: string;
}

export default function SearchBar({ onSearch, onClear, className }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery("");
    onClear();
    onSearch("");
  };

  return (
    <form
      role="search"
      onSubmit={handleSearch}
      className={cn(
        "relative flex items-center justify-center w-full max-w-[clamp(18rem,70vw,42rem)] mx-auto my-[clamp(1rem,3vw,2rem)]",
        className
      )}
    >
      {/* Search Input */}
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search job positions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "w-full rounded-full px-[clamp(1rem,2vw,1.5rem)] py-[clamp(0.75rem,2vw,1.25rem)] h-[clamp(48px,10vw,64px)] pr-14",
            "text-[clamp(0.9rem,1.5vw,1rem)] font-medium",
            "bg-white/80 dark:bg-white/10 backdrop-blur-xl",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none",
            "transition-all duration-300"
          )}
          aria-label="Search job positions"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300 hover:text-primary hover:scale-110 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Icon Button */}
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="Submit search"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-transparent hover:bg-primary/10 transition-all duration-300"
      >
        <Search
          className="text-primary hover:scale-110 transition-transform duration-200"
          size={22}
          strokeWidth={2.2}
        />
      </Button>
    </form>
  );
}
