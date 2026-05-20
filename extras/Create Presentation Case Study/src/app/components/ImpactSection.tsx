import { motion } from "motion/react";
import { Users, TrendingDown, Award, MapPin, CheckCircle } from "lucide-react";

export function ImpactSection() {
  const metrics = [
    {
      icon: Users,
      metric: "35,000+",
      label: "Users Served",
      description: "Individuals and businesses"
    },
    {
      icon: TrendingDown,
      metric: "Up to 99%",
      label: "Cost Reduction",
      description: "Compared to broker fees"
    },
    {
      icon: Award,
      metric: "5",
      label: "Awards & Recognitions",
      description: "National & International Honors"
    },
    {
      icon: MapPin,
      metric: "Nationwide",
      label: "Reach",
      description: "Urban + Rural Regions across Nepal"
    },
    {
      icon: CheckCircle,
      metric: "100%",
      label: "Trust Built",
      description: "Verified legal documentation and transparent process"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">📊</span>
            <h2 className="text-4xl md:text-5xl font-bold">Impact</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {metrics.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 hover:bg-white/20 transition-all"
              >
                <item.icon className="w-12 h-12 text-secondary mb-4" />
                <div className="text-4xl font-bold text-secondary mb-2">{item.metric}</div>
                <div className="text-xl font-semibold mb-1">{item.label}</div>
                <div className="text-sm text-primary-foreground/70">{item.description}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
