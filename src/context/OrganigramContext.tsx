/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { OrgArea, OrgNode, OrgLink, OrganigrammaBackup, LayoutOrientation, LayoutDensity, ViewMode } from '../types';
import { DEFAULT_EXPORT_DATE, DEFAULT_REVISION, INITIAL_AREAS, DEMO_AREAS } from '../constants/initialData';
import { generateMermaidFromArea, parseMermaidFlowchart } from '../utils/mermaidParser';

interface OrganigramContextType {
  areas: OrgArea[];
  activeAreaId: string; // 'all' or specific sheet id
  activeArea: OrgArea | null;
  revision: string;
  exportDate: string;
  searchQuery: string;
  selectedNode: OrgNode | null;
  viewMode: ViewMode;
  zoomLevel: number;
  layoutOrientation: LayoutOrientation;
  density: LayoutDensity;
  
  // Actions
  setActiveAreaId: (id: string) => void;
  setRevision: (rev: string) => void;
  setExportDate: (date: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedNode: (node: OrgNode | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  setLayoutOrientation: (orientation: LayoutOrientation) => void;
  setDensity: (density: LayoutDensity) => void;
  navigateToNode: (areaId: string, nodeId: string) => void;

  // Sheet / Foglio Management (Dynamic tabs)
  addSheet: (title?: string) => string;
  removeSheet: (sheetId: string) => void;
  renameSheet: (sheetId: string, newTitle: string) => void;
  duplicateSheet: (sheetId: string) => string;
  loadDemoData: () => void;
  
  // Entity mutations
  updateNode: (updatedNode: OrgNode) => void;
  changeNodeSuperior: (nodeId: string, newSuperiorId: string) => void;
  addNode: (newNode: OrgNode, parentId?: string, linkType?: 'standard' | 'backup') => void;
  deleteNode: (nodeId: string) => void;
  updateRawMermaid: (areaId: string, mermaidCode: string) => void;
  
  // Import/Export/Reset
  importMermaidCode: (code: string, targetAreaId?: string) => { success: boolean; error?: string };
  importBackupData: (backup: OrganigrammaBackup) => { success: boolean; error?: string };
  resetToDefaults: () => void;
  
  // Computed stats
  stats: {
    totalPeople: number;
    totalDepartments: number;
    totalRoles: number;
    totalBackupRoles: number;
    uniquePeopleCount: number;
  };
}

const OrganigramContext = createContext<OrganigramContextType | undefined>(undefined);

const STORAGE_KEY_AREAS = 'org_app_areas_data_v6';
const STORAGE_KEY_REV = 'org_app_revision_code';
const STORAGE_KEY_DATE = 'org_app_export_date';
const STORAGE_KEY_ORIENTATION = 'org_app_layout_orientation';
const STORAGE_KEY_DENSITY = 'org_app_layout_density';

export const OrganigramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clean up older legacy storage keys if present
  useEffect(() => {
    try {
      localStorage.removeItem('org_app_areas_data_v1');
      localStorage.removeItem('org_app_areas_data_v2');
      localStorage.removeItem('org_app_areas_data_v3');
      localStorage.removeItem('org_app_areas_data_v4');
      localStorage.removeItem('org_app_areas_data_v5');
    } catch {
      // ignore
    }
  }, []);

  // Load initial areas from localStorage or defaults
  const [areas, setAreas] = useState<OrgArea[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AREAS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed reading saved areas', e);
    }
    return INITIAL_AREAS;
  });

  const [activeAreaId, setActiveAreaId] = useState<string>('supporto');

  const [revision, setRevisionState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_REV) || DEFAULT_REVISION;
    } catch {
      return DEFAULT_REVISION;
    }
  });

  const [exportDate, setExportDateState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DATE) || DEFAULT_EXPORT_DATE;
    } catch {
      return DEFAULT_EXPORT_DATE;
    }
  });

  const [layoutOrientation, setLayoutOrientationState] = useState<LayoutOrientation>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ORIENTATION);
      if (saved === 'LR' || saved === 'TB') return saved;
    } catch {
      // ignore
    }
    return 'LR'; // Left to Right default as requested
  });

  const [density, setDensityState] = useState<LayoutDensity>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DENSITY);
      if (saved === 'compact' || saved === 'standard') return saved;
    } catch {
      // ignore
    }
    return 'compact'; // Compact default for document insertion
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AREAS, JSON.stringify(areas));
    } catch (e) {
      console.error('Failed saving areas', e);
    }
  }, [areas]);

  const setRevision = (rev: string) => {
    setRevisionState(rev);
    try {
      localStorage.setItem(STORAGE_KEY_REV, rev);
    } catch {
      // ignore
    }
  };

  const setExportDate = (date: string) => {
    setExportDateState(date);
    try {
      localStorage.setItem(STORAGE_KEY_DATE, date);
    } catch {
      // ignore
    }
  };

  const setLayoutOrientation = (orientation: LayoutOrientation) => {
    setLayoutOrientationState(orientation);
    try {
      localStorage.setItem(STORAGE_KEY_ORIENTATION, orientation);
    } catch {
      // ignore
    }
  };

  const setDensity = (d: LayoutDensity) => {
    setDensityState(d);
    try {
      localStorage.setItem(STORAGE_KEY_DENSITY, d);
    } catch {
      // ignore
    }
  };

  const activeArea = useMemo(() => {
    return areas.find((a) => a.id === activeAreaId) || null;
  }, [areas, activeAreaId]);

  // Node Mutations
  const updateNode = (updatedNode: OrgNode) => {
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== updatedNode.areaId) return area;
        const newNodes = area.nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n));
        const updatedArea: OrgArea = {
          ...area,
          nodes: newNodes,
        };
        updatedArea.rawMermaid = generateMermaidFromArea(updatedArea);
        return updatedArea;
      })
    );
    if (selectedNode && selectedNode.id === updatedNode.id) {
      setSelectedNode(updatedNode);
    }
  };

  const changeNodeSuperior = (nodeId: string, newSuperiorId: string) => {
    setAreas((prev) =>
      prev.map((area) => {
        const contains = area.nodes.some((n) => n.id === nodeId);
        if (!contains) return area;

        // Remove previous standard incoming link to this node
        const filteredLinks = area.links.filter(
          (l) => !(l.target === nodeId && l.linkType === 'standard')
        );

        let nextLinks = filteredLinks;
        // If a new superior is provided, add the standard hierarchy link
        if (newSuperiorId && newSuperiorId !== 'NONE' && newSuperiorId !== nodeId) {
          nextLinks = [
            ...filteredLinks,
            {
              id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              source: newSuperiorId,
              target: nodeId,
              linkType: 'standard' as const,
            },
          ];
        }

        const updatedArea: OrgArea = {
          ...area,
          links: nextLinks,
        };
        updatedArea.rawMermaid = generateMermaidFromArea(updatedArea);
        return updatedArea;
      })
    );
  };

  const addNode = (newNode: OrgNode, parentId?: string, linkType: 'standard' | 'backup' = 'standard') => {
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== newNode.areaId) return area;
        const exists = area.nodes.some((n) => n.id === newNode.id);
        const nextNodes = exists ? area.nodes.map((n) => (n.id === newNode.id ? newNode : n)) : [...area.nodes, newNode];
        let nextLinks = [...area.links];
        if (parentId) {
          nextLinks.push({
            id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source: parentId,
            target: newNode.id,
            linkType,
            label: linkType === 'backup' ? 'backup' : undefined,
          });
        }
        // If area has no rootNodeId or newNode is category 'processo' or it's the first node
        let nextRootNodeId = area.rootNodeId;
        if (!nextRootNodeId || newNode.category === 'processo' || nextNodes.length === 1) {
          nextRootNodeId = (!nextRootNodeId || newNode.category === 'processo') ? newNode.id : nextRootNodeId;
        }
        const updatedArea: OrgArea = {
          ...area,
          nodes: nextNodes,
          links: nextLinks,
          rootNodeId: nextRootNodeId,
        };
        updatedArea.rawMermaid = generateMermaidFromArea(updatedArea);
        return updatedArea;
      })
    );
  };

  const deleteNode = (nodeId: string) => {
    setAreas((prev) =>
      prev.map((area) => {
        const contains = area.nodes.some((n) => n.id === nodeId);
        if (!contains) return area;
        const nextNodes = area.nodes.filter((n) => n.id !== nodeId);
        const nextLinks = area.links.filter((l) => l.source !== nodeId && l.target !== nodeId);
        const nextRootNodeId = area.rootNodeId === nodeId ? (nextNodes[0]?.id || '') : area.rootNodeId;
        const updatedArea: OrgArea = {
          ...area,
          nodes: nextNodes,
          links: nextLinks,
          rootNodeId: nextRootNodeId,
        };
        updatedArea.rawMermaid = nextNodes.length > 0 ? generateMermaidFromArea(updatedArea) : '';
        return updatedArea;
      })
    );
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  // Sheet / Foglio Management
  const addSheet = (title?: string): string => {
    const sheetNum = areas.length + 1;
    const cleanTitle = title && title.trim() ? title.trim() : `Foglio ${sheetNum}`;
    const sanitizedKey = cleanTitle
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 20) || `FOGLIO_${sheetNum}`;

    const uniqueId = `sheet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newSheet: OrgArea = {
      id: uniqueId,
      key: sanitizedKey,
      title: cleanTitle,
      description: `Organigramma ${cleanTitle}`,
      rootNodeId: '',
      rawMermaid: '',
      nodes: [],
      links: [],
    };

    setAreas((prev) => [...prev, newSheet]);
    setActiveAreaId(uniqueId);
    return uniqueId;
  };

  const removeSheet = (sheetId: string) => {
    setAreas((prev) => {
      const remaining = prev.filter((a) => a.id !== sheetId);
      if (remaining.length === 0) {
        const fallback: OrgArea = {
          id: `sheet_${Date.now()}`,
          key: 'SUPPORTO',
          title: 'Supporto',
          description: 'Organigramma Supporto',
          rootNodeId: '',
          rawMermaid: '',
          nodes: [],
          links: [],
        };
        setActiveAreaId(fallback.id);
        return [fallback];
      }
      if (activeAreaId === sheetId) {
        setActiveAreaId(remaining[0].id);
      }
      return remaining;
    });
  };

  const renameSheet = (sheetId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const sanitizedKey = trimmed
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 20) || 'FOGLIO';

    setAreas((prev) =>
      prev.map((a) => {
        if (a.id !== sheetId) return a;
        return {
          ...a,
          title: trimmed,
          key: sanitizedKey,
        };
      })
    );
  };

  const duplicateSheet = (sheetId: string): string => {
    const source = areas.find((a) => a.id === sheetId);
    if (!source) return '';
    const newId = `sheet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newTitle = `${source.title} (Copia)`;
    const newKey = `${source.key}_COPIA`.slice(0, 24);

    const duplicatedArea: OrgArea = {
      ...source,
      id: newId,
      key: newKey,
      title: newTitle,
      nodes: source.nodes.map((n) => ({ ...n, areaId: newId })),
      links: source.links.map((l) => ({ ...l })),
    };

    setAreas((prev) => [...prev, duplicatedArea]);
    setActiveAreaId(newId);
    return newId;
  };

  const loadDemoData = () => {
    setAreas(DEMO_AREAS);
    setActiveAreaId('supporto');
  };

  const updateRawMermaid = (areaId: string, mermaidCode: string) => {
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== areaId) return area;
        const { nodes, links, rootNodeId } = parseMermaidFlowchart(mermaidCode, area.id, area.key);
        return {
          ...area,
          rawMermaid: mermaidCode,
          nodes: nodes.length > 0 ? nodes : area.nodes,
          links: links.length > 0 ? links : area.links,
          rootNodeId: rootNodeId || area.rootNodeId,
        };
      })
    );
  };

  const importMermaidCode = (code: string, targetAreaId?: string): { success: boolean; error?: string } => {
    try {
      const areaToUse = targetAreaId || (activeAreaId === 'all' ? 'supporto' : activeAreaId);
      const existingArea = areas.find((a) => a.id === areaToUse) || areas[0];
      const { nodes, links, rootNodeId } = parseMermaidFlowchart(code, existingArea.id, existingArea.key);

      if (nodes.length === 0) {
        return { success: false, error: 'Nessun nodo valido trovato nel codice Mermaid.' };
      }

      setAreas((prev) =>
        prev.map((area) => {
          if (area.id !== existingArea.id) return area;
          return {
            ...area,
            rawMermaid: code,
            nodes,
            links,
            rootNodeId: rootNodeId || area.rootNodeId,
          };
        })
      );
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore durante il parsing del file Mermaid.';
      return { success: false, error: message };
    }
  };

  const importBackupData = (backup: OrganigrammaBackup): { success: boolean; error?: string } => {
    try {
      if (backup.areas && Array.isArray(backup.areas) && backup.areas.length > 0) {
        setAreas(backup.areas);
        if (backup.revision) setRevision(backup.revision);
        if (backup.exportDate) setExportDate(backup.exportDate);
        return { success: true };
      }
      return { success: false, error: 'File di backup non valido o privo di aree.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore importazione backup.';
      return { success: false, error: message };
    }
  };

  const resetToDefaults = () => {
    setAreas(INITIAL_AREAS);
    setRevision(DEFAULT_REVISION);
    setExportDate(DEFAULT_EXPORT_DATE);
    try {
      localStorage.removeItem(STORAGE_KEY_AREAS);
      localStorage.setItem(STORAGE_KEY_REV, DEFAULT_REVISION);
      localStorage.setItem(STORAGE_KEY_DATE, DEFAULT_EXPORT_DATE);
    } catch {
      // ignore
    }
  };

  const navigateToNode = (areaId: string, nodeId: string) => {
    const targetArea = areas.find((a) => a.id === areaId);
    if (targetArea) {
      const targetNode = targetArea.nodes.find((n) => n.id === nodeId);
      setActiveAreaId(areaId);
      if (targetNode) {
        setSelectedNode(targetNode);
      }
      setViewMode('cards');
    }
  };

  // Global Statistics
  const stats = useMemo(() => {
    const allNodes = areas.flatMap((a) => a.nodes);
    const people = allNodes.filter((n) => !!n.person).map((n) => n.person as string);
    const uniquePeople = new Set(people.map((p) => p.toLowerCase().trim()));
    const departments = allNodes.filter((n) => n.category === 'reparto');
    const roles = allNodes.filter((n) => n.category === 'responsabile' || n.category === 'membro');
    const backupRoles = allNodes.filter((n) => n.category === 'backup');

    return {
      totalPeople: people.length,
      totalDepartments: departments.length,
      totalRoles: roles.length,
      totalBackupRoles: backupRoles.length,
      uniquePeopleCount: uniquePeople.size,
    };
  }, [areas]);

  return (
    <OrganigramContext.Provider
      value={{
        areas,
        activeAreaId,
        activeArea,
        revision,
        exportDate,
        searchQuery,
        selectedNode,
        viewMode,
        zoomLevel,
        layoutOrientation,
        density,
        setActiveAreaId,
        setRevision,
        setExportDate,
        setSearchQuery,
        setSelectedNode,
        setViewMode,
        setZoomLevel,
        setLayoutOrientation,
        setDensity,
        navigateToNode,
        addSheet,
        removeSheet,
        renameSheet,
        duplicateSheet,
        loadDemoData,
        updateNode,
        changeNodeSuperior,
        addNode,
        deleteNode,
        updateRawMermaid,
        importMermaidCode,
        importBackupData,
        resetToDefaults,
        stats,
      }}
    >
      {children}
    </OrganigramContext.Provider>
  );
};

export function useOrganigram(): OrganigramContextType {
  const context = useContext(OrganigramContext);
  if (!context) {
    throw new Error('useOrganigram must be used within an OrganigramProvider');
  }
  return context;
}
