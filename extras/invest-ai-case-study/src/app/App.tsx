import React, { useState } from "react";
import { Header } from "./components/investai/Header";
import { Footer } from "./components/investai/Footer";
import { Hero } from "./components/investai/Hero";
import { TabIndicator } from "./components/investai/TabIndicator";
import { BottomTabBar } from "./components/investai/BottomTabBar";
import { ProductDesignCaseStudy } from "./components/investai/ProductDesignCaseStudy";
import { EngineeringCaseStudy } from "./components/investai/EngineeringCaseStudy";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"product" | "engineering">("product");

  const handleTabChange = (tab: "product" | "engineering") => {
    setActiveTab(tab);
    // Smooth scroll to top when switching tabs
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-black selection:text-white pb-24">
      <Header />

      <main>
        <Hero />

        {/* Tab Indicator */}
        <TabIndicator activeTab={activeTab} />

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "product" ? <ProductDesignCaseStudy /> : <EngineeringCaseStudy />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
