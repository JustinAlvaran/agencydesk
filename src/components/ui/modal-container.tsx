"use client";
import React, { ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Modal Component
 *
 * (Your docstrings remain the same...)
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-3xl",
  scrollable = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  scrollable?: boolean;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Main Modal Panel */}
          <motion.div
            className={`bg-white/70 dark:bg-white/15 rounded-[40px] backdrop-blur-xl shadow-xl w-full max-h-[80vh] xl:min-w-[40vw] border border-white/40 ${maxWidth} mx-4 flex flex-col`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (Not scrollable) */}
            <div className="flex justify-between items-center p-5 flex-shrink-0">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="text-black dark:text-muted-foreground hover:rotate-180 hover:text-primary duration-600 transition-all ease-in-out dark:hover:text-primary text-xl rounded-full px-4 aspect-square bg-white/60 dark:bg-white/20 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content (scroll hidden) */}
            <div
              className={`p-6 ${
                scrollable
                  ? "overflow-y-auto scrollbar-hide"
                  : ""
              }`}
            >
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!isClient) {
    return null;
  }

  return ReactDOM.createPortal(
    modalContent,
    document.body
  );
}