import React from "react";
import { Github, ExternalLink, Linkedin, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
          InvestAI Case Study
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          InvestAI is a research-driven system designed to evaluate how people think about investing, 
          not to predict markets. AI is used as a tool for explanation, consistency, and learning — not authority.
        </p>

        <div className="flex justify-center gap-6 mb-12">
          <a 
            href="https://github.com/Pukujan/financial-investment-with-gemini-insights" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 hover:border-black hover:text-black transition-colors shadow-sm"
          >
            <Github size={18} />
            <span className="font-medium">View Source</span>
          </a>
          <a 
            href="https://financial-investment-with-gemini-in.vercel.app/" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/10"
          >
            <ExternalLink size={18} />
            <span className="font-medium">Live Demo</span>
          </a>
        </div>

        <div className="text-sm text-gray-400">
          <p>© {new Date().getFullYear()} InvestAI Case Study. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
