export function csvCell(value: unknown): string {
  const text = String(value ?? '');
  const safe = /^[\s]*[=+@-]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}
import { escapeHtml } from './storage';
import { aggregateEstimates } from './report';
import {
  ElectricPole,
  EVNMultiTaskCostBreakdown,
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
} from './calculations';
import { createDefaultTasksForPole, DEFAULT_MAINTENANCE_RATES } from '../data/seedData';

/**
 * Downloads a text or binary blob with the given filename in the browser.
 */
function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports poles data to CSV format with UTF-8 BOM for full Vietnamese character support in Excel.
 */
export function exportPolesToCsv(
  poles: ElectricPole[],
  depot: WorkplaceDepot,
  rates: MaintenanceRates = DEFAULT_MAINTENANCE_RATES,
  filenamePrefix: string = 'EVN_Danh_Sach_Tru_Dien_Hotline'
) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const headers = [
    'STT',
    'Mã số trụ',
    'Tên / Vị trí trụ',
    'Địa chỉ (Ấp, Xã)',
    'Vĩ độ GPS (Lat)',
    'Kinh độ GPS (Lng)',
    'Cấp điện áp',
    'Số lượng cục sứ',
    'Kiểu cây đà',
    'Kết cấu thân cột',
    'Cự ly (km)',
    'Số công tác ĐM 16',
    'CP Vật liệu phụ VL1 (VNĐ)',
    'CP Vật liệu Hotline VL2 (VNĐ)',
    'CP Nhân công NC sau Kđt1 (VNĐ)',
    'CP Máy thi công M sau Kđt1 (VNĐ)',
    'Chi phí trực tiếp T (VNĐ)',
    'Chi phí chung GT (65% NC) (VNĐ)',
    'Chi phí vận chuyển VC (VNĐ)',
    'Dự toán trước thuế Gtt (VNĐ)',
    'Thuế GTGT theo cấu hình (VNĐ)',
    'Tổng dự toán sau thuế Gdt (VNĐ)',
    'Tình trạng kiểm tra',
    'Ghi chú hiện trường',
    'Ngày kiểm tra',
  ];

  const rows = poles.map((p, index) => {
    const breakdown =
      p.evnCostBreakdown ||
      calculateEVNMultiTaskCost(
        p.tasks && p.tasks.length > 0 ? p.tasks : createDefaultTasksForPole(),
        p.distanceFromBaseKm,
        rates
      );

    return [
      index + 1,
      csvCell(p.code),
      csvCell(p.name),
      csvCell(p.address),
      p.lat.toFixed(6),
      p.lng.toFixed(6),
      p.voltageLevel,
      p.insulatorCount,
      p.crossarmType === 'offset' ? 'Đà lắp lệch (Offset)' : 'Đà lắp cân',
      p.poleStructure === 'double'
        ? 'Trụ đôi chữ H'
        : p.poleStructure === 'steel_tower'
        ? 'Tháp sắt'
        : 'Trụ đơn',
      p.distanceFromBaseKm,
      breakdown.tasksCount,
      breakdown.finalTotalMaterial,
      breakdown.finalTotalHotline,
      breakdown.finalTotalLabor,
      breakdown.finalTotalMachinery,
      breakdown.directCost,
      breakdown.totalIndirectCost,
      breakdown.totalTransportationCost,
      breakdown.totalEstimateBeforeTax,
      breakdown.vatAmount,
      breakdown.totalEstimateAfterTax,
      p.status === 'critical'
        ? 'Nghiêm trọng'
        : p.status === 'needs_maintenance'
        ? 'Cần bảo dưỡng'
        : 'Bình thường',
      csvCell(p.notes || ''),
      `"${p.createdAt.slice(0, 10)}"`,
    ];
  });

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports optimized route itinerary and fuel allocation to CSV.
 */
