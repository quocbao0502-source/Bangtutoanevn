import React, { useState } from 'react';
import { MaintenanceTask, TaskCondition } from '../types/pole';
import { formatVnd, getTaskBaseRates } from '../utils/calculations';
import {
  Check,
  CheckCircle2,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

interface TaskConditionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: MaintenanceTask;
  voltageLevel: string;
  onApplyConditions: (taskId: string, selectedConditionIds: string[], customConditions?: TaskCondition[]) => void;
}

export const TaskConditionFilterModal: React.FC<TaskConditionFilterModalProps> = ({
  isOpen,
  onClose,
  task,
  voltageLevel,
  onApplyConditions,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(task.selectedConditionIds || []);
  const [conditionsList, setConditionsList] = useState<TaskCondition[]>(task.conditions || []);
  const [searchQuery, setSearchQuery] = useState('');

  // Add custom condition form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCode, setNewCode] = useState(`${task.code}.${conditionsList.length + 1}`);
  const [newDesc, setNewDesc] = useState('');
  const [newKnc, setNewKnc] = useState<number>(1.0);
  const [newKmtc, setNewKmtc] = useState<number>(1.0);
  const [newKvlp, setNewKvlp] = useState<number>(1.0);
  const [newKvlhl, setNewKvlhl] = useState<number>(1.0);

  if (!isOpen) return null;

  // Filter conditions by search query
  const filteredConditions = conditionsList.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.code.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  const handleToggleCondition = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(conditionsList.map((c) => c.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  // Compute live multipliers from selected conditions
  let totalKvlp = 1.0;
  let totalKvlhl = 1.0;
  let totalKnc = 1.0;
  let totalKmtc = 1.0;

  selectedIds.forEach((id) => {
    const cond = conditionsList.find((c) => c.id === id || c.code === id);
    if (cond?.coefficients) {
      if (cond.coefficients.auxiliaryMaterial !== undefined) totalKvlp *= cond.coefficients.auxiliaryMaterial;
      if (cond.coefficients.hotline !== undefined) totalKvlhl *= cond.coefficients.hotline;
      if (cond.coefficients.labor !== undefined) totalKnc *= cond.coefficients.labor;
      if (cond.coefficients.machinery !== undefined) totalKmtc *= cond.coefficients.machinery;
    }
  });

  totalKvlp = Number(totalKvlp.toFixed(3));
  totalKvlhl = Number(totalKvlhl.toFixed(3));
  totalKnc = Number(totalKnc.toFixed(3));
  totalKmtc = Number(totalKmtc.toFixed(3));

  // Get base rates for selected voltage level
  const baseRates = getTaskBaseRates(task, voltageLevel);
  const qty = task.quantity || 1;

  const costVlp = Math.round(qty * baseRates.auxiliaryMaterial * totalKvlp);
  const costVlhl = Math.round(qty * baseRates.hotline * totalKvlhl);
  const costNc = Math.round(qty * baseRates.labor * totalKnc);
  const costMtc = Math.round(qty * baseRates.machinery * totalKmtc);
  const itemTotal = costVlp + costVlhl + costNc + costMtc;

  // Add new condition
  const handleAddNewCondition = () => {
    if (!newDesc.trim()) {
      alert('Vui lòng nhập mô tả điều kiện thi công.');
      return;
    }
    const newCond: TaskCondition = {
      id: `cond-custom-${Date.now()}`,
      code: newCode.trim() || `${task.code}.${conditionsList.length + 1}`,
      description: newDesc.trim(),
      coefficients: {
        auxiliaryMaterial: newKvlp !== 1.0 ? newKvlp : undefined,
        hotline: newKvlhl !== 1.0 ? newKvlhl : undefined,
        labor: newKnc,
        machinery: newKmtc !== 1.0 ? newKmtc : undefined,
      },
    };

    const updatedList = [...conditionsList, newCond];
    setConditionsList(updatedList);
    setSelectedIds((prev) => [...prev, newCond.id]);
    setIsAddingNew(false);
    setNewDesc('');
  };

  const handleDeleteCondition = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa điều kiện này khỏi danh mục?')) {
      setConditionsList((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleSaveAndApply = () => {
    onApplyConditions(task.id, selectedIds, conditionsList);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-2xl sm:max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 truncate">
              <Filter className="w-3.5 h-3.5" />
              <span>BỘ LỌC ĐIỀU KIỆN THI CÔNG HOTLINE · NHÂN DỒN HỆ SỐ Kđc</span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
              {task.code}: {task.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng bảng lọc"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Guidance Banner */}
        <div className="bg-sky-50 px-4 py-2 border-b border-sky-200 text-xs text-sky-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Chọn 1 hoặc nhiều điều kiện: <strong>Tất cả hệ số sẽ tự động nhân dồn với nhau</strong> rồi nhân với đơn giá định mức ({voltageLevel}).
            </span>
          </div>
          <div className="text-[11px] font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
            Đã chọn: {selectedIds.length}/{conditionsList.length} điều kiện
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh: lắp mới, máy biến áp, rẽ nhánh, 1 pha, bọc 3 mạch..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer font-medium"
            >
              Bỏ chọn hết
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 text-xs text-sky-700 hover:text-sky-900 bg-sky-50 border border-sky-300 rounded-lg hover:bg-sky-100 transition-colors cursor-pointer font-semibold"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-2.5 py-1 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>+ Thêm điều kiện</span>
            </button>
          </div>
        </div>

        {/* Inline Drawer: Add New Custom Condition */}
        {isAddingNew && (
          <div className="p-3.5 bg-emerald-50 border-b border-emerald-300 text-xs space-y-2.5 animate-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center justify-between font-bold text-emerald-950">
              <span>Thêm mới điều kiện thi công cho công tác {task.code}:</span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Mã (vd: 16.01.01-1.16)"
                className="px-2.5 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Nội dung điều kiện kỹ thuật..."
                className="sm:col-span-3 px-2.5 py-1 bg-white border border-slate-300 rounded"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block">Hệ số Nhân công (Knc)</label>
                <input
                  type="number"
                  step="0.05"
                  value={newKnc}
                  onChange={(e) => setNewKnc(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-blue-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Hệ số Máy thi công (Kmtc)</label>
                <input
                  type="number"
                  step="0.05"
                  value={newKmtc}
                  onChange={(e) => setNewKmtc(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-amber-900"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Hệ số VL phụ (Kvlp)</label>
                <input
                  type="number"
                  step="0.05"
                  value={newKvlp}
                  onChange={(e) => setNewKvlp(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Hệ số VL Hotline (Kvlhl)</label>
                <input
                  type="number"
                  step="0.05"
                  value={newKvlhl}
                  onChange={(e) => setNewKvlhl(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleAddNewCondition}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold cursor-pointer"
              >
                Lưu điều kiện này
              </button>
            </div>
          </div>
        )}

        {/* Condition Checkbox List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 space-y-1">
          {filteredConditions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Không tìm thấy điều kiện nào khớp với từ khóa "{searchQuery}"
            </div>
          ) : (
            filteredConditions.map((cond) => {
              const isChecked = selectedIds.includes(cond.id);
              const coeff = cond.coefficients || {};
              const isCustom = cond.id.startsWith('cond-custom-');

              return (
                <div
                  key={cond.id}
                  onClick={() => handleToggleCondition(cond.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-sky-50/90 border-sky-400 ring-1 ring-sky-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // handled by parent div
                    className="w-4 h-4 mt-0.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded">
                        {cond.code}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {coeff.labor !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-bold">
                            Knc={coeff.labor}
                          </span>
                        )}
                        {coeff.machinery !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                            Kmtc={coeff.machinery}
                          </span>
                        )}
                        {coeff.auxiliaryMaterial !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-bold">
                            Kvlp={coeff.auxiliaryMaterial}
                          </span>
                        )}
                        {coeff.hotline !== undefined && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-bold">
                            Kvlhl={coeff.hotline}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-800 mt-1 font-medium leading-relaxed">
                      {cond.description}
                    </p>
                  </div>

                  {isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCondition(cond.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Xóa điều kiện này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Combined Multiplier Preview & Task Total Box */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white border-t border-slate-800 space-y-2 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-400 block tracking-wider">
                HỆ SỐ ĐIỀU CHỈNH Kđc TỔNG HỢP ({selectedIds.length} ĐIỀU KIỆN ĐƯỢC CHỌN NHÂN VỚI NHAU):
              </span>
              <div className="flex items-center gap-3 text-xs font-mono font-bold mt-0.5 flex-wrap">
                <span className="text-blue-300">Knc = {totalKnc}</span>
                <span className="text-amber-300">Kmtc = {totalKmtc}</span>
                <span className="text-emerald-300">Kvlp = {totalKvlp}</span>
                <span className="text-purple-300">Kvlhl = {totalKvlhl}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Thành tiền công tác ({qty} {task.unit || 'bộ'} · {voltageLevel}):
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                {formatVnd(itemTotal)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-300">
            <div>
              <span className="text-slate-500 block">VL phụ ({formatVnd(baseRates.auxiliaryMaterial)} x {totalKvlp}):</span>
              <span>{formatVnd(costVlp)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">VL Hotline ({formatVnd(baseRates.hotline)} x {totalKvlhl}):</span>
              <span>{formatVnd(costVlhl)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">NC ({formatVnd(baseRates.labor)} x {totalKnc}):</span>
              <span className="text-blue-300 font-bold">{formatVnd(costNc)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">MTC ({formatVnd(baseRates.machinery)} x {totalKmtc}):</span>
              <span className="text-amber-300 font-bold">{formatVnd(costMtc)}</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSaveAndApply}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Xác Nhận & Áp Dụng Điều Kiện Vào Dự Toán</span>
          </button>
        </div>
      </div>
    </div>
  );
};

