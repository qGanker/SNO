import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp,
  Award,
  Radio,
  RefreshCw
} from 'lucide-react';
import { SnoSubmission, ActiveTab, calculateMissingDebts } from './types/participant';
import { INITIAL_SNO_SUBMISSIONS } from './data/initialParticipants';
import { Navigation } from './components/Navigation';
import { ParticipantsTable } from './components/ParticipantsTable';
import { DebtorsView } from './components/DebtorsView';
import { PunctualView } from './components/PunctualView';
import { ParticipantModal } from './components/ParticipantModal';
import { exportSnoToExcel, exportSnoToCsv } from './utils/excelExport';

export default function App() {
  const [submissions, setSubmissions] = useState<SnoSubmission[]>(INITIAL_SNO_SUBMISSIONS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('debtors');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [participantToEdit, setParticipantToEdit] = useState<SnoSubmission | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isUpdatingRef = useRef(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Загрузка данных с сервера (общая база)
  const fetchSubmissionsFromServer = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/submissions');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSubmissions(json.data);
          setIsLiveConnected(true);
        }
      }
    } catch (e) {
      console.warn('Сервер API недоступен, работаем с локальными данными', e);
      setIsLiveConnected(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Подключение к Server-Sent Events (SSE) для мгновенного обновления у всех
  useEffect(() => {
    fetchSubmissionsFromServer();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setIsLiveConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.data && Array.isArray(payload.data)) {
            setSubmissions(payload.data);
            setIsLiveConnected(true);
          }
        } catch (err) {
          console.error('Ошибка обработки SSE сообщения:', err);
        }
      };

      eventSource.onerror = () => {
        setIsLiveConnected(false);
      };
    } catch (e) {
      console.warn('SSE не поддерживается окружением, используем периодический опрос');
    }

    // Регулярный опрос (polling) каждые 4 секунды для надежности через туннели
    const pollInterval = setInterval(() => {
      if (!isUpdatingRef.current) {
        fetchSubmissionsFromServer();
      }
    }, 4000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(pollInterval);
    };
  }, []);

  // Сохранение добавленной или отредактированной работы на сервере
  const handleSaveSubmission = async (savedSubmission: SnoSubmission) => {
    isUpdatingRef.current = true;

    // Оптимистичное обновление интерфейса: проверяем по ID или по номеру работы
    setSubmissions(prev => {
      const workNum = String(savedSubmission.workNumber || '').trim();
      const idx = prev.findIndex(p => 
        p.id === savedSubmission.id || 
        (workNum && String(p.workNumber).trim() === workNum)
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...savedSubmission };
        return copy;
      }
      return [savedSubmission, ...prev];
    });

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedSubmission),
      });
      if (res.ok) {
        showToast(`Сохранено в общую базу для всех пользователей!`);
      }
    } catch (e) {
      showToast('Сохранено локально (нет связи с сервером)');
    } finally {
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 500);
    }
  };

  // Удаление работы
  const handleDeleteSubmission = async (id: string) => {
    const toDelete = submissions.find(p => p.id === id);
    if (!toDelete) return;
    if (window.confirm(`Вы уверены, что хотите удалить работу №${toDelete.workNumber} (${toDelete.authorName}) из общей базы?`)) {
      setSubmissions(prev => prev.filter(p => p.id !== id));
      try {
        await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
        showToast('Работа удалена из общей базы для всех пользователей');
      } catch (e) {
        showToast('Удалено локально');
      }
    }
  };

  // Переключение статуса (Должник <-> Пунктуальный)
  const handleToggleStatus = (sub: SnoSubmission) => {
    const isNowDebtor = sub.status === 'debtor';
    let updated: SnoSubmission;

    if (isNowDebtor) {
      // Поставить все плюсики
      updated = {
        ...sub,
        hasScientificWork: true,
        hasAuthorInfo: true,
        hasSupervisorReview: true,
        hasAntiPlagiarism: true,
        hasWorkInFolder: true,
        hasPassportCopy: true,
        hasGradebookCopy: true,
        status: 'punctual',
        missingDebts: []
      };
      showToast(`Работа №${sub.workNumber} отмечена как сданная (+) для всех`);
    } else {
      updated = {
        ...sub,
        hasSupervisorReview: false,
        status: 'debtor',
        missingDebts: ['отзыв науч.рук']
      };
      showToast(`Работа №${sub.workNumber} возвращена в должники`);
    }

    handleSaveSubmission(updated);
  };

  // Быстрое проставление галочки (+) на конкретный документ в списке долгов
  const handleToggleDoc = (sub: SnoSubmission, docName: string) => {
    const partial: Partial<SnoSubmission> = { ...sub };

    if (docName === 'научная работа') partial.hasScientificWork = true;
    else if (docName === 'сведения об авторах') partial.hasAuthorInfo = true;
    else if (docName === 'отзыв науч.рук') partial.hasSupervisorReview = true;
    else if (docName === 'антиплагиат') partial.hasAntiPlagiarism = true;
    else if (docName === 'диск') partial.hasDisc = true;
    else if (docName === 'работа в папке') partial.hasWorkInFolder = true;
    else if (docName === 'ксерокопия паспорта') partial.hasPassportCopy = true;
    else if (docName === 'ксерокопия зачетки') partial.hasGradebookCopy = true;
    else if (docName === 'приложение') partial.hasAppendix = true;

    const remaining = calculateMissingDebts(partial);
    const updated: SnoSubmission = {
      ...sub,
      ...partial,
      status: remaining.length === 0 ? 'punctual' : 'debtor',
      missingDebts: remaining
    } as SnoSubmission;

    handleSaveSubmission(updated);
    if (remaining.length === 0) {
      showToast(`Все документы сданы! Работа №${sub.workNumber} перенесена в пунктуальные для всех.`);
    } else {
      showToast(`Отмечено: ${docName} (+)`);
    }
  };

  // Отметить сдачу всех документов
  const handleMarkAllDone = (sub: SnoSubmission) => {
    const updated: SnoSubmission = {
      ...sub,
      hasScientificWork: true,
      hasAuthorInfo: true,
      hasSupervisorReview: true,
      hasAntiPlagiarism: true,
      hasWorkInFolder: true,
      hasPassportCopy: true,
      hasGradebookCopy: true,
      hasDisc: true,
      status: 'punctual',
      missingDebts: []
    };
    handleSaveSubmission(updated);
  };

  // Вернуть в должники
  const handleReopenDebt = (sub: SnoSubmission) => {
    const updated: SnoSubmission = {
      ...sub,
      hasSupervisorReview: false,
      status: 'debtor',
      missingDebts: ['отзыв науч.рук']
    };
    handleSaveSubmission(updated);
  };

  // Сброс базы
  const handleResetData = async () => {
    if (window.confirm('Сбросить общую базу на сервере к исходным образцам СНО? Это изменит данные для всех!')) {
      try {
        const res = await fetch('/api/submissions/reset', { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          setSubmissions(json.data);
          showToast('Общая база сброшена на сервере');
        }
      } catch (e) {
        setSubmissions(INITIAL_SNO_SUBMISSIONS);
        showToast('База сброшена');
      }
    }
  };

  // Экспорт в Excel
  const handleExportExcel = () => {
    exportSnoToExcel(submissions, `СНО_Реестр_работ_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Excel-файл (.xlsx) сформирован по образцу и скачан!');
  };

  // Экспорт в CSV
  const handleExportCsv = () => {
    exportSnoToCsv(submissions, `sno_export_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('CSV-файл выгружен!');
  };

  const debtors = submissions.filter(s => s.status === 'debtor');
  const punctual = submissions.filter(s => s.status === 'punctual');
  const completionRate = submissions.length > 0 
    ? Math.round((punctual.length / submissions.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-24 sm:pb-12">
      {/* Header & Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        submissions={submissions}
        onOpenAddModal={() => {
          setParticipantToEdit(null);
          setIsModalOpen(true);
        }}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onResetData={handleResetData}
      />

      {/* Real-time sync bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">
              {isLiveConnected ? 'Общая база активна (синхронизация в реальном времени)' : 'Подключение к общей базе...'}
            </span>
          </div>
          <button 
            onClick={fetchSubmissionsFromServer}
            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            title="Обновить данные"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Обновить вручную</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Всего работ СНО
              </span>
              <span className="text-xl font-extrabold text-white">
                {submissions.length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
              100%
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('debtors')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-900/50 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold block group-hover:text-rose-300">
                Должники
              </span>
              <span className="text-xl font-extrabold text-rose-400">
                {debtors.length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">
              {debtors.reduce((acc, d) => acc + d.missingDebts.length, 0)} поз.
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('punctual')}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-900/50 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block group-hover:text-emerald-300">
                Пунктуальные
              </span>
              <span className="text-xl font-extrabold text-emerald-400">
                {punctual.length}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
              {completionRate}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Сдано полностью
              </span>
              <span className="text-xl font-extrabold text-indigo-400">
                {completionRate}%
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tab 1: Все участники (Реестр СНО) */}
        {activeTab === 'participants' && (
          <ParticipantsTable
            submissions={submissions}
            onEdit={(sub) => {
              setParticipantToEdit(sub);
              setIsModalOpen(true);
            }}
            onDelete={handleDeleteSubmission}
            onToggleStatus={handleToggleStatus}
            onOpenAddModal={() => {
              setParticipantToEdit(null);
              setIsModalOpen(true);
            }}
          />
        )}

        {/* Tab 2: Должники (что должны донести) */}
        {activeTab === 'debtors' && (
          <DebtorsView
            debtors={debtors}
            onEdit={(sub) => {
              setParticipantToEdit(sub);
              setIsModalOpen(true);
            }}
            onDelete={handleDeleteSubmission}
            onMarkAllDone={handleMarkAllDone}
            onToggleDoc={handleToggleDoc}
            onOpenAddModal={() => {
              setParticipantToEdit(null);
              setIsModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: Пунктуальные люди (всё сдали) */}
        {activeTab === 'punctual' && (
          <PunctualView
            punctual={punctual}
            onEdit={(sub) => {
              setParticipantToEdit(sub);
              setIsModalOpen(true);
            }}
            onDelete={handleDeleteSubmission}
            onReopenDebt={handleReopenDebt}
            onOpenAddModal={() => {
              setParticipantToEdit(null);
              setIsModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Floating Plus Button (+) */}
      <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 group">
        <button
          onClick={() => {
            setParticipantToEdit(null);
            setIsModalOpen(true);
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-2xl shadow-indigo-600/50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-indigo-500/20"
          title="Добавить новую работу СНО (+)"
          aria-label="Добавить работу"
        >
          <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
        </button>

        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden group-hover:block whitespace-nowrap bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-xl pointer-events-none">
          + Добавить работу СНО
        </div>
      </div>

      {/* SNO Modal Form */}
      <ParticipantModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setParticipantToEdit(null);
        }}
        onSave={handleSaveSubmission}
        participantToEdit={participantToEdit}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
