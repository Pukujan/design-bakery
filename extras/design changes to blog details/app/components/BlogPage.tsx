import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Clock, Tag, Calendar, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Squiggle, Star, BlobShape } from './GraphicElements';
import { FlowerCharacter } from './FlowerCharacter';
import { Cupcake, Donut } from './BakeryItems';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
});

const categories = [
  { id: 'all', label: 'All Topics', color: '#4169E1' },
  { id: 'ai-ml', label: 'AI & ML', color: '#9B6DD6' },
  { id: 'systems', label: 'Systems Design', color: '#FF8C42' },
  { id: 'product', label: 'Product Engineering', color: '#FF6B9D' },
  { id: 'architecture', label: 'Architecture', color: '#A8CC00' },
];

const blogs = [
  {
    id: 1,
    title: 'Building Scalable Form Systems in Next.js',
    excerpt:
      'How we engineered a multi-step form workflow that handles complex validation, real-time error handling, and maintains state across 15+ screens.',
    date: 'January 2026',
    readTime: '8 min read',
    tags: ['Systems Design', 'React', 'TypeScript'],
    category: 'systems',
    color: '#4169E1',
    author: 'Design Baker',
    content: `
# Building Scalable Form Systems in Next.js

## Introduction

Building forms at scale is one of the most challenging aspects of modern web development. In this article, I'll share how we built a multi-step form workflow that handles complex validation, real-time error handling, and maintains state across 15+ screens.

## The Challenge

We needed to build a comprehensive onboarding flow that:
- Collects user data across multiple steps
- Validates data in real-time
- Persists state across page reloads
- Handles conditional logic and branching
- Provides excellent UX with instant feedback

## Architecture Overview

\`\`\`mermaid
graph TD
    A[User Input] --> B[Form State Manager]
    B --> C{Validation Engine}
    C -->|Valid| D[Progress to Next Step]
    C -->|Invalid| E[Show Errors]
    E --> A
    D --> F[Persist to Storage]
    F --> G[API Sync]
\`\`\`

## Key Components

### 1. State Management

We used **React Hook Form** for local state and **Zustand** for global persistence:

\`\`\`typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FormState {
  currentStep: number;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      currentStep: 0,
      formData: {},
      setFormData: (data) => set({ formData: data }),
      nextStep: () => set((state) => ({
        currentStep: state.currentStep + 1
      })),
      prevStep: () => set((state) => ({
        currentStep: Math.max(0, state.currentStep - 1)
      })),
    }),
    { name: 'onboarding-form' }
  )
);
\`\`\`

### 2. Validation Strategy

We implemented a **schema-based validation** system using Zod:

\`\`\`typescript
import { z } from 'zod';

const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\\+?[1-9]\\d{1,14}$/, 'Invalid phone number'),
});

type PersonalInfo = z.infer<typeof personalInfoSchema>;
\`\`\`

### 3. Real-Time Error Handling

Errors are displayed immediately as users type, with debouncing to prevent excessive validation:

\`\`\`typescript
import { useDebounce } from '@/hooks/useDebounce';

function FormField({ name, register, errors }) {
  const debouncedValue = useDebounce(watch(name), 300);

  useEffect(() => {
    trigger(name);
  }, [debouncedValue]);

  return (
    <div>
      <input {...register(name)} />
      {errors[name] && (
        <span className="text-red-500">{errors[name].message}</span>
      )}
    </div>
  );
}
\`\`\`

## Performance Optimization

### Mermaid: System Flow

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant F as Form Component
    participant V as Validator
    participant S as State Store
    participant API as Backend API

    U->>F: Enter Data
    F->>V: Validate Input
    V-->>F: Validation Result
    F->>S: Update Local State
    F->>U: Show Feedback

    U->>F: Submit Step
    F->>S: Persist to Storage
    S->>API: Sync Data
    API-->>S: Confirmation
    S->>F: Update UI
    F->>U: Navigate to Next Step
\`\`\`

### Code Splitting

We split each form step into its own chunk:

\`\`\`typescript
const Step1 = lazy(() => import('./steps/PersonalInfo'));
const Step2 = lazy(() => import('./steps/BusinessInfo'));
const Step3 = lazy(() => import('./steps/Preferences'));
\`\`\`

### Virtual Scrolling

For long select lists, we implemented virtual scrolling:

\`\`\`typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function CountrySelect({ options }) {
  const virtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });

  return (
    <div ref={parentRef} style={{ height: '300px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map((item) => (
        <div key={item.key} style={{ height: item.size }}>
          {options[item.index].label}
        </div>
      ))}
    </div>
  );
}
\`\`\`

## Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Time to Complete | 12 min | 6 min | **50% faster** |
| Validation Errors | 35% | 8% | **77% reduction** |
| Drop-off Rate | 45% | 18% | **60% improvement** |
| User Satisfaction | 3.2/5 | 4.7/5 | **47% increase** |

## Key Takeaways

1. **State Persistence**: Always persist form state to prevent data loss
2. **Progressive Validation**: Validate as users type, not just on submit
3. **Performance**: Use code splitting and virtual scrolling for large forms
4. **UX First**: Show clear progress indicators and helpful error messages
5. **Schema Validation**: Use TypeScript + Zod for type-safe forms

## Conclusion

Building scalable form systems requires careful planning around state management, validation, and performance. By following these patterns, we reduced completion time by 50% and improved user satisfaction significantly.

---

**Questions?** Feel free to reach out or leave a comment below!
    `,
  },
  {
    id: 2,
    title: 'Agentic AI: Orchestrating Multiple LLMs for Complex Tasks',
    excerpt:
      'Lessons learned building an AI workflow system that coordinates multiple agents, manages context windows, and handles streaming responses.',
    date: 'December 2025',
    readTime: '10 min read',
    tags: ['AI', 'Product Engineering', 'OpenAI'],
    category: 'ai-ml',
    color: '#9B6DD6',
    author: 'Design Baker',
    content: `
# Agentic AI: Orchestrating Multiple LLMs for Complex Tasks

Building AI systems that can handle complex, multi-step tasks requires more than just calling an API. This article explores how we built an agentic AI system that coordinates multiple LLMs.

## System Architecture

\`\`\`mermaid
graph LR
    A[User Request] --> B[Orchestrator]
    B --> C[Research Agent]
    B --> D[Analysis Agent]
    B --> E[Writing Agent]
    C --> F[Vector DB]
    D --> G[Context Manager]
    E --> H[Output Formatter]
    F --> B
    G --> B
    H --> I[Final Response]
\`\`\`

## Implementation Details

Coming soon...
    `,
  },
  {
    id: 3,
    title: 'Frontend Architecture for Multi-Tenant SaaS',
    excerpt:
      'Designing a frontend architecture that serves multiple client types while maintaining code reusability, security, and performance.',
    date: 'November 2025',
    readTime: '12 min read',
    tags: ['Architecture', 'SaaS', 'Next.js'],
    category: 'architecture',
    color: '#FF8C42',
    author: 'Design Baker',
    content: `
# Frontend Architecture for Multi-Tenant SaaS

Multi-tenant SaaS applications require careful architectural decisions to balance code reuse, security, and customization.

## Key Challenges

1. **Tenant Isolation**: Ensuring data and UI elements are properly scoped
2. **Customization**: Allowing per-tenant branding and features
3. **Performance**: Maintaining fast load times across all tenants
4. **Security**: Preventing cross-tenant data leaks

## Architecture Pattern

\`\`\`mermaid
graph TB
    A[Request] --> B{Tenant Resolver}
    B --> C[Tenant Config]
    B --> D[Route Handler]
    C --> E[Theme Provider]
    C --> F[Feature Flags]
    D --> G[Data Fetcher]
    G --> H[Scoped API Client]
    E --> I[UI Components]
    F --> I
    H --> I
    I --> J[Rendered App]
\`\`\`

More details coming soon...
    `,
  },
];

