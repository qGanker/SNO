import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATE_PATH = path.join(__dirname, 'templates', 'protocol_template.docx');

// Форматирование абзацев протокола (взято из шаблона): Times New Roman 14pt,
// межстрочный 240 auto, красная строка 709, выравнивание по ширине
const PARAGRAPH_PROPS =
  '<w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>' +
  '<w:ind w:firstLine="709"/><w:jc w:val="both"/>' +
  '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>';

const RUN_PROPS =
  '<w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>';

type Faculty = 'med' | 'prev' | 'diag';

// Факультет определяется по первой букве группы автора:
// Д — диагностический, П — медико-профилактический, Л (и прочие) — лечебный
export function facultyOfSubmission(sub: any): Faculty {
  const letter = String(sub?.authorGroup || sub?.coauthorGroup || '').trim().charAt(0).toUpperCase();
  if (letter === 'Д') return 'diag';
  if (letter === 'П') return 'prev';
  return 'med';
}

function escapeXml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Текст записи о работе в формате шаблона:
// «1. Иванов Иван Иванович, Петров Пётр «Название», научный руководитель ‒ ФИО»
function workEntryText(n: number, sub: any): string {
  const authors = [sub.authorName, sub.coauthorName]
    .map((a: string) => String(a || '').trim())
    .filter(Boolean)
    .join(', ');

  const title = String(sub.workTitle || '').trim();
  const supervisor = String(sub.supervisorName || '').trim();

  let text = `${n}. ${authors}`;
  if (title) text += ` «${title}»`;
  if (supervisor) text += `, научный руководитель ‒ ${supervisor}`;
  return text.replace(/\s+/g, ' ').trim();
}

function buildParagraph(text: string): string {
  return `<w:p>${PARAGRAPH_PROPS}<w:r>${RUN_PROPS}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function buildWorksParagraphs(subs: any[]): string {
  return subs.map((s, i) => buildParagraph(workEntryText(i + 1, s))).join('');
}

function sortByWorkNumber(a: any, b: any): number {
  const na = parseInt(String(a.workNumber || ''), 10);
  const nb = parseInt(String(b.workNumber || ''), 10);
  if (Number.isNaN(na) && Number.isNaN(nb)) return String(a.workNumber || '').localeCompare(String(b.workNumber || ''));
  if (Number.isNaN(na)) return 1;
  if (Number.isNaN(nb)) return -1;
  return na - nb;
}

interface ParaInfo {
  start: number;
  end: number;
  text: string;
}

function extractParagraphs(xml: string): ParaInfo[] {
  const paras: ParaInfo[] = [];
  const re = /<w:p[ >][\s\S]*?<\/w:p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const text = (m[0].match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join('');
    paras.push({ start: m.index, end: m.index + m[0].length, text });
  }
  return paras;
}

const isWorkEntry = (text: string) => /^\s*\d+\s*\.\s/.test(text);

// Ищет диапазон абзацев-работ, идущих после заголовка раздела
// (пропуская промежуточные абзацы вроде повторного вводного предложения)
function findWorksRegion(paras: ParaInfo[], headerIndex: number): { start: number; end: number } | null {
  let first = -1;
  let last = -1;
  for (let i = headerIndex + 1; i < paras.length; i++) {
    if (isWorkEntry(paras[i].text)) {
      if (first === -1) first = i;
      last = i;
    } else if (first !== -1) {
      break; // блок работ прерван — стоп
    }
  }
  if (first === -1) return null;
  return { start: paras[first].start, end: paras[last].end };
}

/**
 * Формирует Word-протокол на основе шаблона, заменяя ТОЛЬКО списки работ:
 *   1.1 — работы лечебного факультета (группы на «Л»),
 *   1.2 — работы медико-профилактического факультета (группы на «П»),
 *   1.3 — добавляется, если есть работы диагностического факультета (группы на «Д»).
 * Всё остальное содержимое шаблона остаётся без изменений.
 */
export function generateProtocolDocx(submissions: any[]): Buffer {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Шаблон протокола не найден: ${TEMPLATE_PATH}`);
  }

  const med = submissions.filter((s) => facultyOfSubmission(s) === 'med').sort(sortByWorkNumber);
  const prev = submissions.filter((s) => facultyOfSubmission(s) === 'prev').sort(sortByWorkNumber);
  const diag = submissions.filter((s) => facultyOfSubmission(s) === 'diag').sort(sortByWorkNumber);

  const zip = new AdmZip(TEMPLATE_PATH);
  const xml = zip.readAsText('word/document.xml');
  const paras = extractParagraphs(xml);

  const headerMedIdx = paras.findIndex(
    (p) => p.text.includes('Рекомендовать для рассмотрения на Совете') && p.text.includes('лечебного факультета')
  );
  const headerPrevIdx = paras.findIndex(
    (p) => p.text.includes('Рекомендовать для рассмотрения на Совете') && p.text.includes('профилактического факультета')
  );

  if (headerMedIdx === -1 || headerPrevIdx === -1) {
    throw new Error('В шаблоне протокола не найдены разделы факультетов (изменился текст заголовков?)');
  }

  const medRegion = findWorksRegion(paras, headerMedIdx);
  const prevRegion = findWorksRegion(paras, headerPrevIdx);
  if (!medRegion || !prevRegion) {
    throw new Error('В шаблоне протокола не найдены списки работ после заголовков разделов');
  }

  // Секция для диагностического факультета (1.3) вставляется после списка работ 1.2
  let diagSection = '';
  if (diag.length > 0) {
    const header =
      '1.3. Рекомендовать для рассмотрения на Совете диагностического факультета нижеперечисленные ' +
      'работы студентов для участия во втором этапе XXXII Республиканского конкурса научных работ студентов:';
    diagSection = buildParagraph(header) + buildWorksParagraphs(diag);
  }

  // Замены делаем с конца документа, чтобы не сбить смещения
  let result = xml;

  const prevReplacement = buildWorksParagraphs(prev) + diagSection;
  result = result.slice(0, prevRegion.start) + prevReplacement + result.slice(prevRegion.end);

  result = result.slice(0, medRegion.start) + buildWorksParagraphs(med) + result.slice(medRegion.end);

  zip.updateFile('word/document.xml', Buffer.from(result, 'utf-8'));
  return zip.toBuffer();
}
