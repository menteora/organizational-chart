/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useOrganigram } from '../../context/OrganigramContext';
import { useTheme } from '../../context/ThemeContext';
import { formatSheetTabTitle } from '../../constants/initialData';
import { getTodayDateFormatted } from '../../utils/exportUtils';
import {
  Download,
  Upload,
  Moon,
  Sun,
  Search,
  X,
  Layers,
  FileCode,
  LayoutGrid,
  Users,
  Calendar,
  Tag,
  FolderArchive,
  Loader2,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  FilePlus,
} from 'lucide-react';

interface TopNavbarProps {
  onOpenExportModal: () => void;
  onOpenImportModal: () => void;
  onDownloadAllZip: () => void;
  isZipping?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenExportModal,
  onOpenImportModal,
  onDownloadAllZip,
  isZipping = false,
}) => {
  const {
    areas,
    activeAreaId,
    setActiveAreaId,
    addSheet,
    removeSheet,
    renameSheet,
    duplicateSheet,
    revision,
    setRevision,
    exportDate,
    setExportDate,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    stats,
  } = useOrganigram();

  const { theme, toggleTheme } = useTheme();
  const [isEditingRevision, setIsEditingRevision] = useState(false);
  const [tempRev, setTempRev] = useState(revision);
  const [tempDate, setTempDate] = useState(exportDate);

  // Sheet modals & menus state
  const [activeMenuSheetId, setActiveMenuSheetId] = useState<string | null>(null);
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [sheetToRename, setSheetToRename] = useState<{ id: string; title: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [sheetToDelete, setSheetToDelete] = useState<{ id: string; title: string } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close tab menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSheetId(null);
      }
    };
    if (activeMenuSheetId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeMenuSheetId]);

  const handleSaveRevision = () => {
    if (tempRev.trim()) {
      setRevision(tempRev.trim());
    }
    if (tempDate.trim()) {
      setExportDate(tempDate.trim());
    }
    setIsEditingRevision(false);
  };

  const handleOpenAddSheet = () => {
    const nextNumber = areas.length + 1;
    setNewSheetTitle(`Foglio ${nextNumber}`);
    setIsNewSheetModalOpen(true);
  };

  const handleConfirmAddSheet = (e?: React.FormEvent) => {
    e?.preventDefault();
    const createdId = addSheet(newSheetTitle);
    setIsNewSheetModalOpen(false);
    setNewSheetTitle('');
    setActiveAreaId(createdId);
  };

  const handleStartRename = (sheet: { id: string; title: string }) => {
    setSheetToRename(sheet);
    setRenameInput(formatSheetTabTitle(sheet.title));
    setActiveMenuSheetId(null);
  };

  const handleConfirmRename = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (sheetToRename && renameInput.trim()) {
      renameSheet(sheetToRename.id, renameInput.trim());
    }
    setSheetToRename(null);
    setRenameInput('');
  };

  const handleConfirmDelete = () => {
    if (sheetToDelete) {
      removeSheet(sheetToDelete.id);
      setSheetToDelete(null);
    }
  };

  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-20 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 space-y-2">
        
        {/* Row 1: Brand Identity, Revision info & Action Tools (Import, Export, Zip, Theme) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  Organigramma Aziendale
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTempRev(revision);
                    setTempDate(exportDate);
                    setIsEditingRevision(true);
                  }}
                  className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  title="Modifica Codice Revisione e Data"
                >
                  {revision.startsWith('REV.') ? revision : `REV.${revision}`}
                </button>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
                <span>{stats.totalRoles} posizioni</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setViewMode('people')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-dotted transition-colors"
                  title="Visualizza tutti i collaboratori nella Mappa Persone"
                >
                  {stats.uniquePeopleCount} collaboratori
                </button>
              </div>
            </div>
          </div>

          {/* Action Group: Import, Export, Download ZIP & Theme Toggle */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              title="Importa file Mermaid o Backup JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Importa</span>
            </button>

            <button
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              title="Opzioni complete di esportazione singola (PNG, SVG, Mermaid, JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Esporta</span>
            </button>

            <button
              type="button"
              onClick={onDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl shadow-xs transition-colors shrink-0"
              title="Scarica tutti i file .mmd e tutte le immagini PNG in un unico pacchetto ZIP"
            >
              {isZipping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FolderArchive className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">
                {isZipping ? 'Creazione...' : 'Scarica Tutto (.zip)'}
              </span>
              <span className="md:hidden font-mono text-[11px]">ZIP</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
              title={theme === 'dark' ? 'Passa al tema Giorno' : 'Passa al tema Notte'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>

        {/* Row 2 (Seconda riga della barra): Navigation Tabs, Area Selector & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          
          {/* Left / Center of Row 2: View Switchers and Process Area Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 py-0.5 min-w-0">
            {/* Main Navigation Segmented Control */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista Diagramma ad Albero"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Organigramma</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('people')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  viewMode === 'people'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Mappa Persone e Ruoli nei Processi Aziendali"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mappa Persone</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                  {stats.uniquePeopleCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('mermaid')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  viewMode === 'mermaid'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Codice e Live Renderer Mermaid"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Mermaid</span>
              </button>
            </div>

            {/* Sheet Tabs Bar (shown in Organigramma mode) */}
            {viewMode === 'cards' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0 max-w-full overflow-x-auto">
                {/* 'Tutti' View Tab */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveAreaId('all');
                    setActiveMenuSheetId(null);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all shrink-0 ${
                    activeAreaId === 'all'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Visualizza tutti i fogli insieme"
                >
                  Tutti i Fogli
                </button>

                {/* Individual Sheet Tabs */}
                {areas.map((area) => {
                  const isActive = activeAreaId === area.id;
                  const displayTitle = formatSheetTabTitle(area.title);
                  const isMenuOpen = activeMenuSheetId === area.id;

                  return (
                    <div key={area.id} className="relative flex items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAreaId(area.id);
                          setActiveMenuSheetId(null);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all shrink-0 ${
                          isActive
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title={`Foglio: ${displayTitle} (${area.nodes.length} posizioni)`}
                      >
                        <span>{displayTitle}</span>
                        {area.nodes.length > 0 && (
                          <span
                            className={`px-1 rounded-full text-[9px] font-mono ${
                              isActive
                                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {area.nodes.length}
                          </span>
                        )}
                      </button>

                      {/* Dropdown Options Trigger on Active Sheet */}
                      {isActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuSheetId(isMenuOpen ? null : area.id);
                          }}
                          className="p-1 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition-colors"
                          title="Opzioni foglio (Rinomina, Duplica, Elimina)"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      )}

                      {/* Sheet Context Menu */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1 min-w-[140px] text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <button
                            type="button"
                            onClick={() => handleStartRename(area)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Rinomina</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              duplicateSheet(area.id);
                              setActiveMenuSheetId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                          >
                            <Copy className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Duplica</span>
                          </button>
                          <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
                          <button
                            type="button"
                            onClick={() => {
                              setSheetToDelete(area);
                              setActiveMenuSheetId(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Elimina foglio</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* + Aggiungi Foglio Button */}
                <button
                  type="button"
                  onClick={handleOpenAddSheet}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors shrink-0"
                  title="Aggiungi nuovo foglio organigramma"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nuovo Foglio</span>
                </button>
              </div>
            )}
          </div>

          {/* Right of Row 2: Search Input in same row, fluid on mobile */}
          <div className="relative flex-1 sm:flex-initial min-w-[150px] w-full sm:w-60 lg:w-72">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca collaboratore o ruolo..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Quick Revision/Date Inline Modal */}
      {isEditingRevision && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                Revisione e Data Esportazione
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingRevision(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Codice Revisione (es. REV.07, REV.08)
                </label>
                <input
                  type="text"
                  value={tempRev}
                  onChange={(e) => setTempRev(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Data Formato YYYYMMDD (es. 20260624)
                  </label>
                  <button
                    type="button"
                    onClick={() => setTempDate(getTodayDateFormatted())}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Usa Data di Oggi
                  </button>
                </div>
                <input
                  type="text"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  placeholder="20260624"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  Questa data rappresenta l'emissione ufficiale della revisione e viene mantenuta come riferimento per tutti i file esportati.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                Nome file risultante:<br />
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  ORG_DIAGRAMMA_SUPPORTO_{tempRev || 'REV.07'}_{tempDate || '20260624'}.png
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditingRevision(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleSaveRevision}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Memorizza
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Aggiungi Nuovo Foglio */}
      {isNewSheetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmAddSheet}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-indigo-500" />
                Aggiungi Nuovo Foglio Organigramma
              </h3>
              <button
                type="button"
                onClick={() => setIsNewSheetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Nome del foglio (es. Supporto, Vendite, Amministrazione, Produzione)
              </label>
              <input
                type="text"
                autoFocus
                value={newSheetTitle}
                onChange={(e) => setNewSheetTitle(e.target.value)}
                placeholder="Nome del foglio..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Il nuovo foglio verrà creato vuoto e pronto per l'inserimento dei tuoi ruoli aziendali.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewSheetModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!newSheetTitle.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs"
              >
                Crea Foglio
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Rinomina Foglio */}
      {sheetToRename && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmRename}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                Rinomina Foglio Organigramma
              </h3>
              <button
                type="button"
                onClick={() => setSheetToRename(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Nuovo titolo per il foglio
              </label>
              <input
                type="text"
                autoFocus
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                placeholder="Nuovo titolo..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSheetToRename(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!renameInput.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs"
              >
                Salva Modifiche
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Conferma Eliminazione Foglio */}
      {sheetToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                Elimina Foglio Organigramma
              </h3>
              <button
                type="button"
                onClick={() => setSheetToDelete(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Sei sicuro di voler eliminare il foglio <strong className="text-slate-900 dark:text-white font-bold">{formatSheetTabTitle(sheetToDelete.title)}</strong>? Tutti i ruoli e collegamenti contenuti in questo foglio verranno rimossi.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSheetToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
