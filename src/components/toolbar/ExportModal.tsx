/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useOrganigram } from '../../context/OrganigramContext';
import { useTheme } from '../../context/ThemeContext';
import {
  X,
  Download,
  Image,
  FileCode,
  Database,
  Check,
  Calendar,
  Layers,
  Sparkles,
  Sliders,
  Copy,
  FolderArchive,
  Loader2,
} from 'lucide-react';
import {
  exportElementAsPng,
  exportElementAsSvg,
  exportAppBackup,
  formatExportFileName,
  triggerFileDownload,
  copyElementAsPngToClipboard,
  exportAllOrganigramZip,
  exportElementAsA4VerticalPng,
  copyElementAsA4VerticalPngToClipboard,
  exportElementAsA4HorizontalPng,
  copyElementAsA4HorizontalPngToClipboard,
  getTodayDateFormatted,
  ZipExportProgress,
} from '../../utils/exportUtils';
import { generateMermaidFromArea } from '../../utils/mermaidParser';
import { formatSheetTabTitle } from '../../constants/initialData';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportElementRef: React.RefObject<HTMLDivElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exportElementRef,
}) => {
  const {
    areas,
    activeAreaId,
    activeArea,
    revision,
    setRevision,
    exportDate,
    setExportDate,
  } = useOrganigram();
  const { theme } = useTheme();

  const [selectedAreaKey, setSelectedAreaKey] = useState<string>(() => {
    if (activeAreaId === 'all') return 'COMPLETO';
    return activeArea?.key || 'SUPPORTO';
  });

  const [scale, setScale] = useState<1 | 2 | 3>(2);
  const [pngOrientation, setPngOrientation] = useState<'vertical' | 'horizontal' | 'native'>('vertical');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<ZipExportProgress | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentArea = areas.find((a) => a.key === selectedAreaKey) || activeArea || areas[0];

  const previewFilenamePng = formatExportFileName(selectedAreaKey, revision, exportDate, 'png');
  const previewFilenameSvg = formatExportFileName(selectedAreaKey, revision, exportDate, 'svg');
  const previewFilenameMmd = formatExportFileName(selectedAreaKey, revision, exportDate, 'mmd');
  const previewFilenameJson = formatExportFileName(selectedAreaKey, revision, exportDate, 'json');

  const setTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setExportDate(`${yyyy}${mm}${dd}`);
  };

  const getTargetElement = (): HTMLElement | null => {
    // Prefer clean offscreen pre-rendered card matching selectedAreaKey for pristine background and no UI controls
    const cardId = selectedAreaKey === 'COMPLETO' ? 'export-card-COMPLETO' : `export-card-${selectedAreaKey}`;
    const offscreenCard = document.getElementById(cardId);
    if (offscreenCard) return offscreenCard;
    return exportElementRef.current;
  };

  const handleExportPng = async () => {
    const targetEl = getTargetElement();
    if (!targetEl) return;
    try {
      setIsExporting(true);
      if (pngOrientation === 'vertical') {
        const outName = await exportElementAsA4VerticalPng(targetEl, previewFilenamePng, scale, theme === 'dark');
        setSuccessMessage(`File PNG Formato A4 Verticale generato: ${outName}`);
      } else if (pngOrientation === 'horizontal') {
        const outName = await exportElementAsA4HorizontalPng(targetEl, previewFilenamePng, scale, theme === 'dark');
        setSuccessMessage(`File PNG Formato A4 Orizzontale generato: ${outName}`);
      } else {
        await exportElementAsPng(targetEl, previewFilenamePng, scale, theme === 'dark');
        setSuccessMessage(`File PNG generato con successo: ${previewFilenamePng}`);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Export PNG failed', e);
      alert('Errore durante la generazione dell\'immagine ad alta risoluzione.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPng = async () => {
    const targetEl = getTargetElement();
    if (!targetEl) return;
    try {
      setIsExporting(true);
      if (pngOrientation === 'vertical') {
        const copied = await copyElementAsA4VerticalPngToClipboard(targetEl, scale, theme === 'dark');
        if (copied) {
          setSuccessMessage('Immagine A4 Verticale copiata negli appunti! Incollala con Ctrl+V nel documento.');
        } else {
          await exportElementAsA4VerticalPng(targetEl, previewFilenamePng, scale, theme === 'dark');
          setSuccessMessage(`File salvato in A4 Verticale: ${previewFilenamePng}`);
        }
      } else if (pngOrientation === 'horizontal') {
        const copied = await copyElementAsA4HorizontalPngToClipboard(targetEl, scale, theme === 'dark');
        if (copied) {
          setSuccessMessage('Immagine A4 Orizzontale copiata negli appunti! Incollala con Ctrl+V nel documento.');
        } else {
          await exportElementAsA4HorizontalPng(targetEl, previewFilenamePng, scale, theme === 'dark');
          setSuccessMessage(`File salvato in A4 Orizzontale: ${previewFilenamePng}`);
        }
      } else {
        const copied = await copyElementAsPngToClipboard(targetEl, scale, theme === 'dark');
        if (copied) {
          setSuccessMessage('Immagine copiata negli appunti! Incollala con Ctrl+V nel tuo documento.');
        } else {
          await exportElementAsPng(targetEl, previewFilenamePng, scale, theme === 'dark');
          setSuccessMessage(`File salvato: ${previewFilenamePng}`);
        }
      }
      setTimeout(() => setSuccessMessage(null), 4500);
    } catch (e) {
      console.error('Copy PNG failed', e);
      alert('Errore durante la copia dell\'immagine.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSvg = async () => {
    if (!exportElementRef.current) return;
    try {
      setIsExporting(true);
      await exportElementAsSvg(exportElementRef.current, previewFilenameSvg, theme === 'dark');
      setSuccessMessage(`File vettoriale SVG generato con successo: ${previewFilenameSvg}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Export SVG failed', e);
      alert('Errore durante la generazione del file SVG.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMermaid = () => {
    try {
      let mmdContent = '';
      if (selectedAreaKey === 'COMPLETO') {
        mmdContent = areas.map((a) => a.rawMermaid || generateMermaidFromArea(a)).join('\n\n---\n\n');
      } else {
        mmdContent = currentArea.rawMermaid || generateMermaidFromArea(currentArea);
      }
      triggerFileDownload(mmdContent, previewFilenameMmd, 'text/plain');
      setSuccessMessage(`File Mermaid esportato: ${previewFilenameMmd}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Export Mermaid failed', e);
    }
  };

  const handleExportBackup = () => {
    try {
      exportAppBackup(areas, revision, exportDate, selectedAreaKey);
      setSuccessMessage(`Backup applicazione esportato: ${previewFilenameJson}`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Export backup failed', e);
    }
  };

  const handleExportZip = async () => {
    try {
      setIsZipping(true);
      setZipProgress({ stepName: 'Inizializzazione archivio...', current: 0, total: areas.length * 2 + 4 });
      const zipName = await exportAllOrganigramZip(areas, revision, exportDate, scale, (p) => {
        setZipProgress(p);
      });
      setSuccessMessage(`Archivio ZIP completo scaricato con successo: ${zipName}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e) {
      console.error('Export ZIP failed', e);
      alert('Errore durante la creazione dell\'archivio ZIP.');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Esporta Organigramma
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Immagine ad alta risoluzione, file Mermaid o backup dati
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
              <span className="font-medium font-mono text-[11px] truncate">{successMessage}</span>
            </div>
          )}

          {/* Area & Naming Config */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Area selection */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Area da Esportare
              </label>
              <select
                value={selectedAreaKey}
                onChange={(e) => setSelectedAreaKey(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.key}>
                    {formatSheetTabTitle(a.title)} ({a.key})
                  </option>
                ))}
                <option value="COMPLETO">Tutti i Fogli (COMPLETO)</option>
              </select>
            </div>

            {/* Revision */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Codice Revisione
              </label>
              <input
                type="text"
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="REV.07"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Export Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Data File / Esportazione
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExportDate(getTodayDateFormatted())}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    title="Usa la data odierna del download"
                  >
                    Oggi
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                placeholder="20260624"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Usa la data di emissione della revisione (es. 20260624) o quella odierna di download.
              </span>
            </div>
          </div>

          {/* Standard Filename format banner */}
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
              Standard Denominazione File Singoli:
            </span>
            <div className="font-mono text-xs text-indigo-950 dark:text-indigo-200 break-all font-semibold">
              {previewFilenamePng}
            </div>
          </div>

          {/* FEATURED: ALL-IN-ONE ZIP ARCHIVE */}
          <div className="p-4 rounded-xl border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Archivio ZIP Completo (Tutti gli MMD + Tutte le Immagini + Formato A4)
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 uppercase tracking-wide">
                      Consigliato
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Scarica in un unico archivio compresso: file <strong>.mmd</strong>, <strong>immagini PNG ad alta risoluzione</strong>, la nuova cartella <strong>immagini_formato_a4</strong> (proporzionate e già divise su pagine sequenziali per Word / Docs senza sbordare), il backup <strong>JSON</strong> e il file <strong>LEGGIMI</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportZip}
                disabled={isZipping}
                className="shrink-0 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                {isZipping ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderArchive className="w-4 h-4" />
                )}
                <span>{isZipping ? 'Generazione...' : 'Scarica Tutto (.zip)'}</span>
              </button>
            </div>

            {/* Progress bar and details when zipping */}
            {isZipping && zipProgress && (
              <div className="mt-1 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/60">
                <div className="flex items-center justify-between text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{zipProgress.stepName}</span>
                  </span>
                  <span className="font-mono">
                    {zipProgress.current} / {zipProgress.total} ({Math.round((zipProgress.current / zipProgress.total) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-emerald-200/80 dark:bg-emerald-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-200"
                    style={{
                      width: `${Math.min(100, Math.round((zipProgress.current / zipProgress.total) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              oppure esporta singolo formato
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Option 1: High-Res PNG with Vertical A4 by Default */}
            <div className="p-4 rounded-xl border-2 border-indigo-500/30 dark:border-indigo-500/20 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors shadow-2xs">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Immagine PNG
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {pngOrientation === 'vertical' ? 'A4 Verticale' : pngOrientation === 'horizontal' ? 'A4 Orizzontale' : 'Nativo'}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Esporta o copia l'organigramma. Il <strong>formato A4 Verticale</strong> è proporzionato per relazioni tecniche, manuali e Word (210 x 297 mm).
                </p>

                {/* Orientation Selector */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                    Orientamento Pagina:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setPngOrientation('vertical')}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold text-center transition-all ${
                        pngOrientation === 'vertical'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      A4 Verticale
                    </button>
                    <button
                      type="button"
                      onClick={() => setPngOrientation('horizontal')}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold text-center transition-all ${
                        pngOrientation === 'horizontal'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Orizzontale
                    </button>
                    <button
                      type="button"
                      onClick={() => setPngOrientation('native')}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold text-center transition-all ${
                        pngOrientation === 'native'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Nativo
                    </button>
                  </div>
                </div>

                {/* Scale selection */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Risoluzione:</span>
                  <div className="flex gap-1">
                    {([1, 2, 3] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setScale(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                          scale === s
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {s}x {s === 2 ? '(HD)' : s === 3 ? '(4K)' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleCopyPng}
                  disabled={isExporting}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    Copia {pngOrientation === 'vertical' ? 'A4 Verticale' : pngOrientation === 'horizontal' ? 'A4 Orizzontale' : 'PNG'} (Appunti)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={isExporting}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium flex items-center justify-center gap-2 transition-colors text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {isExporting ? 'Generazione...' : `Scarica ${pngOrientation === 'vertical' ? 'A4 Verticale' : pngOrientation === 'horizontal' ? 'A4 Orizzontale' : 'PNG'}`}
                  </span>
                </button>
              </div>
            </div>

            {/* Option 2: SVG Vector */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Vettoriale SVG
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Grafica vettoriale scalabile all'infinito senza perdita di qualità per Illustrator o Figma.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportSvg}
                disabled={isExporting}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Generazione...' : 'Scarica SVG'}</span>
              </button>
            </div>

            {/* Option 3: Mermaid .mmd */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    File Mermaid (.mmd)
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  File di testo Mermaid completo con flowchart, classi di stile e nodi dell'area selezionata.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportMermaid}
                className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scarica .mmd</span>
              </button>
            </div>

            {/* Option 4: Complete JSON Backup */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Backup JSON App
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                  Salva l'intero stato dell'applicazione (tutte le aree, revisione, date e nodi) per ripristino istantaneo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Scarica Backup (.json)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium text-xs transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
