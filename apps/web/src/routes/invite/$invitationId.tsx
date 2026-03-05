import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/invite/$invitationId")({
  component: InvitePage,
});

function InvitePage() {
  const { invitationId } = Route.useParams();
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } =
    authClient.useSession();
  const [status, setStatus] = useState<
    "loading" | "accepting" | "needsLogin" | "error"
  >("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      setStatus("needsLogin");
      return;
    }

    // User is logged in, accept the invitation
    setStatus("accepting");
    authClient.organization
      .acceptInvitation({
        invitationId,
      })
      .then(({ error: acceptError }) => {
        if (acceptError) {
          setError(acceptError.message || "Failed to accept invitation");
          setStatus("error");
        } else {
          navigate({ to: "/dashboard" });
        }
      });
  }, [session, sessionLoading, invitationId, navigate]);

  if (status === "loading" || status === "accepting") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Accepting invitation...</p>
      </div>
    );
  }

  if (status === "needsLogin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Accept Invitation</h1>
          <p className="text-gray-600">Sign in to accept your invitation.</p>
          <a
            href={`/login?redirect=/invite/${invitationId}`}
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-red-600">Error</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );
}
