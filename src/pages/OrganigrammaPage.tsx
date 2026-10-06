/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { TopNavbar } from '../components/toolbar/TopNavbar';
import { OrganigramCanvas } from '../components/diagram/OrganigramCanvas';
import { MermaidLiveViewer } from '../components/diagram/MermaidLiveViewer';
import { ExportModal } from '../components/toolbar/ExportModal';
import { ImportModal } from '../components/toolbar/ImportModal';
import { NodeDetailModal } from '../components/diagram/NodeDetailModal';
import { OffscreenExportBatch } from '../components/diagram/OffscreenExportBatch';
import { PeopleDirectoryView } from '../components/people/PeopleDirectoryView';
import { useOrganigram } from '../context/OrganigramContext';
import { exportAllOrganigramZip, ZipExportProgress } from '../utils/exportUtils';
import { ShieldCheck, Info, Layers, Users, Building2, HelpCircle, Check, Loader2, FolderArchive } from 'lucide-react';

export const OrganigrammaPage: React.FC = () => {
  const {
    areas,
    viewMode,
    activeArea,
    selectedNode,
    setSelectedNode,
    stats,
    revision,
    exportDate,
    layoutOrientation,
    density,
  } = useOrganigram();

  const exportElementRef = useRef<HTMLDivElement | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipExportProgress | null>(null);
  const [zipToast, setZipToast] = useState<string | null>(null);

  const handleDownloadAllZip = async () => {
    try {
      setIsZipping(true);
      setZipProgress({
        stepName: 'Inizializzazione esportazione...',
        current: 0,
        total: areas.length * 2 + 4,
      });

      const zipFilename = await exportAllOrganigramZip(areas, revision, exportDate, 2, (p) => {
        setZipProgress(p);
      });

      setZipToast(`Archivio scaricato: ${zipFilename}`);
      setTimeout(() => setZipToast(null), 6000);
    } catch (err) {
      console.error('ZIP generation failed', err);
      alert('Errore durante la creazione dell\'archivio ZIP.');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Hidden container with clean standard white cards rendered for bulk high-res image & ZIP generation */}
      <OffscreenExportBatch
        areas={areas}
        revision={revision}
        exportDate={exportDate}
        layoutOrientation={layoutOrientation}
        density={density}
      />

      {/* Top Application Navbar */}
      <TopNavbar
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onDownloadAllZip={handleDownloadAllZip}
        isZipping={isZipping}
      />

      {/* Main Workspace: Canvas, People Directory or Mermaid Live View */}
      <main className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
        {viewMode === 'cards' ? (
          <OrganigramCanvas
            exportRef={exportElementRef}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        ) : viewMode === 'people' ? (
          <PeopleDirectoryView />
        ) : (
          <MermaidLiveViewer />
        )}
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0 select-none">
        <div className="flex items-center gap-4">
          {viewMode === 'people' ? (
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Vista: Mappa Persone & Posizioni nei Processi Aziendali</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Area: {activeArea?.title || 'Tutti i Processi'}</span>
            </span>
          )}
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline font-mono">
            {stats.totalDepartments} reparti • {stats.totalRoles} ruoli • {stats.uniquePeopleCount} collaboratori
          </span>
          {stats.totalBackupRoles > 0 && (
            <>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-amber-600 dark:text-amber-400">
                {stats.totalBackupRoles} ruolo backup
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
            Export standard: ORG_DIAGRAMMA_{activeArea?.key || 'COMPLETO'}_{revision}_{exportDate}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Pronto per esportazione" />
        </div>
      </footer>

      {/* Floating ZIP generation progress indicator */}
      {isZipping && zipProgress && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3.5 text-xs max-w-md animate-in fade-in slide-in-from-bottom-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between font-semibold mb-0.5">
              <span>Creazione Pacchetto ZIP</span>
              <span className="font-mono text-[11px] text-emerald-400">
                {zipProgress.current}/{zipProgress.total}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono truncate mb-1.5">
              {zipProgress.stepName}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-200"
                style={{
                  width: `${Math.min(100, Math.round((zipProgress.current / zipProgress.total) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating success notification */}
      {zipToast && (
        <div className="fixed bottom-12 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="font-medium font-mono text-[11px]">{zipToast}</div>
        </div>
      )}

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exportElementRef={exportElementRef}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <NodeDetailModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
};
