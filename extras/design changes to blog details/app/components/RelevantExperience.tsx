import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, ChevronDown, Zap, Sparkles, ExternalLink, Download, Rocket, Target, TrendingUp, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Squiggle, Star, BlobShape } from './GraphicElements';
import { FlowerCharacter } from './FlowerCharacter';
import { Cupcake, Cookie } from './BakeryItems';

interface Experience {
  id: number;
  company: string;
  role: string;
  period: string;
  location: string;
  collapsedSummary: string;
  expandedSummary: string;
  highlights: string[];
  tags: string[];
}

const experienceData = {
  headingLeft: 'RELEVANT',
  headingRight: 'EXPERIENCE',
  subtitle:
    'A focused history of work across litigation operations, AI systems, workflow engineering, and product development.',
  experiences: [
    {
      id: 1,
      company: 'The Fitzgerald Law Firm',
      role: 'Litigation Operations / AI Systems Lead',
      period: 'Feb 2026 - Present',
      location: 'Yonkers, NY',
      collapsedSummary:
        'High-volume litigation operations with legal AI workflow research focused on docketing, court notices, procedural tracking, and workflow intelligence.',
      expandedSummary:
        'Work inside a litigation firm managing real operational workflows while researching and prototyping AI-powered systems for docketing, NYSCEF/court notice interpretation, TrialWorks workflows, judge/part rule lookup, incident logging, and procedural risk detection.',
      highlights: [
        'Monitor NYSCEF filings, court notices, TrialWorks calendars, and litigation deadlines',
        'Model litigation workflows using deterministic rules, incident logs, and human-in-the-loop safeguards',
        'Prototype legal AI systems for motion docketing, conference tracking, procedural risk detection, and legal operations intelligence',
      ],
      tags: [
        'Litigation Ops',
        'NYSCEF',
        'TrialWorks',
        'Docketing',
        'Legal AI',
        'Workflow Intelligence',
      ],
    },
    {
      id: 2,
      company: 'Nepasoft LLC',
      role: 'Data Annotation Associate & AI Orchestration Supervisor',
      period: 'Mar 2024 - Dec 2025',
      location: 'Remote',
      collapsedSummary:
        'AI orchestration and supervised data workflows across legal, healthcare, OCR, document processing, and compliance-oriented domains.',
      expandedSummary:
        'Supported AI systems across legal, healthcare, OCR, and document-heavy workflows, including legal AI research, RAG pipelines, prompt orchestration, document classification, validation workflows, and supervised annotation operations.',
      highlights: [
        'Worked on AI workflows involving court filings, legal documents, eDiscovery-style data, and compliance use cases',
        'Built and optimized RAG and prompt orchestration patterns for document analysis and procedural reasoning',
        'Supervised data workflows with attention to HIPAA, PII, privacy, and AI governance requirements',
      ],
      tags: [
        'AI Orchestration',
        'RAG',
        'Document AI',
        'Legal AI',
        'OCR',
        'Data Governance',
      ],
    },
    {
      id: 3,
      company: 'Ekagajpatra',
      role: 'Lead Product Designer / Full-Stack Developer',
      period: 'Feb 2023 - Apr 2024',
      location: 'Remote',
      collapsedSummary:
        'Built a civic-tech workflow platform serving 35,000+ users through guided documentation workflows, validation, dashboards, and PDF generation.',
      expandedSummary:
        'Led product design and full-stack development for a civic-tech platform that turned complex government documentation into accessible digital workflows for users and businesses.',
      highlights: [
        'Designed and engineered complex form workflows for document-heavy government processes',
        'Built user-facing dashboards, validation systems, and PDF/document generation flows',
        'Helped the platform win national and international recognition for civic-tech impact',
      ],
      tags: [
        'Workflow Systems',
        'PDF Generation',
        'Complex Forms',
        'Next.js',
        'PostgreSQL',
        'Product Engineering',
      ],
    },
    {
      id: 4,
      company: 'Kulchan Pvt. Ltd.',
      role: 'Solutions Engineer',
      period: 'Jun 2014 - Dec 2018',
      location: 'Kathmandu, Nepal',
      collapsedSummary:
        'Built 0-to-1 SaaS solutions for legal, financial, and business operations clients with dashboards, workflows, and custom automation.',
      expandedSummary:
        'Worked as a solutions engineer building early-stage SaaS systems for business, legal, and financial operations clients, translating client problems into working dashboards, workflows, and production applications.',
      highlights: [
        'Partnered with clients and stakeholders to define workflow and software requirements',
        'Built customer-facing dashboards and business process tools',
        'Delivered custom features and integrations for operational automation',
      ],
      tags: [
        'Solutions Engineering',
        'SaaS',
        'Dashboards',
        'Client Workflows',
        'React',
        'Node.js',
      ],
    },
  ] as Experience[],
};

