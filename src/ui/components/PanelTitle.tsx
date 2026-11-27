import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Card heading with its icon on the left. Every panel title goes through this. */
export function PanelTitle({
  icon: Icon,
  id,
  children,
}: {
  icon: LucideIcon;
  id?: string;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="panel-title">
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </h2>
  );
}
