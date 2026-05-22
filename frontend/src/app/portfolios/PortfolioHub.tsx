import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { BlobShape, Star } from '../components/GraphicElements';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { HUB_DESTINATIONS } from './hubDestinations';

export function PortfolioHub() {
  return (
    <motion.div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950">
      <BlobShape color="#4169E1" size={320} className="absolute -left-24 top-16 opacity-20" />
      <BlobShape color="#9B6DD6" size={260} className="absolute -right-16 bottom-24 opacity-25" />
      <BlobShape color="#FFD93D" size={180} className="absolute right-1/4 top-1/3 opacity-15" />

      <header className="relative z-20 flex items-center justify-between px-6 py-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-2xl font-black text-yellow-300">DB</span>
          <span className="text-lg font-bold text-white">Design Bakery</span>
        </motion.div>
        <ThemeSwitcher />
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 pb-20 pt-8 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="mb-6 inline-block rounded-full border-4 border-black bg-yellow-400 px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-sm font-bold tracking-wide text-black">PORTFOLIO HUB</p>
          </div>
          <h1 className="mb-4 text-[clamp(2.25rem,5vw,3.75rem)] font-black leading-tight text-white">
            Choose a portfolio
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            Pujan Bajracharya — designer-engineer portfolios for full-stack product work, legal AI
            workflows, and agentic systems. Pick a route below.
          </p>
        </motion.div>

        <ul className="flex flex-col gap-5">
          {HUB_DESTINATIONS.map((dest, index) => (
            <motion.li
              key={dest.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
            >
              <Link
                to={dest.path}
                className="group block rounded-2xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:bg-gray-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full border-2 border-black"
                        style={{ backgroundColor: dest.color }}
                      />
                      <h2 className="text-xl font-black text-gray-900 dark:text-white">
                        {dest.title}
                      </h2>
                      {dest.tag && (
                        <span
                          className="rounded-full border-2 border-black px-2 py-0.5 text-xs font-bold text-black"
                          style={{ backgroundColor: dest.accentColor }}
                        >
                          {dest.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                      {dest.description}
                    </p>
                    <p className="mt-3 font-mono text-sm text-gray-400">{dest.path}</p>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border-2 border-black px-4 py-2 text-sm font-bold text-white transition-colors group-hover:gap-3"
                    style={{ backgroundColor: dest.color }}
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-2 text-sm text-white/70"
        >
          <Star color="#FFD93D" size={20} />
          Each route is a self-contained portfolio with its own content.
        </motion.p>
      </main>
    </motion.div>
  );
}
