import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
// import marquisLogo from "../assets/logo.png";
const marquisLogo = "https://placeholder.com/260x100?text=MARQUIS";

interface LoginPageProps {
  onLogin: (
    email: string,
    password: string,
    role: "student" | "parent"
  ) => Promise<void>;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"student" | "parent">("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordUpdateLoading, setPasswordUpdateLoading] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
        setError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleForgotPassword = async () => {
    setError(null);
    setResetEmailSent(false);

    const email = username.trim().toLowerCase();

    if (!email) {
      setError(
        "Enter your email address first, then select Forgot password."
      );
      return;
    }

    try {
      setResetLoading(true);

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email, {
          // No separate route is required: Supabase will return to this
          // login page and emit the PASSWORD_RECOVERY auth event.
          redirectTo: window.location.origin,
        });

      if (resetError) {
        throw resetError;
      }

      setResetEmailSent(true);
    } catch (err) {
      console.error("Password reset email error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the password reset email."
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleUpdatePassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setPasswordUpdateLoading(true);

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw updateError;
      }

      // End the temporary recovery session so the user can sign in
      // normally with the new password.
      await supabase.auth.signOut();

      setPasswordUpdated(true);
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error("Password update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your password."
      );
    } finally {
      setPasswordUpdateLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      /*
       * Google login requests read-only Google Classroom access.
       *
       * During development, the test account may appear as a student in
       * some courses and as a teacher/admin in others, so we request both
       * read-only coursework scopes. These scopes do not allow the app to
       * edit Classroom coursework or submissions.
       */
      const classroomScopes = [
        "openid",
        "email",
        "profile",

        // Read the Google Classroom courses visible to this account.
        "https://www.googleapis.com/auth/classroom.courses.readonly",

        // Student access: read the signed-in student's coursework
        // and their own submission status/grades.
        "https://www.googleapis.com/auth/classroom.coursework.me.readonly",

        // Teacher/admin access: needed for test/staff accounts that
        // are teachers or administrators in some Classroom courses.
        "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
      ].join(" ");

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,

            // Parents do not need Classroom access at login yet.
            scopes:
              activeTab === "student"
                ? classroomScopes
                : ["openid", "email", "profile"].join(" "),

            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

      if (oauthError) {
        throw oauthError;
      }

      // On success Google redirects away from this page,
      // so there is normally nothing else to do here.
    } catch (err) {
      console.error("Google login error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in with Google."
      );

      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const email = username.trim();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      await onLogin(email, password, activeTab);
    } catch (err) {
      console.error("Supabase login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again."
      );
    }
  };

