import React, { ReactNode } from "react";
import { motion } from "motion/react";

interface SectionProps {
  id: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}

export const Section = ({ id, title, subtitle, children, className = "", dark = false }: SectionProps) => {
  return (
    <section
      id={id}
      className={`scroll-mt-28 scroll-mb-36 py-20 md:py-32 px-4 ${dark ? "bg-gray-900 text-white" : "bg-white text-gray-900"} ${className}`}
    >
      <div className="max-w-4xl mx-auto">
        {(title || subtitle) && (
          <div className="mb-16">
            {subtitle && (
              <span className={`block text-sm font-bold tracking-wider uppercase mb-3 ${dark ? "text-blue-400" : "text-blue-600"}`}>
                {subtitle}
              </span>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                {title}
              </h2>
            )}
            <div className={`h-1 w-20 mt-6 ${dark ? "bg-blue-500" : "bg-black"}`}></div>
          </div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
};
