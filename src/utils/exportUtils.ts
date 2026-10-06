/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { toPng, toSvg } from 'html-to-image';
import JSZip from 'jszip';
import { OrganigrammaBackup, OrgArea } from '../types';
import { generateMermaidFromArea } from './mermaidParser';

/**
 * Returns today's date formatted as YYYYMMDD (e.g. 20261006)
 */
export function getTodayDateFormatted(): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * Formats the required filename:
 * e.g. ORG_DIAGRAMMA_SUPPORTO_REV.07_20260624.png
 */
export function formatExportFileName(
  areaKey: string,
  revision: string,
  exportDate: string,
  extension: string
): string {
  // Clean revision if user entered just "7" or "07" or "REV.07"
  let cleanRev = revision.trim().toUpperCase();
  if (!cleanRev.startsWith('REV.')) {
    if (cleanRev.startsWith('REV')) {
      cleanRev = cleanRev.replace('REV', 'REV.');
    } else {
      cleanRev = `REV.${cleanRev}`;
    }
  }

  // Clean date - digits only or formatted
  const cleanDate = exportDate.replace(/[^0-9]/g, '');
  const finalDate = cleanDate.length >= 8 ? cleanDate.slice(0, 8) : exportDate.trim();

  // Clean area key
  const cleanArea = areaKey.toUpperCase().replace(/\s+/g, '_');

  const ext = extension.startsWith('.') ? extension.slice(1) : extension;
  return `ORG_DIAGRAMMA_${cleanArea}_${cleanRev}_${finalDate}.${ext}`;
}

/**
 * Triggers a browser download for a data URL or Blob
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers a download from a data URL (e.g. from canvas or html-to-image)
 */
export function triggerDataUrlDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers a browser download for a raw Blob (e.g. ZIP archive)
 */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * Creates an HTMLImageElement from a data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
}

export interface A4PageImage {
  filename: string;
  base64: string;
  partIndex: number;
  totalParts: number;
}

/**
 * Processes an original PNG data URL and generates A4-optimized page-ready images:
 * - Fits onto standard A4 VERTICAL / PORTRAIT proportions (1754 x 2480 px @ 300 DPI / 210 x 297 mm)
 * - Always includes a single-page full diagram fitted into A4 Vertical.
 * - If the diagram is wide or long, it also splits it cleanly across sequential vertical pages (Parte 1 di N, etc.)
 *   with proper margins and page numbering header/footer so it can be pasted directly into vertical Word/Docs pages without resizing issues.
 */