const companyColors = ['#A8C5FF', '#B5A8FF', '#A8FFD4', '#FFB8E8'];
const companyGradients = [
  'linear-gradient(135deg, #A8C5FF 0%, #8EA7FF 100%)',
  'linear-gradient(135deg, #B5A8FF 0%, #9B8AFF 100%)',
  'linear-gradient(135deg, #A8FFD4 0%, #8EFFBE 100%)',
  'linear-gradient(135deg, #FFB8E8 0%, #FF9ED6 100%)',
];
const companyIcons = [Rocket, Target, TrendingUp, Heart];

export function RelevantExperience() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-blue-100 via-purple-100 to-green-100 dark:from-blue-950 dark:via-purple-950 dark:to-green-950 relative overflow-hidden">
      {/* Decorative Elements */}
      <BlobShape
        color="#A8C5FF"
        size={400}
        className="absolute -top-32 -right-40 opacity-20"
      />
      <BlobShape
        color="#B5A8FF"
        size={350}
        className="absolute bottom-20 -left-32 opacity-20"
      />
      <BlobShape
        color="#A8FFD4"
        size={300}
        className="absolute top-1/2 right-1/4 opacity-15"
      />

      {/* Floating Items */}
      <motion.div
        className="absolute top-32 right-32 hidden lg:block"
        animate={{ y: [0, -15] }}
        transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      >
        <Cupcake size={80} animate={false} />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-32 hidden lg:block"
        animate={{ y: [0, 20], rotate: [0, 5] }}
        transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      >
        <Cookie size={85} animate={false} />
      </motion.div>

      {/* Stars */}
      <motion.div
        className="absolute top-20 left-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <Star color="#A8C5FF" size={50} />
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-20"
        animate={{ rotate: -360, scale: [1, 1.2] }}
        transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      >
        <Star color="#B5A8FF" size={45} />
      </motion.div>

      {/* Flowers */}
      <div className="absolute top-40 left-10 hidden md:block">
        <FlowerCharacter color="#A8FFD4" size={70} animate />
      </div>
      <div className="absolute bottom-20 right-10 hidden md:block">
        <FlowerCharacter color="#FFB8E8" size={75} animate />
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
            <span className="text-blue-600 dark:text-blue-400">
              {experienceData.headingLeft}
            </span>{' '}
            <span className="text-purple-600 dark:text-purple-400">
              {experienceData.headingRight}
            </span>
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            {experienceData.subtitle}
          </p>
          <Squiggle color="#A8C5FF" className="mx-auto mb-6" />

          {/* Download Resume Button */}
          <motion.div
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => window.open('https://linkedin.com/in/yourprofile', '_blank')}
              className="px-8 py-4 border-5 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black font-black text-lg rounded-full"
              style={{ background: 'linear-gradient(135deg, #A8C5FF 0%, #B5A8FF 50%, #A8FFD4 100%)' }}
            >
              <Download className="w-5 h-5 mr-2" />
              Download Full Resume
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Experience Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {experienceData.experiences.map((experience, idx) => {
            const isExpanded = expandedId === experience.id;
            const color = companyColors[idx % companyColors.length];
            const gradient = companyGradients[idx % companyGradients.length];
            const IconComponent = companyIcons[idx % companyIcons.length];

            return (
              <motion.div
                key={experience.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={isExpanded ? 'md:col-span-2' : ''}
              >
                <Card className="p-6 md:p-8 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 relative overflow-hidden h-full">
                  {/* Color Bar with Gradient */}
                  <div
                    className="w-full h-4 rounded-full mb-6 border-3 border-black"
                    style={{ background: gradient }}
                  />

                  {/* Sparkle Decoration */}
                  <motion.div
                    className="absolute top-8 right-8"
                    animate={{ rotate: [0, 360], scale: [1, 1.3] }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                  >
                    <Zap className="w-10 h-10 opacity-20" style={{ color }} />
                  </motion.div>

                  {/* Header */}
                  <div className="flex flex-col gap-4 mb-4">
                    <div className="flex-1">
                      <motion.div
                        className="flex items-center gap-4 mb-3"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.div
                          className="p-3 rounded-2xl border-4 border-black"
                          style={{ background: gradient }}
                          animate={{ rotate: [0, 5], scale: [1, 1.05] }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        >
                          <IconComponent className="w-8 h-8 text-black" />
                        </motion.div>
                        <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-gray-100">
                          {experience.company}
                        </h3>
                      </motion.div>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 ml-1">
                        {experience.role}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 ml-1">
                        <motion.div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-gray-50 dark:bg-gray-800"
                          whileHover={{ scale: 1.08, y: -2 }}
                        >
                          <Calendar className="w-4 h-4" />
                          <span className="font-bold text-sm">{experience.period}</span>
                        </motion.div>
                        <motion.div
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-black bg-gray-50 dark:bg-gray-800"
                          whileHover={{ scale: 1.08, y: -2 }}
                        >
                          <MapPin className="w-4 h-4" />
                          <span className="font-bold text-sm">{experience.location}</span>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsed Summary */}
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-6">
                    {experience.collapsedSummary}
                  </p>

                  {/* Expand Button - Below and More Noticeable */}
                  <motion.div
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full"
                  >
                    <Button
                      onClick={() => toggleExpanded(experience.id)}
                      className="w-full px-6 py-5 border-5 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black font-black text-base rounded-2xl transition-all relative overflow-hidden"
                      style={{
                        background: gradient,
                      }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        animate={{ y: isExpanded ? [0, -3] : [0, 3] }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                        className="inline-block"
                      >
                        <ChevronDown
                          className={`w-6 h-6 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </motion.div>
                      <span className="mx-3 relative z-10">
                        {isExpanded ? 'Hide Details' : 'Show Full Details'}
                      </span>
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.3] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        className="inline-block"
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    </Button>
                  </motion.div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 border-t-4 border-black mt-6">
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-800 dark:text-gray-200 leading-relaxed text-base mb-6 font-medium"
                          >
                            {experience.expandedSummary}
                          </motion.p>

                          {/* Highlights */}
                          <div className="mb-6">
                            <motion.h4
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="text-xl font-black mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2"
                            >
                              <Sparkles className="w-5 h-5" style={{ color }} />
                              Key Highlights
                            </motion.h4>
                            <ul className="space-y-3">
                              {experience.highlights.map((highlight, hIdx) => (
                                <motion.li
                                  key={hIdx}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.4 + hIdx * 0.1 }}
                                  className="flex items-start gap-3 p-3 rounded-xl border-3 border-black bg-gray-50 dark:bg-gray-800"
                                  whileHover={{ x: 5, scale: 1.02 }}
                                >
                                  <motion.span
                                    className="font-bold mt-0.5 text-2xl"
                                    style={{ color }}
                                    animate={{ scale: [1, 1.2] }}
                                    transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                                  >
                                    ✦
                                  </motion.span>
                                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed flex-1 text-sm">
                                    {highlight}
                                  </span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2">
                            {experience.tags.map((tag, tIdx) => (
                              <motion.div
                                key={tIdx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.1, y: -2 }}
                                transition={{ delay: 0.6 + tIdx * 0.03 }}
                              >
                                <Badge
                                  className="border-3 border-black font-bold text-sm px-4 py-2"
                                  style={{
                                    background: gradient,
                                  }}
                                >
                                  {tag}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
