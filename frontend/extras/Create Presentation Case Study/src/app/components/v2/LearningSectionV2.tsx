import { motion } from "motion/react";
import { Lightbulb, Users, Monitor, CheckCircle, FileCheck, Layers, Database, Award } from "lucide-react";

export function LearningSectionV2() {
  const learnings = [
    {
      icon: Users,
      text: "Research = design: socio-economic and market insights should shape product structure, not just visuals",
    },
    {
      icon: CheckCircle,
      text: "Trust = UX: in civic-tech, credibility and feeling taken care of are usability requirements",
    },
    {
      icon: FileCheck,
      text: "Accessibility = innovation: romanized input, video guidance, and plain language can be transformative",
    },
    {
      icon: Layers,
      text: "Sustainability = design strategy: affordability and B2B partner models must be designed into the system",
    },
    {
      icon: Users,
      text: "Fullstack product engineering requires understanding the user journey, not just the codebase",
    },
    {
      icon: CheckCircle,
      text: "Complex forms work better as guided workflows than static digital documents",
    },
    {
      icon: FileCheck,
      text: "Frontend systems are responsible for data correctness, not just presentation",
    },
    {
      icon: Layers,
      text: "Product design decisions shape backend and data requirements",
    },
    {
      icon: Database,
      text: "Document generation is a core workflow architecture problem",
    },
    {
      icon: Monitor,
      text: "Desktop-first design can still support responsive mobile access when the component system is intentional",
    },
    {
      icon: Users,
      text: "Multi-role SaaS platforms need clear separation of workflows, permissions, and user intent",
    },
    {
      icon: Award,
      text: "Awards validate potential, not proven impact: recognition came before sustained user outcomes were measured",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
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
            <Lightbulb className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Key Learnings</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {learnings.map((learning, index) => (
              <motion.div
                key={learning.text}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * index, duration: 0.5 }}
                className="bg-white rounded-lg p-8 shadow-sm border-l-4 border-secondary hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-secondary/10 p-3 rounded-lg shrink-0">
                    <learning.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed pt-2">{learning.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
