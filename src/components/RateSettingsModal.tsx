import React, { useState, useEffect } from 'react';
import { CrossarmOption, MaintenanceRates, StructureOption } from '../types/pole';
import {
  DEFAULT_CROSSARM_OPTIONS,
  DEFAULT_MAINTENANCE_RATES,
  DEFAULT_QUICK_INSULATORS,
  DEFAULT_STRUCTURE_OPTIONS,
  getCrossarmOptions,
  getQuickInsulatorCounts,
  getStructureOptions,
} from '../data/seedData';
import { formatVnd } from '../utils/calculations';
import {
  Check,
  CheckCircle2,
  DollarSign,
  Fuel,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

interface RateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: MaintenanceRates;
  onSaveRates: (rates: MaintenanceRates) => void;
}

export const RateSettingsModal: React.FC<RateSettingsModalProps> = ({
  isOpen,
  onClose,
  rates,
  onSaveRates,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formRates, setFormRates] = useState<MaintenanceRates>(() => ({
    ...rates,
    crossarmOptions: getCrossarmOptions(rates),
    structureOptions: getStructureOptions(rates),
    quickInsulatorCounts: getQuickInsulatorCounts(rates),
  }));

  // Adding sub-forms
  const [isAddingVoltage, setIsAddingVoltage] = useState(false);
  const [newVoltageName, setNewVoltageName] = useState('');
  const [newVoltageCost, setNewVoltageCost] = useState(250000);

  const [isAddingCrossarm, setIsAddingCrossarm] = useState(false);
  const [newCrossarmLabel, setNewCrossarmLabel] = useState('');
  const [newCrossarmSublabel, setNewCrossarmSublabel] = useState('');
  const [newCrossarmMultiplier, setNewCrossarmMultiplier] = useState(1.4);

  const [isAddingStructure, setIsAddingStructure] = useState(false);
  const [newStructureLabel, setNewStructureLabel] = useState('');
  const [newStructureSublabel, setNewStructureSublabel] = useState('');
  const [newStructureMultiplier, setNewStructureMultiplier] = useState(1.2);

  const [newQuickInsulator, setNewQuickInsulator] = useState<number>(18);

  // Sync formRates when rates prop updates or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormRates({
        ...rates,
        crossarmOptions: getCrossarmOptions(rates),
        structureOptions: getStructureOptions(rates),
        quickInsulatorCounts: getQuickInsulatorCounts(rates),
      });
      setIsAddingVoltage(false);
      setIsAddingCrossarm(false);
      setIsAddingStructure(false);
    }
  }, [rates, isOpen]);

  const handleResetDefault = () => {
    setFormRates({
      ...DEFAULT_MAINTENANCE_RATES,
      crossarmOptions: [...DEFAULT_CROSSARM_OPTIONS],
      structureOptions: [...DEFAULT_STRUCTURE_OPTIONS],
      quickInsulatorCounts: [...DEFAULT_QUICK_INSULATORS],
    });
  };

  // --- CRUD for Voltage Levels ---
  const handleAddVoltage = () => {
    const key = newVoltageName.trim();
    if (!key) {
      alert('Vui lòng nhập tên cấp điện áp (ví dụ: 220kV).');
      return;
    }
    if (formRates.baseCostByVoltage[key] !== undefined) {
      alert(`Cấp điện áp "${key}" đã tồn tại.`);
      return;
    }
    setFormRates({
      ...formRates,
      baseCostByVoltage: {
        ...formRates.baseCostByVoltage,
        [key]: Math.max(0, newVoltageCost || 0),
      },
    });
    setNewVoltageName('');
    setIsAddingVoltage(false);
  };

  const handleDeleteVoltage = (key: string) => {
    const keys = Object.keys(formRates.baseCostByVoltage);
    if (keys.length <= 1) {
      alert('Hệ thống phải duy trì ít nhất 1 cấp điện áp.');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa cấp điện áp "${key}"?`)) {
      const next = { ...formRates.baseCostByVoltage };
      delete next[key];
      setFormRates({ ...formRates, baseCostByVoltage: next });
    }
  };

  // --- CRUD for Crossarms ---
  const handleAddCrossarm = () => {
    const label = newCrossarmLabel.trim();
    if (!label) {
      alert('Vui lòng nhập tên loại đà (ví dụ: ĐÀ NÉO GÓC).');
      return;
    }
    const id = `crossarm_${Date.now()}`;
    const nextOptions = [
      ...(formRates.crossarmOptions || getCrossarmOptions(formRates)),
      {
        id,
        label,
        sublabel: newCrossarmSublabel.trim() || `Hệ số phụ cấp ${newCrossarmMultiplier}`,
        multiplier: Math.max(0.1, Number(newCrossarmMultiplier) || 1.0),
      },
    ];
    setFormRates({
      ...formRates,
      crossarmOptions: nextOptions,
    });
    setNewCrossarmLabel('');
    setNewCrossarmSublabel('');
    setIsAddingCrossarm(false);
  };

  const handleDeleteCrossarm = (id: string) => {
    const current = formRates.crossarmOptions || getCrossarmOptions(formRates);
    if (current.length <= 1) {
      alert('Phải giữ lại ít nhất 1 loại đà.');
      return;
    }
    setFormRates({
      ...formRates,
      crossarmOptions: current.filter((c) => c.id !== id),
    });
  };

  // --- CRUD for Pole Structures ---
  const handleAddStructure = () => {
    const label = newStructureLabel.trim();
    if (!label) {
      alert('Vui lòng nhập tên kết cấu trụ (ví dụ: TRỤ BTLT DỰ ỨNG LỰC).');
      return;
    }
    const id = `struct_${Date.now()}`;
    const nextOptions = [
      ...(formRates.structureOptions || getStructureOptions(formRates)),
      {
        id,
        label,
        sublabel: newStructureSublabel.trim() || `Hệ số phụ cấp ${newStructureMultiplier}`,
        multiplier: Math.max(0.1, Number(newStructureMultiplier) || 1.0),
      },
    ];
    setFormRates({
      ...formRates,
      structureOptions: nextOptions,
    });
    setNewStructureLabel('');
    setNewStructureSublabel('');
    setIsAddingStructure(false);
  };

  const handleDeleteStructure = (id: string) => {
    const current = formRates.structureOptions || getStructureOptions(formRates);
    if (current.length <= 1) {
      alert('Phải giữ lại ít nhất 1 loại kết cấu thân trụ.');
      return;
    }
    setFormRates({
      ...formRates,
      structureOptions: current.filter((s) => s.id !== id),
    });
  };

  // --- CRUD for Quick Insulator buttons ---
  const handleAddQuickInsulator = () => {
    const count = Number(newQuickInsulator);
    if (!Number.isInteger(count) || count <= 0) return;
    const current = formRates.quickInsulatorCounts || DEFAULT_QUICK_INSULATORS;
    if (!current.includes(count)) {
      const next = [...current, count].sort((a, b) => a - b);
      setFormRates({ ...formRates, quickInsulatorCounts: next });
    }
  };

  const handleDeleteQuickInsulator = (val: number) => {
    const current = formRates.quickInsulatorCounts || DEFAULT_QUICK_INSULATORS;
    if (current.length <= 1) return;
    setFormRates({
      ...formRates,
      quickInsulatorCounts: current.filter((c) => c !== val),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const voltageValues = Object.values(formRates.baseCostByVoltage);
    if (voltageValues.some((v) => !Number.isFinite(v) || v < 0)) {
      alert('Đơn giá nhân công theo cấp áp phải là số không âm.');
      return;
    }

    // Keep offset/double/steel multipliers synced for older fallback code
    const offsetOpt = formRates.crossarmOptions?.find((o) => o.id === 'offset');
    const doubleOpt = formRates.structureOptions?.find((o) => o.id === 'double');
    const steelOpt = formRates.structureOptions?.find((o) => o.id === 'steel_tower');

    const finalizedRates: MaintenanceRates = {
      ...formRates,
      offsetCrossarmMultiplier: offsetOpt?.multiplier ?? formRates.offsetCrossarmMultiplier,
      doublePoleMultiplier: doubleOpt?.multiplier ?? formRates.doublePoleMultiplier,
      steelTowerMultiplier: steelOpt?.multiplier ?? formRates.steelTowerMultiplier,
    };

    onSaveRates(finalizedRates);
    onClose();
  };

  if (!isOpen) return null;

  const crossarms = formRates.crossarmOptions || getCrossarmOptions(formRates);
  const structures = formRates.structureOptions || getStructureOptions(formRates);
  const quickInsulators = formRates.quickInsulatorCounts || DEFAULT_QUICK_INSULATORS;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs overflow-y-auto transition-all duration-150 ${
        isFullscreen ? 'p-0' : 'p-3 sm:p-5'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none shadow-none my-0 border-0'
            : 'w-full max-w-2xl sm:max-w-4xl rounded-2xl shadow-2xl my-auto max-h-[92vh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Maximize/Restore & Close Buttons */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1.5 truncate">
              <Sliders className="w-3.5 h-3.5 shrink-0" />
              <span>Cấu Hình Định Mức Kỹ Thuật EVN</span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
              Bảng Đơn Giá Bảo Trì, Cấp Áp, Kết Cấu & Phân Bổ Nhiên Liệu
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ cửa sổ (Khôi phục kích thước ban đầu)' : 'Phóng to toàn màn hình'}
              aria-label={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-sky-400" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Đóng cửa sổ cấu hình"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Group 1: Base Voltage Rates - Fully Dynamic */}
          <div className="space-y-3 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <span>1. Đơn Giá Nhân Công Cơ Bản Theo Cấp Điện Áp (VNĐ/trụ)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingVoltage(!isAddingVoltage)}
                className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm cấp áp</span>
              </button>
            </div>

            {/* Inline Add Voltage Form */}
            {isAddingVoltage && (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-2.5">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1">
                  <span>+ Tạo thêm cấp điện áp mới:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-amber-800">Tên cấp áp (VD: 220kV, 500kV)</label>
                    <input
                      type="text"
                      value={newVoltageName}
                      onChange={(e) => setNewVoltageName(e.target.value)}
                      placeholder="VD: 220kV"
                      className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-amber-800">Đơn giá nhân công (VNĐ/trụ)</label>
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={newVoltageCost}
                      onChange={(e) => setNewVoltageCost(parseInt(e.target.value, 10) || 0)}
                      className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingVoltage(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVoltage}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg"
                  >
                    Xác nhận thêm
                  </button>
                </div>
              </div>
            )}

            {/* Voltage Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(formRates.baseCostByVoltage).map(([vLevel, cost]) => (
                <div key={vLevel} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 font-mono">{vLevel}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteVoltage(vLevel)}
                      title={`Xóa cấp điện áp ${vLevel}`}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="5000"
                      value={cost}
                      onChange={(e) =>
                        setFormRates({
                          ...formRates,
                          baseCostByVoltage: {
                            ...formRates.baseCostByVoltage,
                            [vLevel]: parseInt(e.target.value, 10) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono font-bold"
                    />
                    <div className="text-[10px] text-slate-400 mt-0.5 text-right font-mono">
                      {formatVnd(cost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Physical Structure & Insulator Factors - Fully Dynamic */}
          <div className="space-y-4 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 pb-1.5 border-b border-slate-200">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>2. Đơn Giá Sứ, Cây Đà & Kết Cấu Thân Trụ</span>
            </div>

            {/* General rates: Insulator & Distance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-xs font-semibold text-slate-700 block">
                  Đơn giá kiểm tra/vệ sinh mỗi cục sứ (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={formRates.costPerInsulator}
                  onChange={(e) =>
                    setFormRates({
                      ...formRates,
                      costPerInsulator: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {formatVnd(formRates.costPerInsulator)} / cục sứ
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <label className="text-xs font-semibold text-slate-700 block">
                  Phụ cấp cự ly tuyến xa (VNĐ / km cách trạm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formRates.distanceAllowancePerKm}
                  onChange={(e) =>
                    setFormRates({
                      ...formRates,
                      distanceAllowancePerKm: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full mt-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {formatVnd(formRates.distanceAllowancePerKm)} / km
                </span>
              </div>
            </div>

            {/* Quick Insulator Pills Manager */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Nút chọn nhanh số lượng cục sứ (hiển thị khi nhập hiện trường):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newQuickInsulator}
                    onChange={(e) => setNewQuickInsulator(parseInt(e.target.value, 10) || 1)}
                    className="w-14 px-1.5 py-0.5 text-xs border border-slate-300 rounded text-center font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickInsulator}
                    className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded border border-blue-200 cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickInsulators.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200"
                  >
                    <span>{val} sứ</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuickInsulator(val)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Crossarm Options Section (Cây đà) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Danh mục loại cây đà & hệ số nhân phụ cấp:
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingCrossarm(!isAddingCrossarm)}
                  className="px-2 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm loại đà</span>
                </button>
              </div>

              {/* Inline Add Crossarm Form */}
              {isAddingCrossarm && (
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                  <div className="text-xs font-bold text-emerald-900">+ Tạo thêm loại cây đà mới:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-emerald-800">Tên loại đà</label>
                      <input
                        type="text"
                        value={newCrossarmLabel}
                        onChange={(e) => setNewCrossarmLabel(e.target.value)}
                        placeholder="VD: ĐÀ NÉO GÓC"
                        className="w-full mt-0.5 px-2 py-1 text-xs bg-white border border-emerald-300 rounded-lg font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-emerald-800">Mô tả / Ghi chú</label>
                      <input
                        type="text"
                        value={newCrossarmSublabel}
                        onChange={(e) => setNewCrossarmSublabel(e.target.value)}
                        placeholder="VD: Góc néo > 30°"
                        className="w-full mt-0.5 px-2 py-1 text-xs bg-white border border-emerald-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-emerald-800">Hệ số nhân (1.0 = chuẩn)</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.05"
                        value={newCrossarmMultiplier}
                        onChange={(e) => setNewCrossarmMultiplier(parseFloat(e.target.value) || 1.0)}
                        className="w-full mt-0.5 px-2 py-1 text-xs bg-white border border-emerald-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCrossarm(false)}
                      className="px-2.5 py-1 text-xs text-slate-600"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCrossarm}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
                    >
                      Lưu loại đà
                    </button>
                  </div>
                </div>
              )}

              {/* Crossarm Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {crossarms.map((arm) => (
                  <div key={arm.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{arm.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{arm.sublabel}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0.1"
                        step="0.05"
                        value={arm.multiplier}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1.0;
                          setFormRates({
                            ...formRates,
                            crossarmOptions: crossarms.map((o) => (o.id === arm.id ? { ...o, multiplier: val } : o)),
                          });
                        }}
                        className="w-16 px-1.5 py-1 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCrossarm(arm.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Xóa loại đà"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Structure Options Section (Kết cấu thân trụ) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Danh mục kết cấu thân trụ & hệ số nhân:
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingStructure(!isAddingStructure)}
                  className="px-2 py-1 text-[11px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm kết cấu</span>
                </button>
              </div>

              {/* Inline Add Structure Form */}
              {isAddingStructure && (
                <div className="p-3 bg-sky-50/80 rounded-xl border border-sky-200 space-y-2">
                  <div className="text-xs font-bold text-sky-900">+ Tạo thêm kết cấu thân trụ mới:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-sky-800">Tên kết cấu</label>
                      <input
                        type="text"
                        value={newStructureLabel}
                        onChange={(e) => setNewStructureLabel(e.target.value)}
                        placeholder="VD: TRỤ BTLT DỰ ỨNG LỰC"
                        className="w-full mt-0.5 px-2 py-1 text-xs bg-white border border-sky-300 rounded-lg font-bold uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-sky-800">Mô tả / Ghi chú</label>
                      <input
                        type="text"
                        value={newStructureSublabel}
                        onChange={(e) => setNewStructureSublabel(e.target.value)}
                        placeholder="VD: Tải nặng (+20%)"
                        className="w-full mt-0.5 px-2 py-1 text-xs bg-white border border-sky-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-sky-800">Hệ số nhân (1.0 = chuẩn)</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.05"
                        value={newStructureMultiplier}
                        onChange={(e) => setNewStructureMultiplier(parseFloat(e.target.value) || 1.0)}
                        className="w-full mt-0.5 px-2 py-1 text-xs bg-white border border-sky-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingStructure(false)}
                      className="px-2.5 py-1 text-xs text-slate-600"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleAddStructure}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg"
                    >
                      Lưu kết cấu
                    </button>
                  </div>
                </div>
              )}

              {/* Structure Items List */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {structures.map((st) => (
                  <div key={st.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{st.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{st.sublabel}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min="0.1"
                        step="0.05"
                        value={st.multiplier}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1.0;
                          setFormRates({
                            ...formRates,
                            structureOptions: structures.map((o) => (o.id === st.id ? { ...o, multiplier: val } : o)),
                          });
                        }}
                        className="w-14 px-1 py-1 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteStructure(st.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Xóa kết cấu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Group 3: Fuel Allocation Settings */}
          <div className="space-y-3 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 pb-1 border-b border-slate-200">
              <Fuel className="w-4 h-4 text-sky-600" />
              <span>3. Định Mức Xăng Dầu & Đơn Giá Nhiên Liệu</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Xe máy (Lít / 100km)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formRates.fuelConsumption.motorbikeLitersPer100Km}
                  onChange={(e) =>
                    setFormRates({
                      ...formRates,
                      fuelConsumption: {
                        ...formRates.fuelConsumption,
                        motorbikeLitersPer100Km: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Xe cẩu/tải (Lít / 100km)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formRates.fuelConsumption.truckLitersPer100Km}
                  onChange={(e) =>
                    setFormRates({
                      ...formRates,
                      fuelConsumption: {
                        ...formRates.fuelConsumption,
                        truckLitersPer100Km: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Giá dầu DO (VNĐ / Lít)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formRates.fuelPricePerLiterVnd}
                  onChange={(e) =>
                    setFormRates({
                      ...formRates,
                      fuelPricePerLiterVnd: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold text-sky-800"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  {formatVnd(formRates.fuelPricePerLiterVnd)} / lít
                </span>
              </div>
            </div>
          </div>

          {/* Sticky footer with cancel and submit buttons */}
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 -mb-4 sm:-mb-6 p-4 sm:p-5 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px]"
              >
                Đóng / Hủy
              </button>
              <button
                type="submit"
                className="px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Áp Dụng Định Mức</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
