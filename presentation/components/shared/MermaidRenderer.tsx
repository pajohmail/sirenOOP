'use client';

import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  chart: string;
  className?: string;
}

export const MermaidRenderer = ({ chart, className }: MermaidRendererProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose'
    });

    if (ref.current && chart) {
      const renderDiagram = async () => {
        try {
          const { svg } = await mermaid.render(`mermaid-${Date.now()}`, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Failed to render Mermaid diagram:', error);
          if (ref.current) {
            ref.current.innerHTML = `<pre className="text-red-600 p-4">Failed to render diagram. Please check the Mermaid syntax.</pre>`;
          }
        }
      };

      renderDiagram();
    }
  }, [chart]);

  return <div ref={ref} className={className || 'w-full overflow-auto'} />;
};
