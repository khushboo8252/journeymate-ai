import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Edit3 } from "lucide-react";

export interface LocationData {
  display_name: string;
  lat?: number;
  lon?: number;
  isManual?: boolean;
}

interface LocationAutocompleteProps {
  placeholder?: string;
  value?: string;
  onLocationSelect: (location: LocationData) => void;
  className?: string;
}

export function LocationAutocomplete({ placeholder, value, onLocationSelect, className }: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // 🚨 NAYA: User ki current location track karne ke liye state
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 1. 🚨 GOOGLE MAPS TRICK: Background mein Live Location fetch karo
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          console.log("GPS access denied, continuing with normal India-wide search.", err);
        },
        { enableHighAccuracy: false, timeout: 5000 } // Fast fetch
      );
    }
  }, []);

  // 2. Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Fetch locations from API
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const fetchLocations = async () => {
      setLoading(true);
      try {
        // Base API (India ke liye)
        let apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`;
        
        // 🚨 MAIN LOGIC: Agar user ki location mil gayi, toh "ViewBox" banakar search ko nazdeek (nearby) bias kar do
        if (userLoc) {
          // Approx 200km ka dabba (bounding box) banaya
          const left = userLoc.lon - 2;
          const right = userLoc.lon + 2;
          const top = userLoc.lat + 2;
          const bottom = userLoc.lat - 2;
          // URL mein viewbox add kar diya (bounded=0 ka matlab hai ki bahar ki jagah bhi dikhayega par local ko 1st priority dega)
          apiUrl += `&viewbox=${left},${top},${right},${bottom}&bounded=0`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Geocoding error:", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchLocations();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, userLoc]);

  const handleSelect = (location: LocationData) => {
    // Sirf starting ka zaroori naam uthayega
    const shortName = location.display_name.split(',').slice(0, 2).join(',');
    setQuery(shortName);
    setIsOpen(false);
    onLocationSelect({
      display_name: shortName,
      lat: Number(location.lat),
      lon: Number(location.lon)
    });
  };

  const handleManualSubmit = () => {
    const cleanQuery = query.trim();
    setQuery(cleanQuery);
    setIsOpen(false);
    onLocationSelect({
      display_name: cleanQuery,
      isManual: true
    });
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder || "Search location..."}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim().length > 0) {
              handleManualSubmit();
            }
          }}
          className={className}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-72 overflow-y-auto">
          
          {/* Map API Results */}
          {results.length > 0 ? (
            results.map((location, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 hover:bg-muted cursor-pointer transition-colors border-b last:border-b-0"
                onClick={() => handleSelect(location)}
              >
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="text-sm line-clamp-2">{location.display_name}</div>
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-muted-foreground text-center italic border-b">
              No places found on map.
            </div>
          )}

          {/* Manual Entry Option */}
          <div
            className="flex items-center gap-2 p-3 hover:bg-primary/10 cursor-pointer transition-colors bg-muted/30 text-primary font-medium"
            onClick={handleManualSubmit}
          >
            <Edit3 className="h-4 w-4 shrink-0" />
            <div className="text-sm">Use "{query}" exactly</div>
          </div>

        </div>
      )}
    </div>
  );
}