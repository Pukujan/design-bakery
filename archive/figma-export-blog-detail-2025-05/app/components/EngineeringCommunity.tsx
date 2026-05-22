import { motion } from 'motion/react';
import { ExternalLink, BookOpen, Lightbulb, Target, Cpu, Layers, GitBranch, Rocket, Users, Users2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Squiggle, Star, BlobShape } from './GraphicElements';
import { FlowerCharacter } from './FlowerCharacter';
import { IceCream, Croissant } from './BakeryItems';

export function EngineeringCommunity() {
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
            <span className="text-cyan-600 dark:text-cyan-400">COMMUNITY &</span>{' '}
            <span className="text-teal-600 dark:text-teal-400">ADVISORY</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Engineering mentorship, advocacy, and AI product enablement beyond commercial work
          </p>
          <Squiggle color="#14B8A6" className="mx-auto" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Women Devs SG */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Card className="h-full p-8 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900">
              <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-cyan-500">
                <Users className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-3xl font-black mb-3 text-gray-900 dark:text-gray-100">
                Women Devs SG
              </h3>

              <p className="text-lg text-cyan-600 dark:text-cyan-400 mb-6 font-bold">
                Volunteer Advocate — Engineering & Product Enablement
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                Contributed as a volunteer advocate supporting women in technology through engineering
                mentorship, product thinking, and AI enablement. Work focused on helping participants
                understand real-world product development, engineering workflows, and system thinking.
              </p>

              <div className="mb-6">
                <h4 className="text-sm font-bold mb-3 text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Key Contributions
                </h4>
                <ul className="space-y-3">
                  {[
                    { icon: BookOpen, text: 'Creating technical and product-focused presentation decks for workshops' },
                    { icon: Target, text: 'Co-developing mentorship handbooks and community guidance materials' },
                    { icon: Lightbulb, text: 'Supporting programs across engineering mentorship, product ownership, AI enablement, and leadership development' },
                    { icon: Users, text: 'Collaborating with mentors, engineers, and organizers to scale community impact' },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => window.open('https://www.linkedin.com/company/women-devs-sg/', '_blank')}
                    className="bg-cyan-600 mt-8 hover:bg-cyan-700 text-white px-8 py-6 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group w-full font-black"
                  >
                    Visit Women Devs SG
                    <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* TAILORU Collective */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Card className="h-full p-8 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900">
              <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-teal-500">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-3xl font-black mb-3 text-gray-900 dark:text-gray-100">
                TAILORU Collective
              </h3>
              <p className="text-lg text-teal-600 dark:text-teal-400 mb-6 font-bold">
                AI Engineering Research · Product Ownership
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                Research and advisory work focused on AI-enabled product development and system ownership.
                Supporting teams in translating business problems into practical, scalable product workflows
                using AI as an enabling layer.
              </p>

              <div className="mb-8">
                <h4 className="text-sm font-bold mb-3 text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Key Contributions — AI Engineering Researcher
                </h4>
                <ul className="space-y-3">
                  {[
                    { icon: Cpu, text: 'Researched and prototyped agentic AI architectures for full-stack SaaS products, focused on financial and civic-tech use cases' },
                    { icon: Layers, text: 'Designed and built end-to-end experimental systems (frontend, backend, data, and AI orchestration) to validate product feasibility' },
                    { icon: GitBranch, text: 'Explored multi-agent orchestration patterns, task decomposition, and RAG pipelines for complex business workflows' },
                    { icon: Rocket, text: 'Led 0 → 1 MVP builds and evaluated paths from MVP to production-ready AI systems' },
                    { icon: Users2, text: 'Facilitated hands-on co-building sessions with teams to learn through real project constraints, identify patterns, and overcome implementation challenges' },
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <item.icon className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => window.open('https://www.tailoru.studio/', '_blank')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group w-full font-black"
                >
                  Visit Tailoru Collective
                  <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
