/**
 * Static engineering content defaults (shared by default + LWE portfolios).
 * Kept separate from adminContentService to avoid circular imports with portfolioDefaults.
 */

import type {
  EngineeringHeroContent,
  EngineeringAboutContent,
  EngineeringSkillsMeta,
  RelevantExperienceContent,
} from './adminContentService';

export const ENGINEERING_HERO_DEFAULT: EngineeringHeroContent = {
  badge: 'DESIGNER-ENGINEER / FULL-STACK DEVELOPER',
  titleLine1: '0→1 and 1→+',
  titleLine2: 'Design-led engineering with end-to-end ownership',
  description:
    'Design-Engineer and Full-Stack Developer who takes products from early concept to production and beyond. I combine product design, frontend architecture, supporting backend APIs, and AI-enabled workflows to build scalable systems used by real users.',
  primaryCtaLabel: 'View Engineering Projects',
  stats: [
    { label: 'Users Served', value: '35,000+' },
    { label: 'Cost Reduction', value: '99%' },
    { label: 'Awards Won', value: '5' },
  ],
};

export const ENGINEERING_ABOUT_DEFAULT: EngineeringAboutContent = {
  headingLeft: 'ABOUT',
  headingRight: 'ME',
  portraitUrl: 'https://i.imgur.com/umGE4Kd.jpeg',
  roleTitle: 'Designer-Engineer / Full-Stack Developer',
  paragraphs: [
    'I work at the intersection of design and engineering, owning products end-to-end as they move from idea to execution and scale.',
    'From 0→1, I focus on product design, UX, and frontend architecture to turn ambiguous problems into usable systems.',
    'From 1→+, I strengthen those systems through backend integration, reliability improvements, and AI-enabled workflows.',
  ],
  highlights: [
    {
      icon: 'Code',
      title: 'Systems Engineering',
      desc: 'Building reliable systems for complex domains',
      color: '#4169E1',
    },
    {
      icon: 'Shield',
      title: 'Data Correctness',
      desc: 'Validation, error handling, and user trust',
      color: '#9B6DD6',
    },
    {
      icon: 'Zap',
      title: 'Cross-functional Collaboration',
      desc: 'Working with backend engineers, legal experts, and product teams',
      color: '#FF8C42',
    },
  ],
  callout:
    'Every system I build combines product design, frontend architecture, supporting backend APIs, and AI-enabled workflows - written with reliability, maintainability, and real-world impact in mind.',
};

export const ENGINEERING_SKILLS_META_DEFAULT: EngineeringSkillsMeta = {
  headingLeft: 'SKILLS',
  headingMiddle: '&',
  headingRight: 'TECHNOLOGIES',
};

export const RELEVANT_EXPERIENCE_DEFAULT: RelevantExperienceContent = {
  headingLeft: 'RELEVANT',
  headingRight: 'EXPERIENCE',
  subtitle: 'A journey of building, learning, and creating impact across design and engineering',
  resumeButtonLabel: 'Download My Resume',
  experiences: [
    {
      id: 1,
      company: 'Women Devs SG',
      role: 'Volunteer Advocate — Engineering & Product Enablement',
      period: '2024 - Present',
      location: 'Singapore',
      icon: 'Users',
      color: '#A8C5FF',
      accentColor: '#8EA7FF',
      collapsedSummary:
        'Supporting women in tech through engineering mentorship, product thinking, and AI enablement. Working with participants to understand real-world product development and system thinking.',
      expandedSummary:
        'Contributed as a volunteer advocate supporting women in technology through engineering mentorship, product thinking, and AI enablement. Work focused on helping participants understand real-world product development, engineering workflows, and system thinking.',
      highlights: [
        'Creating technical and product-focused presentation decks for workshops',
        'Co-developing mentorship handbooks and community guidance materials',
        'Supporting programs across engineering mentorship, product ownership, AI enablement, and leadership development',
        'Collaborating with mentors, engineers, and organizers to scale community impact',
      ],
      tags: ['Mentorship', 'Community', 'Product', 'Engineering', 'AI'],
    },
    {
      id: 2,
      company: 'TAILORU Collective',
      role: 'AI Engineering Research · Product Ownership',
      period: '2024 - Present',
      location: 'Singapore',
      icon: 'Lightbulb',
      color: '#B5A8FF',
      accentColor: '#9B8AFF',
      collapsedSummary:
        'Research and advisory work focused on AI-enabled product development and system ownership. Supporting teams in translating business problems into practical, scalable product workflows.',
      expandedSummary:
        'Research and advisory work focused on AI-enabled product development and system ownership. Supporting teams in translating business problems into practical, scalable product workflows using AI as an enabling layer.',
      highlights: [
        'Researched and prototyped agentic AI architectures for full-stack SaaS products',
        'Designed and built end-to-end experimental systems (frontend, backend, data, and AI orchestration)',
        'Explored multi-agent orchestration patterns, task decomposition, and RAG pipelines',
        'Led 0 → 1 MVP builds and evaluated paths from MVP to production-ready AI systems',
        'Facilitated co-building sessions with teams to learn through real project constraints',
      ],
      tags: ['AI', 'Research', 'Full-Stack', 'Product', 'Architecture'],
    },
    {
      id: 3,
      company: 'Design Baker',
      role: 'Founder · Full-Stack Designer-Engineer',
      period: '2023 - Present',
      location: 'Singapore',
      icon: 'Rocket',
      color: '#A8FFD4',
      accentColor: '#8EFFBE',
      collapsedSummary:
        'Building a multi-disciplinary portfolio showcasing design, engineering, and advocacy work. Combining product design, full-stack development, and AI-enabled workflows.',
      expandedSummary:
        'Building a comprehensive portfolio that brings together design, engineering, and community advocacy. Combining product design, full-stack development, and AI-enabled workflows to create systems with real-world impact.',
      highlights: [
        'Designed and built responsive, accessible web experiences from concept to deployment',
        'Integrated AI-powered features to enhance user experiences and streamline workflows',
        'Managed full product lifecycle from design conception through deployment and iteration',
        'Created dynamic content management with Firestore integration for seamless updates',
        'Built admin dashboards for non-technical content management and real-time editing',
      ],
      tags: ['Design', 'Full-Stack', 'React', 'TypeScript', 'Firestore', 'UX'],
    },
  ],
};
