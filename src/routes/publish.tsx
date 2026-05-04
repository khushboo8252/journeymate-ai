import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/publish")({
  head: () => ({
    meta: [
      { title: "Publish a ride — RideWave" },
      { name: "description", content: "Offer a seat in your car and travel for less." },
    ],
  }),
  component: PublishPage,
});

function PublishPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-24 text-center">
        <Car className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-3">Publish a ride</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Sign in to offer seats. Full publishing flow ships next iteration.
        </p>
        <Link to="/auth"><Button>Sign in to publish</Button></Link>
      </main>
      <Footer />
    </div>
  );
}