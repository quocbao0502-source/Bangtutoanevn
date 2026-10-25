import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Move,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  Square,
  Trash2,
  Type,
  X,
  Zap,
} from 'lucide-react';
import {
  CustomHeaderField,
  HeaderBadgeType,
  HeaderCustomizationSettings,
} from '../types/pole';
import { DEFAULT_HEADER_SETTINGS } from '../data/seedData';

interface HeaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: HeaderCustomizationSettings;
  onSaveSettings: (newSettings: HeaderCustomizationSettings) => void;
  totalCostVnd?: number;
  depotCoords?: { lat: number; lng: number };
}

const AVAILABLE_ICONS = ['⚡', '🏢', '🔌', '🗼', '🛠️', '📋', '💡', '🛡️', '⚙️', '📡', '🌲', '☀️'];

export const BADGE_COLOR_MAP: Record<HeaderBadgeType, { bg: string; text: string; border: string; label: string }> = {
  primary: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', label: 'Xanh EVN (Blue)' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', label: 'Xanh an toàn (Green)' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', label: 'Vàng cảnh báo (Amber)' },
  info: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-300', label: 'Xanh da trời (Sky)' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', label: 'Tím điều độ (Purple)' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', label: 'Đỏ khẩn cấp (Rose)' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', label: 'Xám trung tính (Slate)' },
};

export const FRAME_BORDER_COLOR_MAP: Record<string, { class: string; label: string }> = {
  slate: { class: 'border-slate-300', label: 'Xám kỹ thuật (Slate)' },
  sky: { class: 'border-sky-400', label: 'Xanh da trời (Sky)' },
  blue: { class: 'border-blue-500', label: 'Xanh đậm EVN (Blue)' },
  emerald: { class: 'border-emerald-400', label: 'Xanh an toàn (Green)' },
  amber: { class: 'border-amber-400', label: 'Vàng cam nổi bật (Amber)' },
};

export const FRAME_BG_COLOR_MAP: Record<string, { class: string; label: string }> = {
  white: { class: 'bg-white', label: 'Trắng tinh khiết' },
  slate_light: { class: 'bg-slate-50', label: 'Xám bạc nhẹ' },
  sky_light: { class: 'bg-sky-50/70', label: 'Xanh dương EVN nhẹ' },
  amber_light: { class: 'bg-amber-50/60', label: 'Vàng cam nhẹ' },
  emerald_light: { class: 'bg-emerald-50/60', label: 'Xanh an toàn nhẹ' },
};

export const FRAME_SHADOW_MAP: Record<string, { class: string; label: string }> = {
  none: { class: 'shadow-none', label: 'Phẳng (Không bóng)' },
  sm: { class: 'shadow-2xs', label: 'Bóng nhẹ' },
  md: { class: 'shadow-sm', label: 'Bóng tiêu chuẩn' },
  lg: { class: 'shadow-md', label: 'Nổi khối rõ' },
};

export const FRAME_PADDING_MAP: Record<string, { class: string; label: string }> = {
  compact: { class: 'p-3', label: 'Gọn nhẹ (Compact)' },
  normal: { class: 'p-3.5 sm:p-4', label: 'Tiêu chuẩn (Normal)' },
  spacious: { class: 'p-5 sm:p-6', label: 'Rộng rãi (Spacious)' },
};

export const FRAME_BORDER_STYLE_MAP: Record<string, { class: string; label: string }> = {
  solid: { class: 'border border-solid', label: 'Nét liền (Tiêu chuẩn)' },
  dashed: { class: 'border-2 border-dashed', label: 'Nét đứt (Bản vẽ/Demo)' },
  double: { class: 'border-4 border-double', label: 'Nét đôi (Sang trọng)' },
};

export const FRAME_RADIUS_MAP: Record<string, { class: string; label: string }> = {
  'rounded-none': { class: 'rounded-none', label: 'Vuông vức (0px)' },
  'rounded-lg': { class: 'rounded-lg', label: 'Bo nhẹ (8px)' },
  'rounded-xl': { class: 'rounded-xl', label: 'Bo chuẩn (12px)' },
  'rounded-2xl': { class: 'rounded-2xl', label: 'Bo tròn lớn (16px)' },
};

