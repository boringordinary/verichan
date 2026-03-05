import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins/magic-link";
import { organization } from "better-auth/plugins/organization";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { db } from "../database";
import * as schema from "../database/schema";
import { baseAc, admin, manager, viewer, reviewer } from "./permissions";

const resend = new Resend(Bun.env.RESEND_API_KEY);

export const auth = betterAuth({
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: Bun.env.EMAIL_FROM || "noreply@verichan.com",
          to: email,
          subject: "Sign in to Verichan",
          html: `<p>Click <a href="${url}">here</a> to sign in to Verichan.</p><p>This link expires in 5 minutes.</p>`,
        });
      },
      disableSignUp: true,
    }),
    organization({
      ac: baseAc,
      roles: { admin, manager, viewer, reviewer },
      allowUserToCreateOrganization: false,
      creatorRole: "admin",
      async sendInvitationEmail(data) {
        const inviteLink = `${Bun.env.WEB_URL || "http://localhost:5173"}/invite/${data.id}`;
        await resend.emails.send({
          from: Bun.env.EMAIL_FROM || "noreply@verichan.com",
          to: data.email,
          subject: `You've been invited to ${data.organization.name} on Verichan`,
          html: `<p>You've been invited to join <strong>${data.organization.name}</strong> as a <strong>${data.role}</strong>.</p><p>Click <a href="${inviteLink}">here</a> to accept the invitation.</p>`,
        });
      },
    }),
  ],
});

export type Auth = typeof auth;
