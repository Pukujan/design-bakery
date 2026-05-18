import { motion } from "motion/react";
import { Briefcase, Lightbulb } from "lucide-react";

export function RoleSection() {
  const responsibilities = [
    "Led research, UX/UI, branding, and marketing design",
    "Designed accessible digital experiences for diverse literacy levels",
    "Created brand identity, visual system, and investor decks",
    "Led full stack development with Next.js, PostgreSQL, and advanced cybersecurity implementation",
    "Architected component-based design system and frontend infrastructure",
    "Collaborated with cross-functional teams on technical and design decisions"
  ];

  const learnings = [
    {
      title: "Research = Design",
      description: "Social and economic insights shape better products"
    },
    {
      title: "Trust = UX",
      description: "In civic-tech, credibility is usability"
    },
    {
      title: "Accessibility = Innovation",
      description: "Simplicity can be transformative"
    },
    {
      title: "Sustainability = Design Strategy",
      description: "Affordability must be built into the system"
    }
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
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">👤</span>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">My Role & Learnings</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mt-12">
            {/* Responsibilities */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-bold text-primary">Responsibilities</h3>
              </div>
              <ul className="space-y-4">
                {responsibilities.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex items-start gap-3 text-gray-700"
                  >
                    <span className="text-secondary mt-1 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Key Learnings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <Lightbulb className="w-8 h-8 text-primary" />
                <h3 className="text-2xl font-bold text-primary">Key Learnings</h3>
              </div>
              <div className="space-y-6">
                {learnings.map((learning, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="border-l-4 border-secondary pl-4"
                  >
                    <h4 className="font-semibold text-primary mb-1">{learning.title}</h4>
                    <p className="text-gray-600 text-sm">{learning.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}