import React, { useState, useEffect } from 'react';
import {
  CrossarmType,
  ElectricPole,
  MaintenanceRates,
  PoleStatus,
  PoleStructure,
  VoltageLevel,
  WorkplaceDepot,
} from '../types/pole';
import {
  calculateDistanceKm,
  calculateEVNMultiTaskCost,
  formatKm,
  formatVnd,
} from '../utils/calculations';
import { validCoordinates } from '../utils/storage';
import {
  createDefaultTasksForPole,
  getCrossarmOptions,
  getQuickInsulatorCounts,
  getStructureOptions,
} from '../data/seedData';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Pencil,
  Save,
  ShieldAlert,
  Wrench,
  X,
  Zap,
} from 'lucide-react';

interface EditPoleModalProps {
  isOpen: boolean;
  pole: ElectricPole | null;
  onClose: () => void;
  onSave: (updatedPole: ElectricPole) => void;
  depot: WorkplaceDepot;
  rates: MaintenanceRates;
}

export const EditPoleModal: React.FC<EditPoleModalProps> = ({
  isOpen,
  pole,
  onClose,
  onSave,
  depot,
  rates,
}) => {
  if (!isOpen || !pole) return null;

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form states initialized from selected pole
  const [code, setCode] = useState(pole.code);
  const [name, setName] = useState(pole.name);
  const [address, setAddress] = useState(pole.address);
  const [lat, setLat] = useState<number>(pole.lat);
  const [lng, setLng] = useState<number>(pole.lng);
  const [voltageLevel, setVoltageLevel] = useState<VoltageLevel>(pole.voltageLevel);
  const [insulatorCount, setInsulatorCount] = useState<number>(pole.insulatorCount);
  const [crossarmType, setCrossarmType] = useState<CrossarmType>(pole.crossarmType);
  const [crossarmDescription, setCrossarmDescription] = useState(
    pole.crossarmDescription || ''
  );
  const [poleStructure, setPoleStructure] = useState<PoleStructure>(pole.poleStructure);
  const [status, setStatus] = useState<PoleStatus>(pole.status);
  const [notes, setNotes] = useState(pole.notes || '');
  const [isLocating, setIsLocating] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Recalculate distance dynamically whenever coordinates or depot change
  const currentDistanceKm = calculateDistanceKm(depot.lat, depot.lng, lat, lng);

  // Dynamic preview of recalculation
  const currentTasks =
    pole.tasks ?? createDefaultTasksForPole();

  const previewBreakdown = calculateEVNMultiTaskCost(
    currentTasks,
    currentDistanceKm,
    rates,
    pole.estimateOptions,
    voltageLevel
  );

  // Sync state if pole prop changes
  useEffect(() => {
    if (pole) {
      setCode(pole.code);
      setName(pole.name);
      setAddress(pole.address);
      setLat(pole.lat);
      setLng(pole.lng);
      setVoltageLevel(pole.voltageLevel);
      setInsulatorCount(pole.insulatorCount);
      setCrossarmType(pole.crossarmType);
      setCrossarmDescription(pole.crossarmDescription || '');
      setPoleStructure(pole.poleStructure);
      setStatus(pole.status);
      setNotes(pole.notes || '');
    }
  }, [pole]);

  const handleGpsCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Thiết bị hoặc trình duyệt không hỗ trợ Geolocation API.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));
        setLat(latitude);
        setLng(longitude);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert('Không thể lấy tọa độ GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validCoordinates(lat, lng) || !Number.isInteger(insulatorCount) || insulatorCount < 0) {
      alert('Tọa độ hoặc số sứ không hợp lệ.');
      return;
    }
    if (!code.trim()) {
      alert('Vui lòng nhập mã số trụ điện.');
      return;
    }

    const recalculatedBreakdown = calculateEVNMultiTaskCost(
      currentTasks,
      currentDistanceKm,
      rates,
      pole.estimateOptions,
      voltageLevel
    );

    const updatedPole: ElectricPole = {
      ...pole,
      code: code.trim(),
      name: name.trim(),
      address: address.trim(),
      lat: Number(lat),
      lng: Number(lng),
      distanceFromBaseKm: currentDistanceKm,
      voltageLevel,
      insulatorCount: Number(insulatorCount) || 0,
      crossarmType,
      crossarmDescription: crossarmDescription.trim(),
      poleStructure,
      status,
      notes: notes.trim(),
      tasks: currentTasks,
      evnCostBreakdown: recalculatedBreakdown,
      maintenanceCostVnd: recalculatedBreakdown.totalEstimatedCost,
    };

    setSuccessToast(true);
    setTimeout(() => {
      onSave(updatedPole);
      onClose();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center transition-all duration-150 ${
        isFullscreen ? 'p-0' : 'p-0 sm:p-4'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-all ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none shadow-none border-0'
            : 'w-full h-full sm:h-auto sm:max-h-[92vh] max-w-full sm:max-w-3xl sm:rounded-2xl shadow-2xl border border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Maximize/Restore & Close Buttons */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white truncate">
                  Chỉnh Sửa Thông Tin Trụ Điện
                </h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/40 font-bold shrink-0">
                  {pole.code}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                Cập nhật thông số kỹ thuật, kiểu đà, kết cấu và tọa độ thực tế
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
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
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form
          id="edit-pole-form"
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 space-y-5 flex-1 min-h-0 overflow-y-auto"
        >
          {/* Notification Toast if saved */}
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã lưu cập nhật thành công! Hệ thống đang tự động tính lại dự toán...</span>
            </div>
          )}

          {/* Section 1: Định danh & Địa chỉ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>1. Thông tin định danh & vị trí</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã số trụ điện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  placeholder="Ví dụ: T01/471-BM"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên / Mô tả vị trí trụ
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Trụ néo rẽ nhánh ĐT.785"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ chi tiết (Ấp, Xã, Đường)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ví dụ: Đường Bời Lời, KP. Ninh Trung, P. Ninh Sơn, TP Tây Ninh"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Thông số kỹ thuật trụ & Đà xà */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>2. Đặc tính kỹ thuật, Kiểu đà & Sứ</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Cấp điện áp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cấp điện áp
                </label>
                <select
                  value={voltageLevel}
                  onChange={(e) => setVoltageLevel(e.target.value as VoltageLevel)}
                  className="w-full px-3 py-2 text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  {Object.keys(rates.baseCostByVoltage).map((v) => (
                    <option key={v} value={v}>
                      {v} ({formatVnd(rates.baseCostByVoltage[v] || 0)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loại kết cấu trụ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kết cấu trụ điện
                </label>
                <select
                  value={poleStructure}
                  onChange={(e) => setPoleStructure(e.target.value as PoleStructure)}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  {getStructureOptions(rates).map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label} ({st.sublabel || `x${st.multiplier}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Số cục sứ */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số lượng sứ (cục)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={insulatorCount}
                    onChange={(e) => setInsulatorCount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-bold font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <div className="flex gap-1 shrink-0 flex-wrap">
                    {getQuickInsulatorCounts(rates).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setInsulatorCount(cnt)}
                        className={`px-2 py-1.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ${
                          insulatorCount === cnt
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Kiểu đà / Tình trạng đà */}
            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2.5">
              <label className="block text-xs font-bold text-amber-900">
                Kiểu đà & Tình trạng đà xà
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {getCrossarmOptions(rates).map((arm) => {
                  const isSelected = crossarmType === arm.id;
                  return (
                    <button
                      key={arm.id}
                      type="button"
                      onClick={() => setCrossarmType(arm.id)}
                      className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{arm.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal truncate">
                          {arm.sublabel || `Hệ số ${arm.multiplier}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-amber-900 mb-1">
                  Mô tả chi tiết đà xà / Tình trạng vật lý
                </label>
                <input
                  type="text"
                  value={crossarmDescription}
                  onChange={(e) => setCrossarmDescription(e.target.value)}
                  placeholder="Ví dụ: Xà sắt V75x75 mạ kẽm nhúng nóng, có giằng tăng cường néo đôi"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Trạng thái vận hành */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tình trạng kiểm tra / Vận hành
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    val: 'inspected' as PoleStatus,
                    label: 'Bình thường',
                    desc: 'Đã kiểm tra an toàn',
                    color: 'emerald',
                  },
                  {
                    val: 'needs_maintenance' as PoleStatus,
                    label: 'Cần bảo trì Hotline',
                    desc: 'Có dấu hiệu rỉ sét/sứ dơ',
                    color: 'amber',
                  },
                  {
                    val: 'critical' as PoleStatus,
                    label: 'Nguy cấp / Khẩn cấp',
                    desc: 'Rạn nứt, phóng điện',
                    color: 'rose',
                  },
                ].map((s) => {
                  const isActive = status === s.val;
                  return (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setStatus(s.val)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isActive
                          ? s.color === 'emerald'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                            : s.color === 'amber'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                            : 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{s.label}</div>
                      <div className="text-[10px] text-slate-500">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Tọa độ GPS & Cự ly tuyến */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>3. Tọa độ GPS & Cự ly di chuyển từ Đội</span>
              </div>
              <button
                type="button"
                onClick={handleGpsCurrentLocation}
                disabled={isLocating}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
              >
                <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Đang định vị...' : 'Lấy GPS hiện tại'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vĩ độ (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kinh độ (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cự ly từ Đội QLVH ({depot.name.slice(0, 20)}...)
                </label>
                <div className="px-3 py-2 text-xs font-mono font-bold bg-sky-50 text-sky-900 border border-sky-200 rounded-lg flex items-center justify-between">
                  <span>{formatKm(currentDistanceKm)}</span>
                  <span className="text-[10px] font-sans font-normal text-sky-600">
                    Tự động tính
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Ghi chú hiện trường */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú công tác & hiện trường
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú về hành lang lưới điện, dây néo, điều kiện tiếp cận xe gàu Hotline..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Real-time EVN Quota Preview Box */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <Wrench className="w-3.5 h-3.5 text-sky-400" />
                Dự toán Hotline tính lại theo thông số mới:
              </span>
              <span className="text-base font-black font-mono text-emerald-400">
                {formatVnd(previewBreakdown.totalEstimatedCost)}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Trực tiếp (T):</span>
                <span className="font-mono text-slate-200">
                  {formatVnd(previewBreakdown.directCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Gián tiếp (GT 65%):</span>
                <span className="font-mono text-slate-200">
                  {formatVnd(previewBreakdown.totalIndirectCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vận chuyển (VC {formatKm(currentDistanceKm)}):</span>
                <span className="font-mono text-slate-200">
                  {formatVnd(previewBreakdown.totalTransportationCost)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">VAT 8% (GTGT):</span>
                <span className="font-mono text-slate-200">
                  {formatVnd(previewBreakdown.vatAmount)}
                </span>
              </div>
            </div>
          </div>

        </form>

        {/* Action Buttons Footer - Fixed at bottom, never overlaps content */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] text-slate-500 block font-medium">Dự toán Hotline mới:</span>
            <span className="font-mono font-black text-sm sm:text-base text-emerald-700 truncate">
              {formatVnd(previewBreakdown.totalEstimatedCost)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200 transition-colors min-h-[42px] cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="edit-pole-form"
              className="px-4 sm:px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 min-h-[42px] cursor-pointer"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>Lưu cập nhật trụ điện</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