export async function generateA4OptimizedImages(
  sourceDataUrl: string,
  baseFilenameNoExt: string
): Promise<A4PageImage[]> {
  try {
    const img = await loadImage(sourceDataUrl);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    if (origW === 0 || origH === 0) return [];

    // A4 Vertical (Portrait) standard dimensions (300 DPI: 1754 x 2480 px / 210 x 297 mm)
    const a4PageWidth = 1754;
    const a4PageHeight = 2480;
    const margin = 60;
    const usableWidth = a4PageWidth - margin * 2;
    const usableHeight = a4PageHeight - margin * 2;

    const results: A4PageImage[] = [];
    const naturalAspect = origW / origH;
    const targetAspect = usableWidth / usableHeight;

    // 1. ALWAYS produce a single full-diagram page fitted onto standard vertical A4 without extra headers/footers
    const singleCanvas = document.createElement('canvas');
    singleCanvas.width = a4PageWidth;
    singleCanvas.height = a4PageHeight;
    const singleCtx = singleCanvas.getContext('2d');
    if (singleCtx) {
      singleCtx.fillStyle = '#ffffff';
      singleCtx.fillRect(0, 0, a4PageWidth, a4PageHeight);

      const scale = Math.min(usableWidth / origW, usableHeight / origH);
      const drawW = origW * scale;
      const drawH = origH * scale;
      const drawX = margin + (usableWidth - drawW) / 2;
      const drawY = margin + (usableHeight - drawH) / 2;

      singleCtx.drawImage(img, 0, 0, origW, origH, drawX, drawY, drawW, drawH);

      const singleDataUrl = singleCanvas.toDataURL('image/png');
      results.push({
        filename: `${baseFilenameNoExt}_A4_VERTICALE.png`,
        base64: singleDataUrl.replace(/^data:image\/png;base64,/, ''),
        partIndex: 1,
        totalParts: 1,
      });
    }

    // 2. If diagram is wide (naturalAspect > 1.15), split horizontally across sequential vertical A4 pages
    if (naturalAspect > 1.15) {
      const sliceCount = Math.min(4, Math.max(2, Math.ceil(naturalAspect / targetAspect)));
      const sliceWidth = origW / sliceCount;
      const overlap = sliceWidth * 0.04;

      for (let i = 0; i < sliceCount; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = a4PageWidth;
        canvas.height = a4PageHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, a4PageWidth, a4PageHeight);

        const srcX = Math.max(0, i * sliceWidth - (i > 0 ? overlap : 0));
        const srcW = Math.min(origW - srcX, sliceWidth + (i < sliceCount - 1 ? overlap : 0));
        const srcY = 0;
        const srcH = origH;

        const scale = Math.min(usableWidth / srcW, usableHeight / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const drawX = margin + (usableWidth - drawW) / 2;
        const drawY = margin + (usableHeight - drawH) / 2;

        ctx.drawImage(img, srcX, srcY, srcW, srcH, drawX, drawY, drawW, drawH);

        const a4DataUrl = canvas.toDataURL('image/png');
        results.push({
          filename: `${baseFilenameNoExt}_A4_VERTICALE_PARTE_${i + 1}_DI_${sliceCount}.png`,
          base64: a4DataUrl.replace(/^data:image\/png;base64,/, ''),
          partIndex: i + 1,
          totalParts: sliceCount,
        });
      }
    } else if (naturalAspect < 0.45) {
      // 3. If diagram is very tall, split vertically across sequential vertical A4 pages
      const sliceCount = Math.min(4, Math.max(2, Math.ceil(targetAspect / naturalAspect)));
      const sliceHeight = origH / sliceCount;
      const overlap = sliceHeight * 0.04;

      for (let i = 0; i < sliceCount; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = a4PageWidth;
        canvas.height = a4PageHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, a4PageWidth, a4PageHeight);

        const srcX = 0;
        const srcW = origW;
        const srcY = Math.max(0, i * sliceHeight - (i > 0 ? overlap : 0));
        const srcH = Math.min(origH - srcY, sliceHeight + (i < sliceCount - 1 ? overlap : 0));

        const scale = Math.min(usableWidth / srcW, usableHeight / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const drawX = margin + (usableWidth - drawW) / 2;
        const drawY = margin + (usableHeight - drawH) / 2;

        ctx.drawImage(img, srcX, srcY, srcW, srcH, drawX, drawY, drawW, drawH);

        const a4DataUrl = canvas.toDataURL('image/png');
        results.push({
          filename: `${baseFilenameNoExt}_A4_VERTICALE_PARTE_${i + 1}_DI_${sliceCount}.png`,
          base64: a4DataUrl.replace(/^data:image\/png;base64,/, ''),
          partIndex: i + 1,
          totalParts: sliceCount,
        });
      }
    }

    return results;
  } catch (err) {
    console.error('Errore durante la generazione delle immagini A4:', err);
    return [];
  }
}

/**
 * Generates an A4 Horizontal (Landscape: 2480 x 1754 px @ 300 DPI) page-ready image
 */