  if (isPasswordRecovery) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
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
              "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
            border: "1px solid #E5E5E5",
          }}
        >
          {passwordUpdated ? (
            <>
              <h1
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "#000000",
                  margin: "0 0 12px",
                }}
              >
                Password updated
              </h1>

              <p
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "14px",
                  color: "#666666",
                  lineHeight: 1.6,
                  margin: "0 0 24px",
                }}
              >
                Your password has been changed successfully. You can now sign
                in with your Marquis email and new password.
              </p>

              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setIsPasswordRecovery(false);
                  setPasswordUpdated(false);
                  setError(null);
                }}
                style={{
                  background: "#F8D548",
                  color: "#000000",
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  height: "56px",
                  borderRadius: "14px",
                  border: "none",
                }}
              >
                Back to Login
              </Button>
            </>
          ) : (
            <form onSubmit={handleUpdatePassword}>
              <h1
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "#000000",
                  margin: "0 0 8px",
                }}
              >
                Reset your password
              </h1>

              <p
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "14px",
                  color: "#666666",
                  lineHeight: 1.6,
                  margin: "0 0 28px",
                }}
              >
                Enter a new password for your Marquis account.
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
                onChange={(e) => setNewPassword(e.target.value)}
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
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
                    fontSize: "13px",
                    marginBottom: "16px",
                    fontFamily: "Inter, -apple-system, sans-serif",
                  }}
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={passwordUpdateLoading}
                style={{
                  background: "#F8D548",
                  color: "#000000",
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  height: "56px",
                  borderRadius: "14px",
                  border: "none",
                  cursor: passwordUpdateLoading ? "wait" : "pointer",
                  opacity: passwordUpdateLoading ? 0.7 : 1,
                }}
              >
                {passwordUpdateLoading
                  ? "Updating password..."
                  : "Reset Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(circle at top, #FFF9EB 0%, #FFFCF4 50%, #FFFFFF 100%)",
      }}
    >
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Marquis Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <img
            src={marquisLogo}
            alt="MARQUIS"
            style={{
              width: "260px",
              height: "auto",
              filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.06))",
            }}
          />
          <p
            style={{
              fontFamily: "Inter, -apple-system, sans-serif",
              fontSize: "15px",
              fontWeight: 500,
              color: "#666666",
              marginTop: "20px",
              textAlign: "center",
              letterSpacing: "0.01em",
            }}
          >
            Powered by Care, Driven by Results.
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full"
          style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "40px",
            marginTop: "48px",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
            border: "1px solid #E5E5E5",
          }}
        >
          {/* Primary Google Login */}
          <Button
            type="button"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              background: "#111111",
              color: "#FFFFFF",
              fontFamily: "Inter, -apple-system, sans-serif",
              fontSize: "16px",
              fontWeight: 700,
              padding: "16px",
              height: "56px",
              borderRadius: "14px",
              border: "none",
              cursor: googleLoading ? "wait" : "pointer",
              transition: "all 200ms ease",
              boxShadow: "0 4px 12px rgba(0,0,0,0.20)",
            }}
          >
            {googleLoading
              ? "Connecting to Google..."
              : "Continue with Google"}
          </Button>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "22px",
              marginBottom: "22px",
            }}
          >
            <div style={{ height: "1px", background: "#EAEAEA", flex: 1 }} />
            <span
              style={{
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "12px",
                fontWeight: 600,
                color: "#9A9A9A",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Or continue with email
            </span>
            <div style={{ height: "1px", background: "#EAEAEA", flex: 1 }} />
          </div>

          {/* Segmented Control Tab Selector */}
          <div
            className="flex gap-0 p-1.5"
            style={{
              background: "#F5F5F5",
              borderRadius: "16px",
              marginBottom: "32px",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab("student")}
              className="flex-1 rounded-xl transition-all flex items-center justify-center"
              style={{
                background: activeTab === "student" ? "#F8D548" : "transparent",
                color: activeTab === "student" ? "#000000" : "#999999",
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "15px",
                fontWeight: activeTab === "student" ? 700 : 500,
                border: "none",
                cursor: "pointer",
                transition: "all 200ms ease",
                borderRadius: "13px",
                padding: "14px 20px",
                height: "48px",
              }}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("parent")}
              className="flex-1 rounded-xl transition-all flex items-center justify-center"
              style={{
                background: activeTab === "parent" ? "#F8D548" : "transparent",
                color: activeTab === "parent" ? "#000000" : "#999999",
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "15px",
                fontWeight: activeTab === "parent" ? 700 : 500,
                border: "none",
                cursor: "pointer",
                transition: "all 200ms ease",
                borderRadius: "13px",
                padding: "14px 20px",
                height: "48px",
              }}
            >
              Parent Portal
            </button>
          </div>

          {/* Login Form (secondary) */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#000000",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                Email Address
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#4CAF50",
                    background: "rgba(76, 175, 80, 0.1)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.02em",
                  }}
                >
                  Linked to Marquis Email
                </span>
              </label>
              <Input
                type="email"
                placeholder="your.name@marquis.education"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "15px",
                  padding: "16px 18px",
                  height: "56px",
                  borderRadius: "12px",
                  border: "1px solid #E5E5E5",
                  background: "#FFFFFF",
                  boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.04)",
                  transition: "all 150ms ease",
                }}
                className="focus:border-[#F8D548] focus:ring-2 focus:ring-[#F8D548]/20"
              />
            </div>

            {/* Password Field */}
            <div style={{ marginTop: "20px" }}>
              <label
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#000000",
                  display: "block",
                  marginBottom: "16px",
                }}
              >
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: "15px",
                  padding: "16px 18px",
                  height: "56px",
                  borderRadius: "12px",
                  border: "1px solid #E5E5E5",
                  background: "#FFFFFF",
                  boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.04)",
                  transition: "all 150ms ease",
                }}
                className="focus:border-[#F8D548] focus:ring-2 focus:ring-[#F8D548]/20"
              />
            </div>

            {/* CTA Button */}
            <Button
              type="submit"
              className="w-full"
              style={{
                background: "#F8D548",
                color: "#000000",
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "16px",
                fontWeight: 700,
                padding: "16px",
                height: "56px",
                marginTop: "32px",
                borderRadius: "14px",
                border: "none",
                cursor: "pointer",
                transition: "all 200ms ease",
                boxShadow:
                  "0 4px 12px rgba(248, 213, 72, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(248, 213, 72, 0.4), 0 4px 8px rgba(0, 0, 0, 0.12)";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(248, 213, 72, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)";
              }}
            >
              {activeTab === "student" ? "Access My Learning" : "Access Portal"}
            </Button>
          </form>

          {error && (
            <p
              style={{
                marginTop: "12px",
                color: "#D32F2F",
                fontSize: "13px",
                fontFamily: "Inter, -apple-system, sans-serif",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          {/* Forgot Password Link */}
          <div className="text-center" style={{ marginTop: "24px" }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              style={{
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                color: "#666666",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "none",
                transition: "color 150ms ease",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.color = "#000000";
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.color = "#666666";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {resetLoading ? "Sending reset email..." : "Forgot password?"}
            </button>

            {resetEmailSent && (
              <p
                style={{
                  margin: "12px 0 0",
                  color: "#2E7D32",
                  fontSize: "13px",
                  fontFamily: "Inter, -apple-system, sans-serif",
                  lineHeight: 1.5,
                }}
              >
                Reset email sent. Check your inbox and follow the link to choose
                a new password.
              </p>
            )}
          </div>
        </motion.div>

        {/* Bottom Contact Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            fontFamily: "Inter, -apple-system, sans-serif",
            fontSize: "13px",
            color: "#999999",
            marginTop: "32px",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Need help? Contact{" "}
          <a
            href="mailto:hi@marquis.education"
            style={{
              color: "#F8D548",
              fontWeight: 600,
              textDecoration: "none",
              transition: "color 150ms ease",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.color = "#000000";
              e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.color = "#F8D548";
              e.currentTarget.style.textDecoration = "none";
            }}
          >
            hi@marquis.education
          </a>
        </motion.p>
      </div>
    </div>
  );
}