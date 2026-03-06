import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resend } from "resend";

const resendApiKey = Bun.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn(
    "RESEND_API_KEY is not set. Auth emails are disabled until it is configured.",
  );
}

function getResend() {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is required to send auth emails.");
  }

  return new Resend(resendApiKey);
}

export function renderEmail(template: ReactElement) {
  return `<!DOCTYPE html>${renderToStaticMarkup(template)}`;
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: ReactElement;
}) {
  await getResend().emails.send({
    from: Bun.env.EMAIL_FROM || "noreply@verichan.com",
    to,
    subject,
    html: renderEmail(react),
  });
}
