import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Ukyro" },
      { name: "description", content: "Why we're building India's smartest carpool network." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-24 max-w-3xl">
        <h1 className="text-5xl font-bold mb-6">About <span className="text-gradient">Ukyro</span></h1>
        <p className="text-lg text-muted-foreground leading-relaxed mb-4">
          Ukyro connects travelers across India with verified drivers heading the same way. We use AI to match riders in milliseconds, keep prices transparent, and make every journey safer and greener.
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Built for the modern Indian commuter — whether you're heading to Delhi for the weekend or sharing a daily commute, Ukyro is the smartest way to move.
        </p>
      </main>
      <Footer />
    </div>
  );
}