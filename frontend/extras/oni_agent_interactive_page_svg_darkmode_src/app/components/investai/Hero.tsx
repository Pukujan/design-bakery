import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Code, Database, Brain } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-6 border border-blue-100">
            Case Study
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
            InvestAI: <span className="text-gray-500 font-normal">AI-Assisted Paper Trading & Financial Reasoning Research Platform</span>
          </h1>
          
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-500 font-medium mb-10 font-mono">
            <span>Product Designer</span>
            <span>System Architect</span>
            <span>Full-Stack / AI Engineer</span>
            <span>Research Lead</span>
          </div>

          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-10 font-light">
            A research-driven system evaluating financial reasoning through repeatable paper trading experiments and contextual AI explanations.
          </p>

          <div className="flex flex-wrap gap-4">
             <a 
              href="https://financial-investment-with-gemini-in.vercel.app/" 
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all"
            >
              View Live Demo
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#motivation"
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Read Case Study
            </a>
          </div>
        </motion.div>
      </div>

      {/* Abstract background elements */}
      <div className="absolute top-0 right-0 -z-10 w-1/2 h-full opacity-30 pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl"></div>
        <div className="absolute top-60 right-60 w-96 h-96 bg-gray-100 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};
