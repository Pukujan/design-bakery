import { motion } from "motion/react";
import { TrendingUp, Users, DollarSign, MapPin, Award, Banknote } from "lucide-react";

export function ImpactSectionV2() {
  const impacts = [
    {
      icon: Users,
      metric: "35,000+",
      description: "users served across urban and rural regions"
    },
    {
      icon: DollarSign,
      metric: "Up to 99%",
      description: "cost reduction compared to broker-based systems"
    },
    {
      icon: MapPin,
      metric: "Nationwide",
      description: "adoption by individuals and businesses"
    },
    {
      icon: Award,
      metric: "5 Awards",
      description: "national & international awards, including Nepal's National ICT Award"
    },
    {
      icon: Banknote,
      metric: "$100,000+",
      description: "raised through grants and awards supporting sustainability"
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
            <TrendingUp className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Impact & Scale</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {impacts.map((impact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <impact.icon className="w-12 h-12 text-secondary mb-6" />
                <div className="text-4xl font-bold mb-3 text-secondary">{impact.metric}</div>
                <p className="text-primary-foreground/90 leading-relaxed">{impact.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
