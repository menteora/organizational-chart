/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrgArea, OrgNode, PersonAssignment, PersonSummary } from '../types';

/**
 * Traces the parent department name and direct supervisor for a given node
 */
export function resolveNodeContext(
  node: OrgNode,
  area: OrgArea
): { departmentName: string; superiorName?: string } {
  const incomingLinks = area.links.filter((l) => l.target === node.id);

  let superiorName: string | undefined = undefined;
  let departmentName: string = 'Generale';

  if (incomingLinks.length > 0) {
    // Find the direct source node
    const parentNode = area.nodes.find((n) => n.id === incomingLinks[0].source);
    if (parentNode) {
      if (parentNode.person) {
        superiorName = `${parentNode.role} (${parentNode.person})`;
      } else {
        superiorName = parentNode.role;
      }

      // Check if parentNode itself is a department
      if (parentNode.category === 'reparto') {
        departmentName = parentNode.role.replace(/<br\s*\/?>/gi, ' ').trim();
      } else {
        // Walk upwards to find the ancestor department node
        let currentParent: OrgNode | undefined = parentNode;
        const visited = new Set<string>([node.id]);

        while (currentParent && !visited.has(currentParent.id)) {
          visited.add(currentParent.id);
          if (currentParent.category === 'reparto') {
            departmentName = currentParent.role.replace(/<br\s*\/?>/gi, ' ').trim();
            break;
          }
          const upLink = area.links.find((l) => l.target === currentParent?.id);
          if (!upLink) break;
          currentParent = area.nodes.find((n) => n.id === upLink.source);
        }
      }
    }
  }

  // Fallback if department name is still default
  if (departmentName === 'Generale') {
    if (node.departmentId) {
      const deptNode = area.nodes.find((n) => n.id === node.departmentId);
      if (deptNode) {
        departmentName = deptNode.role.replace(/<br\s*\/?>/gi, ' ').trim();
      }
    }
  }

  return { departmentName, superiorName };
}

/**
 * Extracts and maps all unique people across all organigram areas
 */
export function extractPeopleDirectory(areas: OrgArea[]): PersonSummary[] {
  const peopleMap = new Map<string, { name: string; assignments: PersonAssignment[] }>();

  areas.forEach((area) => {
    area.nodes.forEach((node) => {
      if (!node.person || !node.person.trim()) return;

      const rawPersonName = node.person.trim();
      const normKey = rawPersonName.toLowerCase();

      const { departmentName, superiorName } = resolveNodeContext(node, area);

      const assignment: PersonAssignment = {
        nodeId: node.id,
        role: node.role.replace(/<br\s*\/?>/gi, ' ').trim(),
        category: node.category,
        areaId: area.id,
        areaKey: area.key,
        areaTitle: area.title,
        departmentName,
        details: node.details,
        superiorName,
        node,
      };

      if (!peopleMap.has(normKey)) {
        peopleMap.set(normKey, {
          name: rawPersonName,
          assignments: [assignment],
        });
      } else {
        const existing = peopleMap.get(normKey)!;
        existing.assignments.push(assignment);
      }
    });
  });

  const summaries: PersonSummary[] = Array.from(peopleMap.entries()).map(([normKey, data]) => {
    const uniqueAreaKeys = Array.from(new Set(data.assignments.map((a) => a.areaKey)));
    const uniqueAreas = uniqueAreaKeys.map((key) => {
      const assignment = data.assignments.find((a) => a.areaKey === key)!;
      return { id: assignment.areaId, key: assignment.areaKey, title: assignment.areaTitle };
    });

    const hasResponsibleRole = data.assignments.some((a) => a.category === 'responsabile');
    const hasBackupRole = data.assignments.some((a) => a.category === 'backup');

    return {
      name: data.name,
      normalizedName: normKey,
      assignments: data.assignments,
      areasCount: uniqueAreas.length,
      totalRoles: data.assignments.length,
      hasResponsibleRole,
      hasBackupRole,
      areas: uniqueAreas,
    };
  });

  // Sort alphabetically by default
  return summaries.sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }));
}

/**
 * Generates CSV data of all assignments
 */
export function generatePeopleCsv(summaries: PersonSummary[]): string {
  const headers = [
    'Persona',
    'Organigramma / Area',
    'Reparto',
    'Ruolo',
    'Tipo di Ruolo',
    'Dettagli Note',
    'Superiore Diretto',
  ];

  const rows: string[] = [];
  rows.push(headers.map((h) => `"${h}"`).join(';'));

  summaries.forEach((person) => {
    person.assignments.forEach((asg) => {
      const categoryLabel =
        asg.category === 'responsabile'
          ? 'Responsabile'
          : asg.category === 'backup'
          ? 'Ruolo di Backup'
          : 'Membro';

      const row = [
        `"${person.name}"`,
        `"${asg.areaTitle}"`,
        `"${asg.departmentName}"`,
        `"${asg.role.replace(/"/g, '""')}"`,
        `"${categoryLabel}"`,
        `"${(asg.details || '').replace(/"/g, '""')}"`,
        `"${(asg.superiorName || '').replace(/"/g, '""')}"`,
      ];
      rows.push(row.join(';'));
    });
  });

  return rows.join('\r\n');
}

/**
 * Generates formatted text summary for clipboard copying
 */
export function generatePeopleTextSummary(summaries: PersonSummary[]): string {
  const lines: string[] = [
    'MAPPA COLLABORATORI E RUOLI NEGLI ORGANIGRAMMI AZIENDALI',
    `Totale collaboratori: ${summaries.length}`,
    '='.repeat(60),
    '',
  ];

  summaries.forEach((person, idx) => {
    lines.push(`${idx + 1}. ${person.name.toUpperCase()} (${person.totalRoles} ruoli in ${person.areasCount} aree)`);
    person.assignments.forEach((asg) => {
      const typeLabel =
        asg.category === 'responsabile'
          ? '[LEADER/RESPONSABILE]'
          : asg.category === 'backup'
          ? '[BACKUP]'
          : '[MEMBRO]';
      lines.push(`   - ${typeLabel} ${asg.areaTitle} > Reparto: ${asg.departmentName}`);
      lines.push(`     Ruolo: ${asg.role}${asg.details ? ` (${asg.details})` : ''}`);
      if (asg.superiorName) {
        lines.push(`     Superiore: ${asg.superiorName}`);
      }
    });
    lines.push('');
  });

  return lines.join('\n');
}
