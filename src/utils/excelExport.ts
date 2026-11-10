import * as XLSX from 'xlsx';
import { SnoSubmission, calculateMissingDebts } from '../types/participant';

export const SNO_FIELD_ROWS = [
  { key: 'workNumber', label: 'номер работы', type: 'text' },
  { key: 'authorName', label: 'ФИО автора', type: 'text' },
  { key: 'authorPhone', label: 'номер телефона автора', type: 'text' },
  { key: 'authorGroup', label: 'номер группы автора', type: 'text' },
  { key: 'coauthorName', label: 'ФИО соавтора', type: 'text' },
  { key: 'coauthorPhone', label: 'номер телефона соавтора', type: 'text' },
  { key: 'coauthorGroup', label: 'номер группы соавтора', type: 'text' },
  { key: 'workTitle', label: 'название работы', type: 'text' },
  { key: 'section', label: 'секция', type: 'text' },
  { key: 'department', label: 'кафедра, на базе которой написана работа', type: 'text' },
  { key: 'supervisorName', label: 'ФИО науч.руководителя', type: 'text' },
  { key: 'hasScientificWork', label: 'научная работа', type: 'boolean' },
  { key: 'actStudyProcess', label: 'акт в учебный процесс', type: 'text' },
  { key: 'actMedicalProcess', label: 'акт в лечебный процесс', type: 'text' },
  { key: 'actListCount', label: 'список актов', type: 'text' },
  { key: 'reportsListCount', label: 'список докладов', type: 'text' },
  { key: 'diplomasCertificates', label: 'дипломы/сертификаты', type: 'text' },
  { key: 'publicationsCount', label: 'список публикаций', type: 'text' },
  { key: 'publicationsMatch', label: 'соответствие распечат.публикаций списку', type: 'text' },
  { key: 'hasAuthorInfo', label: 'сведения об авторах', type: 'boolean' },
  { key: 'hasSupervisorReview', label: 'отзыв науч.рук', type: 'boolean' },
  { key: 'hasAppendix', label: 'приложение', type: 'boolean' },
  { key: 'hasAntiPlagiarism', label: 'антиплагиат', type: 'boolean' },
  { key: 'hasDisc', label: 'диск', type: 'boolean' },
  { key: 'hasWorkInFolder', label: 'работа в папке', type: 'boolean' },
  { key: 'hasPassportCopy', label: 'ксерокопия паспорта', type: 'boolean' },
  { key: 'hasGradebookCopy', label: 'ксерокопия зачетки', type: 'boolean' },
  { key: 'hasRationalProposalOrPatent', label: 'рац.предложение / патент', type: 'boolean' },
  { key: 'hasOtherDocs', label: 'иные документы', type: 'boolean' },
] as const;

/**
 * Экспорт в Excel в точнейшем соответствии с прикрепленным файлом (Колонки A, B, C...)
 * плюс дополнительные удобные листы для должников и пунктуальных.
 */
export function exportSnoToExcel(submissions: SnoSubmission[], filename = 'СНО_Реестр_работ.xlsx') {
  const wb = XLSX.utils.book_new();

  // 1. ЛИСТ "Формат как в образце (вертикальный)":
  // Колонка A содержит названия всех 29 полей.
  // Каждая последующая колонка (B, C, D...) содержит отдельную работу.
  const matrixData: (string | number)[][] = [];

  SNO_FIELD_ROWS.forEach(field => {
    const rowLine: (string | number)[] = [field.label];
    submissions.forEach(sub => {
      const val = (sub as any)[field.key];
      if (field.type === 'boolean') {
        rowLine.push(val ? '+' : '-');
      } else {
        rowLine.push(val || '');
      }
    });
    matrixData.push(rowLine);
  });

  const wsVertical = XLSX.utils.aoa_to_sheet(matrixData);
  XLSX.utils.book_append_sheet(wb, wsVertical, 'Формат как в файле');

  // 2. ЛИСТ "Сводная таблица (по строкам)"
  const tableData = submissions.map(sub => {
    const row: Record<string, any> = {};
    row['Статус'] = sub.status === 'debtor' ? 'Должник' : 'Пунктуальный (всё сдал)';
    row['Что должны донести'] = sub.missingDebts.length > 0 ? sub.missingDebts.join(', ') : '—';

    SNO_FIELD_ROWS.forEach(field => {
      const val = (sub as any)[field.key];
      row[field.label] = field.type === 'boolean' ? (val ? '+' : '-') : (val || '');
    });

    return row;
  });
  const wsTable = XLSX.utils.json_to_sheet(tableData);
  XLSX.utils.book_append_sheet(wb, wsTable, 'Сводный реестр (таблица)');

  // 3. ЛИСТ "Должники"
  const debtorsList = submissions
    .filter(s => s.status === 'debtor')
    .map(s => ({
      '№ работы': s.workNumber,
      'ФИО автора': s.authorName,
      'Телефон автора': s.authorPhone,
      'Группа': s.authorGroup,
      'Что должны донести': s.missingDebts.join(', '),
      'ФИО науч.руководителя': s.supervisorName,
      'Кафедра': s.department,
      'Название работы': s.workTitle,
      'Примечания': s.notes || ''
    }));
  const wsDebtors = XLSX.utils.json_to_sheet(debtorsList.length ? debtorsList : [{ 'Инфо': 'Все работы сданы без долгов!' }]);
  XLSX.utils.book_append_sheet(wb, wsDebtors, 'Должники');

  // 4. ЛИСТ "Пунктуальные люди"
  const punctualList = submissions
    .filter(s => s.status === 'punctual')
    .map(s => ({
      '№ работы': s.workNumber,
      'ФИО автора': s.authorName,
      'Группа': s.authorGroup,
      'Телефон': s.authorPhone,
      'Статус': 'Всё сдано (+)',
      'Науч.руководитель': s.supervisorName,
      'Кафедра': s.department,
      'Название работы': s.workTitle
    }));
  const wsPunctual = XLSX.utils.json_to_sheet(punctualList.length ? punctualList : [{ 'Инфо': 'Пока нет сдавших' }]);
  XLSX.utils.book_append_sheet(wb, wsPunctual, 'Пунктуальные (сдали всё)');

  // Скачивание
  XLSX.writeFile(wb, filename);
}

/**
 * Экспорт в CSV в вертикальном виде (как в образце)
 */
export function exportSnoToCsv(submissions: SnoSubmission[], filename = 'sno_works_export.csv') {
  const rows: string[] = [];

  SNO_FIELD_ROWS.forEach(field => {
    const values = submissions.map(sub => {
      const val = (sub as any)[field.key];
      const strVal = field.type === 'boolean' ? (val ? '+' : '-') : (val || '');
      return escapeCsv(strVal);
    });
    rows.push([escapeCsv(field.label), ...values].join(','));
  });

  const csvContent = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsv(val: any): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
