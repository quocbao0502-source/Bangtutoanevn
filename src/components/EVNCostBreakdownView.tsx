import React, { useState, useEffect, useMemo } from 'react';
import {
  EVNMultiTaskCostBreakdown,
  EstimateOptions,
  MaintenanceRates,
  MaintenanceTask,
} from '../types/pole';
import {
  calculateEVNMultiTaskCost,
  formatKm,
  formatVnd,
} from '../utils/calculations';
import {
  DEFAULT_EVN_TASKS_TEMPLATE,
  DEFAULT_MAINTENANCE_RATES,
} from '../data/seedData';
import {
  AlertTriangle,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  FileSpreadsheet,
  FileText,
  Info,
  Layers,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Truck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

// Preset tasks catalog for fast adding
const PRESET_HOTLINE_TASKS: Array<Omit<MaintenanceTask, 'id' | 'isSelected'>> = [
  {
    code: '16.01.01-1',
    name: 'Thay thế cách điện đứng, chân sứ đỉnh, uclevis đỡ dây chống sét trên Đd 3 pha',
    description: 'Lắp mới 6 cách điện đứng',
    unit: '1 bộ',
    taskCount: 2,
    quantity: 2,
    positionType: 'outer_insulator',
    baseRates: {
      auxiliaryMaterial: 276250,
      hotline: 155131,
      labor: 1237423,
      machinery: 2920434,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 1.2,
      machinery: 1.0,
    },
  },
  {
    code: '16.03.02-1',
    name: 'Lắp bộ xà đỡ thẳng, xà néo trên Đd 3 pha',
    description: 'Lắp mới 2 bộ xà cân',
    unit: '1 bộ',
    taskCount: 1,
    quantity: 2,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 184188,
      hotline: 103421,
      labor: 824949,
      machinery: 1946956,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 1.0,
      machinery: 1.0,
    },
  },
  {
    code: '16.09.01-1',
    name: 'Tách vỏ dây bọc trung áp tạo điểm hở',
    description: 'Tách vỏ bọc tạo 3 điểm hở',
    unit: '1 vị trí',
    taskCount: 1,
    quantity: 3,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 92094,
      hotline: 51710,
      labor: 412474,
      machinery: 973478,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 1.0,
      machinery: 1.0,
    },
  },
  {
    code: '16.13.01-1',
    name: 'Lắp đặt kẹp quai Hotline ép nguội trên Đd 3 pha',
    description: 'Lắp mới 3 kẹp quai',
    unit: '1 bộ',
    taskCount: 1,
    quantity: 3,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 138141,
      hotline: 77566,
      labor: 618711,
      machinery: 1460217,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 1.0,
      machinery: 1.0,
    },
  },
  {
    code: '16.16.05-1',
    name: 'Lắp đặt bộ tiếp địa di động Hotline',
    description: 'Lắp đặt bộ tiếp địa di động',
    unit: '1 bộ',
    taskCount: 1,
    quantity: 1,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 230234,
      hotline: 129276,
      labor: 1031186,
      machinery: 2433695,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 1.0,
      machinery: 1.0,
    },
  },
  {
    code: '16.20.02-1',
    name: 'Vệ sinh cách điện Hotline bằng nước áp lực cao',
    description: 'Rửa sứ hotline đường dây 22kV',
    unit: '1 vị trí',
    taskCount: 1,
    quantity: 1,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 165000,
      hotline: 198000,
      labor: 1150000,
      machinery: 2650000,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 1.0,
      machinery: 1.0,
    },
  },
];

interface EVNCostBreakdownViewProps {
  breakdown: EVNMultiTaskCostBreakdown;
  distanceKm: number;
  initiallyExpanded?: boolean;
  tasks?: MaintenanceTask[];
  rates?: MaintenanceRates;
  onUpdateTasks?: (updatedTasks: MaintenanceTask[]) => void;
  editable?: boolean;
  estimateOptions?: EstimateOptions;
  onApplyOptions?: (options: EstimateOptions) => void;
}

