import { motion } from "motion/react";
import { Building2, LayoutDashboard, Users, FileText, CreditCard, Lock, RefreshCw, TrendingUp } from "lucide-react";

export function B2BSaaSSectionV2() {
  const supportedFeatures = [
    {
      icon: Building2,
      text: "Business accounts"
    },
    {
      icon: Users,
      text: "Consultant workflows"
    },
    {
      icon: CreditCard,
      text: "Paid professional features"
    },
    {
      icon: RefreshCw,
      text: "Reusable form structures"
    },
    {
      icon: Lock,
      text: "Role-based access patterns"
    },
    {
      icon: FileText,
      text: "Separation between free public workflows and paid features"
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <Building2 className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">B2B SaaS and Consultant Workflows</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-700 mb-12 leading-relaxed"
          >
            Ekagajpatra served both individual users and professional users.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-xl text-gray-700 mb-12 leading-relaxed"
          >
            For businesses and consultants, I helped design dashboard-based workflows that supported recurring documentation needs, multiple client records, reusable templates, and professional document generation.
          </motion.p>

          {/* Business and Consultant Dashboards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <LayoutDashboard className="w-10 h-10 text-secondary" />
              <h3 className="text-2xl font-bold text-primary">The SaaS layer supported:</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {supportedFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <feature.icon className="w-5 h-5 text-secondary mt-1 flex-shrink-0" />
                  <p className="text-gray-700 leading-relaxed">{feature.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Impact Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-primary text-primary-foreground rounded-lg p-8 border-l-4 border-secondary"
          >
            <div className="flex items-start gap-4">
              <TrendingUp className="w-10 h-10 text-secondary flex-shrink-0" />
              <p className="text-xl leading-relaxed text-primary-foreground/95">
                This helped the platform move beyond a consumer form tool into a <span className="font-semibold text-secondary">scalable civic-tech SaaS product</span>.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
