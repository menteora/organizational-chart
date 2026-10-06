/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OrgNode } from '../../types';
import { CATEGORY_STYLES } from '../../constants/initialData';
import { User, ShieldCheck } from 'lucide-react';

export interface NodeCardProps {
  node: OrgNode;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  showCategoryBadge?: boolean;
  density?: 'compact' | 'standard';
  backups?: OrgNode[];
  onBackupClick?: (backupNode: OrgNode) => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isHighlighted = false,
  isSelected = false,
  onClick,
  density = 'compact',
  backups = [],
  onBackupClick,
}) => {
  const style = CATEGORY_STYLES[node.category] || CATEGORY_STYLES.membro;

  // Generate initials for avatar
  const getInitials = (name: string | null): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const initials = getInitials(node.person);
  const isProcessOrDept = node.category === 'processo' || node.category === 'reparto';

  if (density === 'compact') {
    return (
      <div
        id={`node-${node.id}`}
        onClick={onClick}
        title={`${node.role}${node.person ? ` - ${node.person}` : ''} (ID: ${node.id})`}
        className={`
          relative group transition-all duration-150 cursor-pointer text-left
          ${isProcessOrDept ? 'w-[126px] sm:w-[136px]' : 'w-[130px] sm:w-[140px]'}
          rounded-lg border px-2 py-1.5 shadow-xs select-none
          ${style.bgLight} ${style.borderLight} ${style.textLight}
          ${style.bgDark} ${style.borderDark} ${style.textDark}
          ${isHighlighted ? 'ring-2 ring-indigo-500 shadow-sm bg-white dark:bg-slate-900 scale-102' : ''}
          ${isSelected ? 'ring-2 ring-blue-600 dark:ring-blue-400 shadow-sm' : 'hover:border-slate-400 dark:hover:border-slate-500'}
        `}
      >
        {/* Role title */}
        <div className="flex items-center justify-between gap-1">
          <div className="font-bold text-[10px] sm:text-[10.5px] leading-tight break-words">
            {node.role}
          </div>
          {node.category === 'backup' && (
            <span className="text-[8px] px-1 py-0.2 rounded-xs font-semibold uppercase tracking-tight bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 shrink-0">
              Backup
            </span>
          )}
        </div>

        {/* Person name if present */}
        {node.person && (
          <div className="mt-1 pt-1 border-t border-black/10 dark:border-white/10">
            <div className="text-[9.5px] sm:text-[10px] font-semibold text-slate-800 dark:text-slate-100 truncate">
              {node.person}
            </div>
            {node.details && (
              <div className="text-[8.5px] opacity-70 truncate italic mt-0.5">
                {node.details}
              </div>
            )}
          </div>
        )}

        {/* Option 1: Integrated Backup Badge / Chip */}
        {backups && backups.length > 0 && (
          <div className="mt-1 pt-1 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-1">
            {backups.map((b) => (
              <div
                key={b.id}
                onClick={(e) => {
                  if (onBackupClick) {
                    e.stopPropagation();
                    onBackupClick(b);
                  }
                }}
                title={`Ruolo di Backup / Sostituto: ${b.person || b.role}${b.person ? ` (${b.role})` : ''}`}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8.5px] font-semibold bg-amber-50/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/70 shadow-2xs hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold text-amber-800 dark:text-amber-300">Backup:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[95px]">
                  {b.person || b.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Standard mode
  return (
    <div
      id={`node-${node.id}`}
      onClick={onClick}
      title={`${node.role}${node.person ? ` - ${node.person}` : ''} (ID: ${node.id})`}
      className={`
        relative group transition-all duration-200 cursor-pointer text-left
        ${isProcessOrDept ? 'w-[155px] sm:w-[170px]' : 'w-[165px] sm:w-[180px]'}
        rounded-xl border p-2 sm:p-2.5 shadow-xs
        ${style.bgLight} ${style.borderLight} ${style.textLight}
        ${style.bgDark} ${style.borderDark} ${style.textDark}
        ${isHighlighted ? 'ring-3 ring-indigo-500 shadow-md scale-102 bg-white dark:bg-slate-900' : ''}
        ${isSelected ? 'ring-2 ring-blue-600 dark:ring-blue-400 shadow-md' : 'hover:shadow-sm hover:border-slate-400 dark:hover:border-slate-500'}
      `}
    >
      {/* Role Title */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="font-bold text-xs leading-snug break-words">
          {node.role}
        </div>
        {node.category === 'backup' && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-xs font-semibold uppercase tracking-tight bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 shrink-0">
            Backup
          </span>
        )}
      </div>

      {/* Person Name if present */}
      {node.person && (
        <div className="mt-1.5 pt-1.5 border-t border-black/10 dark:border-white/10 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-slate-900/10 dark:bg-white/15 flex items-center justify-center text-[10px] font-bold shrink-0">
            {initials || <User className="w-3 h-3" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-semibold truncate">
              {node.person}
            </div>
            {node.details && (
              <div className="text-[9.5px] opacity-75 truncate">
                {node.details}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Option 1: Integrated Backup Badge / Chip */}
      {backups && backups.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-1.5">
          {backups.map((b) => (
            <div
              key={b.id}
              onClick={(e) => {
                if (onBackupClick) {
                  e.stopPropagation();
                  onBackupClick(b);
                }
              }}
              title={`Ruolo di Backup / Sostituto: ${b.person || b.role}${b.person ? ` (${b.role})` : ''}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/70 shadow-2xs hover:bg-amber-100 dark:hover:bg-amber-900/80 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold text-amber-800 dark:text-amber-300">Backup:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[145px]">
                {b.person || b.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
