import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const change = (lng: "en" | "hi") => i18n.changeLanguage(lng);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-foreground/80 hover:text-foreground">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{i18n.language === "hi" ? "हिन्दी" : "EN"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass">
        <DropdownMenuItem onClick={() => change("en")}>{t("lang.en")}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("hi")}>{t("lang.hi")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}