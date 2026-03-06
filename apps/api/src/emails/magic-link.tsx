import { Text } from "@react-email/components";
import { EmailShell } from "./components/email-shell";

type MagicLinkEmailProps = {
  signInUrl: string;
};

export default function MagicLinkEmail({ signInUrl }: MagicLinkEmailProps) {
  return (
    <EmailShell
      preview="Your Verichan sign-in link is ready."
      title="Sign in to Verichan"
      intro="Use the secure link below to finish signing in. This link expires in 5 minutes."
      actionLabel="Sign in"
      actionHref={signInUrl}
    >
      <Text style={styles.note}>
        For security, only use this link on a device where you started the
        login flow.
      </Text>
    </EmailShell>
  );
}

MagicLinkEmail.PreviewProps = {
  signInUrl: "https://verichan.example.com/auth/callback?token=demo",
} satisfies MagicLinkEmailProps;

const styles = {
  note: {
    color: "#52525b",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0",
  },
} satisfies Record<string, Record<string, string>>;
