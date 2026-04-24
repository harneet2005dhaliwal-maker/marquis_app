import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

type MeResponse = {
  user: null | {
    studentId: string;
    role: "student" | "parent";
    name: string;
    email: string;
  };
};

export default function OAuthSuccess({ onLogin }: { onLogin: (id: string, role: "student" | "parent") => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data: MeResponse = await res.json();

        if (data.user?.studentId && data.user?.role) {
          onLogin(data.user.studentId, data.user.role);
          navigate("/"); // or "/home"
        } else {
          navigate("/?google=not_logged_in");
        }
      } catch (e) {
        navigate("/?google=error");
      }
    })();
  }, [navigate, onLogin]);

  return <div style={{ padding: 24 }}>Signing you in…</div>;
}
