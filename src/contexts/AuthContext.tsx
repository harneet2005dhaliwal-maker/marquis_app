import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

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

  googleProviderToken: string | null;
  googleIdentityLinked: boolean;
  isConnectingGoogle: boolean;

  login: (
    email: string,
    password: string,
    role: UserType
  ) => Promise<void>;

  connectGoogleClassroom: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

const CLASSROOM_SCOPES = [
  "openid",
  "email",
  "profile",

  "https://www.googleapis.com/auth/classroom.courses.readonly",

  "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",

  "https://www.googleapis.com/auth/classroom.coursework.students.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.students.readonly",
].join(" ");

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [userType, setUserType] =
    useState<UserType | null>(null);

  const [studentId, setStudentId] =
    useState<string | null>(null);

  const [user, setUser] =
    useState<SessionUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    googleProviderToken,
    setGoogleProviderToken,
  ] = useState<string | null>(null);

  const [
    googleIdentityLinked,
    setGoogleIdentityLinked,
  ] = useState(false);

  const [
    isConnectingGoogle,
    setIsConnectingGoogle,
  ] = useState(false);

  const applyUser = (
    nextUser: SessionUser | null
  ) => {
    setUser(nextUser);

    if (nextUser) {
      setIsAuthenticated(true);
      setStudentId(nextUser.studentId);
      setUserType(nextUser.role);
      return;
    }

    setIsAuthenticated(false);
    setStudentId(null);
    setUserType(null);
  };

  const loadUserFromSupabase = async (
    authUserId: string,
    email?: string
  ) => {
    const {
      data: student,
      error: studentError,
    } = await supabase
      .from("students")
      .select(
        "id, first_name, last_name, user_id"
      )
      .eq("user_id", authUserId)
      .maybeSingle();

    if (studentError) {
      console.error(
        "Could not load student record:",
        studentError
      );

      throw new Error(
        "There was a problem loading your student account."
      );
    }

    if (!student) {
      throw new Error(
        "Your login exists, but it is not linked to a student record."
      );
    }

    const fullName = [
      student.first_name,
      student.last_name,
    ]
      .filter(Boolean)
      .join(" ");

    applyUser({
      studentId: student.id,
      role: "student",
      name: fullName || undefined,
      email,
    });
  };

  const refreshGoogleIdentityState = async () => {
    const {
      data,
      error,
    } = await supabase.auth.getUserIdentities();

    if (error) {
      console.error(
        "Could not read linked identities:",
        error
      );
      setGoogleIdentityLinked(false);
      return false;
    }

    const linked = (data?.identities ?? []).some(
      (identity) => identity.provider === "google"
    );

    setGoogleIdentityLinked(linked);
    return linked;
  };

  const processSession = async (
    session: any
  ) => {
    if (!session?.user) {
      applyUser(null);
      setGoogleProviderToken(null);
      setGoogleIdentityLinked(false);
      return;
    }

    if (session.provider_token) {
      setGoogleProviderToken(
        session.provider_token
      );

      console.log(
        "Google provider token exists:",
        true
      );
    } else {
      // An email/password Supabase session does not automatically
      // contain a Google provider access token.
      setGoogleProviderToken(null);

      console.log(
        "Google provider token exists:",
        false
      );
    }

    await loadUserFromSupabase(
      session.user.id,
      session.user.email
    );

    await refreshGoogleIdentityState();
  };

  const refreshSession = async () => {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        "Session check failed:",
        error
      );

      applyUser(null);
      setGoogleProviderToken(null);
      setGoogleIdentityLinked(false);
      return;
    }

    await processSession(session);
  };

  useEffect(() => {
    let isMounted = true;

    const initialiseAuth = async () => {
      try {
        setIsLoading(true);
        await refreshSession();
      } catch (error) {
        console.error(
          "Authentication startup failed:",
          error
        );

        if (isMounted) {
          applyUser(null);
          setGoogleProviderToken(null);
          setGoogleIdentityLinked(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initialiseAuth();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log(
            "Auth event:",
            event
          );

          try {
            if (!isMounted) return;

            await processSession(session);
          } catch (error) {
            console.error(
              "Auth state update failed:",
              error
            );

            if (isMounted) {
              applyUser(null);
              setGoogleProviderToken(null);
              setGoogleIdentityLinked(false);
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
              setIsConnectingGoogle(false);
            }
          }
        }
      );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserType
  ) => {
    if (role !== "student") {
      throw new Error(
        "Parent login has not been connected yet."
      );
    }

    const normalisedEmail =
      email.trim().toLowerCase();

    if (
      !normalisedEmail ||
      !password
    ) {
      throw new Error(
        "Please enter your email and password."
      );
    }

    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword({
        email: normalisedEmail,
        password,
      });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error(
        "Login succeeded, but no user was returned."
      );
    }

    await loadUserFromSupabase(
      data.user.id,
      data.user.email
    );

    await refreshGoogleIdentityState();
  };

  const connectGoogleClassroom = async () => {
    setIsConnectingGoogle(true);

    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !authUser) {
        throw new Error(
          "Please sign in to Marquis before connecting Google Classroom."
        );
      }

      const {
        data: identityData,
        error: identitiesError,
      } = await supabase.auth.getUserIdentities();

      if (identitiesError) {
        throw identitiesError;
      }

      const alreadyLinked =
        (identityData?.identities ?? []).some(
          (identity) => identity.provider === "google"
        );

      const options = {
        redirectTo: `${window.location.origin}/`,
        scopes: CLASSROOM_SCOPES,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      };

      if (alreadyLinked) {
        // The Google identity is already part of this Marquis account.
        // Run Google OAuth again to obtain a fresh provider token with
        // the Classroom scopes required by the app.
        const { error } =
          await supabase.auth.signInWithOAuth({
            provider: "google",
            options,
          });

        if (error) {
          throw error;
        }

        return;
      }

      // First-time connection: attach Google to the user who is
      // already authenticated with Marquis email/password.
      const { error } =
        await supabase.auth.linkIdentity({
          provider: "google",
          options,
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      setIsConnectingGoogle(false);
      console.error(
        "Google Classroom connection failed:",
        error
      );

      throw new Error(
        error instanceof Error
          ? error.message
          : "Unable to connect Google Classroom."
      );
    }
  };

  const logout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Logout failed:",
        error
      );

      throw new Error(error.message);
    }

    applyUser(null);
    setGoogleProviderToken(null);
    setGoogleIdentityLinked(false);
    setIsConnectingGoogle(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userType,
        studentId,
        user,
        googleProviderToken,
        googleIdentityLinked,
        isConnectingGoogle,
        login,
        connectGoogleClassroom,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};