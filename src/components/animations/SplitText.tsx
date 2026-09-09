import { useMemo } from 'react';

interface SplitTextProps {
  text: string;
  /** 'word' envuelve cada palabra; 'char' cada caracter */
  by?: 'word' | 'char';
  className?: string;
  /** clase para cada unidad (para targetear con GSAP: `.split .unit`) */
  unitClassName?: string;
  as?: 'span' | 'h1' | 'h2' | 'p';
}

/**
 * Divide un texto en unidades envueltas en <span> con `overflow: hidden` en el
 * contenedor de línea, listas para animar con GSAP (`gsap.from('.unit', { yPercent: 110, stagger })`).
 *
 * No anima nada por sí solo: solo prepara el DOM.
 */
export function SplitText({
  text,
  by = 'word',
  className,
  unitClassName = 'unit',
  as = 'span',
}: SplitTextProps) {
  const units = useMemo(() => {
    if (by === 'char') return Array.from(text);
    return text.split(/(\s+)/); // conserva los espacios
  }, [text, by]);

  const Tag = as;

  return (
    <Tag className={className} aria-label={text}>
      {units.map((u, i) => {
        if (/^\s+$/.test(u)) return <span key={i}>{u}</span>;
        return (
          <span key={i} className="split-line" aria-hidden style={{ display: 'inline-block', overflow: 'hidden' }}>
            <span className={unitClassName} style={{ display: 'inline-block', willChange: 'transform' }}>
              {u}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}
