import { motion } from "motion/react";
import { GitBranch, CheckCircle } from "lucide-react";

export function FormSystemsSectionV2() {
  const multiStepPoints = [
    "Converted complex government and legal forms into progressive, step-by-step flows",
    "Used controlled state to preserve progress and prevent data loss",
    "Reduced cognitive overload for first-time and low-literacy users"
  ];

  const validationPoints = [
    "Implemented real-time validation for required fields",
    "Displayed contextual error messages to guide corrections",
    "Used tooltips to explain unfamiliar legal and financial terminology",
    "Reduced submission errors through early and clear feedback"
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
            <GitBranch className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Form Systems and Validation Logic</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-8"
          >
            {/* Multi-Step Workflows */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="bg-gray-50 rounded-lg p-8 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <GitBranch className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">Guided Multi-Step Form Workflows</h3>
              </div>
              <ul className="space-y-3">
                {multiStepPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-lg leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Validation and Error Handling */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-gray-50 rounded-lg p-8 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">Field Validation and Error Handling</h3>
              </div>
              <ul className="space-y-3">
                {validationPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-lg leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
