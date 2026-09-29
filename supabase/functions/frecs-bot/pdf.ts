// =====================================================================
// PDF en el servidor: el motor arma el mismo HTML de siempre y aquí se dibuja con
// jsPDF (texto real, liviano). Entiende lo que usan los PDF de Frecs: cabecera,
// leyenda de colores, tablas (con colspan/rowspan y colores por fila o celda),
// dos columnas (entrega), títulos, párrafos, listas, imágenes y saltos de página.
// =====================================================================
import { jsPDF } from "npm:jspdf@3.0.3";
import { autoTable } from "npm:jspdf-autotable@5.0.2";
import { parseHTML } from "npm:linkedom@0.18.5";

type Decl = Record<string, string>;
type Area = { x: number; w: number };
const MARGEN = 10;
const PT = 0.75; // px → pt

// Letras que las fuentes base del PDF no traen: se cambian por equivalentes
const CAMBIOS: Record<string, string> = {
  "✅": "OK", "✔": "OK", "✓": "OK", "❌": "X", "✗": "X", "✕": "X", "⚠": "(!)", "🚨": "(!)", "☑": "[X]", "☐": "[ ]",
  "🔵": "(+)", "🟢": "", "🔴": "", "⏳": "", "🔒": "", "🍾": "", "🏷": "", "📦": "", "👻": "", "🛑": "", "📋": "", "📝": "", "⚖": "", "🎯": "",
  "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "×": "x", "−": "-",
  "𝐹𝓇𝑒𝒸𝓈! ツ": "Frecs!", "ツ": ""
};
const WINANSI = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ".split(""));
export function limpiar(s: string): string {
  let t = String(s ?? "");
  for (const k of Object.keys(CAMBIOS)) if (t.includes(k)) t = t.split(k).join(CAMBIOS[k]);
  t = t.replace(/\uFE0F/g, "");
  let o = "";
  for (const ch of t) { const c = ch.codePointAt(0)!; if (c <= 0xff || WINANSI.has(ch)) o += ch; }
  return o.replace(/[ \t]+/g, " ");
}

// ---------- estilos: reglas de <style> + style="" ----------
function leerCss(texto: string) {
  const reglas: { sel: string; d: Decl }[] = [];
  const limpio = texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@page\s*\{[^}]*\}/g, "").replace(/@media[^{]*\{([\s\S]*?\})\s*\}/g, "");
  for (const bloque of limpio.split("}")) {
    const i = bloque.indexOf("{"); if (i < 0) continue;
    const sels = bloque.slice(0, i).trim(), cuerpo = bloque.slice(i + 1);
    if (!sels || sels.startsWith("@")) continue;
    const d = decl(cuerpo);
    sels.split(",").map(x => x.trim()).filter(Boolean).forEach(sel => reglas.push({ sel, d }));
  }
  return reglas;
}
function decl(t: string): Decl {
  const d: Decl = {};
  String(t || "").split(";").forEach(p => { const i = p.indexOf(":"); if (i > 0) d[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).replace(/!important/g, "").trim(); });
  return d;
}
function colorRgb(v?: string): [number, number, number] | null {
  if (!v) return null;
  v = v.trim().toLowerCase();
  const nombres: Record<string, string> = { white: "#ffffff", black: "#000000", red: "#ff0000", transparent: "" };
  if (v in nombres) v = nombres[v];
  if (!v) return null;
  let m = /^#([0-9a-f]{3})$/.exec(v);
  if (m) return [0, 1, 2].map(k => parseInt(m![1][k] + m![1][k], 16)) as [number, number, number];
  m = /^#([0-9a-f]{6})/.exec(v);
  if (m) return [0, 2, 4].map(k => parseInt(m![1].slice(k, k + 2), 16)) as [number, number, number];
  m = /^rgba?\(([^)]+)\)/.exec(v);
  if (m) { const p = m[1].split(",").map(x => parseFloat(x)); if (p.length > 3 && p[3] === 0) return null; return [p[0], p[1], p[2]]; }
  return null;
}
const fondo = (d: Decl) => colorRgb(d["background-color"] || (d["background"] || "").split(" ").find(x => x.startsWith("#") || x.startsWith("rgb")));

