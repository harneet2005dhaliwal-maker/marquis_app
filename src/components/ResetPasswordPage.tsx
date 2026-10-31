import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "../lib/supabase";

interface ResetPasswordPageProps {
  onComplete: () => void;
}

export function ResetPasswordPage({
  onComplete,
}: ResetPasswordPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  const handleReset = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw updateError;
      }

      setUpdated(true);
    } catch (err) {
      console.error("Password update failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your password."
      );
    } finally {
      setLoading(false);
    }
  };

  const finishRecovery = async () => {
    // Sign out of the temporary password-recovery session.
    await supabase.auth.signOut();
    onComplete();
  };

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at top, #FFF9EB 0%, #FFFCF4 50%, #FFFFFF 100%)",
      }}
    >
      <div
        className="w-full max-w-[440px]"
        style={{
          background: "#FFFFFF",
          borderRadius: "24px",
          padding: "40px",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
          border: "1px solid #E5E5E5",
        }}
      >
        {updated ? (
          <>
            <h1
              style={{
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "28px",
                fontWeight: 700,
                margin: "0 0 10px",
              }}
            >
              Password updated ✓
            </h1>

            <p
              style={{
                fontFamily: "Inter, -apple-system, sans-serif",
                color: "#666666",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              Your Marquis password has been changed successfully.
              Sign in again using your new password.
            </p>

            <Button
              type="button"
              onClick={() => void finishRecovery()}
              className="w-full"
              style={{
                height: "56px",
                borderRadius: "14px",
                border: "none",
                background: "#F8D548",
                color: "#000000",
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Back to Login
            </Button>
          </>
        ) : (
          <form onSubmit={handleReset}>
            <h1
              style={{
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "28px",
                fontWeight: 700,
                margin: "0 0 8px",
              }}
            >
              Reset password
            </h1>

            <p
              style={{
                fontFamily: "Inter, -apple-system, sans-serif",
                color: "#666666",
                fontSize: "14px",
                lineHeight: 1.6,
                margin: "0 0 28px",
              }}
            >
              Choose a new password for your Marquis account.
            </p>

            <label
              style={{
                display: "block",
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              New password
            </label>

            <Input
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="Enter new password"
              style={{
                height: "56px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            />

            <label
              style={{
                display: "block",
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              Confirm new password
            </label>

            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Confirm new password"
              style={{
                height: "56px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            />

            {error && (
              <p
                style={{
                  color: "#D32F2F",
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "13px",
                  margin: "0 0 16px",
                }}
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              style={{
                height: "56px",
                borderRadius: "14px",
                border: "none",
                background: "#F8D548",
                color: "#000000",
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Updating password..." : "Reset Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}