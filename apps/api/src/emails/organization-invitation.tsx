import { Text } from "@react-email/components";
import { EmailShell } from "./components/email-shell";

type OrganizationInvitationEmailProps = {
  organizationName: string;
  role: string;
  inviteUrl: string;
};

export default function OrganizationInvitationEmail({
  organizationName,
  role,
  inviteUrl,
}: OrganizationInvitationEmailProps) {
  return (
    <EmailShell
      preview={`You were invited to join ${organizationName} on Verichan.`}
      title={`Join ${organizationName}`}
      intro={`You have been invited to collaborate in Verichan as a ${role}. Accept the invitation below to continue.`}
      actionLabel="Accept invitation"
      actionHref={inviteUrl}
    >
      <Text style={styles.meta}>
        Organization: <strong>{organizationName}</strong>
      </Text>
      <Text style={styles.meta}>
        Assigned role: <strong>{role}</strong>
      </Text>
    </EmailShell>
  );
}

OrganizationInvitationEmail.PreviewProps = {
  organizationName: "Acme Compliance",
  role: "reviewer",
  inviteUrl: "https://verichan.example.com/invite/inv_123",
} satisfies OrganizationInvitationEmailProps;

const styles = {
  meta: {
    color: "#27272a",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 8px",
  },
} satisfies Record<string, Record<string, string>>;
