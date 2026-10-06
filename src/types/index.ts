/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NodeCategory = 'processo' | 'reparto' | 'responsabile' | 'membro' | 'backup';

export type ViewMode = 'cards' | 'mermaid' | 'people';
export type LayoutOrientation = 'LR' | 'TB';
export type LayoutDensity = 'compact' | 'standard';

export interface PersonAssignment {
  nodeId: string;
  role: string;
  category: NodeCategory;
  areaId: string;
  areaKey: string;
  areaTitle: string;
  departmentName: string;
  details?: string;
  superiorName?: string;
  node: OrgNode;
}

export interface PersonSummary {
  name: string;
  normalizedName: string;
  assignments: PersonAssignment[];
  areasCount: number;
  totalRoles: number;
  hasResponsibleRole: boolean;
  hasBackupRole: boolean;
  areas: { id: string; key: string; title: string }[];
}

export interface OrgNode {
  id: string;
  role: string;
  person: string | null;
  rawLabel: string;
  category: NodeCategory;
  areaId: string;
  departmentId?: string;
  details?: string;
  shape?: 'rect' | 'round' | 'circle';
}

export interface OrgLink {
  id: string;
  source: string;
  target: string;
  linkType: 'standard' | 'backup' | 'dotted';
  label?: string;
}

export interface OrgArea {
  id: string;
  key: string; // e.g. "SUPPORTO", "STRATEGICI", "CORE"
  title: string;
  description: string;
  rootNodeId: string;
  rawMermaid: string;
  nodes: OrgNode[];
  links: OrgLink[];
}

export interface AppMetadata {
  appName: string;
  revision: string;
  exportDate: string;
  companyName?: string;
}

export interface OrganigrammaBackup {
  format: 'ORGANIGRAMMA_APP_BACKUP_V1';
  version: string;
  revision: string;
  exportDate: string;
  timestamp: string;
  metadata: AppMetadata;
  areas: OrgArea[];
}

export interface ExportSettings {
  revision: string;
  exportDate: string;
  areaKey: string;
  format: 'png' | 'svg' | 'mmd' | 'json';
  scale: 1 | 2 | 3;
}
