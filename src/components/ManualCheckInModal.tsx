import React, { useState, useEffect, useRef } from 'react';
import {
  CrossarmOption,
  CrossarmType,
  ElectricPole,
  EstimateOptions,
  MaintenanceRates,
  MaintenanceTask,
  PolePositionData,
  PoleStatus,
  PoleStructure,
  StructureOption,
  TaskCondition,
  VoltageLevel,
  WorkplaceDepot,
} from '../types/pole';
import {
  aggregateMultiPositionEstimates,
  calculateDistanceKm,
  calculateEVNMultiTaskCost,
  computeTaskCoefficients,
  formatKm,
  formatVnd,
  getTaskBaseRates,
} from '../utils/calculations';
import { validCoordinates } from '../utils/storage';
import {
  createDefaultTasksForPole,
  DEFAULT_CONDITIONS_16_01_01_1,
  DEFAULT_EVN_TASKS_TEMPLATE,
  getCrossarmOptions,
  getQuickInsulatorCounts,
  getStructureOptions,
} from '../data/seedData';
import { TaskConditionFilterModal } from './TaskConditionFilterModal';
import { OfficialEstimateSummaryTable } from './OfficialEstimateSummaryTable';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Edit2,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

interface ManualCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  depot: WorkplaceDepot;
  rates: MaintenanceRates;
  onUpdateRates?: (newRates: MaintenanceRates) => void;
  onSavePole: (pole: Omit<ElectricPole, 'id' | 'createdAt'>) => void;
  initialCoords?: { lat: number; lng: number; address?: string };
}

type SectionKey = 'sec1' | 'sec2' | 'sec3' | 'sec4';

