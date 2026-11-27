import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

interface HintTooltipProps {
  /** Text shown in the bubble. Also exposed to assistive tech via aria-describedby. */
  content: ReactNode;
  /** Where the bubble opens relative to its anchor. */
  placement?: 'bottom' | 'top';
  /** Extra class on the wrapper, for layout tweaks at the call site. */
  className?: string;
  /** Content has links or buttons: keep it open while hovered and drop role="tooltip". */
  interactive?: boolean;
  /** Render the trigger. Spread `describedBy` onto the focusable element as aria-describedby. */
  children: (describedBy: string) => ReactNode;
}

/**
 * Lightweight tooltip: opens on mouse hover and keyboard focus, toggles on touch tap,
 * and closes on Escape, blur, mouse leave, or a tap elsewhere.
 */
export function HintTooltip({
  content,
  placement = 'bottom',
  className,
  interactive = false,
  children,
}: HintTooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className={className ? `tooltip-anchor ${className}` : 'tooltip-anchor'}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
      onPointerUp={(e) => {
        if (e.pointerType === 'mouse' || bubbleRef.current?.contains(e.target as Node)) return;
        setOpen((o) => !o);
      }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      {children(id)}
      <span
        ref={bubbleRef}
        id={id}
        role={interactive ? undefined : 'tooltip'}
        className={`tooltip-bubble tooltip-${placement}${interactive ? ' tooltip-interactive' : ''}`}
        data-open={open ? 'true' : 'false'}
      >
        {content}
      </span>
    </span>
  );
}
