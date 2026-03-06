import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/features/shared/components/primitives/logo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type AuthMode = "login" | "signup";

/* ── Shared background (used by both page & future modal export) ── */

function AuthBackground() {
  return (
    <>
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-[20%] -top-[10%] h-[600px] w-[600px] rounded-full bg-primary/[0.07] blur-[120px]" />
        <div className="absolute -bottom-[15%] -left-[15%] h-[500px] w-[500px] rounded-full bg-secondary/[0.05] blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.03] blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(rgba(185,145,255,0.8) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>
      {/* Grain */}
      <div
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}

/* ── Spinner ── */

function Spinner() {
  return (
    <motion.span
      className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
    />
  );
}

/* ── Login form panel ── */

function LoginPanel({
  onSwitchMode,
}: {
  onSwitchMode: () => void;
}) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setError("Email is required");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const { error } = await authClient.signIn.magicLink({
      email: email.toLowerCase(),
      callbackURL: "/dashboard",
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message || "Failed to send magic link");
    } else {
      setIsSent(true);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isSent ? (
        <motion.div
          key="login-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Welcome back!
            </h1>
            <p className="mt-1 text-[15px] text-[#9890a8]">
              Sign in with a magic link — no password needed.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4"
            >
              <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2.5">
                <p className="text-center text-sm text-danger">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#b5bac1]"
              >
                Email
                <span className="ml-0.5 text-danger">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                className="h-11 w-full rounded-[4px] border-none bg-[#1e1b2e] px-3 text-[15px] text-white outline-none transition-all placeholder:text-[#6b6380] focus:ring-2 focus:ring-primary/60 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 h-11 w-full cursor-pointer rounded-[4px] bg-primary font-medium text-white transition-colors hover:bg-primary-dark active:bg-primary-darker disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Sending...
                </span>
              ) : (
                "Log In"
              )}
            </button>

            <p className="mt-4 text-[13px] text-[#6b6380]">
              Need an account?{" "}
              <button
                type="button"
                onClick={onSwitchMode}
                className="cursor-pointer bg-transparent text-primary-light hover:underline"
              >
                Sign up
              </button>
            </p>
          </form>
        </motion.div>
      ) : (
        <motion.div
          key="login-sent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="py-4 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
          >
            <svg className="h-7 w-7 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </motion.div>

          <h2 className="text-xl font-semibold text-white">Check your email</h2>
          <p className="mt-2 text-[15px] text-[#9890a8]">We sent a sign-in link to</p>
          <p className="mt-1 text-[15px] font-medium text-white">{email}</p>
          <p className="mt-3 text-[13px] text-[#6b6380]">
            The link expires in 5 minutes. Check your spam folder if you don't see it.
          </p>

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="h-11 w-full cursor-pointer rounded-[4px] bg-primary font-medium text-white transition-colors hover:bg-primary-dark active:bg-primary-darker disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Resend link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setEmail("");
                setError(null);
              }}
              className="h-9 w-full cursor-pointer rounded-[4px] bg-transparent text-sm text-[#9890a8] transition-colors hover:text-white hover:underline"
            >
              Use a different email
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Signup form panel (age verification flow) ── */

