/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeCategory, OrgArea, OrgLink, OrgNode } from '../types';

/**
 * Extracts person name and clean role from a label like "CFO<br>(Sabrina Lopreite)"
 * or "Marketing &amp; Event Specialist<br>(Valeria Musso)"
 */
export function parseLabelAndPerson(rawText: string): { role: string; person: string | null; details?: string } {
  // Decode common HTML entities
  const decoded = rawText
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Split by linebreaks (<br>, <br/>, \n)
  const parts = decoded.split(/<br\s*\/?>|\n/i).map(p => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    return { role: decoded.trim(), person: null };
  }

  const role = parts[0];
  let person: string | null = null;
  let details: string | undefined = undefined;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const match = part.match(/^\((.*?)\)$/);
    if (match) {
      const inside = match[1].trim();
      if (inside.includes(',')) {
        const [name, ...rest] = inside.split(',');
        person = name.trim();
        details = rest.join(',').trim();
      } else {
        person = inside;
      }
    } else if (!person) {
      person = part;
    } else {
      details = (details ? details + ' ' : '') + part;
    }
  }

  return { role, person, details };
}

/**
 * Parse a raw Mermaid flowchart string into structured nodes and links
 */
export function parseMermaidFlowchart(mermaidText: string, areaId: string, areaKey: string): { nodes: OrgNode[]; links: OrgLink[]; rootNodeId: string } {
  const nodesMap = new Map<string, OrgNode>();
  const links: OrgLink[] = [];
  const lines = mermaidText.split('\n');

  let rootNodeId = '';
  const classAssignments: Record<string, NodeCategory> = {};
  const shapes: Record<string, 'rect' | 'round' | 'circle'> = {};

  // First pass: look for class assignments (e.g. "CFO:::responsabile") and shape annotations
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('%%') || line.startsWith('---') || line.startsWith('config:') || line.startsWith('theme:')) {
      continue;
    }

    // Match class assignment: "ID:::category"
    const classMatch = line.match(/^([A-Za-z0-9_]+):::([a-zA-Z0-9_]+)/);
    if (classMatch) {
      const id = classMatch[1];
      const cat = classMatch[2].toLowerCase() as NodeCategory;
      classAssignments[id] = cat;
    }

    // Match shape annotation: "ITM@{ shape: rect}" or "ID@{ label: "...", shape: rect}"
    const shapeMatch = line.match(/([A-Za-z0-9_]+)@\{\s*(.*?)\s*\}/);
    if (shapeMatch) {
      const id = shapeMatch[1];
      const meta = shapeMatch[2];
      if (meta.includes('shape: rect')) {
        shapes[id] = 'rect';
      }
      const labelMatch = meta.match(/label:\s*"(.*?)"/);
      if (labelMatch) {
        const rawLabel = labelMatch[1];
        const { role, person, details } = parseLabelAndPerson(rawLabel);
        nodesMap.set(id, {
          id,
          role,
          person,
          rawLabel,
          details,
          category: classAssignments[id] || 'membro',
          areaId,
          shape: shapes[id] || 'round'
        });
      }
    }
  }

  // Second pass: parse connections and bracketed nodes
  let linkCounter = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (
      !line ||
      line.startsWith('%%') ||
      line.startsWith('---') ||
      line.startsWith('flowchart') ||
      line.startsWith('graph') ||
      line.startsWith('classDef') ||
      line.startsWith('config:') ||
      line.startsWith('theme:') ||
      line.includes(':::') ||
      line.includes('@{')
    ) {
      continue;
    }

    // Extract all node definitions in this line: ID["label"] or ID["label"]
    const nodeRegex = /([A-Za-z0-9_]+)\["([^"]*)"\]/g;
    let match;
    while ((match = nodeRegex.exec(line)) !== null) {
      const id = match[1];
      const rawLabel = match[2];
      if (!nodesMap.has(id)) {
        const { role, person, details } = parseLabelAndPerson(rawLabel);
        nodesMap.set(id, {
          id,
          role,
          person,
          rawLabel,
          details,
          category: classAssignments[id] || (person ? 'membro' : 'reparto'),
          areaId,
          shape: shapes[id] || 'round'
        });
      }
    }

    // Determine root node if not set
    if (!rootNodeId && (line.includes('-->') || line.includes('---'))) {
      const firstId = line.split(/\s*(-->|---|-.->|-\.)/)[0].trim().replace(/\[".*?"\]/, '');
      if (firstId) {
        rootNodeId = firstId;
        const rootNode = nodesMap.get(firstId);
        if (rootNode && !classAssignments[firstId]) {
          rootNode.category = 'processo';
        }
      }
    }

    // Parse links:
    // Case 1: Dotted backup link: TSS_COD -. backup .-> BACKUP_THIAW[...]
    const dottedMatch = line.match(/([A-Za-z0-9_]+)(?:\["[^"]*"\])?\s*-\.\s*([a-zA-Z0-9_\s]*)\s*\.->\s*([A-Za-z0-9_]+)/);
    if (dottedMatch) {
      const source = dottedMatch[1];
      const label = dottedMatch[2].trim() || 'backup';
      const target = dottedMatch[3];
      links.push({
        id: `link-${linkCounter++}`,
        source,
        target,
        linkType: 'backup',
        label
      });
      continue;
    }

    // Case 2: Standard link with potential multi-targets: SOURCE --> T1 & T2 & T3
    const arrowMatch = line.match(/([A-Za-z0-9_]+)(?:\["[^"]*"\])?\s*-->\s*(.*)/);
    if (arrowMatch) {
      const source = arrowMatch[1];
      const targetsPart = arrowMatch[2];
      // Split by &
      const targets = targetsPart.split('&').map(t => {
        const clean = t.trim();
        const idMatch = clean.match(/^([A-Za-z0-9_]+)/);
        return idMatch ? idMatch[1] : '';
      }).filter(Boolean);

      for (const target of targets) {
        links.push({
          id: `link-${linkCounter++}`,
          source,
          target,
          linkType: 'standard'
        });
      }
    }
  }

  // Update categories from classAssignments
  for (const [id, cat] of Object.entries(classAssignments)) {
    const node = nodesMap.get(id);
    if (node) {
      node.category = cat;
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links,
    rootNodeId: rootNodeId || (nodesMap.size > 0 ? Array.from(nodesMap.keys())[0] : 'ROOT')
  };
}

/**
 * Generates Mermaid flowchart syntax from nodes and links
 */
export function generateMermaidFromArea(area: OrgArea): string {
  const lines: string[] = [
    '---',
    'config:',
    '  theme: mc',
    '---',
    'flowchart LR'
  ];

  // Group links by source
  const linksBySource = new Map<string, { standard: string[]; backup: { target: string; label?: string }[] }>();
  for (const link of area.links) {
    if (!linksBySource.has(link.source)) {
      linksBySource.set(link.source, { standard: [], backup: [] });
    }
    const entry = linksBySource.get(link.source)!;
    if (link.linkType === 'backup') {
      entry.backup.push({ target: link.target, label: link.label });
    } else {
      entry.standard.push(link.target);
    }
  }

  // Format node label for Mermaid
  const getNodeString = (node: OrgNode): string => {
    if (node.shape === 'rect' && node.rawLabel.includes('&')) {
      return `${node.id}@{ label: "${node.rawLabel}" }`;
    }
    return `${node.id}["${node.rawLabel}"]`;
  };

  const renderedNodeInConnections = new Set<string>();

  // Add connections
  for (const [sourceId, rels] of linksBySource.entries()) {
    const sourceNode = area.nodes.find(n => n.id === sourceId);
    const sourceStr = sourceNode && !renderedNodeInConnections.has(sourceId)
      ? getNodeString(sourceNode)
      : sourceId;
    renderedNodeInConnections.add(sourceId);

    if (rels.standard.length > 0) {
      const targetsStr = rels.standard.map(tId => {
        const targetNode = area.nodes.find(n => n.id === tId);
        if (targetNode && !renderedNodeInConnections.has(tId)) {
          renderedNodeInConnections.add(tId);
          return getNodeString(targetNode);
        }
        return tId;
      }).join(' & ');

      lines.push(`    ${sourceStr} --> ${targetsStr}`);
    }

    for (const b of rels.backup) {
      const targetNode = area.nodes.find(n => n.id === b.target);
      const targetStr = targetNode && !renderedNodeInConnections.has(b.target)
        ? getNodeString(targetNode)
        : b.target;
      renderedNodeInConnections.add(b.target);
      lines.push(`    ${sourceId} -. ${b.label || 'backup'} .-> ${targetStr}`);
    }
  }

  // Add any standalone node
  for (const node of area.nodes) {
    if (!renderedNodeInConnections.has(node.id)) {
      lines.push(`    ${getNodeString(node)}`);
    }
  }

  lines.push('');

  // Add shapes annotations
  for (const node of area.nodes) {
    if (node.shape === 'rect') {
      lines.push(`    ${node.id}@{ shape: rect}`);
    }
  }

  // Add class bindings
  for (const node of area.nodes) {
    lines.push(`     ${node.id}:::${node.category}`);
  }

  // Add classDef definitions
  lines.push('    classDef processo fill:#e1d5e7,stroke:#9673a6,font-weight:bold');
  lines.push('    classDef reparto fill:#f8cecc,stroke:#b85450,font-weight:bold');
  lines.push('    classDef responsabile fill:#ffe6cc,stroke:#d79b00');
  lines.push('    classDef membro fill:#fff2cc,stroke:#d6b656');
  lines.push('    classDef backup fill:#f5f5f5,stroke:#666666,color:#333333');

  return lines.join('\n');
}
