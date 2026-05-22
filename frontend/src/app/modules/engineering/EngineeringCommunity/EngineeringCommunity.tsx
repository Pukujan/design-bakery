import { motion } from 'motion/react';
import { ExternalLink, BookOpen, Lightbulb, Target, Cpu, Layers, GitBranch, Rocket, Users, Users2, Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Squiggle, Star, BlobShape } from '../../../components/GraphicElements';
import { FlowerCharacter } from '../../../components/FlowerCharacter';
import { IceCream, Croissant } from '../../../components/BakeryItems';
import { useEngineeringCommunitySection } from '../../../lib/contentHooks';

const iconMap = {
  BookOpen,
  Lightbulb,
  Target,
  Cpu,
  Layers,
  GitBranch,
  Rocket,
  Users,
  Users2,
  Sparkles,
} as const;

export function EngineeringCommunity() {
  const content = useEngineeringCommunitySection();

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-cyan-100 via-teal-100 to-emerald-100 dark:from-cyan-950 dark:via-teal-950 dark:to-emerald-950 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <BlobShape color="#06B6D4" size={450} className="absolute -top-40 -left-40 opacity-20" />
      <BlobShape color="#14B8A6" size={400} className="absolute bottom-20 -right-32 opacity-20" />
      <BlobShape color="#10B981" size={350} className="absolute top-1/2 left-1/3 opacity-15" />

      {/* Floating Elements */}
      <motion.div
        className="absolute top-40 right-32 hidden lg:block"
        animate={{ y: [0, -20, 0], rotate: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <IceCream size={90} animate={false} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 left-32 hidden lg:block"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <Croissant size={85} animate={false} />
      </motion.div>

      {/* Stars */}
      <motion.div
        className="absolute top-32 left-20"
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 18, repeat: Infinity }}
      >
        <Star color="#06B6D4" size={55} />
      </motion.div>

      <motion.div
        className="absolute bottom-40 right-20"
        animate={{ rotate: -360, y: [0, -15, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      >
        <Star color="#10B981" size={45} />
      </motion.div>

      {/* Flowers */}
      <div className="absolute top-20 left-10 hidden md:block">
        <FlowerCharacter color="#14B8A6" size={75} animate />
      </div>
      <div className="absolute bottom-20 right-10 hidden md:block">
        <FlowerCharacter color="#06B6D4" size={70} animate />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-4 font-black">
            <span className="text-cyan-600 dark:text-cyan-400">{content.headingLeft}</span>{' '}
            <span className="text-teal-600 dark:text-teal-400">{content.headingRight}</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            {content.subtitle}
          </p>
          <Squiggle color="#14B8A6" className="mx-auto" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {content.orgs.map((org, orgIndex) => {
            const OrgIcon = iconMap[org.icon as keyof typeof iconMap] ?? Users;
            return (
              <motion.div
                key={org.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: orgIndex * 0.2 }}
              >
                <Card className="h-full p-8 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900">
                  <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-cyan-500">
                    <OrgIcon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-3xl font-black mb-3 text-gray-900 dark:text-gray-100">
                    {org.name}
                  </h3>

                  <p className="text-lg text-cyan-600 dark:text-cyan-400 mb-6 font-bold">
                    {org.role}
                  </p>

                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    {org.description}
                  </p>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold mb-3 text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                      {org.contributionsHeading}
                    </h4>
                    <ul className="space-y-3">
                      {org.contributions.map((item, idx) => {
                        const ContributionIcon = iconMap[item.icon as keyof typeof iconMap] ?? Sparkles;
                        return (
                          <li key={idx} className="flex items-start gap-3">
                            <ContributionIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => window.open(org.buttonUrl, '_blank')}
                        className={`${org.buttonColorClass} mt-8 text-white px-8 py-6 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group w-full font-black`}
                      >
                        {org.buttonLabel}
                        <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
