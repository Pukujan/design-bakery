import { motion } from "motion/react";
import { Calendar, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { FlowerCharacter } from "./FlowerCharacter";
import { Star } from "./GraphicElements";

const blogPosts = [
  {
    id: 1,
    title: "AI x UX Mini Hackathon, Designing Smarter, Together",
    date: "October 27, 2025",
    excerpt:
      "Last Saturday, I participated in a AI x UX mini hackathon focused on exploring how designers can enhance creativity, make better design decisions, and thoughtfully integrate AI into their workflow, beyond the usual AI noise.",
    category: "AI & UX",
    color: "#FF6B9D",
    link: "https://www.linkedin.com/posts/pujan3645_ai-x-ux-mini-hackathon-designing-smarter-activity-7388543996333015040-rhoR?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAAD__y_cBqA9MvK7fzRHd9QHO4ub2znjZQP0",
  },
  {
    id: 2,
    title: "UXDX Product Design Meetup at the Empire State Building",
    date: "October 16, 2025",
    excerpt:
      "My experience with meeting wonderful group of industry leaders and reflections on AI, Leadership, and the Future of Design. An evening that was not only inspiring but also a reminder of how vibrant and forward-thinking the design community has become.",
    category: "Reflection",
    color: "#4169E1",
    link: "https://substack.com/home/post/p-176337541",
  },
  {
    id: 3,
    title: "From Data Annotation to AI Insights: My Journey at Nepasoft LLC",
    date: "October 11, 2025",
    excerpt:
      "Reflection on my 1.5 year working as a data annotator to grow my understanding of Machine learning. As a product designer, it was my greatest desire to learn not just how AI can be used, but how AI systems are built and who the people are behind them.",
    category: "Reflection",
    color: "#FFD93D",
    link: "https://substack.com/home/post/p-175897882",
  },
  {
    id: 4,
    title: "Why Doing Nothing Boosts Productivity by 200%",
    date: "October 02, 2025",
    excerpt:
      "How to be more productive by doing nothing. Most people think productivity is about discipline and logic: make a plan, follow the steps, check the boxes. But I've learned something deeper—it's not logic that fuels creative work, it's emotion.",
    category: "Productivity",
    color: "#FF8C42",
    link: "https://substack.com/home/post/p-175124784",
  },
];

export function Blog() {
  return (
    <section
      id="blog"
      className="py-24 px-6 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 hidden lg:block">
        <FlowerCharacter
          color="#FFD93D"
          size={90}
          showFace
          animate
        />
      </div>

      {/* Scattered stars */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute hidden md:block"
          style={{
            top: `${20 + i * 20}%`,
            left: `${15 + i * 20}%`,
          }}
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 8 + i, repeat: Infinity }}
        >
          <Star
            color={
              ["#FF6B9D", "#4169E1", "#FFD93D", "#FF8C42"][i]
            }
            size={30}
          />
        </motion.div>
      ))}

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <BookOpen className="w-10 h-10 text-blue-600" />
            <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none font-black">
              <span className="text-purple-600">
                REFLECTIONS
              </span>
            </h2>
          </div>
          <p className="text-2xl opacity-90">
            Thoughts on Design, Culture & Equality
          </p>
        </motion.div>

        {/* Blog cards with bold styling */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30, rotate: -5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.03, rotate: 1 }}
              className="group"
            >
              <div className="h-full bg-white dark:bg-gray-900 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all overflow-hidden">
                {/* Category header */}
                <div
                  className="p-6 border-b-4 border-black"
                  style={{ backgroundColor: post.color }}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-4 py-2 bg-white dark:bg-gray-900 dark:text-gray-100 rounded-full border-3 border-black font-black">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-4 h-4" />
                      <time className="text-sm">
                        {post.date}
                      </time>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <h3 className="text-2xl group-hover:text-pink-500 transition-colors text-gray-900 dark:text-gray-100">
                    {post.title}
                  </h3>

                  <p className="opacity-80 leading-relaxed text-gray-700 dark:text-gray-300">
                    {post.excerpt}
                  </p>

                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      className="group/btn -ml-4 hover:text-blue-600 font-black"
                    >
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* View all button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <a
            href="https://substack.com/@designbaker?"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className="bg-black hover:bg-purple-600 text-white border-4 border-black px-10 py-6 rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              View All Posts →
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
}