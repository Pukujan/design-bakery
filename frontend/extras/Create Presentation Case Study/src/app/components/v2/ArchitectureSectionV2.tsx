import { motion } from "motion/react";
import { Boxes, Layers } from "lucide-react";

export function ArchitectureSectionV2() {
  const systemComponents = [
    "UI components",
    "Form state",
    "Validation rules",
    "API communication",
    "User roles",
    "Document templates",
    "PDF output logic",
    "Saved user and business records",
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
            <Boxes className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Fullstack System Design</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-8"
          >
            <p className="text-xl text-gray-700 leading-relaxed">
              Ekagajpatra required close coordination between product design, frontend state,
              backend data, validation logic, and document generation, because government and legal
              forms are not static web pages. They evolve with regulation, vary by jurisdiction, and
              must be completed correctly the first time by users who cannot afford rework or repeated
              visits to offices far from their homes.
            </p>

            <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <Layers className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">The system separated:</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {systemComponents.map((component, index) => (
                  <motion.div
                    key={component}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.05 * index, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 shrink-0" />
                    <span className="text-lg text-gray-700">{component}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-primary text-primary-foreground rounded-lg p-8 border-l-4 border-secondary">
              <p className="text-xl leading-relaxed">
                This structure made the platform{" "}
                <span className="font-semibold text-secondary">easier to maintain</span> as new
                document types, user flows, and professional features were added, without forcing
                low-literacy users to relearn the interface each time a form changed.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
