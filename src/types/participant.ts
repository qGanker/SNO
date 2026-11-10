export interface SnoSubmission {
  id: string; // Уникальный идентификатор
  workNumber: string; // 1. номер работы (например: 27)
  authorName: string; // 2. ФИО автора
  authorPhone: string; // 3. номер телефона автора
  authorGroup: string; // 4. номер группы автора
  coauthorName: string; // 5. ФИО соавтора
  coauthorPhone: string; // 6. номер телефона соавтора
  coauthorGroup: string; // 7. номер группы соавтора
  workTitle: string; // 8. название работы
  section: string; // 9. секция
  department: string; // 10. кафедра, на базе которой написана работа
  supervisorName: string; // 11. ФИО науч.руководителя

  // Количественные поля / акты
  actStudyProcess: string; // 12. акт в учебный процесс (например: 3копии)
  actMedicalProcess: string; // 13. акт в лечебный процесс (например: 3копии)
  actListCount: string; // 14. список актов (например: 2)
  reportsListCount: string; // 15. список докладов (например: 2)
  diplomasCertificates: string; // 16. дипломы/сертификаты (например: 2диплома)
  publicationsCount: string; // 17. список публикаций (например: 5)
  publicationsMatch: string; // 18. соответствие распечат.публикаций списку (например: 5/5)

  // Галочки (+ или -)
  hasScientificWork: boolean; // 19. научная работа
  hasAuthorInfo: boolean; // 20. сведения об авторах
  hasSupervisorReview: boolean; // 21. отзыв науч.рук
  hasAppendix: boolean; // 22. приложение
  hasAntiPlagiarism: boolean; // 23. антиплагиат
  hasDisc: boolean; // 24. диск
  hasWorkInFolder: boolean; // 25. работа в папке
  hasPassportCopy: boolean; // 26. ксерокопия паспорта
  hasGradebookCopy: boolean; // 27. ксерокопия зачетки
  hasRationalProposalOrPatent: boolean; // 28. рац.предложение / патент
  hasOtherDocs: boolean; // 29. иные документы
  otherDocsDescription?: string;

  // Telegram привязка
  telegramChatId?: string | number;
  telegramUsername?: string;

  // Служебные поля
  status: 'debtor' | 'punctual';
  missingDebts: string[]; // Список того, что нужно донести
  notes?: string;
  createdAt: string;
}

export type ActiveTab = 'participants' | 'debtors' | 'punctual';

// Список обязательных документов для определения статуса "Должник"
export const SNO_CHECKLIST_CONFIG = [
  { key: 'hasScientificWork', label: 'научная работа', required: true },
  { key: 'hasAuthorInfo', label: 'сведения об авторах', required: true },
  { key: 'hasSupervisorReview', label: 'отзыв науч.рук', required: true },
  { key: 'hasAntiPlagiarism', label: 'антиплагиат', required: true },
  { key: 'hasWorkInFolder', label: 'работа в папке', required: true },
  { key: 'hasPassportCopy', label: 'ксерокопия паспорта', required: true },
  { key: 'hasGradebookCopy', label: 'ксерокопия зачетки', required: true },
  { key: 'hasDisc', label: 'диск', required: false },
  { key: 'hasAppendix', label: 'приложение', required: false },
  { key: 'hasRationalProposalOrPatent', label: 'рац.предложение / патент', required: false },
  { key: 'hasOtherDocs', label: 'иные документы', required: false },
] as const;

export function calculateMissingDebts(item: Partial<SnoSubmission>): string[] {
  const missing: string[] = [];

  if (!item.hasScientificWork) missing.push('научная работа');
  if (!item.hasAuthorInfo) missing.push('сведения об авторах');
  if (!item.hasSupervisorReview) missing.push('отзыв науч.рук');
  if (!item.hasAntiPlagiarism) missing.push('антиплагиат');
  if (!item.hasWorkInFolder) missing.push('работа в папке');
  if (!item.hasPassportCopy) missing.push('ксерокопия паспорта');
  if (!item.hasGradebookCopy) missing.push('ксерокопия зачетки');

  // Если указаны акты, но нет самого файла или диска при необходимости
  if (item.hasDisc === false && item.notes?.toLowerCase().includes('диск')) {
    missing.push('диск');
  }

  return missing;
}
