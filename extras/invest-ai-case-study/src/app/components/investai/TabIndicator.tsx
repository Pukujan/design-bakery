import React from "react";
import { Palette, Code2 } from "lucide-react";

interface TabIndicatorProps {
  activeTab: "product" | "engineering";
}

export function TabIndicator({ activeTab }: TabIndicatorProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100 py-6">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          {activeTab === "product" ? (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                <Palette size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Product Design Case Study</h3>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <Code2 size={20} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Engineering Case Study</h3>
            </>
          )}
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
