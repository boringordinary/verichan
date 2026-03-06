import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins/magic-link";
import { emailOTP } from "better-auth/plugins/email-otp";
import { organization } from "better-auth/plugins/organization";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createElement } from "react";
import { db } from "../database";
import * as schema from "../database/schema";
import { baseAc, admin, manager, viewer, reviewer } from "./permissions";
import MagicLinkEmail from "../emails/magic-link";
import OTPEmail from "../emails/otp";
import OrganizationInvitationEmail from "../emails/organization-invitation";
import { sendEmail } from "../lib/email";

export const auth = betterAuth({
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: "Sign in to Verichan",
          react: createElement(MagicLinkEmail, { signInUrl: url }),
        });
      },
    }),
    emailOTP({
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const subjects: Record<string, string> = {
          "sign-in": "Your Verichan sign-in code",
          "email-verification": "Verify your email for Verichan",
          "forget-password": "Reset your Verichan password",
          "change-email": "Confirm your new email for Verichan",
        };
        await sendEmail({
          to: email,
          subject: subjects[type] || "Your Verichan verification code",
          react: createElement(OTPEmail, { otp, type }),
        });
      },
    }),
    organization({
      ac: baseAc,
      roles: { admin, manager, viewer, reviewer },
      allowUserToCreateOrganization: false,
      creatorRole: "admin",
      async sendInvitationEmail(data) {
        const inviteLink = `${Bun.env.WEB_URL || "http://localhost:1069"}/invite/${data.id}`;
        await sendEmail({
          to: data.email,
          subject: `You've been invited to ${data.organization.name} on Verichan`,
          react: createElement(OrganizationInvitationEmail, {
            organizationName: data.organization.name,
            role: data.role,
            inviteUrl: inviteLink,
          }),
        });
      },
    }),
  ],
});

export type Auth = typeof auth;
