import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/search")({
  component: SearchRedirect,
});

function SearchRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard
    navigate({ to: "/dashboard" });
  }, [navigate]);

  return null;
}