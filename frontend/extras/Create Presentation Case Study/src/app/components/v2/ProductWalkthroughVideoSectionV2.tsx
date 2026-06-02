import { motion } from "motion/react";
import { PlayCircle } from "lucide-react";
import { EkagajpatraWalkthroughVideo } from "./EkagajpatraWalkthroughVideo";

export function ProductWalkthroughVideoSectionV2() {
  return (
    <section id="product-walkthrough" className="py-24 bg-gray-50 scroll-mt-6">
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
            <PlayCircle className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Product Walkthrough Video</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-xl text-gray-700 leading-relaxed mb-8"
          >
            This walkthrough shows how the shipped Ekagajpatra product guided users through service
            selection, payment, form completion, document preview, and dashboard access.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <EkagajpatraWalkthroughVideo className="rounded-3xl p-4 md:p-5 shadow-md" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-sm text-gray-600 leading-relaxed"
          >
            Original product walkthrough video from the Ekagajpatra website, created by the
            Ekagajpatra company team. English subtitles were added for portfolio review and
            international accessibility.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