export async function generateA4HorizontalImages(
  sourceDataUrl: string,
  baseFilenameNoExt: string
): Promise<A4PageImage[]> {
  try {
    const img = await loadImage(sourceDataUrl);
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    if (origW === 0 || origH === 0) return [];

    const a4PageWidth = 2480;
    const a4PageHeight = 1754;
    const margin = 60;
    const usableWidth = a4PageWidth - margin * 2;
    const usableHeight = a4PageHeight - margin * 2;

    const canvas = document.createElement('canvas');
    canvas.width = a4PageWidth;
    canvas.height = a4PageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, a4PageWidth, a4PageHeight);

    const scale = Math.min(usableWidth / origW, usableHeight / origH);
    const drawW = origW * scale;
    const drawH = origH * scale;
    const drawX = margin + (usableWidth - drawW) / 2;
    const drawY = margin + (usableHeight - drawH) / 2;

    ctx.drawImage(img, 0, 0, origW, origH, drawX, drawY, drawW, drawH);

    const dataUrl = canvas.toDataURL('image/png');
    return [{
      filename: `${baseFilenameNoExt}_A4_ORIZZONTALE.png`,
      base64: dataUrl.replace(/^data:image\/png;base64,/, ''),
      partIndex: 1,
      totalParts: 1,
    }];
  } catch (err) {
    console.error('Errore durante la generazione A4 orizzontale:', err);
    return [];
  }
}

/**
 * Exports a DOM element as an A4 Horizontal (Landscape) image
 */
export async function exportElementAsA4HorizontalPng(
  element: HTMLElement,
  filename: string,
  scale: number = 2,
  isDark: boolean = false
): Promise<string> {
  const bgColor = isDark ? '#090d16' : '#ffffff';
  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: bgColor,
    cacheBust: true,
    style: { transform: 'none', margin: '0', overflow: 'visible', maxWidth: 'none' },
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
          return false;
        }
      }
      return true;
    },
  });

  const baseFilenameNoExt = filename.replace(/\.png$/i, '');
  const a4Images = await generateA4HorizontalImages(dataUrl, baseFilenameNoExt);
  if (a4Images.length > 0) {
    const singlePage = a4Images[0];
    const byteCharacters = atob(singlePage.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    triggerBlobDownload(blob, singlePage.filename);
    return singlePage.filename;
  }
  return filename;
}

/**
 * Copies a DOM element as an A4 Horizontal (Landscape) image to clipboard
 */
export async function copyElementAsA4HorizontalPngToClipboard(
  element: HTMLElement,
  scale: number = 2,
  isDark: boolean = false
): Promise<boolean> {
  const bgColor = isDark ? '#090d16' : '#ffffff';
  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: bgColor,
    cacheBust: true,
    style: { transform: 'none', margin: '0', overflow: 'visible', maxWidth: 'none' },
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
          return false;
        }
      }
      return true;
    },
  });

  const a4Images = await generateA4HorizontalImages(dataUrl, 'A4_ORIZZONTALE');
  if (a4Images.length > 0) {
    const singlePage = a4Images[0];
    const byteCharacters = atob(singlePage.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    }
  }
  return false;
}

/**
 * Exports a DOM element as an A4 Vertical (Portrait: 1754 x 2480 px @ 300 DPI) page-ready image
 */
export async function exportElementAsA4VerticalPng(
  element: HTMLElement,
  filename: string,
  scale: number = 2,
  isDark: boolean = false
): Promise<string> {
  const bgColor = isDark ? '#090d16' : '#ffffff';
  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: bgColor,
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0',
      overflow: 'visible',
      maxWidth: 'none',
    },
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
          return false;
        }
      }
      return true;
    },
  });

  const baseFilenameNoExt = filename.replace(/\.png$/i, '');
  const a4Images = await generateA4OptimizedImages(dataUrl, baseFilenameNoExt);
  if (a4Images.length > 0) {
    const singlePage = a4Images[0];
    const byteCharacters = atob(singlePage.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    triggerBlobDownload(blob, singlePage.filename);
    return singlePage.filename;
  }
  return filename;
}

/**
 * Copies a DOM element as an A4 Vertical (Portrait) image directly to clipboard
 */
