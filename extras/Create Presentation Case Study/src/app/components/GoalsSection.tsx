import { motion } from "motion/react";
import { DollarSign, Users, Landmark, Shield, TrendingUp, Lightbulb } from "lucide-react";

export function GoalsSection() {
  const goals = [
    {
      icon: DollarSign,
      title: "Affordability",
      description: "Reduce costs by 90%+"
    },
    {
      icon: Users,
      title: "Accessibility",
      description: "Simplify language and visuals for low-literacy users"
    },
    {
      icon: Landmark,
      title: "Equity",
      description: "Reach rural and semi-urban citizens"
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "Eliminate informal brokers"
    },
    {
      icon: TrendingUp,
      title: "Scalability",
      description: "Create a sustainable B2B funding model"
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Build a brand new business platform that not just creates but also innovates"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🎯</span>
            <h2 className="text-4xl md:text-5xl font-bold">Goals</h2>
          </div>

          <p className="text-xl mb-12 text-primary-foreground/90 leading-relaxed max-w-4xl">
            Ekagajpatra aimed to replace that system with an affordable, legal, and user-friendly digital platform focused on:
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all border border-white/20"
              >
                <goal.icon className="w-12 h-12 text-secondary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{goal.title}</h3>
                <p className="text-primary-foreground/80">{goal.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
