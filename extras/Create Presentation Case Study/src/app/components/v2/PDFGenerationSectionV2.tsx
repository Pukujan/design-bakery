import { motion } from "motion/react";
import { FileText, CheckSquare, AlertTriangle, FileCheck, MapPin } from "lucide-react";

export function PDFGenerationSectionV2() {
  const pdfSystemFeatures = [
    {
      icon: FileText,
      title: "Structured user input into templates"
    },
    {
      icon: AlertTriangle,
      title: "Blocked output when required data was missing"
    },
    {
      icon: CheckSquare,
      title: "Reduced manual document preparation"
    },
    {
      icon: FileCheck,
      title: "Generated PDFs accepted by government offices, legal firms, and financial institutions"
    },
    {
      icon: MapPin,
      title: "Created repeatable document workflows for individuals and consultants"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground">
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
            <FileText className="w-10 h-10 text-secondary" />
            <h2 className="text-4xl md:text-5xl font-bold">PDF and Document Generation</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl leading-relaxed text-primary-foreground/95 mb-12"
          >
            Document generation was one of the most important parts of the system.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="text-xl leading-relaxed text-primary-foreground/95 mb-12"
          >
            The platform converted structured user input into standardized, submission-ready PDF documents. Before a document could be generated, the system checked required fields, validation status, and completion state.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-secondary/20 mb-8"
          >
            <h3 className="text-2xl font-bold mb-6 text-secondary">The document generation workflow:</h3>
            <div className="space-y-4">
              {pdfSystemFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <feature.icon className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                  <p className="text-lg leading-relaxed text-primary-foreground/90">{feature.title}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-secondary/20 backdrop-blur-sm rounded-lg p-8 border-l-4 border-secondary"
          >
            <p className="text-xl leading-relaxed text-primary-foreground font-medium">
              This made document generation a <span className="text-secondary">fullstack product problem</span>, not just a frontend feature.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
