import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

type Position = {
  x: number;
  y: number;
};

type DraggablePanelProps = PropsWithChildren<{
  id: string;
  title: string;
  subtitle?: string;
  position: Position;
  onPositionChange?: (position: Position) => void;
  collapsed?: boolean;
  onToggleCollapsed?: (collapsed: boolean) => void;
  onClose?: () => void;
  bounds?: { width: number; height: number } | null;
  className?: string;
  tone?: 'light' | 'dark';
}>;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const Minus = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-4 w-4">
    <path d="M5 10h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Expand = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-4 w-4">
    <path d="M6 4h4m0 0V0m0 4 4-4M6 16h4m0 0v4m0-4 4 4M4 6v4m0 0H0m4 0-4 4m16-4v4m0 0h4m-4 0 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Close = () => (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-4 w-4">
    <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const DraggablePanel = ({
  id,
  title,
  subtitle,
  position,
  onPositionChange,
  collapsed = false,
  onToggleCollapsed,
  onClose,
  bounds,
  className = '',
  tone = 'light',
  children
}: DraggablePanelProps) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const applyPosition = useCallback(
    (nextPosition: Position) => {
      onPositionChange?.(nextPosition);
    },
    [onPositionChange]
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;

      const element = event.target as HTMLElement | null;
      if (element && element.closest('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')) {
        return;
      }

      const target = panelRef.current;
      if (!target) return;

      const start = { x: event.clientX, y: event.clientY };
      const startPosition = { ...position };
      setIsDragging(true);
      target.setPointerCapture(event.pointerId);

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const delta = {
          x: moveEvent.clientX - start.x,
          y: moveEvent.clientY - start.y
        };
        let nextX = startPosition.x + delta.x;
        let nextY = startPosition.y + delta.y;

        if (bounds && target) {
          const rect = target.getBoundingClientRect();
          const width = rect.width;
          const height = rect.height;
          const maxX = bounds.width - width - 16;
          const maxY = bounds.height - height - 16;
          nextX = clamp(nextX, 16, Math.max(16, maxX));
          nextY = clamp(nextY, 16, Math.max(16, maxY));
        }

        applyPosition({ x: nextX, y: nextY });
      };

      const handlePointerUp = () => {
        target.releasePointerCapture(event.pointerId);
        setIsDragging(false);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp, { once: true });
    },
    [applyPosition, bounds, position]
  );

  useEffect(() => {
    if (!bounds) return;
    const target = panelRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const maxX = bounds.width - rect.width - 16;
    const maxY = bounds.height - rect.height - 16;
    const nextX = clamp(position.x, 16, Math.max(16, maxX));
    const nextY = clamp(position.y, 16, Math.max(16, maxY));
    if (nextX !== position.x || nextY !== position.y) {
      applyPosition({ x: nextX, y: nextY });
    }
  }, [applyPosition, bounds, position.x, position.y]);

  const headerClasses = useMemo(() => {
    const palette =
      tone === 'dark'
        ? 'bg-slate-900/80 text-slate-200 shadow-black/30 border border-slate-800/60'
        : 'bg-white/70 text-slate-500 shadow-white/50';
    return `flex cursor-move items-center justify-between gap-3 rounded-2xl px-3 py-2 text-[11px] font-medium uppercase tracking-[0.25em] backdrop-blur ${
      isDragging ? 'select-none' : ''
    } ${palette}`;
  }, [isDragging, tone]);

  const basePalette = tone === 'dark' ? 'border-slate-800/70 bg-slate-900/90 text-slate-100 shadow-slate-900/40' : 'border-white/70 bg-white/90 text-slate-800 shadow-slate-900/10';

  return (
    <div
      ref={panelRef}
      data-panel-id={id}
      className={`pointer-events-auto absolute z-10 max-w-sm rounded-3xl border ${basePalette} shadow-2xl backdrop-blur transition-[box-shadow,transform] ${
        isDragging ? 'scale-[1.01] shadow-slate-900/20' : ''
      } ${className}`.trim()}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
    >
      <div onPointerDown={handlePointerDown} className={headerClasses}>
        <div className="flex flex-col gap-0.5">
          <span>{title}</span>
          {subtitle && <span className="text-[10px] font-normal tracking-[0.35em] text-slate-400">{subtitle}</span>}
        </div>
        <div className="flex items-center gap-1">
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={() => onToggleCollapsed(!collapsed)}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                tone === 'dark'
                  ? 'border-slate-700/80 bg-slate-800/70 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-200/80 bg-white/70 text-slate-500 hover:bg-slate-100'
              }`}
              aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {collapsed ? <Expand /> : <Minus />}
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                tone === 'dark'
                  ? 'border-slate-700/80 bg-slate-800/70 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-200/80 bg-white/70 text-slate-500 hover:bg-slate-100'
              }`}
              aria-label="Close panel"
            >
              <Close />
            </button>
          )}
        </div>
      </div>
      <div className={`px-5 pb-5 pt-4 transition-[max-height,opacity] ${collapsed ? 'max-h-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
        {!collapsed && children}
      </div>
    </div>
  );
};
