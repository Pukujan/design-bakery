import { motion } from "motion/react";
import { TrendingUp, Users, DollarSign, MapPin, Award, Banknote } from "lucide-react";

const VERIFIED_RECOGNITIONS =
  "National ICT Innovation Award, NAS IT First Runner-Up, Startup World Cup Nepal regional Top 4, IEDI Top 11/1658, NYEF Finalist, Game Changer Startup Award 2024 (Australian Catholic University)";

export function ImpactSectionV2() {
  const impacts = [
    {
      icon: Users,
      metric: "35,000+",
      description: "registered users (internal metric, unverified by independent audit)",
    },
    {
      icon: DollarSign,
      metric: "Up to 99%",
      description: "cost reduction vs. maximum documented broker fees",
    },
    {
      icon: MapPin,
      metric: "Nationwide reach",
      description: "across urban and rural regions",
    },
    {
      icon: Award,
      metric: "6 Verified Recognitions",
      description: VERIFIED_RECOGNITIONS,
    },
    {
      icon: Banknote,
      metric: "$100,000+",
      description: "raised through grants and awards supporting sustainability",
    },
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
                key={impact.metric}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className={`bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-lg p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 ${
                  impact.metric === "6 Verified Recognitions" ? "md:col-span-2" : ""
                }`}
              >
                <impact.icon className="w-12 h-12 text-secondary mb-6" />
                <div className="text-3xl font-bold mb-3 text-secondary">{impact.metric}</div>
                <p className="text-primary-foreground/90 leading-relaxed">{impact.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-12 bg-gray-50 rounded-lg p-8 border border-gray-200"
          >
            <h3 className="text-2xl font-bold text-primary mb-4">Social & economic impact</h3>
            <ul className="grid md:grid-cols-2 gap-4 text-lg text-gray-700 list-disc list-inside">
              <li>Reduced dependency on exploitative brokers</li>
              <li>Empowered low-literacy users through accessible design and tutorials</li>
              <li>Enabled small businesses to stay compliant affordably</li>
              <li>Made trust a core UX metric, not an afterthought</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
