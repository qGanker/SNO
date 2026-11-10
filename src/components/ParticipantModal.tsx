import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, FileText, User, Phone, Users, BookOpen, Building, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { SnoSubmission, calculateMissingDebts } from '../types/participant';

interface ParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (submission: SnoSubmission) => void;
  participantToEdit?: SnoSubmission | null;
}

export const ParticipantModal: React.FC<ParticipantModalProps> = ({
  isOpen,
  onClose,
  onSave,
  participantToEdit,
}) => {
  // 1. Основные поля
  const [workNumber, setWorkNumber] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorPhone, setAuthorPhone] = useState('');
  const [authorGroup, setAuthorGroup] = useState('');
  const [coauthorName, setCoauthorName] = useState('');
  const [coauthorPhone, setCoauthorPhone] = useState('');
  const [coauthorGroup, setCoauthorGroup] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [section, setSection] = useState('');
  const [department, setDepartment] = useState('');
  const [supervisorName, setSupervisorName] = useState('');

  // 2. Акты и списки
  const [actStudyProcess, setActStudyProcess] = useState('');
  const [actMedicalProcess, setActMedicalProcess] = useState('');
  const [actListCount, setActListCount] = useState('');
  const [reportsListCount, setReportsListCount] = useState('');
  const [diplomasCertificates, setDiplomasCertificates] = useState('');
  const [publicationsCount, setPublicationsCount] = useState('');
  const [publicationsMatch, setPublicationsMatch] = useState('');

  // 3. Галочки (+ / -)
  const [hasScientificWork, setHasScientificWork] = useState(true);
  const [hasAuthorInfo, setHasAuthorInfo] = useState(true);
  const [hasSupervisorReview, setHasSupervisorReview] = useState(true);
  const [hasAppendix, setHasAppendix] = useState(false);
  const [hasAntiPlagiarism, setHasAntiPlagiarism] = useState(true);
  const [hasDisc, setHasDisc] = useState(false);
  const [hasWorkInFolder, setHasWorkInFolder] = useState(true);
  const [hasPassportCopy, setHasPassportCopy] = useState(true);
  const [hasGradebookCopy, setHasGradebookCopy] = useState(true);
  const [hasRationalProposalOrPatent, setHasRationalProposalOrPatent] = useState(false);
  const [hasOtherDocs, setHasOtherDocs] = useState(false);

  useEffect(() => {
    if (participantToEdit) {
      setWorkNumber(participantToEdit.workNumber || '');
      setAuthorName(participantToEdit.authorName || '');
      setAuthorPhone(participantToEdit.authorPhone || '');
      setAuthorGroup(participantToEdit.authorGroup || '');
      setCoauthorName(participantToEdit.coauthorName || '');
      setCoauthorPhone(participantToEdit.coauthorPhone || '');
      setCoauthorGroup(participantToEdit.coauthorGroup || '');
      setWorkTitle(participantToEdit.workTitle || '');
      setSection(participantToEdit.section || '');
      setDepartment(participantToEdit.department || '');
      setSupervisorName(participantToEdit.supervisorName || '');

      setActStudyProcess(participantToEdit.actStudyProcess || '');
      setActMedicalProcess(participantToEdit.actMedicalProcess || '');
      setActListCount(participantToEdit.actListCount || '');
      setReportsListCount(participantToEdit.reportsListCount || '');
      setDiplomasCertificates(participantToEdit.diplomasCertificates || '');
      setPublicationsCount(participantToEdit.publicationsCount || '');
      setPublicationsMatch(participantToEdit.publicationsMatch || '');

      setHasScientificWork(participantToEdit.hasScientificWork ?? true);
      setHasAuthorInfo(participantToEdit.hasAuthorInfo ?? true);
      setHasSupervisorReview(participantToEdit.hasSupervisorReview ?? true);
      setHasAppendix(participantToEdit.hasAppendix ?? false);
      setHasAntiPlagiarism(participantToEdit.hasAntiPlagiarism ?? true);
      setHasDisc(participantToEdit.hasDisc ?? false);
      setHasWorkInFolder(participantToEdit.hasWorkInFolder ?? true);
      setHasPassportCopy(participantToEdit.hasPassportCopy ?? true);
      setHasGradebookCopy(participantToEdit.hasGradebookCopy ?? true);
      setHasRationalProposalOrPatent(participantToEdit.hasRationalProposalOrPatent ?? false);
      setHasOtherDocs(participantToEdit.hasOtherDocs ?? false);
    } else {
      // Новая запись
      setWorkNumber('');
      setAuthorName('');
      setAuthorPhone('');
      setAuthorGroup('');
      setCoauthorName('');
      setCoauthorPhone('');
      setCoauthorGroup('');
      setWorkTitle('');
      setSection('');
      setDepartment('');
      setSupervisorName('');

      setActStudyProcess('');
      setActMedicalProcess('');
      setActListCount('');
      setReportsListCount('');
      setDiplomasCertificates('');
      setPublicationsCount('');
      setPublicationsMatch('');

      setHasScientificWork(true);
      setHasAuthorInfo(true);
      setHasSupervisorReview(true);
      setHasAppendix(false);
      setHasAntiPlagiarism(true);
      setHasDisc(true);
      setHasWorkInFolder(true);
      setHasPassportCopy(true);
      setHasGradebookCopy(true);
      setHasRationalProposalOrPatent(false);
      setHasOtherDocs(false);
    }
  }, [participantToEdit, isOpen]);

  if (!isOpen) return null;

  const setAllCheckboxes = (val: boolean) => {
    setHasScientificWork(val);
    setHasAuthorInfo(val);
    setHasSupervisorReview(val);
    setHasAppendix(val);
    setHasAntiPlagiarism(val);
    setHasDisc(val);
    setHasWorkInFolder(val);
    setHasPassportCopy(val);
    setHasGradebookCopy(val);
    setHasRationalProposalOrPatent(val);
    setHasOtherDocs(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) return;

    const partialSubmission: Partial<SnoSubmission> = {
      workNumber: workNumber.trim() || '1',
      authorName: authorName.trim(),
      authorPhone: authorPhone.trim(),
      authorGroup: authorGroup.trim(),
      coauthorName: coauthorName.trim(),
      coauthorPhone: coauthorPhone.trim(),
      coauthorGroup: coauthorGroup.trim(),
      workTitle: workTitle.trim(),
      section: section.trim(),
      department: department.trim(),
      supervisorName: supervisorName.trim(),
      actStudyProcess: actStudyProcess.trim(),
      actMedicalProcess: actMedicalProcess.trim(),
      actListCount: actListCount.trim(),
      reportsListCount: reportsListCount.trim(),
      diplomasCertificates: diplomasCertificates.trim(),
      publicationsCount: publicationsCount.trim(),
      publicationsMatch: publicationsMatch.trim(),
      hasScientificWork,
      hasAuthorInfo,
      hasSupervisorReview,
      hasAppendix,
      hasAntiPlagiarism,
      hasDisc,
      hasWorkInFolder,
      hasPassportCopy,
      hasGradebookCopy,
      hasRationalProposalOrPatent,
      hasOtherDocs,
    };

    const missing = calculateMissingDebts(partialSubmission);

    const cleanWorkNum = workNumber.trim();
    const submission: SnoSubmission = {
      ...(partialSubmission as any),
      id: participantToEdit?.id || (cleanWorkNum ? `SNO_${cleanWorkNum}` : `SNO_${Date.now()}`),
      status: missing.length === 0 ? 'punctual' : 'debtor',
      missingDebts: missing,
      createdAt: participantToEdit?.createdAt || new Date().toISOString().split('T')[0],
      notes: participantToEdit?.notes || ''
    };

    onSave(submission);
    onClose();
  };

  // Чекбокс элемент с индикацией + или -
  const CheckboxItem = ({
    label,
    checked,
    onChange,
    isOptional = false
  }: {
    label: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    isOptional?: boolean;
  }) => (
    <label 
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
        checked 
          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
          : isOptional
            ? 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-rose-900/40'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs ${
          checked 
            ? 'bg-emerald-500 text-slate-950' 
            : isOptional
              ? 'bg-slate-800 text-slate-500 border border-slate-700'
              : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
        }`}>
          {checked ? '+' : '-'}
        </div>
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-medium text-slate-200">{label}</span>
          {isOptional && (
            <span className="text-[10px] text-slate-500">необязательно (в долг не идет)</span>
          )}
        </div>
      </div>
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
        checked 
          ? 'bg-emerald-500/20 text-emerald-400' 
          : isOptional
            ? 'bg-slate-800 text-slate-400'
            : 'bg-rose-500/10 text-rose-400'
      }`}>
        {checked 
          ? 'Сдано (+)' 
          : isOptional 
            ? 'Не требуется / нет (-)' 
            : 'Не сдано (-)'}
      </span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              {participantToEdit ? 'Редактирование карточки работы СНО' : 'Добавить работу СНО'}
            </h3>
            <p className="text-xs text-slate-400">
              Введите данные автора, работы и отметьте галочками сданные документы
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* СЕКЦИЯ 1: Данные автора и соавтора */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider font-bold text-indigo-400 border-b border-indigo-500/20 pb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              1. Данные о работе и авторах
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">номер работы</label>
                <input
                  type="text"
                  value={workNumber}
                  onChange={(e) => setWorkNumber(e.target.value)}
                  placeholder="27"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-100 outline-none font-bold text-emerald-400"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ФИО автора <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Осмоловская Алина Сергеевна"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">номер телефона автора</label>
                <input
                  type="text"
                  value={authorPhone}
                  onChange={(e) => setAuthorPhone(e.target.value)}
                  placeholder="80298957612"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-100 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">номер группы автора</label>
                <input
                  type="text"
                  value={authorGroup}
                  onChange={(e) => setAuthorGroup(e.target.value)}
                  placeholder="Л-609"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-100 outline-none font-semibold text-indigo-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ФИО соавтора</label>
                <input
                  type="text"
                  value={coauthorName}
                  onChange={(e) => setCoauthorName(e.target.value)}
                  placeholder="Сергеева М.Д. (если есть)"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">номер телефона соавтора</label>
                <input
                  type="text"
                  value={coauthorPhone}
                  onChange={(e) => setCoauthorPhone(e.target.value)}
                  placeholder="8029..."
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">номер группы соавтора</label>
                <input
                  type="text"
                  value={coauthorGroup}
                  onChange={(e) => setCoauthorGroup(e.target.value)}
                  placeholder="Л-609"
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">название работы</label>
              <textarea
                rows={2}
                value={workTitle}
                onChange={(e) => setWorkTitle(e.target.value)}
                placeholder="ЮВЕНИЛЬНЫЙ ИДИОПАТИЧЕСКИЙ АРТРИТ: ОСОБЕННОСТИ КЛИНИЧЕСКОГО ТЕЧЕНИЯ..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-sm text-slate-100 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">секция</label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="Медицина / Педиатрия"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs sm:text-sm text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">кафедра, на базе которой написана работа</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Педиатрии №2"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs sm:text-sm text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ФИО науч.руководителя</label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Зарянкина А.И."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 text-xs sm:text-sm text-slate-100 outline-none font-medium text-purple-300"
                />
              </div>
            </div>
          </div>

          {/* СЕКЦИЯ 2: Акты и публикации (количество / текст) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 border-b border-amber-500/20 pb-1.5 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              2. Акты внедрения, доклады и публикации
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">акт в учебный процесс</label>
                <input
                  type="text"
                  value={actStudyProcess}
                  onChange={(e) => setActStudyProcess(e.target.value)}
                  placeholder="3копии"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">акт в лечебный процесс</label>
                <input
                  type="text"
                  value={actMedicalProcess}
                  onChange={(e) => setActMedicalProcess(e.target.value)}
                  placeholder="3копии"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">список актов</label>
                <input
                  type="text"
                  value={actListCount}
                  onChange={(e) => setActListCount(e.target.value)}
                  placeholder="2"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">список докладов</label>
                <input
                  type="text"
                  value={reportsListCount}
                  onChange={(e) => setReportsListCount(e.target.value)}
                  placeholder="2"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">дипломы/сертификаты</label>
                <input
                  type="text"
                  value={diplomasCertificates}
                  onChange={(e) => setDiplomasCertificates(e.target.value)}
                  placeholder="2диплома"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">список публикаций</label>
                <input
                  type="text"
                  value={publicationsCount}
                  onChange={(e) => setPublicationsCount(e.target.value)}
                  placeholder="5"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">соответствие распечат.публикаций списку</label>
                <input
                  type="text"
                  value={publicationsMatch}
                  onChange={(e) => setPublicationsMatch(e.target.value)}
                  placeholder="5/5"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* СЕКЦИЯ 3: ГАЛОЧКИ (+ / -) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
              <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" />
                3. Комплектность документов (галочки: + есть / - нет)
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllCheckboxes(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Отметить всё (+)
                </button>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={() => setAllCheckboxes(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-300 underline cursor-pointer"
                >
                  Снять всё (-)
                </button>
              </div>
            </div>

            {/* Обязательные документы */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
                <span>Обязательные документы (без них работа считается долгом):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <CheckboxItem
                  label="научная работа"
                  checked={hasScientificWork}
                  onChange={setHasScientificWork}
                />
                <CheckboxItem
                  label="сведения об авторах"
                  checked={hasAuthorInfo}
                  onChange={setHasAuthorInfo}
                />
                <CheckboxItem
                  label="отзыв науч.рук"
                  checked={hasSupervisorReview}
                  onChange={setHasSupervisorReview}
                />
                <CheckboxItem
                  label="антиплагиат"
                  checked={hasAntiPlagiarism}
                  onChange={setHasAntiPlagiarism}
                />
                <CheckboxItem
                  label="диск"
                  checked={hasDisc}
                  onChange={setHasDisc}
                />
                <CheckboxItem
                  label="работа в папке"
                  checked={hasWorkInFolder}
                  onChange={setHasWorkInFolder}
                />
                <CheckboxItem
                  label="ксерокопия паспорта"
                  checked={hasPassportCopy}
                  onChange={setHasPassportCopy}
                />
                <CheckboxItem
                  label="ксерокопия зачетки"
                  checked={hasGradebookCopy}
                  onChange={setHasGradebookCopy}
                />
              </div>
            </div>

            {/* Необязательные документы (при наличии) */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <span>Дополнительные документы (необязательно, при наличии — в должники НЕ влияют):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <CheckboxItem
                  label="приложение"
                  checked={hasAppendix}
                  onChange={setHasAppendix}
                  isOptional={true}
                />
                <CheckboxItem
                  label="рац.предложение / патент"
                  checked={hasRationalProposalOrPatent}
                  onChange={setHasRationalProposalOrPatent}
                  isOptional={true}
                />
                <CheckboxItem
                  label="иные документы"
                  checked={hasOtherDocs}
                  onChange={setHasOtherDocs}
                  isOptional={true}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40 transition-all active:scale-95 cursor-pointer"
            >
              {participantToEdit ? 'Сохранить изменения' : 'Сохранить работу'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
