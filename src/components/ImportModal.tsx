import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { Participant } from '../types/participant';
import { parseUploadedFile } from '../utils/excelExport';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (imported: Participant[], replaceExisting: boolean) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedParticipants, setParsedParticipants] = useState<Participant[] | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await parseUploadedFile(file);
      if (result.length === 0) {
        setError('В файле не обнаружено строк данных.');
      } else {
        setParsedParticipants(result);
      }
    } catch (err: any) {
      setError(`Ошибка чтения файла: ${err.message || 'Неверный формат'}. Убедитесь, что это файл .csv или .xlsx`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (parsedParticipants && parsedParticipants.length > 0) {
      onImportSuccess(parsedParticipants, replaceExisting);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-fade-in text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Импорт данных из файла
              </h3>
              <p className="text-xs text-slate-400">
                Поддерживаются файлы Excel (.xlsx, .xls) и CSV (.csv)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!parsedParticipants ? (
            <div>
              <div
                onDragEnter={() => setDragActive(true)}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-500/10' 
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>

                <div className="text-sm font-semibold text-slate-200 mb-1">
                  {isLoading ? 'Загрузка и обработка...' : 'Перетащите файл сюда или нажмите для выбора'}
                </div>
                <p className="text-xs text-slate-500">
                  Вы можете загрузить исходный CSV файл с участниками или выгруженную Excel таблицу.
                </p>
              </div>

              {error && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            /* Preview of parsed data */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">
                    Успешно распознано: {parsedParticipants.length} участников
                  </div>
                  <p className="text-xs text-slate-400">
                    Из них должников: {parsedParticipants.filter(p => p.status === 'debtor').length}, пунктуальных: {parsedParticipants.filter(p => p.status === 'punctual').length}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Как добавить данные:
                </label>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="radio"
                      name="replaceMode"
                      checked={!replaceExisting}
                      onChange={() => setReplaceExisting(false)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Объединить с текущими участниками (дополнить список)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <input
                      type="radio"
                      name="replaceMode"
                      checked={replaceExisting}
                      onChange={() => setReplaceExisting(true)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Заменить текущий список загруженными данными</span>
                  </label>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                {parsedParticipants.slice(0, 10).map((p, idx) => (
                  <div key={idx} className="flex justify-between text-slate-300 py-0.5 border-b border-slate-800/40">
                    <span>{p.id}: {p.fullName}</span>
                    <span className={p.status === 'debtor' ? 'text-rose-400' : 'text-emerald-400'}>
                      {p.status === 'debtor' ? `Долги (${p.debtItems.length})` : 'Всё сдал'}
                    </span>
                  </div>
                ))}
                {parsedParticipants.length > 10 && (
                  <div className="text-center text-slate-500 py-1">
                    ... и ещё {parsedParticipants.length - 10} записей
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            {parsedParticipants ? (
              <button
                type="button"
                onClick={() => setParsedParticipants(null)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Выбрать другой файл
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Отмена
              </button>
              {parsedParticipants && (
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
                >
                  Применить данные
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
