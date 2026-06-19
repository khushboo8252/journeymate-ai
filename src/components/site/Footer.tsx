import { useTranslation } from "react-i18next";
import { Phone } from "lucide-react";
import "@/i18n";
import logoImg from "@/assets/logo.jpg";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/40 mt-24">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="h-8 object-contain" />
            <div>
              <div className="font-bold">Uk<span className="text-gradient">yro</span></div>
              <div className="text-xs text-muted-foreground">{t("footer.tagline")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Help Line: +91 9876543210</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} UKYRO. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}