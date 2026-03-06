import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type OTPEmailProps = {
  otp: string;
  type: "sign-in" | "email-verification" | "forget-password" | "change-email";
};

const titles: Record<OTPEmailProps["type"], string> = {
  "sign-in": "Your sign-in code",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
  "change-email": "Confirm your new email",
};

const intros: Record<OTPEmailProps["type"], string> = {
  "sign-in": "Enter this code to finish signing in to Verichan.",
  "email-verification": "Enter this code to verify your email address.",
  "forget-password": "Enter this code to reset your password.",
  "change-email": "Enter this code to confirm your new email address.",
};

export default function OTPEmail({ otp, type }: OTPEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your Verichan code is {otp}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Text style={styles.eyebrow}>Verichan</Text>
            <Heading style={styles.heading}>{titles[type]}</Heading>
            <Text style={styles.paragraph}>{intros[type]}</Text>
            <Section style={styles.codeContainer}>
              <Text style={styles.code}>{otp}</Text>
            </Section>
            <Text style={styles.muted}>
              This code expires in 5 minutes. If you didn't request this, you
              can safely ignore this email.
            </Text>
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              This email was sent by Verichan. If you were not expecting it, you
              can ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

OTPEmail.PreviewProps = {
  otp: "482913",
  type: "sign-in",
} satisfies OTPEmailProps;

const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: "0",
    padding: "32px 16px",
  },
  container: {
    margin: "0 auto",
    maxWidth: "560px",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    borderRadius: "20px",
    padding: "32px",
  },
  eyebrow: {
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.12em",
    margin: "0 0 12px",
    textTransform: "uppercase" as const,
  },
  heading: {
    color: "#18181b",
    fontSize: "28px",
    lineHeight: "36px",
    margin: "0 0 16px",
  },
  paragraph: {
    color: "#3f3f46",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 24px",
  },
  codeContainer: {
    backgroundColor: "#f4f4f5",
    borderRadius: "12px",
    margin: "0 0 24px",
    padding: "20px",
    textAlign: "center" as const,
  },
  code: {
    color: "#18181b",
    fontSize: "36px",
    fontWeight: "700",
    letterSpacing: "0.3em",
    lineHeight: "1",
    margin: "0",
    fontFamily: "monospace",
  },
  muted: {
    color: "#71717a",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 8px",
  },
  hr: {
    borderColor: "#e4e4e7",
    margin: "24px 0",
  },
  footer: {
    color: "#71717a",
    fontSize: "12px",
    lineHeight: "20px",
    margin: "0",
  },
} satisfies Record<string, Record<string, string>>;
