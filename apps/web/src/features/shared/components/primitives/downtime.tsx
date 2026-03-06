import { Heading } from "./heading";
import { Text } from "./text";

interface DowntimeProps {
  className?: string;
  show?: boolean;
  title?: string;
  message?: string;
  submessage?: string;
  extra?: string[];
}

export function Downtime({
  className,
  show = false,
  title,
  message,
  submessage,
  extra = [],
}: DowntimeProps) {
  if (!show) return null;

  return (
    <div
      className={`flex min-h-[40vh] w-full items-center justify-center py-24 ${className ?? ""}`}
    >
      <div className="mx-auto max-w-prose text-center space-y-6">
        <Heading size="2">{title ?? "We accidentally hit pause"}</Heading>

        <div className="space-y-3">
          {message ? (
            <Text as="p" variant="muted">{message}</Text>
          ) : (
            <>
              <Text as="p" variant="muted">
                Looks like we tripped over a cable and the app threw a tantrum.
              </Text>
              <Text as="p" variant="muted">
                We&apos;re on it and normal service will resume shortly.
              </Text>
            </>
          )}
        </div>

        {submessage ? (
          <Text as="p" variant="muted">{submessage}</Text>
        ) : (
          <>
          <Text as="p" variant="muted">Your data is safe, backed up every hour.</Text>
          <Text as="p" variant="muted">This is a temporary page while we put everything back to where it belongs. Thanks for hanging tight with us.</Text>
          </>
        )}

        {extra.length > 0 && (
          <div className="space-y-3">
            {extra.map((line) => (
              <Text key={line} as="p" variant="muted">
                {line}
              </Text>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
