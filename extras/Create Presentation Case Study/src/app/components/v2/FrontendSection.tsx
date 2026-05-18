import { motion } from "motion/react";
import { Code, Monitor, Layers } from "lucide-react";

export function FrontendSection() {
  const componentTypes = [
    "Input fields",
    "Multi-step forms",
    "Progress indicators",
    "Validation states",
    "Error messages",
    "Tooltips",
    "Dashboard views",
    "Document preview flows"
  ];

  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-12"
          >
            <Code className="w-10 h-10 text-secondary" />
            <h2 className="text-4xl md:text-5xl font-bold">Frontend Engineering</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-8"
          >
            <p className="text-xl leading-relaxed text-primary-foreground/95">
              The frontend was built with <span className="font-semibold text-secondary">React, Next.js, TypeScript, and TailwindCSS</span>.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-secondary/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/20 p-3 rounded-lg">
                  <Layers className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold">I built a modular component system for:</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {componentTypes.map((component, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * index, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-lg text-primary-foreground/90">{component}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="text-xl leading-relaxed text-primary-foreground/95">
              The frontend handled complex form behavior, preserved user progress, surfaced missing information early, and prevented invalid document generation.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-secondary/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/20 p-3 rounded-lg">
                  <Monitor className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold">Desktop-First, Mobile-Ready</h3>
              </div>
              <p className="text-lg leading-relaxed text-primary-foreground/90">
                The architecture was <span className="font-semibold text-secondary">desktop-first</span> because users needed enough screen space to review long, detailed documentation. At the same time, <span className="font-semibold text-secondary">reusable responsive components</span> kept the platform mobile-ready without requiring separate mobile-specific workflows.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
