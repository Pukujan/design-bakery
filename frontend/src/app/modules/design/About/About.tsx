import { motion } from "motion/react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { FlowerCharacter } from "../../../components/FlowerCharacter";
import { Squiggle, Star, BlobShape } from "../../../components/GraphicElements";
import { Heart } from "lucide-react";
import timeline from "./timeline.json";

export function About() {
  return (
    <section
      id="about"
      className="py-24 px-6 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 relative overflow-hidden"
    >
      {/* Decorative blobs */}
      <BlobShape
        color="#FFD93D"
        size={250}
        className="absolute top-0 -left-20 opacity-20"
      />
      <BlobShape
        color="#4169E1"
        size={200}
        className="absolute bottom-0 -right-20 opacity-20"
      />

      {/* Floating stars */}
      <motion.div
        className="absolute top-20 right-1/4"
        animate={{ rotate: 360, y: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity }}
      >
        <Star color="#FF6B9D" size={40} />
      </motion.div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-4 font-black">
            <span className="text-pink-500 dark:text-pink-400">
              ABOUT
            </span>{" "}
            <span className="text-blue-600 dark:text-blue-400">
              ME
            </span>
          </h2>
          <Squiggle color="#FFD93D" className="mx-auto" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* Portrait with playful styling */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border-6 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-pink-200 transform hover:rotate-2 transition-all">
              <ImageWithFallback
                src="https://i.imgur.com/umGE4Kd.jpeg"
                alt="Pujan Bajracharya"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -bottom-8 -right-8">
              <FlowerCharacter
                color="#FFD93D"
                size={100}
                showFace
              />
            </div>
            <div className="absolute -top-6 -left-6">
              <FlowerCharacter
                color="#4169E1"
                size={80}
                showFace
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xl leading-relaxed mb-6 text-gray-900 dark:text-gray-100">
                From social work to design advocacy — I craft
                stories that empower people through creativity.
              </p>

              <div className="p-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl border-4 border-black relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
                <p className="text-white leading-relaxed mb-3">
                  "I thrive at the intersection of design, technology, and social good, helping mission-driven startups and nonprofits turn visionary ideas into scalable, empathetic digital products."
                </p>
                <p className="text-white/90 text-sm">
                  — Design Bakery
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Career Timeline - Colorful Pills */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-gray-900 p-10 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <h3 className="text-3xl mb-8 text-center text-gray-900 dark:text-gray-100">
            Career Journey
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.1,
                  type: "spring",
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: Math.random() * 10 - 5,
                }}
              >
                <div
                  className="px-8 py-4 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  style={{ backgroundColor: item.color }}
                >
                  <p className="font-bold text-white">
                    {item.org}
                  </p>
                  <p className="text-sm text-white/90">
                    {item.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}