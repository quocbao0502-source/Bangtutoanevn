import React, { useState, useEffect } from 'react';
import { readStored, writeStored, validCoordinates } from './utils/storage';
import {
  ElectricPole,
  HeaderCustomizationSettings,
  MaintenanceRates,
  RouteOptimizationResult,
  WorkplaceDepot,
} from './types/pole';
import {
  DEFAULT_DEPOT,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_MAINTENANCE_RATES,
  getInitialPoles,
} from './data/seedData';
import {
  calculateDistanceKm,
  calculateEVNMultiTaskCost,
  calculatePoleTotalCost,
  formatKm,
  formatVnd,
  optimizeRoute,
} from './utils/calculations';
import {
  exportFullReportToExcel,
  exportPolesToCsv,
} from './utils/exportUtils';
import { ActiveTab, Navbar } from './components/Navbar';
import { MobileBottomBar } from './components/MobileBottomBar';
import { MapContainer } from './components/MapContainer';
import { AIPoleInspector } from './components/AIPoleInspector';
import { ManualCheckInModal } from './components/ManualCheckInModal';
import { RoutePlanner } from './components/RoutePlanner';
import { PoleLedger } from './components/PoleLedger';
import { RateSettingsModal } from './components/RateSettingsModal';
import { WorkReportModal } from './components/WorkReportModal';
import {
  HeaderSettingsModal,
  BADGE_COLOR_MAP,
  FRAME_BG_COLOR_MAP,
  FRAME_BORDER_COLOR_MAP,
  FRAME_BORDER_STYLE_MAP,
  FRAME_PADDING_MAP,
  FRAME_RADIUS_MAP,
  FRAME_SHADOW_MAP,
} from './components/HeaderSettingsModal';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  GripVertical,
  Map,
  MapPin,
  Move,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Route,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

