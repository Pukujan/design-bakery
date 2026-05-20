import React from "react";
import { Palette, Code2 } from "lucide-react";

interface TabIndicatorProps {
  activeTab: "product" | "engineering";
  onTabChange: (tab: "product" | "engineering") => void;
}

export function TabIndicator({ activeTab, onTabChange }: TabIndicatorProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100 py-6">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => onTabChange("product")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "product"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white/80 text-gray-700 hover:bg-white border border-blue-100"
            }`}
          >
            <Palette size={18} />
            Product Design
          </button>
          <button
            type="button"
            onClick={() => onTabChange("engineering")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "engineering"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white/80 text-gray-700 hover:bg-white border border-indigo-100"
            }`}
          >
            <Code2 size={18} />
            Engineering
          </button>
        </div>
        <p className="text-sm text-gray-600">
          {activeTab === "product"
            ? "Exploring user research, product vision, and design decisions"
            : "Deep dive into technical architecture, AI evaluation systems, and engineering decisions"}
        </p>
      </div>
    </div>
  );
}
