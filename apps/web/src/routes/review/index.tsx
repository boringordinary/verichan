import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/review/")({
  component: ReviewIndex,
});

function ReviewIndex() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Review Queue</h2>
      <p className="mt-2 text-gray-600">Verification sessions awaiting review.</p>
    </div>
  );
}
