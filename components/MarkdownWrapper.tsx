import { motion } from 'framer-motion';
import ReactMarkdown, { Components } from "react-markdown";

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

const markdownComponents: Components = {
  ul: ({ children }) => (
    <motion.ul
      className="grid pl-1 border-l-2 border-primary/20 my-1 list-none"
      variants={listVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {children}
    </motion.ul>
  ),
  li: ({ children }) => (
    <motion.li
      variants={itemVariants}
      className="flex items-center gap-3 text-white"
    >
      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      <span>{children}</span>
    </motion.li>
  ),
  h1: ({ children }) => (
    <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 border-b border-primary/30 pb-6">
      {children}
    </h1>
  ),
  em: ({ children }) => (
    <b>{children}</b>
  )
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown components={markdownComponents}>
      {children}
    </ReactMarkdown>
  )
}