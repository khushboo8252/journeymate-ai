import { useTranslation } from "react-i18next";
import {
  Phone,
  Mail,
  Globe,
  Instagram,
  ShieldCheck,
} from "lucide-react";
import "@/i18n";
import logoImg from "@/assets/logo.jpg";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 transition-colors duration-300">
      <div className="container mx-auto px-6 py-10 md:py-12">
        
        {/* Main Content Grid: Stacked on mobile, 3 columns on medium screens up */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 items-start">
          
          {/* Column 1: Branding */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <img
              src={logoImg}
              alt="UKYRO Logo"
              className="h-9 md:h-11 w-auto object-contain brightness-100 dark:invert-0"
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              {t("footer.tagline")}
            </p>
            
            {/* Social Icons grouped right under branding on desktop */}
            <div className="flex items-center gap-3 mt-2">
              <a
                href="https://wa.me/917579235102"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {/* Replaced 'W' letter with an elegant text-based scale or you could use a MessageSquare icon */}
                <span className="font-bold text-sm tracking-tight">WA</span>
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Contact Info */}
          <div className="flex flex-col items-center md:items-center text-center gap-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:block">
              Contact Us
            </h4>
            <div className="flex flex-col items-center gap-3">
              <a
                href="tel:+917579235102"
                className="flex items-center gap-2.5 text-sm font-medium text-zinc-700 hover:text-emerald-600 dark:text-zinc-300 dark:hover:text-emerald-400 transition-colors group"
              >
                <Phone className="h-4 w-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                <span>+91 7579235102</span>
              </a>

              <a
                href="mailto:support@ukyro.com"
                className="flex items-center gap-2.5 text-sm font-medium text-zinc-700 hover:text-sky-600 dark:text-zinc-300 dark:hover:text-sky-400 transition-colors group"
              >
                <Mail className="h-4 w-4 text-zinc-400 group-hover:text-sky-500 transition-colors" />
                <span>support@ukyro.com</span>
              </a>
            </div>
          </div>

          {/* Column 3: Trust & Localization */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right gap-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider hidden md:block">
              Security & Region
            </h4>
            <div className="flex flex-col items-center md:items-end gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/10">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>100% Secure Bookings & Payments</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded">
                <Globe className="h-3.5 w-3.5" />
                <span>EN (IN)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            © {new Date().getFullYear()}{" "}
            <span className="font-bold tracking-wide">
              <span className="text-amber-500">U</span>
              <span className="text-zinc-700 dark:text-zinc-300">KYRO</span>
            </span>
            . {t("footer.rights")}
          </div>
          
          <div className="flex gap-4 text-zinc-400 dark:text-zinc-500">
            <a href="#" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">Terms of Service</a>
          </div>
        </div>
        
      </div>
    </footer>
  );
}