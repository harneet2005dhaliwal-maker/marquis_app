import { useState } from "react";

import { HomePage } from "./components/HomePage";
import { BookingsPage } from "./components/BookingsPage";
import { AnnouncementsPage } from "./components/AnnouncementsPage";
import { StudyPage } from "./components/StudyPage";
import { ProgressPage } from "./components/ProgressPage";
import { ParentPortalPage } from "./components/ParentPortalPage";
import { LoginPage } from "./components/LoginPage";

import { DataProvider, useData } from "./contexts/DataContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

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
    {
      id: "home",
      label: "Home",
      icon: Home,
    },
    {
      id: "bookings",
      label: "Classes",
      icon: Calendar,
    },
    {
      id: "progress",
      label: "Progress",
      icon: TrendingUp,
    },
    {
      id: "study",
      label: "Study",
      icon: BookOpen,
    },
    {
      id: "announcements",
      label: "News",
      icon: Bell,
    },
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
    <div className="flex min-h-dvh w-full justify-center bg-white">
      <div className="relative min-h-dvh w-full max-w-md overflow-hidden bg-white">
        <header
          className="absolute left-0 right-0 top-0 z-50 border-b border-marquis-border bg-white"
          style={{
            height: `${HEADER_HEIGHT}px`,
            boxShadow:
              "0px 4px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="flex h-full items-center justify-between px-5">
            <img
              src={logo}
              alt="Marquis Education"
              className="h-9 w-auto object-contain"
            />

            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={() => void logout()}
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{
                  background: "transparent",
                  border: "1px solid #E6E6E6",
                  color: "#6E6E70",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                whileHover={{
                  scale: 1.05,
                  background: "rgba(0, 0, 0, 0.02)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </motion.button>

              <Avatar
                className="h-9 w-9 bg-white"
                style={{
                  border: "2px solid #E6E6E6",
                  boxShadow:
                    "0px 2px 8px rgba(0, 0, 0, 0.06)",
                }}
              >
                <AvatarFallback
                  className="bg-white text-black"
                  style={{
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  {currentStudent?.name
                    ? getInitials(currentStudent.name)
                    : "ST"}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main
          className="h-dvh overflow-y-auto bg-white"
          style={{
            paddingTop: `${HEADER_HEIGHT}px`,
            paddingBottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              exit={{
                opacity: 0,
                x: 20,
              }}
              transition={{
                duration: 0.3,
              }}
            >
              {activeTab === "home" && (
                <HomePage onNavigate={handleNavigate} />
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

              {activeTab === "announcements" && (
                <AnnouncementsPage />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <motion.nav
          className="absolute bottom-0 left-0 right-0 z-50 border-t border-marquis-border bg-white"
          style={{
            height: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
            paddingBottom:
              "env(safe-area-inset-bottom)",
            boxShadow:
              "0px -4px 20px rgba(0, 0, 0, 0.08)",
          }}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <div className="flex h-full items-center justify-around px-4">
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
                  className={`relative flex flex-col items-center gap-1.5 rounded-xl px-4 py-2 ${
                    isActive
                      ? "text-black"
                      : "text-marquis-grey"
                  }`}
                  style={{
                    background: isActive
                      ? "rgba(255, 213, 0, 0.1)"
                      : "transparent",
                  }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <Icon
                    className="h-6 w-6"
                    style={{
                      color: isActive
                        ? "#FFD500"
                        : "#6E6E70",
                      strokeWidth: isActive
                        ? 2.5
                        : 2,
                      filter: isActive
                        ? "drop-shadow(0px 2px 4px rgba(255, 213, 0, 0.3))"
                        : "none",
                    }}
                  />

                  <span
                    className="text-xs"
                    style={{
                      fontFamily:
                        "Inter, sans-serif",
                      fontWeight: isActive
                        ? 700
                        : 500,
                      color: isActive
                        ? "#000000"
                        : "#6E6E70",
                    }}
                  >
                    {tab.label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="activeStudentTab"
                      className="absolute bottom-0 h-1 w-1 rounded-full"
                      style={{
                        backgroundColor:
                          "#FFD500",
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.nav>
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
