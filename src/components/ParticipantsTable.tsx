import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  Building2, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { SnoSubmission } from '../types/participant';

interface ParticipantsTableProps {
  submissions: SnoSubmission[];
  onEdit: (submission: SnoSubmission) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (submission: SnoSubmission) => void;
  onOpenAddModal: () => void;
}

export const ParticipantsTable: React.FC<ParticipantsTableProps> = ({
  submissions,
  onEdit,
  onDelete,
  onToggleStatus,
  onOpenAddModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debtor' | 'punctual'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const groups = Array.from(new Set(submissions.map(p => p.authorGroup).filter(Boolean)));

  const filtered = submissions.filter(s => {
    const matchesSearch = 
      s.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.workNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.authorGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.workTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supervisorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.missingDebts.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesGroup = selectedGroup === 'all' || s.authorGroup === selectedGroup;

    return matchesSearch && matchesStatus && matchesGroup;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Вкладка 1: Реестр всех работ СНО</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Сводная таблица поданных работ
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-extrabold text-indigo-400">
              {submissions.length}
            </div>
            <div className="text-[11px] text-slate-400">всего работ</div>
          </div>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить работу</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по ФИО, № работы, группе, теме..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({submissions.length})
            </button>
            <button
              onClick={() => setStatusFilter('debtor')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'debtor' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Должники ({submissions.filter(p => p.status === 'debtor').length})
            </button>
            <button
              onClick={() => setStatusFilter('punctual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'punctual' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Сдали всё ({submissions.filter(p => p.status === 'punctual').length})
            </button>
          </div>

          {/* Group dropdown */}
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-slate-200 outline-none focus:border-indigo-500"
          >
            <option value="all">Все группы</option>
            {groups.map((grp, i) => (
              <option key={i} value={grp}>{grp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      {filtered.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-200">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3.5 px-3">№</th>
                  <th className="py-3.5 px-4">ФИО автора и телефон</th>
                  <th className="py-3.5 px-3">Группа</th>
                  <th className="py-3.5 px-4">Тема работы и секция</th>
                  <th className="py-3.5 px-3">Статус</th>
                  <th className="py-3.5 px-4">Что должны донести (-)</th>
                  <th className="py-3.5 px-3">Науч. руководитель</th>
                  <th className="py-3.5 px-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((sub) => {
                  const isDebtor = sub.status === 'debtor';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* № работы */}
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        №{sub.workNumber}
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {sub.authorName}
                        </div>
                        {sub.authorPhone && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {sub.authorPhone}
                          </div>
                        )}
                        {sub.coauthorName && (
                          <div className="text-[11px] text-slate-500">
                            соавтор: {sub.coauthorName}
                          </div>
                        )}
                      </td>

                      {/* Group */}
                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-indigo-300">
                        {sub.authorGroup || '—'}
                      </td>

                      {/* Title & Section */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-200 line-clamp-2 font-medium">
                          {sub.workTitle}
                        </div>
                        {sub.section && (
                          <div className="text-[11px] text-slate-400">
                            {sub.section}
                          </div>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus(sub)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            isDebtor
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                          title="Нажмите, чтобы переключить статус"
                        >
                          {isDebtor ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Должник</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Всё сдал (+)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Missing Debts */}
                      <td className="py-3.5 px-4">
                        {isDebtor ? (
                          <div className="flex flex-wrap gap-1">
                            {sub.missingDebts.map((debt, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[11px] font-medium"
                              >
                                {debt}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-400 font-medium">
                            Все галочки стоят (+)
                          </span>
                        )}
                      </td>

                      {/* Supervisor */}
                      <td className="py-3.5 px-3 text-xs text-slate-300 whitespace-nowrap">
                        <div>{sub.supervisorName || '—'}</div>
                        {sub.department && <div className="text-[10px] text-slate-500">{sub.department}</div>}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEdit(sub)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Редактировать"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(sub.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-slate-400 text-sm mb-4">
            По заданным фильтрам работы не найдены.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            Добавить работу СНО
          </button>
        </div>
      )}
    </div>
  );
};
