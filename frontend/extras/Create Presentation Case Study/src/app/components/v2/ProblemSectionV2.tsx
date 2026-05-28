import { motion } from "motion/react";
import {
  AlertCircle,
  Users,
  Building2,
  FileText,
  DollarSign,
  Wifi,
  Target,
  BookOpen,
  MapPin,
  ShieldAlert,
  Newspaper,
  BarChart3,
} from "lucide-react";

export function ProblemSectionV2() {
  const challenges = [
    {
      icon: Users,
      title: "Informal broker dependency",
      description: "Individuals relied on informal brokers for form completion",
    },
    {
      icon: Building2,
      title: "Business documentation burden",
      description: "Businesses struggled with recurring administrative documentation",
    },
    {
      icon: FileText,
      title: "Disconnected consultant systems",
      description: "Legal and financial consultants used manual or disconnected systems",
    },
    {
      icon: AlertCircle,
      title: "Late error discovery",
      description: "Errors were discovered late and required costly rework",
    },
    {
      icon: Wifi,
      title: "Variable digital access",
      description: "Digital literacy and internet reliability varied significantly",
    },
    {
      icon: BookOpen,
      title: "Low literacy barriers",
      description:
        "Many users could not parse legal language or complete forms without intermediaries",
    },
    {
      icon: DollarSign,
      title: "Broker fee inflation",
      description:
        "Informal brokers charged 10-20x legitimate costs, pricing citizens out of compliance",
    },
    {
      icon: MapPin,
      title: "Geographic inequality",
      description:
        "Rural and semi-urban users lacked access to affordable, transparent documentation services",
    },
    {
      icon: ShieldAlert,
      title: "Trust deficit",
      description:
        "Opaque processes eroded confidence in both brokers and formal government channels",
    },
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
            <AlertCircle className="w-10 h-10 text-primary" />
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Problem</h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-700 mb-8"
          >
            In Nepal, government documentation was inaccessible for most citizens: low literacy and
            digital illiteracy, broker fees inflated 10-20x, geographic inequality, and a lack of
            transparency sustained a broker-driven black market.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.32, duration: 0.6 }}
            className="bg-white rounded-lg p-6 md:p-8 border-l-4 border-primary shadow-sm mb-8"
          >
            <div className="flex items-start gap-4">
              <BarChart3 className="w-8 h-8 text-secondary shrink-0" />
              <p className="text-lg text-gray-700 leading-relaxed">
                Nepal&apos;s digital literacy rate stands at just 31% (Nepal Rastra Bank Survey
                2022/23, reported in Rising Nepal Daily, June 2025; OnlineKhabar, February 2024).
                Broadband internet access reaches only 21.5% of rural households versus 45.7% in
                urban centers (National Census 2021, cited in Digital Rights Nepal, State of Digital
                Rights in Nepal 2022). With 15.1% of the population below the poverty line (Economic
                Survey 2022/23) and rural broadband access under a quarter of households, the most
                vulnerable citizens are effectively excluded from digital channels.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.34, duration: 0.6 }}
            className="bg-white rounded-lg p-6 md:p-8 border-l-4 border-secondary shadow-sm mb-10"
          >
            <div className="flex items-start gap-4">
              <Newspaper className="w-8 h-8 text-secondary shrink-0" />
              <p className="text-lg text-gray-700 leading-relaxed">
                A <span className="font-semibold text-primary">2025 Nepal News</span> investigation
                documented 300+ brokers operating openly at a single Kathmandu transport office,
                charging citizens Rs 500-7,000 for form-filling services that should be free,
                confirming the broker-driven black market our platform targeted remains active
                today. This sustained a system where users depended on informal brokers to complete
                forms, businesses faced recurring documentation burden without organized digital
                tools, and legal and financial consultants used manual or disconnected systems.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
          >
            {challenges.map((challenge, index) => (
              <motion.div
                key={challenge.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
              >
                <challenge.icon className="w-8 h-8 text-secondary mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{challenge.title}</h3>
                <p className="text-gray-600">{challenge.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-primary text-primary-foreground rounded-lg p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-secondary" />
              <h3 className="text-2xl font-bold">From a product and engineering perspective:</h3>
            </div>
            <p className="text-lg leading-relaxed text-primary-foreground/95">
              The challenge was not just to digitize forms. The real challenge was to design a system
              that could guide different users through complex workflows, validate information early,
              generate reliable documents, and scale across consumer and professional use cases.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