export function exportRouteToCsv(
  routeResult: RouteOptimizationResult,
  depot: WorkplaceDepot,
  rates: MaintenanceRates,
  filenamePrefix: string = 'EVN_Lo_Trinh_Phan_Bo_Xang'
) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${dateStr}.csv`;

  const metaRows = [
    `"ĐƠN VỊ QUẢN LÝ VẬN HÀNH:",${csvCell(depot.name)}`,
    `"ĐỊA CHỈ TRỤ SỞ:",${csvCell(depot.address)}`,
    `"PHƯƠNG TIỆN:","${routeResult.vehicleType === 'truck' ? 'Xe cẩu chuyên dụng' : 'Xe máy kiểm tra'}"`,
    `"ĐỊNH MỨC TIÊU THỤ:","${
      routeResult.vehicleType === 'truck'
        ? rates.fuelConsumption.truckLitersPer100Km
        : rates.fuelConsumption.motorbikeLitersPer100Km
    } Lít / 100km"`,
    `"ĐƠN GIÁ DẦU DO:","${rates.fuelPricePerLiterVnd} VNĐ / Lít"`,
    `"TỔNG CỰ LY HÀNH TRÌNH:","${routeResult.totalDistanceKm} km"`,
    `"TỔNG XĂNG DẦU TIÊU THỤ:","${routeResult.fuelUsedLiters} Lít"`,
    `"TỔNG KINH PHÍ NHIÊN LIỆU:","${routeResult.fuelCostVnd} VNĐ"`,
    '',
  ];

  const headers = [
    'Chặng số',
    'Điểm xuất phát',
    'Điểm đến',
    'Cự ly chặng (km)',
    'Nhiên liệu tiêu thụ (Lít)',
    'Tiền nhiên liệu chặng (VNĐ)',
    'Mã trụ đến',
    'Dự toán trụ đích (VNĐ)',
  ];

  const fuelRate =
    routeResult.vehicleType === 'truck'
      ? rates.fuelConsumption.truckLitersPer100Km
      : rates.fuelConsumption.motorbikeLitersPer100Km;

  const rows = routeResult.legs.map((leg, index) => {
    const targetPole = routeResult.orderedPoles[index];
    const legFuel = (leg.distanceKm * fuelRate) / 100;
    const legFuelCost = Math.round(legFuel * rates.fuelPricePerLiterVnd);

    return [
      `"#${index + 1}"`,
      csvCell(leg.fromName),
      csvCell(leg.toName),
      leg.distanceKm.toFixed(2),
      legFuel.toFixed(2),
      legFuelCost,
      targetPole ? csvCell(targetPole.code) : '""',
      targetPole ? (targetPole.evnCostBreakdown?.totalEstimateAfterTax || targetPole.maintenanceCostVnd) : 0,
    ];
  });

  const summaryRow = [
    '"TỔNG CỘNG"',
    '""',
    '""',
    routeResult.totalDistanceKm.toFixed(2),
    routeResult.fuelUsedLiters.toFixed(2),
    routeResult.fuelCostVnd,
    '""',
    '""',
  ];

  const csvContent =
    '\uFEFF' +
    [...metaRows, headers.join(','), ...rows.map((r) => r.join(',')), summaryRow.join(',')].join('\r\n');

  triggerDownload(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Exports complete official 7 EVN Hotline appendices (Phụ lục TH-01, PL1, PL2, PL4, PL5, PL6) to Excel HTML format.
 */
export function exportFullReportToExcel(
  poles: ElectricPole[],
  routeResult: RouteOptimizationResult | null,
  depot: WorkplaceDepot,
  rates: MaintenanceRates,
  filenamePrefix: string = 'EVN_Du_Toan_Hotline_7_Phu_Luc'
) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${dateStr}.xls`;

  const masterEstimate = aggregateEstimates(poles, rates);

  const totalCost = poles.reduce(
    (sum, p) => sum + (p.evnCostBreakdown?.totalEstimateAfterTax || p.maintenanceCostVnd),
    0
  );
  const totalInsulators = poles.reduce((sum, p) => sum + p.insulatorCount, 0);

  const excelHtml = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>Dự Toán Hotline EVN (7 Phụ Lục)</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
      body { font-family: Calibri, 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #0f172a; }
      table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
      th, td { border: 1px solid #94a3b8; padding: 6px 10px; }
      th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: center; }
      .header-th { background-color: #1e293b; color: #f8fafc; font-weight: bold; }
      .sub-th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
      .title { font-size: 16pt; font-weight: bold; color: #0f172a; text-align: center; }
      .subtitle { font-size: 11pt; font-style: italic; color: #475569; text-align: center; margin-bottom: 15px; }
      .section-header { font-size: 12pt; font-weight: bold; color: #0369a1; background-color: #e0f2fe; padding: 8px; border-left: 5px solid #0284c7; margin-top: 20px; margin-bottom: 8px; }
      .num { text-align: right; mso-number-format: "#,##0"; }
      .dec { text-align: right; mso-number-format: "0.0"; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .bg-gray { background-color: #f8fafc; }
      .bg-highlight { background-color: #ecfdf5; font-weight: bold; }
      .kpi-box { background-color: #f0fdf4; border: 2px solid #16a34a; padding: 12px; font-size: 13pt; font-weight: bold; color: #14532d; }
    </style>
  </head>
  <body>
    <!-- OFFICIAL HEADER -->
    <table>
      <tr>
        <td colspan="5" class="bold" style="border:none;">TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM (EVN)</td>
        <td colspan="5" style="border:none; text-align:right; font-weight:bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</td>
      </tr>
      <tr>
        <td colspan="5" class="bold" style="border:none; color:#0369a1;">TỔNG CÔNG TY ĐIỆN LỰC MIỀN NAM - ${escapeHtml(depot.name)}</td>
        <td colspan="5" style="border:none; text-align:right; font-style:italic;">Độc lập - Tự do - Hạnh phúc</td>
      </tr>
      <tr>
        <td colspan="10" style="border:none; text-align:center; padding:15px 0;">
          <div class="title">BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ THI CÔNG HOTLINE VÀ ĐỊNH MỨC BẢO TRÌ LƯỚI ĐIỆN</div>
          <div class="subtitle">Phụ lục TH-01 và các Phụ lục PL1, PL2, PL4, PL5, PL6 ban hành kèm theo · Ngày lập: ${new Date().toLocaleDateString('vi-VN')}</div>
        </td>
      </tr>
    </table>

    <!-- PHỤ LỤC TH-01 -->
    <div class="section-header">PHỤ LỤC TH-01: BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ HOTLINE</div>
    <table>
      <tr>
        <td colspan="2" class="bold bg-gray" style="width:250px;">Khách hàng / Đơn vị yêu cầu:</td>
        <td colspan="8">Công ty TNHH XD Điện TMDV Minh Ngọc / ${escapeHtml(depot.name)}</td>
      </tr>
      <tr>
        <td colspan="2" class="bold bg-gray">Địa chỉ:</td>
        <td colspan="8">Số 923/5A Lê Văn Lương, ấp 3, xã Nhà Bè, TP. Hồ Chí Minh</td>
      </tr>
      <tr>
        <td colspan="2" class="bold bg-gray">Địa điểm công tác:</td>
        <td colspan="8">Trụ 8B tuyến 474TB, 476TB, khu phố An Bình, phường An Tịnh, tỉnh Tây Ninh (Tuyến ${poles.length} vị trí trụ)</td>
      </tr>
      <tr>
        <td colspan="2" class="bold bg-gray">Nội dung công tác:</td>
        <td colspan="8">Trồng mới trụ BTLT 14m ghép xen lưới 3 pha 2 mạch, lắp mới 6 cách điện đứng, 2 bộ xà cân, tách vỏ dây bọc cách điện tạo 3 điểm hở và lắp mới 3 kẹp quai</td>
      </tr>
    </table>

    <table>
      <thead>
        <tr>
          <th style="width:50px;">STT</th>
          <th style="width:380px;">KHOẢN MỤC CHI PHÍ</th>
          <th style="width:80px;">KÝ HIỆU</th>
          <th style="width:300px;">CÁCH TÍNH</th>
          <th style="width:180px;">THÀNH TIỀN (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="bold bg-gray">
          <td class="center">I</td>
          <td>CHI PHÍ TRỰC TIẾP</td>
          <td class="center">T</td>
          <td>VL + NC + M</td>
          <td class="num bold">${masterEstimate.directCost}</td>
        </tr>
        <tr>
          <td class="center">1</td>
          <td style="padding-left:20px;">Chi phí vật liệu (VL = VL1 + VL2)</td>
          <td class="center">VL</td>
          <td>Phụ lục 1</td>
          <td class="num">${masterEstimate.totalMaterialCost}</td>
        </tr>
        <tr>
          <td class="center"></td>
          <td style="padding-left:40px; font-style:italic;">Chi phí vật liệu phụ</td>
          <td class="center">VL1</td>
          <td style="font-style:italic;">Phụ lục 1</td>
          <td class="num">${masterEstimate.finalTotalMaterial}</td>
        </tr>
        <tr>
          <td class="center"></td>
          <td style="padding-left:40px; font-style:italic;">Chi phí vật liệu hotline</td>
          <td class="center">VL2</td>
          <td style="font-style:italic;">Phụ lục 1</td>
          <td class="num">${masterEstimate.finalTotalHotline}</td>
        </tr>
        <tr>
          <td class="center">2</td>
          <td style="padding-left:20px;">Chi phí nhân công</td>
          <td class="center">NC</td>
          <td>Phụ lục 1</td>
          <td class="num">${masterEstimate.finalTotalLabor}</td>
        </tr>
        <tr>
          <td class="center">3</td>
          <td style="padding-left:20px;">Chi phí máy thi công</td>
          <td class="center">M</td>
          <td>Phụ lục 1</td>
          <td class="num">${masterEstimate.finalTotalMachinery}</td>
        </tr>
        <tr class="bold bg-gray">
          <td class="center">II</td>
          <td>CHI PHÍ GIÁN TIẾP</td>
          <td class="center">GT</td>
          <td>Cộng dự toán từng trụ</td>
          <td class="num bold">${masterEstimate.totalIndirectCost}</td>
        </tr>
        <tr>
          <td class="center">1</td>
          <td style="padding-left:20px;">Chi phí chung</td>
          <td class="center">C</td>
          <td>Cộng dự toán từng trụ</td>
          <td class="num">${masterEstimate.totalIndirectCost}</td>
        </tr>
        <tr class="bold">
          <td class="center">III</td>
          <td>THU NHẬP CHỊU THUẾ TÍNH TRƯỚC</td>
          <td class="center">TL</td>
          <td>Cộng dự toán từng trụ</td>
          <td class="num bold">${masterEstimate.taxableIncomeBeforeTax}</td>
        </tr>
        <tr class="bold">
          <td class="center">IV</td>
          <td>Chi phí vận chuyển</td>
          <td class="center">VC</td>
          <td>Phụ lục 4</td>
          <td class="num bold">${masterEstimate.totalTransportationCost}</td>
        </tr>
        <tr class="bold">
          <td class="center">V</td>
          <td>Chi phí khác (rào chắn cảnh giới)</td>
          <td class="center">K</td>
          <td>Phụ lục 5</td>
          <td class="num bold">${masterEstimate.totalTrafficSafetyCost}</td>
        </tr>
        <tr class="bold bg-gray" style="border-top:2px solid #000;">
          <td class="center">A</td>
          <td>GIÁ TRỊ XÂY DỰNG (TRƯỚC THUẾ)</td>
          <td class="center">Gxd</td>
          <td>T + GT + TL + VC + K</td>
          <td class="num bold" style="font-size:12pt;">${masterEstimate.constructionValueBeforeTax}</td>
        </tr>
        <tr class="bold">
          <td class="center">B</td>
          <td>Chi phí khảo sát, lập phương án thi công & chiết tính</td>
          <td class="center">Gpa</td>
          <td>Gpa1 + Gpa2</td>
          <td class="num bold">${masterEstimate.totalPlanCost}</td>
        </tr>
        <tr>
          <td class="center">1</td>
          <td style="padding-left:20px;">Chi phí khảo sát</td>
          <td class="center">Gpa1</td>
          <td>Phụ lục 6</td>
          <td class="num">${masterEstimate.totalSurveyCost}</td>
        </tr>
        <tr>
          <td class="center">2</td>
          <td style="padding-left:20px;">Chi phí lập phương án thi công, lập chiết tính/dự toán</td>
          <td class="center">Gpa2</td>
          <td>Cộng dự toán từng trụ</td>
          <td class="num">${masterEstimate.planPreparationCost}</td>
        </tr>
        <tr class="bold bg-gray">
          <td class="center">C</td>
          <td>TỔNG DỰ TOÁN (TRƯỚC THUẾ GTGT)</td>
          <td class="center">Gtt</td>
          <td>Gxd + Gpa</td>
          <td class="num bold" style="font-size:12pt;">${masterEstimate.totalEstimateBeforeTax}</td>
        </tr>
        <tr class="bold">
          <td class="center">D</td>
          <td>THUẾ GIÁ TRỊ GIA TĂNG</td>
          <td class="center">GTGT</td>
          <td>Cộng dự toán từng trụ</td>
          <td class="num bold" style="color:#15803d;">${masterEstimate.vatAmount}</td>
        </tr>
        <tr class="bg-highlight">
          <td class="center" style="font-size:12pt;">E</td>
          <td style="font-size:12pt;">TỔNG DỰ TOÁN (SAU THUẾ GTGT)</td>
          <td class="center" style="font-size:12pt;">Gdt</td>
          <td>Gtt + GTGT</td>
          <td class="num bold" style="font-size:13pt; color:#166534;">${masterEstimate.totalEstimateAfterTax}</td>
        </tr>
        <tr>
          <td colspan="5" style="font-style:italic; padding:10px; background:#f8fafc;">
            <strong>Bằng chữ: </strong>${masterEstimate.totalInWords}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- PHỤ LỤC 1 -->
    <div class="section-header">PHỤ LỤC 1: BẢNG CHI TIẾT VẬT LIỆU - NHÂN CÔNG - MTC CÔNG TÁC HOTLINE</div>
    <table>
      <thead>
        <tr>
          <th rowspan="2">MÃ ĐM</th>
          <th rowspan="2">HẠNG MỤC / NỘI DUNG CÔNG VIỆC</th>
          <th rowspan="2">ĐVT</th>
          <th rowspan="2">Số CT</th>
          <th rowspan="2">KL</th>
          <th colspan="4" class="sub-th">ĐƠN GIÁ CƠ SỞ (VNĐ)</th>
          <th colspan="4" class="sub-th">HỆ SỐ ĐIỀU CHỈNH Kđc (PL2)</th>
          <th colspan="4" class="sub-th">THÀNH TIỀN (VNĐ)</th>
        </tr>
        <tr>
          <th>VL phụ</th>
          <th>VL Hotline</th>
          <th>Nhân công</th>
          <th>MTC</th>
          <th>VLp</th>
          <th>VLhl</th>
          <th>NC</th>
          <th>MTC</th>
          <th>VL phụ</th>
          <th>VL Hotline</th>
          <th>Nhân công</th>
          <th>Máy thi công</th>
        </tr>
      </thead>
      <tbody>
        ${masterEstimate.tasksDetail
          .map(
            (t) => `
          <tr>
            <td class="center bold">${escapeHtml(t.code)}</td>
            <td><strong>${escapeHtml(t.name)}</strong><br/><span style="font-size:9pt; color:#64748b;">${escapeHtml(t.description)}</span></td>
            <td class="center">${escapeHtml(t.unit)}</td>
            <td class="center bold">${t.taskCount}</td>
            <td class="center">${t.quantity}</td>
            <td class="num">${t.rawAuxiliaryMaterial}</td>
            <td class="num">${t.rawHotline}</td>
            <td class="num">${t.rawLabor}</td>
            <td class="num">${t.rawMachinery}</td>
            <td class="center bold">${t.coeffAuxiliaryMaterial.toFixed(3)}</td>
            <td class="center bold">${t.coeffHotline.toFixed(3)}</td>
            <td class="center bold" style="color:#1d4ed8;">${t.coeffLabor.toFixed(3)}</td>
            <td class="center bold" style="color:#047857;">${t.coeffMachinery.toFixed(3)}</td>
            <td class="num bold">${t.finalMaterialPart}</td>
            <td class="num bold">${t.finalHotlinePart}</td>
            <td class="num bold" style="color:#1e3a8a;">${t.finalLaborPart}</td>
            <td class="num bold" style="color:#064e3b;">${t.finalMachineryPart}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
      <tfoot>
        <tr class="bold bg-gray">
          <td colspan="5">A. TỔNG CỘNG (1) TRƯỚC HỆ SỐ ĐỒNG THỜI:</td>
          <td colspan="8" class="center">Hoàn tất ${masterEstimate.tasksCount} công tác trong ngày</td>
          <td class="num bold">${masterEstimate.rawTotalMaterial}</td>
          <td class="num bold">${masterEstimate.rawTotalHotline}</td>
          <td class="num bold" style="color:#1e3a8a;">${masterEstimate.rawTotalLabor}</td>
          <td class="num bold" style="color:#064e3b;">${masterEstimate.rawTotalMachinery}</td>
        </tr>
        <tr class="bold" style="background:#fef3c7;">
          <td colspan="5">B. HỆ SỐ ĐỒNG THỜI NHÓM (Kđt1) (${masterEstimate.tasksCount} CT):</td>
          <td colspan="8" class="center">Hệ số bình quân theo dự toán từng trụ</td>
          <td class="center">x 1.000</td>
          <td class="center">x 1.000</td>
          <td class="center bold" style="color:#1e3a8a;">x ${masterEstimate.concurrentLaborMultiplier.toFixed(3)}</td>
          <td class="center bold" style="color:#064e3b;">x ${masterEstimate.concurrentMachineryMultiplier.toFixed(3)}</td>
        </tr>
        <tr class="bold" style="background:#e0f2fe;">
          <td colspan="5">C. TỔNG CỘNG (BAO GỒM HỆ SỐ ĐỒNG THỜI Kđt1):</td>
          <td colspan="8" class="center">Đưa vào bảng tổng hợp TH-01</td>
          <td class="num bold">${masterEstimate.finalTotalMaterial}</td>
          <td class="num bold">${masterEstimate.finalTotalHotline}</td>
          <td class="num bold" style="color:#0c4a6e; font-size:12pt;">${masterEstimate.finalTotalLabor}</td>
          <td class="num bold" style="color:#064e3b; font-size:12pt;">${masterEstimate.finalTotalMachinery}</td>
        </tr>
      </tfoot>
    </table>

    <!-- PHỤ LỤC 4 -->
    <div class="section-header">PHỤ LỤC 4: BẢNG TÍNH VẬN CHUYỂN HOTLINE</div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>NỘI DUNG PHƯƠNG TIỆN ĐIỀU ĐỘNG</th>
          <th>Chuyến</th>
          <th>Định mức NL (L/100km)</th>
          <th>Cự ly L (km)</th>
          <th>Giá dầu DO (đ/L)</th>
          <th>CÁCH TÍNH</th>
          <th>THÀNH TIỀN (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="center">1</td>
          <td class="bold">Điều động Đội thi công Hotline đến công trường (Xe công nhân)</td>
          <td class="center">1</td>
          <td class="center">12,5</td>
          <td class="center">${masterEstimate.transportDistanceKm}</td>
          <td class="num">${masterEstimate.fuelPricePerLiter}</td>
          <td>1 chuyến x 12,5 L/100km x ${masterEstimate.transportDistanceKm} km x ${masterEstimate.fuelPricePerLiter} đ/L x 2 lượt</td>
          <td class="num bold">${masterEstimate.workerVehicleCost}</td>
        </tr>
        <tr>
          <td class="center">2</td>
          <td class="bold">Điều động xe gàu Hotline đến công trường</td>
          <td class="center">1</td>
          <td class="center">16,0</td>
          <td class="center">${masterEstimate.transportDistanceKm}</td>
          <td class="num">${masterEstimate.fuelPricePerLiter}</td>
          <td>1 chuyến x 16,0 L/100km x ${masterEstimate.transportDistanceKm} km x ${masterEstimate.fuelPricePerLiter} đ/L x 2 lượt</td>
          <td class="num bold">${masterEstimate.bucketVehicleCost}</td>
        </tr>
        <tr>
          <td class="center">3</td>
          <td class="bold">Điều động xe cẩu dựng trụ Hotline đến công trường</td>
          <td class="center">1</td>
          <td class="center">25,0</td>
          <td class="center">${masterEstimate.transportDistanceKm}</td>
          <td class="num">${masterEstimate.fuelPricePerLiter}</td>
          <td>1 chuyến x 25,0 L/100km x ${masterEstimate.transportDistanceKm} km x ${masterEstimate.fuelPricePerLiter} đ/L x 2 lượt</td>
          <td class="num bold">${masterEstimate.craneVehicleCost}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="bold bg-gray">
          <td colspan="7" style="text-align:right;">TỔNG CHI PHÍ VẬN CHUYỂN HOTLINE (VC):</td>
          <td class="num bold" style="font-size:12pt; color:#047857;">${masterEstimate.totalTransportationCost}</td>
        </tr>
      </tfoot>
    </table>

    <!-- PHỤ LỤC 5 & 6 -->
    <div class="section-header">PHỤ LỤC 5 & 6: RÀO CHẮN GIAO THÔNG VÀ CHI PHÍ KHẢO SÁT</div>
    <table>
      <thead>
        <tr>
          <th>Phụ lục</th>
          <th>Khoản mục chi phí</th>
          <th>Đơn vị tính</th>
          <th>Khối lượng / Số ca</th>
          <th>Đơn giá công (VNĐ)</th>
          <th>THÀNH TIỀN (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="center bold">Phụ lục 5</td>
          <td>Nhân công lập (thu dọn) rào chắn, cảnh giới giao thông (bậc 3,0/7 - nhóm I)</td>
          <td class="center">Ca máy</td>
          <td class="center">${masterEstimate.trafficSafetyShifts}</td>
          <td class="num">${masterEstimate.trafficSafetyRate}</td>
          <td class="num bold">${masterEstimate.totalTrafficSafetyCost}</td>
        </tr>
        <tr>
          <td class="center bold">Phụ lục 6</td>
          <td>Nhân công thực hiện khảo sát hiện trường (bậc 4,5/7 - nhóm II)</td>
          <td class="center">Công</td>
          <td class="center">${masterEstimate.trafficSafetyShifts}</td>
          <td class="num">394809</td>
          <td class="num bold">${masterEstimate.surveyLaborCost}</td>
        </tr>
        <tr>
          <td class="center bold">Phụ lục 6</td>
          <td>Phương tiện vận chuyển phục vụ khảo sát (1 chuyến x 12.5L/100km x 2 lượt)</td>
          <td class="center">Chuyến</td>
          <td class="center">1</td>
          <td class="num">${masterEstimate.surveyVehicleCost}</td>
          <td class="num bold">${masterEstimate.surveyVehicleCost}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="bold bg-gray">
          <td colspan="5" style="text-align:right;">TỔNG CHI PHÍ KHẢO SÁT HIỆN TRƯỜNG (Gpa1):</td>
          <td class="num bold" style="color:#0284c7;">${masterEstimate.totalSurveyCost}</td>
        </tr>
      </tfoot>
    </table>

    <!-- DETAILED POLE LIST -->
    <div class="section-header">DANH SÁCH CHI TIẾT TỪNG VỊ TRÍ TRỤ ĐIỆN VÀ DỰ TOÁN</div>
    <table>
      <thead>
        <tr>
          <th>STT</th>
          <th>Mã số trụ</th>
          <th>Tên / Vị trí trụ</th>
          <th>Địa chỉ</th>
          <th>Cấp áp</th>
          <th>Số sứ</th>
          <th>Cây đà</th>
          <th>Cự ly (km)</th>
          <th>Số công tác</th>
          <th>Vật liệu (VNĐ)</th>
          <th>Nhân công (VNĐ)</th>
          <th>Máy thi công (VNĐ)</th>
          <th>Dự toán sau thuế (VNĐ)</th>
        </tr>
      </thead>
      <tbody>
        ${poles
          .map((p, idx) => {
            const b =
              p.evnCostBreakdown ||
              calculateEVNMultiTaskCost(
                p.tasks && p.tasks.length > 0 ? p.tasks : createDefaultTasksForPole(),
                p.distanceFromBaseKm,
                rates
              );

            return `
          <tr>
            <td class="center">${idx + 1}</td>
            <td class="center bold">${escapeHtml(p.code)}</td>
            <td class="bold">${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.address)}</td>
            <td class="center">${p.voltageLevel}</td>
            <td class="center bold">${p.insulatorCount}</td>
            <td class="center">${p.crossarmType === 'offset' ? 'Đà lệch' : 'Đà cân'}</td>
            <td class="dec">${p.distanceFromBaseKm.toFixed(1)}</td>
            <td class="center bold">${b.tasksCount}</td>
            <td class="num">${b.finalTotalMaterial + b.finalTotalHotline}</td>
            <td class="num">${b.finalTotalLabor}</td>
            <td class="num">${b.finalTotalMachinery}</td>
            <td class="num bold" style="color:#0369a1;">${b.totalEstimateAfterTax || p.maintenanceCostVnd}</td>
          </tr>
        `;
          })
          .join('')}
      </tbody>
      <tfoot>
        <tr class="bold bg-gray">
          <td colspan="5" style="text-align:right;">TỔNG CỘNG CÁC TRỤ:</td>
          <td class="center">${totalInsulators}</td>
          <td colspan="6"></td>
          <td class="num bold" style="font-size:12pt; color:#0f172a;">${totalCost}</td>
        </tr>
      </tfoot>
    </table>

    <!-- SIGNATURE BLOCKS -->
    <br/><br/>
    <table>
      <tr>
        <td colspan="2" class="center bold" style="border:none;">
          CHỦ TRÌ DỰ TOÁN<br/>
          <span style="font-weight:normal; font-style:italic;">(Ký, ghi rõ họ tên)</span>
          <br/><br/><br/><br/>
          Chỉ huy thi công Hotline
        </td>
        <td colspan="3" class="center bold" style="border:none;">
          NGƯỜI THIẾT LẬP<br/>
          <span style="font-weight:normal; font-style:italic;">(Ký, ghi rõ họ tên)</span>
          <br/><br/><br/><br/>
          Kỹ thuật viên dự toán
        </td>
        <td colspan="3" class="center bold" style="border:none;">
          ĐỘI TRƯỞNG ĐỘI QLVH<br/>
          <span style="font-weight:normal; font-style:italic;">(Ký duyệt phương án)</span>
          <br/><br/><br/><br/>
          Đội trưởng Hotline
        </td>
        <td colspan="2" class="center bold" style="border:none;">
          TRƯỞNG PHÒNG KẾ HOẠCH<br/>
          <span style="font-weight:normal; font-style:italic;">(Ký phê duyệt thanh toán)</span>
          <br/><br/><br/><br/>
          Công ty Điện lực
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  triggerDownload(
    excelHtml,
    filename,
    'application/vnd.ms-excel;charset=utf-8;'
  );
}
