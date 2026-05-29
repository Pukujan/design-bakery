import { useState } from "react";
import { motion } from "motion/react";
import { Award } from "lucide-react";

const AWARDS = [
  {
    title: "National ICT Innovation Award",
    image: "/images/case-studies/ekagajpatra/awards/ict-awards.png",
  },
  {
    title: "NAS IT First Runner-Up",
    image: "/images/case-studies/ekagajpatra/awards/nas-it.png",
  },
  {
    title: "IEDI Top 11/1658",
    image: "/images/case-studies/ekagajpatra/awards/iedi.png",
  },
  {
    title: "NYEF Finalist",
    image: "/images/case-studies/ekagajpatra/awards/nyef.png",
  },
  {
    title: "Game Changer Startup Award 2024",
    image: "/images/case-studies/ekagajpatra/awards/acu-game-changer-award.png",
  },
  {
    title: "Startup World Cup Nepal regional Top 4",
    image: "/images/case-studies/ekagajpatra/awards/startup-world-cup-placeholder.svg",
  },
] as const;

function AwardCard({
  award,
  index,
}: {
  award: (typeof AWARDS)[number];
  index: number;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.05 * index, duration: 0.5 }}
      className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm"
    >
      <div className="mb-4 flex min-h-[56px] w-full items-center justify-center">
        {logoFailed ? (
          <div
            className="flex h-14 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50"
            role="img"
            aria-label={`${award.title} logo unavailable`}
          >
            <Award className="h-6 w-6 text-gray-400" />
          </div>
        ) : (
          <img
            src={award.image}
            alt={`${award.title} logo`}
            loading="lazy"
            onError={() => setLogoFailed(true)}
            className="mx-auto max-h-14 w-auto max-w-full object-contain"
          />
        )}
      </div>
      <h3 className="text-sm font-semibold leading-snug text-gray-800">{award.title}</h3>
    </motion.article>
  );
}

export function AwardsRecognitionSectionV2() {
  return (
    <section className="py-16 bg-gray-50 border-y border-gray-200">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-3">
            <Award className="w-8 h-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-primary">Awards & Recognition</h2>
          </div>
          <p className="text-gray-600 mb-8 max-w-3xl">
            Ekagajpatra received recognition across civic-tech, startup, innovation, and
            entrepreneurship programs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {AWARDS.map((award, index) => (
              <AwardCard key={award.title} award={award} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