export const HeaderSettingsModal: React.FC<HeaderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  totalCostVnd = 0,
  depotCoords = { lat: 11.3665, lng: 106.1362 },
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Working draft state
  const [formState, setFormState] = useState<HeaderCustomizationSettings>(() => ({
    ...DEFAULT_HEADER_SETTINGS,
    ...settings,
    customFields: [...(settings.customFields || DEFAULT_HEADER_SETTINGS.customFields || [])],
    sectionTitles: {
      ...DEFAULT_HEADER_SETTINGS.sectionTitles,
      ...(settings.sectionTitles || {}),
    },
  }));

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'info' } | null>(null);

  // Active tab in modal
  const [activeTab, setActiveTab] = useState<'fields' | 'frames' | 'headings' | 'brand' | 'org'>('fields');

  // Drag and drop state
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);

  // Add new custom field state
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [newFieldBadge, setNewFieldBadge] = useState<HeaderBadgeType>('primary');
  const [newFieldShowNavbar, setNewFieldShowNavbar] = useState(true);
  const [newFieldShowReport, setNewFieldShowReport] = useState(true);

  // Edit existing custom field state
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState('');
  const [editFieldValue, setEditFieldValue] = useState('');
  const [editFieldBadge, setEditFieldBadge] = useState<HeaderBadgeType>('primary');
  const [editFieldShowNavbar, setEditFieldShowNavbar] = useState(true);
  const [editFieldShowReport, setEditFieldShowReport] = useState(true);

  if (!isOpen) return null;

  const triggerToast = (text: string) => {
    setToastMessage({ text, type: 'success' });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Drag & Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedFieldIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedFieldIndex === null || draggedFieldIndex === targetIndex) return;
    const nextFields = [...formState.customFields];
    const [moved] = nextFields.splice(draggedFieldIndex, 1);
    nextFields.splice(targetIndex, 0, moved);
    setFormState({
      ...formState,
      customFields: nextFields,
    });
    setDraggedFieldIndex(null);
    triggerToast(`Đã kéo thả trường "${moved.label}" sang vị trí mới thành công!`);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formState.customFields.length) return;
    const nextFields = [...formState.customFields];
    const [moved] = nextFields.splice(index, 1);
    nextFields.splice(targetIndex, 0, moved);
    setFormState({
      ...formState,
      customFields: nextFields,
    });
    triggerToast(`Đã đổi vị trí trường "${moved.label}" thành công!`);
  };

  // Field CRUD Handlers
  const handleConfirmAddField = () => {
    const label = newFieldLabel.trim();
    const value = newFieldValue.trim();
    if (!label) {
      alert('Vui lòng nhập tên trường (Ví dụ: Biển số xe, Trưởng ca, v.v.)');
      return;
    }
    const id = `field_${Date.now()}`;
    const newField: CustomHeaderField = {
      id,
      label,
      value,
      badgeType: newFieldBadge,
      showInNavbar: newFieldShowNavbar,
      showInReport: newFieldShowReport,
    };

    setFormState((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));

    setNewFieldLabel('');
    setNewFieldValue('');
    setIsAddingField(false);
    triggerToast(`Đã tạo trường "${label}" vào khung tiêu đề thành công!`);
  };

  const handleOpenEditField = (field: CustomHeaderField) => {
    setEditingFieldId(field.id);
    setEditFieldLabel(field.label);
    setEditFieldValue(field.value);
    setEditFieldBadge(field.badgeType);
    setEditFieldShowNavbar(field.showInNavbar);
    setEditFieldShowReport(field.showInReport);
  };

  const handleConfirmEditField = () => {
    if (!editingFieldId) return;
    const label = editFieldLabel.trim();
    if (!label) {
      alert('Tên trường không được để trống.');
      return;
    }

    setFormState((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) =>
        f.id === editingFieldId
          ? {
              ...f,
              label,
              value: editFieldValue.trim(),
              badgeType: editFieldBadge,
              showInNavbar: editFieldShowNavbar,
              showInReport: editFieldShowReport,
            }
          : f
      ),
    }));

    setEditingFieldId(null);
    triggerToast(`Đã cập nhật nội dung trường "${label}" thành công!`);
  };

  const handleDeleteField = (fieldId: string) => {
    const target = formState.customFields.find((f) => f.id === fieldId);
    if (window.confirm(`Bạn có chắc muốn xóa trường "${target?.label || 'này'}" khỏi khung tiêu đề?`)) {
      setFormState((prev) => ({
        ...prev,
        customFields: prev.customFields.filter((f) => f.id !== fieldId),
      }));
      triggerToast(`Đã xóa trường "${target?.label || ''}" khỏi khung tiêu đề thành công!`);
    }
  };

  const handleToggleFieldNavbar = (fieldId: string) => {
    setFormState((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) =>
        f.id === fieldId ? { ...f, showInNavbar: !f.showInNavbar } : f
      ),
    }));
  };

  const handleToggleFieldReport = (fieldId: string) => {
    setFormState((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) =>
        f.id === fieldId ? { ...f, showInReport: !f.showInReport } : f
      ),
    }));
  };

  // Reset to default settings
  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Bạn có chắc muốn khôi phục giao diện, bố cục và khung tiêu đề về thiết lập ban đầu của EVN?'
      )
    ) {
      setFormState({ ...DEFAULT_HEADER_SETTINGS });
      triggerToast('Đã khôi phục khung và giao diện về mặc định EVN thành công!');
    }
  };

  // Apply & Save
  const handleSave = () => {
    onSaveSettings(formState);
    triggerToast('Đã lưu thiết lập giao diện và khung tiêu đề thành công!');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Live preview classes
  const radiusClass = FRAME_RADIUS_MAP[formState.frameBorderRadius || 'rounded-xl']?.class || 'rounded-xl';
  const borderStyleClass = FRAME_BORDER_STYLE_MAP[formState.frameBorderStyle || 'solid']?.class || 'border border-solid';
  const borderColorClass = FRAME_BORDER_COLOR_MAP[formState.frameBorderColor || 'slate']?.class || 'border-slate-300';
  const bgClass = FRAME_BG_COLOR_MAP[formState.frameBgColor || 'white']?.class || 'bg-white';
  const shadowClass = FRAME_SHADOW_MAP[formState.frameShadow || 'sm']?.class || 'shadow-sm';
  const paddingClass = FRAME_PADDING_MAP[formState.framePadding || 'normal']?.class || 'p-3.5 sm:p-4';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs transition-all duration-150 ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white flex flex-col animate-in fade-in zoom-in-95 duration-150 transition-all ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none shadow-none border-0'
            : 'w-full max-w-4xl max-h-[94vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar with Maximize/Restore & Close Buttons */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Trình Thiết Kế Giao Diện, Vẽ Khung & Kéo Thả</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/40 px-2 py-0.5 rounded-full font-semibold uppercase">
                  Bản Demo
                </span>
              </h2>
              <p className="text-[11px] text-slate-300">
                Tùy chỉnh vẽ khung, kéo thả sắp xếp, thêm/xóa trường, đổi tiêu đề sao cho hợp lý nhất
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
              aria-label={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-sky-400" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Đóng cửa sổ tùy chỉnh giao diện"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast Notification Banner */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-bold shrink-0 animate-in fade-in slide-in-from-top-2 z-30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-emerald-100 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Preview Bar (Xem trước thời gian thực) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 shrink-0">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Xem trước khung & các trường theo thời gian thực:</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Live Preview</span>
          </div>

          {/* Dynamic Styled Frame Live Preview */}
          <div className={`transition-all ${radiusClass} ${borderStyleClass} ${borderColorClass} ${bgClass} ${shadowClass} ${paddingClass} space-y-2`}>
            {/* Top row: Brand & Title */}
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center font-bold text-xs shadow-2xs">
                  {formState.brandIcon}
                </span>
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    {formState.appTitle || 'EVN PoleInspector'}
                  </span>
                  <span className="text-slate-400 text-xs mx-1.5 hidden sm:inline">|</span>
                  <span className="text-slate-500 text-xs hidden sm:inline">
                    {formState.appSubtitle || 'Quản Lý Trụ Điện & Lộ Trình Bảo Trì'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-sky-800 font-semibold px-2 py-0.5 bg-sky-100 rounded">
                Khung xem trước
              </div>
            </div>

            {/* Middle row: Depot info */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>{formState.unitName || 'Đội QLVH Đường Dây'}</span>
              </div>

              {formState.showGpsBadge && (
                <span className="text-[11px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                  GPS: {depotCoords.lat.toFixed(4)}, {depotCoords.lng.toFixed(4)}
                </span>
              )}

              {/* Render Visible Custom Fields in their Drag-ordered sequence */}
              {formState.customFields
                .filter((f) => f.showInNavbar && f.value?.trim())
                .map((field) => {
                  const style = BADGE_COLOR_MAP[field.badgeType] || BADGE_COLOR_MAP.primary;
                  return (
                    <span
                      key={field.id}
                      className={`text-[11px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 ${style.bg} ${style.text} ${style.border}`}
                    >
                      <strong>{field.label}:</strong>
                      <span>{field.value}</span>
                    </span>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'fields'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Kéo Thả & Các Trường ({formState.customFields.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('frames')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'frames'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Vẽ Khung & Kiểu Dáng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('headings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'headings'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Tiêu Đề Phân Hệ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'brand'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Tên & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('org')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'org'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Đơn Vị & Địa Bàn</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: KÉO THẢ & QUẢN LÝ CÁC TRƯỜNG THÔNG TIN */}
          {activeTab === 'fields' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Move className="w-4 h-4 text-sky-600" />
                    <span>Kéo Thả Sắp Xếp, Thêm, Sửa & Xóa Các Trường</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Nắm vào biểu tượng <strong>[⋮⋮]</strong> để kéo thả đổi vị trí, hoặc bấm nút <strong>[▲] [▼]</strong> để dịch chuyển thứ tự.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddingField(!isAddingField);
                    setEditingFieldId(null);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm trường mới</span>
                </button>
              </div>

              {/* Inline Form: Add New Field */}
              {isAddingField && (
                <div className="p-4 bg-blue-50/60 rounded-xl border-2 border-blue-300 shadow-xs space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Thêm trường thông tin mới vào khung tiêu đề:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Tên trường (Nhãn):</label>
                      <input
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="VD: Mã xuất tuyến, Biển số xe, Trưởng ca..."
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Giá trị trường:</label>
                      <input
                        type="text"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        placeholder="VD: Lộ 471 & 473 Bình Minh, 70C-123.45..."
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Kiểu màu huy hiệu:</label>
                      <select
                        value={newFieldBadge}
                        onChange={(e) => setNewFieldBadge(e.target.value as HeaderBadgeType)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      >
                        {Object.entries(BADGE_COLOR_MAP).map(([key, item]) => (
                          <option key={key} value={key}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col justify-end space-y-1.5">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newFieldShowNavbar}
                          onChange={(e) => setNewFieldShowNavbar(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Hiện trên khung tiêu đề màn hình chính</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newFieldShowReport}
                          onChange={(e) => setNewFieldShowReport(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Hiện trên phiếu công tác A4 chuẩn EVN</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={() => setIsAddingField(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAddField}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      Lưu trường vào khung tiêu đề
                    </button>
                  </div>
                </div>
              )}

              {/* Inline Form: Edit Existing Field */}
              {editingFieldId && (
                <div className="p-4 bg-amber-50/70 rounded-xl border-2 border-amber-300 shadow-xs space-y-3 animate-in fade-in duration-150">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Pencil className="w-4 h-4 text-amber-600" />
                    <span>Chỉnh sửa trường thông tin khung tiêu đề:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Tên trường (Nhãn):</label>
                      <input
                        type="text"
                        value={editFieldLabel}
                        onChange={(e) => setEditFieldLabel(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Giá trị trường:</label>
                      <input
                        type="text"
                        value={editFieldValue}
                        onChange={(e) => setEditFieldValue(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Kiểu màu huy hiệu:</label>
                      <select
                        value={editFieldBadge}
                        onChange={(e) => setEditFieldBadge(e.target.value as HeaderBadgeType)}
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      >
                        {Object.entries(BADGE_COLOR_MAP).map(([key, item]) => (
                          <option key={key} value={key}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col justify-end space-y-1.5">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFieldShowNavbar}
                          onChange={(e) => setEditFieldShowNavbar(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>Hiện trên khung tiêu đề màn hình chính</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFieldShowReport}
                          onChange={(e) => setEditFieldShowReport(e.target.checked)}
                          className="rounded text-amber-600"
                        />
                        <span>Hiện trên phiếu công tác A4 chuẩn EVN</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={() => setEditingFieldId(null)}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmEditField}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      Cập nhật trường
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Fields List WITH DRAG AND DROP & ORDER BUTTONS */}
              <div className="space-y-2">
                {formState.customFields.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs">
                    Chưa có trường nào. Nhấn <strong>+ Thêm trường mới</strong> để thêm mã lộ, đội trưởng, biển số xe...
                  </div>
                ) : (
                  formState.customFields.map((field, idx) => {
                    const badge = BADGE_COLOR_MAP[field.badgeType] || BADGE_COLOR_MAP.primary;
                    const isFirst = idx === 0;
                    const isLast = idx === formState.customFields.length - 1;

                    return (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx)}
                        className={`p-3 bg-white border rounded-xl shadow-2xs flex flex-wrap items-center justify-between gap-2.5 transition-all cursor-move select-none ${
                          draggedFieldIndex === idx
                            ? 'opacity-40 border-sky-500 bg-sky-50/50 scale-[0.99]'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Drag handle & Field content */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Drag grip icon */}
                          <div
                            title="Kéo thả để đổi thứ tự"
                            className="p-1 text-slate-400 hover:text-sky-600 cursor-grab shrink-0"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Quick Up/Down buttons for click-ordering */}
                          <div className="flex flex-col gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveField(idx, 'up')}
                              title="Chuyển lên trên"
                              className={`p-0.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 ${
                                isFirst ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveField(idx, 'down')}
                              title="Chuyển xuống dưới"
                              className={`p-0.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 ${
                                isLast ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Badge display */}
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-bold border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {field.label}: {field.value || '(Trống)'}
                          </span>

                          {/* Visibility Toggles */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <button
                              type="button"
                              onClick={() => handleToggleFieldNavbar(field.id)}
                              title="Bật/tắt hiện trên màn hình chính"
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border cursor-pointer ${
                                field.showInNavbar
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              {field.showInNavbar ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span className="hidden sm:inline">Màn hình</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleFieldReport(field.id)}
                              title="Bật/tắt hiện trên báo cáo phiếu A4"
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border cursor-pointer ${
                                field.showInReport
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              <FileText className="w-3 h-3" />
                              <span className="hidden sm:inline">Phiếu in</span>
                            </button>
                          </div>
                        </div>

                        {/* Visible Action Buttons SỬA & XÓA */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleOpenEditField(field)}
                            className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Sửa trường ${field.label}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Sửa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteField(field.id)}
                            className="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title={`Xóa trường ${field.label}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VẼ KHUNG & KIỂU DÁNG (FRAME STYLING) */}
          {activeTab === 'frames' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Square className="w-4 h-4 text-sky-600" />
                  <span>Tùy Chỉnh Kiểu Dáng Khung Tiêu Đề & Ngữ Cảnh</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Vẽ khung viền, chọn màu nền, độ bo góc, đổ bóng và khoảng cách sao cho đẹp mắt và hài hòa với trang web.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Kiểu đường viền khung */}
                <div>
                  <label className="text-xs font-bold text-slate-800">Kiểu đường viền khung (Border Style):</label>
                  <select
                    value={formState.frameBorderStyle || 'solid'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        frameBorderStyle: e.target.value as 'solid' | 'dashed' | 'double',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {Object.entries(FRAME_BORDER_STYLE_MAP).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Màu sắc đường viền */}
                <div>
                  <label className="text-xs font-bold text-slate-800">Màu sắc đường viền (Border Color):</label>
                  <select
                    value={formState.frameBorderColor || 'slate'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        frameBorderColor: e.target.value as 'slate' | 'sky' | 'blue' | 'emerald' | 'amber',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {Object.entries(FRAME_BORDER_COLOR_MAP).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Màu nền khung */}
                <div>
                  <label className="text-xs font-bold text-slate-800">Màu nền khung (Background Color):</label>
                  <select
                    value={formState.frameBgColor || 'white'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        frameBgColor: e.target.value as 'white' | 'slate_light' | 'sky_light' | 'amber_light' | 'emerald_light',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {Object.entries(FRAME_BG_COLOR_MAP).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Bo góc khung */}
                <div>
                  <label className="text-xs font-bold text-slate-800">Độ bo góc khung (Border Radius):</label>
                  <select
                    value={formState.frameBorderRadius || 'rounded-xl'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        frameBorderRadius: e.target.value as 'rounded-none' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {Object.entries(FRAME_RADIUS_MAP).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Đổ bóng */}
                <div>
                  <label className="text-xs font-bold text-slate-800">Hiệu ứng đổ bóng (Box Shadow):</label>
                  <select
                    value={formState.frameShadow || 'sm'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        frameShadow: e.target.value as 'none' | 'sm' | 'md' | 'lg',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {Object.entries(FRAME_SHADOW_MAP).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Khoảng cách lề trong */}
                <div>
                  <label className="text-xs font-bold text-slate-800">Khoảng cách lề bên trong (Padding):</label>
                  <select
                    value={formState.framePadding || 'normal'}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        framePadding: e.target.value as 'compact' | 'normal' | 'spacious',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    {Object.entries(FRAME_PADDING_MAP).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ĐỔI TIÊU ĐỀ CÁC PHÂN HỆ TRANG WEB (SECTION HEADINGS) */}
          {activeTab === 'headings' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-sky-600" />
                  <span>Tùy Chỉnh Tiêu Đề Các Khung & Phân Hệ Trang Web</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Đổi tên tiêu đề hiển thị trên thanh tab và các khung chức năng phù hợp với quy trình công tác của đơn vị bạn.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800">Tiêu đề phân hệ Bản đồ:</label>
                  <input
                    type="text"
                    value={formState.sectionTitles?.mapTitle || ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        sectionTitles: { ...formState.sectionTitles, mapTitle: e.target.value },
                      })
                    }
                    placeholder="Mặc định: Bản đồ toàn cảnh"
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800">Tiêu đề phân hệ Lộ trình & Xe:</label>
                  <input
                    type="text"
                    value={formState.sectionTitles?.routeTitle || ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        sectionTitles: { ...formState.sectionTitles, routeTitle: e.target.value },
                      })
                    }
                    placeholder="Mặc định: Chi tiết lộ trình & xăng"
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800">Tiêu đề phân hệ Bảng kê trụ:</label>
                  <input
                    type="text"
                    value={formState.sectionTitles?.ledgerTitle || ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        sectionTitles: { ...formState.sectionTitles, ledgerTitle: e.target.value },
                      })
                    }
                    placeholder="Mặc định: Bảng kê trụ toàn tuyến"
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800">Tiêu đề phân hệ Bảng định mức EVN:</label>
                  <input
                    type="text"
                    value={formState.sectionTitles?.ratesTitle || ''}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        sectionTitles: { ...formState.sectionTitles, ratesTitle: e.target.value },
                      })
                    }
                    placeholder="Mặc định: Bảng định mức chi phí EVN"
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRAND & APP TITLE */}
          {activeTab === 'brand' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800">Tên phần mềm / Tiêu đề chính:</label>
                  <input
                    type="text"
                    value={formState.appTitle}
                    onChange={(e) => setFormState({ ...formState, appTitle: e.target.value })}
                    placeholder="VD: EVN PoleInspector, QUẢN LÝ LƯỚI ĐIỆN TÂY NINH..."
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Hiển thị ở góc trên bên trái thanh điều hướng
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800">Tiêu đề phụ (Slogan / Phân hệ):</label>
                  <input
                    type="text"
                    value={formState.appSubtitle}
                    onChange={(e) => setFormState({ ...formState, appSubtitle: e.target.value })}
                    placeholder="VD: Quản Lý Trụ Điện & Lộ Trình Bảo Trì..."
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Hiển thị mô tả chức năng phần mềm
                  </span>
                </div>
              </div>

              {/* Choose Brand Icon */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  Biểu tượng Logo (Chọn 1 biểu tượng đặc thù ngành điện):
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLEICONS_SELECTION(formState.brandIcon, (icon) =>
                    setFormState({ ...formState, brandIcon: icon })
                  )}
                </div>
              </div>

              {/* Navbar Style and Visibility Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-800">Phong cách thanh điều hướng:</label>
                  <select
                    value={formState.navbarStyle}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        navbarStyle: e.target.value as 'clean_white' | 'dark_navy' | 'evn_blue',
                      })
                    }
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="clean_white">Trắng thanh lịch (Tiêu chuẩn Web EVN)</option>
                    <option value="dark_navy">Tối sang trọng (Dark Slate EVN)</option>
                    <option value="evn_blue">Xanh điện lực (EVN Power Blue)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.showGpsBadge}
                      onChange={(e) => setFormState({ ...formState, showGpsBadge: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Hiển thị huy hiệu GPS trạm trên khung tiêu đề</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.showTotalCostBadge}
                      onChange={(e) => setFormState({ ...formState, showTotalCostBadge: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span>Hiển thị tổng số tiền định mức toàn tuyến</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORGANIZATION & DEPOT */}
          {activeTab === 'org' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800">Đơn vị cấp trên (Tập đoàn):</label>
                  <input
                    type="text"
                    value={formState.parentOrganization}
                    onChange={(e) => setFormState({ ...formState, parentOrganization: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800">Công ty Điện lực trực thuộc:</label>
                  <input
                    type="text"
                    value={formState.subOrganization}
                    onChange={(e) => setFormState({ ...formState, subOrganization: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold uppercase text-sky-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800">Tên Đội / Phân xưởng QLVH:</label>
                <input
                  type="text"
                  value={formState.unitName}
                  onChange={(e) => setFormState({ ...formState, unitName: e.target.value })}
                  placeholder="VD: Đội Quản lý Vận hành Điện lực TP Tây Ninh - Khu vực Bình Minh"
                  className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Được đồng bộ làm điểm xuất phát và tên đơn vị trên phiếu nghiệm thu
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800">Địa chỉ trụ sở công tác:</label>
                <input
                  type="text"
                  value={formState.unitAddress}
                  onChange={(e) => setFormState({ ...formState, unitAddress: e.target.value })}
                  placeholder="VD: Số 86 Đường Trần Phú, Phường Bình Minh, TP Tây Ninh"
                  className="w-full mt-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định EVN</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>✓ Lưu & Áp Dụng Bố Cục Giao Diện</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function AVAILABLEICONS_SELECTION(current: string, onSelect: (icon: string) => void) {
  return AVAILABLE_ICONS.map((icon) => (
    <button
      key={icon}
      type="button"
      onClick={() => onSelect(icon)}
      className={`w-9 h-9 rounded-lg text-base flex items-center justify-center border transition-all cursor-pointer ${
        current === icon
          ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-sky-400'
          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
      }`}
    >
      {icon}
    </button>
  ));
}
