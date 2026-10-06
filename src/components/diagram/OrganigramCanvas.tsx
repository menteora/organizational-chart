/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useMemo } from 'react';
import { OrgArea, OrgNode, OrgLink, LayoutOrientation, LayoutDensity } from '../../types';
import { NodeCard } from './NodeCard';
import { useOrganigram } from '../../context/OrganigramContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  Copy,
  Check,
  ArrowRight,
  ArrowDown,
  Layers,
  FileText,
  ShieldCheck,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  Upload,
  Sparkles,
} from 'lucide-react';
import {
  copyElementAsPngToClipboard,
  exportElementAsPng,
  formatExportFileName,
} from '../../utils/exportUtils';
import { AddNodeModal } from './AddNodeModal';
import { formatSheetTabTitle } from '../../constants/initialData';

interface OrganigramCanvasProps {
  exportRef: React.RefObject<HTMLDivElement | null>;
  onOpenExportModal: () => void;
  onOpenImportModal?: () => void;
}

export const OrganigramCanvas: React.FC<OrganigramCanvasProps> = ({
  exportRef,
  onOpenExportModal,
  onOpenImportModal,
}) => {
  const {
    areas,
    activeAreaId,
    activeArea,
    searchQuery,
    selectedNode,
    setSelectedNode,
    revision,
    exportDate,
    layoutOrientation,
    setLayoutOrientation,
    density,
    setDensity,
    loadDemoData,
  } = useOrganigram();

  const { theme } = useTheme();

  const [zoom, setZoom] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState<boolean>(false);
  const [isAddNodeOpen, setIsAddNodeOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeAreasToDisplay: OrgArea[] = useMemo(() => {
    if (activeAreaId === 'all') {
      return areas;
    }
    const found = areas.find((a) => a.id === activeAreaId);
    return found ? [found] : areas;
  }, [areas, activeAreaId]);

  // Check if a node matches search query
  const isNodeMatching = (node: OrgNode): boolean => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase().trim();
    return (
      node.role.toLowerCase().includes(q) ||
      (node.person?.toLowerCase().includes(q) ?? false) ||
      (node.details?.toLowerCase().includes(q) ?? false) ||
      node.id.toLowerCase().includes(q)
    );
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(Math.max(0.3, Number((prev + delta).toFixed(2))), 2.0));
  };

  const resetZoom = () => setZoom(1);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const handleQuickCopy = async () => {
    if (!exportRef.current) return;
    try {
      setIsCopying(true);
      const copied = await copyElementAsPngToClipboard(exportRef.current, 2, theme === 'dark');
      if (copied) {
        setCopyFeedback('Immagine copiata negli appunti! Incolla con Ctrl+V nel tuo documento.');
      } else {
        const fname = formatExportFileName(
          activeArea?.key || 'COMPLETO',
          revision,
          exportDate,
          'png'
        );
        await exportElementAsPng(exportRef.current, fname, 2, theme === 'dark');
        setCopyFeedback(`Immagine salvata: ${fname}`);
      }
    } catch (e) {
      console.error('Copy/export failed', e);
      setCopyFeedback('Errore durante la generazione dell\'immagine');
    } finally {
      setIsCopying(false);
      setTimeout(() => setCopyFeedback(null), 4500);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full bg-slate-100/70 dark:bg-slate-950 overflow-hidden flex flex-col select-none"
    >
      {/* Toast Notification */}
      {copyFeedback && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Canvas Sub-Bar Controls strip (directly under the navbar and organigramma button) */}
      <div
        data-exclude-export="true"
        className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-4 py-1.5 shrink-0 z-20 shadow-2xs"
      >
        {/* Mobile Header Bar: Summary & Toggle */}
        <div className="flex sm:hidden items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIsMobileControlsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>Controlli vista ({layoutOrientation === 'LR' ? 'Orizzontale' : 'Verticale'})</span>
            {isMobileControlsOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <div className="flex items-center gap-1.5">
            {/* Quick Add Node on mobile */}
            <button
              type="button"
              onClick={() => setIsAddNodeOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Aggiungi posizione"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi</span>
            </button>

            {/* Quick 1-click copy always accessible on mobile */}
            <button
              type="button"
              onClick={handleQuickCopy}
              disabled={isCopying}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Copia immagine"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copia</span>
            </button>

            {/* Quick Export on mobile */}
            <button
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              title="Esporta"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta</span>
            </button>
          </div>
        </div>

        {/* Controls Container: always visible on sm+, expandable on mobile */}
        <div
          className={`
            ${isMobileControlsOpen ? 'flex' : 'hidden sm:flex'}
            flex-wrap items-center justify-between gap-2 pt-1.5 sm:pt-0 mt-1 sm:mt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800
          `}
        >
          {/* Left side: Orientation, Density, and Copy */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Add Node button */}
            <button
              type="button"
              onClick={() => setIsAddNodeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0"
              title="Aggiungi una nuova posizione, reparto o responsabile al foglio corrente"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi Posizione</span>
            </button>

            {/* Orientation switch */}
            <button
              type="button"
              onClick={() => setLayoutOrientation(layoutOrientation === 'LR' ? 'TB' : 'LR')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                layoutOrientation === 'LR'
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/70 dark:border-indigo-800/70'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200/70 dark:border-slate-700'
              }`}
              title={
                layoutOrientation === 'LR'
                  ? 'Disposizione Orizzontale (Sinistra ➔ Destra)'
                  : 'Disposizione Verticale (Dall\'alto in basso)'
              }
            >
              {layoutOrientation === 'LR' ? (
                <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
              )}
              <span>{layoutOrientation === 'LR' ? 'Orizzontale' : 'Verticale'}</span>
            </button>

            {/* Density switch */}
            <button
              type="button"
              onClick={() => setDensity(density === 'compact' ? 'standard' : 'compact')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                density === 'compact'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/70 dark:border-emerald-800/70'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border border-slate-200/70 dark:border-slate-700'
              }`}
              title={
                density === 'compact'
                  ? 'Modalità compatta attiva'
                  : 'Modalità estesa attiva'
              }
            >
              {density === 'compact' ? (
                <Minimize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{density === 'compact' ? 'Compatta' : 'Standard'}</span>
            </button>

            {/* Desktop Copy button */}
            <button
              type="button"
              onClick={handleQuickCopy}
              disabled={isCopying}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 ml-1"
              title="Copia immagine ad alta risoluzione negli appunti (per incollarla in Word, PowerPoint o Google Docs)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copia Immagine</span>
            </button>
          </div>

          {/* Right side: Zoom controls & Desktop Export button */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors shrink-0"
              title="Riduci Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] sm:text-xs font-mono font-medium px-1 min-w-[36px] text-center select-none text-slate-700 dark:text-slate-300 shrink-0">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors shrink-0"
              title="Aumenta Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors shrink-0"
              title="Reimposta Zoom 100%"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:inline-flex p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors shrink-0"
              title={isFullscreen ? 'Esci da schermo intero' : 'Schermo Intero'}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Desktop Export button */}
            <button
              type="button"
              onClick={onOpenExportModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 ml-1"
              title="Opzioni complete di esportazione (PNG, SVG, Mermaid, JSON)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Esporta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Pan/Zoom Canvas Area */}
      <div className="flex-1 w-full h-full overflow-auto p-4 sm:p-6 flex justify-center items-start">
        <div
          ref={exportRef}
          id="organigramma-export-target"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className={`
            bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm inline-block w-fit
            ${
              density === 'compact'
                ? 'p-3 sm:p-4 rounded-xl min-w-[700px]'
                : 'p-5 sm:p-6 rounded-2xl min-w-[800px]'
            }
          `}
        >
          {/* Render Area(s) */}
          <div className={density === 'compact' ? 'space-y-6' : 'space-y-10'}>
            {activeAreasToDisplay.map((area) =>
              layoutOrientation === 'LR' ? (
                <AreaDiagramSectionLR
                  key={area.id}
                  area={area}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  isNodeMatching={isNodeMatching}
                  density={density}
                  onOpenAddNode={() => setIsAddNodeOpen(true)}
                  onOpenImportModal={onOpenImportModal}
                  onLoadDemoData={loadDemoData}
                />
              ) : (
                <AreaDiagramSectionTB
                  key={area.id}
                  area={area}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  isNodeMatching={isNodeMatching}
                  density={density}
                  onOpenAddNode={() => setIsAddNodeOpen(true)}
                  onOpenImportModal={onOpenImportModal}
                  onLoadDemoData={loadDemoData}
                />
              )
            )}
          </div>

          {/* Legend and Footer metadata on Bottom - excluded from exports */}
          <div
            data-exclude-export="true"
            className={`
              no-export border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px]
              ${density === 'compact' ? 'mt-6 pt-3' : 'mt-10 pt-5'}
            `}
          >
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[9.5px]">
                Legenda:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#e1d5e7] border border-[#9673a6]" />
                <span className="text-slate-700 dark:text-slate-300">Macro Processo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#f8cecc] border border-[#b85450]" />
                <span className="text-slate-700 dark:text-slate-300">Reparto / Unità</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#ffe6cc] border border-[#d79b00]" />
                <span className="text-slate-700 dark:text-slate-300">Responsabile / Leader</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#fff2cc] border border-[#d6b656]" />
                <span className="text-slate-700 dark:text-slate-300">Membro / Ruolo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#f5f5f5] border border-dashed border-[#666666]" />
                <span className="text-slate-700 dark:text-slate-300">Ruolo di Backup</span>
              </div>
            </div>

            <div
              data-exclude-export="true"
              className="no-export text-[10px] text-slate-400 dark:text-slate-500 font-mono"
            >
              ORG_DIAGRAMMA_{activeArea?.key || 'COMPLETO'}_{revision}_{exportDate}
            </div>
          </div>
        </div>
      </div>

      {/* Add Node Modal */}
      <AddNodeModal
        isOpen={isAddNodeOpen}
        onClose={() => setIsAddNodeOpen(false)}
      />
    </div>
  );
};

/* =========================================================================
   PROCESS TITLE BANNER COMPONENT
   ========================================================================= */

interface ProcessTitleBannerProps {
  node: OrgNode;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  density: LayoutDensity;
}

export const ProcessTitleBanner: React.FC<ProcessTitleBannerProps> = ({
  node,
  isSelected,
  isHighlighted,
  onClick,
  density,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-5 py-1.5 sm:px-6 sm:py-2 rounded-xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer shadow-2xs group
        bg-gradient-to-r from-purple-100/90 via-purple-50 to-indigo-100/80 dark:from-purple-950/70 dark:via-purple-900/40 dark:to-indigo-950/60
        border-purple-300/90 dark:border-purple-700/80 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-xs
        ${isSelected ? 'ring-2 ring-purple-600 dark:ring-purple-400 ring-offset-2 dark:ring-offset-slate-900' : ''}
        ${isHighlighted ? 'ring-2 ring-amber-400' : ''}
      `}
      title="Clicca per visualizzare o modificare il processo"
    >
      <div className="flex items-center gap-2 justify-center">
        <Layers className="w-4 h-4 text-purple-700 dark:text-purple-300 shrink-0" />
        <span
          className={`
            font-extrabold uppercase tracking-wide text-purple-950 dark:text-purple-100
            ${density === 'compact' ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}
          `}
        >
          {node.role}
        </span>
      </div>
      {node.person && (
        <span className="text-[11px] sm:text-xs font-semibold text-purple-800 dark:text-purple-300 mt-0.5">
          ({node.person}{node.details ? `, ${node.details}` : ''})
        </span>
      )}
    </button>
  );
};

/* =========================================================================
   LEFT-TO-RIGHT (LR) COMPACT DIAGRAM SECTION (Favoured for Document Insertion)
   ========================================================================= */

export interface AreaDiagramSectionProps {
  area: OrgArea;
  selectedNode: OrgNode | null;
  onSelectNode: (node: OrgNode | null) => void;
  isNodeMatching: (node: OrgNode) => boolean;
  density: LayoutDensity;
  onOpenAddNode?: () => void;
  onOpenImportModal?: () => void;
  onLoadDemoData?: () => void;
}

export const AreaDiagramSectionLR: React.FC<AreaDiagramSectionProps> = ({
  area,
  selectedNode,
  onSelectNode,
  isNodeMatching,
  density,
  onOpenAddNode,
  onOpenImportModal,
  onLoadDemoData,
}) => {
  // Empty State if area has 0 nodes
  if (area.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3.5 max-w-lg mx-auto bg-slate-50/60 dark:bg-slate-900/40">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Foglio Vuoto ({formatSheetTabTitle(area.title)})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Questo organigramma non contiene ancora ruoli o persone. Inizia inserendo la prima posizione o importa i tuoi dati.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {onOpenAddNode && (
            <button
              type="button"
              onClick={onOpenAddNode}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Prima Posizione / Reparto</span>
            </button>
          )}
          {onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importa File</span>
            </button>
          )}
          {onLoadDemoData && (
            <button
              type="button"
              onClick={onLoadDemoData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Carica Esempio Demo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Find root node
  const rootNode = area.nodes.find((n) => n.id === area.rootNodeId) || area.nodes[0];

  // Find level 1 nodes (Reparti/Direct children of root node)
  const directRepartiIds = useMemo(() => {
    return area.links
      .filter((l) => l.source === rootNode?.id && l.linkType === 'standard')
      .map((l) => l.target);
  }, [area.links, rootNode?.id]);

  const repartiNodes = useMemo(() => {
    const fromLinks = area.nodes.filter((n) => directRepartiIds.includes(n.id));
    if (fromLinks.length > 0) return fromLinks;
    const deptNodes = area.nodes.filter((n) => n.category === 'reparto' && n.id !== rootNode?.id);
    if (deptNodes.length > 0) return deptNodes;
    return area.nodes.filter((n) => n.id !== rootNode?.id);
  }, [area.nodes, directRepartiIds, rootNode?.id]);

  // Find backup connections
  const backupLinks = useMemo(() => {
    return area.links.filter((l) => l.linkType === 'backup');
  }, [area.links]);

  const rootBackups = useMemo(() => {
    if (!rootNode) return [];
    return area.links
      .filter((l) => l.source === rootNode.id && l.linkType === 'backup')
      .map((l) => area.nodes.find((n) => n.id === l.target))
      .filter(Boolean) as OrgNode[];
  }, [area.links, area.nodes, rootNode]);

  return (
    <div className="space-y-3">
      {/* Root Process Title at Top - pure title banner without connector dash */}
      {rootNode && (
        <div className="flex flex-col items-center mb-2.5">
          <ProcessTitleBanner
            node={rootNode}
            isSelected={selectedNode?.id === rootNode.id}
            isHighlighted={isNodeMatching(rootNode)}
            onClick={() => onSelectNode(rootNode)}
            density={density}
          />
        </div>
      )}

      {/* Departments Rows */}
      <div className="flex flex-col gap-2 relative">
        {repartiNodes.map((deptNode) => (
          <div key={deptNode.id} className="relative">
            {/* Department Container Card */}
            <div className="p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-visible shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <TreeBranchLR
                parentNode={deptNode}
                area={area}
                selectedNode={selectedNode}
                onSelectNode={onSelectNode}
                isNodeMatching={isNodeMatching}
                density={density}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   AUTHENTIC TREE BRANCH RECURSIVE COMPONENT (LR HORIZONTAL FORK)
   ========================================================================= */

interface TreeBranchLRProps {
  parentNode: OrgNode;
  area: OrgArea;
  selectedNode: OrgNode | null;
  onSelectNode: (node: OrgNode | null) => void;
  isNodeMatching: (node: OrgNode) => boolean;
  density: LayoutDensity;
  visited?: Set<string>;
}

const TreeBranchLR: React.FC<TreeBranchLRProps> = ({
  parentNode,
  area,
  selectedNode,
  onSelectNode,
  isNodeMatching,
  density,
  visited = new Set(),
}) => {
  const currentVisited = useMemo(
    () => new Set([...visited, parentNode.id]),
    [visited, parentNode.id]
  );

  // Find standard direct child nodes of parentNode
  const directChildren = useMemo(() => {
    const childLinks = area.links.filter(
      (l) => l.source === parentNode.id && l.linkType === 'standard'
    );
    return area.nodes.filter(
      (n) => childLinks.some((l) => l.target === n.id) && !visited.has(n.id)
    );
  }, [area.links, area.nodes, parentNode.id, visited]);

  // Find backup connections for parentNode (Option 1: Integrated in card)
  const parentBackups = useMemo(() => {
    return area.links
      .filter((l) => l.source === parentNode.id && l.linkType === 'backup')
      .map((l) => area.nodes.find((n) => n.id === l.target))
      .filter(Boolean) as OrgNode[];
  }, [area.links, area.nodes, parentNode.id]);

  return (
    <div className="flex items-center shrink-0">
      {/* Current Parent Node Card */}
      <div className="shrink-0 z-10">
        <NodeCard
          node={parentNode}
          isSelected={selectedNode?.id === parentNode.id}
          isHighlighted={isNodeMatching(parentNode)}
          onClick={() => onSelectNode(parentNode)}
          density={density}
          backups={parentBackups}
          onBackupClick={(bNode) => onSelectNode(bNode)}
        />
      </div>

      {/* If parent has branches/subordinates: draw stem, fork, and subtrees */}
      {directChildren.length > 0 && (
        <div className="flex items-center shrink-0">
          {/* Horizontal Stem from parent right edge to the branch rail */}
          <div className={`${density === 'compact' ? 'w-2 sm:w-2.5' : 'w-3 sm:w-3.5'} h-[2px] bg-slate-300 dark:bg-slate-600 shrink-0`} />

          {/* Children Vertical Column / Fork */}
          <div className="flex flex-col justify-center relative">
            {directChildren.map((childNode, index) => {
              const isFirst = index === 0;
              const isLast = index === directChildren.length - 1;
              const isOnly = directChildren.length === 1;

              return (
                <div
                  key={childNode.id}
                  className={`flex items-center relative ${
                    density === 'compact' ? 'pl-2 sm:pl-2.5 py-0.5' : 'pl-3 sm:pl-3.5 py-1'
                  }`}
                >
                  {/* Vertical Rail for the fork */}
                  {!isOnly && (
                    <div
                      className={`absolute left-0 w-[2px] bg-slate-300 dark:bg-slate-600 ${
                        isFirst
                          ? 'top-1/2 bottom-0 rounded-tl'
                          : isLast
                          ? 'top-0 bottom-1/2 rounded-bl'
                          : 'top-0 bottom-0'
                      }`}
                    />
                  )}

                  {/* Horizontal arm towards the child card */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 ${density === 'compact' ? 'w-2 sm:w-2.5' : 'w-3 sm:w-3.5'} h-[2px] bg-slate-300 dark:bg-slate-600`} />

                  {/* Subtle right arrowhead */}
                  <div className={`absolute ${density === 'compact' ? 'left-[6px] sm:left-[8px]' : 'left-[9px] sm:left-[11px]'} top-1/2 -translate-y-1/2 w-0 h-0 border-y-[2.5px] border-y-transparent border-l-[3.5px] border-l-slate-400 dark:border-l-slate-500`} />

                  {/* Recursive child subtree */}
                  <TreeBranchLR
                    parentNode={childNode}
                    area={area}
                    selectedNode={selectedNode}
                    onSelectNode={onSelectNode}
                    isNodeMatching={isNodeMatching}
                    density={density}
                    visited={currentVisited}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   TOP-TO-BOTTOM (TB) VERTICAL DIAGRAM SECTION (Alternative Vertical View)
   ========================================================================= */

export const AreaDiagramSectionTB: React.FC<AreaDiagramSectionProps> = ({
  area,
  selectedNode,
  onSelectNode,
  isNodeMatching,
  density,
  onOpenAddNode,
  onOpenImportModal,
  onLoadDemoData,
}) => {
  // Empty State if area has 0 nodes
  if (area.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center space-y-3.5 max-w-lg mx-auto bg-slate-50/60 dark:bg-slate-900/40">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Foglio Vuoto ({formatSheetTabTitle(area.title)})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Questo organigramma non contiene ancora ruoli o persone. Inizia inserendo la prima posizione o importa i tuoi dati.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {onOpenAddNode && (
            <button
              type="button"
              onClick={onOpenAddNode}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Prima Posizione / Reparto</span>
            </button>
          )}
          {onOpenImportModal && (
            <button
              type="button"
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importa File</span>
            </button>
          )}
          {onLoadDemoData && (
            <button
              type="button"
              onClick={onLoadDemoData}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Carica Esempio Demo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const rootNode = area.nodes.find((n) => n.id === area.rootNodeId) || area.nodes[0];

  const directRepartiIds = useMemo(() => {
    return area.links
      .filter((l) => l.source === rootNode?.id && l.linkType === 'standard')
      .map((l) => l.target);
  }, [area.links, rootNode?.id]);

  const repartiNodes = useMemo(() => {
    const fromLinks = area.nodes.filter((n) => directRepartiIds.includes(n.id));
    if (fromLinks.length > 0) return fromLinks;
    const deptNodes = area.nodes.filter((n) => n.category === 'reparto' && n.id !== rootNode?.id);
    if (deptNodes.length > 0) return deptNodes;
    return area.nodes.filter((n) => n.id !== rootNode?.id);
  }, [area.nodes, directRepartiIds, rootNode?.id]);

  const backupLinks = useMemo(() => {
    return area.links.filter((l) => l.linkType === 'backup');
  }, [area.links]);

  const rootBackups = useMemo(() => {
    if (!rootNode) return [];
    return area.links
      .filter((l) => l.source === rootNode.id && l.linkType === 'backup')
      .map((l) => area.nodes.find((n) => n.id === l.target))
      .filter(Boolean) as OrgNode[];
  }, [area.links, area.nodes, rootNode]);

  return (
    <div className="space-y-4">
      {/* Root Process Title at Top - pure title banner without connector dash */}
      {rootNode && (
        <div className="flex justify-center mb-3">
          <ProcessTitleBanner
            node={rootNode}
            isSelected={selectedNode?.id === rootNode.id}
            isHighlighted={isNodeMatching(rootNode)}
            onClick={() => onSelectNode(rootNode)}
            density={density}
          />
        </div>
      )}

      {/* Reparti / Departments Grid */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-[800px] mx-auto items-start ${
          density === 'compact' ? 'gap-2.5' : 'gap-4'
        }`}
      >
        {repartiNodes.map((deptNode) => (
          <DepartmentColumnTB
            key={deptNode.id}
            deptNode={deptNode}
            area={area}
            selectedNode={selectedNode}
            onSelectNode={onSelectNode}
            isNodeMatching={isNodeMatching}
            density={density}
          />
        ))}
      </div>
    </div>
  );
};

interface DepartmentColumnTBProps {
  deptNode: OrgNode;
  area: OrgArea;
  selectedNode: OrgNode | null;
  onSelectNode: (node: OrgNode | null) => void;
  isNodeMatching: (node: OrgNode) => boolean;
  density: LayoutDensity;
}

const DepartmentColumnTB: React.FC<DepartmentColumnTBProps> = ({
  deptNode,
  area,
  selectedNode,
  onSelectNode,
  isNodeMatching,
  density,
}) => {
  const childrenIds = useMemo(() => {
    return area.links
      .filter((l) => l.source === deptNode.id && l.linkType === 'standard')
      .map((l) => l.target);
  }, [area.links, deptNode.id]);

  const directChildren = useMemo(() => {
    return area.nodes.filter((n) => childrenIds.includes(n.id));
  }, [area.nodes, childrenIds]);

  const getSubordinates = (leaderId: string): { node: OrgNode; link: OrgLink }[] => {
    // In Option 1, backup relationships are integrated directly into the titular role's card
    const subLinks = area.links.filter((l) => l.source === leaderId && l.linkType === 'standard');
    const result: { node: OrgNode; link: OrgLink }[] = [];
    for (const l of subLinks) {
      const targetNode = area.nodes.find((n) => n.id === l.target);
      if (targetNode) {
        result.push({ node: targetNode, link: l });
      }
    }
    return result;
  };

  const deptBackups = useMemo(() => {
    return area.links
      .filter((l) => l.source === deptNode.id && l.linkType === 'backup')
      .map((l) => area.nodes.find((n) => n.id === l.target))
      .filter(Boolean) as OrgNode[];
  }, [area.links, area.nodes, deptNode.id]);

  return (
    <div
      className={`
        flex flex-col bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors
        ${density === 'compact' ? 'p-2' : 'p-3'}
      `}
    >
      {/* Department Header Node */}
      <div className={density === 'compact' ? 'mb-2' : 'mb-3'}>
        <NodeCard
          node={deptNode}
          isSelected={selectedNode?.id === deptNode.id}
          isHighlighted={isNodeMatching(deptNode)}
          onClick={() => onSelectNode(deptNode)}
          density={density}
          backups={deptBackups}
          onBackupClick={(bNode) => onSelectNode(bNode)}
        />
      </div>

      {/* Children Hierarchy */}
      <div
        className={`
          pl-2 relative border-l-2 border-slate-200 dark:border-slate-700 ml-3
          ${density === 'compact' ? 'space-y-2' : 'space-y-3'}
        `}
      >
        {directChildren.map((childNode) => {
          const subordinates = getSubordinates(childNode.id);
          const childBackups = area.links
            .filter((l) => l.source === childNode.id && l.linkType === 'backup')
            .map((l) => area.nodes.find((n) => n.id === l.target))
            .filter(Boolean) as OrgNode[];

          return (
            <div
              key={childNode.id}
              className={`relative pl-3 ${density === 'compact' ? 'space-y-1.5' : 'space-y-2'}`}
            >
              {/* Horizontal branch marker */}
              <div className="absolute -left-[14px] top-3.5 w-3 h-[2px] bg-slate-200 dark:bg-slate-700" />

              <NodeCard
                node={childNode}
                isSelected={selectedNode?.id === childNode.id}
                isHighlighted={isNodeMatching(childNode)}
                onClick={() => onSelectNode(childNode)}
                density={density}
                backups={childBackups}
                onBackupClick={(bNode) => onSelectNode(bNode)}
              />

              {/* Subordinates of this manager / role */}
              {subordinates.length > 0 && (
                <div
                  className={`
                    pl-3 border-l border-dashed border-slate-300 dark:border-slate-700 ml-2 mt-1.5
                    ${density === 'compact' ? 'space-y-1' : 'space-y-2'}
                  `}
                >
                  {subordinates.map(({ node: subNode }) => {
                    const subSubordinates = getSubordinates(subNode.id);
                    const subBackups = area.links
                      .filter((l) => l.source === subNode.id && l.linkType === 'backup')
                      .map((l) => area.nodes.find((n) => n.id === l.target))
                      .filter(Boolean) as OrgNode[];

                    return (
                      <div key={subNode.id} className="space-y-1">
                        <NodeCard
                          node={subNode}
                          isSelected={selectedNode?.id === subNode.id}
                          isHighlighted={isNodeMatching(subNode)}
                          onClick={() => onSelectNode(subNode)}
                          density={density}
                          backups={subBackups}
                          onBackupClick={(bNode) => onSelectNode(bNode)}
                        />

                        {subSubordinates.length > 0 && (
                          <div className="pl-3 space-y-1 border-l border-slate-300 dark:border-slate-700 ml-2">
                            {subSubordinates.map(({ node: deepNode }) => {
                              const deepBackups = area.links
                                .filter((l) => l.source === deepNode.id && l.linkType === 'backup')
                                .map((l) => area.nodes.find((n) => n.id === l.target))
                                .filter(Boolean) as OrgNode[];

                              return (
                                <NodeCard
                                  key={deepNode.id}
                                  node={deepNode}
                                  isSelected={selectedNode?.id === deepNode.id}
                                  isHighlighted={isNodeMatching(deepNode)}
                                  onClick={() => onSelectNode(deepNode)}
                                  density={density}
                                  backups={deepBackups}
                                  onBackupClick={(bNode) => onSelectNode(bNode)}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {directChildren.length === 0 && (
          <div className="text-[11px] text-slate-400 italic pl-3 py-1">
            Nessun ruolo assegnato
          </div>
        )}
      </div>
    </div>
  );
};
