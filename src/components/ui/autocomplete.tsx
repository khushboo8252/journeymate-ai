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

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const getSuggestion = React.useMemo(() => {
    if (!inputValue || inputValue.length < 2) return null;
    const match = cities.find(city =>
      city.toLowerCase().startsWith(inputValue.toLowerCase())
    );
    return match && match.toLowerCase() !== inputValue.toLowerCase() ? match : null;
  }, [inputValue]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && getSuggestion) {
      e.preventDefault();
      onChange(getSuggestion);
      setInputValue(getSuggestion);
    }
  };

  const handleClear = () => {
    onChange("");
    setInputValue("");
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-8"
        />
        {getSuggestion && (
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <span className="text-transparent">{inputValue}</span>
            <span className="text-muted-foreground/50">{getSuggestion.slice(inputValue.length)}</span>
          </div>
        )}
      </div>
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
  );
}
