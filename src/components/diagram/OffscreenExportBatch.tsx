/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OrgArea, LayoutDensity } from '../../types';
import { AreaDiagramSectionLR, AreaDiagramSectionTB } from './OrganigramCanvas';

interface OffscreenExportBatchProps {
  areas: OrgArea[];
  revision?: string;
  exportDate?: string;
  layoutOrientation: 'LR' | 'TB';
  density: LayoutDensity;
}

export const OffscreenExportBatch: React.FC<OffscreenExportBatchProps> = ({
  areas,
  layoutOrientation,
  density,
}) => {
  const dummySelect = () => {};
  const dummyMatch = () => false;

  return (
    <div
      id="organigramma-export-batch-container"
      data-exclude-export="true"
      style={{
        position: 'fixed',
        left: '-99999px',
        top: 0,
        width: 'max-content',
        zIndex: -9999,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {/* Individual Area Cards - Export only the pure diagram content matching #organigramma-export-target */}
      {areas.map((area) => (
        <div
          key={area.id}
          id={`export-card-${area.key}`}
          className={`bg-white text-slate-900 border border-slate-200/80 mb-10 inline-block w-fit overflow-visible shadow-sm ${
            density === 'compact'
              ? 'p-3 sm:p-4 rounded-xl min-w-[700px]'
              : 'p-5 sm:p-6 rounded-2xl min-w-[800px]'
          }`}
          style={{ width: 'max-content' }}
        >
          <div className="py-2 overflow-visible">
            {layoutOrientation === 'LR' ? (
              <AreaDiagramSectionLR
                area={area}
                selectedNode={null}
                onSelectNode={dummySelect}
                isNodeMatching={dummyMatch}
                density={density}
              />
            ) : (
              <AreaDiagramSectionTB
                area={area}
                selectedNode={null}
                onSelectNode={dummySelect}
                isNodeMatching={dummyMatch}
                density={density}
              />
            )}
          </div>
        </div>
      ))}

      {/* Complete Organigram Card (All Areas together) - Exactly matching #organigramma-export-target */}
      <div
        id="export-card-COMPLETO"
        className={`bg-white text-slate-900 border border-slate-200/80 mb-12 inline-block w-fit overflow-visible shadow-sm ${
          density === 'compact'
            ? 'p-3 sm:p-4 rounded-xl min-w-[700px]'
            : 'p-5 sm:p-6 rounded-2xl min-w-[800px]'
        }`}
        style={{ width: 'max-content' }}
      >
        <div className={density === 'compact' ? 'space-y-6 py-2' : 'space-y-10 py-2'}>
          {areas.map((area) => (
            <div key={area.id}>
              {layoutOrientation === 'LR' ? (
                <AreaDiagramSectionLR
                  area={area}
                  selectedNode={null}
                  onSelectNode={dummySelect}
                  isNodeMatching={dummyMatch}
                  density={density}
                />
              ) : (
                <AreaDiagramSectionTB
                  area={area}
                  selectedNode={null}
                  onSelectNode={dummySelect}
                  isNodeMatching={dummyMatch}
                  density={density}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
