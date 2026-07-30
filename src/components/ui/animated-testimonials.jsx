import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const AnimatedTestimonials = ({ testimonials }) => {
  const [active, setActive] = useState(0);

  const next = () => {
    setActive((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="relative w-full md:w-1/2 h-80 perspective-1000">
          <AnimatePresence mode="popLayout">
            {testimonials.map((testimonial, index) => {
              const isActive = index === active;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                  animate={{
                    opacity: isActive ? 1 : 0.4,
                    scale: isActive ? 1 : 0.8,
                    rotateY: isActive ? 0 : 20,
                    zIndex: isActive ? 10 : 0,
                    x: isActive ? 0 : (index - active) * 20,
                  }}
                  exit={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl"
                  style={{ display: isActive || Math.abs(index - active) <= 1 ? "block" : "none" }}
                >
                  <img
                    src={testimonial.src}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-2xl font-serif italic text-gray-800 dark:text-gray-200 mb-6">
                "{testimonials[active].quote}"
              </p>
              <div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                  {testimonials[active].name}
                </h4>
                <p className="text-gray-500 dark:text-gray-400">
                  {testimonials[active].designation}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-4 mt-8">
            <button
              onClick={prev}
              aria-label="Previous testimonial"
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Next testimonial"
              className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

