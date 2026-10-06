/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { OrgNode, NodeCategory } from '../../types';
import { useOrganigram } from '../../context/OrganigramContext';
import { CATEGORY_STYLES } from '../../constants/initialData';
import {
  X,
  User,
  Edit2,
  Trash2,
  Plus,
  Save,
  Award,
  Briefcase,
  Layers,
  LifeBuoy,
  CornerDownRight,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Users,
} from 'lucide-react';

interface NodeDetailModalProps {
  node: OrgNode | null;
  onClose: () => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({ node, onClose }) => {
  const { areas, activeArea, updateNode, changeNodeSuperior, addNode, deleteNode, setSelectedNode } = useOrganigram();

  const [isEditing, setIsEditing] = useState(false);
  const [role, setRole] = useState('');
  const [person, setPerson] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<NodeCategory>('membro');
  const [shape, setShape] = useState<'rect' | 'round'>('round');

  // Change Superior state
  const [selectedSuperiorId, setSelectedSuperiorId] = useState<string>('NONE');
  const [isChangingSuperior, setIsChangingSuperior] = useState(false);
  const [superiorSuccessMessage, setSuperiorSuccessMessage] = useState<string | null>(null);

  // Add Child state
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildRole, setNewChildRole] = useState('');
  const [newChildPerson, setNewChildPerson] = useState('');
  const [newChildCategory, setNewChildCategory] = useState<NodeCategory>('membro');
  const [newChildLinkType, setNewChildLinkType] = useState<'standard' | 'backup'>('standard');

  useEffect(() => {
    if (node) {
      setRole(node.role);
      setPerson(node.person || '');
      setDetails(node.details || '');
      setCategory(node.category);
      setShape(node.shape === 'rect' ? 'rect' : 'round');
      setIsEditing(false);
      setIsAddingChild(false);
      setIsChangingSuperior(false);
      setSuperiorSuccessMessage(null);

      const area = areas.find((a) => a.id === node.areaId) || activeArea || areas[0];
      const supLink = area?.links.find((l) => l.target === node.id && l.linkType === 'standard');
      setSelectedSuperiorId(supLink ? supLink.source : 'NONE');
    }
  }, [node, areas, activeArea]);

  if (!node) return null;

  const currentArea = areas.find((a) => a.id === node.areaId) || activeArea || areas[0];
  const style = CATEGORY_STYLES[node.category] || CATEGORY_STYLES.membro;

  // Find superior nodes (incoming links)
  const superiorNodes = currentArea?.links
    .filter((l) => l.target === node.id && l.linkType === 'standard')
    .map((l) => currentArea.nodes.find((n) => n.id === l.source))
    .filter(Boolean) as OrgNode[];

  // Candidate superiors: all nodes in the same area excluding this node and its descendants to avoid cycles
  const candidateSuperiors = (() => {
    if (!currentArea || !node) return [];
    const descendants = new Set<string>([node.id]);
    let added = true;
    while (added) {
      added = false;
      for (const link of currentArea.links) {
        if (descendants.has(link.source) && !descendants.has(link.target)) {
          descendants.add(link.target);
          added = true;
        }
      }
    }
    return currentArea.nodes.filter((n) => !descendants.has(n.id));
  })();

  const handleApplySuperiorChange = (newSupId: string) => {
    changeNodeSuperior(node.id, newSupId);
    setSelectedSuperiorId(newSupId);
    setSuperiorSuccessMessage('Superiore aggiornato con successo!');
    setIsChangingSuperior(false);
    setTimeout(() => setSuperiorSuccessMessage(null), 3000);
  };

  // Find subordinate nodes (outgoing links)
  const subordinateNodes = currentArea?.links
    .filter((l) => l.source === node.id)
    .map((l) => ({
      node: currentArea.nodes.find((n) => n.id === l.target),
      link: l,
    }))
    .filter((item) => !!item.node) as { node: OrgNode; link: { linkType: string; label?: string } }[];

  // Find backup assigned to this node (Option 1)
  const assignedBackups = currentArea?.links
    .filter((l) => l.source === node.id && l.linkType === 'backup')
    .map((l) => currentArea.nodes.find((n) => n.id === l.target))
    .filter(Boolean) as OrgNode[];

