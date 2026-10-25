import React, { useState, useEffect } from 'react';
import { EVNMultiTaskCostBreakdown, EstimateOptions } from '../types/pole';
import { formatVnd } from '../utils/calculations';
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Info,
  Percent,
  SlidersHorizontal,
} from 'lucide-react';

interface OfficialEstimateSummaryTableProps {
  breakdown: EVNMultiTaskCostBreakdown;
  filledPositionsCount: number;
  filledPositionNames?: string;
  options: EstimateOptions;
  onChangeOptions: (newOptions: EstimateOptions) => void;
  title?: string;
  onEditTitle?: (newTitle: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const OfficialEstimateSummaryTable: React.FC<OfficialEstimateSummaryTableProps> = ({
  breakdown,
  filledPositionsCount,
  filledPositionNames,
  options,
  onChangeOptions,
  title = '4. BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ THI CÔNG HOTLINE',
  onEditTitle,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCustomTax, setIsCustomTax] = useState(false);
  const [isEditingParams, setIsEditingParams] = useState(false);
  const [tempOptions, setTempOptions] = useState<EstimateOptions>(options);

  useEffect(() => {
    setTempOptions(options);
  }, [options]);

  const currentVat = options.vatRate ?? 0.08;
  const isRenovation = options.isRenovation ?? false; // false = K=1.0 (lắp mới), true = K=1.2 (cải tạo, thay thế)

  const handleVatChange = (rate: number) => {
    setIsCustomTax(false);
    onChangeOptions({ ...options, vatRate: rate });
  };

  const handleRenovationToggle = (renovation: boolean) => {
    onChangeOptions({ ...options, isRenovation: renovation });
  };

  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-white shadow-md overflow-hidden transition-all">
      {/* Header bar with Editable Title, Move Up/Down, and Collapse */}
      <div className="bg-slate-900 text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[250px]">
          <div className="w-7 h-7 rounded-lg bg-sky-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
            <Calculator className="w-4 h-4" />
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-1.5 flex-1">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="px-2 py-0.5 text-xs bg-slate-800 text-white border border-sky-400 rounded font-bold w-full max-w-sm"
              />
              <button
                type="button"
                onClick={() => {
                  onEditTitle?.(tempTitle);
                  setIsEditingTitle(false);
                }}
                className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded font-bold"
              >
                Lưu
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                {title}
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="p-1 text-slate-400 hover:text-white rounded"
                title="Sửa tiêu đề mục này"
              >
                ✏️
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Aggregation Badge */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
            {filledPositionsCount <= 1
              ? 'Tổng hợp: 1 Vị trí đơn lẻ'
              : `Tổng hợp: ${filledPositionsCount} Vị trí trụ (${filledPositionNames || ''})`}
          </span>

          {canMoveUp && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-xs"
              title="Di chuyển khung lên trên"
            >
              ▲
            </button>
          )}
          {canMoveDown && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-xs"
              title="Di chuyển khung xuống dưới"
            >
              ▼
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3 sm:p-5 space-y-4">
          {/* Quick Notice & Sửa hệ số TH-01 Button */}
          <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-950 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                {filledPositionsCount <= 1
                  ? 'Bảng đang hiển thị dự toán chuẩn EVN cho 1 vị trí hiện tại.'
                  : `Bảng đang tự động tổng hợp toàn bộ chi phí và áp dụng hệ số đồng thời nhóm cho ${filledPositionsCount} vị trí trụ.`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingParams(!isEditingParams)}
                className="px-2.5 py-1 text-xs bg-white text-sky-800 hover:text-sky-950 border border-sky-300 hover:bg-sky-100 rounded-lg font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Sửa hệ số TH-01</span>
              </button>
              <span className="text-[11px] text-slate-500 italic">Đơn vị: VN đồng</span>
            </div>
          </div>

          {/* Inline TH-01 Parameter Editor Drawer */}
          {isEditingParams && (
            <div className="p-3.5 bg-amber-50 rounded-xl border-2 border-amber-300 space-y-3 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                <span className="font-bold text-xs text-amber-950">
                  Cài đặt thông số và mức thuế bảng tổng hợp TH-01:
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingParams(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Mức thuế GTGT</label>
                  <select
                    value={tempOptions.vatRate ?? 0.08}
                    onChange={(e) => setTempOptions({ ...tempOptions, vatRate: parseFloat(e.target.value) })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold"
                  >
                    <option value={0}>0% (KCN Mộc Bài / Miễn thuế GTGT)</option>
                    <option value={0.05}>5% (Ưu đãi đặc biệt)</option>
                    <option value={0.08}>8% (Thuế suất hiện hành)</option>
                    <option value={0.1}>10% (Thuế suất tiêu chuẩn EVN)</option>
                    <option value={0.12}>12% (Thuế suất bổ sung)</option>
                    <option value={0.15}>15% (Mức thuế trần)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Hệ số Gpa2 (Lắp mới/Cải tạo)</label>
                  <select
                    value={tempOptions.isRenovation ? 'renovation' : 'new'}
                    onChange={(e) => setTempOptions({ ...tempOptions, isRenovation: e.target.value === 'renovation' })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-bold"
                  >
                    <option value="new">K = 1,0 (Lắp mới)</option>
                    <option value="renovation">K = 1,2 (Cải tạo, nâng cấp, thay thế)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Chi phí chung C (% NC)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={tempOptions.generalExpenseRate ?? 0.65}
                    onChange={(e) => setTempOptions({ ...tempOptions, generalExpenseRate: parseFloat(e.target.value) || 0.65 })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Thu nhập chịu thuế TL (% T+GT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tempOptions.taxableIncomeRate ?? 0.06}
                    onChange={(e) => setTempOptions({ ...tempOptions, taxableIncomeRate: parseFloat(e.target.value) || 0.06 })}
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setIsEditingParams(false)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100 text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeOptions(tempOptions);
                    setIsEditingParams(false);
                  }}
                  className="px-4 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-bold cursor-pointer"
                >
                  Áp dụng hệ số
                </button>
              </div>
            </div>
          )}

          {/* Official TH-01 Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-300 shadow-2xs">
            <table className="w-full text-xs text-left min-w-[620px]">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-center">
                <tr>
                  <th className="py-2 px-2.5 w-12">STT</th>
                  <th className="py-2 px-3 text-left">Khoản mục chi phí</th>
                  <th className="py-2 px-2 w-16">Ký hiệu</th>
                  <th className="py-2 px-3 text-left">Cách tính & Hệ số điều chỉnh</th>
                  <th className="py-2 px-3 text-right w-36 font-bold">Thành tiền (VNĐ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {/* I. CHI PHÍ TRỰC TIẾP */}
                <tr className="bg-slate-50/80 font-bold">
                  <td className="py-2 px-2.5 text-center">I</td>
                  <td className="py-2 px-3 font-sans text-slate-900">CHI PHÍ TRỰC TIẾP</td>
                  <td className="py-2 px-2 text-center text-slate-700">T</td>
                  <td className="py-2 px-3 font-sans text-slate-600">VL + NC + M</td>
                  <td className="py-2 px-3 text-right text-slate-950 font-black">
                    {formatVnd(breakdown.directCost)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">1</td>
                  <td className="py-1.5 px-3 pl-6 font-sans text-slate-700">Chi phí vật liệu (VL1 + VL2)</td>
                  <td className="py-1.5 px-2 text-center text-slate-600">VL</td>
                  <td className="py-1.5 px-3 font-sans text-slate-500">Phụ lục 1 (VL phụ + VL Hotline)</td>
                  <td className="py-1.5 px-3 text-right text-slate-900">
                    {formatVnd(breakdown.totalMaterialCost)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">2</td>
                  <td className="py-1.5 px-3 pl-6 font-sans text-slate-700">Chi phí nhân công</td>
                  <td className="py-1.5 px-2 text-center text-slate-600">NC</td>
                  <td className="py-1.5 px-3 font-sans text-slate-500">
                    Phụ lục 1 (x Kđt1 = {breakdown.concurrentLaborMultiplier})
                  </td>
                  <td className="py-1.5 px-3 text-right text-blue-900 font-bold">
                    {formatVnd(breakdown.finalTotalLabor)}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-2.5 text-center text-slate-500">3</td>
                  <td className="py-1.5 px-3 pl-6 font-sans text-slate-700">Chi phí máy thi công</td>
                  <td className="py-1.5 px-2 text-center text-slate-600">M</td>
                  <td className="py-1.5 px-3 font-sans text-slate-500">
                    Phụ lục 1 (x Kđt1 = {breakdown.concurrentMachineryMultiplier})
                  </td>
                  <td className="py-1.5 px-3 text-right text-amber-900 font-bold">
                    {formatVnd(breakdown.finalTotalMachinery)}
                  </td>
                </tr>

                {/* II. CHI PHÍ GIÁN TIẾP */}
                <tr className="bg-amber-50/60 font-bold">
                  <td className="py-2 px-2.5 text-center">II</td>
                  <td className="py-2 px-3 font-sans text-amber-950">CHI PHÍ GIÁN TIẾP</td>
                  <td className="py-2 px-2 text-center text-amber-900">GT</td>
                  <td className="py-2 px-3 font-sans text-amber-900">
                    Chi phí chung C = {(breakdown.generalExpenseRate * 100).toFixed(0)}% x NC
                  </td>
                  <td className="py-2 px-3 text-right text-amber-950 font-black">
                    {formatVnd(breakdown.totalIndirectCost)}
                  </td>
                </tr>

                {/* III. THU NHẬP CHỊU THUẾ TÍNH TRƯỚC */}
                <tr>
                  <td className="py-2 px-2.5 text-center font-bold">III</td>
                  <td className="py-2 px-3 font-bold font-sans text-slate-900">THU NHẬP CHỊU THUẾ TÍNH TRƯỚC</td>
                  <td className="py-2 px-2 text-center font-bold">TL</td>
                  <td className="py-2 px-3 font-sans text-slate-600">
                    {(breakdown.taxableIncomeRate * 100).toFixed(0)}% x (T + GT)
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatVnd(breakdown.taxableIncomeBeforeTax)}
                  </td>
                </tr>

                {/* IV. CHI PHÍ VẬN CHUYỂN */}
                <tr>
                  <td className="py-2 px-2.5 text-center font-bold">IV</td>
                  <td className="py-2 px-3 font-bold font-sans text-slate-900">Chi phí vận chuyển Hotline</td>
                  <td className="py-2 px-2 text-center font-bold">VC</td>
                  <td className="py-2 px-3 font-sans text-slate-600">
                    Phụ lục 4 (3 xe chuyên dùng, cự ly {breakdown.transportDistanceKm} km x 2 lượt)
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatVnd(breakdown.totalTransportationCost)}
                  </td>
                </tr>

                {/* V. CHI PHÍ KHÁC */}
                <tr>
                  <td className="py-2 px-2.5 text-center font-bold">V</td>
                  <td className="py-2 px-3 font-bold font-sans text-slate-900">Chi phí khác (rào chắn cảnh giới)</td>
                  <td className="py-2 px-2 text-center font-bold">K</td>
                  <td className="py-2 px-3 font-sans text-slate-600">Phụ lục 5 (0.5 ca x bậc 3/7)</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">
                    {formatVnd(breakdown.totalTrafficSafetyCost)}
                  </td>
                </tr>

                {/* A. GIÁ TRỊ XÂY DỰNG */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <td className="py-2 px-2.5 text-center">A</td>
                  <td className="py-2 px-3 font-sans text-slate-950">GIÁ TRỊ XÂY DỰNG (TRƯỚC THUẾ)</td>
                  <td className="py-2 px-2 text-center">Gxd</td>
                  <td className="py-2 px-3 font-sans text-slate-700">T + GT + TL + VC + K</td>
                  <td className="py-2 px-3 text-right font-black text-slate-950">
                    {formatVnd(breakdown.constructionValueBeforeTax)}
                  </td>
                </tr>

                {/* B. CHI PHÍ KHẢO SÁT & LẬP PHƯƠNG ÁN (Gpa2 with K=1 or K=1.2 selection) */}
                <tr className="bg-sky-50/50">
                  <td className="py-2 px-2.5 text-center font-bold">B</td>
                  <td className="py-2 px-3 font-bold font-sans text-sky-950">
                    Chi phí lập phương án thi công & chiết tính
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-sky-900">Gpa</td>
                  <td className="py-2 px-3 font-sans text-sky-900">
                    <div className="flex flex-col gap-1">
                      <span>Gpa1 (Phụ lục 6) + Gpa2 (2,46% x 0,93 x Gxd x K)</span>
                      {/* USER REQUESTED: K=1 or K=1.2 selector right here! */}
                      <div className="inline-flex items-center gap-1.5 p-1 bg-white rounded-lg border border-sky-300 text-[11px] w-fit shadow-2xs">
                        <span className="font-bold text-slate-700 px-1">Chọn hệ số K:</span>
                        <button
                          type="button"
                          onClick={() => handleRenovationToggle(false)}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            !isRenovation
                              ? 'bg-sky-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          K = 1,0 (Lắp mới)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRenovationToggle(true)}
                          className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            isRenovation
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          K = 1,2 (Cải tạo / Thay thế)
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-sky-950">
                    {formatVnd(breakdown.totalPlanCost)}
                  </td>
                </tr>

                {/* C. TỔNG DỰ TOÁN TRƯỚC THUẾ */}
                <tr className="bg-slate-100 font-bold border-t border-slate-300">
                  <td className="py-2 px-2.5 text-center">C</td>
                  <td className="py-2 px-3 font-sans text-slate-950">TỔNG DỰ TOÁN (TRƯỚC THUẾ GTGT)</td>
                  <td className="py-2 px-2 text-center">Gtt</td>
                  <td className="py-2 px-3 font-sans text-slate-700">Gxd + Gpa</td>
                  <td className="py-2 px-3 text-right font-black text-slate-950">
                    {formatVnd(breakdown.totalEstimateBeforeTax)}
                  </td>
                </tr>

                {/* D. THUẾ GTGT (USER REQUESTED: SỔ CHỌN MỨC THUẾ TỪ 0-15%) */}
                <tr className="bg-emerald-50/60 font-bold border-t border-emerald-200">
                  <td className="py-2 px-2.5 text-center text-emerald-900">D</td>
                  <td className="py-2 px-3 font-sans text-emerald-950">
                    <div className="flex items-center gap-1.5">
                      <span>THUẾ GIÁ TRỊ GIA TĂNG (GTGT)</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                        {(currentVat * 100).toFixed(currentVat % 0.01 === 0 ? 0 : 1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-emerald-900">GTGT</td>
                  <td className="py-2 px-3 font-sans text-emerald-900">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>Gtt x</span>
                      {/* Dropdown Menu Sổ ra cho chọn mức thuế từ 0% đến 15% */}
                      <select
                        value={isCustomTax ? 'custom' : currentVat}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setIsCustomTax(true);
                          } else {
                            handleVatChange(parseFloat(e.target.value));
                          }
                        }}
                        className="px-2.5 py-1 text-xs bg-white text-emerald-950 border-2 border-emerald-500 rounded-lg font-bold shadow-2xs focus:ring-2 focus:ring-emerald-500 cursor-pointer font-sans"
                      >
                        <option value={0}>0% (KCN Mộc Bài / Miễn thuế GTGT)</option>
                        <option value={0.05}>5% (Ưu đãi đặc biệt)</option>
                        <option value={0.08}>8% (Thuế suất hiện hành)</option>
                        <option value={0.1}>10% (Thuế suất tiêu chuẩn EVN)</option>
                        <option value={0.12}>12% (Thuế suất bổ sung)</option>
                        <option value={0.15}>15% (Mức thuế trần)</option>
                        <option value="custom">Tùy chỉnh nhập số khác (0 - 15%)...</option>
                      </select>

                      {isCustomTax && (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="15"
                            step="0.5"
                            value={currentVat * 100}
                            onChange={(e) => {
                              const val = Math.min(15, Math.max(0, parseFloat(e.target.value) || 0));
                              onChangeOptions({ ...options, vatRate: val / 100 });
                            }}
                            className="w-16 px-2 py-0.5 text-xs bg-white border border-emerald-400 rounded font-mono font-bold text-center"
                          />
                          <span className="text-xs font-bold">%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-black text-emerald-900">
                    {formatVnd(breakdown.vatAmount)}
                  </td>
                </tr>

                {/* E. TỔNG DỰ TOÁN SAU THUẾ */}
                <tr className="bg-emerald-600 text-white font-black border-t-2 border-emerald-700 shadow-sm">
                  <td className="py-3 px-2.5 text-center text-emerald-100">E</td>
                  <td className="py-3 px-3 font-sans uppercase text-xs sm:text-sm tracking-wide">
                    TỔNG DỰ TOÁN (SAU THUẾ GTGT)
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-100">Gdt</td>
                  <td className="py-3 px-3 font-sans text-emerald-100 text-xs font-normal">
                    Gtt + GTGT {currentVat === 0 ? '(Áp dụng 0% KCN Mộc Bài)' : ''}
                  </td>
                  <td className="py-3 px-3 text-right font-black font-mono text-white text-sm sm:text-base">
                    {formatVnd(breakdown.totalEstimateAfterTax)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Viết bằng chữ */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-xs">
            <span className="font-bold text-slate-700 shrink-0">Bằng chữ:</span>
            <span className="italic text-slate-800 font-semibold">{breakdown.totalInWords}</span>
          </div>
        </div>
      )}
    </div>
  );
};
