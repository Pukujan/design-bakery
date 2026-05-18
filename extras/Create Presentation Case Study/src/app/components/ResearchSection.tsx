import { motion } from "motion/react";
import { BarChart3, TrendingDown, Users } from "lucide-react";

export function ResearchSection() {
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
            <span className="text-4xl">🔍</span>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Research Insights</h2>
          </div>

          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            My design decisions were grounded in multi-layered research:
          </p>

          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-primary mb-3 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6" />
                    Socio-Economic & Demographic Analysis
                  </h3>
                  <p className="text-gray-700 text-lg">
                    Mapped literacy, income, and digital access patterns to define user personas.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-2xl p-8 border border-secondary/30"
            >
              <div className="flex items-start gap-4">
                <div className="bg-secondary text-secondary-foreground rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-primary mb-3 flex items-center gap-2">
                    <TrendingDown className="w-6 h-6" />
                    Market & Broker Analysis
                  </h3>
                  <p className="text-gray-700 text-lg mb-3">
                    Uncovered cost manipulation (10–20× markup) and legal risk from unregistered agents.
                  </p>
                  <div className="inline-block bg-white/70 px-4 py-2 rounded-lg border border-gray-300">
                    <p className="text-sm text-gray-600 italic">Source: User Research & Market Survey 2023</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-primary mb-3 flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Behavioral & Digital Research
                  </h3>
                  <p className="text-gray-700 text-lg">
                    Observed rising interest in online platforms in youth-led and community website platforms as well as working class-demography for websites such as Facebook marketplace & Hamrobazaar (top website of 2021 in Nepal according to many sources).
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 bg-secondary/10 border-l-4 border-secondary rounded-r-xl p-8"
          >
            <p className="text-xl font-semibold text-primary mb-2">Key Insight:</p>
            <p className="text-lg text-gray-700 italic leading-relaxed">
              "Simplicity and ease of use were as vital as trust — people needed to feel good and taken care of when using something to build trust in the platform."
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
