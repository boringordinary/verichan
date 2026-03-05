import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

function DashboardIndex() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="mt-2 text-gray-600">Welcome to Verichan.</p>
    </div>
  );
}