  // Find if this node is backup of other nodes
  const isBackupFor = currentArea?.links
    .filter((l) => l.target === node.id && l.linkType === 'backup')
    .map((l) => currentArea.nodes.find((n) => n.id === l.source))
    .filter(Boolean) as OrgNode[];

  const handleSaveEdit = () => {
    const rawLabelParts = [role];
    if (person) {
      rawLabelParts.push(details ? `(${person}, ${details})` : `(${person})`);
    }
    const rawLabel = rawLabelParts.join('<br>');

    updateNode({
      ...node,
      role,
      person: person.trim() ? person.trim() : null,
      details: details.trim() ? details.trim() : undefined,
      category,
      shape,
      rawLabel,
    });

    // Check if superior was changed in edit mode
    const currentSup = superiorNodes[0];
    const currentSupId = currentSup ? currentSup.id : 'NONE';
    if (selectedSuperiorId !== currentSupId) {
      changeNodeSuperior(node.id, selectedSuperiorId);
    }

    setIsEditing(false);
  };

  const handleCreateChild = () => {
    if (!newChildRole.trim()) return;

    const childId = `NODE_${Date.now().toString(36).toUpperCase()}`;
    const rawLabelParts = [newChildRole];
    if (newChildPerson) {
      rawLabelParts.push(`(${newChildPerson})`);
    }
    const rawLabel = rawLabelParts.join('<br>');

    const newNode: OrgNode = {
      id: childId,
      role: newChildRole.trim(),
      person: newChildPerson.trim() ? newChildPerson.trim() : null,
      rawLabel,
      category: newChildCategory,
      areaId: node.areaId,
      departmentId: node.category === 'reparto' ? node.id : node.departmentId,
    };

    addNode(newNode, node.id, newChildLinkType);
    setIsAddingChild(false);
    setNewChildRole('');
    setNewChildPerson('');
  };

