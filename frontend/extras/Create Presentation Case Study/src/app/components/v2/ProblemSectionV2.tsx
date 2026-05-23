import { motion } from "motion/react";
import { AlertCircle, Users, Building2, FileText, DollarSign, Wifi, Target } from "lucide-react";

export function ProblemSectionV2() {
  const challenges = [
    {
      icon: Users,
      title: "Informal broker dependency",
      description: "Individuals relied on informal brokers for form completion"
    },
    {
      icon: Building2,
      title: "Business documentation burden",
      description: "Businesses struggled with recurring administrative documentation"
    },
    {
      icon: FileText,
      title: "Disconnected consultant systems",
      description: "Legal and financial consultants used manual or disconnected systems"
    },
    {
      icon: AlertCircle,
      title: "Late error discovery",
      description: "Errors were discovered late and required costly rework"
    },
    {
      icon: Wifi,
      title: "Variable digital access",
      description: "Digital literacy and internet reliability varied significantly"
    }
  ];

  const engineeringGoals = [
    "Support multiple user types with different needs",
    "Guide users through complex workflows",
    "Validate inputs early and clearly",
    "Generate accurate, submission-ready PDF documents",
    "Scale across consumer and professional use cases"
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
            <AlertCircle className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Problem</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-700 mb-10"
          >
            Documentation workflows in Nepal were expensive, fragmented, and difficult to navigate.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-xl text-gray-700 mb-10"
          >
            Users often depended on informal brokers to complete forms. Businesses had recurring documentation needs but lacked organized digital tools. Legal and financial consultants worked through manual or disconnected systems. Errors were often discovered late, leading to costly rework.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {challenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
              >
                <challenge.icon className="w-8 h-8 text-secondary mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{challenge.title}</h3>
                <p className="text-gray-600">{challenge.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-primary text-primary-foreground rounded-lg p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-secondary" />
              <h3 className="text-2xl font-bold">From a product and engineering perspective:</h3>
            </div>
            <p className="text-lg leading-relaxed text-primary-foreground/95">
              The challenge was not just to digitize forms. The real challenge was to design a system that could guide different users through complex workflows, validate information early, generate reliable documents, and scale across consumer and professional use cases.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
