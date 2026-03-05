import Elysia from "elysia";

/**
 * Guard that checks if the authenticated user has one of the allowed roles
 * in their active organization.
 *
 * Must be used after a derive() that sets `memberRole` on the context.
 */
export function requireRole(allowedRoles: string[]) {
  return (app: typeof Elysia.prototype) =>
    app.onBeforeHandle((ctx: any) => {
      const memberRole = ctx.memberRole as string | undefined;
      if (!memberRole || !allowedRoles.includes(memberRole)) {
        ctx.set.status = 403;
        return { error: "Forbidden: insufficient role" };
      }
    });
}

/**
 * Guard that checks if the user is a reviewer (member of the verichan org).
 * Allows both "reviewer" and "admin" roles.
 *
 * Must be used after a derive() that sets `memberRole` on the context.
 */
export function requireReviewer() {
  return (app: typeof Elysia.prototype) =>
    app.onBeforeHandle((ctx: any) => {
      const memberRole = ctx.memberRole as string | undefined;
      if (!memberRole || !["reviewer", "admin"].includes(memberRole)) {
        ctx.set.status = 403;
        return { error: "Forbidden: reviewer access required" };
      }
    });
}
