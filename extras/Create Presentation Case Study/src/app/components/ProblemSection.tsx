import { motion } from "motion/react";
import { AlertCircle, TrendingUp, Map, ShieldAlert } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: AlertCircle,
      title: "Low literacy and digital illiteracy",
      description: "Many citizens struggled with both traditional and digital forms of documentation"
    },
    {
      icon: TrendingUp,
      title: "High legal and broker fees",
      description: "10–20× inflation making services unaffordable for most"
    },
    {
      icon: Map,
      title: "Geographical inequality",
      description: "Limited access for rural communities to government services"
    },
    {
      icon: ShieldAlert,
      title: "Lack of transparency and trust",
      description: "Informal systems created uncertainty and vulnerability"
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
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">❗</span>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">The Problem</h2>
          </div>

          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            In Nepal, government documentation was inaccessible for most citizens due to:
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <problem.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{problem.title}</h3>
                <p className="text-gray-600">{problem.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-6"
          >
            <p className="text-lg text-gray-800 leading-relaxed">
              These barriers created a <span className="font-semibold text-primary">broker-driven black market</span>, excluding thousands from legal participation and government opportunities.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
