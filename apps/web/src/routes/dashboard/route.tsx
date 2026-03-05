import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { user: session.user, session: session.session };
  },
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user } = Route.useRouteContext();

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Verichan Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button
            onClick={() => authClient.signOut()}
            className="text-sm text-red-600 hover:underline"
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
