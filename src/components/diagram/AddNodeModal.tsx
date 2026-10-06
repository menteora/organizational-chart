/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useOrganigram } from '../../context/OrganigramContext';
import { NodeCategory, OrgNode } from '../../types';
import { CATEGORY_STYLES, formatSheetTabTitle } from '../../constants/initialData';
import { X, Plus, User, Briefcase, Award, LifeBuoy, Layers, Building2 } from 'lucide-react';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultParentId?: string;
  defaultCategory?: NodeCategory;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  isOpen,
  onClose,
  defaultParentId,
  defaultCategory,
}) => {
  const { areas, activeAreaId, activeArea, addNode } = useOrganigram();

  const [targetAreaId, setTargetAreaId] = useState<string>(() => {
    return activeAreaId === 'all' ? (areas[0]?.id || 'supporto') : activeAreaId;
  });

  const [role, setRole] = useState('');
  const [person, setPerson] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<NodeCategory>(defaultCategory || 'membro');
  const [parentId, setParentId] = useState<string>(defaultParentId || 'NONE');
  const [linkType, setLinkType] = useState<'standard' | 'backup'>('standard');

  useEffect(() => {
    if (isOpen) {
      const currentId = activeAreaId === 'all' ? (areas[0]?.id || 'supporto') : activeAreaId;
      setTargetAreaId(currentId);
      setRole('');
      setPerson('');
      setDetails('');
      setCategory(defaultCategory || 'membro');
      setParentId(defaultParentId || 'NONE');
      setLinkType(defaultCategory === 'backup' ? 'backup' : 'standard');
    }
  }, [isOpen, activeAreaId, areas, defaultParentId, defaultCategory]);

  if (!isOpen) return null;

  const currentArea = areas.find((a) => a.id === targetAreaId) || activeArea || areas[0];
  const existingNodes = currentArea?.nodes || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role.trim()) return;

    const newId = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const trimmedPerson = person.trim() ? person.trim() : null;
    const trimmedDetails = details.trim() ? details.trim() : undefined;

    const rawLabelParts = [role.trim()];
    if (trimmedPerson) {
      rawLabelParts.push(trimmedDetails ? `(${trimmedPerson}, ${trimmedDetails})` : `(${trimmedPerson})`);
    }

    const newNode: OrgNode = {
      id: newId,
      role: role.trim(),
      person: trimmedPerson,
      details: trimmedDetails,
      rawLabel: rawLabelParts.join('<br>'),
      category,
      areaId: targetAreaId,
      departmentId: category === 'reparto' ? newId : undefined,
    };

    const finalParent = parentId !== 'NONE' ? parentId : undefined;
    addNode(newNode, finalParent, linkType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Aggiungi Posizione / Nodo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inserisci un nuovo reparto o ruolo nell'organigramma
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Target Sheet */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Foglio di Destinazione
            </label>
            <select
              value={targetAreaId}
              onChange={(e) => {
                setTargetAreaId(e.target.value);
                setParentId('NONE');
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {formatSheetTabTitle(a.title)} ({a.nodes.length} posizioni)
                </option>
              ))}
            </select>
          </div>

          {/* Role / Title */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ruolo / Mansione / Reparto <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="es. Amministrazione, IT Manager, Sviluppatore..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Person Name */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Collaboratore / Persona (facoltativo)
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="es. Mario Rossi (lascia vuoto se reparto o vacante)"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Additional details */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Note aggiuntive / Qualifica (facoltativo)
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="es. Collaboratore, Part-time, Agente..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipologia Elemento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory('processo')}
                className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                  category === 'processo'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Macro-Processo (Radice)</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('reparto')}
                className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                  category === 'reparto'
                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>Reparto / Unità</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('responsabile')}
                className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                  category === 'responsabile'
                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Responsabile / Leader</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('membro')}
                className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors ${
                  category === 'membro'
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/60 text-yellow-900 dark:text-yellow-200 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-yellow-600 shrink-0" />
                <span>Membro / Posizione</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('backup');
                  setLinkType('backup');
                }}
                className={`p-2 rounded-lg border text-left flex items-center gap-1.5 transition-colors col-span-2 ${
                  category === 'backup'
                    ? 'border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <LifeBuoy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Ruolo di Backup (Sostituto / Supporto)</span>
              </button>
            </div>
          </div>

          {/* Superior / Parent Node */}
          {existingNodes.length > 0 && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dipende da (Nodo Superiore)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
              >
                <option value="NONE">-- Nessuno (Primo livello o Radice) --</option>
                {existingNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.role} {n.person ? `(${n.person})` : ''} - [{CATEGORY_STYLES[n.category]?.label || n.category}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Link Type */}
          {parentId !== 'NONE' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo di Collegamento
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="linkType"
                    checked={linkType === 'standard'}
                    onChange={() => setLinkType('standard')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Gerarchico (Standard)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="linkType"
                    checked={linkType === 'backup'}
                    onChange={() => setLinkType('backup')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Ruolo di Backup (Tratteggiato)</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!role.trim()}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-xs"
            >
              Aggiungi al Foglio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