  const handleDelete = () => {
    if (confirm(`Rimuovere "${node.role}" dall'organigramma?`)) {
      deleteNode(node.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${style.badgeLight} ${style.badgeDark}`}
            >
              {style.label}
            </span>
            <span className="font-mono text-xs text-slate-400 font-semibold">{node.id}</span>
          </div>

          <div className="flex items-center gap-1">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Modifica Ruolo"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Elimina Nodo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {isEditing ? (
            /* Edit Form */
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Titolo Ruolo / Posizione
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome e Cognome (opzionale per reparti)
                </label>
                <input
                  type="text"
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder="es. Sabrina Lopreite"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note Aggiuntive / Dettagli (es. Collaboratore, Agente)
                </label>
                <input
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="es. Collaboratore"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NodeCategory)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="processo">Processo</option>
                    <option value="reparto">Reparto</option>
                    <option value="responsabile">Responsabile</option>
                    <option value="membro">Membro</option>
                    <option value="backup">Backup</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Forma
                  </label>
                  <select
                    value={shape}
                    onChange={(e) => setShape(e.target.value as 'rect' | 'round')}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="round">Arrotondata (Standard)</option>
                    <option value="rect">Rettangolare (Mermaid rect)</option>
                  </select>
                </div>
              </div>

              {/* Superiore / Reports To inside Edit Form */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Superiore Diretto / Riporta a
                </label>
                <select
                  value={selectedSuperiorId}
                  onChange={(e) => setSelectedSuperiorId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="NONE">Nessuno (Vertice indipendente)</option>
                  {candidateSuperiors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.role} {sup.person ? `(${sup.person})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salva Modifiche</span>
                </button>
              </div>
            </div>
          ) : (
            /* View Details */
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {node.role}
                </h3>
                {node.person && (
                  <div className="flex items-center gap-2 mt-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    <User className="w-4 h-4 text-indigo-500" />
                    <span>{node.person}</span>
                    {node.details && (
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        ({node.details})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Superior Node / Reports To with Edit & Change Capability */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Riporta a / Superiore:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsChangingSuperior(!isChangingSuperior)}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    {isChangingSuperior ? 'Annulla' : 'Cambia Superiore'}
                  </button>
                </div>

                {superiorSuccessMessage && (
                  <div className="mb-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{superiorSuccessMessage}</span>
                  </div>
                )}

                {isChangingSuperior ? (
                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 space-y-2 mb-2">
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      Seleziona il nuovo superiore gerarchico:
                    </label>
                    <select
                      value={selectedSuperiorId}
                      onChange={(e) => setSelectedSuperiorId(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100"
                    >
                      <option value="NONE">Nessuno (Vertice indipendente)</option>
                      {candidateSuperiors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.role} {c.person ? `(${c.person})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsChangingSuperior(false)}
                        className="px-2.5 py-1 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded text-xs"
                      >
                        Chiudi
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplySuperiorChange(selectedSuperiorId)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-xs flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" />
                        <span>Salva Superiore</span>
                      </button>
                    </div>
                  </div>
                ) : superiorNodes.length > 0 ? (
                  <div className="space-y-1">
                    {superiorNodes.map((sup) => (
                      <button
                        key={sup.id}
                        type="button"
                        onClick={() => setSelectedNode(sup)}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {sup.role}
                          </div>
                          {sup.person && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {sup.person}
                            </div>
                          )}
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 italic text-[11px] p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    Nessun superiore (Nodo principale dell&apos;area)
                  </div>
                )}
              </div>

              {/* Sostituti e Relazioni di Backup (Opzione 1 integrata) */}
              {assignedBackups.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sostituto / Backup Designato:
                  </span>
                  <div className="space-y-1">
                    {assignedBackups.map((bNode) => (
                      <button
                        key={bNode.id}
                        type="button"
                        onClick={() => setSelectedNode(bNode)}
                        className="w-full text-left p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-amber-900 dark:text-amber-200 text-xs">
                            {bNode.role}
                          </div>
                          {bNode.person && (
                            <div className="text-[11px] text-amber-700 dark:text-amber-300">
                              {bNode.person}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          Vai al ruolo <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Agisce da Backup per */}
              {isBackupFor.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Designato come Backup per:
                  </span>
                  <div className="space-y-1">
                    {isBackupFor.map((tNode) => (
                      <button
                        key={tNode.id}
                        type="button"
                        onClick={() => setSelectedNode(tNode)}
                        className="w-full text-left p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-amber-900 dark:text-amber-200 text-xs">
                            {tNode.role}
                          </div>
                          {tNode.person && (
                            <div className="text-[11px] text-amber-700 dark:text-amber-300">
                              {tNode.person}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          Titolare <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subordinate Nodes */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ruoli Subordinati ({subordinateNodes.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingChild(!isAddingChild)}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Aggiungi ruolo</span>
                  </button>
                </div>

                {isAddingChild && (
                  <div className="p-3 my-2 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl space-y-2">
                    <input
                      type="text"
                      placeholder="Ruolo (es. Junior Specialist)"
                      value={newChildRole}
                      onChange={(e) => setNewChildRole(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Nome e Cognome (opzionale)"
                      value={newChildPerson}
                      onChange={(e) => setNewChildPerson(e.target.value)}
                      className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs"
                    />
                    <div className="flex gap-2">
                      <select
                        value={newChildCategory}
                        onChange={(e) => setNewChildCategory(e.target.value as NodeCategory)}
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px]"
                      >
                        <option value="membro">Membro</option>
                        <option value="responsabile">Responsabile</option>
                        <option value="backup">Ruolo di Backup</option>
                      </select>
                      <select
                        value={newChildLinkType}
                        onChange={(e) => setNewChildLinkType(e.target.value as 'standard' | 'backup')}
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px]"
                      >
                        <option value="standard">Collegamento Standard</option>
                        <option value="backup">Collegamento Backup (tratteggiato)</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingChild(false)}
                        className="px-2.5 py-1 rounded text-[11px] text-slate-500"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateChild}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold"
                      >
                        Aggiungi
                      </button>
                    </div>
                  </div>
                )}

                {subordinateNodes.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {subordinateNodes.map(({ node: sub, link }) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedNode(sub)}
                        className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between group transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {sub.role}
                          </div>
                          {sub.person && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {sub.person}
                            </div>
                          )}
                        </div>
                        {link.linkType === 'backup' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                            backup
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-[11px] italic py-1">
                    Nessun ruolo subordinato diretto.
                  </div>
                )}
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
