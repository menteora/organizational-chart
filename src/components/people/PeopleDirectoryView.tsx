/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useOrganigram } from '../../context/OrganigramContext';
import { extractPeopleDirectory, generatePeopleCsv, generatePeopleTextSummary } from '../../utils/peopleUtils';
import { PersonSummary, PersonAssignment } from '../../types';
import { formatSheetTabTitle } from '../../constants/initialData';
import {
  Users,
  Search,
  X,
  Filter,
  Layers,
  Building2,
  ExternalLink,
  Crown,
  UserCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  ListFilter,
  LayoutGrid,
  Table as TableIcon,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const PeopleDirectoryView: React.FC = () => {
  const { areas, navigateToNode, searchQuery, setSearchQuery } = useOrganigram();

  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [roleTypeFilter, setRoleTypeFilter] = useState<'all' | 'responsabile' | 'membro' | 'backup'>('all');
  const [onlyMultiRole, setOnlyMultiRole] = useState<boolean>(false);
  const [displayStyle, setDisplayStyle] = useState<'cards' | 'table'>('cards');
  const [copiedToast, setCopiedToast] = useState(false);

  // Extract all people mapped across all areas
  const allPeople = useMemo(() => {
    return extractPeopleDirectory(areas);
  }, [areas]);

  // Filter people based on search, area, role type, and multi-role
  const filteredPeople = useMemo(() => {
    return allPeople
      .map((person) => {
        // Filter assignments of this person
        let assignments = person.assignments;

        if (selectedAreaFilter !== 'all') {
          assignments = assignments.filter((a) => a.areaId === selectedAreaFilter || a.areaKey === selectedAreaFilter);
        }

        if (roleTypeFilter !== 'all') {
          assignments = assignments.filter((a) => a.category === roleTypeFilter);
        }

        return {
          ...person,
          assignments,
        };
      })
      .filter((person) => {
        // Must have at least one matching assignment after area/role filters
        if (person.assignments.length === 0) return false;

        // Multi-role filter: check original totalRoles or current assignments
        if (onlyMultiRole && person.totalRoles <= 1) return false;

        // Search text matching (person name, role name, department name, or area title)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = person.name.toLowerCase().includes(q);
          const matchRole = person.assignments.some(
            (a) =>
              a.role.toLowerCase().includes(q) ||
              a.departmentName.toLowerCase().includes(q) ||
              a.areaTitle.toLowerCase().includes(q) ||
              (a.details && a.details.toLowerCase().includes(q))
          );
          return matchName || matchRole;
        }

        return true;
      });
  }, [allPeople, selectedAreaFilter, roleTypeFilter, onlyMultiRole, searchQuery]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const totalPeopleCount = allPeople.length;
    const multiRoleCount = allPeople.filter((p) => p.totalRoles > 1).length;
    const multiAreaCount = allPeople.filter((p) => p.areasCount > 1).length;
    const leadersCount = allPeople.filter((p) => p.hasResponsibleRole).length;
    const totalAssignmentsCount = allPeople.reduce((sum, p) => sum + p.totalRoles, 0);

    return {
      totalPeopleCount,
      multiRoleCount,
      multiAreaCount,
      leadersCount,
      totalAssignmentsCount,
    };
  }, [allPeople]);

  const handleCopySummary = async () => {
    try {
      const summaryText = generatePeopleTextSummary(filteredPeople);
      await navigator.clipboard.writeText(summaryText);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch {
      alert('Impossibile copiare negli appunti.');
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = generatePeopleCsv(filteredPeople);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mappa_persone_organigramma_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAreaColorClasses = (areaKey: string) => {
    switch (areaKey.toUpperCase()) {
      case 'SUPPORTO':
        return {
          badge: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          dot: 'bg-purple-500',
        };
      case 'STRATEGICI':
        return {
          badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
      case 'CORE':
        return {
          badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500',
        };
      default:
        return {
          badge: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          dot: 'bg-indigo-500',
        };
    }
  };

  const getRoleCategoryBadge = (category: string) => {
    switch (category) {
      case 'responsabile':
        return {
          label: 'Leader / Responsabile',
          className: 'bg-[#ffe6cc] dark:bg-amber-950/50 text-[#8f5200] dark:text-amber-300 border border-[#d79b00]/60',
          icon: <Crown className="w-3 h-3 text-amber-600 shrink-0" />,
        };
      case 'backup':
        return {
          label: 'Ruolo di Backup',
          className: 'bg-[#f5f5f5] dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-dashed border-[#666666]/70',
          icon: <ShieldAlert className="w-3 h-3 text-slate-500 shrink-0" />,
        };
      default:
        return {
          label: 'Membro / Ruolo Operativo',
          className: 'bg-[#fff2cc] dark:bg-yellow-950/50 text-[#7a6000] dark:text-yellow-300 border border-[#d6b656]/60',
          icon: <UserCheck className="w-3 h-3 text-yellow-600 shrink-0" />,
        };
    }
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50/70 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Compact Unified Header & Stats Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                Mappa Collaboratori & Ruoli
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate">
                Visualizza la presenza di ciascuna persona nei processi e reparti aziendali
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Collaboratori:</span>
              <span className="font-bold text-slate-900 dark:text-white">{overallStats.totalPeopleCount}</span>
            </div>

            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span className="text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1">
                <span>Multi-Ruolo:</span>
                <Sparkles className="w-3 h-3 text-indigo-500" />
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{overallStats.multiRoleCount}</span>
            </div>

            <div className="hidden md:flex px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span className="text-purple-700 dark:text-purple-300 font-medium">Multi-Area:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{overallStats.multiAreaCount}</span>
            </div>

            <div className="hidden sm:flex px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">Responsabili:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">{overallStats.leadersCount}</span>
            </div>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Filter Pills: Organigram Area */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                <ListFilter className="w-3.5 h-3.5" />
                <span>Area:</span>
              </span>

              <button
                type="button"
                onClick={() => setSelectedAreaFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedAreaFilter === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Tutti
              </button>

              {areas.map((area) => {
                const colors = getAreaColorClasses(area.key);
                const isActive = selectedAreaFilter === area.id || selectedAreaFilter === area.key;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedAreaFilter(isActive ? 'all' : area.id)}
                    className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? `${colors.badge} font-bold shadow-xs`
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    <span>{formatSheetTabTitle(area.title)}</span>
                  </button>
                );
              })}

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

              {/* Role Type Filter Pills */}
              <button
                type="button"
                onClick={() => setRoleTypeFilter(roleTypeFilter === 'responsabile' ? 'all' : 'responsabile')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  roleTypeFilter === 'responsabile'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Responsabili
              </button>

              <button
                type="button"
                onClick={() => setRoleTypeFilter(roleTypeFilter === 'backup' ? 'all' : 'backup')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  roleTypeFilter === 'backup'
                    ? 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-700 dark:text-white font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Ruoli Backup
              </button>

              <button
                type="button"
                onClick={() => setOnlyMultiRole(!onlyMultiRole)}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                  onlyMultiRole
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-700 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Multi-Ruolo</span>
              </button>
            </div>

            {/* View Selector & Export Tools */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
              {/* Display Style Toggle (Cards vs Table) */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => setDisplayStyle('cards')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    displayStyle === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Vista Schede Collaboratore"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Schede</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayStyle('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    displayStyle === 'table'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Vista Tabella Completa"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tabella</span>
                </button>
              </div>

              {/* Copy Summary Button */}
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="Copia riepilogo testuale negli appunti"
              >
                {copiedToast ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiato!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Copia Elenco</span>
                  </>
                )}
              </button>

              {/* Download CSV Button */}
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
                title="Scarica foglio Excel / CSV con tutte le posizioni"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Scarica CSV</span>
                <span className="sm:hidden font-mono text-[11px]">CSV</span>
              </button>
            </div>
          </div>

          {/* Filter Pills Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <ListFilter className="w-3.5 h-3.5" />
              <span>Filtra per Organigramma:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedAreaFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedAreaFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Tutti gli Organigrammi
            </button>

            {areas.map((area) => {
              const colors = getAreaColorClasses(area.key);
              const isActive = selectedAreaFilter === area.id || selectedAreaFilter === area.key;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setSelectedAreaFilter(isActive ? 'all' : area.id)}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? `${colors.badge} font-bold shadow-xs`
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <span>{area.title}</span>
                </button>
              );
            })}

            {/* Role Type Filter Dropdown / Pills */}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setRoleTypeFilter(roleTypeFilter === 'responsabile' ? 'all' : 'responsabile')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  roleTypeFilter === 'responsabile'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Solo Responsabili
              </button>

              <button
                type="button"
                onClick={() => setRoleTypeFilter(roleTypeFilter === 'backup' ? 'all' : 'backup')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  roleTypeFilter === 'backup'
                    ? 'bg-slate-200 text-slate-900 border-slate-400 dark:bg-slate-700 dark:text-white font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Solo Ruoli Backup
              </button>

              <button
                type="button"
                onClick={() => setOnlyMultiRole(!onlyMultiRole)}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors flex items-center gap-1 ${
                  onlyMultiRole
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-700 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Solo Multi-Ruolo ({'>'}1)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Counter and Quick Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <div>
            Trovati <strong className="text-slate-800 dark:text-slate-200 font-semibold">{filteredPeople.length}</strong>{' '}
            collaboratori (su {allPeople.length} totali)
          </div>
          {(selectedAreaFilter !== 'all' || roleTypeFilter !== 'all' || onlyMultiRole || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedAreaFilter('all');
                setRoleTypeFilter('all');
                setOnlyMultiRole(false);
                setSearchQuery('');
              }}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Azzera tutti i filtri
            </button>
          )}
        </div>

        {/* Content Area: Cards Style */}
        {displayStyle === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredPeople.map((person) => {
              const isMultiArea = person.areasCount > 1;
              const isMultiRole = person.totalRoles > 1;

              // Generate initials for avatar
              const initials = person.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={person.normalizedName}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
                >
                  {/* Person Card Top Header */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                            isMultiArea
                              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                              : isMultiRole
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                            {person.name}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {person.totalRoles} {person.totalRoles === 1 ? 'ruolo' : 'ruoli'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {person.areasCount}{' '}
                              {person.areasCount === 1 ? 'organigramma' : 'organigrammi'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Multi-Area Pill if present */}
                      {isMultiArea && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                          Trasversale
                        </span>
                      )}
                    </div>
                  </div>

                  {/* List of Placements / Assignments inside the different organigrams */}
                  <div className="p-4 sm:p-5 flex-1 space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Posizioni Assegnate ({person.assignments.length}):
                    </div>

                    <div className="space-y-2.5">
                      {person.assignments.map((asg) => {
                        const areaColor = getAreaColorClasses(asg.areaKey);
                        const roleStyle = getRoleCategoryBadge(asg.category);

                        return (
                          <div
                            key={`${asg.areaId}-${asg.nodeId}`}
                            className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors space-y-2"
                          >
                            {/* Area and Department Row */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border flex items-center gap-1.5 ${areaColor.badge}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${areaColor.dot}`} />
                                <span className="truncate">{asg.areaTitle}</span>
                              </span>

                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {asg.departmentName}
                                </span>
                              </div>
                            </div>

                            {/* Role Title */}
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {asg.role}
                              </div>
                              {asg.details && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                  {asg.details}
                                </div>
                              )}
                            </div>

                            {/* Role Category Badge & Navigate Action */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold flex items-center gap-1 ${roleStyle.className}`}
                              >
                                {roleStyle.icon}
                                <span>{roleStyle.label}</span>
                              </span>

                              {/* Interactive Navigate Button */}
                              <button
                                type="button"
                                onClick={() => navigateToNode(asg.areaId, asg.nodeId)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors shrink-0"
                                title={`Vai al nodo "${asg.role}" nell'organigramma ${asg.areaTitle}`}
                              >
                                <span>Vedi nel diagramma</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Area: Table Style */}
        {displayStyle === 'table' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Collaboratore</th>
                    <th className="px-4 py-3">Organigramma / Area</th>
                    <th className="px-4 py-3">Reparto</th>
                    <th className="px-4 py-3">Ruolo Assegnato</th>
                    <th className="px-4 py-3">Tipologia</th>
                    <th className="px-4 py-3">Superiore Diretto</th>
                    <th className="px-4 py-3 text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredPeople.flatMap((person) =>
                    person.assignments.map((asg, idx) => {
                      const areaColor = getAreaColorClasses(asg.areaKey);
                      const roleStyle = getRoleCategoryBadge(asg.category);

                      return (
                        <tr
                          key={`${person.normalizedName}-${asg.areaId}-${asg.nodeId}-${idx}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span>{person.name}</span>
                              {person.totalRoles > 1 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                  {person.totalRoles} ruoli
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border inline-flex items-center gap-1.5 ${areaColor.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${areaColor.dot}`} />
                              <span>{asg.areaTitle}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {asg.departmentName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                            <div>{asg.role}</div>
                            {asg.details && (
                              <div className="text-[10px] text-slate-400 italic">{asg.details}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold inline-flex items-center gap-1 ${roleStyle.className}`}
                            >
                              {roleStyle.icon}
                              <span>{roleStyle.label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                            {asg.superiorName || '—'}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => navigateToNode(asg.areaId, asg.nodeId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                              title="Visualizza nel diagramma ad albero"
                            >
                              <span>Vedi</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPeople.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nessun collaboratore trovato
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Nessuna persona corrisponde ai criteri di ricerca e ai filtri attualmente impostati.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedAreaFilter('all');
                setRoleTypeFilter('all');
                setOnlyMultiRole(false);
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Reimposta filtri di ricerca
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