function SignupPanel({
  onSwitchMode,
}: {
  onSwitchMode: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const startVerification = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!email) {
        setError("Email is required");
        return;
      }
      setError(null);
      setIsVerifying(true);

      try {
        const { default: sdk } = await import("@verichan/embed");
        sdk.open({
          sessionToken: "demo",
          onVerified: async () => {
            setIsVerifying(false);
            setIsVerified(true);
            // Send magic link after verification
            setIsSending(true);
            const { error } = await authClient.signIn.magicLink({
              email: email.toLowerCase(),
              callbackURL: "/dashboard",
            });
            setIsSending(false);
            if (error) {
              setError(error.message || "Failed to send magic link");
            } else {
              setIsSent(true);
            }
          },
          onDismiss: () => {
            setIsVerifying(false);
          },
          onError: (err: string) => {
            setIsVerifying(false);
            setError(err);
          },
        });
      } catch {
        setIsVerifying(false);
        setError("Could not load verification. Please try again.");
      }
    },
    [email],
  );

  return (
    <AnimatePresence mode="wait">
      {isSent ? (
        <motion.div
          key="signup-sent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="py-4 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-success/20 bg-success/10"
          >
            <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>

          <h2 className="text-xl font-semibold text-white">You're all set!</h2>
          <p className="mt-2 text-[15px] text-[#9890a8]">
            We sent a sign-in link to
          </p>
          <p className="mt-1 text-[15px] font-medium text-white">{email}</p>
          <p className="mt-3 text-[13px] text-[#6b6380]">
            Click the link to finish creating your account.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key="signup-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Create an account
            </h1>
            <p className="mt-1 text-[15px] text-[#9890a8]">
              Quick age verification, then you're in.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4"
            >
              <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2.5">
                <p className="text-center text-sm text-danger">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Verification steps indicator */}
          <div className="mb-5 flex items-center gap-3">
            <StepIndicator
              number={1}
              label="Enter email"
              active={!isVerified}
              done={isVerified}
            />
            <div className="h-px flex-1 bg-white/[0.06]" />
            <StepIndicator
              number={2}
              label="Verify age"
              active={isVerifying}
              done={isVerified}
            />
          </div>

          <form onSubmit={startVerification}>
            <div className="space-y-2">
              <label
                htmlFor="signup-email"
                className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#b5bac1]"
              >
                Email
                <span className="ml-0.5 text-danger">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isVerifying || isVerified}
                autoFocus
                className="h-11 w-full rounded-[4px] border-none bg-[#1e1b2e] px-3 text-[15px] text-white outline-none transition-all placeholder:text-[#6b6380] focus:ring-2 focus:ring-primary/60 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || isVerified || isSending}
              className="mt-5 h-11 w-full cursor-pointer rounded-[4px] bg-primary font-medium text-white transition-colors hover:bg-primary-dark active:bg-primary-darker disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Verifying...
                </span>
              ) : isSending ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Creating account...
                </span>
              ) : (
                "Continue"
              )}
            </button>

            {/* Privacy note */}
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-[12px] leading-relaxed text-[#6b6380]">
                We'll ask for a quick selfie with your ID. All images are discarded immediately — only an anonymous "verified" token is kept.
              </p>
            </div>

            <p className="mt-4 text-[13px] text-[#6b6380]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchMode}
                className="cursor-pointer bg-transparent text-primary-light hover:underline"
              >
                Log in
              </button>
            </p>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepIndicator({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
          done
            ? "bg-success/20 text-success"
            : active
              ? "bg-primary/20 text-primary-light"
              : "bg-white/[0.04] text-[#6b6380]"
        }`}
      >
        {done ? (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <span className={`text-[12px] font-medium ${active || done ? "text-white/60" : "text-[#6b6380]"}`}>
        {label}
      </span>
    </div>
  );
}

/* ── Auth card (shared between login & signup) ── */

export function AuthCard({
  initialMode = "login",
  showLogo = true,
}: {
  initialMode?: AuthMode;
  showLogo?: boolean;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="w-full">
      {showLogo && (
        <div className="mb-6 flex justify-center">
          <Link to="/" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/25">
            <Logo
              size="lg"
              color="white"
              scrambleOnMount
              scrambleOnHover
              scrambleOnClick={false}
              useEmojiScramble={false}
            />
          </Link>
        </div>
      )}

      <AnimatePresence mode="wait">
        {mode === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <LoginPanel onSwitchMode={() => setMode("signup")} />
          </motion.div>
        ) : (
          <motion.div
            key="signup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <SignupPanel onSwitchMode={() => setMode("login")} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Full page ── */

function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0811]">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[480px] px-4"
      >
        <div className="rounded-2xl border border-white/[0.06] bg-[#13101c] p-8 shadow-[0_8px_60px_-12px_rgba(0,0,0,0.7)]">
          <AuthCard />
        </div>

        <div className="mt-4 flex justify-center gap-4 text-xs text-[#6b6380]">
          <Link to="/privacy" className="transition-colors hover:text-[#9890a8]">Privacy</Link>
          <span className="text-white/10">·</span>
          <Link to="/terms" className="transition-colors hover:text-[#9890a8]">Terms</Link>
        </div>
      </motion.div>
    </div>
  );
}
