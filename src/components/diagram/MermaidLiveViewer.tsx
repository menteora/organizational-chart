/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useOrganigram } from '../../context/OrganigramContext';
import { useTheme } from '../../context/ThemeContext';
import { Copy, Check, RefreshCw, AlertTriangle, Code2, Download } from 'lucide-react';
import { triggerFileDownload } from '../../utils/exportUtils';

export const MermaidLiveViewer: React.FC = () => {
  const { activeArea, updateRawMermaid, revision, exportDate } = useOrganigram();
  const { theme } = useTheme();

  const [code, setCode] = useState<string>(activeArea?.rawMermaid || '');
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const renderIdRef = useRef<number>(0);

  // Sync code whenever activeArea changes
  useEffect(() => {
    if (activeArea) {
      setCode(activeArea.rawMermaid);
    }
  }, [activeArea]);

  // Configure mermaid based on theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
      },
    });
  }, [theme]);

  // Render mermaid whenever code or theme changes
  useEffect(() => {
    let isMounted = true;
    const currentId = ++renderIdRef.current;

    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvgContent('');
        setError(null);
        return;
      }

      try {
        const uniqueId = `mermaid-svg-${Date.now()}-${currentId}`;
        const { svg } = await mermaid.render(uniqueId, code);
        if (isMounted && currentId === renderIdRef.current) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted && currentId === renderIdRef.current) {
          const msg = err instanceof Error ? err.message : 'Errore di sintassi Mermaid';
          setError(msg);
        }
      }
    };

    const timeout = setTimeout(renderDiagram, 150);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [code, theme]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleApplyToModel = () => {
    if (!activeArea) return;
    setIsApplying(true);
    updateRawMermaid(activeArea.id, code);
    setTimeout(() => setIsApplying(false), 500);
  };

  const handleDownloadMmd = () => {
    const areaKey = activeArea?.key || 'DIAGRAMMA';
    const filename = `ORG_DIAGRAMMA_${areaKey}_${revision}_${exportDate}.mmd`;
    triggerFileDownload(code, filename, 'text/plain');
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Code Editor Panel */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Codice Sorgente Mermaid (.mmd)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
              {activeArea?.key}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Copia codice Mermaid"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiato' : 'Copia'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMmd}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
              title="Scarica file .mmd"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Scarica .mmd</span>
            </button>
            <button
              type="button"
              onClick={handleApplyToModel}
              disabled={!!error || isApplying}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              title="Aggiorna i nodi strutturati dell'app con il codice modificato"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isApplying ? 'animate-spin' : ''}`} />
              <span>{isApplying ? 'Applicato!' : 'Applica modifiche'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full p-4 font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-950/80 resize-none outline-none leading-relaxed"
          placeholder="Inserisci o modifica qui il codice Mermaid flowchart..."
        />

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border-t border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-mono text-[11px] overflow-auto max-h-20">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Panel */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-slate-100/50 dark:bg-slate-950">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Rendering Live Mermaid
          </span>
          <span className="text-xs text-slate-500 font-mono">
            ORG_DIAGRAMMA_{activeArea?.key}_{revision}_{exportDate}
          </span>
        </div>

        <div className="flex-1 overflow-auto p-6 flex justify-center items-center">
          {svgContent ? (
            <div
              className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-full overflow-auto"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : error ? (
            <div className="text-center p-8 text-slate-400">
              <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2 opacity-80" />
              <p className="text-sm">Correggi la sintassi Mermaid per visualizzare l'anteprima.</p>
            </div>
          ) : (
            <div className="text-center p-8 text-slate-400">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
              <p className="text-sm">Generazione diagramma in corso...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
