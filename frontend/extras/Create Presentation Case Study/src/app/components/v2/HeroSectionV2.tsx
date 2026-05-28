import { motion } from "motion/react";
import { Code2, Layers, Zap } from "lucide-react";

export function HeroSectionV2() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-primary text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgb(255, 215, 0) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block mb-6"
          >
            <span className="px-6 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-semibold tracking-wide">
              FULLSTACK PRODUCT ENGINEERING CASE STUDY
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-8 leading-tight"
          >
            Ekagajpatra
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid md:grid-cols-2 gap-4 mb-12 max-w-4xl"
          >
            <div className="flex items-start gap-3">
              <div className="text-secondary font-semibold shrink-0">Role:</div>
              <div className="text-primary-foreground/90">
                Lead Product Designer (research · branding · UX/UI · front-end)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-secondary font-semibold shrink-0">Duration:</div>
              <div className="text-primary-foreground/90">14 months</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-secondary font-semibold shrink-0">Stack:</div>
              <div className="text-primary-foreground/90">
                React, Next.js, TypeScript, TailwindCSS, PostgreSQL, REST APIs, PDF Generation
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-secondary font-semibold shrink-0">Architecture:</div>
              <div className="text-primary-foreground/90">
                Product-led fullstack platform, desktop-first, responsive, mobile-ready
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-secondary font-semibold shrink-0">Scale:</div>
              <div className="text-primary-foreground/90">35,000+ registered users</div>
            </div>
            <div className="flex items-start gap-3 md:col-span-2">
              <div className="text-secondary font-semibold shrink-0">Domain:</div>
              <div className="text-primary-foreground/90">
                Civic Tech, B2C and B2B SaaS, Complex Forms, Document Generation
              </div>
            </div>
            <div className="flex items-start gap-3 md:col-span-2">
              <div className="text-secondary font-semibold shrink-0">Outcome:</div>
              <div className="text-primary-foreground/90">
                Up to 99% cost reduction vs. broker fees, 6 verified recognitions
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid md:grid-cols-3 gap-6 mt-16"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-secondary/20">
              <Code2 className="w-8 h-8 text-secondary mb-4" />
              <div className="text-lg font-semibold mb-2">Product Design Systems</div>
              <div className="text-sm text-primary-foreground/80">
                Converted complex government and legal documentation into guided, user-friendly
                digital workflows
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-secondary/20">
              <Layers className="w-8 h-8 text-secondary mb-4" />
              <div className="text-lg font-semibold mb-2">Fullstack Workflow Architecture</div>
              <div className="text-sm text-primary-foreground/80">
                Built form, validation, API, data, and document-generation systems that worked
                together across multiple user types
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-secondary/20">
              <Zap className="w-8 h-8 text-secondary mb-4" />
              <div className="text-lg font-semibold mb-2">Desktop-First SaaS Platform</div>
              <div className="text-sm text-primary-foreground/80">
                Designed for long-form document accuracy while keeping the system responsive and
                mobile-ready
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
