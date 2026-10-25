import React, { useState } from 'react';
import {
  CrossarmType,
  ElectricPole,
  MaintenanceRates,
  PoleStructure,
  RouteOptimizationResult,
  VoltageLevel,
  WorkplaceDepot,
} from '../types/pole';
import {
  calculateEVNMultiTaskCost,
  formatKm,
  formatVnd,
} from '../utils/calculations';
import { createDefaultTasksForPole } from '../data/seedData';
import { EVNCostBreakdownView } from './EVNCostBreakdownView';
import { EditPoleModal } from './EditPoleModal';
import {
  exportFullReportToExcel,
  exportPolesToCsv,
} from '../utils/exportUtils';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Filter,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';

interface PoleLedgerProps {
  poles: ElectricPole[];
  selectedPoleId: string | null;
  onSelectPole: (poleId: string) => void;
  onDeletePole: (poleId: string) => void;
  onUpdatePole?: (updatedPole: ElectricPole) => void;
  onOpenAddModal: () => void;
  depot: WorkplaceDepot;
  rates: MaintenanceRates;
  onUpdateRates?: (rates: MaintenanceRates) => void;
  routeResult: RouteOptimizationResult | null;
}

export const PoleLedger: React.FC<PoleLedgerProps> = ({
  poles,
  selectedPoleId,
  onSelectPole,
  onDeletePole,
  onUpdatePole,
  onOpenAddModal,
  depot,
  rates,
  onUpdateRates,
  routeResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [voltageFilter, setVoltageFilter] = useState<string>('all');
  const [crossarmFilter, setCrossarmFilter] = useState<string>('all');
  const [structureFilter, setStructureFilter] = useState<string>('all');
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);
  const [editingPole, setEditingPole] = useState<ElectricPole | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Quick inline update handlers that immediately recalculate and update pole
  const handleQuickToggleCrossarm = (pole: ElectricPole) => {
    const newCrossarm: CrossarmType =
      pole.crossarmType === 'balanced' ? 'offset' : 'balanced';
    const tasks =
      pole.tasks ?? createDefaultTasksForPole();
    const newBreakdown = calculateEVNMultiTaskCost(
      tasks,
      pole.distanceFromBaseKm,
      rates,
      pole.estimateOptions
    );
    const updated: ElectricPole = {
      ...pole,
      crossarmType: newCrossarm,
      evnCostBreakdown: newBreakdown,
      maintenanceCostVnd: newBreakdown.totalEstimatedCost,
    };
    onUpdatePole?.(updated);
  };

  const handleQuickChangeStructure = (
    pole: ElectricPole,
    newStructure: PoleStructure
  ) => {
    const tasks =
      pole.tasks ?? createDefaultTasksForPole();
    const newBreakdown = calculateEVNMultiTaskCost(
      tasks,
      pole.distanceFromBaseKm,
      rates,
      pole.estimateOptions
    );
    const updated: ElectricPole = {
      ...pole,
      poleStructure: newStructure,
      evnCostBreakdown: newBreakdown,
      maintenanceCostVnd: newBreakdown.totalEstimatedCost,
    };
    onUpdatePole?.(updated);
  };

  const handleQuickChangeVoltage = (
    pole: ElectricPole,
    newVoltage: VoltageLevel
  ) => {
    const tasks =
      pole.tasks ?? createDefaultTasksForPole();
    const newBreakdown = calculateEVNMultiTaskCost(
      tasks,
      pole.distanceFromBaseKm,
      rates,
      pole.estimateOptions
    );
    const updated: ElectricPole = {
      ...pole,
      voltageLevel: newVoltage,
      evnCostBreakdown: newBreakdown,
      maintenanceCostVnd: newBreakdown.totalEstimatedCost,
    };
    onUpdatePole?.(updated);
  };

  const handleQuickChangeInsulator = (
    pole: ElectricPole,
    newCount: number
  ) => {
    if (!Number.isInteger(newCount) || newCount < 0) return;
    const tasks =
      pole.tasks ?? createDefaultTasksForPole();
    const newBreakdown = calculateEVNMultiTaskCost(
      tasks,
      pole.distanceFromBaseKm,
      rates,
      pole.estimateOptions
    );
    const updated: ElectricPole = {
      ...pole,
      insulatorCount: newCount,
      evnCostBreakdown: newBreakdown,
      maintenanceCostVnd: newBreakdown.totalEstimatedCost,
    };
    onUpdatePole?.(updated);
  };

  // Filtered list
  const filteredPoles = poles.filter((pole) => {
    const matchesSearch =
      pole.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pole.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pole.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVoltage =
      voltageFilter === 'all' || pole.voltageLevel === voltageFilter;
    const matchesCrossarm =
      crossarmFilter === 'all' || pole.crossarmType === crossarmFilter;
    const matchesStructure =
      structureFilter === 'all' || pole.poleStructure === structureFilter;

    return matchesSearch && matchesVoltage && matchesCrossarm && matchesStructure;
  });

  const totalCost = filteredPoles.reduce((acc, p) => acc + p.maintenanceCostVnd, 0);
  const totalInsulators = filteredPoles.reduce((acc, p) => acc + p.insulatorCount, 0);

  const handleExportExcel = () => {
    exportFullReportToExcel(filteredPoles, routeResult, depot, rates);
  };

  const handleExportCsv = () => {
    exportPolesToCsv(filteredPoles, depot, rates);
  };

  const getPoleBreakdown = (pole: ElectricPole) => {
    if (pole.evnCostBreakdown) return pole.evnCostBreakdown;
    const tasks =
      pole.tasks ?? createDefaultTasksForPole();
    return calculateEVNMultiTaskCost(tasks, pole.distanceFromBaseKm, rates, pole.estimateOptions);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
      {/* Top Ledger Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">
            Bảng Kê Trụ Điện & Dự Toán Tuyến ({filteredPoles.length}/{poles.length} vị trí)
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer min-h-[38px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer min-h-[38px]"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Thêm trụ mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="px-3.5 sm:px-4 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã trụ, ấp, xã..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Voltage filter */}
        <select
          value={voltageFilter}
          onChange={(e) => setVoltageFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
        >
          <option value="all">Tất cả cấp điện áp</option>
          <option value="0.4kV">0.4kV (Hạ thế)</option>
          <option value="22kV">22kV (Trung thế)</option>
          <option value="35kV">35kV</option>
          <option value="110kV">110kV (Cao thế)</option>
        </select>

        {/* Crossarm filter */}
        <select
          value={crossarmFilter}
          onChange={(e) => setCrossarmFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
        >
          <option value="all">Tất cả kiểu đà/xà</option>
          <option value="balanced">Đà lắp cân</option>
          <option value="offset">Đà lắp lệch (Offset)</option>
        </select>

        {/* Structure filter */}
        <select
          value={structureFilter}
          onChange={(e) => setStructureFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
        >
          <option value="all">Tất cả loại trụ</option>
          <option value="single">Trụ đơn</option>
          <option value="double">Trụ đôi (chữ H)</option>
          <option value="steel_tower">Tháp sắt</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">STT</th>
              <th className="py-2.5 px-3">Mã trụ & Tên</th>
              <th className="py-2.5 px-3">Địa chỉ (Ấp, Xã)</th>
              <th className="py-2.5 px-2 text-center">Cấp áp</th>
              <th className="py-2.5 px-2 text-center font-mono">Số sứ</th>
              <th className="py-2.5 px-2 text-center">Kiểu đà</th>
              <th className="py-2.5 px-2 text-center">Kết cấu</th>
              <th className="py-2.5 px-2 text-right font-mono">Cự ly</th>
              <th className="py-2.5 px-3 text-right font-mono">Dự toán định mức</th>
              <th className="py-2.5 px-2 text-center">Bóc tách EVN</th>
              <th className="py-2.5 px-3 text-center w-20">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPoles.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  Không tìm thấy trụ điện nào phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              filteredPoles.map((pole, index) => {
                const isSelected = pole.id === selectedPoleId;
                const isOffset = pole.crossarmType === 'offset';
                const isDouble = pole.poleStructure === 'double';
                const breakdown = getPoleBreakdown(pole);
                const isBreakdownOpen = expandedBreakdownId === pole.id;

                return (
                  <React.Fragment key={pole.id}>
                    <tr
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-sky-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-semibold">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 font-mono">
                          {pole.code}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {pole.name}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                        {pole.address}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <select
                          value={pole.voltageLevel}
                          onChange={(e) => handleQuickChangeVoltage(pole, e.target.value as VoltageLevel)}
                          title="Nhấn để đổi cấp điện áp"
                          className="font-mono px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="22kV">22kV</option>
                          <option value="0.4kV">0.4kV</option>
                          <option value="35kV">35kV</option>
                          <option value="110kV">110kV</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center gap-1 font-mono">
                          <button
                            type="button"
                            onClick={() => handleQuickChangeInsulator(pole, Math.max(1, pole.insulatorCount - 1))}
                            className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center cursor-pointer"
                            title="Giảm 1 sứ"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-900 min-w-[16px] text-center">
                            {pole.insulatorCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickChangeInsulator(pole, pole.insulatorCount + 1)}
                            className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center cursor-pointer"
                            title="Tăng 1 sứ"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickToggleCrossarm(pole)}
                          title="Nhấn để chuyển nhanh Đà cân <-> Đà lệch"
                          className="cursor-pointer group inline-flex items-center"
                        >
                          {isOffset ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 group-hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors flex items-center gap-1">
                              ĐÀ LỆCH
                              <Pencil className="w-2.5 h-2.5 text-amber-600 opacity-60 group-hover:opacity-100" />
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 group-hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors flex items-center gap-1">
                              Đà cân
                              <Pencil className="w-2.5 h-2.5 text-emerald-600 opacity-60 group-hover:opacity-100" />
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-center text-[11px]">
                        <select
                          value={pole.poleStructure}
                          onChange={(e) => handleQuickChangeStructure(pole, e.target.value as PoleStructure)}
                          title="Nhấn để đổi kết cấu trụ"
                          className="text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="single">Trụ đơn</option>
                          <option value="double">Trụ đôi</option>
                          <option value="steel_tower">Tháp sắt</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-700">
                        {formatKm(pole.distanceFromBaseKm)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-sky-900">
                        {formatVnd(pole.maintenanceCostVnd)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBreakdownId(isBreakdownOpen ? null : pole.id)
                          }
                          className="px-2 py-1 text-[11px] font-medium rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1 mx-auto cursor-pointer"
                          title="Xem công thức đa bước 4 thành phần & hệ số đồng thời"
                        >
                          <Calculator className="w-3 h-3 text-sky-600" />
                          <span>{isBreakdownOpen ? 'Đóng' : 'Chi tiết'}</span>
                          {isBreakdownOpen ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPole(pole);
                              setIsEditModalOpen(true);
                            }}
                            title="Chỉnh sửa thông tin trụ điện (Loại trụ, đà, sứ, GPS, ghi chú...)"
                            className="p-1.5 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectPole(pole.id)}
                            title="Định vị trên bản đồ"
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePole(pole.id)}
                            title="Xóa trụ"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable sub-row with EVNCostBreakdownView */}
                    {isBreakdownOpen && (
                      <tr className="bg-sky-50/40">
                        <td colSpan={11} className="p-3">
                          <div className="max-w-4xl mx-auto">
                            <EVNCostBreakdownView
                              breakdown={breakdown}
                              distanceKm={pole.distanceFromBaseKm}
                              initiallyExpanded={true}
                              tasks={pole.tasks}
                              rates={rates}
                              onUpdateTasks={(newTasks) => {
                                const newBreakdown = calculateEVNMultiTaskCost(
                                  newTasks,
                                  pole.distanceFromBaseKm,
                                  rates,
                                  pole.estimateOptions
                                );
                                const updatedPole: ElectricPole = {
                                  ...pole,
                                  tasks: newTasks,
                                  evnCostBreakdown: newBreakdown,
                                  maintenanceCostVnd: newBreakdown.totalEstimatedCost,
                                };
                                onUpdatePole?.(updatedPole);
                              }}
                              estimateOptions={pole.estimateOptions}
                              onApplyOptions={(options) => {
                                const estimate = calculateEVNMultiTaskCost(pole.tasks ?? [], pole.distanceFromBaseKm, rates, options);
                                onUpdatePole?.({ ...pole, estimateOptions: options, evnCostBreakdown: estimate, maintenanceCostVnd: estimate.totalEstimatedCost });
                              }}
                              editable={true}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
          <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
            <tr>
              <td colSpan={4} className="py-3 px-4 text-right uppercase text-slate-700">
                Tổng cộng ({filteredPoles.length} trụ):
              </td>
              <td className="py-3 px-2 text-center font-mono text-slate-900">
                {totalInsulators} sứ
              </td>
              <td colSpan={3}></td>
              <td className="py-3 px-3 text-right font-mono text-sky-950 text-sm">
                {formatVnd(totalCost)}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile Inset Card List View (Strict Inset Frame, Safe Margins, No Full-Bleed) */}
      <div className="block md:hidden px-3 sm:px-4 pb-4 space-y-3.5">
        {filteredPoles.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Không tìm thấy trụ điện nào phù hợp bộ lọc.
          </div>
        ) : (
          filteredPoles.map((pole, index) => {
            const isSelected = pole.id === selectedPoleId;
            const isOffset = pole.crossarmType === 'offset';
            const isDouble = pole.poleStructure === 'double';
            const breakdown = getPoleBreakdown(pole);
            const selectedTasksCount =
              pole.tasks?.filter((t) => t.isSelected).length ??
              breakdown.tasksCount;

            return (
              <div
                key={pole.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/30 ring-1 ring-sky-300 shadow-sm'
                    : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Card Top: Code, Voltage, Index & Crossarm badge */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-slate-400 text-xs font-semibold">
                      #{index + 1}
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm truncate">
                      {pole.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700">
                      {pole.voltageLevel}
                    </span>
                    {/* Crossarm quick-toggle button */}
                    <button
                      type="button"
                      onClick={() => handleQuickToggleCrossarm(pole)}
                      title="Nhấn để đổi kiểu đà"
                      className="cursor-pointer"
                    >
                      {isOffset ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 flex items-center gap-0.5">
                          Đà lệch <Pencil className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-0.5">
                          Đà cân <Pencil className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Body: Name & Address */}
                <div className="py-2 space-y-0.5">
                  <div className="font-semibold text-slate-900 text-xs">{pole.name}</div>
                  <div className="text-[11px] text-slate-500 leading-snug">{pole.address}</div>
                </div>

                {/* Card Grid Stats */}
                <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50/90 rounded-lg p-2 text-[11px] text-slate-600 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Số cục sứ:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {pole.insulatorCount} cục
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kết cấu trụ:</span>
                    <span className="font-medium text-slate-800">
                      {isDouble
                        ? 'Trụ đôi'
                        : pole.poleStructure === 'steel_tower'
                        ? 'Tháp sắt'
                        : 'Trụ đơn'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cự ly tuyến:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatKm(pole.distanceFromBaseKm)}
                    </span>
                  </div>
                </div>

                {/* Selected EVN Tasks summary tag */}
                <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded bg-sky-50/60 border border-sky-100 text-sky-900">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Wrench className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">
                      Công tác: <strong>{selectedTasksCount} hạng mục</strong> (sứ, đà, cột...)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-sky-700 font-bold shrink-0">
                    ĐM 68
                  </span>
                </div>

                {/* Expandable Calculation Tab showing full multi-step formula directly in card */}
                <div className="pt-1">
                  <EVNCostBreakdownView
                    breakdown={breakdown}
                    distanceKm={pole.distanceFromBaseKm}
                    initiallyExpanded={false}
                    tasks={pole.tasks}
                    rates={rates}
                    onUpdateTasks={(newTasks) => {
                      const newBreakdown = calculateEVNMultiTaskCost(
                        newTasks,
                        pole.distanceFromBaseKm,
                        rates
                      );
                      const updatedPole: ElectricPole = {
                        ...pole,
                        tasks: newTasks,
                        evnCostBreakdown: newBreakdown,
                        maintenanceCostVnd: newBreakdown.totalEstimatedCost,
                      };
                      onUpdatePole?.(updatedPole);
                    }}
                    editable={true}
                  />
                </div>

                {/* Card Footer: Quick Actions with safe 44px touch targets */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Định mức bảo trì:</span>
                    <span className="text-sm font-black font-mono text-sky-950">
                      {formatVnd(pole.maintenanceCostVnd)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPole(pole);
                        setIsEditModalOpen(true);
                      }}
                      className="px-2.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg flex items-center gap-1 min-h-[44px] cursor-pointer"
                      title="Chỉnh sửa chi tiết thông tin trụ điện"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Sửa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectPole(pole.id)}
                      className="px-2.5 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold rounded-lg flex items-center gap-1 min-h-[44px] cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Bản đồ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePole(pole.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Xóa trụ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Chỉnh sửa thông tin trụ điện */}
      {isEditModalOpen && editingPole && <EditPoleModal
        isOpen={isEditModalOpen}
        pole={editingPole}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPole(null);
        }}
        onSave={(updatedPole) => {
          onUpdatePole?.(updatedPole);
          setEditingPole(null);
          setIsEditModalOpen(false);
        }}
        depot={depot}
        rates={rates}
      />}
    </div>
  );
};
