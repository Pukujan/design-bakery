import { motion } from "motion/react";
import { ExternalLink, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { FlowerCharacter } from "./FlowerCharacter";
import { Star } from "./GraphicElements";
import { useState } from "react";

type ProjectCategory = "ai-solutions" | "web-design";

const webDesignProjects = [
  {
    id: 1,
    title: "The Street Palette",
    description:
      "Where the City Breathes Color - Art, Culture & Community in Motion",
    image: "https://i.imgur.com/idZIzuG.jpg",
    color: "#FF6B9D",
    link: "https://slice-garb-68693699.figma.site",
    type: "Portfolio Web Design for Artists",
  },
  {
    id: 2,
    title: "Canvas United",
    description: "Art as a voice, not just visual.",
    image: "https://i.imgur.com/9Nbsk5p.png",
    color: "#4169E1",
    link: "https://puppy-forum-64441493.figma.site",
    type: "Community Website Design",
  },
  {
    id: 3,
    title: "Hyperce",
    description:
      "E-Commerce Platform Builder Website & Marketing",
    image: "https://i.imgur.com/2RlVpFe.png",
    color: "#A8CC00",
    link: "https://www.hyperce.io/",
    type: "Website Design",
  },
  {
    id: 4,
    title: "Friendship App",
    description:
      "Tinder for Friendship & Community - A blend of Tinder, Instagram, Cats and Luma",
    image: "https://i.imgur.com/GW601Pm.png",
    color: "#FF8C42",
    link: "https://sun-select-22450089.figma.site",
    type: "Product Design Demo",
  },
  {
    id: 5,
    title: "Kathmandu Organics",
    description:
      "Organic and local farmer's market e-commerce branding & Marketing",
    image: "https://i.imgur.com/1nIF6Lc.png",
    color: "#9B6DD6",
    link: "https://www.behance.net/gallery/134915083/Branding-and-Packaging-Project",
    type: "Branding & Marketing",
  },
  {
    id: 6,
    title: "Bryan's Barbeque",
    description:
      "Since 2001 — Smoke-house classics and steakhouse favourites, made for the local crowd.",
    image: "https://images.unsplash.com/photo-1529557050046-60c5f1d35ea4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXJiZXF1ZSUyMHN0ZWFrJTIwZ3JpbGx8ZW58MXx8fHwxNzYxODU0NTc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    color: "#E63946",
    link: "https://shout-cameo-39749292.figma.site",
    type: "Restaurant Website",
  },
  {
    id: 7,
    title: "Bagel Bob's HTX",
    description:
      "Hand-Rolled. Kettle-Boiled. Houston's Own Taste of New York",
    image: "https://images.unsplash.com/photo-1734314316843-a78d2c96a773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWdlbCUyMG5ldyUyMHlvcmt8ZW58MXx8fHwxNzYxODU0NTc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    color: "#FFD93D",
    link: "https://ream-agency-22445241.figma.site/",
    type: "Food Business Website",
  },
  {
    id: 8,
    title: "Astoria Koulouri",
    description:
      "Homesickness baked fresh daily. From Thessaloniki to Astoria since 1989",
    image: "https://images.unsplash.com/photo-1736618626237-61a1e6197537?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlayUyMGJha2VyeSUyMGtvdWxvdXJpfGVufDF8fHx8MTc2MTg1NDU3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    color: "#FF8C42",
    link: "https://salad-dazzle-07551633.figma.site",
    type: "Bakery Website",
  },
  {
    id: 9,
    title: "More Coming Soon",
    description: "Exciting new projects in the works!",
    image:
      "https://images.unsplash.com/photo-1677214467820-ab069619bbb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3ZWIlMjBkZXNpZ258ZW58MXx8fHwxNzYxNjkxOTg0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    color: "#9B6DD6",
    type: "Coming Soon",
  },
];

const aiSolutionsProjects = [
  {
    id: 1,
    title: "Project Title Here",
    description: "Project description goes here",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaSUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYxODU1MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    color: "#4169E1",
    link: "",
    type: "AI Solutions",
  },
];

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