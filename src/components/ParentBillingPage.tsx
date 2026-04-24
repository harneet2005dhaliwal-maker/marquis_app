import { useState } from "react";
import { motion } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { 
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ArrowRight,
  Mail,
  Bell,
  FileText,
  AlertCircle,
  CreditCard,
  CalendarDays
} from "lucide-react";

interface Payment {
  id: string;
  title: string;
  date: string;
  amount: number;
  status: "scheduled" | "unpaid";
  term?: string;
}

interface Invoice {
  id: string;
  month: string;
  invoiceNumber: string;
  status: "paid" | "overdue" | "pending";
  paidDate?: string;
  amount: number;
  term?: string;
}

interface Term {
  name: string;
  startDate: string;
  endDate: string;
  weeks: number;
  status: "current" | "upcoming" | "past";
}

export function ParentBillingPage() {
  const [currentBalance] = useState(0); // $0 means paid up
  
  const currentTerm: Term = {
    name: "Term 4 2024",
    startDate: "October 14, 2024",
    endDate: "December 20, 2024",
    weeks: 10,
    status: "current"
  };

  const upcomingTerm: Term = {
    name: "Term 1 2025",
    startDate: "January 27, 2025",
    endDate: "April 11, 2025",
    weeks: 11,
    status: "upcoming"
  };
  
  const nextPayment = {
    amount: 450,
    dueDate: "December 15, 2024",
    term: "Term 4 2024"
  };

  const upcomingPayments: Payment[] = [
    {
      id: "1",
      title: "Monthly Tutoring – January 2025",
      date: "January 15, 2025",
      amount: 450,
      status: "scheduled",
      term: "Term 1 2025"
    },
    {
      id: "2",
      title: "Monthly Tutoring – February 2025",
      date: "February 15, 2025",
      amount: 450,
      status: "scheduled",
      term: "Term 1 2025"
    },
    {
      id: "3",
      title: "Monthly Tutoring – March 2025",
      date: "March 15, 2025",
      amount: 450,
      status: "scheduled",
      term: "Term 1 2025"
    },
  ];

  const invoiceHistory: Invoice[] = [
    {
      id: "1",
      month: "November 2024",
      invoiceNumber: "INV-2024-11",
      status: "paid",
      paidDate: "Nov 5, 2024",
      amount: 450,
      term: "Term 4 2024"
    },
    {
      id: "2",
      month: "October 2024",
      invoiceNumber: "INV-2024-10",
      status: "paid",
      paidDate: "Oct 5, 2024",
      amount: 450,
      term: "Term 4 2024"
    },
    {
      id: "3",
      month: "September 2024",
      invoiceNumber: "INV-2024-09",
      status: "paid",
      paidDate: "Sep 5, 2024",
      amount: 450,
      term: "Term 3 2024"
    },
    {
      id: "4",
      month: "August 2024",
      invoiceNumber: "INV-2024-08",
      status: "paid",
      paidDate: "Aug 5, 2024",
      amount: 450,
      term: "Term 3 2024"
    },
  ];

  const handlePaymentLink = () => {
    window.open("https://marquis.education/payments", "_blank");
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Create a simple invoice content
    const invoiceContent = `
MARQUIS TUTORING
Invoice ${invoice.invoiceNumber}

Student: Alex Johnson
Parent: Mrs. Johnson
Period: ${invoice.month}

SERVICES:
Monthly Tutoring Services          $${invoice.amount}.00

TOTAL:                              $${invoice.amount}.00
Status: ${invoice.status.toUpperCase()}
${invoice.paidDate ? `Paid Date: ${invoice.paidDate}` : ''}

Thank you for choosing Marquis!
For questions, contact: hi@marquis.education
    `.trim();

    // Create a blob and download
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Marquis-${invoice.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        background: "#FAFAF8",
        minHeight: "100vh",
        paddingBottom: "48px",
      }}
    >
      <div className="px-6 py-8 max-w-3xl mx-auto">
        {/* SECTION 1 — Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "32px",
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: "8px",
            }}
          >
            Billing & Payments
          </h1>
          <p
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              color: "#6B6B6B",
              marginBottom: "16px",
            }}
          >
            Manage upcoming payments, past invoices, and important updates.
          </p>

          {/* Notification Pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: "#FFF9E6",
              border: "1px solid #F2C94C",
            }}
          >
            <Bell className="w-4 h-4" style={{ color: "#F2C94C" }} />
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "13px",
                fontWeight: 500,
                color: "#1A1A1A",
              }}
            >
              1 new update: January fee structure change
            </p>
          </div>
        </motion.div>

        {/* NEW SECTION — Term Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-8"
        >
          <h2
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "20px",
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: "16px",
            }}
          >
            Term Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Term Card */}
            <Card
              className="border-0 p-6"
              style={{
                background: "linear-gradient(135deg, #FFFBF0 0%, #FFFFFF 100%)",
                borderRadius: "20px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                border: "2px solid #F8D548",
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "#F8D548",
                  }}
                >
                  <CalendarDays className="w-6 h-6" style={{ color: "#1A1A1A", strokeWidth: 2 }} />
                </div>
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full mb-2"
                    style={{
                      background: "#F8D548",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#1A1A1A",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Current Term
                    </p>
                  </div>
                  <h3
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#1A1A1A",
                      marginBottom: "4px",
                    }}
                  >
                    {currentTerm.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B6B6B",
                    }}
                  >
                    Start Date
                  </p>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                    }}
                  >
                    {currentTerm.startDate}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B6B6B",
                    }}
                  >
                    End Date
                  </p>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                    }}
                  >
                    {currentTerm.endDate}
                  </p>
                </div>
                <div
                  className="h-px"
                  style={{
                    background: "rgba(0, 0, 0, 0.08)",
                  }}
                />
                <div className="flex items-center justify-between">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B6B6B",
                    }}
                  >
                    Duration
                  </p>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                    }}
                  >
                    {currentTerm.weeks} weeks
                  </p>
                </div>
              </div>
            </Card>

            {/* Upcoming Term Card */}
            <Card
              className="border-0 p-6"
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                border: "1px solid #EDEDED",
              }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "#F9F9F9",
                  }}
                >
                  <CalendarDays className="w-6 h-6" style={{ color: "#6B6B6B", strokeWidth: 2 }} />
                </div>
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full mb-2"
                    style={{
                      background: "#F0F0F0",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6B6B6B",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Upcoming Term
                    </p>
                  </div>
                  <h3
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "22px",
                      fontWeight: 700,
                      color: "#1A1A1A",
                      marginBottom: "4px",
                    }}
                  >
                    {upcomingTerm.name}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B6B6B",
                    }}
                  >
                    Start Date
                  </p>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                    }}
                  >
                    {upcomingTerm.startDate}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B6B6B",
                    }}
                  >
                    End Date
                  </p>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                    }}
                  >
                    {upcomingTerm.endDate}
                  </p>
                </div>
                <div
                  className="h-px"
                  style={{
                    background: "rgba(0, 0, 0, 0.08)",
                  }}
                />
                <div className="flex items-center justify-between">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#6B6B6B",
                    }}
                  >
                    Duration
                  </p>
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1A1A1A",
                    }}
                  >
                    {upcomingTerm.weeks} weeks
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* SECTION 2 — Outstanding Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card
            className="border-0 p-8"
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              border: "1px solid #EDEDED",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#6B6B6B",
                    marginBottom: "8px",
                  }}
                >
                  Current Balance
                </p>
                <div className="flex items-baseline gap-3 mb-2">
                  <p
                    style={{
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontSize: "48px",
                      fontWeight: 700,
                      color: currentBalance > 0 ? "#F2C94C" : "#27AE60",
                    }}
                  >
                    ${currentBalance}
                  </p>
                  {currentBalance === 0 && (
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "#27AE60",
                      }}
                    >
                      You're all caught up!
                    </p>
                  )}
                  {currentBalance > 0 && (
                    <p
                      style={{
                        fontFamily: "Neurial Grotesk, sans-serif",
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "#F2C94C",
                      }}
                    >
                      Due now
                    </p>
                  )}
                </div>

                {currentBalance > 0 && (
                  <Button
                    onClick={handlePaymentLink}
                    className="flex items-center gap-2 mt-4"
                    style={{
                      background: "#1A1A1A",
                      color: "#FFFFFF",
                      borderRadius: "12px",
                      fontFamily: "Neurial Grotesk, sans-serif",
                      fontWeight: 600,
                      fontSize: "14px",
                      padding: "12px 24px",
                      border: "none",
                    }}
                  >
                    Go to Payment Page
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Icon */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: currentBalance === 0 ? "#E8F8EA" : "#FFF9E6",
                }}
              >
                {currentBalance === 0 ? (
                  <CheckCircle2 className="w-8 h-8" style={{ color: "#27AE60", strokeWidth: 2 }} />
                ) : (
                  <AlertCircle className="w-8 h-8" style={{ color: "#F2C94C", strokeWidth: 2 }} />
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* SECTION 3 — Next Scheduled Payment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h2
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "20px",
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: "16px",
            }}
          >
            Next Payment
          </h2>

          <Card
            className="border-0 p-6"
            style={{
              background: "#FFFFFF",
              borderRadius: "24px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              border: "1px solid #EDEDED",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "28px",
                    fontWeight: 700,
                    color: "#1A1A1A",
                    marginBottom: "4px",
                  }}
                >
                  ${nextPayment.amount}
                </p>
                <p
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#6B6B6B",
                  }}
                >
                  Due {nextPayment.dueDate}
                </p>
              </div>

              {/* Calendar Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "#F9F9F9",
                }}
              >
                <Calendar className="w-6 h-6" style={{ color: "#6B6B6B", strokeWidth: 2 }} />
              </div>
            </div>

            {/* Tag */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4"
              style={{
                background: "#F9F9F9",
              }}
            >
              <p
                style={{
                  fontFamily: "Neurial Grotesk, sans-serif",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#6B6B6B",
                }}
              >
                Auto-generated from Marquis System
              </p>
            </div>

            <Button
              onClick={handlePaymentLink}
              variant="ghost"
              className="flex items-center gap-2"
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#1A1A1A",
                padding: "0",
              }}
            >
              View Payment Details
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </motion.div>

        {/* SECTION 4 — Upcoming Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <h2
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "20px",
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: "16px",
            }}
          >
            Upcoming Payments
          </h2>

          <div className="space-y-3">
            {upcomingPayments.map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
              >
                <Card
                  className="border-0 p-5"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "16px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    border: "1px solid #EDEDED",
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Column */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          background: "#FFFFFF",
                          border: "2px solid #F2C94C",
                        }}
                      >
                        <DollarSign className="w-6 h-6" style={{ color: "#F2C94C", strokeWidth: 2.5 }} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#1A1A1A",
                            marginBottom: "4px",
                          }}
                        >
                          {payment.title}
                        </p>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#6B6B6B",
                          }}
                        >
                          {payment.date}
                        </p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex items-center gap-4">
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1A1A1A",
                        }}
                      >
                        ${payment.amount}
                      </p>
                      {payment.status === "unpaid" ? (
                        <Button
                          onClick={handlePaymentLink}
                          style={{
                            background: "#1A1A1A",
                            color: "#FFFFFF",
                            borderRadius: "10px",
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontWeight: 600,
                            fontSize: "13px",
                            padding: "8px 16px",
                            border: "none",
                          }}
                        >
                          Pay →
                        </Button>
                      ) : (
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#9B9B9B",
                          }}
                        >
                          Scheduled
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* SECTION 5 — Past Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <h2
            style={{
              fontFamily: "Neurial Grotesk, sans-serif",
              fontSize: "20px",
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: "16px",
            }}
          >
            Invoice History
          </h2>

          <div className="space-y-3">
            {invoiceHistory.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.05 }}
              >
                <Card
                  className="border-0 p-5"
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "16px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    border: "1px solid #EDEDED",
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* Left Side */}
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background:
                            invoice.status === "paid"
                              ? "#E8F8EA"
                              : invoice.status === "overdue"
                              ? "#FFEAEA"
                              : "#F9F9F9",
                        }}
                      >
                        {invoice.status === "paid" && (
                          <CheckCircle2 className="w-5 h-5" style={{ color: "#27AE60", strokeWidth: 2 }} />
                        )}
                        {invoice.status === "overdue" && (
                          <AlertCircle className="w-5 h-5" style={{ color: "#EB5757", strokeWidth: 2 }} />
                        )}
                        {invoice.status === "pending" && (
                          <Clock className="w-5 h-5" style={{ color: "#6B6B6B", strokeWidth: 2 }} />
                        )}
                      </div>

                      <div>
                        <p
                          style={{
                            fontFamily: "Neurial Grotesk, sans-serif",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#1A1A1A",
                            marginBottom: "4px",
                          }}
                        >
                          {invoice.month}
                        </p>
                        <div className="flex items-center gap-3">
                          <p
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "12px",
                              fontWeight: 400,
                              color: "#6B6B6B",
                            }}
                          >
                            {invoice.invoiceNumber}
                          </p>
                          <div
                            className="px-2 py-0.5 rounded"
                            style={{
                              background:
                                invoice.status === "paid"
                                  ? "#E8F8EA"
                                  : invoice.status === "overdue"
                                  ? "#FFEAEA"
                                  : "#F9F9F9",
                            }}
                          >
                            <p
                              style={{
                                fontFamily: "Neurial Grotesk, sans-serif",
                                fontSize: "11px",
                                fontWeight: 600,
                                color:
                                  invoice.status === "paid"
                                    ? "#27AE60"
                                    : invoice.status === "overdue"
                                    ? "#EB5757"
                                    : "#6B6B6B",
                                textTransform: "uppercase",
                              }}
                            >
                              {invoice.status}
                            </p>
                          </div>
                        </div>
                        {invoice.paidDate && (
                          <p
                            style={{
                              fontFamily: "Neurial Grotesk, sans-serif",
                              fontSize: "12px",
                              fontWeight: 400,
                              color: "#9B9B9B",
                              marginTop: "4px",
                            }}
                          >
                            Paid: {invoice.paidDate}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                      <p
                        style={{
                          fontFamily: "Neurial Grotesk, sans-serif",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#1A1A1A",
                        }}
                      >
                        ${invoice.amount}
                      </p>
                      <button
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-gray-100"
                        style={{
                          background: "#F9F9F9",
                        }}
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <Download className="w-4 h-4" style={{ color: "#6B6B6B" }} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* SECTION 6 — Billing Support & Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Announcements Card */}
          <Card
            className="border-0 p-6"
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              border: "1px solid #EDEDED",
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "#FFF9E6",
                }}
              >
                <Bell className="w-5 h-5" style={{ color: "#F2C94C", strokeWidth: 2 }} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    marginBottom: "4px",
                  }}
                >
                  Billing Announcements
                </h3>
              </div>
            </div>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                color: "#6B6B6B",
                lineHeight: "1.6",
              }}
            >
              Fee structure update effective Term 1 2025. Minor adjustments to session rates.
            </p>
          </Card>

          {/* Help Card */}
          <Card
            className="border-0 p-6"
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              border: "1px solid #EDEDED",
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: "#E5F1FF",
                }}
              >
                <Mail className="w-5 h-5" style={{ color: "#0077FF", strokeWidth: 2 }} />
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "Neurial Grotesk, sans-serif",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1A1A1A",
                    marginBottom: "4px",
                  }}
                >
                  Need help with billing?
                </h3>
              </div>
            </div>
            <p
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                color: "#6B6B6B",
                lineHeight: "1.6",
                marginBottom: "16px",
              }}
            >
              Contact our admin team for payment questions, plans, or invoice requests.
            </p>
            <Button
              onClick={() => window.location.href = "mailto:hi@marquis.education"}
              variant="ghost"
              className="flex items-center gap-2 -ml-2"
              style={{
                fontFamily: "Neurial Grotesk, sans-serif",
                fontSize: "14px",
                fontWeight: 500,
                color: "#0077FF",
                padding: "8px",
              }}
            >
              Contact Admin
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}