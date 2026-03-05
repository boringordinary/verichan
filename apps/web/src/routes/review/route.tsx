import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/review")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { user: session.user, session: session.session };
  },
  component: ReviewLayout,
});

function ReviewLayout() {
  const { user } = Route.useRouteContext();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Verichan Review</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{user.email}</span>
          <button
            onClick={() => authClient.signOut()}
            className="text-sm text-red-400 hover:underline"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
