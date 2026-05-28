import { motion } from "motion/react";
import { BookOpen, Users, Building2, FileText, CreditCard } from "lucide-react";

export function OverviewSectionV2() {
  const userTypes = [
    { icon: Users, text: "Individual citizens" },
    { icon: Building2, text: "Small businesses" },
    { icon: FileText, text: "Legal consultants" },
    { icon: CreditCard, text: "Financial consultants" },
    { icon: Building2, text: "Subscription-based B2B users" },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <BookOpen className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Overview</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-6"
          >
            <p className="text-xl leading-relaxed text-gray-700">
              Ekagajpatra is a civic-tech platform built to make government, legal, and financial
              documentation accessible, affordable, and understandable for low-income and digitally
              underserved users across Nepal, serving{" "}
              <span className="font-semibold text-primary">35,000+ registered users</span> with
              platform fees near zero compared to broker fees documented at{" "}
              <span className="font-semibold text-primary">10-20x</span> legitimate costs.
            </p>

            <div className="w-24 h-1 bg-secondary my-8" />

            <p className="text-xl leading-relaxed text-gray-700">
              Over <span className="font-semibold text-primary">14 months</span> as lead product
              designer, I worked across{" "}
              <span className="font-semibold text-primary">
                socio-economic research, branding, UX/UI, marketing, and front-end implementation
              </span>
              , collaborating with engineering on a scalable platform that replaced fragmented,
              broker-driven workflows with guided digital journeys.
            </p>

            <div className="w-24 h-1 bg-secondary my-8" />

            <p className="text-xl leading-relaxed text-gray-700">The platform supported:</p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid md:grid-cols-2 gap-4 my-8"
            >
              {userTypes.map((type, index) => (
                <motion.div
                  key={type.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <type.icon className="w-6 h-6 text-secondary shrink-0" />
                  <span className="text-gray-700 font-medium">{type.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <p className="text-xl leading-relaxed text-gray-700">
              The system transformed paper-based documentation into{" "}
              <span className="font-semibold text-primary">
                guided, validated, and PDF-generated digital workflows
              </span>
              . It was designed <span className="font-semibold text-primary">desktop-first</span> for
              accuracy, review, and document visibility, while using responsive components that allowed
              mobile access without requiring separate codebases.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