// Mermaid rendering component
function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        setError('Failed to render diagram');
        console.error('Mermaid rendering error:', err);
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return <div className="text-red-500 p-4 border-2 border-red-500">{error}</div>;
  }

  return <div dangerouslySetInnerHTML={{ __html: svg }} className="my-8 flex justify-center" />;
}

export function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBlog, setSelectedBlog] = useState<typeof blogs[0] | null>(blogs[0]);

  // Filter blogs by category
  const filteredBlogs =
    selectedCategory === 'all'
      ? blogs
      : blogs.filter((blog) => blog.category === selectedCategory);

  // Custom markdown components
  const MarkdownComponents = {
    code({ inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';

      if (!inline && language === 'mermaid') {
        return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
      }

      return !inline ? (
        <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100 px-2 py-1 rounded border-2 border-purple-300 dark:border-purple-700 text-sm font-mono" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => (
      <h1 className="text-5xl font-black mb-6 mt-8 text-gray-900 dark:text-gray-100">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-4xl font-black mb-4 mt-8 text-gray-900 dark:text-gray-100 border-l-8 border-blue-500 pl-4">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-3xl font-black mb-3 mt-6 text-gray-900 dark:text-gray-100">
        {children}
      </h3>
    ),
    p: ({ children }: any) => (
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="ml-4 text-lg">{children}</li>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-6">
        <table className="min-w-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-black text-white">{children}</thead>
    ),
    th: ({ children }: any) => (
      <th className="border-2 border-black px-6 py-3 text-left font-black">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="border-2 border-black px-6 py-3 bg-white dark:bg-gray-900">
        {children}
      </td>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-8 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-4 my-4 italic">
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="my-8 border-t-4 border-black" />
    ),
    a: ({ children, href }: any) => (
      <a
        href={href}
        className="text-blue-600 dark:text-blue-400 font-bold underline hover:text-blue-800 dark:hover:text-blue-300"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    strong: ({ children }: any) => (
      <strong className="font-black text-gray-900 dark:text-gray-100">
        {children}
      </strong>
    ),
  };

  if (selectedBlog) {
    // Get similar blogs from the same category
    const similarBlogs = blogs
      .filter((blog) => blog.category === selectedBlog.category && blog.id !== selectedBlog.id)
      .slice(0, 3);

    return (
      <section className="min-h-screen py-24 px-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 relative overflow-hidden">
        {/* Decorative Elements */}
        <BlobShape color="#9B6DD6" size={400} className="absolute -top-32 -right-40 opacity-20" />
        <BlobShape color="#4169E1" size={350} className="absolute bottom-20 -left-32 opacity-20" />

        <motion.div
          className="absolute top-32 right-20 hidden lg:block"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Cupcake size={70} animate={false} />
        </motion.div>

        <motion.div
          className="absolute bottom-40 left-20 hidden lg:block"
          animate={{ y: [0, 15, 0], rotate: [0, 360, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        >
          <Donut size={80} animate={false} />
        </motion.div>

        <motion.div
          className="absolute top-20 left-32"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity }}
        >
          <Star color="#9B6DD6" size={50} />
        </motion.div>

        <div className="absolute top-40 left-10 hidden md:block">
          <FlowerCharacter color="#4169E1" size={70} animate />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Sticky Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="sticky top-20 z-40 mb-8"
          >
            <Button
              onClick={() => setSelectedBlog(null)}
              className="px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-full"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to All Blogs
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            {/* Main Content */}
            <div>
              {/* Blog Header */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <div
                  className="w-full h-4 rounded-full mb-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: selectedBlog.color }}
                />

                <h1 className="text-[clamp(3rem,6vw,5rem)] leading-none mb-6 font-black text-gray-900 dark:text-gray-100">
                  {selectedBlog.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    <span className="font-bold">{selectedBlog.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{selectedBlog.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{selectedBlog.readTime}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedBlog.tags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      className="border-3 border-black font-bold text-sm px-3 py-1"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Squiggle color={selectedBlog.color} />
              </motion.div>

              {/* Blog Content */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="p-8 md:p-12 border-6 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900">
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={MarkdownComponents}
                    >
                      {selectedBlog.content}
                    </ReactMarkdown>
                  </div>
                </Card>
              </motion.div>

              {/* Similar Blogs Section */}
              {similarBlogs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-16"
                >
                  <h2 className="text-4xl font-black mb-8 text-gray-900 dark:text-gray-100 border-l-8 border-purple-500 pl-4">
                    Similar Articles
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {similarBlogs.map((blog) => (
                      <Card
                        key={blog.id}
                        className="p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 group cursor-pointer"
                        onClick={() => {
                          setSelectedBlog(blog);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <div
                          className="w-full h-3 rounded-full mb-4 border-2 border-black"
                          style={{ backgroundColor: blog.color }}
                        />
                        <h3 className="text-xl font-black mb-3 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
                          {blog.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{blog.readTime}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="sticky top-36">
                {/* Category Navigation */}
                <Card className="p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 mb-6">
                  <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-gray-100">
                    Categories
                  </h3>
                  <div className="space-y-3">
                    {categories.filter((cat) => cat.id !== 'all').map((category) => {
                      const categoryCount = blogs.filter((b) => b.category === category.id).length;
                      const isActive = category.id === selectedBlog.category;

                      return (
                        <Button
                          key={category.id}
                          onClick={() => {
                            setSelectedBlog(null);
                            setSelectedCategory(category.id);
                          }}
                          className={`
                            w-full justify-between px-4 py-3 border-4 border-black
                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                            transition-all font-black text-sm
                            ${
                              isActive
                                ? 'bg-black text-white'
                                : 'bg-white dark:bg-gray-900 text-black dark:text-white'
                            }
                          `}
                          style={{
                            borderLeftColor: isActive ? category.color : undefined,
                            borderLeftWidth: isActive ? '8px' : undefined,
                          }}
                        >
                          <span>{category.label}</span>
                          <Badge
                            variant="outline"
                            className={`border-2 ${isActive ? 'border-white text-white' : 'border-black'}`}
                          >
                            {categoryCount}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900">
                  <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-gray-100">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <Button
                      onClick={() => setSelectedBlog(null)}
                      className="w-full justify-start px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-blue-500 hover:bg-blue-600 text-white font-black text-sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      All Blogs
                    </Button>
                    <Button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="w-full justify-start px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-gray-900 text-black dark:text-white font-black text-sm"
                    >
                      ↑ Back to Top
                    </Button>
                  </div>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  // Blog List View
  return (
    <section
      id="blogs"
      className="min-h-screen py-24 px-6 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(3rem,7vw,6rem)] leading-none mb-4 font-black">
            <span className="text-purple-600 dark:text-purple-400">BLOGS</span>
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Deep dives into systems thinking, AI workflows, and engineering
            decision-making
          </p>
          <Squiggle color="#4169E1" className="mx-auto" />
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-6 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                transition-all font-black text-base
                ${
                  selectedCategory === category.id
                    ? 'bg-black text-white'
                    : 'bg-white dark:bg-gray-900 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }
              `}
              style={{
                borderLeftColor:
                  selectedCategory === category.id ? category.color : undefined,
                borderLeftWidth:
                  selectedCategory === category.id ? '8px' : undefined,
              }}
            >
              {category.label}
            </Button>
          ))}
        </motion.div>

        {/* Blogs Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {filteredBlogs.map((blog, idx) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <Card className="h-full p-6 border-6 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all bg-white dark:bg-gray-900 group cursor-pointer">
                <div
                  className="w-full h-3 rounded-full mb-6 border-2 border-black"
                  style={{ backgroundColor: blog.color }}
                />

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{blog.readTime}</span>
                  </div>
                  <span>•</span>
                  <span>{blog.date}</span>
                </div>

                <h3 className="text-2xl font-black mb-4 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {blog.title}
                </h3>

                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  {blog.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {blog.tags.map((tag, tIdx) => (
                    <Badge
                      key={tIdx}
                      variant="outline"
                      className="border-2 border-black font-bold text-xs"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button
                  onClick={() => setSelectedBlog(blog)}
                  variant="ghost"
                  className="group/btn p-0 h-auto font-bold text-blue-600 dark:text-blue-400 hover:bg-transparent w-full justify-start"
                >
                  Read Full Article
                  <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
