import React from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ElectricPole, MaintenanceRates } from '../types/pole';
import {
  calculateEVNMultiTaskCost,
  formatVnd,
} from '../utils/calculations';
import { createDefaultTasksForPole } from '../data/seedData';
import { PieChart as PieChartIcon, Zap, Users, Box, Truck } from 'lucide-react';

interface MaintenanceCostPieChartProps {
  poles: ElectricPole[];
  rates: MaintenanceRates;
  title?: string;
  subtitle?: string;
}

export const MaintenanceCostPieChart: React.FC<MaintenanceCostPieChartProps> = ({
  poles,
  rates,
  title = 'Cơ cấu phân bổ định mức bảo trì',
  subtitle = 'Phân bổ 4 thành phần đơn giá: Nhân công · Vật liệu phụ · Máy thi công · Hotline',
}) => {
  // Aggregate 4 standard EVN rate categories across all poles
  let totalLabor = 0;
  let totalAuxiliaryMaterial = 0;
  let totalMachinery = 0;
  let totalHotline = 0;

  poles.forEach((pole) => {
    const breakdown =
      pole.evnCostBreakdown ??
      (pole.tasks && pole.tasks.length > 0
        ? calculateEVNMultiTaskCost(pole.tasks, pole.distanceFromBaseKm, rates)
        : calculateEVNMultiTaskCost(
            createDefaultTasksForPole(),
            pole.distanceFromBaseKm,
            rates
          ));

    if (breakdown) {
      totalAuxiliaryMaterial += breakdown.rawTotalMaterial || 0;
      totalHotline += breakdown.rawTotalHotline || 0;
      totalLabor += breakdown.finalTotalLabor || 0;
      totalMachinery += breakdown.finalTotalMachinery || 0;
    }
  });

  const directTotal =
    totalLabor + totalAuxiliaryMaterial + totalMachinery + totalHotline;

  const chartData = [
    {
      name: 'Nhân công',
      fullName: 'Chi phí nhân công',
      value: totalLabor,
      color: '#2563eb', // Blue-600
      icon: Users,
      description: 'Nhân công định mức sau Kđt1 (thay sứ đứng, kẹp quai, xà cân, trồng trụ)',
    },
    {
      name: 'Vật liệu phụ',
      fullName: 'Chi phí vật liệu phụ',
      value: totalAuxiliaryMaterial,
      color: '#d97706', // Amber-600
      icon: Box,
      description: 'Vật liệu phụ (VL1) theo Phụ lục 1 ĐM 16',
    },
    {
      name: 'Máy thi công',
      fullName: 'Chi phí máy thi công',
      value: totalMachinery,
      color: '#059669', // Emerald-600
      icon: Truck,
      description: 'Máy thi công sau Kđt1 (xe gàu Hotline, cẩu chuyên dùng, tời nâng)',
    },
    {
      name: 'VL Hotline',
      fullName: 'Chi phí vật liệu Hotline',
      value: totalHotline,
      color: '#7c3aed', // Violet-600
      icon: Zap,
      description: 'Vật liệu Hotline (VL2) theo Phụ lục 1 ĐM 16',
    },
  ];

  return (
    <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wide text-slate-900">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
            Tổng chi phí 4 thành phần
          </span>
          <span className="font-mono font-bold text-sky-950 text-sm sm:text-base">
            {formatVnd(directTotal)}
          </span>
        </div>
      </div>

      {/* Main Grid: Chart + Legend Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Donut Chart (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[240px] h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={600}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${formatVnd(Number(value))} (${
                      directTotal > 0
                        ? ((Number(value) / directTotal) * 100).toFixed(1)
                        : 0
                    }%)`,
                    String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#f8fafc',
                    fontSize: '11px',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                  }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                  labelStyle={{ color: '#cbd5e1' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label inside donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                {poles.length} Trụ Điện
              </span>
              <span className="text-xs font-black font-mono text-slate-800">
                100%
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown detail list (7 cols) */}
        <div className="md:col-span-7 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {chartData.map((item) => {
              const Icon = item.icon;
              const percentage =
                directTotal > 0
                  ? ((item.value / directTotal) * 100).toFixed(1)
                  : '0.0';

              return (
                <div
                  key={item.name}
                  className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-900 text-xs truncate">
                        {item.name}
                      </span>
                    </div>
                    <span
                      className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      {percentage}%
                    </span>
                  </div>

                  <div className="font-mono font-bold text-slate-900 text-xs">
                    {formatVnd(item.value)}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {item.description}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-sky-50/60 rounded-lg border border-sky-100 text-[11px] text-sky-900 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
            <span>
              <strong>Ghi chú kỹ thuật:</strong> Tỷ trọng 4 thành phần được tính
              toán tự động từ các công tác (mã ĐM 68 sứ đứng, xà đà, đầu cột, kẹp
              quai, tiếp địa) theo hệ số vị trí và hệ số đồng thời EVN.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
