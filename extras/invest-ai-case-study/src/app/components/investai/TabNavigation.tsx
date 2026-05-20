import React from "react";

interface TabNavigationProps {
  activeTab: "product" | "engineering";
  onTabChange: (tab: "product" | "engineering") => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex gap-8">
          <button
            onClick={() => onTabChange("product")}
            className={`py-4 px-2 font-medium text-sm transition-colors relative ${
              activeTab === "product"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Product Design Case Study
            {activeTab === "product" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => onTabChange("engineering")}
            className={`py-4 px-2 font-medium text-sm transition-colors relative ${
              activeTab === "engineering"
                ? "text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Engineering Case Study
            {activeTab === "engineering" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
