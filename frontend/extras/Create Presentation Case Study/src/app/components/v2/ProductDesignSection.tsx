import { motion } from "motion/react";
import { Palette, Layers, CheckCircle } from "lucide-react";

export function ProductDesignSection() {
  const designPoints = [
    "Clear visual hierarchy and single-pathway flows for digitally adverse audiences",
    "Step-by-step form progression with visual hints and icons",
    "Romanized Nepali input: real-time English → Nepali transliteration",
    "Video-guided lawyer tutorials embedded in each flow",
    "One-click legal partner consultation on every form",
    "Contextual guidance and tooltips for unfamiliar legal terminology",
    "Desktop-first review with mobile-responsive layouts",
    "Transparent fixed pricing (90%+ below broker fees)",
    "Separate partner onboarding for legal consultants and B2B SaaS partners"
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-12"
          >
            <Palette className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Product Design and UX Strategy</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-8"
          >
            <p className="text-xl text-gray-700 leading-relaxed">
              The product design challenge was to make complex documentation feel manageable and trustworthy for users who had been exploited by brokers.
            </p>

            <p className="text-xl text-gray-700 leading-relaxed">
              Research showed that simplicity and emotional reassurance were as important as feature completeness. I turned multi-page legal forms into guided experiences: romanized Nepali typing, video tutorials, one-click expert help, and plain-language explanations at the moment concepts appeared, not upfront walls of jargon.
            </p>

            <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-lg">
                  <Layers className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-primary">Product Experience Designed Around:</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {designPoints.map((point, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{point}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-primary text-primary-foreground rounded-lg p-8 border-l-4 border-secondary">
              <p className="text-xl leading-relaxed">
                The goal was to make the product feel <span className="font-semibold text-secondary">less like a government form</span> and more like a <span className="font-semibold text-secondary">guided operating system for documentation</span>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
