import React from "react";
import { Palette, Code2 } from "lucide-react";
import { motion } from "motion/react";

interface BottomTabBarProps {
  activeTab: "product" | "engineering";
  onTabChange: (tab: "product" | "engineering") => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            aria-pressed={activeTab === "product"}
            onClick={() => onTabChange("product")}
            className={`relative flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-xl font-medium transition-colors ${
              activeTab === "product"
                ? "text-white shadow-lg shadow-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {activeTab === "product" && (
              <motion.div
                layoutId="investAiBottomTab"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2 pointer-events-none">
              <Palette size={20} />
              <span className="text-sm md:text-base">Product Design</span>
            </div>
          </button>

          <button
            type="button"
            aria-pressed={activeTab === "engineering"}
            onClick={() => onTabChange("engineering")}
            className={`relative flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-xl font-medium transition-colors ${
              activeTab === "engineering"
                ? "text-white shadow-lg shadow-indigo-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {activeTab === "engineering" && (
              <motion.div
                layoutId="investAiBottomTab"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2 pointer-events-none">
              <Code2 size={20} />
              <span className="text-sm md:text-base">Engineering</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
