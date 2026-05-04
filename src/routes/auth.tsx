import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — RideWave" },
      { name: "description", content: "Sign in or create your RideWave account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-24 max-w-md text-center">
        <div className="glass rounded-2xl p-10">
          <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-3">Authentication</h1>
          <p className="text-muted-foreground mb-6">
            Email/password and Google sign-in ship in the next iteration along with the booking flow and admin panel.
          </p>
          <Link to="/"><Button variant="outline">Back home</Button></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}