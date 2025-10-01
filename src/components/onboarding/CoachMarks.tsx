import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export type CoachMarkPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface CoachMarkStep {
  id: string;
  target: string; // CSS selector or [data-tour="..."]
  title: string;
  content: string;
  placement?: CoachMarkPlacement;
}

interface CoachMarksProps {
  open: boolean;
  steps: CoachMarkStep[];
  onClose: () => void;
  onFinish?: () => void;
}

const getTargetRect = (selector: string): DOMRect | null => {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return rect;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export const CoachMarks: React.FC<CoachMarksProps> = ({ open, steps, onClose, onFinish }) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [placement, setPlacement] = useState<CoachMarkPlacement>('bottom');
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const current = steps[index];

  const updateRect = useCallback(() => {
    if (!current) return;
    const r = getTargetRect(current.target);
    setRect(r);

    if (current.placement && current.placement !== 'auto') {
      setPlacement(current.placement);
      return;
    }
    if (!r) return;
    // Auto placement: prefer bottom, then top, then right, then left
    const spaceBottom = window.innerHeight - r.bottom;
    const spaceTop = r.top;
    const spaceRight = window.innerWidth - r.right;
    const spaceLeft = r.left;
    const order: CoachMarkPlacement[] = ['bottom', 'top', 'right', 'left'];
    const spaces = { bottom: spaceBottom, top: spaceTop, right: spaceRight, left: spaceLeft } as const;
    let chosen: CoachMarkPlacement = 'bottom';
    for (const p of order) {
      if (spaces[p] > 120) { // arbitrary minimum space for tooltip
        chosen = p; break;
      }
    }
    setPlacement(chosen);
  }, [current]);

  useEffect(() => {
    if (!open) return;
    updateRect();
    const handler = () => updateRect();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    const interval = window.setInterval(updateRect, 300);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
      window.clearInterval(interval);
    };
  }, [open, updateRect]);

  useEffect(() => {
    if (!open) return;
    setIndex(0);
  }, [open]);

  const tooltipStyle = useMemo(() => {
    if (!rect) return { opacity: 0 } as React.CSSProperties;
    const padding = 12;
    const tooltipW = tooltipRef.current?.offsetWidth ?? 320;
    const tooltipH = tooltipRef.current?.offsetHeight ?? 140;

    let top = 0; let left = 0;
    switch (placement) {
      case 'top':
        top = rect.top - tooltipH - 12;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case 'bottom':
        top = rect.bottom + 12;
        left = rect.left + rect.width / 2 - tooltipW / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.left - tooltipW - 12;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipH / 2;
        left = rect.right + 12;
        break;
      default:
        top = rect.bottom + 12;
        left = rect.left + rect.width / 2 - tooltipW / 2;
    }

    top = clamp(top + window.scrollY, 8 + window.scrollY, window.scrollY + window.innerHeight - tooltipH - 8);
    left = clamp(left + window.scrollX, 8 + window.scrollX, window.scrollX + window.innerWidth - tooltipW - 8);

    return { top, left, width: tooltipW, maxWidth: 360 } as React.CSSProperties;
  }, [rect, placement]);

  const highlightStyle = useMemo(() => {
    if (!rect) return { opacity: 0 } as React.CSSProperties;
    const pad = 6;
    return {
      top: rect.top + window.scrollY - pad,
      left: rect.left + window.scrollX - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    } as React.CSSProperties;
  }, [rect]);

  if (!open || !current) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      {/* Dim overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      {/* Highlight box */}
      {rect && (
        <div
          className="absolute rounded-lg ring-2 ring-blue-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
          style={highlightStyle}
        />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute bg-white rounded-lg shadow-xl border p-4 w-[320px]"
        style={tooltipStyle}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{current.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{current.content}</p>
          </div>
          <button aria-label="Cerrar" className="text-gray-400 hover:text-gray-600" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">{index + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>Atrás</Button>
            {index < steps.length - 1 ? (
              <Button size="sm" onClick={() => setIndex(Math.min(steps.length - 1, index + 1))}>Siguiente</Button>
            ) : (
              <Button size="sm" onClick={() => { onFinish?.(); onClose(); }}>Finalizar</Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CoachMarks;
