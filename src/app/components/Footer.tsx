import { motion } from 'motion/react';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFooterSection } from '../lib/contentHooks';

const iconMap = {
  Github,
  Linkedin,
  Twitter,
  Mail,
} as const;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const content = useFooterSection();

  return (
    <footer className="bg-gray-900 text-white py-16 px-6 border-t-6 border-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.h3
              className="text-3xl font-black mb-4"
              whileHover={{ scale: 1.05 }}
            >
              {content.brandTitle}
            </motion.h3>
            <p className="text-gray-400 mb-6 text-lg leading-relaxed">
              {content.brandDescription}
            </p>
            <div className="flex gap-4">
              {content.socialLinks.map((social) => {
                const Icon = iconMap[social.icon as keyof typeof iconMap] ?? Github;
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 flex items-center justify-center transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-lg font-bold mb-4">Navigation</h4>
            <ul className="space-y-2">
              {content.navigationLinks.map((item) => (
                <li key={item.label}>
                  {item.type === 'route' ? (
                    <Link
                      to={item.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {content.quickLinks.map((item) => (
                <li key={item.label}>
                  {item.type === 'route' ? (
                    <Link
                      to={item.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-gray-400">
            © {currentYear} {content.copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}
