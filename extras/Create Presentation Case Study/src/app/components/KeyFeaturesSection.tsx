import { motion } from "motion/react";
import { ListChecks, Languages, Video, DollarSign, Building2 } from "lucide-react";

export function KeyFeaturesSection() {
  const features = [
    {
      icon: ListChecks,
      title: "Step-by-Step Form Guidance",
      description: "Translated complex forms into simple stages"
    },
    {
      icon: Languages,
      title: "Romanized Input Tool",
      description: "Real-time English → Nepali transliteration"
    },
    {
      icon: Video,
      title: "Video-Based Legal Support",
      description: "Affordable expert guidance"
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing System",
      description: "Fixed fees 90% lower than brokers"
    },
    {
      icon: Building2,
      title: "Scalable B2B Model",
      description: "Enabled sustainability and free forms for partners"
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
            <span className="text-4xl">💡</span>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Key Features</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20 hover:shadow-lg hover:border-primary/40 transition-all"
              >
                <div className="bg-primary text-primary-foreground rounded-lg w-14 h-14 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
