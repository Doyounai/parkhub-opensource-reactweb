import React from 'react';

// ── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className={`flex-1 flex flex-col ${noPadding ? '' : 'p-5'}`}>
        {children}
      </div>
    </div>
  );
};

// ── CardHeader ────────────────────────────────────────────────────────────────
interface CardHeaderProps {
  /** Optional 10px uppercase section label shown above the title in steel-blue */
  section?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ section, title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex items-start justify-between border-b border-slate-100 pb-4 mb-4 ${className}`}>
      <div className="flex-1 min-w-0">
        {section && (
          <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-blue-500 mb-1">
            {section}
          </p>
        )}
        <h3 className="text-[15px] font-semibold text-slate-800 leading-tight m-0">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5 mb-0 leading-snug">{subtitle}</p>
        )}
      </div>
      {action && <div className="ml-3 flex-shrink-0">{action}</div>}
    </div>
  );
};

// ── CardDivider ───────────────────────────────────────────────────────────────
export const CardDivider: React.FC = () => (
  <div className="border-t border-slate-100 my-4" />
);

export default { Card, CardHeader, CardDivider };

