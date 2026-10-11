import type { CSSProperties, ElementType, ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

type Props = {
  children: ReactNode;
  /** stagger in ms */
  delay?: number;
  className?: string;
  threshold?: number;
  /** render as another element, so reveals stay valid inside ol / ul / dl */
  as?: ElementType;
};

/** A beat of the story: real DOM text that rises into the scene as you pass it. */
export function Reveal({ children, delay = 0, className = "", threshold = 0.28, as }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>(threshold);
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      ref={ref}
      data-inview={inView ? "true" : "false"}
      className={`db-reveal ${className}`}
      style={{ "--rd": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