export async function copyElementAsA4VerticalPngToClipboard(
  element: HTMLElement,
  scale: number = 2,
  isDark: boolean = false
): Promise<boolean> {
  const bgColor = isDark ? '#090d16' : '#ffffff';
  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: bgColor,
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0',
      overflow: 'visible',
      maxWidth: 'none',
    },
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
          return false;
        }
      }
      return true;
    },
  });

  const a4Images = await generateA4OptimizedImages(dataUrl, 'A4_VERTICALE');
  if (a4Images.length > 0) {
    const singlePage = a4Images[0];
    const byteCharacters = atob(singlePage.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    }
  }
  return false;
}

/**
 * Exports a DOM element as a high-resolution PNG image
 */
export async function exportElementAsPng(
  element: HTMLElement,
  filename: string,
  scale: number = 2,
  isDark: boolean = false
): Promise<void> {
  const bgColor = isDark ? '#090d16' : '#ffffff';

  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: bgColor,
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0',
      overflow: 'visible',
      maxWidth: 'none',
    },
    filter: (node) => {
      // Exclude interactive controls like zoom toolbar or action buttons from the exported image
      if (node instanceof HTMLElement) {
        if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
          return false;
        }
      }
      return true;
    }
  });

  triggerDataUrlDownload(dataUrl, filename);
}

/**
 * Copies a DOM element as a high-resolution PNG image directly to clipboard
 */
export async function copyElementAsPngToClipboard(
  element: HTMLElement,
  scale: number = 2,
  isDark: boolean = false
): Promise<boolean> {
  const bgColor = isDark ? '#090d16' : '#ffffff';

  const dataUrl = await toPng(element, {
    pixelRatio: scale,
    backgroundColor: bgColor,
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0',
      overflow: 'visible',
      maxWidth: 'none',
    },
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
          return false;
        }
      }
      return true;
    },
  });

  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard write failed, will fallback to download', err);
  }
  return false;
}

/**
 * Exports a DOM element as an SVG image
 */
export async function exportElementAsSvg(
  element: HTMLElement,
  filename: string,
  isDark: boolean = false
): Promise<void> {
  const bgColor = isDark ? '#090d16' : '#ffffff';

  const dataUrl = await toSvg(element, {
    backgroundColor: bgColor,
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0',
      overflow: 'visible',
      maxWidth: 'none',
    },
    filter: (node) => {
      if (node instanceof HTMLElement) {
        if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
          return false;
        }
      }
      return true;
    }
  });

  triggerDataUrlDownload(dataUrl, filename);
}

/**
 * Exports application backup JSON
 */
export function exportAppBackup(
  areas: OrgArea[],
  revision: string,
  exportDate: string,
  areaKey: string
): void {
  const backupData: OrganigrammaBackup = {
    format: 'ORGANIGRAMMA_APP_BACKUP_V1',
    version: '1.0',
    revision,
    exportDate,
    timestamp: new Date().toISOString(),
    metadata: {
      appName: 'Organigramma Aziendale',
      revision,
      exportDate,
    },
    areas,
  };

  const jsonContent = JSON.stringify(backupData, null, 2);
  const filename = formatExportFileName(areaKey, revision, exportDate, 'json');
  triggerFileDownload(jsonContent, filename, 'application/json');
}

/**
 * Validates whether an imported JSON file matches the expected OrganigrammaBackup schema
 */
export function validateBackupJson(parsed: unknown): parsed is OrganigrammaBackup {
  if (!parsed || typeof parsed !== 'object') return false;
  const obj = parsed as Record<string, unknown>;
  return (
    obj.format === 'ORGANIGRAMMA_APP_BACKUP_V1' &&
    Array.isArray(obj.areas) &&
    typeof obj.revision === 'string'
  );
}

export interface ZipExportProgress {
  stepName: string;
  current: number;
  total: number;
}

/**
 * Exports ALL Mermaid (.mmd) files, ALL High-Resolution PNG images,
 * and a complete JSON backup into a single, organized ZIP archive.
 */
