/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useOrganigram } from '../../context/OrganigramContext';
import { formatSheetTabTitle } from '../../constants/initialData';
import {
  X,
  Upload,
  FileCode,
  Database,
  Check,
  AlertTriangle,
  RotateCcw,
  FileText,
  Sparkles,
} from 'lucide-react';
import { validateBackupJson } from '../../utils/exportUtils';
import { OrganigrammaBackup } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const {
    areas,
    activeAreaId,
    importMermaidCode,
    importBackupData,
    resetToDefaults,
    loadDemoData,
  } = useOrganigram();

  const [activeTab, setActiveTab] = useState<'mermaid' | 'json' | 'reset'>('mermaid');
  const [mermaidText, setMermaidText] = useState<string>('');
  const [targetAreaId, setTargetAreaId] = useState<string>(() => {
    return activeAreaId === 'all' ? (areas[0]?.id || 'supporto') : activeAreaId;
  });

  const [jsonText, setJsonText] = useState<string>('');
  const [jsonParsed, setJsonParsed] = useState<OrganigrammaBackup | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle file drop/select for Mermaid
  const handleMermaidFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setMermaidText(text || '');
      setErrorMsg(null);
    };
    reader.readAsText(file);
  };

  // Handle file drop/select for JSON
  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        setJsonText(raw);
        const parsed = JSON.parse(raw);
        if (validateBackupJson(parsed)) {
          setJsonParsed(parsed);
          setErrorMsg(null);
        } else {
          setErrorMsg('Il file caricato non sembra essere un backup valido di Organigramma Aziendale.');
          setJsonParsed(null);
        }
      } catch (err) {
        setErrorMsg('Errore nella lettura del file JSON.');
        setJsonParsed(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyMermaid = () => {
    if (!mermaidText.trim()) {
      setErrorMsg('Inserisci del codice Mermaid o seleziona un file.');
      return;
    }
    const res = importMermaidCode(mermaidText, targetAreaId);
    if (res.success) {
      setSuccessMsg('Diagramma Mermaid importato con successo!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Errore durante l\'importazione Mermaid.');
    }
  };

  const handleApplyBackup = () => {
    let toApply = jsonParsed;
    if (!toApply && jsonText.trim()) {
      try {
        const parsed = JSON.parse(jsonText);
        if (validateBackupJson(parsed)) {
          toApply = parsed;
        }
      } catch {
        // ignore
      }
    }

    if (!toApply) {
      setErrorMsg('Nessun file di backup valido da applicare.');
      return;
    }

    const res = importBackupData(toApply);
    if (res.success) {
      setSuccessMsg('Backup ripristinato con successo!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'Errore durante il ripristino del backup.');
    }
  };

  const handleReset = () => {
    if (confirm('Sei sicuro di voler ripristinare i dati originali dell\'organigramma? Le modifiche non salvate andranno perse.')) {
      resetToDefaults();
      setSuccessMsg('Dati iniziali ripristinati con successo!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Importa o Ripristina Dati
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supporto Mermaid (.mmd) e file di backup JSON
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-5 pt-2">
          <button
            type="button"
            onClick={() => { setActiveTab('mermaid'); setErrorMsg(null); }}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'mermaid'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>File Mermaid (.mmd)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('json'); setErrorMsg(null); }}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'json'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup JSON</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('reset'); setErrorMsg(null); }}
            className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs font-semibold transition-colors ${
              activeTab === 'reset'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ripristino Iniziale</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Notifications */}
          {successMsg && (
            <div className="p-3 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl text-green-800 dark:text-green-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: MERMAID IMPORT */}
          {activeTab === 'mermaid' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Area di destinazione
                </label>
                <select
                  value={targetAreaId}
                  onChange={(e) => setTargetAreaId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-slate-100"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {formatSheetTabTitle(a.title)} ({a.key})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Carica file .mmd oppure incolla il testo
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept=".mmd,.txt"
                    onChange={handleMermaidFileChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                  />
                </div>
                <textarea
                  value={mermaidText}
                  onChange={(e) => setMermaidText(e.target.value)}
                  rows={6}
                  spellCheck={false}
                  placeholder="flowchart LR&#10;    A[&quot;Processo&quot;] --> B[&quot;Reparto&quot;]..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-800 dark:text-slate-200 resize-y"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyMermaid}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importa nel Diagramma</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: JSON BACKUP IMPORT */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seleziona file di backup (.json)
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleJsonFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950 dark:file:text-blue-300"
                />
              </div>

              {jsonParsed && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-1.5">
                  <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Backup Riconosciuto</span>
                  </div>
                  <div className="text-[11px] text-blue-800 dark:text-blue-200">
                    Revisione: <strong>{jsonParsed.revision}</strong> | Data: <strong>{jsonParsed.exportDate}</strong>
                  </div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300">
                    Aree incluse: <strong>{jsonParsed.areas?.length || 0}</strong> ({jsonParsed.areas?.map(a => a.key).join(', ')})
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyBackup}
                  disabled={!jsonParsed && !jsonText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Ripristina da Backup</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RESET TO EMPTY APP & DEMO */}
          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl space-y-3">
                <div className="font-bold text-sm text-red-900 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Ripristina Applicazione Vuota</span>
                </div>
                <p className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed">
                  Questa operazione ripulisce completamente i dati locali dell'applicazione, creando un foglio pulito
                  senza persone, reparti o mansioni salvate.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Conferma Ripristino Applicazione Vuota</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl space-y-3">
                <div className="font-bold text-sm text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Carica Organigramma Demo di Esempio</span>
                </div>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  Vuoi testare l'applicazione con dei dati di esempio? Carica l'organigramma dimostrativo completo con i processi e ruoli preconfigurati.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      loadDemoData();
                      setSuccessMsg('Dati demo caricati con successo!');
                      setTimeout(() => {
                        setSuccessMsg(null);
                        onClose();
                      }, 1200);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Carica Dati Demo</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