export default function App() {
  const [depot, setDepot] = useState<WorkplaceDepot>(() => readStored('evn_workplace_depot', DEFAULT_DEPOT,
    (v: any) => v && typeof v.name === 'string' && typeof v.address === 'string' && validCoordinates(v.lat, v.lng)));
  const [headerSettings, setHeaderSettings] = useState<HeaderCustomizationSettings>(() =>
    readStored('evn_header_settings', DEFAULT_HEADER_SETTINGS, (v: any) =>
      v && typeof v === 'object' && typeof v.appTitle === 'string' && Array.isArray(v.customFields)
    )
  );
  const [rates, setRates] = useState<MaintenanceRates>(() => readStored('evn_maintenance_rates', DEFAULT_MAINTENANCE_RATES,
    (v: any) => v && typeof v === 'object' &&
      v.baseCostByVoltage && typeof v.baseCostByVoltage === 'object' &&
      Object.values(v.baseCostByVoltage).every((n: any) => Number.isFinite(n) && n >= 0) &&
      Number.isFinite(v.costPerInsulator) && v.costPerInsulator >= 0 &&
      Number.isFinite(v.distanceAllowancePerKm) && v.distanceAllowancePerKm >= 0
  ));
  const [poles, setPoles] = useState<ElectricPole[]>(() => readStored('evn_poles_data', getInitialPoles(depot, rates),
    (v: any) => Array.isArray(v) && v.every(p => p && typeof p.id === 'string' && typeof p.code === 'string' && typeof p.name === 'string' && typeof p.address === 'string' && validCoordinates(p.lat, p.lng) && Number.isFinite(p.insulatorCount) && Number.isFinite(p.maintenanceCostVnd) && Number.isFinite(p.distanceFromBaseKm) && (!p.tasks || Array.isArray(p.tasks) && p.tasks.every((t: any) => t && t.baseRates && t.positionCoefficients))))
    .map(p => {
      if (!p.tasks) return p;
      const estimate = calculateEVNMultiTaskCost(p.tasks, p.distanceFromBaseKm, rates, p.estimateOptions);
      return { ...p, evnCostBreakdown: estimate, maintenanceCostVnd: estimate.totalEstimatedCost };
    }));
  const [storageError, setStorageError] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('map_route');
  const [mobileSubView, setMobileSubView] = useState<'map' | 'route'>('map');
  const [selectedPoleId, setSelectedPoleId] = useState<string | null>(null);

  // Drawer & Modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isHeaderSettingsOpen, setIsHeaderSettingsOpen] = useState<boolean>(false);

  // Map picking state
  const [isPickingLocation, setIsPickingLocation] = useState<boolean>(false);
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);

  // Route result
  const [routeResult, setRouteResult] = useState<RouteOptimizationResult | null>(null);

  useEffect(() => {
    const outcomes = [
      writeStored('evn_workplace_depot', depot),
      writeStored('evn_maintenance_rates', rates),
      writeStored('evn_poles_data', poles),
      writeStored('evn_header_settings', headerSettings),
    ];
    setStorageError(outcomes.some((ok) => !ok));
  }, [depot, rates, poles, headerSettings]);

  const handleSaveHeaderSettings = (newSettings: HeaderCustomizationSettings) => {
    setHeaderSettings(newSettings);
    if (
      (newSettings.unitName && newSettings.unitName !== depot.name) ||
      (newSettings.unitAddress && newSettings.unitAddress !== depot.address)
    ) {
      setDepot((prev) => ({
        ...prev,
        name: newSettings.unitName || prev.name,
        address: newSettings.unitAddress || prev.address,
      }));
    }
  };

  // In-page Visual Layout / Frame Edit Mode
  const [isVisualEditMode, setIsVisualEditMode] = useState<boolean>(false);
  const [draggedNavbarIndex, setDraggedNavbarIndex] = useState<number | null>(null);
  const [quickEditingFieldId, setQuickEditingFieldId] = useState<string | null>(null);
  const [quickFieldVal, setQuickFieldVal] = useState<string>('');

  const handleMoveNavbarField = (index: number, direction: 'prev' | 'next') => {
    const target = direction === 'prev' ? index - 1 : index + 1;
    if (target < 0 || target >= headerSettings.customFields.length) return;
    const nextFields = [...headerSettings.customFields];
    const [moved] = nextFields.splice(index, 1);
    nextFields.splice(target, 0, moved);
    setHeaderSettings((prev) => ({ ...prev, customFields: nextFields }));
  };

  const handleDropNavbarField = (targetIndex: number) => {
    if (draggedNavbarIndex === null || draggedNavbarIndex === targetIndex) return;
    const nextFields = [...headerSettings.customFields];
    const [moved] = nextFields.splice(draggedNavbarIndex, 1);
    nextFields.splice(targetIndex, 0, moved);
    setHeaderSettings((prev) => ({ ...prev, customFields: nextFields }));
    setDraggedNavbarIndex(null);
  };

  const handleDeleteNavbarField = (fieldId: string) => {
    const field = headerSettings.customFields.find((f) => f.id === fieldId);
    if (window.confirm(`Xóa trường "${field?.label || ''}" khỏi khung tiêu đề?`)) {
      setHeaderSettings((prev) => ({
        ...prev,
        customFields: prev.customFields.filter((f) => f.id !== fieldId),
      }));
    }
  };

  const handleStartQuickEdit = (field: { id: string; value: string }) => {
    setQuickEditingFieldId(field.id);
    setQuickFieldVal(field.value);
  };

  const handleSaveQuickEdit = (fieldId: string) => {
    setHeaderSettings((prev) => ({
      ...prev,
      customFields: prev.customFields.map((f) =>
        f.id === fieldId ? { ...f, value: quickFieldVal.trim() } : f
      ),
    }));
    setQuickEditingFieldId(null);
  };

  // Re-calculate route when poles or rates or depot change
  useEffect(() => {
    if (poles.length > 0) {
      setRouteResult(previous => optimizeRoute(depot, poles, rates, previous?.vehicleType || 'motorbike', previous?.isRoundTrip ?? true));
    } else {
      setRouteResult(null);
    }
  }, [depot, poles, rates]);

  // Recalculate pole costs if rates change
  const handleSaveRates = (newRates: MaintenanceRates) => {
    setRates(newRates);
    setPoles((prevPoles) =>
      prevPoles.map((p) => {
        if (p.tasks) {
          const breakdown = calculateEVNMultiTaskCost(p.tasks, p.distanceFromBaseKm, newRates, p.estimateOptions);
          return {
            ...p,
            evnCostBreakdown: breakdown,
            maintenanceCostVnd: breakdown.totalEstimatedCost,
          };
        }
        return {
          ...p,
          maintenanceCostVnd: calculatePoleTotalCost(
            {
              voltageLevel: p.voltageLevel,
              insulatorCount: p.insulatorCount,
              crossarmType: p.crossarmType,
              poleStructure: p.poleStructure,
              distanceFromBaseKm: p.distanceFromBaseKm,
            },
            newRates
          ),
        };
      })
    );
  };

  // Add new pole
  const handleSaveNewPole = (newPoleData: Omit<ElectricPole, 'id' | 'createdAt'>) => {
    const newPole: ElectricPole = {
      ...newPoleData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    setPoles((prev) => [newPole, ...prev]);
    setSelectedPoleId(newPole.id);
  };

  // Delete pole
  const handleDeletePole = (poleId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa trụ này khỏi tuyến kiểm tra?')) {
      setPoles((prev) => prev.filter((p) => p.id !== poleId));
      if (selectedPoleId === poleId) setSelectedPoleId(null);
    }
  };

  // Handle map click
  const handleMapClickLocation = (lat: number, lng: number, address?: string) => {
    setPickedCoords({ lat, lng, address });
    if (isPickingLocation) {
      setIsPickingLocation(false);
      setIsAddModalOpen(true);
    }
  };

  // Update existing pole (e.g. from EVNCostBreakdownView task edits)
  const handleUpdatePole = (updatedPole: ElectricPole) => {
    setPoles((prev) =>
      prev.map((p) => (p.id === updatedPole.id ? updatedPole : p))
    );
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (
      window.confirm(
        'Khôi phục lại dữ liệu mẫu ban đầu gồm 8 trụ điện thực tế Phường Bình Minh, TP Tây Ninh (Lộ 471 & 473)?'
      )
    ) {
      const initial = getInitialPoles(DEFAULT_DEPOT, DEFAULT_MAINTENANCE_RATES);
      setDepot(DEFAULT_DEPOT);
      setRates(DEFAULT_MAINTENANCE_RATES);
      setHeaderSettings(DEFAULT_HEADER_SETTINGS);
      setPoles(initial);
      setSelectedPoleId(null);
    }
  };

  // Exports
  const handleExportExcel = () => {
    exportFullReportToExcel(poles, routeResult, depot, rates);
  };

  const handleExportCsv = () => {
    exportPolesToCsv(poles, depot, rates);
  };

  const totalCostAllPoles = poles.reduce((acc, p) => acc + p.maintenanceCostVnd, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {storageError && <div role="alert" className="bg-amber-50 p-3 text-sm text-amber-900">Không thể lưu trên trình duyệt (bộ nhớ đầy hoặc bị chặn). Hãy xuất báo cáo để giữ dữ liệu trước khi đóng trang.</div>}
      {/* Top Bar Navigation with Hamburger Menu and Slide-out Drawer */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'map_route') {
            setMobileSubView('map');
          }
        }}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenRates={() => setIsRatesModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenHeaderSettings={() => setIsHeaderSettingsOpen(true)}
        onExportExcel={handleExportExcel}
        onExportCsv={handleExportCsv}
        onResetData={handleResetData}
        poleCount={poles.length}
        depot={depot}
        headerSettings={headerSettings}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={setIsDrawerOpen}
      />

      {/* Main Viewport Content - pb-24 ensures sticky bottom bar never overlaps content on mobile */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 pb-24 sm:pb-6">
        {/* Context Bar: Workplace Depot Info & Quick Actions & Dynamic Header Fields */}
        <div
          className={`transition-all ${
            FRAME_RADIUS_MAP[headerSettings.frameBorderRadius || 'rounded-xl']?.class || 'rounded-xl'
          } ${
            FRAME_BORDER_STYLE_MAP[headerSettings.frameBorderStyle || 'solid']?.class || 'border border-solid'
          } ${
            FRAME_BORDER_COLOR_MAP[headerSettings.frameBorderColor || 'slate']?.class || 'border-slate-200'
          } ${
            FRAME_BG_COLOR_MAP[headerSettings.frameBgColor || 'white']?.class || 'bg-white'
          } ${
            FRAME_SHADOW_MAP[headerSettings.frameShadow || 'sm']?.class || 'shadow-2xs'
          } ${
            FRAME_PADDING_MAP[headerSettings.framePadding || 'normal']?.class || 'p-3.5 sm:p-4'
          } space-y-2.5 ${isVisualEditMode ? 'ring-2 ring-sky-400 ring-offset-2' : ''}`}
        >
          {/* Visual Edit Mode Active Banner */}
          {isVisualEditMode && (
            <div className="bg-sky-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-200 shrink-0" />
                <span>Chế độ thiết kế: Bạn có thể kéo thả trực tiếp các trường, bấm mũi tên đổi chỗ hoặc sửa/xóa tại chỗ</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsHeaderSettingsOpen(true)}
                  className="px-2.5 py-1 bg-white text-sky-900 rounded font-bold hover:bg-sky-50 text-[11px] cursor-pointer"
                >
                  Vẽ khung chi tiết
                </button>
                <button
                  type="button"
                  onClick={() => setIsVisualEditMode(false)}
                  className="px-2.5 py-1 bg-sky-950 text-white rounded font-bold hover:bg-black text-[11px] cursor-pointer"
                >
                  ✓ Hoàn tất
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 font-bold text-sm shadow-2xs">
                {headerSettings.brandIcon || '⚡'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-sky-700 truncate">
                    {headerSettings.parentOrganization ? `${headerSettings.parentOrganization} · Đội QLVH` : 'Đội QLVH Đường Dây'}
                  </span>
                  {headerSettings.showGpsBadge && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
                        GPS: {depot.lat.toFixed(4)}, {depot.lng.toFixed(4)}
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsHeaderSettingsOpen(true)}
                    className="text-slate-400 hover:text-sky-600 cursor-pointer ml-1 text-xs inline-flex items-center gap-1"
                    title="Có thể edit thông số đơn vị (Tên, địa chỉ, cơ quan cấp trên, GPS)"
                  >
                    <Pencil className="w-3 h-3 text-sky-600" />
                    <span className="text-[10px] text-sky-700 font-bold underline">Edit thông số</span>
                  </button>
                </div>
                <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {headerSettings.unitName || depot.name}
                </h1>
                <div className="text-[11px] text-slate-500 truncate">
                  {headerSettings.unitAddress || depot.address}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 ml-auto flex-wrap">
              {headerSettings.showTotalCostBadge && (
                <div className="text-right hidden sm:block mr-1">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    Định mức toàn tuyến
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatVnd(totalCostAllPoles)}
                  </span>
                </div>
              )}

              {/* In-page Visual Mode Toggle Button */}
              <button
                type="button"
                onClick={() => setIsVisualEditMode(!isVisualEditMode)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer min-h-[38px] shadow-2xs ${
                  isVisualEditMode
                    ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-300'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
                title="Bật/tắt chế độ kéo thả & sửa trực tiếp khung tiêu đề"
              >
                <Move className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">{isVisualEditMode ? 'Đang sửa' : 'Kéo thả'}</span>
                <span className="sm:hidden">{isVisualEditMode ? 'Xong' : 'Sửa'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsHeaderSettingsOpen(true)}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold rounded-lg border border-sky-300 transition-colors cursor-pointer min-h-[38px] shadow-2xs"
                title="Tùy chỉnh giao diện khung tiêu đề, vẽ khung & thêm các trường"
              >
                <Palette className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden sm:inline">Tùy chỉnh giao diện</span>
                <span className="sm:hidden">Giao diện</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPickingLocation(!isPickingLocation);
                  setActiveTab('map_route');
                  setMobileSubView('map');
                }}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors cursor-pointer min-h-[38px]"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ghim bản đồ</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                title="Khôi phục dữ liệu mẫu ban đầu"
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Render Dynamic Custom Fields in Context Bar with DRAG & DROP and INLINE EDITING */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Thông tin tuyến:
            </span>

            {headerSettings.customFields
              .filter((f) => f.showInNavbar && f.value?.trim())
              .map((field, idx) => {
                const badgeStyle = BADGE_COLOR_MAP[field.badgeType] || BADGE_COLOR_MAP.primary;
                const isQuickEditing = quickEditingFieldId === field.id;

                if (isQuickEditing) {
                  return (
                    <div
                      key={field.id}
                      className="inline-flex items-center gap-1 bg-white p-1 rounded-md border border-sky-400 shadow-xs"
                    >
                      <span className="text-[10px] font-bold text-slate-600 pl-1">{field.label}:</span>
                      <input
                        type="text"
                        autoFocus
                        value={quickFieldVal}
                        onChange={(e) => setQuickFieldVal(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveQuickEdit(field.id)}
                        className="px-1.5 py-0.5 text-xs border border-slate-300 rounded font-medium text-slate-900 w-32"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveQuickEdit(field.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        title="Lưu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickEditingFieldId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={field.id}
                    draggable={isVisualEditMode}
                    onDragStart={() => isVisualEditMode && setDraggedNavbarIndex(idx)}
                    onDragOver={(e) => isVisualEditMode && e.preventDefault()}
                    onDrop={() => isVisualEditMode && handleDropNavbarField(idx)}
                    className={`group inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md border font-medium transition-all ${
                      badgeStyle.bg
                    } ${badgeStyle.text} ${badgeStyle.border} ${
                      isVisualEditMode
                        ? 'cursor-move ring-1 ring-sky-300 hover:ring-2 hover:ring-sky-500 scale-[1.02]'
                        : ''
                    }`}
                  >
                    {isVisualEditMode && (
                      <GripVertical className="w-3 h-3 text-slate-400 cursor-grab shrink-0" />
                    )}

                    <strong className="font-semibold">{field.label}:</strong>
                    <span>{field.value}</span>

                    {/* In-page visual editing controls */}
                    {isVisualEditMode && (
                      <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-slate-300/60">
                        <button
                          type="button"
                          onClick={() => handleMoveNavbarField(idx, 'prev')}
                          disabled={idx === 0}
                          className="p-0.5 hover:bg-black/10 rounded cursor-pointer disabled:opacity-20"
                          title="Dịch sang trái"
                        >
                          <ArrowLeft className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveNavbarField(idx, 'next')}
                          disabled={idx === headerSettings.customFields.length - 1}
                          className="p-0.5 hover:bg-black/10 rounded cursor-pointer disabled:opacity-20"
                          title="Dịch sang phải"
                        >
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartQuickEdit(field)}
                          className="p-0.5 hover:bg-black/10 rounded cursor-pointer text-blue-700"
                          title="Sửa nhanh giá trị trường"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNavbarField(field.id)}
                          className="p-0.5 hover:bg-rose-100 rounded cursor-pointer text-rose-600"
                          title="Xóa trường này"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            {isVisualEditMode && (
              <button
                type="button"
                onClick={() => setIsHeaderSettingsOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm trường</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Map & Route View */}
        {activeTab === 'map_route' && (
          <div className="space-y-4">
            {/* Mobile Fast Segmented Switcher (Visible on mobile screens) */}
            <div className="lg:hidden flex items-center p-1 bg-slate-200/80 rounded-xl">
              <button
                type="button"
                onClick={() => setMobileSubView('map')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[40px] cursor-pointer ${
                  mobileSubView === 'map'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Map className="w-3.5 h-3.5 text-blue-600" />
                <span>Bản đồ toàn cảnh</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileSubView('route')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[40px] cursor-pointer ${
                  mobileSubView === 'route'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Route className="w-3.5 h-3.5 text-sky-600" />
                <span>Chi tiết lộ trình & xăng</span>
              </button>
            </div>

            {/* Grid Container: On Desktop shows side-by-side; On Mobile toggles */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Route Planner (Shown on Desktop OR when mobileSubView === 'route') */}
              <div
                className={`lg:col-span-5 space-y-4 ${
                  mobileSubView === 'route' ? 'block' : 'hidden lg:block'
                }`}
              >
                <RoutePlanner
                  depot={depot}
                  poles={poles}
                  rates={rates}
                  routeResult={routeResult}
                  onUpdateRouteResult={(newResult) => setRouteResult(newResult)}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                  onUpdateRates={handleSaveRates}
                  onSelectPole={(id) => {
                    setSelectedPoleId(id);
                    setMobileSubView('map');
                  }}
                />
              </div>

              {/* Right Column: Leaflet Map (Shown on Desktop OR when mobileSubView === 'map') */}
              <div
                className={`lg:col-span-7 h-[500px] sm:h-[580px] lg:h-[640px] sticky top-20 ${
                  mobileSubView === 'map' ? 'block' : 'hidden lg:block'
                }`}
              >
                <MapContainer
                  depot={depot}
                  poles={poles}
                  selectedPoleId={selectedPoleId}
                  onSelectPole={(id) => setSelectedPoleId(id)}
                  onMapClickLocation={handleMapClickLocation}
                  routeResult={routeResult}
                  isPickingLocation={isPickingLocation}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Photo Inspector (Full Width Dedicated Studio) */}
        {activeTab === 'ai_inspect' && (
          <div className="space-y-6">
            <AIPoleInspector
              depot={depot}
              rates={rates}
              onSavePole={(pole) => {
                handleSaveNewPole(pole);
                setActiveTab('map_route');
                setMobileSubView('map');
              }}
            />
          </div>
        )}

        {/* Tab 3: Pole Ledger View (High Density Spreadsheet / Touch Cards) */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <PoleLedger
              poles={poles}
              selectedPoleId={selectedPoleId}
              onSelectPole={(id) => {
                setSelectedPoleId(id);
                setActiveTab('map_route');
                setMobileSubView('map');
              }}
              onDeletePole={handleDeletePole}
              onUpdatePole={handleUpdatePole}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              depot={depot}
              rates={rates}
              onUpdateRates={handleSaveRates}
              routeResult={routeResult}
            />
          </div>
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomBar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        mobileSubView={mobileSubView}
        onSetMobileSubView={setMobileSubView}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        poleCount={poles.length}
      />

      {/* Manual Check-in / Add Pole Modal */}
      {isAddModalOpen && (
        <ManualCheckInModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setPickedCoords(null);
          }}
          depot={depot}
          rates={rates}
          onUpdateRates={handleSaveRates}
          initialCoords={pickedCoords || undefined}
          onSavePole={(pole) => {
            handleSaveNewPole(pole);
            setPickedCoords(null);
          }}
        />
      )}

      {/* Rate Matrix Configuration Modal */}
      {isRatesModalOpen && (
        <RateSettingsModal
          isOpen={isRatesModalOpen}
          onClose={() => setIsRatesModalOpen(false)}
          rates={rates}
          onSaveRates={handleSaveRates}
        />
      )}

      {/* Official EVN Work Report & Printable Worksheet Modal */}
      {isReportModalOpen && (
        <WorkReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          depot={depot}
          poles={poles}
          rates={rates}
          routeResult={routeResult}
          headerSettings={headerSettings}
        />
      )}

      {/* Header and Interface Customization Modal */}
      {isHeaderSettingsOpen && (
        <HeaderSettingsModal
          isOpen={isHeaderSettingsOpen}
          onClose={() => setIsHeaderSettingsOpen(false)}
          settings={headerSettings}
          onSaveSettings={handleSaveHeaderSettings}
          totalCostVnd={totalCostAllPoles}
          depotCoords={{ lat: depot.lat, lng: depot.lng }}
        />
      )}
    </div>
  );
}
