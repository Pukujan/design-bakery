import { motion } from "motion/react";
import { Trophy, Award, Star, Globe, Banknote } from "lucide-react";

export function AwardsSection() {
  const awards = [
    {
      icon: Trophy,
      title: "National ICT Award (Nepal)",
      description: "Presented by Rt. Hon. K.P. Sharma Oli, Prime Minister",
      highlight: true
    },
    {
      icon: Award,
      title: "Game Changer Startup Award 2024",
      description: "Australian Catholic University"
    },
    {
      icon: Star,
      title: "NAS IT Awards 2024",
      description: "First Runner-Up, Professional Category"
    },
    {
      icon: Globe,
      title: "Startup World Cup",
      description: "Global Top 4 – Pegasus Tech Ventures"
    },
    {
      icon: Banknote,
      title: "IEDI Subsidized Startup Fund",
      description: "Top 11/1658 – Government of Nepal"
    },
    {
      icon: Award,
      title: "NYEF Startup Awards 4.0",
      description: "Finalist"
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
            <span className="text-4xl">🏅</span>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Awards & Recognitions</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {awards.map((award, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`rounded-xl p-6 border transition-all ${
                  award.highlight 
                    ? 'bg-gradient-to-br from-secondary/20 to-secondary/10 border-secondary/40 shadow-lg' 
                    : 'bg-white border-gray-200 hover:border-primary/30 hover:shadow-md'
                }`}
              >
                <award.icon className={`w-10 h-10 mb-4 ${award.highlight ? 'text-secondary' : 'text-primary'}`} />
                <h3 className="text-lg font-semibold text-primary mb-2">{award.title}</h3>
                <p className="text-gray-600 text-sm">{award.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 text-center"
          >
            <div className="text-5xl font-bold text-secondary mb-2">$100,000+</div>
            <div className="text-xl">Raised in grants and awards</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
