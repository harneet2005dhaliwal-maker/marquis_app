import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Calendar, MessageSquare, FileText, CreditCard, LogOut, User } from "lucide-react";
import { ParentReportsPage } from "./ParentReportsPage";
import { ParentBillingPage } from "./ParentBillingPage";
import { ParentDashboardPage } from "./ParentDashboardPage";
import { ParentSchedulePage } from "./ParentSchedulePage";
import { ParentMessagesPage } from "./ParentMessagesPage";
import { useAuth } from "../contexts/AuthContext";
import marquisLogo from "../assets/Logo.png";

export function ParentPortalPage() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "schedule" | "messages" | "reports" | "billing">("dashboard");

  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: Home },
    { id: "schedule" as const, label: "Schedule", icon: Calendar },
    { id: "messages" as const, label: "Messages", icon: MessageSquare },
    { id: "reports" as const, label: "Reports", icon: FileText },
    { id: "billing" as const, label: "Billing", icon: CreditCard },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ParentDashboardPage onNavigateToReports={() => setActiveTab("reports")} />;
      case "schedule":
        return <ParentSchedulePage />;
      case "messages":
        return <ParentMessagesPage />;
      case "reports":
        return <ParentReportsPage />;
      case "billing":
        return <ParentBillingPage />;
      default:
        return <ParentDashboardPage onNavigateToReports={() => setActiveTab("reports")} />;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(to bottom, #FFFFFF 0%, #FAFAF5 100%)",
      }}
    >
      {/* Header - Clean White Navbar */}
      <motion.header
        className="sticky top-0 backdrop-blur-md"
        style={{
          background: "rgba(255, 255, 255, 0.98)",
          borderBottom: "1px solid #E5E5E5",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          zIndex: 50,
        }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src={marquisLogo}
              alt="MARQUIS"
              style={{ width: '150px', height: 'auto' }}
            />
          </div>

          {/* Parent Profile */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={logout}
              className="flex items-center gap-2 px-2 py-2 rounded-lg transition-all"
              style={{
                background: 'transparent',
                border: '1px solid #E5E5E5',
                color: '#5A5A5A',
                fontFamily: 'Neurial Grotesk, sans-serif',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
              whileHover={{ 
                scale: 1.02,
                borderColor: '#F4C430',
                color: '#1A1A1A'
              }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </motion.button>

            <motion.div
              className="flex items-center gap-3 cursor-pointer px-3 py-1.5 rounded-lg"
              style={{
                background: '#F8F8F8',
              }}
              whileHover={{ scale: 1.02, background: '#F4F4F4' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-right hidden sm:block">
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                  }}
                >
                  Mrs. Johnson
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: "#F4C430",
                }}
              >
                <User className="w-4 h-4" style={{ color: "#1A1A1A" }} />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation - Clean White with Gold Accents */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 border-t bg-white pb-safe"
        style={{
          borderTop: "1px solid #E5E5E5",
          boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.06)",
          background: "#FFFFFF",
          zIndex: 50,
        }}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-around max-w-md mx-auto px-2 py-2 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all relative"
                style={{
                  background: 'transparent',
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon 
                  className="w-5 h-5" 
                  style={{ 
                    color: isActive ? '#F4C430' : '#5A5A5A',
                    strokeWidth: isActive ? 2 : 1.5,
                  }}
                />
                <span 
                  className="text-xs" 
                  style={{ 
                    fontFamily: 'Neurial Grotesk, sans-serif',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#1A1A1A' : '#5A5A5A'
                  }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeParentTab"
                    className="absolute -bottom-2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: '#F4C430' }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}