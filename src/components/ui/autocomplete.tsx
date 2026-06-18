import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const cities = [
  "Dehradun",
  "Haridwar",
  "Rishikesh",
  "Mussoorie",
  "Nainital",
  "Jim Corbett",
  "Ranikhet",
  "Almora",
  "Kausani",
  "Bageshwar",
  "Pithoragarh",
  "Chamoli",
  "Uttarkashi",
  "Tehri",
  "Pauri",
  "Rudraprayag",
  "Karnaprayag",
  "Joshimath",
  "Auli",
  "Haldwani",
  "Kashipur",
  "Roorkee",
  "Kotdwar",
  "Lansdowne",
  "Chakrata",
  "Pauri Garhwal",
  "Srinagar",
  "Devprayag",
];

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Autocomplete({ value, onChange, placeholder, className }: AutocompleteProps) {
  const [inputValue, setInputValue] = React.useState(value);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredCities = React.useMemo(() => {
    if (!inputValue) return [];
    return cities.filter(city =>
      city.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [inputValue]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
    setShowSuggestions(newValue.length > 0);
    setSelectedIndex(-1);
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setInputValue(city);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredCities.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredCities.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredCities[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    onChange("");
    setInputValue("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          placeholder={placeholder}
          className="pr-8"
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
      {showSuggestions && filteredCities.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border/40 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredCities.map((city, index) => (
            <div
              key={city}
              className={cn(
                "px-4 py-2 cursor-pointer hover:bg-primary/10 transition-colors",
                selectedIndex === index && "bg-primary/20"
              )}
              onClick={() => handleSelect(city)}
            >
              {city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
