import { useEffect, useState } from "react";

import { HomePage } from "./components/HomePage";
import { BookingsPage } from "./components/BookingsPage";
import { AnnouncementsPage } from "./components/AnnouncementsPage";
import { StudyPage } from "./components/StudyPage";
import { ProgressPage } from "./components/ProgressPage";
import { ParentPortalPage } from "./components/ParentPortalPage";
import { LoginPage } from "./components/LoginPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";

import { DataProvider, useData } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { supabase } from "./lib/supabase";

import {
  Home,
  Calendar,
  Bell,
  BookOpen,
  TrendingUp,
  LogOut,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "./components/ui/avatar";

import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "./components/ui/sonner";

import logo from "./assets/Logo.png";

const HEADER_HEIGHT = 72;
const NAV_HEIGHT = 86;

type StudentTab =
  | "home"
  | "bookings"
  | "progress"
  | "study"
  | "announcements";

function StudentApp() {
  const { logout } = useAuth();
  const { currentStudent } = useData();

  const [activeTab, setActiveTab] =
    useState<StudentTab>("home");

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const getInitials = (name: string) => {
    const parts = name
      .trim()
      .split(" ")
      .filter(Boolean);

    return parts
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "bookings", label: "Classes", icon: Calendar },
    { id: "progress", label: "Progress", icon: TrendingUp },
    { id: "study", label: "Study", icon: BookOpen },
    { id: "announcements", label: "News", icon: Bell },
  ] as const;

  const handleNavigate = (tab: string) => {
    if (
      tab === "home" ||
      tab === "bookings" ||
      tab === "progress" ||
      tab === "study" ||
      tab === "announcements"
    ) {
      setActiveTab(tab);
    }
  };

  return (
    <div
      className="min-h-dvh w-full"
      style={{
        background:
          "linear-gradient(180deg, #F6F3EA 0%, #F8F7F3 100%)",
      }}
    >
      {/* Desktop/tablet preview background.
          The actual app itself always stays phone-sized. */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 16% 10%, rgba(255,213,0,0.10), transparent 26%), radial-gradient(circle at 86% 14%, rgba(186,230,253,0.16), transparent 28%), radial-gradient(circle at 50% 100%, rgba(244,114,182,0.06), transparent 34%)",
        }}
      />

      {/* Phone application canvas */}
      <div
        className="relative mx-auto min-h-dvh w-full overflow-hidden bg-white"
        style={{
          maxWidth: "430px",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.03), 0 24px 70px rgba(0,0,0,0.10)",
        }}
      >
        {/* Header */}
        <header
          className="fixed top-0 z-50 w-full"
          style={{
            maxWidth: "430px",
            left: "50%",
            transform: "translateX(-50%)",
            padding:
              "max(10px, env(safe-area-inset-top)) 14px 0",
            pointerEvents: "none",
          }}
        >
          <div
            className="flex items-center justify-between px-4"
            style={{
              minHeight: "58px",
              borderRadius: "20px",
              background:
                "rgba(255,255,255,0.78)",
              border:
                "1px solid rgba(255,255,255,0.92)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
              boxShadow:
                "0 10px 28px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
              pointerEvents: "auto",
            }}
          >
            <img
              src={logo}
              alt="Marquis Education"
              className="h-7 w-auto object-contain"
            />

            <div className="relative">
              <motion.button
                type="button"
                onClick={() =>
                  setShowProfileMenu((prev) => !prev)
                }
                whileTap={{ scale: 0.94 }}
                whileHover={{ scale: 1.03 }}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                <Avatar
                  className="h-9 w-9"
                  style={{
                    background:
                      "rgba(255,255,255,0.96)",
                    border:
                      "1px solid rgba(0,0,0,0.08)",
                    boxShadow:
                      "0 4px 14px rgba(0,0,0,0.07)",
                  }}
                >
                  <AvatarFallback
                    style={{
                      background:
                        "linear-gradient(145deg, #FFF7CF 0%, #FFFFFF 100%)",
                      color: "#111111",
                      fontFamily:
                        "Inter, sans-serif",
                      fontWeight: 700,
                      fontSize: "12px",
                    }}
                  >
                    {currentStudent?.name
                      ? getInitials(currentStudent.name)
                      : "ST"}
                  </AvatarFallback>
                </Avatar>
              </motion.button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: -6,
                      scale: 0.96,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: -6,
                      scale: 0.96,
                    }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11"
                    style={{
                      width: "180px",
                      padding: "10px",
                      borderRadius: "16px",
                      background:
                        "rgba(255,255,255,0.92)",
                      border:
                        "1px solid rgba(255,255,255,0.95)",
                      backdropFilter: "blur(22px)",
                      WebkitBackdropFilter:
                        "blur(22px)",
                      boxShadow:
                        "0 16px 34px rgba(0,0,0,0.14)",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 10px 10px",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontFamily:
                            "Inter, sans-serif",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#111111",
                        }}
                      >
                        {currentStudent?.name ??
                          "Student"}
                      </p>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontFamily:
                            "Inter, sans-serif",
                          fontSize: "10px",
                          color: "#888888",
                        }}
                      >
                        Marquis account
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void logout()}
                      className="flex w-full items-center gap-2"
                      style={{
                        border: "none",
                        borderRadius: "11px",
                        background:
                          "rgba(0,0,0,0.04)",
                        padding: "10px 11px",
                        color: "#555555",
                        cursor: "pointer",
                        fontFamily:
                          "Inter, sans-serif",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* The document/body is the only vertical scroll.
            Individual pages should not create their own viewport scroll. */}
        <main
          className="relative w-full overflow-x-hidden"
          style={{
            paddingTop:
              "calc(82px + env(safe-area-inset-top))",
            paddingBottom:
              "calc(96px + env(safe-area-inset-bottom))",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              className="w-full min-w-0 overflow-x-hidden"
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -6,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
            >
              {activeTab === "home" && (
                <HomePage
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === "bookings" && (
                <BookingsPage />
              )}

              {activeTab === "progress" && (
                <ProgressPage
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === "study" && (
                <StudyPage />
              )}

              {activeTab ===
                "announcements" && (
                <AnnouncementsPage />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom navigation */}
        <nav
          className="fixed bottom-0 z-50 w-full"
          style={{
            maxWidth: "430px",
            left: "50%",
            transform: "translateX(-50%)",
            padding:
              "0 12px max(12px, env(safe-area-inset-bottom))",
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={{
              y: 40,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 26,
            }}
            className="flex items-center"
            style={{
              minHeight: "70px",
              padding: "7px",
              borderRadius: "24px",
              background:
                "rgba(255,255,255,0.82)",
              border:
                "1px solid rgba(255,255,255,0.94)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow:
                "0 16px 36px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
              pointerEvents: "auto",
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive =
                activeTab === tab.id;

              return (
                <motion.button
                  type="button"
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  whileTap={{ scale: 0.91 }}
                  className="relative flex flex-1 flex-col items-center justify-center"
                  style={{
                    minHeight: "54px",
                    border: "none",
                    background:
                      "transparent",
                    cursor: "pointer",
                    borderRadius: "17px",
                    color: isActive
                      ? "#000000"
                      : "#777777",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeStudentTabMobile"
                      className="absolute inset-0"
                      style={{
                        borderRadius: "17px",
                        background:
                          "linear-gradient(145deg, #FFD500 0%, #FFE46B 100%)",
                        boxShadow:
                          "0 7px 18px rgba(255,213,0,0.26), inset 0 1px 0 rgba(255,255,255,0.6)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 330,
                        damping: 28,
                      }}
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <Icon
                      className="h-5 w-5"
                      style={{
                        strokeWidth:
                          isActive ? 2.5 : 2,
                      }}
                    />

                    <span
                      style={{
                        fontFamily:
                          "Inter, sans-serif",
                        fontSize: "9.5px",
                        fontWeight:
                          isActive ? 700 : 600,
                      }}
                    >
                      {tab.label}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </nav>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-yellow-400" />

        <p className="text-sm font-medium text-gray-600">
          Loading your account…
        </p>
      </div>
    </div>
  );
}

function AccountLinkError() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-3 text-2xl font-bold text-black">
          Student account not linked
        </h1>

        <p className="mb-6 text-gray-600">
          Your Supabase login worked, but no
          linked student record was found.
        </p>

        <button
          type="button"
          onClick={() => void logout()}
          className="w-full rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black"
        >
          Return to login
        </button>
      </div>
    </div>
  );
}

function MainApp() {
  const {
    isAuthenticated,
    isLoading,
    studentId,
    userType,
    login,
  } = useAuth();

  const [isPasswordRecovery, setIsPasswordRecovery] =
    useState(() => {
      const hash = window.location.hash;
      const search = window.location.search;

      return (
        hash.includes("type=recovery") ||
        search.includes("type=recovery")
      );
    });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isPasswordRecovery) {
    return (
      <ResetPasswordPage
        onComplete={() => {
          setIsPasswordRecovery(false);

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }}
      />
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={async (
          email,
          password,
          role
        ) => {
          await login(
            email,
            password,
            role
          );
        }}
      />
    );
  }

  if (!studentId) {
    return <AccountLinkError />;
  }

  if (userType === "parent") {
    return (
      <DataProvider studentId={studentId}>
        <ParentPortalPage />
      </DataProvider>
    );
  }

  return (
    <DataProvider studentId={studentId}>
      <StudentApp />
    </DataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <Toaster position="top-center" />
    </AuthProvider>
  );
}