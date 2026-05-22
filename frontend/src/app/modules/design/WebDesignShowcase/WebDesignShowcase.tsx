import { motion } from "motion/react";
import { ExternalLink, Zap } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { FlowerCharacter } from "../../../components/FlowerCharacter";
import { Star } from "../../../components/GraphicElements";
import { useState } from "react";
import webDesignProjects from './showcase-web-projects.json';
import aiSolutionsProjects from './showcase-ai-projects.json';

type ProjectCategory = "ai-solutions" | "web-design";

export function WebDesignShowcase() {
  const [category, setCategory] = useState<ProjectCategory>("ai-solutions");

  const currentProjects = category === "ai-solutions" ? aiSolutionsProjects : webDesignProjects;

  const handleCategoryChange = (newCategory: ProjectCategory) => {
    setCategory(newCategory);
    // Scroll to the showcase section smoothly
    const showcaseSection = document.getElementById('showcase');
    if (showcaseSection) {
      showcaseSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="showcase"
      className="py-24 px-6 relative bg-gradient-to-b from-yellow-100 to-pink-100 dark:from-yellow-950 dark:to-pink-950"
    >
      {/* Decorative flowers */}
      <div className="absolute top-10 right-10 hidden md:block">
        <FlowerCharacter color="#FF6B9D" size={80} animate />
      </div>
      <div className="absolute bottom-20 left-10 hidden md:block">
        <FlowerCharacter color="#4169E1" size={70} animate />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <Star color="#4169E1" size={50} />
            <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none font-black">
              <span className="text-blue-600 dark:text-blue-400">
                PROJECT
              </span>{" "}
              <span className="text-pink-500 dark:text-pink-400">
                SHOWCASE
              </span>
            </h2>
            <Star color="#FFD93D" size={50} />
          </div>
          <p className="text-2xl opacity-90 text-gray-900 dark:text-gray-100">
            Projects that make a difference
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-4 mb-12"
        >
          <Button
            onClick={() => handleCategoryChange("ai-solutions")}
            className={`px-8 py-6 rounded-full font-black border-4 border-black transition-all ${
              category === "ai-solutions"
                ? "bg-blue-500 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-600"
                : "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            AI & Solutions Engineering
          </Button>
          <Button
            onClick={() => handleCategoryChange("web-design")}
            className={`px-8 py-6 rounded-full font-black border-4 border-black transition-all ${
              category === "web-design"
                ? "bg-pink-500 text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-pink-600"
                : "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            }`}
          >
            Web Design
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {currentProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30, rotate: -5 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
            >
              <Card
                className="group overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 bg-white dark:bg-gray-900"
                style={{
                  transform: `rotate(${Math.random() * 2 - 1}deg)`,
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Color overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                    style={{ backgroundColor: project.color }}
                  />
                </div>
                <div
                  className="p-6"
                  style={{ backgroundColor: project.color }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3
                      className={
                        project.color === "#A8CC00" ||
                        project.color === "#FFD93D"
                          ? "text-gray-900"
                          : "text-white"
                      }
                    >
                      {project.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${project.color === "#A8CC00" || project.color === "#FFD93D" ? "bg-black/10 text-gray-900" : "bg-white/20 text-white"}`}
                    >
                      {project.type}
                    </span>
                  </div>
                  <p
                    className={`text-sm mb-4 ${project.color === "#A8CC00" || project.color === "#FFD93D" ? "text-gray-800" : "text-white/90"}`}
                  >
                    {project.description}
                  </p>
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-black hover:text-white border-3 border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <Zap className="mr-2 h-4 w-4" />
                        View Project
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-black hover:text-white border-3 border-black transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                      disabled
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Coming Soon
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}