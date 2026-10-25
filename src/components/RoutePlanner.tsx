import React, { useState } from 'react';
import {
  ElectricPole,
  MaintenanceRates,
  RouteOptimizationResult,
  VehicleType,
  WorkplaceDepot,
} from '../types/pole';
import {
  formatKm,
  formatLiters,
  formatVnd,
  optimizeRoute,
} from '../utils/calculations';
import { exportRouteToCsv } from '../utils/exportUtils';
import {
  ArrowRight,
  Bike,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileSpreadsheet,
  Fuel,
  History,
  Lock,
  MapPin,
  Navigation,
  Pencil,
  RotateCcw,
  Route,
  Settings,
  Sparkles,
  Truck,
  Unlock,
  X,
  Zap,
} from 'lucide-react';

interface RoutePlannerProps {
  depot: WorkplaceDepot;
  poles: ElectricPole[];
  rates: MaintenanceRates;
  routeResult: RouteOptimizationResult | null;
  onUpdateRouteResult: (result: RouteOptimizationResult) => void;
  onOpenReportModal: () => void;
  onSelectPole: (poleId: string) => void;
  onUpdateRates?: (newRates: MaintenanceRates) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  depot,
  poles,
  rates,
  routeResult,
  onUpdateRouteResult,
  onOpenReportModal,
  onSelectPole,
}) => {
  const vehicleType = routeResult?.vehicleType ?? 'motorbike';
  const isRoundTrip = routeResult?.isRoundTrip ?? true;
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Fuel prices editing state
  const [isEditingFuelPrices, setIsEditingFuelPrices] = useState(false);
  const [petrolPriceInput, setPetrolPriceInput] = useState(rates.petrolPricePerLiterVnd || 23850);
  const [dieselPriceInput, setDieselPriceInput] = useState(rates.dieselPricePerLiterVnd || rates.fuelPricePerLiterVnd || 20490);

  const handleSaveFuelPrices = () => {
    const updatedRates: MaintenanceRates = {
      ...rates,
      petrolPricePerLiterVnd: Math.max(0, petrolPriceInput || 0),
      dieselPricePerLiterVnd: Math.max(0, dieselPriceInput || 0),
      fuelPricePerLiterVnd: Math.max(0, dieselPriceInput || 0),
    };
    onUpdateRates?.(updatedRates);
    setIsEditingFuelPrices(false);
    if (routeResult) {
      onUpdateRouteResult(optimizeRoute(depot, poles, updatedRates, vehicleType, isRoundTrip));
    }
  };

  // Admin/Mod fixed quota mode state
  const [isAdminFixedLocked, setIsAdminFixedLocked] = useState(rates.isFixedAllowanceEnabled || false);
  const [fixedTravelInput, setFixedTravelInput] = useState(rates.fixedTravelAllowanceVnd || 250000);
  const [fixedOperationInput, setFixedOperationInput] = useState(rates.fixedOperationAllowanceVnd || 1500000);
  const [isEditingFixedQuota, setIsEditingFixedQuota] = useState(false);

  const handleToggleAdminLock = () => {
    const nextState = !isAdminFixedLocked;
    setIsAdminFixedLocked(nextState);
    onUpdateRates?.({
      ...rates,
      isFixedAllowanceEnabled: nextState,
      fixedTravelAllowanceVnd: fixedTravelInput,
      fixedOperationAllowanceVnd: fixedOperationInput,
    });
  };

  const handleSaveFixedQuota = () => {
    const updatedRates: MaintenanceRates = {
      ...rates,
      isFixedAllowanceEnabled: true,
      fixedTravelAllowanceVnd: Math.max(0, fixedTravelInput || 0),
      fixedOperationAllowanceVnd: Math.max(0, fixedOperationInput || 0),
    };
    setIsAdminFixedLocked(true);
    onUpdateRates?.(updatedRates);
    setIsEditingFixedQuota(false);
  };

  // Trigger TSP Optimization
  const handleCalculateRoute = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const result = optimizeRoute(depot, poles, rates, vehicleType, isRoundTrip);
      onUpdateRouteResult(result);
      setIsOptimizing(false);
    }, 250);
  };

  // Re-calculate if vehicle changes
  const handleVehicleChange = (newVehicle: VehicleType) => {
    const result = optimizeRoute(depot, poles, rates, newVehicle, isRoundTrip);
    onUpdateRouteResult(result);
  };

  // Total maintenance costs across all poles
  const totalMaintenanceCostAllPoles = poles.reduce(
    (acc, pole) => acc + pole.maintenanceCostVnd,
    0
  );

  return (
    <div className="space-y-6">
      {/* Route Control Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs uppercase tracking-wider text-sky-700 font-semibold flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-sky-600" />
              <span>Thuật Toán Tối Ưu Lộ Trình (TSP) & Phân Bổ Nhiên Liệu</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Kế Hoạch Di Chuyển & Định Mức Xăng Dầu Hiện Trường
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCalculateRoute}
              disabled={poles.length === 0 || isOptimizing}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'Đang tối ưu...' : 'Tối ưu lại'}</span>
            </button>

            {routeResult && (
              <button
                type="button"
                onClick={() => exportRouteToCsv(routeResult, depot, rates)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                title="Tải lộ trình và phân bổ xăng dầu ra file CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Xuất CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReportModal}
              disabled={poles.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Báo cáo & Excel</span>
            </button>
          </div>
        </div>

        {/* Origin / Depot & Route Parameters */}
        <div className="grid grid-cols-1 gap-4">
          {/* Box 1: Depot Base */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Điểm xuất phát (Chỗ làm việc)</span>
            </div>
            <div className="font-bold text-slate-900">{depot.name}</div>
            <div className="text-slate-500 line-clamp-1">{depot.address}</div>
            <div className="text-[10px] text-slate-400 font-mono">
              GPS: {depot.lat.toFixed(5)}, {depot.lng.toFixed(5)}
            </div>
          </div>

          {/* Box 2: Vehicle Type Selector & Fuel Prices (GIÁ DẦU / GIÁ XĂNG) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-amber-600" />
                <span>Phương tiện & Giá nhiên liệu</span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingFuelPrices(!isEditingFuelPrices)}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                title="Chỉnh sửa đơn giá xăng và dầu"
              >
                <Pencil className="w-3 h-3" />
                <span>{isEditingFuelPrices ? 'Đóng' : 'Sửa giá xăng/dầu'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleVehicleChange('motorbike')}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  vehicleType === 'motorbike'
                    ? 'bg-white border-blue-600 text-blue-900 shadow-sm font-semibold'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-blue-600" />
                  <span>Xe máy (Xăng)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {rates.fuelConsumption.motorbikeLitersPer100Km} L/100km
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleVehicleChange('truck')}
                className={`py-2 px-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  vehicleType === 'truck'
                    ? 'bg-white border-blue-600 text-blue-900 shadow-sm font-semibold'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <span>Xe cẩu/tải (Dầu)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  {rates.fuelConsumption.truckLitersPer100Km} L/100km
                </div>
              </button>
            </div>

            {/* Giá Xăng & Giá Dầu hiển thị */}
            <div className="pt-1.5 border-t border-slate-200 text-[11px] flex items-center justify-between flex-wrap gap-2 text-slate-600 font-medium">
              <div className="flex items-center gap-3">
                <span>Giá Xăng: <strong className="text-blue-900 font-mono font-bold">{formatVnd(rates.petrolPricePerLiterVnd || 23850)}/L</strong></span>
                <span>Giá Dầu: <strong className="text-amber-900 font-mono font-bold">{formatVnd(rates.dieselPricePerLiterVnd || rates.fuelPricePerLiterVnd || 20490)}/L</strong></span>
              </div>
            </div>

            {/* Edit Fuel Prices Drawer */}
            {isEditingFuelPrices && (
              <div className="p-2.5 bg-white rounded-lg border border-amber-300 shadow-xs space-y-2 animate-in fade-in">
                <div className="text-xs font-bold text-amber-900">Cập nhật đơn giá nhiên liệu hiện hành:</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">Giá Xăng RON 95 (đ/L)</label>
                    <input
                      type="number"
                      step="500"
                      value={petrolPriceInput}
                      onChange={(e) => setPetrolPriceInput(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block">Giá Dầu DO 0,05S (đ/L)</label>
                    <input
                      type="number"
                      step="500"
                      value={dieselPriceInput}
                      onChange={(e) => setDieselPriceInput(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingFuelPrices(false)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFuelPrices}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded shadow-2xs cursor-pointer"
                  >
                    Lưu giá
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Box 3: Trip Mode (Round-trip vs One-way) */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>Phương án di chuyển</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Hotline: Mặc định khứ hồi
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (routeResult) {
                    onUpdateRouteResult(optimizeRoute(depot, poles, rates, vehicleType, true));
                  }
                }}
                className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  isRoundTrip
                    ? 'bg-white border-emerald-600 text-emerald-900 shadow-sm font-semibold'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div>Khứ hồi</div>
                <div className="text-[9px] text-slate-400">Về lại Đội QLVH</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (routeResult) {
                    onUpdateRouteResult(optimizeRoute(depot, poles, rates, vehicleType, false));
                  }
                }}
                className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  !isRoundTrip
                    ? 'bg-white border-emerald-600 text-emerald-900 shadow-sm font-semibold'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
                title="KHÔNG CÓ KHÁI NIỆM 1 CHIỀU - CHỖ NÀY ĐỂ TRỐNG CÓ THỂ THÊM SAU"
              >
                <div>Một chiều</div>
                <div className="text-[9px] text-slate-400">Kết thúc trụ cuối</div>
              </button>
            </div>

            <div className="text-[10px] text-slate-500 bg-slate-100/80 p-1.5 rounded border border-slate-200 leading-tight">
              💡 <em>Không có khái niệm 1 chiều trong Hotline (luôn khứ hồi Đội QLVH). Chỗ này để trống dự phòng mở rộng quy trình điều độ sau.</em>
            </div>
          </div>
        </div>
      </div>

      {/* Admin/Mod Lock Bar: CỐ ĐỊNH PHẦN ĐỊNH MỨC DI CHUYỂN + ĐỊNH MỨC VẬN HÀNH */}
      <div className="p-3 bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          {isAdminFixedLocked ? <Lock className="w-4 h-4 text-amber-400" /> : <Unlock className="w-4 h-4 text-sky-400" />}
          <div>
            <span className="font-bold">Admin/Mod: Cố định định mức di chuyển + vận hành</span>
            <span className="text-[11px] text-slate-300 block">
              {isAdminFixedLocked
                ? `Đang áp dụng khoán cố định: Di chuyển ${formatVnd(fixedTravelInput)} · Vận hành ${formatVnd(fixedOperationInput)}`
                : 'Tính tự động linh động theo cự ly thực tế và danh mục công tác'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {isAdminFixedLocked && (
            <button
              type="button"
              onClick={() => setIsEditingFixedQuota(!isEditingFixedQuota)}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Sửa mức khoán
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleAdminLock}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              isAdminFixedLocked
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            {isAdminFixedLocked ? '🔒 Đang cố định (Bật)' : '🔓 Bật cố định'}
          </button>
        </div>

        {/* Drawer for Admin Fixed Quotas */}
        {isAdminFixedLocked && isEditingFixedQuota && (
          <div className="w-full mt-2 pt-2 border-t border-white/10 flex items-center gap-3 flex-wrap animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-300">Định mức di chuyển khoán:</span>
              <input
                type="number"
                step="50000"
                value={fixedTravelInput}
                onChange={(e) => setFixedTravelInput(parseInt(e.target.value, 10) || 0)}
                className="w-32 px-2 py-1 bg-white text-slate-900 rounded font-mono font-bold text-xs"
              />
              <span className="text-xs text-slate-300">đ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-300">Định mức vận hành khoán:</span>
              <input
                type="number"
                step="100000"
                value={fixedOperationInput}
                onChange={(e) => setFixedOperationInput(parseInt(e.target.value, 10) || 0)}
                className="w-36 px-2 py-1 bg-white text-slate-900 rounded font-mono font-bold text-xs"
              />
              <span className="text-xs text-slate-300">đ</span>
            </div>
            <button
              type="button"
              onClick={handleSaveFixedQuota}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded"
            >
              Lưu mức khoán
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">Cự ly ước tính theo đường thẳng giữa các tọa độ. Tuyến vẽ trên bản đồ chưa phải chỉ dẫn theo đường bộ.</p>
      {/* KPI Cards: Distance, Fuel Quota, Fuel Expense, Maintenance Grand Total */}
      {routeResult && (
        <div className="grid grid-cols-2 xl:grid-cols-2 gap-4">
          {/* Card 1: Total Distance */}
          <div className="min-w-0 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
              <span>Tổng quãng đường</span>
              <Route className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-1">
              {formatKm(routeResult.totalDistanceKm)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Qua {routeResult.orderedPoles.length} vị trí trụ điện</span>
            </div>
          </div>

          {/* Card 2: Fuel Quota Allocated */}
          <div className="min-w-0 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
              <span>Định mức xăng dầu</span>
              <Fuel className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-600 font-mono mt-1">
              {formatLiters(routeResult.fuelUsedLiters)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {vehicleType === 'motorbike'
                ? `Xe máy (${rates.fuelConsumption.motorbikeLitersPer100Km} L/100km)`
                : `Xe cẩu (${rates.fuelConsumption.truckLitersPer100Km} L/100km)`}
            </div>
          </div>

          {/* Card 3: Fuel Cost */}
          <div className="min-w-0 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
              <span>Tiền nhiên liệu ({vehicleType === 'motorbike' ? 'Xăng' : 'Dầu'})</span>
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-900 font-mono mt-1">
              {isAdminFixedLocked
                ? formatVnd(fixedTravelInput)
                : formatVnd(routeResult.fuelCostVnd)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isAdminFixedLocked
                ? 'Định mức di chuyển cố định (Admin/Mod)'
                : `Giá: ${formatVnd(vehicleType === 'motorbike' ? (rates.petrolPricePerLiterVnd || 23850) : (rates.dieselPricePerLiterVnd || rates.fuelPricePerLiterVnd || 20490))}/lít`}
            </div>
          </div>

          {/* Card 4: Total Maintenance Quotas */}
          <div className="min-w-0 p-3 sm:p-4 bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-xl shadow-sm">
            <div className="text-[11px] font-semibold text-sky-300 uppercase flex items-center justify-between">
              <span>Tổng định mức bảo trì</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-white font-mono mt-1">
              {isAdminFixedLocked
                ? formatVnd(fixedOperationInput)
                : formatVnd(totalMaintenanceCostAllPoles)}
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {isAdminFixedLocked
                ? 'Định mức vận hành cố định (Admin/Mod)'
                : `${poles.length} trụ điện toàn tuyến`}
            </div>
          </div>
        </div>
      )}

      {/* Itinerary Steps & Turn-by-Turn Leg Table */}
      {routeResult && routeResult.legs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Lịch Trình Di Chuyển Tuần Tự Đề Xuất
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Ước tính thời gian: <strong className="font-mono text-slate-800">{Math.floor(routeResult.estimatedTravelTimeMinutes / 60)}h {routeResult.estimatedTravelTimeMinutes % 60}m</strong> (gồm di chuyển + tác nghiệp)
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">Chặng</th>
                  <th className="py-2.5 px-4">Điểm xuất phát</th>
                  <th className="py-2.5 px-2 w-8 text-center"></th>
                  <th className="py-2.5 px-4">Điểm đến (Trụ điện)</th>
                  <th className="py-2.5 px-4 text-right font-mono">Cự ly chặng</th>
                  <th className="py-2.5 px-4 text-right font-mono">Xăng tiêu thụ</th>
                  <th className="py-2.5 px-4 text-right font-mono">Định mức bảo trì</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routeResult.legs.map((leg, index) => {
                  const targetPole = routeResult.orderedPoles[index];
                  const legFuel =
                    (leg.distanceKm *
                      (vehicleType === 'motorbike'
                        ? rates.fuelConsumption.motorbikeLitersPer100Km
                        : rates.fuelConsumption.truckLitersPer100Km)) /
                    100;

                  return (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold text-slate-500 font-mono">
                        #{index + 1}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {leg.fromName}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400">
                        <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                      </td>
                      <td className="py-3 px-4">
                        {targetPole ? (
                          <button
                            type="button"
                            onClick={() => onSelectPole(targetPole.id)}
                            className="text-left group cursor-pointer"
                          >
                            <span className="font-bold text-sky-900 group-hover:underline">
                              {targetPole.code}
                            </span>
                            <span className="text-slate-500 block text-[11px]">
                              {targetPole.name} ({targetPole.insulatorCount} sứ ·{' '}
                              {targetPole.crossarmType === 'offset' ? 'Đà lệch' : 'Đà cân'})
                            </span>
                          </button>
                        ) : (
                          <span className="font-semibold text-slate-900">{leg.toName}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatKm(leg.distanceKm)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700">
                        {formatLiters(legFuel)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-950">
                        {targetPole ? formatVnd(targetPole.maintenanceCostVnd) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-slate-700">
                    Tổng cộng toàn hành trình:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900 text-sm">
                    {formatKm(routeResult.totalDistanceKm)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-700 text-sm">
                    {formatLiters(routeResult.fuelUsedLiters)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sky-950 text-sm">
                    {formatVnd(totalMaintenanceCostAllPoles)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Inset Itinerary Cards */}
          <div className="block md:hidden p-3 space-y-2.5">
            {routeResult.legs.map((leg, index) => {
              const targetPole = routeResult.orderedPoles[index];
              const legFuel =
                (leg.distanceKm *
                  (vehicleType === 'motorbike'
                    ? rates.fuelConsumption.motorbikeLitersPer100Km
                    : rates.fuelConsumption.truckLitersPer100Km)) /
                100;

              return (
                <div
                  key={index}
                  className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <span className="font-mono font-bold text-sky-800 text-[11px] px-2 py-0.5 rounded bg-sky-100">
                      Chặng #{index + 1}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatKm(leg.distanceKm)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 text-[11px]">
                    <span className="truncate max-w-[120px] font-medium">{leg.fromName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-bold text-slate-900">
                      {targetPole ? targetPole.code : leg.toName}
                    </span>
                  </div>

                  {targetPole && (
                    <div className="text-[11px] text-slate-500 truncate">
                      {targetPole.name} ({targetPole.insulatorCount} sứ · {targetPole.crossarmType === 'offset' ? 'Đà lệch' : 'Đà cân'})
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                    <span className="text-amber-800 font-mono">
                      Xăng: <strong>{formatLiters(legFuel)}</strong>
                    </span>
                    <span className="font-mono font-bold text-sky-950">
                      {targetPole ? formatVnd(targetPole.maintenanceCostVnd) : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BẢNG LỊCH SỬ THỰC HIỆN DỰ TOÁN HIỆN TRƯỜNG ("hiển thị lịch sử thực hiện dự toán") */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Lịch Sử Thực Hiện Dự Toán Hiện Trường
            </h3>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full font-mono">
              {poles.length} vị trí
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xem Báo cáo Chi tiết & Xuất Excel</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3 text-center w-10">STT</th>
                <th className="py-2.5 px-3">Mã số trụ</th>
                <th className="py-2.5 px-3">Tên vị trí / Tuyến</th>
                <th className="py-2.5 px-3 text-center">Cấp áp</th>
                <th className="py-2.5 px-3 text-center">Số sứ</th>
                <th className="py-2.5 px-3">Cây đà & Thân trụ</th>
                <th className="py-2.5 px-3 text-center">Số công tác</th>
                <th className="py-2.5 px-3 text-right font-mono">Dự toán định mức</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {poles.map((pole, idx) => {
                const taskCount = (pole.tasks || []).filter((t) => t.isSelected).length;
                return (
                  <tr
                    key={pole.id}
                    onClick={() => onSelectPole(pole.id)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-bold font-mono text-sky-900">
                      {pole.code}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <div>{pole.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{pole.address}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {pole.voltageLevel || '22kV'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                      {pole.insulatorCount}
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-[11px]">
                      <div>{pole.crossarmType === 'offset' ? 'Đà lệch (+35%)' : 'Đà cân tiêu chuẩn'}</div>
                      <div className="text-slate-400">
                        {pole.poleStructure === 'double'
                          ? 'Trụ đôi (+50%)'
                          : pole.poleStructure === 'steel_tower'
                          ? 'Tháp sắt'
                          : 'Trụ đơn'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                      {taskCount > 0 ? `${taskCount} công tác` : '1 công tác'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-950 text-sm">
                      {formatVnd(pole.maintenanceCostVnd)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        pole.status === 'inspected'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : pole.status === 'critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {pole.status === 'inspected' ? 'Đã kiểm tra' : pole.status === 'critical' ? 'Khẩn cấp' : 'Cần bảo trì'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
              <tr>
                <td colSpan={7} className="py-3 px-3 text-right uppercase text-slate-700">
                  Tổng chi phí định mức toàn bộ lịch sử ({poles.length} vị trí):
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-950 text-sm font-black">
                  {formatVnd(totalMaintenanceCostAllPoles)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