export const EVNCostBreakdownView: React.FC<EVNCostBreakdownViewProps> = ({
  breakdown: initialBreakdown,
  distanceKm,
  initiallyExpanded = false,
  tasks: propTasks,
  rates: propRates,
  onUpdateTasks,
  editable = true,
  estimateOptions = {},
  onApplyOptions,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initiallyExpanded);
  const [activeTab, setActiveTab] = useState<'th01' | 'pl1' | 'pl_extras'>('th01');

  // Rates fallback
  const effectiveRates = propRates || DEFAULT_MAINTENANCE_RATES;

  // Initialize tasks state
  const [tasks, setTasks] = useState<MaintenanceTask[]>(() => {
    if (propTasks) return propTasks;
    // synthesize from initialBreakdown tasksDetail if available
    if (initialBreakdown?.tasksDetail && initialBreakdown.tasksDetail.length > 0) {
      return initialBreakdown.tasksDetail.map((t, idx) => ({
        id: `task-syn-${idx}-${t.code}`,
        code: t.code,
        name: t.name,
        description: t.description,
        unit: t.unit || '1 bộ',
        taskCount: t.taskCount || 1,
        quantity: t.quantity || 1,
        positionType: 'standard',
        baseRates: {
          auxiliaryMaterial: t.rawAuxiliaryMaterial || 0,
          hotline: t.rawHotline || 0,
          labor: t.rawLabor || 0,
          machinery: t.rawMachinery || 0,
        },
        positionCoefficients: {
          auxiliaryMaterial: t.coeffAuxiliaryMaterial || 1.0,
          material: t.coeffHotline || 1.0,
          labor: t.coeffLabor || 1.0,
          machinery: t.coeffMachinery || 1.0,
        },
        isSelected: true,
      }));
    }
    return DEFAULT_EVN_TASKS_TEMPLATE;
  });

  // Sync when propTasks change
  useEffect(() => {
    if (propTasks && propTasks.length > 0) {
      setTasks(propTasks);
    }
  }, [propTasks]);

  // Customizable TH-01 Parameters
  const [isEditingParams, setIsEditingParams] = useState<boolean>(false);
  const [generalExpenseRate, setGeneralExpenseRate] = useState<number>(estimateOptions.generalExpenseRate ?? 0.65); // 65% NC
  const [taxableIncomeRate, setTaxableIncomeRate] = useState<number>(estimateOptions.taxableIncomeRate ?? 0.06);   // 6%
  const [transportDistanceKm, setTransportDistanceKm] = useState<number>(
    estimateOptions.transportDistanceKm ?? Math.max(0, distanceKm)
  );
  const [trafficSafetyCost, setTrafficSafetyCost] = useState<number>(estimateOptions.trafficSafetyCost ?? 149216); // Rào chắn cảnh giới
  const [vatRate, setVatRate] = useState<number>(estimateOptions.vatRate ?? 0.08);                      // 8% GTGT
  const [isRenovation, setIsRenovation] = useState<boolean>(estimateOptions.isRenovation ?? false);
  // Customizable PL 4, 5, 6 Parameters (Van chuyen, Rao chan, Khao sat)
  const [isEditingExtras, setIsEditingExtras] = useState<boolean>(false);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(
    estimateOptions.fuelPricePerLiter ?? (effectiveRates.fuelPricePerLiterVnd > 0 ? effectiveRates.fuelPricePerLiterVnd : 30490)
  );
  const [workerVehicleQuota, setWorkerVehicleQuota] = useState<number>(estimateOptions.workerVehicleQuota ?? 12.5);
  const [bucketVehicleQuota, setBucketVehicleQuota] = useState<number>(estimateOptions.bucketVehicleQuota ?? 16.0);
  const [craneVehicleQuota, setCraneVehicleQuota] = useState<number>(estimateOptions.craneVehicleQuota ?? 25.0);
  const [trafficSafetyRate, setTrafficSafetyRate] = useState<number>(estimateOptions.trafficSafetyRate ?? 298431);
  const [trafficSafetyShifts, setTrafficSafetyShifts] = useState<number>(estimateOptions.trafficSafetyShifts ?? 0.5);
  const [surveyLaborCost, setSurveyLaborCost] = useState<number>(estimateOptions.surveyLaborCost ?? 197405);          // Lắp mới (k=1) vs Cải tạo (k=1.2)

  // Notification message
  const [notification, setNotification] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Editing Task State (for modal / inline card)
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  // Add Task Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTaskDraft, setNewTaskDraft] = useState<Omit<MaintenanceTask, 'id' | 'isSelected'>>({
    code: '16.01.01-1',
    name: 'Thay thế cách điện đứng, chân sứ đỉnh trên Đd 3 pha',
    description: 'Lắp mới cách điện đứng',
    unit: '1 bộ',
    taskCount: 1,
    quantity: 1,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 276250,
      hotline: 155131,
      labor: 1237423,
      machinery: 2920434,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 1.0,
      machinery: 1.0,
    },
  });

  // Confirm delete modal state
  const [taskToDelete, setTaskToDelete] = useState<MaintenanceTask | null>(null);

  // Compute live breakdown dynamically whenever tasks or custom params change
  useEffect(() => {
    setTransportDistanceKm(estimateOptions.transportDistanceKm ?? Math.max(0, distanceKm));
  }, [distanceKm, estimateOptions.transportDistanceKm]);

  const currentOptions: EstimateOptions = {
    generalExpenseRate,
    taxableIncomeRate,
    transportDistanceKm,
    trafficSafetyCost,
    vatRate,
    isRenovation,
    fuelPricePerLiter,
    workerVehicleQuota,
    bucketVehicleQuota,
    craneVehicleQuota,
    trafficSafetyRate,
    trafficSafetyShifts,
    surveyLaborCost,
  };
  const currentBreakdown = calculateEVNMultiTaskCost(tasks, transportDistanceKm, effectiveRates, currentOptions);

  // Propagate task changes
  const applyTasksUpdate = (newTasks: MaintenanceTask[], message?: string) => {
    setTasks(newTasks);
    if (onUpdateTasks) {
      onUpdateTasks(newTasks);
    }
    if (message) {
      showToast(message);
    }
  };

  // Toggle selection
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, isSelected: !t.isSelected } : t
    );
    applyTasksUpdate(
      updated,
      'Đã cập nhật trạng thái công tác trong dự toán'
    );
  };

  // Save edited task
  const handleSaveEditedTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const updated = tasks.map((t) => (t.id === editingTask.id ? editingTask : t));
    applyTasksUpdate(updated, `Đã cập nhật công tác ${editingTask.code}`);
    setEditingTask(null);
  };

  // Delete task
  const handleConfirmDelete = () => {
    if (!taskToDelete) return;
    const updated = tasks.filter((t) => t.id !== taskToDelete.id);
    applyTasksUpdate(updated, `Đã xóa công tác ${taskToDelete.code} khỏi bảng dự toán`);
    setTaskToDelete(null);
  };

  // Add new task
  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: MaintenanceTask = {
      ...newTaskDraft,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      isSelected: true,
    };
    const updated = [...tasks, newTask];
    applyTasksUpdate(updated, `Đã thêm công tác mới: ${newTask.code}`);
    setIsAddModalOpen(false);
  };

  // Reset to default 5 ĐM 16 tasks
  const handleResetDefaultTasks = () => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn khôi phục 5 công tác gốc chuẩn ĐM 16 của EVN?'
      )
    ) {
      applyTasksUpdate(
        DEFAULT_EVN_TASKS_TEMPLATE,
        'Đã khôi phục 5 công tác chuẩn ĐM 16'
      );
    }
  };

  // Reset TH-01 parameters
  const handleResetParams = () => {
    setGeneralExpenseRate(0.65);
    setTaxableIncomeRate(0.06);
    setTransportDistanceKm(distanceKm > 0 ? distanceKm : 56);
    setTrafficSafetyCost(149216);
    setVatRate(0.08);
    setIsRenovation(false);
    showToast('Đã đặt lại hệ số TH-01 về định mức chuẩn EVN');
  };

  const handleResetExtras = () => {
    setFuelPricePerLiter(30490);
    setWorkerVehicleQuota(12.5);
    setBucketVehicleQuota(16.0);
    setCraneVehicleQuota(25.0);
    setTrafficSafetyRate(298431);
    setTrafficSafetyShifts(0.5);
    setSurveyLaborCost(197405);
    showToast('Đã đặt lại đơn giá & định mức PL 4, 5, 6 về chuẩn EVN');
  };

  const grandTotal = currentBreakdown.totalEstimateAfterTax;

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/50 overflow-hidden text-xs transition-all shadow-xs relative">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-2 right-2 z-30 bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header bar / Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-sky-100/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sky-950 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
              <span className="truncate">Dự Toán Hotline EVN (Phụ lục TH-01)</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-200 text-sky-900 font-mono font-semibold">
                ĐM 16 · {tasks.filter((t) => t.isSelected).length}/{tasks.length} công tác
              </span>
            </div>
            <div className="text-[11px] text-sky-700 truncate mt-0.5">
              Trực tiếp T:{' '}
              <strong className="font-mono">{formatVnd(currentBreakdown.directCost)}</strong>{' '}
              · Gián tiếp ({(generalExpenseRate * 100).toFixed(0)}% NC):{' '}
              <strong className="font-mono">
                {formatVnd(currentBreakdown.totalIndirectCost)}
              </strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Tổng dự toán sau thuế:
            </span>
            <span className="font-mono font-extrabold text-sky-950 text-sm sm:text-base">
              {formatVnd(grandTotal)}
            </span>
          </div>
          <div className="p-1 rounded-md bg-white border border-sky-200 text-sky-700 shadow-2xs">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Expanded Multi-Step Formula Details */}
      {isExpanded && (
        <div className="p-3 sm:p-4 border-t border-sky-200 bg-white space-y-4">
          {/* Action Ribbon: Quick Add & Settings */}
          {editable && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-sky-50 rounded-lg border border-sky-200">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-sky-900 uppercase tracking-wide flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-sky-600" />
                  <span>Quản lý định mức bảng tính:</span>
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  (Cho phép thêm, sửa đơn giá/hệ số, xóa hoặc bật tắt công tác)
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                  title="Thêm một công tác bảo trì Hotline mới vào bảng tính"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Thêm công tác</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pl1')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                    activeTab === 'pl1'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                  title="Chuyển sang bảng ĐM 16 để xem và bấm Sửa hoặc Xóa từng công tác"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Sửa công tác ĐM 16</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingParams(!isEditingParams)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                    isEditingParams
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                  }`}
                  title="Chỉnh sửa tỷ lệ chi phí chung C, thuế tính trước TL, thuế GTGT"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Sửa hệ số TH-01</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pl_extras');
                    setIsEditingExtras(true);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
                    isEditingExtras && activeTab === 'pl_extras'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white hover:bg-slate-50 text-emerald-800 border-emerald-300'
                  }`}
                  title="Chỉnh sửa đơn giá dầu DO, định mức 3 loại xe, rào chắn và chi phí khảo sát"
                >
                  <Truck className="w-3 h-3" />
                  <span>Sửa đơn giá PL 4, 5, 6</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDefaultTasks}
                  className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                  title="Khôi phục lại 5 công tác chuẩn ĐM 16 của EVN"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden md:inline">Đặt lại ĐM 16</span>
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Form for Editing TH-01 Overall Parameters */}
          {isEditingParams && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                  <span>Chỉnh sửa các tỷ lệ & hệ số dự toán (Phụ lục TH-01)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingParams(false)}
                  className="text-amber-800 hover:text-amber-950 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-[11px]">
                <div>
                  <label className="text-slate-700 block font-medium">Chi phí chung C (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={generalExpenseRate}
                    onChange={(e) => setGeneralExpenseRate(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                  />
                  <span className="text-[9px] text-slate-400">VD: 0.65 = 65% NC</span>
                </div>

                <div>
                  <label className="text-slate-700 block font-medium">Thuế tính trước TL (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={taxableIncomeRate}
                    onChange={(e) => setTaxableIncomeRate(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                  />
                  <span className="text-[9px] text-slate-400">VD: 0.06 = 6%(T+GT)</span>
                </div>

                <div>
                  <label className="text-slate-700 block font-medium">Cự ly vận chuyển (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={transportDistanceKm}
                    onChange={(e) => setTransportDistanceKm(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                  />
                  <span className="text-[9px] text-slate-400">Cự ly một chiều theo hồ sơ</span>
                </div>

                <div>
                  <label className="text-slate-700 block font-medium">Rào chắn cảnh giới K</label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={trafficSafetyCost}
                    onChange={(e) => setTrafficSafetyCost(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                  />
                  <span className="text-[9px] text-slate-400">0.5 ca x 298.431</span>
                </div>

                <div>
                  <label className="text-slate-700 block font-medium">Thuế GTGT (%)</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                  >
                    <option value={0.08}>8% (giả định)</option>
                    <option value={0.1}>10% (Tiêu chuẩn)</option>
                    <option value={0}>0% (Miễn thuế)</option>
                  </select>
                  <span className="text-[9px] text-slate-400">Chọn theo hồ sơ áp dụng</span>
                </div>

                <div>
                  <label className="text-slate-700 block font-medium">Loại công trình</label>
                  <select
                    value={isRenovation ? 'renovation' : 'new'}
                    onChange={(e) => setIsRenovation(e.target.value === 'renovation')}
                    className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded font-medium"
                  >
                    <option value="new">Lắp mới (K=1.0)</option>
                    <option value="renovation">Cải tạo (K=1.2)</option>
                  </select>
                  <span className="text-[9px] text-slate-400">Hệ số lập PA Gpa2</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleResetParams}
                  className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded text-[11px] font-medium cursor-pointer"
                >
                  Khôi phục mặc định EVN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (Object.values(currentOptions).some(v => typeof v === 'number' && (!Number.isFinite(v) || v < 0))) {
                      showToast('Hệ số và chi phí phải là số không âm.'); return;
                    }
                    onApplyOptions?.(currentOptions);
                    setIsEditingParams(false);
                    showToast('Đã áp dụng các hệ số TH-01 mới vào dự toán');
                  }}
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-[11px] font-bold cursor-pointer"
                >
                  Áp dụng hệ số
                </button>
              </div>
            </div>
          )}

          {/* Sub-Tabs selector - Responsive scrollable bar */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('th01')}
              className={`shrink-0 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'th01'
                  ? 'bg-white text-sky-900 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>TH-01 <span className="hidden sm:inline">(Tổng Hợp)</span></span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pl1')}
              className={`shrink-0 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pl1'
                  ? 'bg-white text-sky-900 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>PL 1 & 2 <span className="hidden sm:inline">(Sửa/Xóa ĐM 16)</span> ({tasks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pl_extras')}
              className={`shrink-0 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pl_extras'
                  ? 'bg-white text-sky-900 shadow-xs font-bold border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>PL 4, 5, 6 <span className="hidden sm:inline">(Vận chuyển, Khảo sát)</span></span>
            </button>
          </div>

          {/* TAB 1: PHỤ LỤC TH-01: BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ HOTLINE */}
          {activeTab === 'th01' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200 pb-2">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5 flex-wrap">
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>Phụ lục TH-01: Bảng tổng hợp dự toán chi phí Hotline</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditingParams(!isEditingParams)}
                    className="text-[10px] text-sky-700 hover:text-sky-900 font-semibold underline flex items-center gap-1 cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3 h-3 shrink-0" />
                    <span>Sửa hệ số bảng</span>
                  </button>
                  <span className="text-slate-400 italic">Đơn vị: VN đồng</span>
                </div>
              </div>

              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-950 text-[11px] flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Để <strong>Sửa</strong> (đơn giá, khối lượng, hệ số) hoặc <strong>Xóa</strong> công tác, bấm nút ở cột <strong>Thao tác (Sửa / Xóa)</strong> bên phải của từng dòng.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-2.5 py-0.5 bg-sky-600 hover:bg-sky-700 text-white rounded font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs ml-auto"
                >
                  <Plus className="w-3 h-3" /> Thêm công tác mới
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-[11px] text-left min-w-[540px]">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 w-12 text-center">STT</th>
                      <th className="py-2 px-2.5">Khoản mục chi phí</th>
                      <th className="py-2 px-2 text-center w-16">Ký hiệu</th>
                      <th className="py-2 px-2.5">Cách tính</th>
                      <th className="py-2 px-2.5 text-right font-mono w-32">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr className="bg-sky-50/60 font-bold">
                      <td className="py-1.5 px-2.5 text-center">I</td>
                      <td className="py-1.5 px-2.5 text-sky-950 font-sans">CHI PHÍ TRỰC TIẾP</td>
                      <td className="py-1.5 px-2 text-center">T</td>
                      <td className="py-1.5 px-2.5 text-sky-900 font-sans">VL + NC + M</td>
                      <td className="py-1.5 px-2.5 text-right text-sky-950 font-black">
                        {formatVnd(currentBreakdown.directCost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2.5 text-center text-slate-500">1</td>
                      <td className="py-1 px-2.5 pl-6 font-sans text-slate-700">Chi phí vật liệu (VL1 + VL2)</td>
                      <td className="py-1 px-2 text-center text-slate-600">VL</td>
                      <td className="py-1 px-2.5 font-sans text-slate-600">Phụ lục 1</td>
                      <td className="py-1 px-2.5 text-right text-slate-900">
                        {formatVnd(currentBreakdown.totalMaterialCost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2.5 text-center text-slate-400"></td>
                      <td className="py-1 px-2.5 pl-10 font-sans text-slate-500 italic">Chi phí vật liệu phụ</td>
                      <td className="py-1 px-2 text-center text-slate-400">VL1</td>
                      <td className="py-1 px-2.5 font-sans text-slate-400 italic">Phụ lục 1</td>
                      <td className="py-1 px-2.5 text-right text-slate-600">
                        {formatVnd(currentBreakdown.finalTotalMaterial)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2.5 text-center text-slate-400"></td>
                      <td className="py-1 px-2.5 pl-10 font-sans text-slate-500 italic">Chi phí vật liệu hotline</td>
                      <td className="py-1 px-2 text-center text-slate-400">VL2</td>
                      <td className="py-1 px-2.5 font-sans text-slate-400 italic">Phụ lục 1</td>
                      <td className="py-1 px-2.5 text-right text-slate-600">
                        {formatVnd(currentBreakdown.finalTotalHotline)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2.5 text-center text-slate-500">2</td>
                      <td className="py-1 px-2.5 pl-6 font-sans text-slate-700">Chi phí nhân công</td>
                      <td className="py-1 px-2 text-center text-slate-600">NC</td>
                      <td className="py-1 px-2.5 font-sans text-slate-600">
                        Phụ lục 1 (x Kđt1={currentBreakdown.concurrentLaborMultiplier})
                      </td>
                      <td className="py-1 px-2.5 text-right text-slate-900">
                        {formatVnd(currentBreakdown.finalTotalLabor)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2.5 text-center text-slate-500">3</td>
                      <td className="py-1 px-2.5 pl-6 font-sans text-slate-700">Chi phí máy thi công</td>
                      <td className="py-1 px-2 text-center text-slate-600">M</td>
                      <td className="py-1 px-2.5 font-sans text-slate-600">
                        Phụ lục 1 (x Kđt1={currentBreakdown.concurrentMachineryMultiplier})
                      </td>
                      <td className="py-1 px-2.5 text-right text-slate-900">
                        {formatVnd(currentBreakdown.finalTotalMachinery)}
                      </td>
                    </tr>

                    <tr className="bg-amber-50/50 font-bold">
                      <td className="py-1.5 px-2.5 text-center">II</td>
                      <td className="py-1.5 px-2.5 text-amber-950 font-sans">CHI PHÍ GIÁN TIẾP</td>
                      <td className="py-1.5 px-2 text-center">GT</td>
                      <td className="py-1.5 px-2.5 text-amber-900 font-sans">
                        Chi phí chung C = {(generalExpenseRate * 100).toFixed(0)}% x NC
                      </td>
                      <td className="py-1.5 px-2.5 text-right text-amber-950">
                        {formatVnd(currentBreakdown.totalIndirectCost)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-bold">III</td>
                      <td className="py-1.5 px-2.5 font-bold font-sans text-slate-900">THU NHẬP CHỊU THUẾ TÍNH TRƯỚC</td>
                      <td className="py-1.5 px-2 text-center font-bold">TL</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-600">
                        {(taxableIncomeRate * 100).toFixed(0)}% x (T + GT)
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">
                        {formatVnd(currentBreakdown.taxableIncomeBeforeTax)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-bold">IV</td>
                      <td className="py-1.5 px-2.5 font-bold font-sans text-slate-900">Chi phí vận chuyển</td>
                      <td className="py-1.5 px-2 text-center font-bold">VC</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-600">
                        Phụ lục 4 (3 xe chuyên dùng, cự ly {currentBreakdown.transportDistanceKm}km)
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">
                        {formatVnd(currentBreakdown.totalTransportationCost)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-bold">V</td>
                      <td className="py-1.5 px-2.5 font-bold font-sans text-slate-900">Chi phí khác (rào chắn cảnh giới)</td>
                      <td className="py-1.5 px-2 text-center font-bold">K</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-600">Phụ lục 5 (0.5 ca x bậc 3/7)</td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">
                        {formatVnd(currentBreakdown.totalTrafficSafetyCost)}
                      </td>
                    </tr>

                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td className="py-1.5 px-2.5 text-center">A</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-950">GIÁ TRỊ XÂY DỰNG (TRƯỚC THUẾ)</td>
                      <td className="py-1.5 px-2 text-center">Gxd</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-700">T + GT + TL + VC + K</td>
                      <td className="py-1.5 px-2.5 text-right font-black text-slate-950">
                        {formatVnd(currentBreakdown.constructionValueBeforeTax)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-bold">B</td>
                      <td className="py-1.5 px-2.5 font-bold font-sans text-slate-900">Chi phí khảo sát, lập phương án & chiết tính</td>
                      <td className="py-1.5 px-2 text-center font-bold">Gpa</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-600">
                        Gpa1 (Phụ lục 6) + Gpa2 (2.46% x 0.93 x {isRenovation ? '1.2 x ' : ''}Gxd)
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">
                        {formatVnd(currentBreakdown.totalPlanCost)}
                      </td>
                    </tr>

                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td className="py-1.5 px-2.5 text-center">C</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-950">TỔNG DỰ TOÁN (TRƯỚC THUẾ GTGT)</td>
                      <td className="py-1.5 px-2 text-center">Gtt</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-700">Gxd + Gpa</td>
                      <td className="py-1.5 px-2.5 text-right font-black text-slate-950">
                        {formatVnd(currentBreakdown.totalEstimateBeforeTax)}
                      </td>
                    </tr>

                    <tr>
                      <td className="py-1.5 px-2.5 text-center font-bold text-emerald-800">D</td>
                      <td className="py-1.5 px-2.5 font-bold font-sans text-emerald-950">THUẾ GIÁ TRỊ GIA TĂNG (GTGT)</td>
                      <td className="py-1.5 px-2 text-center font-bold text-emerald-800">GTGT</td>
                      <td className="py-1.5 px-2.5 font-sans text-slate-600">
                        Gtt x {(vatRate * 100).toFixed(0)}%
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-emerald-800">
                        {formatVnd(currentBreakdown.vatAmount)}
                      </td>
                    </tr>

                    <tr className="bg-emerald-50 font-black border-t-2 border-emerald-500">
                      <td className="py-2.5 px-2.5 text-center text-emerald-950">E</td>
                      <td className="py-2.5 px-2.5 font-sans uppercase text-emerald-950 text-xs">TỔNG DỰ TOÁN (SAU THUẾ GTGT)</td>
                      <td className="py-2.5 px-2 text-center text-emerald-950">Gdt</td>
                      <td className="py-2.5 px-2.5 font-sans text-emerald-900">Gtt + GTGT</td>
                      <td className="py-2.5 px-2.5 text-right font-black text-emerald-900 text-sm">
                        {formatVnd(grandTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PHỤ LỤC 1 & 2: CHI TIẾT 4 ĐƠN GIÁ ĐM 16 VÀ HỆ SỐ Kđc, Kđt1 (CÓ CHỈNH SỬA, CẬP NHẬT, XÓA) */}
          {activeTab === 'pl1' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>Phụ lục 1: Bảng chi tiết Vật liệu - Nhân công - MTC công tác Hotline</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 italic">
                    Có tính hệ số điều chỉnh Kđc và hệ số đồng thời Kđt1
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-2 py-0.5 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm công tác</span>
                  </button>
                </div>
              </div>

              {/* Table with EDIT, UPDATE, DELETE column */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-[11px] text-left min-w-[760px]">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-center">
                    <tr>
                      <th className="py-1.5 px-1.5 w-8" rowSpan={2}>Bật</th>
                      <th className="py-1.5 px-2 text-left min-w-[200px]" rowSpan={2}>Mã ĐM & Hạng mục công tác</th>
                      <th className="py-1.5 px-1.5 w-12" rowSpan={2}>ĐVT</th>
                      <th className="py-1.5 px-1.5 w-10" rowSpan={2}>Số CT</th>
                      <th className="py-1.5 px-1.5 w-10" rowSpan={2}>KL</th>
                      <th className="py-1.5 px-2 border-l border-slate-200" colSpan={4}>Thành tiền sau hệ số điều chỉnh Kđc (VNĐ)</th>
                      <th className="py-1.5 px-2 w-28 border-l border-slate-200 text-center font-bold" rowSpan={2}>Thao tác (Sửa / Xóa)</th>
                    </tr>
                    <tr className="bg-slate-100/70 border-t border-slate-200 text-[10px]">
                      <th className="py-1 px-1.5 text-right">VL phụ</th>
                      <th className="py-1 px-1.5 text-right">VL Hotline</th>
                      <th className="py-1 px-1.5 text-right text-blue-900">Nhân công</th>
                      <th className="py-1 px-1.5 text-right text-emerald-900">Máy thi công</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {tasks.map((task) => {
                      const coeffAux = task.positionCoefficients?.auxiliaryMaterial ?? 1.0;
                      const coeffHotline = task.positionCoefficients?.material ?? 1.0;
                      const coeffLabor = task.positionCoefficients?.labor ?? 1.0;
                      const coeffMach = task.positionCoefficients?.machinery ?? 1.0;

                      const finalMat = Math.round((task.quantity || 1) * (task.baseRates?.auxiliaryMaterial || 0) * coeffAux);
                      const finalHotline = Math.round((task.quantity || 1) * (task.baseRates?.hotline || 0) * coeffHotline);
                      const finalLab = Math.round((task.quantity || 1) * (task.baseRates?.labor || 0) * coeffLabor);
                      const finalMach = Math.round((task.quantity || 1) * (task.baseRates?.machinery || 0) * coeffMach);

                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            !task.isSelected ? 'opacity-40 bg-slate-100/50' : ''
                          }`}
                        >
                          <td className="py-1.5 px-1.5 text-center">
                            <input
                              type="checkbox"
                              checked={task.isSelected}
                              onChange={() => handleToggleTask(task.id)}
                              className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                              title="Bật/Tắt tính vào dự toán"
                            />
                          </td>
                          <td className="py-1.5 px-2 font-sans font-medium text-slate-900">
                            <span className="font-mono text-sky-800 font-bold block text-[10px]">
                              {task.code}
                            </span>
                            <span className="line-clamp-2">{task.description || task.name}</span>
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-sans text-slate-600">
                            {task.unit || '1 bộ'}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-bold">
                            {task.taskCount || 1}
                          </td>
                          <td className="py-1.5 px-1.5 text-center font-bold text-sky-950">
                            {task.quantity || 1}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-700 border-l border-slate-200">
                            {formatVnd(finalMat)}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-700">
                            {formatVnd(finalHotline)}
                          </td>
                          <td className="py-1.5 px-2 text-right font-semibold text-blue-900">
                            {formatVnd(finalLab)}{' '}
                            <span className="text-[9px] text-slate-400 font-sans">
                              (x{coeffLabor})
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right font-semibold text-emerald-900">
                            {formatVnd(finalMach)}{' '}
                            <span className="text-[9px] text-slate-400 font-sans">
                              (x{coeffMach})
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center border-l border-slate-200 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingTask({ ...task })}
                                title="Chỉnh sửa công tác & đơn giá"
                                className="px-2 py-0.5 rounded text-sky-800 bg-sky-50 border border-sky-300 hover:bg-sky-100 cursor-pointer transition-colors font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setTaskToDelete(task)}
                                title="Xóa công tác khỏi dự toán"
                                className="px-2 py-0.5 rounded text-rose-800 bg-rose-50 border border-rose-300 hover:bg-rose-100 cursor-pointer transition-colors font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="py-1.5 px-2 font-sans uppercase text-slate-800">
                        A. Tổng cộng trước Kđt1 ({currentBreakdown.tasksCount} công tác):
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono border-l border-slate-200">
                        {formatVnd(currentBreakdown.rawTotalMaterial)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">
                        {formatVnd(currentBreakdown.rawTotalHotline)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-blue-900">
                        {formatVnd(currentBreakdown.rawTotalLabor)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-emerald-900">
                        {formatVnd(currentBreakdown.rawTotalMachinery)}
                      </td>
                      <td className="border-l border-slate-200"></td>
                    </tr>
                    <tr className="bg-amber-50/80 text-amber-950">
                      <td colSpan={5} className="py-1.5 px-2 font-sans">
                        B. Hệ số đồng thời NHÓM (Kđt1):
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono border-l border-amber-200">
                        x 1.00
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">x 1.00</td>
                      <td className="py-1.5 px-2 text-right font-mono font-black">
                        x {currentBreakdown.concurrentLaborMultiplier}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-black">
                        x {currentBreakdown.concurrentMachineryMultiplier}
                      </td>
                      <td className="border-l border-amber-200"></td>
                    </tr>
                    <tr className="bg-sky-50 font-black border-t border-sky-300">
                      <td colSpan={5} className="py-2 px-2 font-sans uppercase text-sky-950">
                        C. Tổng cộng (bao gồm Kđt1):
                      </td>
                      <td className="py-2 px-2 text-right font-mono border-l border-sky-200">
                        {formatVnd(currentBreakdown.finalTotalMaterial)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        {formatVnd(currentBreakdown.finalTotalHotline)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-blue-950">
                        {formatVnd(currentBreakdown.finalTotalLabor)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-emerald-950">
                        {formatVnd(currentBreakdown.finalTotalMachinery)}
                      </td>
                      <td className="border-l border-sky-200"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PHỤ LỤC 4, 5, 6: VẬN CHUYỂN, RÀO CHẮN, KHẢO SÁT */}
          {activeTab === 'pl_extras' && (
            <div className="space-y-4">
              {/* Quick Settings & Edit Banner for PL 4, 5, 6 */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-300 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Cài đặt đơn giá & định mức (Phụ lục 4, 5, 6)</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-semibold">Tùy chỉnh</span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Cho phép sửa đơn giá xăng dầu DO, định mức 3 loại xe, nhân công rào chắn cảnh giới và chi phí khảo sát
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsEditingExtras(!isEditingExtras)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-700"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>{isEditingExtras ? '✕ Đóng bảng sửa' : '✏️ Sửa đơn giá & cài đặt'}</span>
                  </button>

                  {isEditingExtras && (
                    <button
                      type="button"
                      onClick={handleResetExtras}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium cursor-pointer"
                    >
                      ↺ Chuẩn EVN
                    </button>
                  )}
                </div>
              </div>

              {/* Form editing PL 4, 5, 6 parameters */}
              {isEditingExtras && (
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-lg space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Chỉnh sửa đơn giá & định mức xe Hotline, Rào chắn và Khảo sát</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingExtras(false)}
                      className="text-emerald-800 hover:text-emerald-950 p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <label className="text-slate-700 block font-semibold mb-0.5">Đơn giá dầu DO (đ/lít)</label>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={fuelPricePerLiter}
                        onChange={(e) => setFuelPricePerLiter(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-emerald-900"
                      />
                      <span className="text-[9px] text-slate-400">Mặc định: 30.490 đ/lít</span>
                    </div>

                    <div>
                      <label className="text-slate-700 block font-semibold mb-0.5">Cự ly vận chuyển (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={transportDistanceKm}
                        onChange={(e) => setTransportDistanceKm(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-emerald-900"
                      />
                      <span className="text-[9px] text-slate-400">Tính 2 lượt khứ hồi</span>
                    </div>

                    <div>
                      <label className="text-slate-700 block font-semibold mb-0.5">1. Xe chở CN (L/100km)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={workerVehicleQuota}
                        onChange={(e) => setWorkerVehicleQuota(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                      <span className="text-[9px] text-slate-400">Mặc định: 12.5 L/100km</span>
                    </div>

                    <div>
                      <label className="text-slate-700 block font-semibold mb-0.5">2. Xe gàu Hotline (L/100km)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={bucketVehicleQuota}
                        onChange={(e) => setBucketVehicleQuota(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                      <span className="text-[9px] text-slate-400">Mặc định: 16.0 L/100km</span>
                    </div>

                    <div>
                      <label className="text-slate-700 block font-semibold mb-0.5">3. Xe cẩu Hotline (L/100km)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={craneVehicleQuota}
                        onChange={(e) => setCraneVehicleQuota(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                      <span className="text-[9px] text-slate-400">Mặc định: 25.0 L/100km</span>
                    </div>

                    <div>
                      <label className="text-slate-700 block font-semibold mb-0.5">Đơn giá ngày công rào chắn</label>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={trafficSafetyRate}
                        onChange={(e) => setTrafficSafetyRate(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                      <span className="text-[9px] text-slate-400">Bậc 3/7: 298.431 đ</span>
                    </div>

                    <div>
                      <label className="text-slate-700 block font-semibold mb-0.5">Số ca rào chắn cảnh giới</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={trafficSafetyShifts}
                        onChange={(e) => setTrafficSafetyShifts(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                      <span className="text-[9px] text-slate-400">Mặc định: 0.5 ca</span>
                    </div>

                    <div>
                      <label className="text-slate-700 block font-semibold mb-0.5">Nhân công khảo sát Gpa1 (đ)</label>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={surveyLaborCost}
                        onChange={(e) => setSurveyLaborCost(Math.max(0, Number(e.target.value)))}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                      />
                      <span className="text-[9px] text-slate-400">Mặc định: 197.405 đ (0.5 ca)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
                    <button
                      type="button"
                      onClick={handleResetExtras}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded text-xs font-medium cursor-pointer"
                    >
                      Khôi phục mặc định EVN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyOptions?.(currentOptions);
                        setIsEditingExtras(false);
                        showToast('Đã cập nhật đơn giá dầu & định mức xe vào dự toán');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold cursor-pointer shadow-xs"
                    >
                      💾 Áp dụng đơn giá & định mức mới
                    </button>
                  </div>
                </div>
              )}

              {/* Phụ lục 4: Vận chuyển xe Hotline */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 flex-wrap gap-1">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Phụ lục 4: Bảng tính chi phí vận chuyển Hotline (3 loại xe)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-800">
                      Cự ly: {currentBreakdown.transportDistanceKm} km
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingExtras(true)}
                      className="px-2 py-0.5 bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Sửa giá dầu & cự ly</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] min-w-[540px]">
                    <thead className="bg-white text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-1.5 px-2 text-left">Phương tiện chuyên dùng</th>
                        <th className="py-1.5 px-2 text-center">Định mức DO</th>
                        <th className="py-1.5 px-2 text-center">Số chuyến (2 lượt)</th>
                        <th className="py-1.5 px-2 text-right">Đơn giá dầu</th>
                        <th className="py-1.5 px-2 text-right font-mono">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      <tr>
                        <td className="py-1 px-2 font-sans">1. Xe chở công nhân Hotline</td>
                        <td className="py-1 px-2 text-center font-bold text-emerald-900">{workerVehicleQuota.toFixed(1)} L/100km</td>
                        <td className="py-1 px-2 text-center">2 lượt x {currentBreakdown.transportDistanceKm}km</td>
                        <td className="py-1 px-2 text-right font-sans">{formatVnd(fuelPricePerLiter)}/lít</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {formatVnd(currentBreakdown.workerVehicleCost)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 font-sans">2. Xe gàu Hotline cách điện</td>
                        <td className="py-1 px-2 text-center font-bold text-emerald-900">{bucketVehicleQuota.toFixed(1)} L/100km</td>
                        <td className="py-1 px-2 text-center">2 lượt x {currentBreakdown.transportDistanceKm}km</td>
                        <td className="py-1 px-2 text-right font-sans">{formatVnd(fuelPricePerLiter)}/lít</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {formatVnd(currentBreakdown.bucketVehicleCost)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-2 font-sans">3. Xe cẩu / chuyên dùng Hotline</td>
                        <td className="py-1 px-2 text-center font-bold text-emerald-900">{craneVehicleQuota.toFixed(1)} L/100km</td>
                        <td className="py-1 px-2 text-center">2 lượt x {currentBreakdown.transportDistanceKm}km</td>
                        <td className="py-1 px-2 text-right font-sans">{formatVnd(fuelPricePerLiter)}/lít</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {formatVnd(currentBreakdown.craneVehicleCost)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="border-t border-slate-200 font-bold bg-white">
                      <tr>
                        <td colSpan={4} className="py-1.5 px-2 font-sans uppercase">
                          Tổng chi phí vận chuyển VC (Phụ lục 4):
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-800">
                          {formatVnd(currentBreakdown.totalTransportationCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Phụ lục 5 & 6 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-1">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>Phụ lục 5: Rào chắn & Cảnh giới giao thông (K)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingExtras(true)}
                      className="px-1.5 py-0.5 bg-white text-amber-800 hover:bg-amber-50 border border-amber-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">Định mức nhân công:</span>
                    <span className="font-mono">{trafficSafetyShifts} ca x Bậc 3/7 nhóm I</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">Đơn giá ngày công:</span>
                    <span className="font-mono font-bold text-amber-900">{formatVnd(trafficSafetyRate)}/ngày công</span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-slate-200 font-bold text-slate-900">
                    <span>Thành tiền K:</span>
                    <span className="font-mono text-amber-900">
                      {formatVnd(currentBreakdown.totalTrafficSafetyCost)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center justify-between border-b border-slate-200 pb-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-600" />
                      <span>Phụ lục 6: Khảo sát & Lập phương án (Gpa)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingExtras(true)}
                      className="px-1.5 py-0.5 bg-white text-sky-800 hover:bg-sky-50 border border-sky-300 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">Khảo sát hiện trường (Gpa1):</span>
                    <span className="font-mono">
                      {formatVnd(currentBreakdown.totalSurveyCost)}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-600">Lập phương án thi công (Gpa2):</span>
                    <span className="font-mono">
                      {formatVnd(currentBreakdown.planPreparationCost)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-slate-200 font-bold text-slate-900">
                    <span>Tổng chi phí lập PA (Gpa):</span>
                    <span className="font-mono text-sky-900">
                      {formatVnd(currentBreakdown.totalPlanCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Chỉnh sửa công tác (Edit Task Modal) */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-3.5 bg-sky-50 border-b border-sky-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-700" />
                <span className="font-bold text-slate-900 text-sm">
                  Chỉnh sửa công tác: <span className="font-mono text-sky-700">{editingTask.code}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTask} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Tên hạng mục công tác</label>
                <input
                  type="text"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Mô tả công việc hiện trường</label>
                <input
                  type="text"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Đơn vị tính</label>
                  <input
                    type="text"
                    value={editingTask.unit || '1 bộ'}
                    onChange={(e) => setEditingTask({ ...editingTask, unit: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Số công tác (Kđt1)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTask.taskCount || 1}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, taskCount: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Khối lượng (KL)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTask.quantity || 1}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, quantity: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* 4 Base Rates */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wide">
                  Đơn giá cơ sở ĐM 16 (VNĐ)
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-600 block text-[11px]">Vật liệu phụ (Cột 7)</label>
                    <input
                      type="number"
                      value={editingTask.baseRates.auxiliaryMaterial}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          baseRates: {
                            ...editingTask.baseRates,
                            auxiliaryMaterial: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px]">Vật liệu Hotline (Cột 8)</label>
                    <input
                      type="number"
                      value={editingTask.baseRates.hotline}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          baseRates: {
                            ...editingTask.baseRates,
                            hotline: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px] text-blue-900 font-semibold">
                      Nhân công (Cột 9)
                    </label>
                    <input
                      type="number"
                      value={editingTask.baseRates.labor}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          baseRates: {
                            ...editingTask.baseRates,
                            labor: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-blue-950 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px] text-emerald-900 font-semibold">
                      Máy thi công (Cột 10)
                    </label>
                    <input
                      type="number"
                      value={editingTask.baseRates.machinery}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          baseRates: {
                            ...editingTask.baseRates,
                            machinery: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-emerald-950 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Position Coefficients */}
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                <span className="font-bold text-amber-900 text-[11px] block uppercase tracking-wide">
                  Hệ số điều chỉnh Kđc (Phụ lục 2)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-slate-600 block text-[10px]">K VL phụ</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingTask.positionCoefficients.auxiliaryMaterial ?? 1.0}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          positionCoefficients: {
                            ...editingTask.positionCoefficients,
                            auxiliaryMaterial: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[10px]">K VL Hotline</label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingTask.positionCoefficients.material ?? 1.0}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          positionCoefficients: {
                            ...editingTask.positionCoefficients,
                            material: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[10px] text-blue-900 font-bold">
                      K Nhân công
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingTask.positionCoefficients.labor ?? 1.0}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          positionCoefficients: {
                            ...editingTask.positionCoefficients,
                            labor: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-blue-950"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[10px] text-emerald-900 font-bold">
                      K Máy thi công
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={editingTask.positionCoefficients.machinery ?? 1.0}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          positionCoefficients: {
                            ...editingTask.positionCoefficients,
                            machinery: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-emerald-950"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Cập nhật công tác</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm công tác mới (Add New Task Modal) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-3.5 bg-sky-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span className="font-bold text-sm">Thêm công tác mới vào dự toán Hotline</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-sky-100 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewTask} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Preset selection dropdown */}
              <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-200">
                <label className="text-sky-950 font-bold block mb-1">
                  Chọn nhanh từ danh mục mẫu ĐM 16:
                </label>
                <select
                  onChange={(e) => {
                    const preset = PRESET_HOTLINE_TASKS.find((p) => p.code === e.target.value);
                    if (preset) {
                      setNewTaskDraft({ ...preset });
                    }
                  }}
                  className="w-full px-2 py-1.5 bg-white border border-sky-300 rounded font-medium text-slate-800"
                >
                  <option value="">-- Chọn công tác mẫu chuẩn ĐM 16 --</option>
                  {PRESET_HOTLINE_TASKS.map((p) => (
                    <option key={p.code} value={p.code}>
                      [{p.code}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Mã ĐM</label>
                  <input
                    type="text"
                    value={newTaskDraft.code}
                    onChange={(e) => setNewTaskDraft({ ...newTaskDraft, code: e.target.value })}
                    required
                    placeholder="VD: 16.01.01-1"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Tên hạng mục</label>
                  <input
                    type="text"
                    value={newTaskDraft.name}
                    onChange={(e) => setNewTaskDraft({ ...newTaskDraft, name: e.target.value })}
                    required
                    placeholder="Tên công việc..."
                    className="w-full px-2 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Đơn vị</label>
                  <input
                    type="text"
                    value={newTaskDraft.unit || '1 bộ'}
                    onChange={(e) => setNewTaskDraft({ ...newTaskDraft, unit: e.target.value })}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Số công tác</label>
                  <input
                    type="number"
                    min="1"
                    value={newTaskDraft.taskCount || 1}
                    onChange={(e) =>
                      setNewTaskDraft({ ...newTaskDraft, taskCount: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Khối lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={newTaskDraft.quantity || 1}
                    onChange={(e) =>
                      setNewTaskDraft({ ...newTaskDraft, quantity: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* 4 Base Rates */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-[11px] block uppercase tracking-wide">
                  Đơn giá cơ sở ĐM 16 (VNĐ)
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-600 block text-[11px]">Vật liệu phụ (Cột 7)</label>
                    <input
                      type="number"
                      value={newTaskDraft.baseRates.auxiliaryMaterial}
                      onChange={(e) =>
                        setNewTaskDraft({
                          ...newTaskDraft,
                          baseRates: {
                            ...newTaskDraft.baseRates,
                            auxiliaryMaterial: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px]">Vật liệu Hotline (Cột 8)</label>
                    <input
                      type="number"
                      value={newTaskDraft.baseRates.hotline}
                      onChange={(e) =>
                        setNewTaskDraft({
                          ...newTaskDraft,
                          baseRates: {
                            ...newTaskDraft.baseRates,
                            hotline: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px] text-blue-900 font-semibold">
                      Nhân công (Cột 9)
                    </label>
                    <input
                      type="number"
                      value={newTaskDraft.baseRates.labor}
                      onChange={(e) =>
                        setNewTaskDraft({
                          ...newTaskDraft,
                          baseRates: {
                            ...newTaskDraft.baseRates,
                            labor: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-blue-950 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block text-[11px] text-emerald-900 font-semibold">
                      Máy thi công (Cột 10)
                    </label>
                    <input
                      type="number"
                      value={newTaskDraft.baseRates.machinery}
                      onChange={(e) =>
                        setNewTaskDraft({
                          ...newTaskDraft,
                          baseRates: {
                            ...newTaskDraft.baseRates,
                            machinery: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-emerald-950 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm vào bảng dự toán</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Xác nhận xóa công tác (Confirm Delete Modal) */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 rounded-full bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Xác nhận xóa công tác</h3>
            </div>

            <p className="text-slate-600 text-xs">
              Bạn có chắc chắn muốn xóa công tác{' '}
              <strong className="font-mono text-slate-900">[{taskToDelete.code}]</strong>{' '}
              <span className="font-medium text-slate-800">{taskToDelete.name}</span> khỏi bảng tính
              dự toán không?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-3 py-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer text-xs flex items-center gap-1 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa công tác</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
