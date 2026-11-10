import React from 'react';
import { Users, AlertCircle, CheckCircle, Plus, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { ActiveTab, SnoSubmission } from '../types/participant';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  submissions: SnoSubmission[];
  onOpenAddModal: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  submissions,
  onOpenAddModal,
  onExportExcel,
  onExportCsv,
  onResetData,
}) => {
  const totalCount = submissions.length;
  const debtorsCount = submissions.filter(p => p.status === 'debtor').length;
  const punctualCount = submissions.filter(p => p.status === 'punctual').length;

  const totalMissingDebts = submissions
    .filter(p => p.status === 'debtor')
    .reduce((acc, p) => acc + p.missingDebts.length, 0);

  return (
    <>
      {/* Topbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title & Badge */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  СНО: Учёт работ и документов
                </h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
                title="Выгрузить весь реестр в точно такой же Excel файл как в образце"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Выгрузить в</span> Excel (.xlsx)
              </button>

              <button
                onClick={onExportCsv}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                title="Выгрузить в CSV"
              >
                CSV
              </button>

              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Добавить работу (+)</span>
              </button>

              <button
                onClick={onResetData}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Сбросить на образец СНО"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 Tabs Bar */}
        <div className="border-t border-slate-800 bg-slate-900/90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto py-2 no-scrollbar">
              {/* Tab 1: Все участники */}
              <button
                onClick={() => onTabChange('participants')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'participants'
                    ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>1. Все работы СНО</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'participants' ? 'bg-indigo-500/25 text-indigo-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {totalCount}
                </span>
              </button>

              {/* Tab 2: Должники (что донести) */}
              <button
                onClick={() => onTabChange('debtors')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'debtors'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>2. Должники (что должны донести)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === 'debtors'
                    ? 'bg-rose-500/25 text-rose-300'
                    : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                }`}>
                  {debtorsCount} {totalMissingDebts > 0 && `(${totalMissingDebts} поз.)`}
                </span>
              </button>

              {/* Tab 3: Пунктуальные люди (всё сдали) */}
              <button
                onClick={() => onTabChange('punctual')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'punctual'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>3. Пунктуальные люди (всё сдали)</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  activeTab === 'punctual'
                    ? 'bg-emerald-500/25 text-emerald-300'
                    : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                }`}>
                  {punctualCount}
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 py-1.5 px-3 flex justify-around items-center shadow-2xl">
        <button
          onClick={() => onTabChange('participants')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            activeTab === 'participants' ? 'text-indigo-400' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Все ({totalCount})</span>
        </button>

        <button
          onClick={() => onTabChange('debtors')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            activeTab === 'debtors' ? 'text-rose-400' : 'text-slate-400'
          }`}
        >
          <div className="relative">
            <AlertCircle className="w-5 h-5 mb-0.5 text-rose-400" />
            {debtorsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {debtorsCount}
              </span>
            )}
          </div>
          <span>Должники</span>
        </button>

        <button
          onClick={() => onTabChange('punctual')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            activeTab === 'punctual' ? 'text-emerald-400' : 'text-slate-400'
          }`}
        >
          <CheckCircle className="w-5 h-5 mb-0.5 text-emerald-400" />
          <span>Сдали всё ({punctualCount})</span>
        </button>
      </div>
    </>
  );
};
