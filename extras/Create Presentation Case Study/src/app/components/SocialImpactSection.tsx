import { motion } from "motion/react";
import { UserX, BookOpen, Building, Heart } from "lucide-react";

export function SocialImpactSection() {
  const impacts = [
    {
      icon: UserX,
      title: "Reduced dependency on exploitative brokers",
      description: "Eliminated the need for costly middlemen"
    },
    {
      icon: BookOpen,
      title: "Empowered low-literacy users",
      description: "Via accessible design and tutorials"
    },
    {
      icon: Building,
      title: "Enabled small businesses",
      description: "To stay compliant affordably"
    },
    {
      icon: Heart,
      title: "Created a trust ecosystem",
      description: "Where trust became the core UX metric"
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
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🌍</span>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Social & Economic Impact</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {impacts.map((impact, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20 hover:shadow-lg transition-all"
              >
                <impact.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">{impact.title}</h3>
                <p className="text-gray-700">{impact.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
