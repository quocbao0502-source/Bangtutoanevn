import { aggregateEstimates } from '../utils/report';
import React, { useState } from 'react';
import {
  ElectricPole,
  HeaderCustomizationSettings,
  MaintenanceRates,
  RouteOptimizationResult,
  WorkplaceDepot,
} from '../types/pole';
import {
  calculateEVNMultiTaskCost,
  formatKm,
  formatLiters,
  formatVnd,
  numberToVietnameseWords,
} from '../utils/calculations';
import {
  exportFullReportToExcel,
  exportPolesToCsv,
  exportRouteToCsv,
} from '../utils/exportUtils';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  Maximize2,
  Minimize2,
  PieChart as PieChartIcon,
  Printer,
  ShieldAlert,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { MaintenanceCostPieChart } from './MaintenanceCostPieChart';
import { createDefaultTasksForPole } from '../data/seedData';

interface WorkReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  depot: WorkplaceDepot;
  poles: ElectricPole[];
  rates: MaintenanceRates;
  routeResult: RouteOptimizationResult | null;
  headerSettings?: HeaderCustomizationSettings;
}

export const WorkReportModal: React.FC<WorkReportModalProps> = ({
  isOpen,
  onClose,
  depot,
  poles,
  rates,
  routeResult,
  headerSettings,
}) => {
  const [reportTab, setReportTab] = useState<'all' | 'th01' | 'pl1' | 'pl_extras' | 'chart'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  const masterEstimate = aggregateEstimates(poles, rates);

  const totalMaintenanceCost = poles.reduce(
    (sum, p) => sum + (p.evnCostBreakdown?.totalEstimateAfterTax || p.maintenanceCostVnd),
    0
  );
  const totalInsulators = poles.reduce((sum, p) => sum + p.insulatorCount, 0);
  const fuelCost = routeResult?.fuelCostVnd || 0;
  const grandTotal = totalMaintenanceCost + fuelCost;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportFullReportToExcel(poles, routeResult, depot, rates);
  };

  const handleExportPolesCsv = () => {
    exportPolesToCsv(poles, depot, rates);
  };

  const handleExportRouteCsv = () => {
    if (routeResult) {
      exportRouteToCsv(routeResult, depot, rates);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs transition-all ${
        isFullscreen ? 'p-0' : 'p-0 sm:p-4'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full max-w-none max-h-none rounded-none shadow-none border-0'
            : 'w-full h-full sm:h-auto sm:max-h-[94vh] max-w-full sm:max-w-5xl lg:max-w-6xl sm:rounded-2xl shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Responsive with sticky header & 44px Close Button) */}
        <div className="sticky top-0 z-20 bg-slate-900 text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 no-print shrink-0">
          <div className="min-w-0 pr-2">
            <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-400 truncate flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Dự Toán Thi Công Hotline EVN (Phụ Lục TH-01 & PL1 - PL6)</span>
            </div>
            <div className="text-xs text-slate-300 font-medium truncate">
              {depot.name} · {poles.length} vị trí trụ điện Hotline
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 shadow-sm transition-colors cursor-pointer min-h-[40px]"
              title="In phiếu A4 chuẩn EVN"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In A4</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[40px]"
              title="Xuất báo cáo và các phụ lục ra tệp Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPolesCsv}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ml-1"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
              aria-label={isFullscreen ? 'Thu nhỏ' : 'Phóng to toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5 text-amber-400" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ml-1"
              aria-label="Đóng phiếu trình ký"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Filter Tabs (no-print) */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-4 py-2 flex items-center gap-1.5 text-xs no-print shrink-0 overflow-x-auto no-scrollbar whitespace-nowrap">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 hidden sm:inline shrink-0">Hiển thị:</span>
          <button
            type="button"
            onClick={() => setReportTab('all')}
            className={`shrink-0 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              reportTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Tất cả phụ lục
          </button>
          <button
            type="button"
            onClick={() => setReportTab('th01')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              reportTab === 'th01'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Phụ lục TH-01
          </button>
          <button
            type="button"
            onClick={() => setReportTab('pl1')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              reportTab === 'pl1'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Phụ lục 1 & 2 (ĐM 16, Kđc)
          </button>
          <button
            type="button"
            onClick={() => setReportTab('pl_extras')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              reportTab === 'pl_extras'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Phụ lục 4, 5, 6 (Xe, Rào chắn, Khảo sát)
          </button>
          <button
            type="button"
            onClick={() => setReportTab('chart')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
              reportTab === 'chart'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            Biểu Đồ Tròn Recharts
          </button>
        </div>

        {/* Formal Printable Document Body */}
        <div id="printable-report" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 font-sans text-xs">
          {/* Official Document Header */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-slate-900">
            <div>
              <div className="font-bold text-xs uppercase tracking-wide">
                {headerSettings?.parentOrganization || 'TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM'}
              </div>
              <div className="font-bold text-xs uppercase tracking-wide text-sky-900">
                {headerSettings?.subOrganization || 'TỔNG CÔNG TY ĐIỆN LỰC MIỀN NAM'}
              </div>
              <div className="font-semibold text-[11px] text-slate-700">
                {headerSettings?.unitName || depot.name}
              </div>
              <div className="text-[10px] text-slate-500">{headerSettings?.unitAddress || depot.address}</div>
            </div>

            <div className="text-right">
              <div className="font-bold text-xs uppercase">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-[11px] font-semibold">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="text-[11px] text-slate-500 italic mt-2">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </div>
            </div>
          </div>

          {/* SECTION 1: PHỤ LỤC TH-01: BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ HOTLINE */}
          {(reportTab === 'all' || reportTab === 'th01') && (
            <div className="space-y-3">
              <div className="text-center space-y-1 py-1">
                <span className="text-[11px] text-slate-500 italic block">Phụ lục TH-01: Áp dụng cho công tác dịch vụ khách hàng và quản lý vận hành Hotline</span>
                <h1 className="text-base font-black uppercase tracking-tight text-slate-950">
                  BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ HOTLINE
                </h1>
              </div>

              {/* Work information */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                <div>
                  <strong className="text-slate-700">- Đơn vị QLVH lập dự toán: </strong>
                  <span className="text-slate-900 font-semibold">{headerSettings?.unitName || depot.name}</span>
                </div>
                <div>
                  <strong className="text-slate-700">- Địa chỉ trụ sở: </strong>
                  <span className="text-slate-800">{headerSettings?.unitAddress || depot.address}</span>
                </div>
                <div>
                  <strong className="text-slate-700">- Địa điểm & Phạm vi thi công: </strong>
                  <span className="text-slate-900 font-semibold">Tuyến lưới điện {poles.length} vị trí trụ điện kiểm tra</span>
                </div>
                {/* Dynamically Render Custom Fields marked for Report */}
                {headerSettings?.customFields
                  ?.filter((f) => f.showInReport && f.value?.trim())
                  .map((field) => (
                    <div key={field.id}>
                      <strong className="text-slate-700">- {field.label}: </strong>
                      <span className="text-slate-900 font-semibold">{field.value}</span>
                    </div>
                  ))}
                <div>
                  <strong className="text-slate-700">- Nội dung công tác: </strong>
                  <span className="text-slate-800">Bảo dưỡng, vệ sinh cách điện và sửa chữa hotline lưới điện phân phối 22kV theo quy trình kỹ thuật EVN</span>
                </div>
              </div>

              {/* Table TH-01 */}
              <div className="overflow-x-auto rounded-lg border border-slate-300">
                <table className="w-full text-[11px] border-collapse border border-slate-300 min-w-[580px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 text-center">
                      <th className="border border-slate-300 p-1.5 w-12">STT</th>
                      <th className="border border-slate-300 p-1.5">KHOẢN MỤC CHI PHÍ</th>
                      <th className="border border-slate-300 p-1.5 w-16">KÝ HIỆU</th>
                      <th className="border border-slate-300 p-1.5">CÁCH TÍNH</th>
                      <th className="border border-slate-300 p-1.5 w-36 text-right font-mono">THÀNH TIỀN (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-slate-50 font-bold">
                      <td className="border border-slate-300 p-1.5 text-center">I</td>
                      <td className="border border-slate-300 p-1.5">CHI PHÍ TRỰC TIẾP</td>
                      <td className="border border-slate-300 p-1.5 text-center">T</td>
                      <td className="border border-slate-300 p-1.5 font-sans">VL + NC + M</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-slate-950">
                        {formatVnd(masterEstimate.directCost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1.5 text-center">1</td>
                      <td className="border border-slate-300 p-1.5 pl-5">Chi phí vật liệu (VL = VL1 + VL2)</td>
                      <td className="border border-slate-300 p-1.5 text-center">VL</td>
                      <td className="border border-slate-300 p-1.5">VL1 + VL2 (Phụ lục 1)</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        {formatVnd(masterEstimate.totalMaterialCost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1 text-center"></td>
                      <td className="border border-slate-300 p-1 pl-8 italic text-slate-600">Chi phí vật liệu phụ</td>
                      <td className="border border-slate-300 p-1 text-center text-slate-500">VL1</td>
                      <td className="border border-slate-300 p-1 italic text-slate-600">Phụ lục 1</td>
                      <td className="border border-slate-300 p-1 text-right font-mono text-slate-700">
                        {formatVnd(masterEstimate.finalTotalMaterial)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1 text-center"></td>
                      <td className="border border-slate-300 p-1 pl-8 italic text-slate-600">Chi phí vật liệu hotline</td>
                      <td className="border border-slate-300 p-1 text-center text-slate-500">VL2</td>
                      <td className="border border-slate-300 p-1 italic text-slate-600">Phụ lục 1</td>
                      <td className="border border-slate-300 p-1 text-right font-mono text-slate-700">
                        {formatVnd(masterEstimate.finalTotalHotline)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1.5 text-center">2</td>
                      <td className="border border-slate-300 p-1.5 pl-5">Chi phí nhân công</td>
                      <td className="border border-slate-300 p-1.5 text-center">NC</td>
                      <td className="border border-slate-300 p-1.5">Phụ lục 1</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatVnd(masterEstimate.finalTotalLabor)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1.5 text-center">3</td>
                      <td className="border border-slate-300 p-1.5 pl-5">Chi phí máy thi công</td>
                      <td className="border border-slate-300 p-1.5 text-center">M</td>
                      <td className="border border-slate-300 p-1.5">Phụ lục 1</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-slate-900">
                        {formatVnd(masterEstimate.finalTotalMachinery)}
                      </td>
                    </tr>

                    <tr className="bg-slate-50 font-bold">
                      <td className="border border-slate-300 p-1.5 text-center">II</td>
                      <td className="border border-slate-300 p-1.5">CHI PHÍ GIÁN TIẾP</td>
                      <td className="border border-slate-300 p-1.5 text-center">GT</td>
                      <td className="border border-slate-300 p-1.5">Cộng dự toán từng trụ</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-amber-950">
                        {formatVnd(masterEstimate.totalIndirectCost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1.5 text-center">1</td>
                      <td className="border border-slate-300 p-1.5 pl-5">Chi phí chung</td>
                      <td className="border border-slate-300 p-1.5 text-center">C</td>
                      <td className="border border-slate-300 p-1.5">Cộng dự toán từng trụ</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        {formatVnd(masterEstimate.totalIndirectCost)}
                      </td>
                    </tr>

                    <tr className="font-bold">
                      <td className="border border-slate-300 p-1.5 text-center">III</td>
                      <td className="border border-slate-300 p-1.5">THU NHẬP CHỊU THUẾ TÍNH TRƯỚC</td>
                      <td className="border border-slate-300 p-1.5 text-center">TL</td>
                      <td className="border border-slate-300 p-1.5">Cộng dự toán từng trụ</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        {formatVnd(masterEstimate.taxableIncomeBeforeTax)}
                      </td>
                    </tr>

                    <tr className="font-bold">
                      <td className="border border-slate-300 p-1.5 text-center">IV</td>
                      <td className="border border-slate-300 p-1.5">Chi phí vận chuyển</td>
                      <td className="border border-slate-300 p-1.5 text-center">VC</td>
                      <td className="border border-slate-300 p-1.5 font-sans">Phụ lục 4</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        {formatVnd(masterEstimate.totalTransportationCost)}
                      </td>
                    </tr>

                    <tr className="font-bold">
                      <td className="border border-slate-300 p-1.5 text-center">V</td>
                      <td className="border border-slate-300 p-1.5">Chi phí khác (công tác lập rào chắn, cảnh giới giao thông)</td>
                      <td className="border border-slate-300 p-1.5 text-center">K</td>
                      <td className="border border-slate-300 p-1.5 font-sans">Phụ lục 5</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">
                        {formatVnd(masterEstimate.totalTrafficSafetyCost)}
                      </td>
                    </tr>

                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <td className="border border-slate-300 p-1.5 text-center">A</td>
                      <td className="border border-slate-300 p-1.5 uppercase text-slate-950">GIÁ TRỊ XÂY DỰNG (TRƯỚC THUẾ)</td>
                      <td className="border border-slate-300 p-1.5 text-center">Gxd</td>
                      <td className="border border-slate-300 p-1.5 font-sans">T + GT + TL + VC + K</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-slate-950">
                        {formatVnd(masterEstimate.constructionValueBeforeTax)}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">B</td>
                      <td className="border border-slate-300 p-1.5 font-bold">Chi phí khảo sát, lập chiết tính/dự toán, lập phương án thi công và báo cáo tổng hợp</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">Gpa</td>
                      <td className="border border-slate-300 p-1.5 font-sans">Gpa1 + Gpa2</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold">
                        {formatVnd(masterEstimate.totalPlanCost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1 text-center text-slate-500">1</td>
                      <td className="border border-slate-300 p-1 pl-5 text-slate-700">Chi phí khảo sát</td>
                      <td className="border border-slate-300 p-1 text-center text-slate-600">Gpa1</td>
                      <td className="border border-slate-300 p-1 text-slate-600">Phụ lục 6</td>
                      <td className="border border-slate-300 p-1 text-right font-mono text-slate-800">
                        {formatVnd(masterEstimate.totalSurveyCost)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-1 text-center text-slate-500">2</td>
                      <td className="border border-slate-300 p-1 pl-5 text-slate-700">Chi phí lập phương án thi công, lập chiết tính/dự toán và báo cáo tổng hợp</td>
                      <td className="border border-slate-300 p-1 text-center text-slate-600">Gpa2</td>
                      <td className="border border-slate-300 p-1 text-slate-600">Cộng dự toán từng trụ</td>
                      <td className="border border-slate-300 p-1 text-right font-mono text-slate-800">
                        {formatVnd(masterEstimate.planPreparationCost)}
                      </td>
                    </tr>

                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td className="border border-slate-300 p-1.5 text-center">C</td>
                      <td className="border border-slate-300 p-1.5 uppercase text-slate-950">TỔNG DỰ TOÁN (TRƯỚC THUẾ GTGT)</td>
                      <td className="border border-slate-300 p-1.5 text-center">Gtt</td>
                      <td className="border border-slate-300 p-1.5 font-sans">Gxd + Gpa</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-slate-950">
                        {formatVnd(masterEstimate.totalEstimateBeforeTax)}
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-900">D</td>
                      <td className="border border-slate-300 p-1.5 font-bold uppercase text-emerald-950">THUẾ GIÁ TRỊ GIA TĂNG</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold text-emerald-900">GTGT</td>
                      <td className="border border-slate-300 p-1.5 font-sans">Cộng dự toán từng trụ</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-emerald-900">
                        {formatVnd(masterEstimate.vatAmount)}
                      </td>
                    </tr>

                    <tr className="bg-emerald-50 font-black border-t-2 border-emerald-600">
                      <td className="border border-slate-300 p-2 text-center text-emerald-950">E</td>
                      <td className="border border-slate-300 p-2 uppercase text-emerald-950 text-xs">TỔNG DỰ TOÁN (SAU THUẾ GTGT)</td>
                      <td className="border border-slate-300 p-2 text-center text-emerald-950">Gdt</td>
                      <td className="border border-slate-300 p-2 font-sans text-emerald-900">Gtt + GTGT</td>
                      <td className="border border-slate-300 p-2 text-right font-mono font-black text-emerald-950 text-sm">
                        {formatVnd(masterEstimate.totalEstimateAfterTax)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* In Words Callout */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs italic">
                <strong className="not-italic text-slate-900">Bằng chữ: </strong>
                <span className="font-semibold text-slate-900">{masterEstimate.totalInWords}</span>
              </div>
            </div>
          )}

          {/* SECTION 2: PHỤ LỤC 1 & 2: CHI TIẾT 4 ĐƠN GIÁ ĐM 16 VÀ HỆ SỐ Kđc, Kđt1 */}
          {(reportTab === 'all' || reportTab === 'pl1') && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="text-center space-y-0.5">
                <span className="text-[11px] text-slate-500 italic block">Phụ lục 1: Căn cứ Định Mức 16 & Bảng tính chi tiết</span>
                <h2 className="text-sm font-extrabold uppercase tracking-tight text-slate-900">
                  BẢNG CHI TIẾT VẬT LIỆU - NHÂN CÔNG - MTC CÔNG TÁC HOTLINE
                </h2>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-300">
                <table className="w-full text-[10px] sm:text-[11px] border-collapse border border-slate-300 min-w-[760px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                      <th className="border border-slate-300 p-1 w-20" rowSpan={2}>MÃ ĐM</th>
                      <th className="border border-slate-300 p-1" rowSpan={2}>HẠNG MỤC / NỘI DUNG</th>
                      <th className="border border-slate-300 p-1 w-12" rowSpan={2}>ĐVT</th>
                      <th className="border border-slate-300 p-1 w-8" rowSpan={2}>Số CT</th>
                      <th className="border border-slate-300 p-1 w-8" rowSpan={2}>KL</th>
                      <th className="border border-slate-300 p-1" colSpan={4}>ĐƠN GIÁ CƠ SỞ (VNĐ)</th>
                      <th className="border border-slate-300 p-1" colSpan={4}>HỆ SỐ ĐIỀU CHỈNH (Kđc)</th>
                      <th className="border border-slate-300 p-1" colSpan={4}>THÀNH TIỀN (VNĐ)</th>
                    </tr>
                    <tr className="bg-slate-50 text-[9px] sm:text-[10px] text-center border-t border-slate-300">
                      <th className="border border-slate-300 p-0.5">VL phụ</th>
                      <th className="border border-slate-300 p-0.5">VL Hotline</th>
                      <th className="border border-slate-300 p-0.5">Nhân công</th>
                      <th className="border border-slate-300 p-0.5">MTC</th>
                      <th className="border border-slate-300 p-0.5">VLp</th>
                      <th className="border border-slate-300 p-0.5">VLhl</th>
                      <th className="border border-slate-300 p-0.5">NC</th>
                      <th className="border border-slate-300 p-0.5">MTC</th>
                      <th className="border border-slate-300 p-0.5 text-right font-mono">VL phụ</th>
                      <th className="border border-slate-300 p-0.5 text-right font-mono">VL Hotline</th>
                      <th className="border border-slate-300 p-0.5 text-right font-mono">Nhân công</th>
                      <th className="border border-slate-300 p-0.5 text-right font-mono">Máy thi công</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[10px]">
                    {masterEstimate.tasksDetail.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="border border-slate-300 p-1 font-bold text-sky-900 text-center">{t.code}</td>
                        <td className="border border-slate-300 p-1 font-sans">
                          <div className="font-semibold text-slate-900">{t.name}</div>
                          <div className="text-[9px] text-slate-500 italic">{t.description}</div>
                        </td>
                        <td className="border border-slate-300 p-1 text-center font-sans">{t.unit}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{t.taskCount}</td>
                        <td className="border border-slate-300 p-1 text-center">{t.quantity}</td>
                        <td className="border border-slate-300 p-1 text-right">{formatVnd(t.rawAuxiliaryMaterial)}</td>
                        <td className="border border-slate-300 p-1 text-right">{formatVnd(t.rawHotline)}</td>
                        <td className="border border-slate-300 p-1 text-right">{formatVnd(t.rawLabor)}</td>
                        <td className="border border-slate-300 p-1 text-right">{formatVnd(t.rawMachinery)}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{t.coeffAuxiliaryMaterial.toFixed(3)}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold">{t.coeffHotline.toFixed(3)}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold text-blue-900">{t.coeffLabor.toFixed(3)}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold text-emerald-900">{t.coeffMachinery.toFixed(3)}</td>
                        <td className="border border-slate-300 p-1 text-right font-bold text-slate-800">{formatVnd(t.finalMaterialPart)}</td>
                        <td className="border border-slate-300 p-1 text-right font-bold text-slate-800">{formatVnd(t.finalHotlinePart)}</td>
                        <td className="border border-slate-300 p-1 text-right font-bold text-blue-950">{formatVnd(t.finalLaborPart)}</td>
                        <td className="border border-slate-300 p-1 text-right font-bold text-emerald-950">{formatVnd(t.finalMachineryPart)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-400 text-[11px]">
                    <tr>
                      <td colSpan={5} className="border border-slate-300 p-1.5 uppercase text-slate-900">
                        A. TỔNG CỘNG (1) TRƯỚC HỆ SỐ ĐỒNG THỜI:
                      </td>
                      <td colSpan={8} className="border border-slate-300 p-1.5 text-center font-sans text-slate-600">
                        Tổng {masterEstimate.tasksCount} công tác hoàn tất trong ngày
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">{formatVnd(masterEstimate.rawTotalMaterial)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">{formatVnd(masterEstimate.rawTotalHotline)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono text-blue-900">{formatVnd(masterEstimate.rawTotalLabor)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono text-emerald-900">{formatVnd(masterEstimate.rawTotalMachinery)}</td>
                    </tr>
                    <tr className="bg-amber-50">
                      <td colSpan={5} className="border border-slate-300 p-1.5 uppercase text-amber-950">
                        B. HỆ SỐ ĐỒNG THỜI NHÓM (Kđt1) ({masterEstimate.tasksCount} CT):
                      </td>
                      <td colSpan={8} className="border border-slate-300 p-1.5 font-sans text-[10px] text-amber-900">
                        Hệ số bình quân theo dự toán từng trụ
                      </td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">x 1.000</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono">x 1.000</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-blue-900">x {masterEstimate.concurrentLaborMultiplier.toFixed(3)}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-emerald-900">x {masterEstimate.concurrentMachineryMultiplier.toFixed(3)}</td>
                    </tr>
                    <tr className="bg-sky-50 font-black">
                      <td colSpan={5} className="border border-slate-300 p-2 uppercase text-sky-950">
                        C. TỔNG CỘNG (BAO GỒM HỆ SỐ ĐỒNG THỜI Kđt1):
                      </td>
                      <td colSpan={8} className="border border-slate-300 p-2 font-sans text-sky-900">
                        Áp vào bảng tổng hợp dự toán TH-01
                      </td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{formatVnd(masterEstimate.finalTotalMaterial)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono">{formatVnd(masterEstimate.finalTotalHotline)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono text-blue-950">{formatVnd(masterEstimate.finalTotalLabor)}</td>
                      <td className="border border-slate-300 p-2 text-right font-mono text-emerald-950">{formatVnd(masterEstimate.finalTotalMachinery)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: PHỤ LỤC 4, 5, 6 */}
          {(reportTab === 'all' || reportTab === 'pl_extras') && (
            <div className="space-y-4 pt-3 border-t border-slate-200">
              {/* Phụ lục 4: Vận chuyển */}
              <div className="space-y-2">
                <div className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>PHỤ LỤC 4: BẢNG TÍNH VẬN CHUYỂN HOTLINE (DI CHUYỂN NHÂN LỰC VÀ BỘ MÁY THI CÔNG HOTLINE)</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-300">
                  <table className="w-full text-[11px] border-collapse border border-slate-300 min-w-[620px]">
                    <thead className="bg-slate-100 font-bold text-center">
                      <tr>
                        <th className="border border-slate-300 p-1.5 w-12">STT</th>
                        <th className="border border-slate-300 p-1.5 text-left">NỘI DUNG CÔNG VIỆC</th>
                        <th className="border border-slate-300 p-1.5 w-16">Chuyến</th>
                        <th className="border border-slate-300 p-1.5 w-24">Đ/m NL (L/100km)</th>
                        <th className="border border-slate-300 p-1.5 w-20">Cự ly (km)</th>
                        <th className="border border-slate-300 p-1.5 w-24">Giá dầu DO</th>
                        <th className="border border-slate-300 p-1.5">CÁCH TÍNH</th>
                        <th className="border border-slate-300 p-1.5 w-28 text-right font-mono">THÀNH TIỀN (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center">1</td>
                        <td className="border border-slate-300 p-1.5 font-sans">Điều động Đội thi công Hotline đến công trường (Xe công nhân)</td>
                        <td className="border border-slate-300 p-1.5 text-center">1</td>
                        <td className="border border-slate-300 p-1.5 text-center">12,5</td>
                        <td className="border border-slate-300 p-1.5 text-center">{masterEstimate.transportDistanceKm}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{formatVnd(masterEstimate.fuelPricePerLiter)}</td>
                        <td className="border border-slate-300 p-1.5 font-sans text-[10px]">1 chuyến x 12,5L/100km x {masterEstimate.transportDistanceKm}km x {formatVnd(masterEstimate.fuelPricePerLiter)} x 2 lượt</td>
                        <td className="border border-slate-300 p-1.5 text-right font-bold">{formatVnd(masterEstimate.workerVehicleCost)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center">2</td>
                        <td className="border border-slate-300 p-1.5 font-sans">Điều động xe gàu Hotline đến công trường</td>
                        <td className="border border-slate-300 p-1.5 text-center">1</td>
                        <td className="border border-slate-300 p-1.5 text-center">16,0</td>
                        <td className="border border-slate-300 p-1.5 text-center">{masterEstimate.transportDistanceKm}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{formatVnd(masterEstimate.fuelPricePerLiter)}</td>
                        <td className="border border-slate-300 p-1.5 font-sans text-[10px]">1 chuyến x 16,0L/100km x {masterEstimate.transportDistanceKm}km x {formatVnd(masterEstimate.fuelPricePerLiter)} x 2 lượt</td>
                        <td className="border border-slate-300 p-1.5 text-right font-bold">{formatVnd(masterEstimate.bucketVehicleCost)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 text-center">3</td>
                        <td className="border border-slate-300 p-1.5 font-sans">Điều động xe cẩu Hotline đến công trường</td>
                        <td className="border border-slate-300 p-1.5 text-center">1</td>
                        <td className="border border-slate-300 p-1.5 text-center">25,0</td>
                        <td className="border border-slate-300 p-1.5 text-center">{masterEstimate.transportDistanceKm}</td>
                        <td className="border border-slate-300 p-1.5 text-right">{formatVnd(masterEstimate.fuelPricePerLiter)}</td>
                        <td className="border border-slate-300 p-1.5 font-sans text-[10px]">1 chuyến x 25,0L/100km x {masterEstimate.transportDistanceKm}km x {formatVnd(masterEstimate.fuelPricePerLiter)} x 2 lượt</td>
                        <td className="border border-slate-300 p-1.5 text-right font-bold">{formatVnd(masterEstimate.craneVehicleCost)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                        <td colSpan={7} className="border border-slate-300 p-1.5 text-right uppercase">
                          TỔNG CỘNG CHI PHÍ VẬN CHUYỂN HOTLINE (VC):
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-black text-emerald-950">
                          {formatVnd(masterEstimate.totalTransportationCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Phụ lục 5 & 6 Side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phụ lục 5 */}
                <div className="space-y-1.5">
                  <div className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>PHỤ LỤC 5: RÀO CHẮN, CẢNH GIỚI GIAO THÔNG</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-[11px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Nhân công lập (thu dọn) rào chắn:</span>
                      <strong className="font-mono text-slate-900">Bậc 3,0/7 - Nhóm I</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Số ca máy lựa chọn:</span>
                      <strong className="font-mono text-slate-900">{masterEstimate.trafficSafetyShifts} ca</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Đơn giá công:</span>
                      <strong className="font-mono text-slate-900">{formatVnd(masterEstimate.trafficSafetyRate)}</strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold text-xs">
                      <span className="text-slate-800">Thành tiền (K):</span>
                      <span className="font-mono text-amber-950">{formatVnd(masterEstimate.totalTrafficSafetyCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Phụ lục 6 */}
                <div className="space-y-1.5">
                  <div className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-sky-600" />
                    <span>PHỤ LỤC 6: BẢNG TÍNH CHI PHÍ KHẢO SÁT</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-[11px] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Nhân công khảo sát hiện trường:</span>
                      <strong className="font-mono text-slate-900">{formatVnd(masterEstimate.surveyLaborCost)}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Vận chuyển phục vụ khảo sát (12.5L):</span>
                      <strong className="font-mono text-slate-900">{formatVnd(masterEstimate.surveyVehicleCost)}</strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 font-bold text-xs">
                      <span className="text-slate-800">Tổng chi phí khảo sát (Gpa1):</span>
                      <span className="font-mono text-sky-950">{formatVnd(masterEstimate.totalSurveyCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: RECHARTS PIE CHART */}
          {(reportTab === 'all' || reportTab === 'chart') && (
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                <PieChartIcon className="w-4 h-4 text-sky-600" />
                <span>Trực Quan Hóa Cơ Cấu Phân Bổ 4 Nhóm Đơn Giá Hotline (Recharts)</span>
              </div>
              <MaintenanceCostPieChart poles={poles} rates={rates} />
            </div>
          )}

          {/* SECTION 5: DETAILED POLE LIST TABLE */}
          {(reportTab === 'all') && (
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="font-bold text-xs uppercase text-slate-800">
                Danh Sách Chi Tiết Vị Trí Trụ & Dự Toán Sau Thuế (GTGT theo cấu hình)
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-300">
                <table className="w-full text-[11px] border-collapse border border-slate-300 min-w-[580px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                      <th className="border border-slate-300 p-1.5 w-8">STT</th>
                      <th className="border border-slate-300 p-1.5 w-28">Mã số trụ</th>
                      <th className="border border-slate-300 p-1.5 text-left">Vị trí / Địa chỉ (Ấp, Xã)</th>
                      <th className="border border-slate-300 p-1.5 w-14">Cấp áp</th>
                      <th className="border border-slate-300 p-1.5 w-14 font-mono">Số sứ</th>
                      <th className="border border-slate-300 p-1.5 w-20">Cây đà</th>
                      <th className="border border-slate-300 p-1.5 w-18 text-right font-mono">Cự ly</th>
                      <th className="border border-slate-300 p-1.5 w-28 text-right font-mono">Dự toán sau thuế</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poles.map((pole, idx) => (
                      <tr key={pole.id} className="border-b border-slate-200">
                        <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-bold font-mono text-center">
                          {pole.code}
                        </td>
                        <td className="border border-slate-300 p-1.5">
                          <div className="font-semibold text-slate-900">{pole.name}</div>
                          <div className="text-[10px] text-slate-500">{pole.address}</div>
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono">{pole.voltageLevel}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono font-bold">
                          {pole.insulatorCount}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-center font-semibold">
                          {pole.crossarmType === 'offset' ? (
                            <span className="text-amber-800">Đà lệch</span>
                          ) : (
                            <span>Đà cân</span>
                          )}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">
                          {formatKm(pole.distanceFromBaseKm)}
                        </td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono font-bold text-slate-900">
                          {formatVnd(pole.evnCostBreakdown?.totalEstimateAfterTax || pole.maintenanceCostVnd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <td colSpan={4} className="border border-slate-300 p-2 text-right uppercase">
                        Cộng tổng dự toán các vị trí trụ:
                      </td>
                      <td className="border border-slate-300 p-2 text-center font-mono">
                        {totalInsulators} sứ
                      </td>
                      <td colSpan={2} className="border border-slate-300 p-2"></td>
                      <td className="border border-slate-300 p-2 text-right font-mono text-sm text-sky-950 font-black">
                        {formatVnd(totalMaintenanceCost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Official EVN Signatures (Matching the user document) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 text-center text-xs border-t border-slate-300">
            <div>
              <div className="font-bold uppercase">CHỦ TRÌ DỰ TOÁN</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-800">Chỉ huy thi công Hotline</div>
            </div>

            <div>
              <div className="font-bold uppercase">NGƯỜI THIẾT LẬP</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký, ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-800">Kỹ thuật viên dự toán</div>
            </div>

            <div>
              <div className="font-bold uppercase">ĐỘI TRƯỞNG ĐỘI QLVH</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký duyệt phương án)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-800">Đội trưởng Hotline</div>
            </div>

            <div>
              <div className="font-bold uppercase">TRƯỞNG PHÒNG KẾ HOẠCH</div>
              <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký phê duyệt thanh toán)</div>
              <div className="h-16"></div>
              <div className="font-semibold text-slate-800">Công ty Điện lực</div>
            </div>
          </div>
        </div>

        {/* Sticky bottom close bar (no-print) */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between no-print shrink-0">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Phiếu in kích thước A4 tiêu chuẩn theo mẫu Phụ lục TH-01 EVN
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[40px]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tải file Excel (.xls)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors min-h-[40px] cursor-pointer"
            >
              Đóng Xem Trước
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
