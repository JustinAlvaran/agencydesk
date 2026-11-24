"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  PaperClipIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SparklesIcon,
  CheckCircleIcon
} from "@heroicons/react/24/solid";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; action: string; icon?: React.ReactNode }[];
  links?: { label: string; href: string }[];
  timestamp: string;
}

const quickOptions = [
  { label: "Book a demo", action: "book_demo", icon: <CalendarIcon className="w-3.5 h-3.5 text-blue-400" /> },
  { label: "Chat with sales", action: "chat_sales", icon: <ChatBubbleOvalLeftEllipsisIcon className="w-3.5 h-3.5 text-purple-400" /> },
  { label: "Get started for free", action: "get_started", icon: <RocketLaunchIcon className="w-3.5 h-3.5 text-emerald-400" /> },
  { label: "Pricing and plans", action: "pricing", icon: <CurrencyDollarIcon className="w-3.5 h-3.5 text-amber-400" /> },
];

export default function AgencyBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPromptBadge, setShowPromptBadge] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialBotMessage: Message = {
    id: "welcome-1",
    sender: "bot",
    text: "👋 Have questions about AgencyDesk? I'm here to help you explore our CRM, client portal, or fixed-scope sprint delivery!",
    options: quickOptions,
    timestamp: "Just now",
  };

  const [messages, setMessages] = useState<Message[]>([initialBotMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowPromptBadge(false);
    }
  }, [messages, isOpen, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      sender: "user",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateBotAnswer(text);
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  const handleOptionClick = (action: string, label: string) => {
    const userMsg: Message = {
      id: "user-" + Date.now(),
      sender: "user",
      text: label,
      timestamp: "Just now",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let botResponse: Message;

      switch (action) {
        case "book_demo":
          botResponse = {
            id: "bot-" + Date.now(),
            sender: "bot",
            text: "📅 We'd love to walk you through AgencyDesk! You can submit a structured discovery brief or directly access our interactive sandbox right now.",
            links: [
              { label: "Submit Discovery Inquiry ↗", href: "/inquire" },
              { label: "Launch CRM Interactive Sandbox ↗", href: "/crm/leads" },
            ],
            timestamp: "Just now",
          };
          break;

        case "chat_sales":
          botResponse = {
            id: "bot-" + Date.now(),
            sender: "bot",
            text: "💬 Our principal Justin Alvaran and engineering pods are available for technical feasibility reviews and architecture scoping. You can reach us directly:",
            links: [
              { label: "Start Project Inquiry ↗", href: "/inquire" },
              { label: "Email: inquiries@agencydesk.dev", href: "mailto:inquiries@agencydesk.dev" },
            ],
            timestamp: "Just now",
          };
          break;

        case "get_started":
          botResponse = {
            id: "bot-" + Date.now(),
            sender: "bot",
            text: "🚀 AgencyDesk offers instant demo access to both our internal agency CRM and our client collaboration portal with 1-click test accounts:",
            links: [
              { label: "Demo Sign In (1-Click) ↗", href: "/login" },
              { label: "Explore Pipeline Kanban ↗", href: "/crm/leads" },
              { label: "Inspect Client Portal ↗", href: "/portal" },
            ],
            timestamp: "Just now",
          };
          break;

        case "pricing":
          botResponse = {
            id: "bot-" + Date.now(),
            sender: "bot",
            text: "💰 AgencyDesk operates on 100% Fixed-Price Sprint Scopes. Every milestone is itemized and guaranteed before work begins with zero surprise invoices:\n\n• Sprint 1 MVP Delivery: $15,000 – $25,000 (14-day turnaround)\n• Full-Stack Platform: $35,000 – $60,000 (multi-sprint roadmap)\n• Dedicated Engineering Pod: Custom scope with versioned change orders.",
            links: [
              { label: "View Proposal Builder ↗", href: "/crm/proposals" },
              { label: "Request Fixed-Price Scope ↗", href: "/inquire" },
            ],
            timestamp: "Just now",
          };
          break;

        default:
          botResponse = {
            id: "bot-" + Date.now(),
            sender: "bot",
            text: "Got it! How else can I assist your agency today?",
            options: quickOptions,
            timestamp: "Just now",
          };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 600);
  };

  const generateBotAnswer = (prompt: string): Message => {
    const q = prompt.toLowerCase();

    if (q.includes("price") || q.includes("cost") || q.includes("how much") || q.includes("plan") || q.includes("budget")) {
      return {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: "AgencyDesk eliminates billable-hour surprises with fixed-fee versioned proposals. Typical sprints range from $15k to $60k depending on technical scope, deliverables, and pod allocation.",
        links: [
          { label: "Explore Proposals & Pricing ↗", href: "/crm/proposals" },
          { label: "Request Customized Scope ↗", href: "/inquire" },
        ],
        timestamp: "Just now",
      };
    }

    if (q.includes("kanban") || q.includes("crm") || q.includes("lead") || q.includes("pipeline")) {
      return {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: "Our Sales Pipeline Kanban uses stage-weighted probability calculations inspired by Atomic CRM and LeadForge. You can filter by service, toggle between Kanban cards and Table view, and inspect lead slide-overs in real time.",
        links: [
          { label: "Go to Pipeline Kanban ↗", href: "/crm/leads" },
          { label: "View Executive Dashboard ↗", href: "/crm" },
        ],
        timestamp: "Just now",
      };
    }

    if (q.includes("client portal") || q.includes("portal") || q.includes("client")) {
      return {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: "The Client Portal provides stakeholders with 24/7 visibility into active sprint burndown, review deliverables, immutable agreed scopes, and milestone approval gates.",
        links: [
          { label: "Open Client Portal ↗", href: "/portal" },
        ],
        timestamp: "Just now",
      };
    }

    if (q.includes("timeline") || q.includes("how long") || q.includes("mvp") || q.includes("sprint")) {
      return {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: "We prioritize rapid velocity! Sprint 1 delivers a functional, tested milestone within 14 business days. All subsequent sprints are tracked through milestone progress bars in your client dashboard.",
        links: [
          { label: "View Active Sprints ↗", href: "/crm/projects" },
        ],
        timestamp: "Just now",
      };
    }

    if (q.includes("tech") || q.includes("stack") || q.includes("nextjs") || q.includes("supabase")) {
      return {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: "AgencyDesk is built on modern enterprise foundations: Next.js 15, Tailwind CSS, TypeScript, Framer Motion, Supabase row-level security, and deterministic event outbox dispatchers.",
        links: [
          { label: "View Automations & Outbox ↗", href: "/crm/automations" },
        ],
        timestamp: "Just now",
      };
    }

    if (q.includes("hi") || q.includes("hello") || q.includes("hey") || q.includes("good")) {
      return {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: "Hello! Welcome to AgencyDesk. I can help you test our CRM pipeline, inspect sample proposals, or schedule a discovery call for your next digital project.",
        options: quickOptions,
        timestamp: "Just now",
      };
    }

    return {
      id: "bot-" + Date.now(),
      sender: "bot",
      text: "Thanks for asking! You can explore all our live workspaces or submit a structured inquiry to get matched with an engineering pod:",
      options: quickOptions,
      links: [
        { label: "Start Client Inquiry ↗", href: "/inquire" },
        { label: "Open CRM Workspace ↗", href: "/crm" },
      ],
      timestamp: "Just now",
    };
  };

  const handleAttachment = () => {
    toast.info("Attachment Simulator", {
      description: "Project specification files can be attached during inquiry submission.",
    });
  };

  return (
    <>
      {/* Floating Launcher Button at Bottom-Right */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Subtle Callout Badge */}
        <AnimatePresence>
          {!isOpen && showPromptBadge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 10 }}
              onClick={() => setIsOpen(true)}
              className="cursor-pointer hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-zinc-900/95 dark:bg-black/95 text-white text-xs font-semibold shadow-xl border border-zinc-700/80 backdrop-blur-md hover:border-primary transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Have questions? Ask AgencyBot</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative ${
            isOpen 
              ? "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700" 
              : "bg-primary text-white shadow-primary/30 hover:shadow-primary/50"
          }`}
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <>
              <ChatBubbleLeftRightIcon className="w-7 h-7" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black" />
            </>
          )}
        </motion.button>
      </div>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className={`fixed z-50 bottom-24 right-4 sm:right-6 
              bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl 
              border border-gray-200 dark:border-zinc-800 
              shadow-2xl rounded-3xl overflow-hidden flex flex-col 
              transition-all duration-300 ${
                isExpanded 
                  ? "w-[95vw] sm:w-[480px] h-[82vh] max-h-[750px]" 
                  : "w-[92vw] sm:w-[390px] h-[580px] max-h-[85vh]"
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-zinc-900 text-white border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
                    <SparklesIcon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm tracking-wide text-white">AgencyBot</h4>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary uppercase">AI</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium">Powered by AgencyDesk AI</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-label={isExpanded ? "Collapse window" : "Expand window"}
                  className="p-1.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  {isExpanded ? (
                    <ArrowsPointingInIcon className="w-4 h-4" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 text-xs sm:text-sm">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-start gap-2 max-w-[88%]">
                    {msg.sender === "bot" && (
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                        <SparklesIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        msg.sender === "user"
                          ? "bg-primary text-white rounded-br-none shadow-md shadow-primary/20"
                          : "bg-gray-100 dark:bg-zinc-900/90 text-gray-900 dark:text-zinc-200 border border-gray-200/80 dark:border-zinc-800/80 rounded-bl-none shadow-xs"
                      }`}
                    >
                      {msg.text}

                      {/* Attached Links */}
                      {msg.links && msg.links.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-3 pt-2.5 border-t border-gray-200 dark:border-zinc-800">
                          {msg.links.map((link, idx) => (
                            <Link
                              key={idx}
                              href={link.href}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1.5 font-bold text-xs text-primary hover:underline"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{link.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options Pills if bot message has them */}
                  {msg.options && (
                    <div className="flex flex-col gap-1.5 mt-2.5 ml-8 w-full max-w-[85%]">
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400">
                        Ask me or select an option:
                      </span>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {msg.options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleOptionClick(opt.action, opt.label)}
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700/80 hover:border-primary dark:hover:border-primary text-gray-800 dark:text-zinc-200 text-[11px] font-semibold text-left transition-[transform,border-color,background-color] duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.96] shadow-xs cursor-pointer"
                          >
                            {opt.icon}
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-zinc-400 text-xs ml-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <SparklesIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900 px-3 py-2 rounded-2xl border border-gray-200 dark:border-zinc-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Privacy Disclaimer Banner */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-950/80 border-t border-gray-200 dark:border-zinc-800/80 text-[10px] text-gray-500 dark:text-zinc-400 leading-tight">
              AgencyDesk uses your conversation to assist with project scoping. Review our{" "}
              <Link href="/privacy-policy" onClick={() => setIsOpen(false)} className="underline text-primary hover:text-primary/80">
                privacy policy
              </Link>.
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-zinc-800 flex flex-col gap-1.5 shrink-0"
            >
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-900/90 rounded-2xl px-3 py-1.5 border border-gray-200 dark:border-zinc-800 focus-within:border-primary transition-colors">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 outline-none py-1.5"
                />

                <button
                  type="button"
                  onClick={handleAttachment}
                  title="Attach brief or specification"
                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <PaperClipIcon className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className={`p-1.5 rounded-xl transition-all ${
                    inputMessage.trim()
                      ? "bg-primary text-white shadow-xs hover:bg-primary/90 cursor-pointer"
                      : "text-gray-400 dark:text-zinc-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center text-[10px] text-gray-400 dark:text-zinc-500">
                AI can make mistakes · AgencyDesk Workspace
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
