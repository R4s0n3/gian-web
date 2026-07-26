"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="admin-login__form"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setPending(true);

        try {
          const result = await signIn("credentials", {
            email: email.trim(),
            password,
            redirect: false,
          });

          if (!result || result.error) {
            setError(
              "Access was not granted. Check your admin email and password.",
            );
            setPending(false);
            return;
          }

          router.replace(callbackUrl);
          router.refresh();
        } catch {
          setError("The studio login is temporarily unavailable.");
          setPending(false);
        }
      }}
    >
      <div className="form-field">
        <label htmlFor="admin-email">Admin email</label>
        <input
          autoComplete="email"
          autoFocus
          className="form-input"
          id="admin-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="studio@example.com"
          required
          type="email"
          value={email}
        />
      </div>
      <div className="form-field">
        <label htmlFor="admin-password">Password</label>
        <input
          autoComplete="current-password"
          className="form-input"
          id="admin-password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••••••"
          required
          type="password"
          value={password}
        />
      </div>

      {error && (
        <p
          aria-live="polite"
          className="form-status form-status--error"
          role="alert"
        >
          {error}
        </p>
      )}

      <button className="button button--ember" disabled={pending} type="submit">
        {pending ? "Verifying access…" : "Enter studio →"}
      </button>
      <p className="form-note">
        Access is restricted to addresses configured by the studio. Attempts
        from other accounts are rejected server-side.
      </p>
    </form>
  );
}
