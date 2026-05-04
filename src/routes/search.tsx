import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search rides — RideWave" },
      { name: "description", content: "Find shared carpool rides across India." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-24 text-center">
        <Construction className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-3">Search results coming soon</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Ride listings, filters, and bookings ship in the next iteration.
        </p>
        <Link to="/"><Button variant="outline">Back home</Button></Link>
      </main>
      <Footer />
    </div>
  );
}