export const ManualCheckInModal: React.FC<ManualCheckInModalProps> = ({
  isOpen,
  onClose,
  depot,
  rates,
  onUpdateRates,
  onSavePole,
  initialCoords,
}) => {
  // Multi-position state: 20 positions
  const [positions, setPositions] = useState<PolePositionData[]>(() => {
    return Array.from({ length: 20 }, (_, idx) => {
      const isFirst = idx === 0;
      return {
        id: `pos-${idx + 1}`,
        positionIndex: idx + 1,
        poleCode: isFirst ? '73/8A' : '',
        name: isFirst ? 'Trụ 73/8A tuyến 472TN' : '',
        address: isFirst
          ? initialCoords?.address || 'Đường Nguyễn Văn Rốp, phường Tân Ninh, tỉnh Tây Ninh'
          : '',
        lat: isFirst
          ? initialCoords?.lat ?? Number((depot.lat + 0.008).toFixed(5))
          : Number((depot.lat + 0.005 + idx * 0.003).toFixed(5)),
        lng: isFirst
          ? initialCoords?.lng ?? Number((depot.lng + 0.006).toFixed(5))
          : Number((depot.lng + 0.004 + idx * 0.002).toFixed(5)),
        distanceKm: isFirst ? 1.2 : Number((1.2 + idx * 0.5).toFixed(1)),
        voltageLevel: '22kV',
        insulatorCount: 6,
        crossarmType: 'balanced',
        crossarmDescription: '',
        poleStructure: 'single',
        status: 'needs_maintenance',
        notes: '',
        tasks: createDefaultTasksForPole(),
        isFilled: isFirst,
      };
    });
  });

  const [activePosIndex, setActivePosIndex] = useState<number>(1);
  const activePos = positions[activePosIndex - 1] || positions[0];

  // Section custom titles (Editable by user)
  const [sectionTitles, setSectionTitles] = useState<Record<SectionKey, string>>({
    sec1: '1. ĐỊNH DANH & TỌA ĐỘ VỊ TRÍ TRỤ ĐIỆN',
    sec2: '2. ĐẶC ĐIỂM KỸ THUẬT TRỤ (CẤP ÁP, SỐ SỨ, CÂY ĐÀ, CỘT)',
    sec3: '3. DANH MỤC CÔNG TÁC BẢO TRÌ ÁP DỤNG TẠI TRỤ',
    sec4: '4. BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ THI CÔNG HOTLINE',
  });
  const [editingTitleKey, setEditingTitleKey] = useState<SectionKey | null>(null);
  const [tempTitleVal, setTempTitleVal] = useState<string>('');

  // Section order (Draggable / movable up & down)
  const [sectionOrder, setSectionOrder] = useState<SectionKey[]>([
    'sec1',
    'sec2',
    'sec3',
    'sec4',
  ]);

  // Estimate options (VAT from 0-15%, renovation K=1.2 or 1.0)
  const [estimateOptions, setEstimateOptions] = useState<EstimateOptions>({
    vatRate: 0.08,
    isRenovation: false,
  });

  // Condition filter modal state
  const [filterModalTaskId, setFilterModalTaskId] = useState<string | null>(null);

  // Task catalog search / filter in Section 3
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskFilterCategory, setTaskFilterCategory] = useState<'all' | 'selected' | 'insulator' | 'clamp' | 'crossarm'>('all');

  // GPS locating state
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Success / Error Toast notification banner
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type?: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);
  const toastTimerRef = useRef<any>(null);

  const triggerToast = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ text, type });
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Confirmation Modal Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    details?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary' | 'success';
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  const askConfirmation = (opts: {
    title: string;
    message: string;
    details?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary' | 'success';
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      details: opts.details,
      confirmLabel: opts.confirmLabel || 'Đồng ý thực hiện',
      cancelLabel: opts.cancelLabel || 'Hủy bỏ',
      variant: opts.variant || 'primary',
      onConfirm: () => {
        setConfirmDialog(null);
        opts.onConfirm();
      },
      onCancel: () => {
        setConfirmDialog(null);
        if (opts.onCancel) opts.onCancel();
        else triggerToast('Đã hủy thao tác.', 'info');
      },
    });
  };

  // Section 2 Category Titles custom state
  const [categoryTitles, setCategoryTitles] = useState<Record<string, string>>(() => {
    return rates.section2CategoryTitles || {
      voltage: 'Cấp điện áp đường dây:',
      insulator: 'Số lượng cục sứ:',
      crossarm: 'Cây đà lắp đặt:',
      structure: 'Kết cấu thân trụ:',
    };
  });
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [tempCategoryVal, setTempCategoryVal] = useState<string>('');

  // Inline forms states for Section 2 (Voltage, Crossarm, Structure, Insulator)
  const [isAddingVoltage, setIsAddingVoltage] = useState(false);
  const [newVoltageName, setNewVoltageName] = useState('');
  const [newVoltageCost, setNewVoltageCost] = useState(250000);
  const [editingVoltageKey, setEditingVoltageKey] = useState<string | null>(null);
  const [editVoltageCost, setEditVoltageCost] = useState(220000);

  // Crossarm Add / Edit states
  const [isAddingCrossarm, setIsAddingCrossarm] = useState(false);
  const [editingCrossarmId, setEditingCrossarmId] = useState<string | null>(null);
  const [crossarmFormLabel, setCrossarmFormLabel] = useState('');
  const [crossarmFormSublabel, setCrossarmFormSublabel] = useState('');
  const [crossarmFormMultiplier, setCrossarmFormMultiplier] = useState(1.0);

  // Structure Add / Edit states
  const [isAddingStructure, setIsAddingStructure] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);
  const [structureFormLabel, setStructureFormLabel] = useState('');
  const [structureFormSublabel, setStructureFormSublabel] = useState('');
  const [structureFormMultiplier, setStructureFormMultiplier] = useState(1.0);

  // Quick Insulators Add state
  const [isAddingInsulatorCount, setIsAddingInsulatorCount] = useState(false);
  const [newInsulatorCount, setNewInsulatorCount] = useState(15);

  // Custom Technical Categories
  const [customCategories, setCustomCategories] = useState<Array<{
    id: string;
    name: string;
    options: Array<{ id: string; label: string; sublabel?: string; multiplier?: number }>;
  }>>(() => rates.customTechnicalCategories || []);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [newCustomCatName, setNewCustomCatName] = useState('');
  const [editingCustomCatId, setEditingCustomCatId] = useState<string | null>(null);
  const [tempCustomCatName, setTempCustomCatName] = useState('');
  const [addingOptionToCatId, setAddingOptionToCatId] = useState<string | null>(null);
  const [newOptLabel, setNewOptLabel] = useState('');
  const [newOptSublabel, setNewOptSublabel] = useState('');
  const [newOptMult, setNewOptMult] = useState(1.0);
  const [selectedCustomOptions, setSelectedCustomOptions] = useState<Record<string, string>>({});

  // In-line Task adding & editing drawer in Section 3
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskFormCode, setTaskFormCode] = useState('');
  const [taskFormName, setTaskFormName] = useState('');
  const [taskFormUnit, setTaskFormUnit] = useState('1 bộ');
  const [taskFormQuantity, setTaskFormQuantity] = useState(1);
  const [taskFormAuxMat, setTaskFormAuxMat] = useState(276250);
  const [taskFormHotline, setTaskFormHotline] = useState(155131);
  const [taskFormLabor, setTaskFormLabor] = useState(1237423);
  const [taskFormMachine, setTaskFormMachine] = useState(2920434);
  const [taskFormKnc, setTaskFormKnc] = useState(1.0);
  const [taskFormKmtc, setTaskFormKmtc] = useState(1.0);

  // Sync active position distance whenever lat/lng changes
  useEffect(() => {
    if (activePos && validCoordinates(activePos.lat, activePos.lng)) {
      const d = calculateDistanceKm(depot.lat, depot.lng, activePos.lat, activePos.lng);
      if (Math.abs(d - activePos.distanceKm) > 0.05) {
        updateActivePosition({ distanceKm: d });
      }
    }
  }, [activePos?.lat, activePos?.lng, depot]);

  // Update helper for active position
  const updateActivePosition = (partial: Partial<PolePositionData>) => {
    setPositions((prev) =>
      prev.map((p, idx) => {
        if (idx === activePosIndex - 1) {
          return {
            ...p,
            ...partial,
            isFilled: true,
          };
        }
        return p;
      })
    );
  };

  // Clear current position
  const handleClearCurrentPosition = () => {
    if (window.confirm(`Xóa dữ liệu vị trí ${activePosIndex} và đặt lại về trạng thái trống?`)) {
      setPositions((prev) =>
        prev.map((p, idx) => {
          if (idx === activePosIndex - 1) {
            return {
              ...p,
              poleCode: '',
              name: '',
              address: '',
              isFilled: false,
              tasks: createDefaultTasksForPole().map((t) => ({ ...t, isSelected: false })),
            };
          }
          return p;
        })
      );
      triggerToast(`Đã đặt lại Vị trí ${activePosIndex} về trống thành công!`);
    }
  };

  // Section order moving
  const handleMoveSection = (key: SectionKey, direction: 'up' | 'down') => {
    const idx = sectionOrder.indexOf(key);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectionOrder.length) return;

    const nextOrder = [...sectionOrder];
    const [moved] = nextOrder.splice(idx, 1);
    nextOrder.splice(targetIdx, 0, moved);
    setSectionOrder(nextOrder);
    triggerToast('Đã di chuyển vị trí khung thành công!');
  };

  // Edit section title
  const handleStartEditTitle = (key: SectionKey) => {
    setEditingTitleKey(key);
    setTempTitleVal(sectionTitles[key]);
  };

  const handleSaveSectionTitle = (key: SectionKey) => {
    if (!tempTitleVal.trim()) return;
    setSectionTitles((prev) => ({ ...prev, [key]: tempTitleVal.trim() }));
    setEditingTitleKey(null);
    triggerToast(`Đã đổi tên tiêu đề mục thành công!`);
  };

  // GPS check-in for current position
  const handleGpsCheckIn = () => {
    if (!navigator.geolocation) {
      alert('Thiết bị không hỗ trợ GPS');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`
          );
          if (resp.ok) {
            const data = await resp.json();
            if (data?.display_name) {
              updateActivePosition({
                lat: latitude,
                lng: longitude,
                address: data.display_name.slice(0, 100),
              });
              setIsLocating(false);
              triggerToast('Đã lấy tọa độ GPS và địa chỉ thành công!');
              return;
            }
          }
        } catch {
          // fallback
        }

        updateActivePosition({ lat: latitude, lng: longitude });
        setIsLocating(false);
        triggerToast('Đã lấy tọa độ GPS thành công!');
      },
      (err) => {
        setIsLocating(false);
        alert(`Không thể lấy tọa độ GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Category Titles Handlers in Section 2
  const handleStartEditCategoryTitle = (key: string) => {
    setEditingCategoryKey(key);
    setTempCategoryVal((categoryTitles[key] || '').replace(/:$/, ''));
  };

  const handleSaveCategoryTitle = (key: string) => {
    const rawVal = tempCategoryVal.trim();
    if (!rawVal) {
      triggerToast('Không thành công: Vui lòng nhập tên mục hợp lệ!', 'error');
      return;
    }
    const finalVal = rawVal.endsWith(':') ? rawVal : `${rawVal}:`;
    askConfirmation({
      title: 'Xác nhận đổi tên mục',
      message: `Bạn có muốn đổi tên mục thành "${finalVal}" hay không?`,
      confirmVariant: 'primary',
      onConfirm: () => {
        const nextTitles = {
          ...categoryTitles,
          [key]: finalVal,
        };
        setCategoryTitles(nextTitles);
        onUpdateRates?.({
          ...rates,
          section2CategoryTitles: nextTitles,
        });
        setEditingCategoryKey(null);
        triggerToast(`Thành công: Đã đổi tên mục thành "${finalVal}"!`, 'success');
      },
    });
  };

  // Voltage handlers
  const handleSelectVoltage = (v: string) => {
    updateActivePosition({ voltageLevel: v });
    triggerToast(`Đã chuyển vị trí ${activePosIndex} sang cấp điện áp ${v}!`, 'info');
  };

  const handleConfirmAddVoltage = () => {
    const key = newVoltageName.trim();
    if (!key) {
      triggerToast('Không thành công: Vui lòng nhập tên cấp điện áp (ví dụ: 12,7kV)!', 'error');
      return;
    }
    const cost = Math.max(0, newVoltageCost || 0);
    askConfirmation({
      title: 'Xác nhận thêm mới cấp điện áp',
      message: `Bạn có muốn thêm mới cấp điện áp "${key}" với đơn giá định mức ${formatVnd(cost)} hay không?`,
      confirmVariant: 'success',
      onConfirm: () => {
        const updatedRates: MaintenanceRates = {
          ...rates,
          baseCostByVoltage: {
            ...rates.baseCostByVoltage,
            [key]: cost,
          },
        };
        onUpdateRates?.(updatedRates);
        handleSelectVoltage(key);
        setNewVoltageName('');
        setIsAddingVoltage(false);
        triggerToast(`Thành công: Đã thêm mới cấp điện áp "${key}" thành công!`, 'success');
      },
    });
  };

  const handleOpenEditVoltage = (v: string) => {
    setEditingVoltageKey(v);
    setEditVoltageCost(rates.baseCostByVoltage[v] ?? 220000);
  };

  const handleSaveEditVoltage = () => {
    if (!editingVoltageKey) return;
    const cost = Math.max(0, editVoltageCost || 0);
    askConfirmation({
      title: 'Xác nhận cập nhật cấp điện áp',
      message: `Bạn có muốn cập nhật đơn giá cấp điện áp "${editingVoltageKey}" thành ${formatVnd(cost)} hay không?`,
      confirmVariant: 'primary',
      onConfirm: () => {
        const updatedRates: MaintenanceRates = {
          ...rates,
          baseCostByVoltage: {
            ...rates.baseCostByVoltage,
            [editingVoltageKey]: cost,
          },
        };
        onUpdateRates?.(updatedRates);
        setEditingVoltageKey(null);
        triggerToast(`Thành công: Đã cập nhật đơn giá cấp điện áp "${editingVoltageKey}"!`, 'success');
      },
    });
  };

  const handleDeleteVoltage = (key: string) => {
    const keys = Object.keys(rates.baseCostByVoltage);
    if (keys.length <= 1) {
      triggerToast('Không thành công: Hệ thống phải duy trì ít nhất 1 cấp điện áp!', 'error');
      return;
    }
    const fallbackKey = keys.find((k) => k !== key) || keys[0];
    askConfirmation({
      title: 'Xác nhận xóa cấp điện áp',
      message: `Bạn có chắc chắn muốn xóa cấp điện áp "${key}" hay không?`,
      details: `Các vị trí đang chọn "${key}" sẽ tự động chuyển sang "${fallbackKey}" để không bị gián đoạn tính toán.`,
      confirmVariant: 'danger',
      confirmLabel: 'Xóa cấp áp',
      onConfirm: () => {
        const nextBaseCosts = { ...rates.baseCostByVoltage };
        delete nextBaseCosts[key];
        const updatedRates: MaintenanceRates = {
          ...rates,
          baseCostByVoltage: nextBaseCosts,
        };
        onUpdateRates?.(updatedRates);
        setPositions((prev) =>
          prev.map((p) =>
            p.voltageLevel === key ? { ...p, voltageLevel: fallbackKey } : p
          )
        );
        triggerToast(`Thành công: Đã xóa cấp điện áp "${key}" và bảo toàn liên kết dữ liệu!`, 'success');
      },
    });
  };

  // Crossarm CRUD Handlers
  const handleOpenAddCrossarm = () => {
    setEditingCrossarmId(null);
    setCrossarmFormLabel('');
    setCrossarmFormSublabel('');
    setCrossarmFormMultiplier(1.2);
    setIsAddingCrossarm(true);
  };

  const handleOpenEditCrossarm = (arm: CrossarmOption) => {
    setEditingCrossarmId(arm.id);
    setCrossarmFormLabel(arm.label);
    setCrossarmFormSublabel(arm.sublabel || '');
    setCrossarmFormMultiplier(arm.multiplier);
    setIsAddingCrossarm(true);
  };

  const handleSaveCrossarm = () => {
    const label = crossarmFormLabel.trim();
    if (!label) {
      triggerToast('Không thành công: Vui lòng nhập tên loại cây đà!', 'error');
      return;
    }
    const mult = Math.max(0.1, Number(crossarmFormMultiplier) || 1.0);
    const sublabel = crossarmFormSublabel.trim();
    const currentCrossarms = getCrossarmOptions(rates);

    if (editingCrossarmId) {
      askConfirmation({
        title: 'Xác nhận cập nhật loại cây đà',
        message: `Bạn có muốn cập nhật thông tin loại cây đà "${label}" (Hệ số: ${mult}) hay không?`,
        details: 'Dữ liệu mới sẽ tự động đồng bộ và áp dụng cho tất cả các vị trí đang chọn loại đà này.',
        confirmVariant: 'primary',
        onConfirm: () => {
          const nextCrossarms = currentCrossarms.map((arm) =>
            arm.id === editingCrossarmId
              ? { ...arm, label, sublabel, multiplier: mult }
              : arm
          );
          const updatedRates: MaintenanceRates = {
            ...rates,
            crossarmOptions: nextCrossarms,
          };
          onUpdateRates?.(updatedRates);
          setIsAddingCrossarm(false);
          setEditingCrossarmId(null);
          triggerToast(`Thành công: Đã cập nhật loại cây đà "${label}" và đồng bộ toàn bộ dự toán!`, 'success');
        },
      });
    } else {
      askConfirmation({
        title: 'Xác nhận thêm mới loại cây đà',
        message: `Bạn có muốn thêm mới loại cây đà "${label}" (Hệ số: ${mult}) hay không?`,
        details: 'Loại cây đà mới sẽ sẵn sàng áp dụng cho tất cả 20 vị trí trụ.',
        confirmVariant: 'success',
        onConfirm: () => {
          const newId = `crossarm_${Date.now()}`;
          const newArm: CrossarmOption = {
            id: newId,
            label,
            sublabel: sublabel || 'Tùy chỉnh bổ sung',
            multiplier: mult,
          };
          const nextCrossarms = [...currentCrossarms, newArm];
          const updatedRates: MaintenanceRates = {
            ...rates,
            crossarmOptions: nextCrossarms,
          };
          onUpdateRates?.(updatedRates);
          updateActivePosition({ crossarmType: newId });
          setIsAddingCrossarm(false);
          setEditingCrossarmId(null);
          triggerToast(`Thành công: Đã thêm mới loại cây đà "${label}" thành công!`, 'success');
        },
      });
    }
  };

  const handleDeleteCrossarm = (armId: string, armLabel: string) => {
    const currentCrossarms = getCrossarmOptions(rates);
    if (currentCrossarms.length <= 1) {
      triggerToast('Không thành công: Cần duy trì ít nhất 1 loại cây đà trong hệ thống!', 'error');
      return;
    }
    const fallbackArm = currentCrossarms.find((c) => c.id !== armId) || currentCrossarms[0];
    askConfirmation({
      title: 'Xác nhận xóa loại cây đà',
      message: `Bạn có chắc chắn muốn xóa loại cây đà "${armLabel}" hay không?`,
      details: `Nếu có vị trí đang chọn "${armLabel}", hệ thống sẽ tự động chuyển sang "${fallbackArm.label}" để liên kết không bị lỗi hay đứt gãy.`,
      confirmVariant: 'danger',
      confirmLabel: 'Xóa cây đà',
      onConfirm: () => {
        const nextCrossarms = currentCrossarms.filter((c) => c.id !== armId);
        const updatedRates: MaintenanceRates = {
          ...rates,
          crossarmOptions: nextCrossarms,
        };
        onUpdateRates?.(updatedRates);
        setPositions((prev) =>
          prev.map((p) =>
            p.crossarmType === armId ? { ...p, crossarmType: fallbackArm.id } : p
          )
        );
        triggerToast(`Thành công: Đã xóa loại cây đà "${armLabel}" và bảo toàn liên kết dữ liệu!`, 'success');
      },
    });
  };

  // Structure CRUD Handlers
  const handleOpenAddStructure = () => {
    setEditingStructureId(null);
    setStructureFormLabel('');
    setStructureFormSublabel('');
    setStructureFormMultiplier(1.3);
    setIsAddingStructure(true);
  };

  const handleOpenEditStructure = (st: StructureOption) => {
    setEditingStructureId(st.id);
    setStructureFormLabel(st.label);
    setStructureFormSublabel(st.sublabel || '');
    setStructureFormMultiplier(st.multiplier);
    setIsAddingStructure(true);
  };

  const handleSaveStructure = () => {
    const label = structureFormLabel.trim();
    if (!label) {
      triggerToast('Không thành công: Vui lòng nhập tên kết cấu thân trụ!', 'error');
      return;
    }
    const mult = Math.max(0.1, Number(structureFormMultiplier) || 1.0);
    const sublabel = structureFormSublabel.trim();
    const currentStructures = getStructureOptions(rates);

    if (editingStructureId) {
      askConfirmation({
        title: 'Xác nhận cập nhật kết cấu thân trụ',
        message: `Bạn có muốn cập nhật kết cấu thân trụ "${label}" (Hệ số: ${mult}) hay không?`,
        details: 'Dữ liệu mới sẽ tự động liên kết và áp dụng cho toàn bộ dự toán.',
        confirmVariant: 'primary',
        onConfirm: () => {
          const nextStructures = currentStructures.map((st) =>
            st.id === editingStructureId
              ? { ...st, label, sublabel, multiplier: mult }
              : st
          );
          const updatedRates: MaintenanceRates = {
            ...rates,
            structureOptions: nextStructures,
          };
          onUpdateRates?.(updatedRates);
          setIsAddingStructure(false);
          setEditingStructureId(null);
          triggerToast(`Thành công: Đã cập nhật kết cấu thân trụ "${label}" thành công!`, 'success');
        },
      });
    } else {
      askConfirmation({
        title: 'Xác nhận thêm mới kết cấu thân trụ',
        message: `Bạn có muốn thêm mới kết cấu thân trụ "${label}" (Hệ số: ${mult}) hay không?`,
        details: 'Kết cấu trụ mới sẽ sẵn sàng sử dụng cho tất cả các vị trí.',
        confirmVariant: 'success',
        onConfirm: () => {
          const newId = `structure_${Date.now()}`;
          const newSt: StructureOption = {
            id: newId,
            label,
            sublabel: sublabel || 'Tùy chỉnh bổ sung',
            multiplier: mult,
          };
          const nextStructures = [...currentStructures, newSt];
          const updatedRates: MaintenanceRates = {
            ...rates,
            structureOptions: nextStructures,
          };
          onUpdateRates?.(updatedRates);
          updateActivePosition({ poleStructure: newId });
          setIsAddingStructure(false);
          setEditingStructureId(null);
          triggerToast(`Thành công: Đã thêm mới kết cấu thân trụ "${label}" thành công!`, 'success');
        },
      });
    }
  };

  const handleDeleteStructure = (stId: string, stLabel: string) => {
    const currentStructures = getStructureOptions(rates);
    if (currentStructures.length <= 1) {
      triggerToast('Không thành công: Cần duy trì ít nhất 1 loại kết cấu thân trụ trong hệ thống!', 'error');
      return;
    }
    const fallbackSt = currentStructures.find((s) => s.id !== stId) || currentStructures[0];
    askConfirmation({
      title: 'Xác nhận xóa kết cấu thân trụ',
      message: `Bạn có chắc chắn muốn xóa kết cấu thân trụ "${stLabel}" hay không?`,
      details: `Nếu có vị trí đang chọn "${stLabel}", hệ thống sẽ tự động chuyển sang "${fallbackSt.label}" để bảo toàn cấu trúc tính toán.`,
      confirmVariant: 'danger',
      confirmLabel: 'Xóa kết cấu',
      onConfirm: () => {
        const nextStructures = currentStructures.filter((s) => s.id !== stId);
        const updatedRates: MaintenanceRates = {
          ...rates,
          structureOptions: nextStructures,
        };
        onUpdateRates?.(updatedRates);
        setPositions((prev) =>
          prev.map((p) =>
            p.poleStructure === stId ? { ...p, poleStructure: fallbackSt.id } : p
          )
        );
        triggerToast(`Thành công: Đã xóa kết cấu thân trụ "${stLabel}" và bảo toàn liên kết dữ liệu!`, 'success');
      },
    });
  };

  // Quick Insulator Counts Handlers
  const handleAddInsulatorCount = () => {
    const cnt = parseInt(String(newInsulatorCount), 10);
    if (isNaN(cnt) || cnt <= 0) {
      triggerToast('Không thành công: Vui lòng nhập số lượng cục sứ hợp lệ (> 0)!', 'error');
      return;
    }
    const currentCounts = getQuickInsulatorCounts(rates);
    if (currentCounts.includes(cnt)) {
      triggerToast(`Thông báo: Mốc ${cnt} sứ đã có trong danh sách!`, 'info');
      setIsAddingInsulatorCount(false);
      return;
    }
    askConfirmation({
      title: 'Xác nhận thêm mốc số lượng sứ',
      message: `Bạn có muốn thêm nút chọn nhanh "${cnt} sứ" vào danh sách hay không?`,
      confirmVariant: 'success',
      onConfirm: () => {
        const nextCounts = [...currentCounts, cnt].sort((a, b) => a - b);
        onUpdateRates?.({
          ...rates,
          quickInsulatorCounts: nextCounts,
        });
        setIsAddingInsulatorCount(false);
        triggerToast(`Thành công: Đã thêm nút chọn nhanh "${cnt} sứ"!`, 'success');
      },
    });
  };

  const handleDeleteInsulatorCount = (cnt: number) => {
    const currentCounts = getQuickInsulatorCounts(rates);
    if (currentCounts.length <= 1) {
      triggerToast('Không thành công: Cần duy trì ít nhất 1 mốc số lượng sứ!', 'error');
      return;
    }
    askConfirmation({
      title: 'Xác nhận xóa mốc số lượng sứ',
      message: `Bạn có chắc chắn muốn xóa mốc chọn nhanh "${cnt} sứ" hay không?`,
      confirmVariant: 'danger',
      confirmLabel: 'Xóa mốc',
      onConfirm: () => {
        const nextCounts = currentCounts.filter((c) => c !== cnt);
        onUpdateRates?.({
          ...rates,
          quickInsulatorCounts: nextCounts,
        });
        triggerToast(`Thành công: Đã xóa mốc "${cnt} sứ"!`, 'success');
      },
    });
  };

  // Custom Technical Category Handlers
  const handleAddCustomCategory = () => {
    const name = newCustomCatName.trim();
    if (!name) {
      triggerToast('Không thành công: Vui lòng nhập tên nhóm mục kỹ thuật mới!', 'error');
      return;
    }
    askConfirmation({
      title: 'Xác nhận thêm nhóm kỹ thuật mới',
      message: `Bạn có muốn tạo thêm nhóm mục "${name}" trong đặc điểm kỹ thuật hay không?`,
      confirmVariant: 'success',
      onConfirm: () => {
        const newCat = {
          id: `custom_cat_${Date.now()}`,
          name,
          options: [
            { id: `opt_1`, label: 'LỰA CHỌN 1 (Tiêu chuẩn)', sublabel: 'Hệ số 1.0', multiplier: 1.0 },
            { id: `opt_2`, label: 'LỰA CHỌN 2 (Đặc biệt)', sublabel: 'Hệ số 1.25', multiplier: 1.25 },
          ],
        };
        const nextCats = [...customCategories, newCat];
        setCustomCategories(nextCats);
        onUpdateRates?.({
          ...rates,
          customTechnicalCategories: nextCats,
        });
        setNewCustomCatName('');
        setIsAddingCustomCategory(false);
        triggerToast(`Thành công: Đã thêm mới nhóm đặc tính "${name}"!`, 'success');
      },
    });
  };

  const handleDeleteCustomCategory = (catId: string, catName: string) => {
    askConfirmation({
      title: 'Xác nhận xóa nhóm kỹ thuật',
      message: `Bạn có chắc chắn muốn xóa nhóm mục "${catName}" hay không?`,
      confirmVariant: 'danger',
      confirmLabel: 'Xóa nhóm',
      onConfirm: () => {
        const nextCats = customCategories.filter((c) => c.id !== catId);
        setCustomCategories(nextCats);
        onUpdateRates?.({
          ...rates,
          customTechnicalCategories: nextCats,
        });
        triggerToast(`Thành công: Đã xóa nhóm mục "${catName}"!`, 'success');
      },
    });
  };

  // Task Quantity & Count Direct Modifiers on Card
  const handleUpdateTaskQuantity = (taskId: string, qty: number) => {
    const nextTasks = activePos.tasks.map((t) =>
      t.id === taskId ? { ...t, quantity: Math.max(1, qty), isSelected: true } : t
    );
    updateActivePosition({ tasks: nextTasks });
  };

  const handleUpdateTaskCount = (taskId: string, count: number) => {
    const nextTasks = activePos.tasks.map((t) =>
      t.id === taskId ? { ...t, taskCount: Math.max(1, count), isSelected: true } : t
    );
    updateActivePosition({ tasks: nextTasks });
  };

  const handleToggleTask = (taskId: string) => {
    const nextTasks = activePos.tasks.map((t) =>
      t.id === taskId ? { ...t, isSelected: !t.isSelected } : t
    );
    updateActivePosition({ tasks: nextTasks });
  };

  const handleRemoveConditionFromTask = (taskId: string, condId: string) => {
    const nextTasks = activePos.tasks.map((t) => {
      if (t.id === taskId) {
        const nextIds = (t.selectedConditionIds || []).filter((id) => id !== condId);
        return {
          ...t,
          selectedConditionIds: nextIds,
        };
      }
      return t;
    });
    updateActivePosition({ tasks: nextTasks });
    triggerToast('Đã gỡ bỏ điều kiện khỏi công tác!');
  };

  const handleApplyConditionsFromModal = (
    taskId: string,
    selectedConditionIds: string[],
    customConditions?: TaskCondition[]
  ) => {
    const nextTasks = activePos.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          selectedConditionIds,
          conditions: customConditions || t.conditions,
        };
      }
      return t;
    });
    updateActivePosition({ tasks: nextTasks });
    triggerToast('Đã áp dụng các điều kiện thi công vào công tác thành công!');
  };

  // Inline Task Add/Edit
  const handleOpenAddTask = () => {
    setEditingTaskId(null);
    setTaskFormCode(`16.${Math.floor(10 + Math.random() * 80)}.01-1`);
    setTaskFormName('');
    setTaskFormUnit('1 bộ');
    setTaskFormQuantity(1);
    setTaskFormAuxMat(276250);
    setTaskFormHotline(155131);
    setTaskFormLabor(1237423);
    setTaskFormMachine(2920434);
    setTaskFormKnc(1.0);
    setTaskFormKmtc(1.0);
    setIsAddingTask(true);
  };

  const handleOpenEditTask = (task: MaintenanceTask) => {
    setEditingTaskId(task.id);
    setTaskFormCode(task.code);
    setTaskFormName(task.name);
    setTaskFormUnit(task.unit || '1 bộ');
    setTaskFormQuantity(task.quantity || 1);
    setTaskFormAuxMat(task.baseRates.auxiliaryMaterial);
    setTaskFormHotline(task.baseRates.hotline);
    setTaskFormLabor(task.baseRates.labor);
    setTaskFormMachine(task.baseRates.machinery);
    setTaskFormKnc(task.positionCoefficients.labor || 1.0);
    setTaskFormKmtc(task.positionCoefficients.machinery || 1.0);
    setIsAddingTask(true);
  };

  const handleSaveTaskForm = () => {
    if (!taskFormName.trim() || !taskFormCode.trim()) {
      alert('Vui lòng nhập mã hiệu và tên công tác.');
      return;
    }

    if (editingTaskId) {
      const nextTasks = activePos.tasks.map((t) => {
        if (t.id !== editingTaskId) return t;
        return {
          ...t,
          code: taskFormCode.trim(),
          name: taskFormName.trim(),
          unit: taskFormUnit.trim(),
          quantity: Math.max(1, Number(taskFormQuantity) || 1),
          baseRates: {
            auxiliaryMaterial: Math.max(0, Number(taskFormAuxMat) || 0),
            hotline: Math.max(0, Number(taskFormHotline) || 0),
            labor: Math.max(0, Number(taskFormLabor) || 0),
            machinery: Math.max(0, Number(taskFormMachine) || 0),
          },
          positionCoefficients: {
            ...t.positionCoefficients,
            labor: Math.max(0.1, Number(taskFormKnc) || 1.0),
            machinery: Math.max(0.1, Number(taskFormKmtc) || 1.0),
          },
        };
      });
      updateActivePosition({ tasks: nextTasks });
      triggerToast(`Đã cập nhật công tác "${taskFormName.trim()}" thành công!`);
    } else {
      const newTask: MaintenanceTask = {
        id: `task-custom-${Date.now()}`,
        code: taskFormCode.trim(),
        name: taskFormName.trim(),
        description: taskFormName.trim(),
        unit: taskFormUnit.trim(),
        taskCount: 1,
        quantity: Math.max(1, Number(taskFormQuantity) || 1),
        baseRates: {
          auxiliaryMaterial: Math.max(0, Number(taskFormAuxMat) || 0),
          hotline: Math.max(0, Number(taskFormHotline) || 0),
          labor: Math.max(0, Number(taskFormLabor) || 0),
          machinery: Math.max(0, Number(taskFormMachine) || 0),
        },
        positionCoefficients: {
          auxiliaryMaterial: 1.0,
          material: 1.0,
          labor: Math.max(0.1, Number(taskFormKnc) || 1.0),
          machinery: Math.max(0.1, Number(taskFormKmtc) || 1.0),
        },
        conditions: [...DEFAULT_CONDITIONS_16_01_01_1],
        selectedConditionIds: [],
        isSelected: true,
      };
      updateActivePosition({ tasks: [...activePos.tasks, newTask] });
      triggerToast(`Đã thêm mới công tác "${taskFormName.trim()}" thành công!`);
    }

    setIsAddingTask(false);
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const target = activePos.tasks.find((t) => t.id === taskId);
    if (window.confirm(`Bạn có chắc muốn xóa công tác "${target?.name || taskId}"?`)) {
      const nextTasks = activePos.tasks.filter((t) => t.id !== taskId);
      updateActivePosition({ tasks: nextTasks });
      triggerToast(`Đã xóa công tác "${target?.name || taskId}" thành công!`);
    }
  };

  const handleResetDefaultTasks = () => {
    if (window.confirm('Khôi phục lại 5 công tác bảo trì Hotline chuẩn ĐM 16 cho vị trí này?')) {
      updateActivePosition({ tasks: createDefaultTasksForPole() });
      triggerToast('Đã khôi phục 5 công tác chuẩn ĐM 16 thành công!');
    }
  };

  // Aggregated Multi-Position Calculation
  // If only 1 position is filled, it equals position 1
  // If N positions are filled, it aggregates all N positions
  const aggregatedBreakdown = aggregateMultiPositionEstimates(
    positions,
    rates,
    estimateOptions
  );

  const filledPositions = positions.filter((p) => p.isFilled);
  const filledPositionNames = filledPositions
    .map((p) => (p.poleCode ? `Trụ ${p.poleCode}` : `VT ${p.positionIndex}`))
    .join(', ');

  // Task filtering for Section 3
  const visibleTasks = activePos.tasks.filter((t) => {
    const q = taskSearchQuery.toLowerCase().trim();
    const matchesSearch = !q || t.code.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (taskFilterCategory === 'selected') return t.isSelected;
    if (taskFilterCategory === 'insulator') return t.code.includes('16.01') || t.name.toLowerCase().includes('sứ');
    if (taskFilterCategory === 'clamp') return t.code.includes('16.03') || t.name.toLowerCase().includes('kẹp');
    if (taskFilterCategory === 'crossarm') return t.code.includes('16.09') || t.name.toLowerCase().includes('xà');
    return true;
  });

  // Save pole(s)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activePos.poleCode.trim() && !activePos.name?.trim()) {
      alert('Vui lòng nhập mã số trụ hoặc tên vị trí.');
      return;
    }

    const crossarms = getCrossarmOptions(rates);
    const selectedCrossarm = crossarms.find((c) => c.id === activePos.crossarmType);

    onSavePole({
      code: activePos.poleCode.trim() || `T-${activePos.positionIndex}`,
      name: activePos.name?.trim() || `Trụ ${activePos.poleCode || activePos.positionIndex}`,
      address: activePos.address.trim(),
      lat: activePos.lat,
      lng: activePos.lng,
      distanceFromBaseKm: activePos.distanceKm,
      voltageLevel: activePos.voltageLevel,
      insulatorCount: activePos.insulatorCount,
      crossarmType: activePos.crossarmType,
      crossarmDescription:
        activePos.crossarmDescription?.trim() ||
        (selectedCrossarm ? `${selectedCrossarm.label} (${selectedCrossarm.sublabel || ''})` : 'Cây đà tiêu chuẩn'),
      poleStructure: activePos.poleStructure,
      status: activePos.status || 'needs_maintenance',
      notes: activePos.notes?.trim() || '',
      tasks: activePos.tasks,
      evnCostBreakdown: aggregatedBreakdown,
      estimateOptions,
      maintenanceCostVnd: aggregatedBreakdown.totalEstimatedCost,
    });

    onClose();
  };

  if (!isOpen) return null;

  const crossarms = getCrossarmOptions(rates);
  const structures = getStructureOptions(rates);
  const quickInsulators = getQuickInsulatorCounts(rates);
  const availableVoltages = Object.keys(rates.baseCostByVoltage);

  // Task to be filtered in modal
  const taskForFilterModal = filterModalTaskId
    ? activePos.tasks.find((t) => t.id === filterModalTaskId) || null
    : null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs transition-all duration-150 ${
        isFullscreen ? 'p-0' : 'p-0 sm:p-4'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-slate-100 flex flex-col transition-all duration-200 overflow-hidden ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none shadow-none border-0'
            : 'w-full h-full sm:h-auto sm:max-h-[94vh] max-w-full sm:max-w-5xl lg:max-w-6xl sm:rounded-2xl shadow-2xl border border-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar with Fullscreen & Close Buttons */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="min-w-0 pr-2">
            <div className="text-[10px] sm:text-xs uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span>Thiết Lập Trụ & Dự Toán Định Mức EVN (Đa Vị Trí 1 - 20)</span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate flex items-center gap-2">
              <span>Bảng Dự Toán & Điều Kiện Kỹ Thuật Hotline EVN</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.2 rounded-full font-semibold">
                Đang mở: Vị trí {activePosIndex} {activePos.poleCode ? `(Trụ ${activePos.poleCode})` : ''}
              </span>
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
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- Multi-Position Selector Ribbon (Vị Trí 1 Đến Vị Trí 20) --- */}
        <div className="bg-slate-800 border-b border-slate-700 px-3 sm:px-5 py-2.5 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide shrink-0 hidden md:inline">
            Chọn vị trí trụ:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {positions.map((pos) => {
              const isActive = pos.positionIndex === activePosIndex;
              const hasData = pos.isFilled;

              return (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => setActivePosIndex(pos.positionIndex)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 shadow-md ring-2 ring-sky-300'
                      : hasData
                      ? 'bg-slate-700 text-sky-200 hover:bg-slate-600 border border-sky-400/40'
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
                  }`}
                  title={
                    hasData
                      ? `Vị trí ${pos.positionIndex}: ${pos.poleCode || 'Có dữ liệu'}`
                      : `Vị trí ${pos.positionIndex} (Chưa điền dữ liệu)`
                  }
                >
                  <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span>Vị trí {pos.positionIndex}</span>
                  {pos.poleCode && (
                    <span className="text-[10px] font-mono opacity-85">({pos.poleCode})</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="ml-auto shrink-0 flex items-center gap-2">
            {activePos.isFilled && activePosIndex > 1 && (
              <button
                type="button"
                onClick={handleClearCurrentPosition}
                className="px-2 py-1 text-[11px] bg-rose-950 text-rose-300 hover:bg-rose-900 rounded-lg border border-rose-800 cursor-pointer font-medium"
                title="Xóa dữ liệu vị trí này"
              >
                ✕ Đặt lại trống
              </button>
            )}
          </div>
        </div>

        {/* Success / Error / Info Toast Notification Banner */}
        {toastMessage && (
          <div
            className={`px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold shrink-0 animate-in fade-in slide-in-from-top-2 z-30 transition-all ${
              toastMessage.type === 'error'
                ? 'bg-rose-600 text-white border-b border-rose-700'
                : toastMessage.type === 'info'
                ? 'bg-sky-700 text-white border-b border-sky-800'
                : toastMessage.type === 'warning'
                ? 'bg-amber-600 text-white border-b border-amber-700'
                : 'bg-emerald-600 text-white border-b border-emerald-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-100 shrink-0" />
              ) : toastMessage.type === 'info' ? (
                <Info className="w-4 h-4 text-sky-100 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white p-1 cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Custom Confirmation Modal Dialog ("Có muốn làm hay không") */}
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-300 space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-100 text-rose-600'
                      : confirmDialog.variant === 'success'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {confirmDialog.variant === 'danger' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : confirmDialog.variant === 'success' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <HelpCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {confirmDialog.message}
                  </p>
                  {confirmDialog.details && (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 font-medium leading-relaxed">
                      💡 {confirmDialog.details}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={confirmDialog.onCancel}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {confirmDialog.cancelLabel || 'Hủy bỏ'}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer ${
                    confirmDialog.variant === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : confirmDialog.variant === 'success'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {confirmDialog.confirmLabel || 'Xác nhận thực hiện'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form
          id="manual-checkin-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-4"
        >
          {/* Dynamic Section Ordering */}
          {sectionOrder.map((secKey) => {
            // RENDER SECTION 1: Định danh & Tọa độ
            if (secKey === 'sec1') {
              return (
                <div key="sec1" className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      {editingTitleKey === 'sec1' ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempTitleVal}
                            onChange={(e) => setTempTitleVal(e.target.value)}
                            className="px-2 py-0.5 text-xs bg-white border border-blue-500 rounded font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSectionTitle('sec1')}
                            className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold"
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span>{sectionTitles.sec1}</span>
                          <button
                            type="button"
                            onClick={() => handleStartEditTitle('sec1')}
                            className="text-slate-400 hover:text-blue-600 text-xs cursor-pointer"
                            title="Sửa tên tiêu đề mục 1"
                          >
                            ✏️
                          </button>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSection('sec1', 'up')}
                        className="p-1 text-slate-500 hover:text-slate-800 text-xs"
                        title="Di chuyển lên"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection('sec1', 'down')}
                        className="p-1 text-slate-500 hover:text-slate-800 text-xs"
                        title="Di chuyển xuống"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700">Mã số trụ (Số trụ) *</label>
                        <input
                          type="text"
                          value={activePos.poleCode}
                          onChange={(e) => updateActivePosition({ poleCode: e.target.value })}
                          placeholder="Điền tay hoặc để trống (VD: 73/8A)"
                          className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-700">Tên mô tả vị trí trụ</label>
                        <input
                          type="text"
                          value={activePos.name || ''}
                          onChange={(e) => updateActivePosition({ name: e.target.value })}
                          placeholder="VD: Tuyến 472TN đường Nguyễn Văn Rốp..."
                          className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Địa chỉ chi tiết (Ấp, Xã, Phường, Tỉnh...)
                      </label>
                      <input
                        type="text"
                        value={activePos.address}
                        onChange={(e) => updateActivePosition({ address: e.target.value })}
                        placeholder="VD: Đường Nguyễn Văn Rốp, Phường Tân Ninh, Tỉnh Tây Ninh"
                        className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    {/* GPS Coordinates & Distance */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800">Tọa độ GPS & Cự ly di chuyển:</span>
                        <button
                          type="button"
                          onClick={handleGpsCheckIn}
                          disabled={isLocating}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                          <span>{isLocating ? 'Đang lấy GPS...' : 'Check-in GPS tại đây'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold">Vĩ độ (Lat)</label>
                          <input
                            type="number"
                            step="any"
                            value={activePos.lat}
                            onChange={(e) => updateActivePosition({ lat: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold">Kinh độ (Lng)</label>
                          <input
                            type="number"
                            step="any"
                            value={activePos.lng}
                            onChange={(e) => updateActivePosition({ lng: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 font-semibold">Cự ly từ Đội QLVH (km)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={activePos.distanceKm}
                            onChange={(e) => updateActivePosition({ distanceKm: Math.max(0, parseFloat(e.target.value) || 0) })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-blue-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // RENDER SECTION 2: Đặc điểm kỹ thuật trụ (Cấp áp, số sứ, cây đà, cột)
            if (secKey === 'sec2') {
              return (
                <div key="sec2" className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
                  {/* Section 2 Header */}
                  <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      {editingTitleKey === 'sec2' ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempTitleVal}
                            onChange={(e) => setTempTitleVal(e.target.value)}
                            className="px-2 py-0.5 text-xs bg-white border border-amber-500 rounded font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSectionTitle('sec2')}
                            className="px-2 py-0.5 bg-amber-600 text-white rounded text-xs font-bold"
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span>{sectionTitles.sec2}</span>
                          <button
                            type="button"
                            onClick={() => handleStartEditTitle('sec2')}
                            className="text-slate-400 hover:text-amber-600 text-xs cursor-pointer"
                            title="Sửa tên tiêu đề mục 2"
                          >
                            ✏️
                          </button>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveSection('sec2', 'up')}
                        className="p-1 text-slate-500 hover:text-slate-800 text-xs"
                        title="Di chuyển lên"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection('sec2', 'down')}
                        className="p-1 text-slate-500 hover:text-slate-800 text-xs"
                        title="Di chuyển xuống"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-5">
                    {/* Mục 1: Cấp điện áp đường dây */}
                    <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {editingCategoryKey === 'voltage' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempCategoryVal}
                                onChange={(e) => setTempCategoryVal(e.target.value)}
                                className="px-2 py-0.5 text-xs bg-white border border-blue-500 rounded font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCategoryTitle('voltage')}
                                className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryKey(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[11px] font-bold rounded"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{categoryTitles.voltage || 'Cấp điện áp đường dây:'}</span>
                              <button
                                type="button"
                                onClick={() => handleStartEditCategoryTitle('voltage')}
                                className="text-slate-400 hover:text-blue-600 cursor-pointer"
                                title="Sửa tên mục Cấp điện áp"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                                (2 cấp 22kV và 12,7kV - mỗi cấp định mức có giá khác nhau)
                              </span>
                            </label>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAddingVoltage(!isAddingVoltage)}
                          className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Thêm cấp áp</span>
                        </button>
                      </div>

                      {/* Add new voltage drawer */}
                      {isAddingVoltage && (
                        <div className="p-3 bg-white rounded-xl border border-blue-300 shadow-sm space-y-2 animate-in fade-in">
                          <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-blue-600" />
                            <span>Thêm mới cấp điện áp vào hệ thống:</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              value={newVoltageName}
                              onChange={(e) => setNewVoltageName(e.target.value)}
                              placeholder="Tên cấp áp (vd: 12,7kV, 220kV)"
                              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-bold"
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500 font-semibold">Đơn giá gốc:</span>
                              <input
                                type="number"
                                step="10000"
                                value={newVoltageCost}
                                onChange={(e) => setNewVoltageCost(parseInt(e.target.value, 10) || 0)}
                                className="w-32 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                              />
                              <span className="text-xs text-slate-500">đ</span>
                            </div>
                            <button
                              type="button"
                              onClick={handleConfirmAddVoltage}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
                            >
                              Lưu cấp áp
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingVoltage(false)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Edit existing voltage drawer */}
                      {editingVoltageKey && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 shadow-sm space-y-2 animate-in fade-in">
                          <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Pencil className="w-3.5 h-3.5 text-amber-600" />
                            <span>Chỉnh sửa đơn giá cấp áp: <strong>{editingVoltageKey}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-slate-600 font-medium">Đơn giá định mức:</span>
                            <input
                              type="number"
                              step="5000"
                              value={editVoltageCost}
                              onChange={(e) => setEditVoltageCost(parseInt(e.target.value, 10) || 0)}
                              className="w-36 px-2.5 py-1.5 text-xs bg-white border border-amber-400 rounded-lg font-mono font-bold text-amber-950"
                            />
                            <span className="text-xs text-slate-500">đ</span>
                            <button
                              type="button"
                              onClick={handleSaveEditVoltage}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer"
                            >
                              Lưu cập nhật
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingVoltageKey(null)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Voltage buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {availableVoltages.map((v) => {
                          const isSelected = activePos.voltageLevel === v;
                          const baseCost = rates.baseCostByVoltage[v];
                          return (
                            <div
                              key={v}
                              className={`inline-flex items-center rounded-xl border transition-all ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20'
                                  : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleSelectVoltage(v)}
                                className="px-3 py-1.5 text-xs font-bold cursor-pointer font-mono flex items-center gap-1.5"
                                title={`Chọn cấp áp ${v} (Đơn giá: ${formatVnd(baseCost || 0)})`}
                              >
                                <span>{v}</span>
                                {baseCost !== undefined && (
                                  <span className={`text-[10px] font-normal ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                    ({formatVnd(baseCost)})
                                  </span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditVoltage(v)}
                                className={`px-1 text-xs cursor-pointer ${
                                  isSelected ? 'text-slate-400 hover:text-amber-300' : 'text-slate-400 hover:text-amber-600'
                                }`}
                                title={`Sửa đơn giá cấp áp ${v}`}
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVoltage(v)}
                                className={`pr-2 pl-0.5 cursor-pointer text-xs ${
                                  isSelected ? 'text-slate-400 hover:text-rose-300' : 'text-slate-400 hover:text-rose-500'
                                }`}
                                title={`Xóa cấp áp ${v}`}
                              >
                                &times;
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mục 2: Số lượng cục sứ */}
                    <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          {editingCategoryKey === 'insulator' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempCategoryVal}
                                onChange={(e) => setTempCategoryVal(e.target.value)}
                                className="px-2 py-0.5 text-xs bg-white border border-blue-500 rounded font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCategoryTitle('insulator')}
                                className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryKey(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[11px] font-bold rounded"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{categoryTitles.insulator || 'Số lượng cục sứ:'}</span>
                              <button
                                type="button"
                                onClick={() => handleStartEditCategoryTitle('insulator')}
                                className="text-slate-400 hover:text-blue-600 cursor-pointer"
                                title="Sửa tên mục Số lượng sứ"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </label>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAddingInsulatorCount(!isAddingInsulatorCount)}
                          className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Thêm mốc sứ</span>
                        </button>
                      </div>

                      {/* Add new insulator preset drawer */}
                      {isAddingInsulatorCount && (
                        <div className="p-2.5 bg-white rounded-xl border border-blue-300 shadow-sm flex items-center gap-2 flex-wrap animate-in fade-in">
                          <span className="text-xs text-slate-600 font-medium">Thêm mốc số lượng sứ mới:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={newInsulatorCount}
                            onChange={(e) => setNewInsulatorCount(parseInt(e.target.value, 10) || 1)}
                            className="w-20 px-2 py-1 text-xs bg-slate-50 border border-slate-300 rounded font-mono font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={handleAddInsulatorCount}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow-2xs cursor-pointer"
                          >
                            Lưu mốc sứ
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingInsulatorCount(false)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={activePos.insulatorCount}
                            onChange={(e) =>
                              updateActivePosition({
                                insulatorCount: Math.max(0, parseInt(e.target.value, 10) || 0),
                              })
                            }
                            className="w-20 px-2.5 py-1.5 text-xs bg-white border-2 border-slate-300 rounded-lg text-center font-mono font-bold"
                          />
                          <span className="text-xs text-slate-500 font-medium">cục</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {quickInsulators.map((cnt) => {
                            const isSelected = activePos.insulatorCount === cnt;
                            return (
                              <div
                                key={cnt}
                                className={`inline-flex items-center rounded-lg border font-mono transition-all ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => updateActivePosition({ insulatorCount: cnt })}
                                  className="px-2.5 py-1 text-xs font-semibold cursor-pointer"
                                >
                                  {cnt} sứ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInsulatorCount(cnt)}
                                  className={`pr-1.5 pl-0.5 text-xs cursor-pointer ${
                                    isSelected ? 'text-blue-200 hover:text-white' : 'text-slate-400 hover:text-rose-500'
                                  }`}
                                  title={`Xóa mốc ${cnt} sứ`}
                                >
                                  &times;
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Mục 3 & 4: Cây đà lắp đặt & Kết cấu thân trụ (TÙY CHỈNH ĐẦY ĐỦ THÊM/SỬA/XÓA THEO HÌNH 2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Cột trái: Cây đà lắp đặt */}
                      <div className="space-y-2 bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          {editingCategoryKey === 'crossarm' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempCategoryVal}
                                onChange={(e) => setTempCategoryVal(e.target.value)}
                                className="px-2 py-0.5 text-xs bg-white border border-emerald-500 rounded font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCategoryTitle('crossarm')}
                                className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryKey(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[11px] font-bold rounded"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                              <span>{categoryTitles.crossarm || 'Cây đà lắp đặt:'}</span>
                              <button
                                type="button"
                                onClick={() => handleStartEditCategoryTitle('crossarm')}
                                className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                                title="Sửa tên mục Cây đà"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </label>
                          )}

                          <button
                            type="button"
                            onClick={handleOpenAddCrossarm}
                            className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 bg-white hover:bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Thêm loại đà</span>
                          </button>
                        </div>

                        {/* Drawer Thêm / Sửa Cây đà */}
                        {isAddingCrossarm && (
                          <div className="p-3 bg-white rounded-xl border border-emerald-400 shadow-md space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-900">
                                {editingCrossarmId ? '✏️ Chỉnh sửa loại cây đà' : '➕ Thêm mới loại cây đà'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingCrossarm(false);
                                  setEditingCrossarmId(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 text-xs"
                              >
                                &times;
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="text-[11px] font-semibold text-slate-700 block">Tên loại cây đà *</label>
                                <input
                                  type="text"
                                  value={crossarmFormLabel}
                                  onChange={(e) => setCrossarmFormLabel(e.target.value)}
                                  placeholder="VD: ĐÀ SẮT CHỮ V, ĐÀ COMPOSITE..."
                                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-bold uppercase"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-700 block">Mô tả đặc điểm</label>
                                  <input
                                    type="text"
                                    value={crossarmFormSublabel}
                                    onChange={(e) => setCrossarmFormSublabel(e.target.value)}
                                    placeholder="VD: Néo đôi (+20%)"
                                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-700 block">Hệ số nhân (K)</label>
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="0.1"
                                    value={crossarmFormMultiplier}
                                    onChange={(e) => setCrossarmFormMultiplier(parseFloat(e.target.value) || 1.0)}
                                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono font-bold text-emerald-900"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingCrossarm(false);
                                    setEditingCrossarmId(null);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveCrossarm}
                                  className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-2xs cursor-pointer"
                                >
                                  {editingCrossarmId ? 'Lưu cập nhật' : 'Tạo mới'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Danh sách thẻ Cây đà */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {crossarms.map((arm) => {
                            const isSelected = activePos.crossarmType === arm.id;
                            return (
                              <div
                                key={arm.id}
                                className={`relative p-2.5 rounded-xl border transition-all text-left ${
                                  isSelected
                                    ? 'bg-emerald-100/60 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-500/25 shadow-xs'
                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateActivePosition({ crossarmType: arm.id })}
                                    className="text-left flex-1 cursor-pointer pr-1"
                                  >
                                    <div className="text-xs font-bold uppercase tracking-tight">{arm.label}</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{arm.sublabel || 'Tiêu chuẩn'}</div>
                                    <div className="text-[10px] font-mono font-semibold text-emerald-700 mt-1">
                                      Hệ số: <strong>{arm.multiplier}</strong>
                                    </div>
                                  </button>

                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditCrossarm(arm)}
                                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                                      title={`Sửa loại đà "${arm.label}"`}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCrossarm(arm.id, arm.label)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                      title={`Xóa loại đà "${arm.label}"`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cột phải: Kết cấu thân trụ */}
                      <div className="space-y-2 bg-slate-100/60 p-3.5 rounded-2xl border border-slate-300 shadow-xs">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          {editingCategoryKey === 'structure' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={tempCategoryVal}
                                onChange={(e) => setTempCategoryVal(e.target.value)}
                                className="px-2 py-0.5 text-xs bg-white border border-slate-500 rounded font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveCategoryTitle('structure')}
                                className="px-2 py-0.5 bg-slate-800 text-white text-[11px] font-bold rounded"
                              >
                                Lưu
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCategoryKey(null)}
                                className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[11px] font-bold rounded"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{categoryTitles.structure || 'Kết cấu thân trụ:'}</span>
                              <button
                                type="button"
                                onClick={() => handleStartEditCategoryTitle('structure')}
                                className="text-slate-400 hover:text-slate-800 cursor-pointer"
                                title="Sửa tên mục Kết cấu thân trụ"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </label>
                          )}

                          <button
                            type="button"
                            onClick={handleOpenAddStructure}
                            className="text-[11px] text-slate-800 hover:text-black font-bold flex items-center gap-1 bg-white hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Thêm kết cấu trụ</span>
                          </button>
                        </div>

                        {/* Drawer Thêm / Sửa Kết cấu thân trụ */}
                        {isAddingStructure && (
                          <div className="p-3 bg-white rounded-xl border border-slate-400 shadow-md space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">
                                {editingStructureId ? '✏️ Chỉnh sửa kết cấu thân trụ' : '➕ Thêm mới kết cấu thân trụ'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddingStructure(false);
                                  setEditingStructureId(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 text-xs"
                              >
                                &times;
                              </button>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <label className="text-[11px] font-semibold text-slate-700 block">Tên kết cấu trụ *</label>
                                <input
                                  type="text"
                                  value={structureFormLabel}
                                  onChange={(e) => setStructureFormLabel(e.target.value)}
                                  placeholder="VD: TRỤ BTLT LY TÂM, THÁP SẮT..."
                                  className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-bold uppercase"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-700 block">Mô tả đặc điểm</label>
                                  <input
                                    type="text"
                                    value={structureFormSublabel}
                                    onChange={(e) => setStructureFormSublabel(e.target.value)}
                                    placeholder="VD: Cột chịu lực cao (+40%)"
                                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-700 block">Hệ số nhân (K)</label>
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="0.1"
                                    value={structureFormMultiplier}
                                    onChange={(e) => setStructureFormMultiplier(parseFloat(e.target.value) || 1.0)}
                                    className="w-full mt-0.5 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingStructure(false);
                                    setEditingStructureId(null);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveStructure}
                                  className="px-3.5 py-1 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded shadow-2xs cursor-pointer"
                                >
                                  {editingStructureId ? 'Lưu cập nhật' : 'Tạo mới'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Danh sách thẻ Kết cấu thân trụ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {structures.map((st) => {
                            const isSelected = activePos.poleStructure === st.id;
                            return (
                              <div
                                key={st.id}
                                className={`relative p-2.5 rounded-xl border transition-all text-left ${
                                  isSelected
                                    ? 'bg-slate-900 text-white border-slate-900 font-bold ring-2 ring-slate-900/25 shadow-sm'
                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updateActivePosition({ poleStructure: st.id })}
                                    className="text-left flex-1 cursor-pointer pr-1"
                                  >
                                    <div className="text-xs font-bold uppercase tracking-tight">{st.label}</div>
                                    <div className={`text-[10px] mt-0.5 leading-tight ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                      {st.sublabel || 'Tiêu chuẩn'}
                                    </div>
                                    <div className={`text-[10px] font-mono font-semibold mt-1 ${isSelected ? 'text-amber-300' : 'text-blue-700'}`}>
                                      Hệ số: <strong>{st.multiplier}</strong>
                                    </div>
                                  </button>

                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditStructure(st)}
                                      className={`p-1 rounded cursor-pointer ${
                                        isSelected
                                          ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                                          : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                                      }`}
                                      title={`Sửa kết cấu "${st.label}"`}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteStructure(st.id, st.label)}
                                      className={`p-1 rounded cursor-pointer ${
                                        isSelected
                                          ? 'text-slate-300 hover:text-rose-400 hover:bg-slate-800'
                                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                      }`}
                                      title={`Xóa kết cấu "${st.label}"`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Mục 5: Các nhóm đặc tính kỹ thuật mở rộng tùy biến */}
                    {customCategories.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        {customCategories.map((cat) => (
                          <div key={cat.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">{cat.name}:</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomCategory(cat.id, cat.name)}
                                className="text-slate-400 hover:text-rose-600 text-xs p-1"
                                title={`Xóa nhóm ${cat.name}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {cat.options.map((opt) => {
                                const isSelected = selectedCustomOptions[cat.id] === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setSelectedCustomOptions((prev) => ({ ...prev, [cat.id]: opt.id }))}
                                    className={`p-2 rounded-lg border text-left text-xs ${
                                      isSelected ? 'bg-sky-50 border-sky-500 font-bold text-sky-950' : 'bg-white border-slate-200'
                                    }`}
                                  >
                                    <div>{opt.label}</div>
                                    {opt.sublabel && <div className="text-[10px] text-slate-500">{opt.sublabel}</div>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Nút Thêm nhóm đặc tính kỹ thuật mới */}
                    <div className="pt-1">
                      {isAddingCustomCategory ? (
                        <div className="p-3 bg-sky-50 rounded-xl border border-sky-300 space-y-2 animate-in fade-in">
                          <span className="text-xs font-bold text-sky-950">Tạo nhóm đặc tính kỹ thuật mới:</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              value={newCustomCatName}
                              onChange={(e) => setNewCustomCatName(e.target.value)}
                              placeholder="VD: Địa hình móng trụ, Loại sứ cách điện..."
                              className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-semibold flex-1 min-w-[200px]"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomCategory}
                              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded"
                            >
                              Lưu nhóm mới
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingCustomCategory(false)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomCategory(true)}
                          className="w-full py-2 border-2 border-dashed border-slate-300 hover:border-blue-500 text-slate-600 hover:text-blue-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-50/50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Thêm nhóm đặc tính kỹ thuật mới</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // RENDER SECTION 3: Danh mục công tác & 15 Điều kiện
            if (secKey === 'sec3') {
              return (
                <div key="sec3" className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                      {editingTitleKey === 'sec3' ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={tempTitleVal}
                            onChange={(e) => setTempTitleVal(e.target.value)}
                            className="px-2 py-0.5 text-xs bg-white border border-sky-500 rounded font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSectionTitle('sec3')}
                            className="px-2 py-0.5 bg-sky-600 text-white rounded text-xs font-bold"
                          >
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <span className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                          <span>{sectionTitles.sec3}</span>
                          <button
                            type="button"
                            onClick={() => handleStartEditTitle('sec3')}
                            className="text-slate-400 hover:text-sky-600 text-xs cursor-pointer"
                            title="Sửa tên tiêu đề mục 3"
                          >
                            ✏️
                          </button>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleOpenAddTask}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Thêm công tác</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetDefaultTasks}
                        title="Khôi phục 5 công tác chuẩn ĐM 16"
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection('sec3', 'up')}
                        className="p-1 text-slate-500 hover:text-slate-800 text-xs"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSection('sec3', 'down')}
                        className="p-1 text-slate-500 hover:text-slate-800 text-xs"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Catalog Search & Category Filters (USER REQUEST: Lọc chọn vì có khoảng 68 định mức) */}
                    <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-sky-950 uppercase tracking-wide flex items-center gap-1">
                          <Filter className="w-3.5 h-3.5 text-sky-600" />
                          <span>Lọc chọn định mức (khoảng 68 định mức EVN):</span>
                        </span>
                        <div className="text-[11px] text-slate-500">
                          Đang chọn:{' '}
                          <strong className="text-sky-900">
                            {activePos.tasks.filter((t) => t.isSelected).length}/{activePos.tasks.length}
                          </strong>{' '}
                          công tác
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px]">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={taskSearchQuery}
                            onChange={(e) => setTaskSearchQuery(e.target.value)}
                            placeholder="Tìm mã hiệu (16.01, 16.03...) hoặc tên công việc..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>

                        <div className="flex items-center gap-1 text-xs">
                          {[
                            { id: 'all', label: 'Tất cả' },
                            { id: 'selected', label: 'Đã chọn' },
                            { id: 'insulator', label: 'Cách điện/Sứ' },
                            { id: 'clamp', label: 'Kẹp quai/IPC' },
                            { id: 'crossarm', label: 'Xà đà' },
                          ].map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setTaskFilterCategory(cat.id as any)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                                taskFilterCategory === cat.id
                                  ? 'bg-sky-600 text-white font-bold'
                                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Inline Task Add/Edit Drawer */}
                    {isAddingTask && (
                      <div className="p-3.5 bg-sky-50 rounded-xl border-2 border-sky-400 space-y-2.5">
                        <div className="flex items-center justify-between pb-1 border-b border-sky-200">
                          <span className="font-bold text-xs text-sky-950">
                            {editingTaskId ? 'Sửa công tác' : 'Thêm mới công tác vào định mức'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAddingTask(false)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <input
                            type="text"
                            value={taskFormCode}
                            onChange={(e) => setTaskFormCode(e.target.value)}
                            placeholder="Mã (vd: 16.05.01-1)"
                            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold"
                          />
                          <input
                            type="text"
                            value={taskFormName}
                            onChange={(e) => setTaskFormName(e.target.value)}
                            placeholder="Tên công tác..."
                            className="sm:col-span-2 px-2 py-1 text-xs bg-white border border-slate-300 rounded font-semibold"
                          />
                          <input
                            type="text"
                            value={taskFormUnit}
                            onChange={(e) => setTaskFormUnit(e.target.value)}
                            placeholder="Đơn vị (vd: 1 bộ)"
                            className="px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-600 block">VL phụ (VNĐ)</label>
                            <input
                              type="number"
                              value={taskFormAuxMat}
                              onChange={(e) => setTaskFormAuxMat(parseInt(e.target.value, 10) || 0)}
                              className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-600 block">VL Hotline (VNĐ)</label>
                            <input
                              type="number"
                              value={taskFormHotline}
                              onChange={(e) => setTaskFormHotline(parseInt(e.target.value, 10) || 0)}
                              className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-600 block">Nhân công NC (VNĐ)</label>
                            <input
                              type="number"
                              value={taskFormLabor}
                              onChange={(e) => setTaskFormLabor(parseInt(e.target.value, 10) || 0)}
                              className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-blue-900"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-600 block">Máy thi công MTC (VNĐ)</label>
                            <input
                              type="number"
                              value={taskFormMachine}
                              onChange={(e) => setTaskFormMachine(parseInt(e.target.value, 10) || 0)}
                              className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono font-bold text-amber-900"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1 border-t border-sky-200">
                          <button
                            type="button"
                            onClick={() => setIsAddingTask(false)}
                            className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveTaskForm}
                            className="px-4 py-1 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded"
                          >
                            Lưu công tác
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Task Item Cards List */}
                    <div className="space-y-2.5">
                      {visibleTasks.map((task) => {
                        const baseRates = getTaskBaseRates(task, activePos.voltageLevel);
                        const coeffs = computeTaskCoefficients(task);
                        const qty = task.quantity || 1;
                        const taskCount = task.taskCount || 1;

                        const subtotalMat = Math.round(qty * baseRates.auxiliaryMaterial * coeffs.auxiliaryMaterial);
                        const subtotalHotline = Math.round(qty * baseRates.hotline * coeffs.material);
                        const subtotalLabor = Math.round(qty * baseRates.labor * coeffs.labor);
                        const subtotalMach = Math.round(qty * baseRates.machinery * coeffs.machinery);
                        const taskSubtotal = subtotalMat + subtotalHotline + subtotalLabor + subtotalMach;

                        const selectedConditionIds = task.selectedConditionIds || [];
                        const taskConditions = task.conditions || DEFAULT_CONDITIONS_16_01_01_1;

                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              task.isSelected
                                ? 'border-sky-400 bg-sky-50/40 shadow-xs'
                                : 'border-slate-200 bg-slate-50/70 opacity-60'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2.5">
                              {/* Left: Checkbox + Name + Unit */}
                              <div className="flex items-start gap-2.5 flex-1 min-w-[280px]">
                                <input
                                  type="checkbox"
                                  checked={task.isSelected}
                                  onChange={() => handleToggleTask(task.id)}
                                  className="w-4 h-4 mt-1 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer shrink-0"
                                />

                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-black text-sky-900 bg-sky-100 px-2 py-0.5 rounded">
                                      {task.code}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                      {task.name}
                                    </h4>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      ({task.unit || '1 bộ'})
                                    </span>
                                  </div>

                                  {/* Direct Base Rates Info Display */}
                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap pt-0.5">
                                    <span>Đơn giá ({activePos.voltageLevel}):</span>
                                    <span>VL phụ: {formatVnd(baseRates.auxiliaryMaterial)}</span>
                                    <span>·</span>
                                    <span>Hotline: {formatVnd(baseRates.hotline)}</span>
                                    <span>·</span>
                                    <span className="text-blue-900 font-semibold">NC: {formatVnd(baseRates.labor)}</span>
                                    <span>·</span>
                                    <span className="text-amber-900 font-semibold">MTC: {formatVnd(baseRates.machinery)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: Quantity & Task Count Direct Inputs (USER REQUEST: SỐ LƯỢNG - SỐ CÔNG TÁC ĐIỀN BẰNG TAY) */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                                  <span className="text-[10px] text-slate-500 font-bold px-1 uppercase">Khối lượng:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTaskQuantity(task.id, qty - 1)}
                                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={qty}
                                    onChange={(e) => handleUpdateTaskQuantity(task.id, parseInt(e.target.value, 10) || 1)}
                                    className="w-10 px-1 py-0.5 text-center text-xs font-mono font-bold bg-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTaskQuantity(task.id, qty + 1)}
                                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                                  >
                                    +
                                  </button>
                                  <span className="text-[10px] text-slate-400 pr-1">{task.unit || 'bộ'}</span>
                                </div>

                                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                                  <span className="text-[10px] text-slate-500 font-bold px-1 uppercase">Số CT:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTaskCount(task.id, taskCount - 1)}
                                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={taskCount}
                                    onChange={(e) => handleUpdateTaskCount(task.id, parseInt(e.target.value, 10) || 1)}
                                    className="w-8 px-1 py-0.5 text-center text-xs font-mono font-bold bg-transparent"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateTaskCount(task.id, taskCount + 1)}
                                    className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTask(task)}
                                  className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                                  title="Sửa công tác này"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Xóa công tác này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* USER REQUESTED: 15 ĐIỀU KIỆN THI CÔNG - DẠNG LỌC CHỌN - BẤM VÔ PHẦN LỌC THÌ HIỆN CÁC ĐIỀU KIỆN */}
                            <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setFilterModalTaskId(task.id)}
                                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                                  <span>⚡ Lọc điều kiện thi công ({taskConditions.length} điều kiện)</span>
                                  {selectedConditionIds.length > 0 && (
                                    <span className="bg-sky-800 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                                      {selectedConditionIds.length}
                                    </span>
                                  )}
                                </button>

                                {/* Active Condition Chips Display */}
                                {selectedConditionIds.map((condId) => {
                                  const cond = taskConditions.find((c) => c.id === condId || c.code === condId);
                                  if (!cond) return null;
                                  return (
                                    <span
                                      key={condId}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-sky-900 border border-sky-300 rounded-lg text-[11px] font-medium shadow-2xs"
                                    >
                                      <span className="font-mono font-bold text-sky-700">{cond.code}:</span>
                                      <span className="truncate max-w-[150px]">{cond.description}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveConditionFromTask(task.id, condId)}
                                        className="text-slate-400 hover:text-rose-600 cursor-pointer font-bold ml-0.5"
                                        title="Gỡ điều kiện này"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Multiplied Coefficients & Subtotal */}
                              <div className="flex items-center gap-3 text-xs ml-auto">
                                <div className="font-mono text-[11px] text-slate-600 flex items-center gap-1.5">
                                  <span>Kđc:</span>
                                  <span className="font-bold text-blue-900">Knc={coeffs.labor}</span>
                                  <span className="font-bold text-amber-900">Kmtc={coeffs.machinery}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono font-black text-emerald-800 text-xs sm:text-sm">
                                    {formatVnd(taskSubtotal)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // RENDER SECTION 4: Bảng Tổng Hợp Dự Toán (Phụ Lục TH-01 & Mức Thuế 0-15%)
            if (secKey === 'sec4') {
              return (
                <div key="sec4">
                  <OfficialEstimateSummaryTable
                    breakdown={aggregatedBreakdown}
                    filledPositionsCount={filledPositions.length}
                    filledPositionNames={filledPositionNames}
                    options={estimateOptions}
                    onChangeOptions={setEstimateOptions}
                    title={sectionTitles.sec4}
                    onEditTitle={(newTitle) =>
                      setSectionTitles((prev) => ({ ...prev, sec4: newTitle }))
                    }
                    canMoveUp={sectionOrder.indexOf('sec4') > 0}
                    canMoveDown={sectionOrder.indexOf('sec4') < sectionOrder.length - 1}
                    onMoveUp={() => handleMoveSection('sec4', 'up')}
                    onMoveDown={() => handleMoveSection('sec4', 'down')}
                  />
                </div>
              );
            }

            return null;
          })}

          {/* Notes */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-300">
            <label className="text-xs font-bold text-slate-700 block mb-1">Ghi chú hiện trường</label>
            <input
              type="text"
              value={activePos.notes || ''}
              onChange={(e) => updateActivePosition({ notes: e.target.value })}
              placeholder="VD: Cây xanh gần dây dẫn, cần phát quang hành lang, điều kiện tiếp cận xe gàu..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
        </form>

        {/* Modal Fixed Footer Bar */}
        <div className="bg-white border-t border-slate-300 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-slate-500 block font-medium">
              {filledPositions.length <= 1
                ? 'Tổng dự toán (1 vị trí):'
                : `Tổng dự toán (${filledPositions.length} vị trí đã điền):`}
            </span>
            <span className="font-mono font-black text-sm sm:text-lg text-emerald-700 truncate">
              {formatVnd(aggregatedBreakdown.totalEstimatedCost)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors min-h-[42px] cursor-pointer"
            >
              Hủy / Đóng
            </button>
            <button
              type="submit"
              form="manual-checkin-form"
              className="px-4 sm:px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 min-h-[42px] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {filledPositions.length <= 1
                  ? 'Xác Nhận & Lưu Dự Toán Vị Trí'
                  : `Xác Nhận & Lưu Dự Toán (${filledPositions.length} Vị Trí)`}
              </span>
            </button>
          </div>
        </div>

        {/* Condition Filter Modal for Active Task */}
        {taskForFilterModal && (
          <TaskConditionFilterModal
            isOpen={!!taskForFilterModal}
            onClose={() => setFilterModalTaskId(null)}
            task={taskForFilterModal}
            voltageLevel={activePos.voltageLevel}
            onApplyConditions={handleApplyConditionsFromModal}
          />
        )}
      </div>
    </div>
  );
};
