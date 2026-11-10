import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Check, 
  CheckCheck, 
  Copy, 
  Edit3, 
  Trash2, 
  User, 
  Building2, 
  Phone, 
  Plus, 
  CheckCircle2, 
  Filter,
  Send,
  ExternalLink,
  MessageSquare,
  X,
  Radio
} from 'lucide-react';
import { SnoSubmission } from '../types/participant';

interface DebtorsViewProps {
  debtors: SnoSubmission[];
  onEdit: (submission: SnoSubmission) => void;
  onDelete: (id: string) => void;
  onMarkAllDone: (submission: SnoSubmission) => void;
  onToggleDoc: (submission: SnoSubmission, docName: string) => void;
  onOpenAddModal: () => void;
}

export const DebtorsView: React.FC<DebtorsViewProps> = ({
  debtors,
  onEdit,
  onDelete,
  onMarkAllDone,
  onToggleDoc,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTgLinkWork, setCopiedTgLinkWork] = useState<string | null>(null);

  // Telegram modal state
  const [isTgModalOpen, setIsTgModalOpen] = useState(false);
  const [isSendingTg, setIsSendingTg] = useState(false);
  const [botUsername, setBotUsername] = useState<string>('');
  const [tgNotificationResult, setTgNotificationResult] = useState<{
    sentCount: number;
    notLinkedCount: number;
    totalDebtors: number;
  } | null>(null);

  // Получаем имя бота с сервера
  useEffect(() => {
    fetch('/api/telegram/info')
      .then(res => res.json())
      .then(data => {
        if (data.botUsername) {
          setBotUsername(data.botUsername);
        }
      })
      .catch(() => {});
  }, []);

  const groups = Array.from(new Set(debtors.map(d => d.authorGroup).filter(Boolean)));

  const filteredDebtors = debtors.filter(debtor => {
    const matchesSearch = 
      debtor.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtor.workNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtor.authorGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtor.workTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtor.missingDebts.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
      debtor.supervisorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || debtor.authorGroup === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const handleCopyReminder = (debtor: SnoSubmission) => {
    const message = `Здравствуйте, ${debtor.authorName}! По работе №${debtor.workNumber} («${debtor.workTitle}») необходимо сдать/донести следующие документы:\n${debtor.missingDebts.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}\nНауч. руководитель: ${debtor.supervisorName}.`;
    navigator.clipboard?.writeText(message);
    setCopiedId(debtor.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyTgLink = (workNumber: string) => {
    const url = botUsername ? `https://t.me/${botUsername}?start=${workNumber}` : `Номер работы: ${workNumber}`;
    navigator.clipboard?.writeText(url);
    setCopiedTgLinkWork(workNumber);
    setTimeout(() => setCopiedTgLinkWork(null), 2500);
  };

  // Отправка в Telegram одному человеку
  const handleSendSingleTg = async (debtor: SnoSubmission) => {
    if (!debtor.telegramChatId) {
      alert(`Автор работы №${debtor.workNumber} ещё не запустил бота.\nОтправьте ему персональную ссылку: https://t.me/${botUsername}?start=${debtor.workNumber}`);
      return;
    }

    try {
      const res = await fetch(`/api/telegram/notify/${debtor.id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Напоминание успешно отправлено в Telegram автору ${debtor.authorName}!`);
      } else {
        alert(`Ошибка отправки: ${data.error || 'Сбой Telegram API'}`);
      }
    } catch (e: any) {
      alert(`Ошибка сети: ${e.message}`);
    }
  };

  // Отправка всем должникам
  const handleSendAllTg = async () => {
    setIsSendingTg(true);
    setTgNotificationResult(null);
    try {
      const res = await fetch('/api/telegram/notify-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setTgNotificationResult({
          sentCount: data.sentCount,
          notLinkedCount: data.notLinkedCount,
          totalDebtors: data.totalDebtors
        });
      }
    } catch (e) {
      alert('Ошибка при отправке оповещений');
    } finally {
      setIsSendingTg(false);
    }
  };

  const linkedDebtorsCount = debtors.filter(d => !!d.telegramChatId).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-900 border border-rose-900/50 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Вкладка 2: Должники СНО</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Работы с неполным комплектом документов
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Telegram Notify All Button */}
          <button
            onClick={() => {
              setTgNotificationResult(null);
              setIsTgModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-sky-950/50 transition-all active:scale-95 cursor-pointer"
            title="Оповестить всех должников через Telegram-бота"
          >
            <Send className="w-4 h-4" />
            <span>Оповестить в Telegram</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-rose-950/50 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить работу</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по ФИО, № работы, группе или долгу..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Group Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 outline-none focus:border-rose-500"
          >
            <option value="all">Все группы</option>
            {groups.map((grp, i) => (
              <option key={i} value={grp}>{grp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Debtors Grid */}
      {filteredDebtors.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDebtors.map((debtor) => {
            const isTgLinked = !!debtor.telegramChatId;

            return (
              <div
                key={debtor.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-rose-900/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:shadow-rose-950/10 group"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Работа №{debtor.workNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {debtor.authorGroup || 'Группа не указана'}
                        </span>

                        {/* Telegram Link Status Badge */}
                        {isTgLinked ? (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium flex items-center gap-1">
                            <Send className="w-3 h-3 text-sky-400" />
                            <span>ТГ: {debtor.telegramUsername || 'привязан'}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCopyTgLink(debtor.workNumber)}
                            className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Скопировать ссылку для автора для привязки Telegram"
                          >
                            <Send className="w-3 h-3" />
                            <span>{copiedTgLinkWork === debtor.workNumber ? 'Ссылка скопирована!' : 'Привязать ТГ'}</span>
                          </button>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                        {debtor.authorName}
                      </h3>
                      {debtor.coauthorName && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Соавтор: <span className="text-slate-300">{debtor.coauthorName}</span> {debtor.coauthorGroup && `(${debtor.coauthorGroup})`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEdit(debtor)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Редактировать карточку"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(debtor.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Work Title */}
                  <p className="text-xs text-slate-300 font-medium mb-3 line-clamp-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 font-semibold mr-1">Тема:</span>
                    {debtor.workTitle || 'Название работы не указано'}
                  </p>

                  {/* Supervisor */}
                  <div className="text-xs text-slate-400 space-y-0.5 mb-3">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>Науч. рук.: <strong className="text-slate-300 font-medium">{debtor.supervisorName || '—'}</strong></span>
                    </div>
                    {debtor.department && (
                      <div className="text-[11px] text-slate-500">
                        Кафедра: {debtor.department}
                      </div>
                    )}
                  </div>

                  {/* PROMINENT "ЧТО ДОЛЖНЫ ДОНЕСТИ" BLOCK */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-900/50 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        Что должны донести (нет галочки):
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        нажмите «Сдано», чтобы поставить +
                      </span>
                    </div>

                    {debtor.missingDebts.length > 0 ? (
                      <div className="space-y-1.5">
                        {debtor.missingDebts.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200"
                          >
                            <span className="flex items-center gap-2 pr-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                              <span className="font-semibold text-rose-200 capitalize">{item}</span>
                            </span>
                            <button
                              onClick={() => onToggleDoc(debtor, item)}
                              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-emerald-600/30 hover:text-emerald-300 text-slate-300 text-xs flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                              title="Поставить галочку (+)"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Поставить (+)</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-emerald-400 flex items-center gap-1 py-1 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Все обязательные документы сданы!</span>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  {debtor.authorPhone && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-3">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>Тел. автора: <strong className="text-slate-300 font-mono">{debtor.authorPhone}</strong></span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Copy text reminder */}
                    <button
                      onClick={() => handleCopyReminder(debtor)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Скопировать текст сообщения"
                    >
                      {copiedId === debtor.id ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Текст</span>
                        </>
                      )}
                    </button>

                    {/* Single Telegram send */}
                    {isTgLinked ? (
                      <button
                        onClick={() => handleSendSingleTg(debtor)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-600/20 text-sky-300 hover:bg-sky-600/30 border border-sky-500/30 transition-colors cursor-pointer"
                        title="Отправить срочное напоминание автору в Telegram"
                      >
                        <Send className="w-3.5 h-3.5 text-sky-400" />
                        <span>В Telegram</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCopyTgLink(debtor.workNumber)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 hover:text-sky-300 border border-slate-700 transition-colors cursor-pointer"
                        title="Скопировать ссылку для автора"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Ссылка на бота</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onMarkAllDone(debtor)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
                    title="Поставить все обязательные галочки (+) и перенести в пунктуальные"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Сдал всё (+)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            {searchTerm || selectedGroup !== 'all' ? 'По запросу должников не найдено' : 'Прекрасно! Должников нет'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            Все сданные работы имеют полный комплект документов (все обязательные галочки стоят).
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Добавить работу
          </button>
        </div>
      )}

      {/* Telegram Bulk Notification Modal */}
      {isTgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div 
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100 p-6 space-y-5 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Оповещение должников в Telegram
                  </h3>
                  {botUsername && (
                    <p className="text-xs text-sky-400">
                      Бот: @{botUsername}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsTgModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Всего должников</span>
                <span className="text-2xl font-extrabold text-rose-400">{debtors.length}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Привязали Telegram</span>
                <span className="text-2xl font-extrabold text-sky-400">{linkedDebtorsCount}</span>
              </div>
            </div>

            {/* How to link guide */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>Как автор подключается к боту:</span>
              </div>
              <p className="text-slate-400">
                Автору достаточно перейти в бота {botUsername ? <strong>@{botUsername}</strong> : ''} и отправить <strong>номер своей работы</strong> (например: <code>27</code>).
              </p>
              {botUsername && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                  <span className="text-slate-400 truncate mr-2">https://t.me/{botUsername}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`https://t.me/${botUsername}`);
                      alert('Ссылка на бота скопирована!');
                    }}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 shrink-0 cursor-pointer"
                  >
                    Скопировать ссылку
                  </button>
                </div>
              )}
            </div>

            {/* Message preview */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Текст, который получит каждый должник:</span>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
                🚨 <strong>СРОЧНОЕ НАПОМИНАНИЕ СНО!</strong><br />
                Здравствуйте, [ФИО автора]!<br />
                По работе №[Номер] необходимо СРОЧНО донести:<br />
                ❌ [Список несданных документов]<br />
                Пожалуйста, сдайте документы в оргкомитет в ближайшее время!
              </div>
            </div>

            {/* Result banner if sent */}
            {tgNotificationResult && (
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 space-y-1">
                <div className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Уведомления успешно разосланы!</span>
                </div>
                <p className="text-xs text-slate-300">
                  • Доставлено в Telegram: <strong>{tgNotificationResult.sentCount}</strong> чел.<br />
                  • Еще не подключили бота: <strong>{tgNotificationResult.notLinkedCount}</strong> чел. (отправьте им ссылку на бота).
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsTgModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Закрыть
              </button>
              <button
                type="button"
                disabled={isSendingTg || linkedDebtorsCount === 0}
                onClick={handleSendAllTg}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-sky-950/40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingTg ? 'Отправка...' : `Отправить всем (${linkedDebtorsCount})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
