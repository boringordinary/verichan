import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

type EmailShellProps = {
  preview: string;
  title: string;
  intro: string;
  actionLabel: string;
  actionHref: string;
  children?: ReactNode;
};

export function EmailShell({
  preview,
  title,
  intro,
  actionLabel,
  actionHref,
  children,
}: EmailShellProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.card}>
            <Text style={styles.eyebrow}>Verichan</Text>
            <Heading style={styles.heading}>{title}</Heading>
            <Text style={styles.paragraph}>{intro}</Text>
            {children}
            <Button href={actionHref} style={styles.button}>
              {actionLabel}
            </Button>
            <Text style={styles.muted}>
              If the button does not work, use this link:
            </Text>
            <Link href={actionHref} style={styles.link}>
              {actionHref}
            </Link>
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
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: "#18181b",
    borderRadius: "12px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "600",
    margin: "16px 0 20px",
    padding: "14px 22px",
    textDecoration: "none",
  },
  muted: {
    color: "#71717a",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 8px",
  },
  link: {
    color: "#2563eb",
    fontSize: "14px",
    lineHeight: "22px",
    wordBreak: "break-all" as const,
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
