import { motion } from "motion/react";
import { Palette, Monitor, Zap, Code } from "lucide-react";

export function DesignProcessSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🎨</span>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">Design Process</h2>
          </div>

          <div className="space-y-16 mt-12">
            {/* Brand Identity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary text-primary-foreground rounded-lg w-10 h-10 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Palette className="w-8 h-8" />
                  Brand Identity
                </h3>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Created a market-researched brand identity following demography and market trends at the time for Nepalese Audience.
                </p>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Designed a modern logo with all its components ready to use</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Built color palettes and typography balancing authority and warmth</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Developed brand guidelines adaptable to web, print, and motion</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Designed all marketing and innovative pitch decks materials, essential for easily drawing audience into our platform through a try and buy as well as budget friendly forever platform</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Webflow & UX/UI Design */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary text-primary-foreground rounded-lg w-10 h-10 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Monitor className="w-8 h-8" />
                  Webflow & UX/UI Design
                </h3>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 space-y-8">
                <div>
                  <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                    Simplistic web-flow for each targeted audience from regular low-income individuals and business owners, separate partner platforms for legal consultants and B2B partners and companies.
                  </p>
                  <p className="text-lg text-primary font-semibold">
                    Keeping it simple and single pathway was our main objective for digitally adverse audience.
                  </p>
                </div>

                {/* For Regular Audience */}
                <div className="border-l-4 border-primary pl-6">
                  <h4 className="text-xl font-semibold text-primary mb-4">For Regular Audience:</h4>
                  <p className="text-gray-700 mb-4">
                    Transformed multi-page legal forms into clear, guided digital experiences.
                  </p>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="text-secondary mt-1">•</span>
                      <span>Step-by-step flows with visual hints and icons</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-secondary mt-1">•</span>
                      <span>Romanized Nepali input so users could type naturally without mastering Nepali script</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-secondary mt-1">•</span>
                      <span>Video-guided lawyer tutorials integrated into each flow</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-secondary mt-1">•</span>
                      <span>One-click legal partner consultation available in every form</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-secondary mt-1">•</span>
                      <span>Desktop-first architecture for reviewing entire documents</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-secondary mt-1">•</span>
                      <span>Mobile-responsive layouts for broader access</span>
                    </li>
                  </ul>
                </div>

                {/* For Legal Consultants */}
                <div className="border-l-4 border-secondary pl-6">
                  <h4 className="text-xl font-semibold text-primary mb-4">For Legal Consultants:</h4>
                  <p className="text-gray-700">
                    Created a partner-ready web-flow giving access to all our criteria and easy onboarding with earning and benefits listed for joining.
                  </p>
                </div>

                {/* For Business Partners */}
                <div className="border-l-4 border-primary pl-6">
                  <h4 className="text-xl font-semibold text-primary mb-4">For Business Partners:</h4>
                  <p className="text-gray-700 mb-4">
                    A business-ready SaaS website as well as direct contact to make business deals that directly fund our main website and keep it budget friendly as well as scalable and marketable.
                  </p>
                  <p className="text-gray-600 italic">
                    Starting out we used our software company partners to innovate a business-ready solution to bring in multiple clients.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Prototyping & Testing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary text-primary-foreground rounded-lg w-10 h-10 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Zap className="w-8 h-8" />
                  Prototyping, Development & Testing
                </h3>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Built interactive Fast & Efficient Static Figma prototypes tested with real first-time users</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Speed & Efficiency as our main-goal, we worked as a design & develop strategy to fast track every design into front-end development and speed-run the development process</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Conducted usability sessions identifying friction points</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Created an Ultra-fast website with component loading times for each page less than a few milliseconds</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Development Implementation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary text-primary-foreground rounded-lg w-10 h-10 flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Code className="w-8 h-8" />
                  Development Implementation
                </h3>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Developed in Next.js + TailwindCSS for frontend component-based platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>PostgreSQL database for scalable implementation for multi-layered tabular data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Advanced cybersecurity measures for secure user data storage by our in-house cybersecurity team</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-secondary mt-1">•</span>
                    <span>Collaborated closely with developers for design fidelity and component-based development features</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
