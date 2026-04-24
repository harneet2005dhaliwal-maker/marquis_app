import React, { createContext, useContext, useEffect, useState } from "react";

type UserType = "student" | "parent";

interface SessionUser {
  studentId: string;
  role: UserType;
  name?: string;
  email?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: UserType | null;
  studentId: string | null;
  user: SessionUser | null;
  login: (studentId: string, role: UserType) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = "http://localhost:4000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyUser = (u: SessionUser | null) => {
    setUser(u);
    if (u) {
      setIsAuthenticated(true);
      setStudentId(u.studentId);
      setUserType(u.role);
    } else {
      setIsAuthenticated(false);
      setStudentId(null);
      setUserType(null);
    }
  };

  const refreshSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        applyUser(null);
        return;
      }

      const data = await res.json();
      // backend returns: { user: req.session.appAuth || null }
      applyUser(data.user || null);
    } catch (err) {
      console.error("Session bootstrap failed:", err);
      applyUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await refreshSession();
      setIsLoading(false);
    })();
  }, []);

  // Email/password login still sets local state immediately.
  // (Optional: you can also call refreshSession() here if your backend sets session in /api/login)
  const login = (id: string, role: UserType) => {
    applyUser({ studentId: id, role });
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      applyUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userType,
        studentId,
        user,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