export async function htmlAPdf(html: string): Promise<Uint8Array> {
  const { document } = parseHTML(html);
  const reglas = leerCss(Array.from(document.querySelectorAll("style")).map((s: any) => s.textContent).join("\n"));
  const cacheEst = new Map<any, Decl>();
  const est = (el: any): Decl => {
    if (!el || el.nodeType !== 1) return {};
    if (cacheEst.has(el)) return cacheEst.get(el)!;
    const d: Decl = {};
    for (const r of reglas) { try { if (el.matches(r.sel)) Object.assign(d, r.d); } catch (_) { /* selector no soportado */ } }
    Object.assign(d, decl(el.getAttribute("style") || ""));
    cacheEst.set(el, d);
    return d;
  };
  const horizontal = /size:\s*(letter\s+)?landscape/i.test(html);
  const doc: any = new jsPDF({ unit: "mm", format: "letter", orientation: horizontal ? "landscape" : "portrait", compress: true });
  const anchoPag = doc.internal.pageSize.getWidth(), altoPag = doc.internal.pageSize.getHeight();
  const util = { x: MARGEN, w: anchoPag - 2 * MARGEN };
  let y = MARGEN;
  const nuevaPag = () => { doc.addPage(); y = MARGEN; };
  const espacio = (mm: number) => { if (y + mm > altoPag - MARGEN) nuevaPag(); };
  const tam = (d: Decl, def: number) => { const m = /([\d.]+)px/.exec(d["font-size"] || ""); return m ? parseFloat(m[1]) * PT : def; };
  const negrita = (d: Decl) => /bold|[6-9]00/.test(d["font-weight"] || "");

  // Texto de un elemento: <br> y bloques internos pasan a saltos de línea
  const texto = (el: any): string => {
    let out = "";
    el.childNodes.forEach((n: any) => {
      if (n.nodeType === 3) out += n.textContent;
      else if (n.nodeType === 1) {
        const tag = n.tagName;
        if (tag === "BR") out += "\n";
        else if (tag === "STYLE" || tag === "SCRIPT") return;
        else if (["DIV", "P", "LI", "TR", "TABLE", "H1", "H2", "H3", "H4"].includes(tag)) out += "\n" + texto(n) + "\n";
        else out += texto(n);
      }
    });
    return out;
  };
  const txt = (el: any) => limpiar(texto(el)).split("\n").map(x => x.trim()).filter(x => x).join("\n");

  function escribir(t: string, area: Area, opc: { size?: number; bold?: boolean; color?: [number, number, number] | null; align?: string; fill?: [number, number, number] | null }) {
    if (!t) return;
    const size = opc.size || 9.5;
    doc.setFont("helvetica", opc.bold ? "bold" : "normal"); doc.setFontSize(size);
    const lineas = doc.splitTextToSize(t, area.w);
    const alto = lineas.length * size * 0.3528 * 1.25;
    espacio(Math.min(alto, 30) + 1);
    if (opc.fill) { doc.setFillColor(...opc.fill); doc.rect(area.x, y - size * 0.3528 * 0.2, area.w, alto + 1, "F"); }
    doc.setTextColor(...(opc.color || [17, 17, 17]));
    const x = opc.align === "center" ? area.x + area.w / 2 : opc.align === "right" ? area.x + area.w : area.x;
    lineas.forEach((l: string) => { espacio(size * 0.3528 * 1.3); doc.text(l, x, y + size * 0.3528, { align: opc.align === "center" ? "center" : opc.align === "right" ? "right" : "left", baseline: "alphabetic" }); y += size * 0.3528 * 1.25; });
    y += 1.2;
  }

  // Cabecera de los PDF: marca · título · fecha, con una línea abajo
  function cabecera(tabla: any, area: Area) {
    const tds = Array.from(tabla.querySelectorAll("td")) as any[];
    espacio(14);
    const y0 = y;
    doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(17, 17, 17);
    doc.text(limpiar(tds[0]?.textContent || "Frecs!").trim() || "Frecs!", area.x, y0 + 5);
    const col = colorRgb(est(tds[1])["color"]) || [0, 51, 153];
    doc.setFontSize(11); doc.setTextColor(...col);
    doc.text(limpiar(tds[1]?.textContent || "").trim(), area.x + area.w / 2, y0 + 5, { align: "center", maxWidth: area.w * 0.5 });
    doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(102, 102, 102);
    doc.text(limpiar(tds[2]?.textContent || "").trim(), area.x + area.w, y0 + 5, { align: "right" });
    doc.setDrawColor(34, 34, 34); doc.setLineWidth(0.5); doc.line(area.x, y0 + 8, area.x + area.w, y0 + 8);
    y = y0 + 11;
  }

  // Cabecera del informe de prioridad: títulos, reglas de color y logo
  function cabeceraInforme(tabla: any, area: Area) {
    espacio(45);
    const y0 = y, alto = 38, wT = area.w * 0.5, wR = area.w * 0.35, wL = area.w - wT - wR;
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5); doc.rect(area.x, y0, area.w, alto);
    doc.setLineWidth(0.25); doc.line(area.x + wT, y0, area.x + wT, y0 + alto); doc.line(area.x + wT + wR, y0, area.x + wT + wR, y0 + alto);
    const tit = tabla.querySelector(".title-box"), sub = tabla.querySelector(".subtitle-box");
    doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "bold");
    doc.setFontSize(15); doc.text(limpiar(tit?.textContent || "").trim(), area.x + wT / 2, y0 + 14, { align: "center" });
    doc.line(area.x, y0 + 22, area.x + wT, y0 + 22);
    doc.setFontSize(13); doc.text(limpiar(sub?.textContent || "").trim(), area.x + wT / 2, y0 + 31, { align: "center" });
    const filas = Array.from(tabla.querySelectorAll(".rules-table tr")) as any[];
    const hF = alto / Math.max(filas.length, 1);
    filas.forEach((tr: any, k: number) => {
      const tds = Array.from(tr.querySelectorAll("td")) as any[];
      tds.forEach((td: any, j: number) => {
        const x = area.x + wT + j * (wR / 2), yy = y0 + k * hF;
        const f = fondo(est(td)); if (f) { doc.setFillColor(...f); doc.rect(x, yy, wR / 2, hF, "F"); }
        doc.rect(x, yy, wR / 2, hF);
        doc.setFont("helvetica", j === 0 || k < filas.length - 1 ? "bold" : "normal"); doc.setFontSize(7.5); doc.setTextColor(0, 0, 0);
        doc.text(limpiar(td.textContent).trim(), x + wR / 4, yy + hF / 2 + 1, { align: "center" });
      });
    });
    const img = tabla.querySelector("img");
    if (img) {
      const src = img.getAttribute("src") || "";
      try { const lado = Math.min(wL - 6, alto - 6); doc.addImage(src, src.includes("png") ? "PNG" : "JPEG", area.x + wT + wR + (wL - lado) / 2, y0 + (alto - lado) / 2, lado, lado); } catch (_) { /* sin logo */ }
    } else {
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text(limpiar(tabla.querySelector(".brand-box")?.textContent || "").trim(), area.x + wT + wR + wL / 2, y0 + alto / 2, { align: "center", maxWidth: wL - 4 });
    }
    y = y0 + alto + 4;
  }

  // Filas propias de una tabla (sin entrar a tablas internas)
  function filasDe(t: any): any[] {
    const out: any[] = [];
    (Array.from(t.children) as any[]).forEach((c: any) => {
      if (c.tagName === "TR") out.push(c);
      else if (["THEAD", "TBODY", "TFOOT"].includes(c.tagName)) (Array.from(c.children) as any[]).forEach((r: any) => { if (r.tagName === "TR") out.push(r); });
    });
    return out;
  }

  // Tabla genérica con autotable
  function tabla(t: any, area: Area) {
    const dT = est(t);
    const filasHead: any[] = [], filasBody: any[] = [];
    const anchos: Record<number, number> = {};
    const trs = filasDe(t);
    const tamBase = tam(est(t.querySelector("td,th")), 7.2);
    trs.forEach((tr: any) => {
      const dTr = est(tr), enHead = tr.parentNode?.tagName === "THEAD";
      const celdas = (Array.from(tr.children) as any[]).filter((c: any) => c.tagName === "TD" || c.tagName === "TH").map((c: any, k: number) => {
        const d = est(c), f = fondo(d) || fondo(dTr);
        const w = /([\d.]+)%/.exec(c.getAttribute("width") || d["width"] || "");
        if (w && enHead) anchos[k] = area.w * parseFloat(w[1]) / 100;
        const soloNegrita = c.children.length === 1 && c.children[0].tagName === "B" && !c.textContent.replace(c.children[0].textContent, "").trim();
        const st: any = {
          halign: (d["text-align"] || (c.tagName === "TH" ? "center" : "")) === "left" ? "left" : (d["text-align"] === "right" ? "right" : (d["text-align"] === "center" || c.tagName === "TH" || t.classList.contains("t") || t.classList.contains("leyenda") ? "center" : "left")),
          fontStyle: negrita(d) || soloNegrita || c.tagName === "TH" ? "bold" : (/italic/.test(d["font-style"] || "") ? "italic" : "normal"),
          fontSize: tam(d, tamBase)
        };
        if (f) st.fillColor = f;
        const col = colorRgb(d["color"]); if (col) st.textColor = col;
        // Total en negrilla y al lado el detalle normal (entrega de turno: «95 = 50 (B8) + 45 (C4)»)
        const tt = c.querySelector("b.tt");
        const mixto = tt && !soloNegrita ? { b: limpiar(tt.textContent).trim(), r: limpiar(c.textContent.replace(tt.textContent, "")).replace(/\s+/g, " ").trim() } : null;
        return { content: txt(c), colSpan: +(c.getAttribute("colspan") || 1), rowSpan: +(c.getAttribute("rowspan") || 1), styles: st, mixto };
      });
      if (!celdas.length) return;
      (enHead ? filasHead : filasBody).push(celdas);
    });
    if (!filasHead.length && filasBody.length && Array.from(trs[0]?.children || []).every((c: any) => c.tagName === "TH")) filasHead.push(filasBody.shift());
    const columnStyles: any = {};
    Object.keys(anchos).forEach(k => { columnStyles[k] = { cellWidth: anchos[+k] }; });
    const esInfo = t.classList.contains("info"), esLey = t.classList.contains("leyenda");
    espacio(12);
    autoTable(doc, {
      startY: y, head: filasHead, body: filasBody, theme: "grid", tableWidth: area.w,
      margin: { left: area.x, right: anchoPag - area.x - area.w, top: MARGEN, bottom: MARGEN },
      styles: { font: "helvetica", fontSize: tamBase, cellPadding: esLey ? 0.9 : 1.1, lineColor: esInfo ? [153, 153, 153] : [119, 119, 119], lineWidth: 0.15, textColor: [17, 17, 17], overflow: "linebreak", valign: "middle" },
      headStyles: { fillColor: [242, 242, 242], textColor: [0, 51, 153], fontStyle: "bold", halign: "center" },
      columnStyles, rowPageBreak: "avoid", showHead: "everyPage",
      // Celdas con parte en negrilla: si cabe en una línea se dibuja a mano (negrilla + normal)
      willDrawCell: (d: any) => {
        const m = d.cell.raw && d.cell.raw.mixto; if (!m) return;
        const fs = d.cell.styles.fontSize; doc.setFontSize(fs);
        doc.setFont("helvetica", "bold"); const wb = doc.getTextWidth(m.b + " ");
        doc.setFont("helvetica", "normal"); const wr = doc.getTextWidth(m.r);
        if (wb + wr <= d.cell.width - 2 * 1.1) { d.cell.raw.aMano = true; d.cell.text = []; }
      },
      didDrawCell: (d: any) => {
        const m = d.cell.raw && d.cell.raw.mixto; if (!m || !d.cell.raw.aMano) return;
        const fs = d.cell.styles.fontSize, yb = d.cell.y + d.cell.height / 2 + fs * 0.3528 * 0.35;
        const x0 = d.cell.x + 1.1;
        doc.setTextColor(17, 17, 17); doc.setFontSize(fs);
        doc.setFont("helvetica", "bold"); doc.text(m.b, x0, yb);
        const wb = doc.getTextWidth(m.b + " ");
        doc.setFont("helvetica", "normal"); doc.text(m.r, x0 + wb, yb);
      }
    });
    y = doc.lastAutoTable.finalY + (esLey ? 2 : 3);
    if (dT["margin-bottom"]) y += 1;
  }

  // Dos columnas (entrega de turno): cada una por su lado y se sigue debajo de la más larga
  function columnas(t: any, area: Area) {
    const primera = filasDe(t)[0];
    const tds = primera ? (Array.from(primera.children) as any[]).filter((c: any) => c.tagName === "TD") : [];
    if (!tds.length) return;
    const n = tds.length, sep = 4, w = (area.w - sep * (n - 1)) / n;
    const pag0 = doc.getCurrentPageInfo().pageNumber, y0 = y;
    let finPag = pag0, finY = y0;
    tds.forEach((td: any, k: number) => {
      doc.setPage(pag0); y = y0;
      hijos(td, { x: area.x + k * (w + sep), w });
      const p = doc.getCurrentPageInfo().pageNumber;
      if (p > finPag || (p === finPag && y > finY)) { finPag = p; finY = y; }
    });
    doc.setPage(finPag); y = finY;
  }

  function firmas(t: any, area: Area) {
    const tds = Array.from(t.querySelectorAll("td")) as any[];
    espacio(22); y += 12;
    const w = area.w / tds.length;
    tds.forEach((td: any, k: number) => {
      const x = area.x + k * w + 8;
      doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3); doc.line(x, y, x + w - 16, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(17, 17, 17);
      doc.text(limpiar(td.textContent).trim(), x + (w - 16) / 2, y + 4, { align: "center" });
    });
    y += 8;
  }

  const BLOQUES = new Set(["DIV", "P", "TABLE", "H1", "H2", "H3", "H4", "OL", "UL", "SECTION", "IMG"]);
  function bloque(el: any, area: Area) {
    const tag = el.tagName, d = est(el);
    if (tag === "STYLE" || tag === "SCRIPT" || tag === "HEAD") return;
    if (d["display"] === "none") return;
    if (/page|always/.test(d["page-break-before"] || d["break-before"] || "") && y > MARGEN + 1) nuevaPag();
    if (tag === "TABLE") {
      if (el.classList.contains("hdr")) cabecera(el, area);
      else if (el.classList.contains("header-table")) cabeceraInforme(el, area);
      else if (el.classList.contains("cols")) columnas(el, area);
      else if (el.classList.contains("firmas")) firmas(el, area);
      else tabla(el, area);
    } else if (tag === "IMG") {
      const src = el.getAttribute("src") || "";
      try { espacio(30); doc.addImage(src, src.includes("png") ? "PNG" : "JPEG", area.x, y, 25, 25); y += 27; } catch (_) { /* sin imagen */ }
    } else if (tag === "OL" || tag === "UL") {
      (Array.from(el.children) as any[]).forEach((li: any, k: number) => escribir((tag === "OL" ? `${k + 1}. ` : "• ") + txt(li), area, { size: tam(est(li), 8.5) }));
    } else if (/^H[1-4]$/.test(tag) || el.classList.contains("bloque-t") || el.classList.contains("sec-t") || el.classList.contains("card-head")) {
      espacio(22);   // el título no se queda solo al final de la página
      escribir(txt(el), area, { size: tam(d, 9.5), bold: true, color: colorRgb(d["color"]) || [0, 51, 153], fill: fondo(d) });
    } else if ((Array.from(el.children) as any[]).some((c: any) => BLOQUES.has(c.tagName))) {
      hijos(el, area);
      if (/page|always/.test(d["page-break-after"] || d["break-after"] || "")) nuevaPag();
      else y += 1;
    } else {
      const t2 = txt(el);
      const esSm = el.classList.contains("sm") || el.classList.contains("vacio");
      escribir(t2, area, { size: tam(d, esSm ? 7 : 8.5), bold: negrita(d), color: colorRgb(d["color"]) || (esSm ? [85, 85, 85] : null), align: d["text-align"], fill: fondo(d) });
      if (/page|always/.test(d["page-break-after"] || d["break-after"] || "")) nuevaPag();
    }
  }
  function hijos(el: any, area: Area) {
    let suelto = "";
    const soltar = () => { const t = limpiar(suelto).trim(); if (t) escribir(t, area, { size: 8.5 }); suelto = ""; };
    (Array.from(el.childNodes) as any[]).forEach((n: any) => {
      if (n.nodeType === 3) { suelto += n.textContent; return; }
      if (n.nodeType !== 1) return;
      if (BLOQUES.has(n.tagName) || n.tagName === "SECTION") { soltar(); bloque(n, area); }
      else suelto += " " + texto(n);
    });
    soltar();
  }

  hijos(document.body || document.documentElement, util);
  // Número de página abajo
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
    doc.text(`Página ${p} de ${total}`, anchoPag - MARGEN, altoPag - 4, { align: "right" });
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
