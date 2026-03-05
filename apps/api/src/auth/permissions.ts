import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  verificationSession: ["read", "list"],
  apiKey: ["create", "read", "update", "delete"],
  webhook: ["create", "read", "update", "delete"],
  review: ["read", "decide"],
} as const;

export const baseAc = createAccessControl(statement);

export const admin = baseAc.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  verificationSession: ["read", "list"],
  apiKey: ["create", "read", "update", "delete"],
  webhook: ["create", "read", "update", "delete"],
});

export const manager = baseAc.newRole({
  verificationSession: ["read", "list"],
  apiKey: ["read"],
  webhook: ["create", "read", "update", "delete"],
});

export const viewer = baseAc.newRole({
  verificationSession: ["read", "list"],
});

export const reviewer = baseAc.newRole({
  review: ["read", "decide"],
  verificationSession: ["read", "list"],
});

const roles = { admin, manager, viewer, reviewer } as const;

type RoleName = keyof typeof roles;

export const ac = {
  ...baseAc,
  hasPermission({
    role,
    permissions,
  }: {
    role: RoleName;
    permissions: Record<string, string[]>;
  }): boolean {
    const r = roles[role];
    if (!r) return false;
    return (r.authorize as (req: Record<string, string[]>) => { success: boolean })(permissions).success;
  },
};
