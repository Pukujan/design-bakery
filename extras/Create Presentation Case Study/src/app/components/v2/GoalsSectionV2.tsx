import { motion } from "motion/react";
import { Target, Users, GitBranch, Monitor, Gauge, FileCheck, CreditCard, TrendingUp } from "lucide-react";

export function GoalsSectionV2() {
  const goals = [
    {
      icon: Users,
      title: "Unified platform",
      description: "Build one platform for individual, business, and consultant workflows"
    },
    {
      icon: GitBranch,
      title: "Digital journeys",
      description: "Translate complex paper-based processes into structured digital journeys"
    },
    {
      icon: Monitor,
      title: "Desktop-first interface",
      description: "Design a desktop-first interface optimized for accuracy and long-form review"
    },
    {
      icon: Gauge,
      title: "Reusable architecture",
      description: "Create a reusable component and form architecture"
    },
    {
      icon: FileCheck,
      title: "Real-time validation",
      description: "Support real-time validation, error handling, and guided completion"
    },
    {
      icon: FileCheck,
      title: "PDF generation",
      description: "Generate accurate, submission-ready PDF documents"
    },
    {
      icon: CreditCard,
      title: "SaaS features",
      description: "Support paid SaaS features for businesses and consultants"
    },
    {
      icon: Users,
      title: "Accessibility",
      description: "Keep the system accessible for users with different levels of digital literacy"
    },
    {
      icon: TrendingUp,
      title: "Scalable platform",
      description: "Design the platform to scale technically, commercially, and socially"
    }
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
            <Target className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Product and Engineering Goals</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {goals.map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="bg-gray-50 rounded-lg p-8 border-l-4 border-secondary hover:shadow-lg transition-shadow duration-300"
              >
                <goal.icon className="w-10 h-10 text-secondary mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-3">{goal.title}</h3>
                <p className="text-gray-700 leading-relaxed">{goal.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
