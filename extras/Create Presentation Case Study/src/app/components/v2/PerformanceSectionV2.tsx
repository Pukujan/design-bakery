import { motion } from "motion/react";
import { Gauge, Monitor, Smartphone, Shield, CheckCircle } from "lucide-react";

export function PerformanceSectionV2() {
  const considerations = [
    "Low-bandwidth optimization",
    "Minimal unnecessary re-renders",
    "Clear validation feedback",
    "Accessible language",
    "Desktop-first layouts for document clarity",
    "Responsive access for mobile users",
    "Reliable saved progress",
    "Reduced risk of late-stage errors"
  ];

  return (
    <section className="py-24 bg-white">
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
            <Gauge className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Performance, Accessibility, and Reliability</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-8"
          >
            <p className="text-xl text-gray-700 leading-relaxed">
              The system was designed for real-world usage conditions.
            </p>

            <p className="text-xl text-gray-700 leading-relaxed">
              Many users had unreliable internet access, low digital literacy, or limited experience with online documentation systems. The product needed to be clear, stable, and forgiving.
            </p>

            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <Shield className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">Key considerations included:</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {considerations.map((consideration, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * index, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{consideration}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-primary text-primary-foreground rounded-lg p-8 border-l-4 border-secondary">
              <p className="text-xl leading-relaxed text-primary-foreground/95">
                Reliability and clarity were <span className="font-semibold text-secondary">more important than feature volume</span>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
