import { motion } from "motion/react";
import { Database, GitMerge, Save, FileStack } from "lucide-react";

export function DataIntegrationSectionV2() {
  const apiContracts = [
    "Saving form progress",
    "Retrieving user and business records",
    "Submitting structured form data",
    "Handling consultant and business workflows",
    "Supporting reusable document templates",
    "Managing subscription-based access",
  ];

  return (
    <section className="py-24 bg-gray-50">
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
            <Database className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Backend and Data Integration</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-8"
          >
            <p className="text-xl text-gray-700 leading-relaxed">
              The platform integrated frontend workflows with backend APIs and PostgreSQL-backed data
              models.
            </p>

            <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <GitMerge className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">I collaborated on API contracts for:</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {apiContracts.map((contract, index) => (
                  <motion.div
                    key={contract}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * index, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                    <span className="text-lg text-gray-700">{contract}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 border-l-4 border-secondary">
              <div className="flex items-start gap-4 mb-4">
                <FileStack className="w-8 h-8 text-secondary shrink-0" />
                <p className="text-xl text-gray-700 leading-relaxed">
                  The data model needed to support multi-layered, tabular, and reusable information
                  because government and legal documents often required repeated parties, business
                  details, addresses, dates, and supporting fields. For a user filling out multiple
                  forms for the same business or family member, reusing stored data meant fewer
                  opportunities to make errors and less exposure to confusing re-entry, critical for
                  users who struggle with typing and form navigation.
                </p>
              </div>
            </div>

            <div className="bg-primary text-primary-foreground rounded-lg p-8">
              <div className="flex items-start gap-4">
                <Save className="w-8 h-8 text-secondary shrink-0" />
                <p className="text-xl leading-relaxed text-primary-foreground/95">
                  The system was designed so that user input could move cleanly from{" "}
                  <span className="font-semibold text-secondary">form state</span> to{" "}
                  <span className="font-semibold text-secondary">backend storage</span> to{" "}
                  <span className="font-semibold text-secondary">PDF output</span>, preserving
                  accuracy across unreliable network conditions.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