export async function exportAllOrganigramZip(
  areas: OrgArea[],
  revision: string,
  exportDate: string,
  scale: number = 2,
  onProgress?: (progress: ZipExportProgress) => void
): Promise<string> {
  const zip = new JSZip();

  // Calculation of total steps:
  // - Mermaid files: areas.length + 1 (completo)
  // - PNG images: areas.length + 1 (completo)
  // - Backup JSON: 1
  // - Finalization & Compression: 1
  const totalSteps = areas.length * 2 + 4;
  let currentStep = 0;

  const updateProgress = (stepName: string) => {
    currentStep++;
    onProgress?.({ stepName, current: currentStep, total: totalSteps });
  };

  const cleanRev = revision.trim();
  const finalDate = exportDate.trim();

  // Create organized directory folders inside the ZIP
  // Folders inside the zip
  const imgFolder = zip.folder('immagini');
  const a4Folder = zip.folder('immagini_formato_a4');
  const mmdFolder = zip.folder('mermaid');
  const backupFolder = zip.folder('backup');

  // Track generated A4 filenames for README
  const a4GeneratedFiles: string[] = [];

  // 1. Export individual Mermaid files
  for (const area of areas) {
    updateProgress(`File Mermaid: ${area.title}`);
    const mmdContent = area.rawMermaid || generateMermaidFromArea(area);
    const mmdFilename = formatExportFileName(area.key, cleanRev, finalDate, 'mmd');
    mmdFolder?.file(mmdFilename, mmdContent);
  }

  // Completo Mermaid
  updateProgress('File Mermaid: Completo (Tutti i Processi)');
  const completeMmd = areas
    .map((a) => a.rawMermaid || generateMermaidFromArea(a))
    .join('\n\n---\n\n');
  const completeMmdFilename = formatExportFileName('COMPLETO', cleanRev, finalDate, 'mmd');
  mmdFolder?.file(completeMmdFilename, completeMmd);

  // 2. Generate PNG images for each area from rendered cards
  for (const area of areas) {
    updateProgress(`Immagine HD: ${area.title}`);
    const cardEl = document.getElementById(`export-card-${area.key}`);
    const pngFilename = formatExportFileName(area.key, cleanRev, finalDate, 'png');
    const baseNameNoExt = pngFilename.replace(/\.png$/i, '');

    if (cardEl) {
      try {
        const dataUrl = await toPng(cardEl, {
          pixelRatio: scale,
          backgroundColor: '#ffffff',
          cacheBust: true,
          style: {
            transform: 'none',
            margin: '0',
            overflow: 'visible',
            maxWidth: 'none',
          },
          filter: (node) => {
            if (node instanceof HTMLElement) {
              if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
                return false;
              }
            }
            return true;
          },
        });
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        imgFolder?.file(pngFilename, base64, { base64: true });

        // Generate additional A4-optimized page-ready images
        updateProgress(`Ottimizzazione A4: ${area.title}`);
        const a4Images = await generateA4OptimizedImages(dataUrl, baseNameNoExt);
        for (const a4Img of a4Images) {
          a4Folder?.file(a4Img.filename, a4Img.base64, { base64: true });
          a4GeneratedFiles.push(a4Img.filename);
        }
      } catch (err) {
        console.error(`Impossibile generare immagine per ${area.key}:`, err);
      }
    }
  }

  // Completo PNG
  updateProgress('Immagine HD: Organigramma Completo');
  const completeCardEl = document.getElementById('export-card-COMPLETO');
  const completePngFilename = formatExportFileName('COMPLETO', cleanRev, finalDate, 'png');
  const completeBaseNameNoExt = completePngFilename.replace(/\.png$/i, '');

  if (completeCardEl) {
    try {
      const dataUrl = await toPng(completeCardEl, {
        pixelRatio: scale,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          transform: 'none',
          margin: '0',
          overflow: 'visible',
          maxWidth: 'none',
        },
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (node.dataset?.excludeExport === 'true' || node.classList?.contains('no-export')) {
              return false;
            }
          }
          return true;
        },
      });
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
      imgFolder?.file(completePngFilename, base64, { base64: true });

      // Generate additional A4-optimized page-ready images for Completo
      updateProgress('Ottimizzazione A4: Organigramma Completo');
      const a4Images = await generateA4OptimizedImages(dataUrl, completeBaseNameNoExt);
      for (const a4Img of a4Images) {
        a4Folder?.file(a4Img.filename, a4Img.base64, { base64: true });
        a4GeneratedFiles.push(a4Img.filename);
      }
    } catch (err) {
      console.error('Impossibile generare immagine per Organigramma Completo:', err);
    }
  }

  // 3. Backup JSON
  updateProgress('Backup Dati JSON');
  const backupData: OrganigrammaBackup = {
    format: 'ORGANIGRAMMA_APP_BACKUP_V1',
    version: '1.0',
    revision: cleanRev,
    exportDate: finalDate,
    timestamp: new Date().toISOString(),
    metadata: {
      appName: 'Organigramma Aziendale',
      revision: cleanRev,
      exportDate: finalDate,
    },
    areas,
  };
  const jsonContent = JSON.stringify(backupData, null, 2);
  const jsonFilename = formatExportFileName('BACKUP_COMPLETO', cleanRev, finalDate, 'json');
  backupFolder?.file(jsonFilename, jsonContent);

  // 4. README file inside the zip
  updateProgress('Creazione file LEGGIMI e compressione ZIP');
  const a4ListString = a4GeneratedFiles.length > 0
    ? a4GeneratedFiles.map((f) => `  - ${f}`).join('\n')
    : '  - (nessun file A4 generato)';

  const dynamicImgList = areas
    .map((a) => `  - ${formatExportFileName(a.key, cleanRev, finalDate, 'png')}`)
    .concat(`  - ${formatExportFileName('COMPLETO', cleanRev, finalDate, 'png')}`)
    .join('\n');

  const dynamicMmdList = areas
    .map((a) => `  - ${formatExportFileName(a.key, cleanRev, finalDate, 'mmd')}`)
    .concat(`  - ${formatExportFileName('COMPLETO', cleanRev, finalDate, 'mmd')}`)
    .join('\n');

  const readmeContent = `ORGANIGRAMMA AZIENDALE — PACCHETTO COMPLETO
======================================================
Codice Revisione: ${cleanRev}
Data di Emissione: ${finalDate}
Data Generazione Pacchetto: ${new Date().toLocaleString('it-IT')}

CONTENUTO DELL'ARCHIVIO ZIP:
------------------------------------------------------
📁 /immagini (Dimensioni native originali in altissima risoluzione)
${dynamicImgList}

📁 /immagini_formato_a4 (Ottimizzate per documenti A4 Verticali / Word / PDF / Stampe)
${a4ListString}

📁 /mermaid (File sorgente Mermaid)
${dynamicMmdList}

📁 /backup (File di ripristino istantaneo per l'applicazione)
  - ${jsonFilename}

GUIDA ALL'INSERIMENTO NEI DOCUMENTI (WORD / GOOGLE DOCS / PPT):
------------------------------------------------------
1. /immagini:
   Contiene l'organigramma a pixel nativi completi in un'unica immagine continua ad alta risoluzione.
   Ideale se si vuole ridimensionare liberamente su poster, canvas o web.

2. /immagini_formato_a4:
   Immagini già proporzionate al formato pagina standard A4 VERTICALE (210 x 297 mm, Portrait).
   - Pronte per essere inserite direttamente nei documenti Word, relazioni tecniche e manuali
     senza sbordare e mantenendo la perfetta leggibilità di tutti i reparti e ruoli.
`;

  zip.file('LEGGIMI_ARCHIVIO.txt', readmeContent);

  // 5. Build ZIP and trigger download
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = formatExportFileName('ARCHIVIO_COMPLETO', cleanRev, finalDate, 'zip');
  triggerBlobDownload(zipBlob, zipFilename);

  return zipFilename;
}
