import path from 'path';
import fs from 'fs';

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MARGIN = 44;
export const CONTENT_W = PAGE_W - MARGIN * 2;
export const FOOTER_H = 35;
export const SAFE_Y = PAGE_H - FOOTER_H - 24;

export const C = {
  navy: '#0f172a', // Slate 900
  primary: '#1e40af', // Blue 800
  blue: '#3b82f6', // Blue 500
  green: '#10b981', // Emerald 500
  amber: '#f59e0b', // Amber 500
  red: '#ef4444', // Red 500
  s50: '#f8fafc',
  s100: '#f1f5f9',
  s200: '#e2e8f0',
  s400: '#94a3b8',
  s500: '#64748b',
  g900: '#0f172a',
  white: '#ffffff',
};

export const safeStr = (v) => {
  if (v == null || v === undefined) return '—';
  if (Array.isArray(v)) return v.length > 0 ? `${v.length} entries` : 'No data';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v).trim() || '—';
};

// ─── Layout Engine (Callback Pattern) ──────────────────────────────────────────
export const makeLayout = (doc) => {
  let drawnOnPage = false;

  const ensureSpace = (y, needed, drawFn) => {
    if (drawnOnPage && y + needed > SAFE_Y) {
      doc.addPage();
      drawnOnPage = false;
      y = MARGIN;
    }
    const newY = drawFn(y);
    drawnOnPage = true;
    return newY;
  };

  const forceDrawn = () => {
    drawnOnPage = true;
  };

  return { ensureSpace, forceDrawn };
};

// ─── UI Primitives ─────────────────────────────────────────────────────────────
export const drawHeader = (
  doc,
  title = 'National Institute of Technology Kurukshetra'
) => {
  let y = MARGIN;

  const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo.png');
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, MARGIN, y - 5, { height: 40 });
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor(C.navy)
      .text(title, MARGIN + 50, y, { width: CONTENT_W - 50 });
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(C.s500)
      .text('Kurukshetra, Haryana, India - 136119', MARGIN + 50, doc.y + 2);
  } else {
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor(C.navy)
      .text(title, MARGIN, y, { align: 'center' });
  }

  doc.moveDown(0.5);
  doc.rect(MARGIN, doc.y + 10, CONTENT_W, 1.5).fill(C.navy);
  return doc.y + 25;
};

export const drawSectionBar = (doc, lay, text, y, opts = {}) => {
  const { bg = C.s100, fg = C.g900, fs = 10, h = 22 } = opts;
  return lay.ensureSpace(y, h + 5, (safeY) => {
    doc.rect(MARGIN, safeY, CONTENT_W, h).fill(bg);
    doc
      .fontSize(fs)
      .font('Helvetica-Bold')
      .fillColor(fg)
      .text(text.toUpperCase(), MARGIN + 10, safeY + (h - fs) / 2 + 1);
    return safeY + h + 10;
  });
};

export const drawKVRow = (doc, lay, label, value, y, opts = {}) => {
  const { lw = 140, fs = 9, indent = 0 } = opts;
  const valStr = safeStr(value);
  const measuredH = doc.heightOfString(valStr, {
    width: CONTENT_W - lw - 15 - indent,
    fontSize: fs,
  });
  const rowH = Math.max(fs + 6, measuredH) + 6;

  return lay.ensureSpace(y, rowH, (safeY) => {
    doc
      .fontSize(fs)
      .font('Helvetica-Bold')
      .fillColor(C.s500)
      .text(label, MARGIN + indent, safeY, { width: lw });
    const labelBottom = doc.y;

    doc
      .fontSize(fs)
      .font('Helvetica')
      .fillColor(C.g900)
      .text(valStr, MARGIN + indent + lw + 10, safeY, {
        width: CONTENT_W - indent - lw - 10,
      });
    const valueBottom = doc.y;

    return Math.max(labelBottom, valueBottom) + 6;
  });
};

export const drawBadge = (doc, text, y, color = C.primary) => {
  const fs = 9;
  const padding = 12;
  const textW = doc.widthOfString(text, { fontSize: fs });
  const bw = textW + padding * 2;
  const bh = fs + 10;

  doc.roundedRect(PAGE_W - MARGIN - bw, y, bw, bh, 6).fill(color);
  doc
    .fontSize(fs)
    .font('Helvetica-Bold')
    .fillColor(C.white)
    .text(text, PAGE_W - MARGIN - bw + padding, y + 5);
  return y; // Badges usually float right, don't advance Y
};

// ─── Recursive Data Renderer ───────────────────────────────────────────────────
export const recursiveRender = (doc, lay, obj, indentX, y) => {
  if (!obj || typeof obj !== 'object') return y;

  const fs = 8.5;
  const labelW = 110;

  for (const [key, value] of Object.entries(obj)) {
    if (['_id', 'id', '__v', 'createdAt', 'updatedAt'].includes(key)) continue;

    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .toUpperCase();

    if (Array.isArray(value)) {
      y = lay.ensureSpace(y, 20, (safeY) => {
        doc
          .fontSize(fs)
          .font('Helvetica-Bold')
          .fillColor(C.s500)
          .text(label, indentX, safeY);
        return safeY + fs + 6;
      });

      if (value.length === 0) {
        y = lay.ensureSpace(y, 15, (safeY) => {
          doc
            .fontSize(fs)
            .font('Helvetica-Oblique')
            .fillColor(C.s400)
            .text('None', indentX + 10, safeY);
          return safeY + fs + 6;
        });
      } else {
        value.forEach((item) => {
          if (typeof item === 'object') {
            y = lay.ensureSpace(y, 10, (safeY) => {
              doc
                .rect(indentX + 5, safeY, PAGE_W - MARGIN - indentX - 10, 1)
                .fill(C.s100);
              return safeY + 5;
            });
            y = recursiveRender(doc, lay, item, indentX + 10, y);
            y += 5;
          } else {
            y = drawKVRow(doc, lay, `•`, item, y, {
              lw: 20,
              indent: indentX - MARGIN + 5,
            });
          }
        });
      }
    } else {
      y = drawKVRow(doc, lay, label, value, y, {
        lw: labelW,
        indent: indentX - MARGIN,
      });
    }
  }
  return y;
};
