/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { OrgArea, LayoutDensity } from '../../types';
import { AreaDiagramSectionLR, AreaDiagramSectionTB } from './OrganigramCanvas';
import { formatSheetTabTitle } from '../../constants/initialData';

interface OffscreenExportBatchProps {
  areas: OrgArea[];
  revision: string;
  exportDate: string;
  layoutOrientation: 'LR' | 'TB';
  density: LayoutDensity;
}

export const OffscreenExportBatch: React.FC<OffscreenExportBatchProps> = ({
  areas,
  revision,
  exportDate,
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
      {/* Individual Area Cards - Structured for Vertical A4 Portrait Proportion */}
      {areas.map((area) => {
        const titleFormatted = formatSheetTabTitle(area.title);
        return (
          <div
            key={area.id}
            id={`export-card-${area.key}`}
            className="bg-white text-slate-900 border border-slate-200 mb-10 w-[860px] max-w-[860px] overflow-visible shadow-sm p-6 sm:p-8 rounded-2xl flex flex-col justify-between"
            style={{ width: '860px' }}
          >
            {/* Header Document Banner */}
            <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">
                  Organigramma Aziendale Ufficiale
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 uppercase">
                  {titleFormatted}
                </h2>
              </div>
              <div className="text-right font-mono text-[11px] text-slate-500">
                <div className="font-semibold text-slate-700">Codice: {revision}</div>
                <div>Emissione: {exportDate}</div>
              </div>
            </div>

            {/* Diagram Content */}
            <div className="py-2 overflow-visible flex justify-center">
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

            {/* Footer Document Banner */}
            <div className="border-t border-slate-200 pt-3 mt-6 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>ORG_DIAGRAMMA_{area.key}_{revision}_{exportDate}</span>
              <span>FORMATO VERTICALE • DOCUMENTO UFFICIALE</span>
            </div>
          </div>
        );
      })}

      {/* Complete Organigram Card (All Areas together in Vertical Sequence) */}
      <div
        id="export-card-COMPLETO"
        className="bg-white text-slate-900 border border-slate-200 mb-12 w-[860px] max-w-[860px] overflow-visible shadow-sm p-6 sm:p-8 rounded-2xl flex flex-col justify-between"
        style={{ width: '860px' }}
      >
        {/* Header Document Banner */}
        <div className="border-b border-slate-200 pb-3 mb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">
              Organigramma Aziendale Completo
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 uppercase">
              Tutti i Processi Aziendali
            </h2>
          </div>
          <div className="text-right font-mono text-[11px] text-slate-500">
            <div className="font-semibold text-slate-700">Codice: {revision}</div>
            <div>Emissione: {exportDate}</div>
          </div>
        </div>

        {/* All Areas Content matching onscreen in vertical flow */}
        <div className="space-y-8 py-2">
          {areas.map((area) => (
            <div key={area.id} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
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

        {/* Footer Document Banner */}
        <div className="border-t border-slate-200 pt-3 mt-8 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>ORG_DIAGRAMMA_COMPLETO_{revision}_{exportDate}</span>
          <span>FORMATO VERTICALE • DOCUMENTO UFFICIALE</span>
        </div>
      </div>
    </div>
  );
};
