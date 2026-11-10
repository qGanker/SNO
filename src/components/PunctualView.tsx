import React, { useState } from 'react';
import { 
  CheckCircle, 
  Search, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  User, 
  Building2, 
  Phone, 
  Award, 
  Filter, 
  Plus, 
  CheckSquare, 
  FileCheck 
} from 'lucide-react';
import { SnoSubmission } from '../types/participant';

interface PunctualViewProps {
  punctual: SnoSubmission[];
  onEdit: (submission: SnoSubmission) => void;
  onDelete: (id: string) => void;
  onReopenDebt: (submission: SnoSubmission) => void;
  onOpenAddModal: () => void;
}

export const PunctualView: React.FC<PunctualViewProps> = ({
  punctual,
  onEdit,
  onDelete,
  onReopenDebt,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const groups = Array.from(new Set(punctual.map(p => p.authorGroup).filter(Boolean)));

  const filteredPunctual = punctual.filter(sub => {
    const matchesSearch = 
      sub.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.workNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.authorGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.workTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.supervisorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || sub.authorGroup === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-900/50 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Вкладка 3: Пунктуальные люди СНО</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Работы с полным комплектом (всё сдано)
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-extrabold text-emerald-400">
              {punctual.length}
            </div>
            <div className="text-[11px] text-slate-400">сдали полностью</div>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
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
            placeholder="Поиск по ФИО автора, номеру работы или теме..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>

        {/* Group Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 outline-none focus:border-emerald-500"
          >
            <option value="all">Все группы</option>
            {groups.map((grp, i) => (
              <option key={i} value={grp}>{grp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Punctual Works */}
      {filteredPunctual.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPunctual.map((sub) => (
            <div
              key={sub.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-emerald-900/60 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Работа №{sub.workNumber}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                      {sub.authorGroup}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(sub)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Редактировать карточку"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(sub.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors mb-1">
                  {sub.authorName}
                </h3>
                {sub.coauthorName && (
                  <p className="text-xs text-slate-400 mb-2">
                    Соавтор: {sub.coauthorName} ({sub.coauthorGroup})
                  </p>
                )}

                {/* Title */}
                <p className="text-xs text-slate-300 font-medium mb-3 line-clamp-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  {sub.workTitle || 'Без названия'}
                </p>

                {/* Status Box */}
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 mb-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Все документы сданы (+)</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Науч. рук.: <strong>{sub.supervisorName || '—'}</strong>
                  </div>
                  {sub.department && (
                    <div className="text-[11px] text-slate-400">
                      Кафедра: {sub.department}
                    </div>
                  )}
                  {sub.actStudyProcess && (
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-emerald-900/30 flex gap-2">
                      <span>Акт: {sub.actStudyProcess}</span>
                      {sub.publicationsCount && <span>• Публикаций: {sub.publicationsCount}</span>}
                    </div>
                  )}
                </div>

                {sub.authorPhone && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Тел.: {sub.authorPhone}
                  </div>
                )}
              </div>

              {/* Reopen Action */}
              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => onReopenDebt(sub)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                  title="Снять галочки и вернуть в должники"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Вернуть в должники (снять отметку)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty */
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800">
          <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Пунктуальных авторов пока нет в списке
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6">
            Отметьте недостающие галочки в карточке работы, и она автоматически переместится сюда.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Добавить работу
          </button>
        </div>
      )}
    </div>
  );
};
