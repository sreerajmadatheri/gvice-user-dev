import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check, Loader2 } from "lucide-react";

export const Button = ({ children, onClick, ...props }) => {
  const [state, setState] = useState("idle"); // idle, loading, success

  const handleClick = async (e) => {
    e.preventDefault();
    if (state === "loading" || state === "success") return;
    
    setState("loading");
    
    // Execute custom onClick if provided (for demo animation)
    if (onClick) {
      await onClick();
    }
    
    // Directly open mail client
    window.location.href = "mailto:business@gvice.com";
    
    setState("success");
    setTimeout(() => setState("idle"), 3000);
  };

  return (
    <motion.button
      onClick={handleClick}
      className="relative flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white bg-black rounded-full overflow-hidden transition-all hover:bg-gray-800 active:scale-95"
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <AnimateContent state={state}>
        {children}
      </AnimateContent>
    </motion.button>
  );
};

const AnimateContent = ({ state, children }) => {
  if (state === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Preparing Mail...</span>
      </motion.div>
    );
  }

  if (state === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 text-green-400"
      >
        <Check className="w-5 h-5" />
        <span>Redirecting!</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2"
    >
      <Mail className="w-5 h-5" />
      <span>{children}</span>
    </motion.div>
  );
};

