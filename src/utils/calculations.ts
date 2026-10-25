import {
  CostBreakdown,
  ElectricPole,
  EVNMultiTaskCostBreakdown,
  EstimateOptions,
  MaintenanceRates,
  MaintenanceTask,
  PolePositionData,
  RouteOptimizationResult,
  TaskCoefficients,
  TaskCondition,
  VehicleType,
  WorkplaceDepot,
} from '../types/pole';

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine formula (km).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Computes the multi-step EVN maintenance quota based on 4 cost components:
 * 1. Vật liệu phụ (Auxiliary Material)
 * 2. Hotline / Thiết bị đặc thù (Hotline/Material)
 * 3. Nhân công (Labor)
 * 4. Máy thi công (Machinery)
 *
 * Flow:
 * - Each task multiplies its 4 components by its position condition coefficient
 * - All tasks are summed
 * - Multiplied by concurrent task multipliers (k_dong_thoi) based on count N
 * - Direct cost T = Material + Labor + Machinery
 * - Indirect cost GT = 2.2% of Labor + 2.0% of Direct cost T
 * - Total = T + GT + distanceAllowance
 */
/**
 * Converts a numeric currency amount into formal Vietnamese words for EVN estimates.
 * e.g., 62365976 -> "Sáu mươi hai triệu ba trăm sáu mươi lăm nghìn chín trăm bảy mươi sáu đồng."
 */
export function numberToVietnameseWords(n: number): string {
  if (n === 0) return 'Không đồng.';
const units = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  function readGroup(num: number, hasHigherScale: boolean): string {
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    let res = '';

    if (h > 0 || hasHigherScale) {
      res += `${units[h]} trăm `;
    }

    if (t > 1) {
      res += `${units[t]} mươi `;
      if (u === 1) res += 'mốt ';
      else if (u === 5) res += 'lăm ';
      else if (u > 0) res += `${units[u]} `;
    } else if (t === 1) {
      res += 'mười ';
      if (u === 5) res += 'lăm ';
      else if (u > 0) res += `${units[u]} `;
    } else if (u > 0) {
      if (h > 0 || hasHigherScale) res += 'lẻ ';
      res += `${units[u]} `;
    }

    return res.trim();
  }

  const numStr = Math.round(Math.abs(n)).toString();
  const groups: number[] = [];
  for (let i = numStr.length; i > 0; i -= 3) {
    const start = Math.max(0, i - 3);
    groups.unshift(parseInt(numStr.slice(start, i), 10));
  }

  let words = '';
  for (let i = 0; i < groups.length; i++) {
    const grp = groups[i];
    const scaleIndex = groups.length - 1 - i;
    if (grp > 0) {
      const grpWords = readGroup(grp, i > 0);
      words += `${grpWords} ${scales[scaleIndex]} `;
    }
  }

  words = words.trim();
  if (!words) return 'Không đồng.';
  // Capitalize first character and add "đồng."
  const result = words.charAt(0).toUpperCase() + words.slice(1) + ' đồng.';
  return result.replace(/\s+/g, ' ');
}

/**
 * Lấy đơn giá cơ sở của công tác theo cấp điện áp (22kV vs 12,7kV...)
 */
export function getTaskBaseRates(
  task: MaintenanceTask,
  voltageLevel?: string
): { auxiliaryMaterial: number; hotline: number; labor: number; machinery: number } {
  const v = (voltageLevel || '22kV').trim();

  if (task.baseRatesByVoltage && task.baseRatesByVoltage[v]) {
    return task.baseRatesByVoltage[v];
  }

  // Tương thích cả định dạng dấu phẩy và dấu chấm: 12,7kV hoặc 12.7kV
  const is12kV = v.includes('12.7') || v.includes('12,7');
  if (is12kV) {
    if (task.baseRatesByVoltage?.['12,7kV']) return task.baseRatesByVoltage['12,7kV'];
    if (task.baseRatesByVoltage?.['12.7kV']) return task.baseRatesByVoltage['12.7kV'];
    // Mặc định công tác 1 pha 12.7kV nhân công & máy ~67% so với 3 pha 22kV
    return {
      auxiliaryMaterial: Math.round((task.baseRates?.auxiliaryMaterial || 0) * 0.67),
      hotline: Math.round((task.baseRates?.hotline || 0) * 0.67),
      labor: Math.round((task.baseRates?.labor || 0) * 0.67),
      machinery: Math.round((task.baseRates?.machinery || 0) * 0.67),
    };
  }

  return {
    auxiliaryMaterial: task.baseRates?.auxiliaryMaterial || 0,
    hotline: task.baseRates?.hotline || 0,
    labor: task.baseRates?.labor || 0,
    machinery: task.baseRates?.machinery || 0,
  };
}

/**
 * Tính toán hệ số điều chỉnh Kđc từ các điều kiện thi công được chọn
 * Tất cả điều kiện được chọn thì các hệ số của nó sẽ nhân lại với nhau (theo đúng yêu cầu người dùng & QĐ 409)
 */
export function computeTaskCoefficients(task: MaintenanceTask): TaskCoefficients {
  if (
    task.conditions &&
    task.conditions.length > 0 &&
    task.selectedConditionIds &&
    task.selectedConditionIds.length > 0
  ) {
    let aux = 1.0;
    let mat = 1.0;
    let lab = 1.0;
    let mach = 1.0;

    for (const condId of task.selectedConditionIds) {
      const cond = task.conditions.find((c) => c.id === condId || c.code === condId);
      if (cond && cond.coefficients) {
        if (cond.coefficients.auxiliaryMaterial !== undefined) aux *= cond.coefficients.auxiliaryMaterial;
        if (cond.coefficients.hotline !== undefined) mat *= cond.coefficients.hotline;
        if (cond.coefficients.labor !== undefined) lab *= cond.coefficients.labor;
        if (cond.coefficients.machinery !== undefined) mach *= cond.coefficients.machinery;
      }
    }

    return {
      auxiliaryMaterial: Number(aux.toFixed(3)),
      material: Number(mat.toFixed(3)),
      labor: Number(lab.toFixed(3)),
      machinery: Number(mach.toFixed(3)),
    };
  }

  return {
    auxiliaryMaterial: task.positionCoefficients?.auxiliaryMaterial ?? 1.0,
    material: task.positionCoefficients?.material ?? 1.0,
    labor: task.positionCoefficients?.labor ?? 1.0,
    machinery: task.positionCoefficients?.machinery ?? 1.0,
  };
}

/**
 * Calculates official EVN Hotline standard estimate according to Phụ lục TH-01 and PL1 - PL6:
 * - PL1: 4 base rates x Kđc x Kđt1 (Nhân công, Vật liệu phụ, Máy thi công, VL Hotline)
 * - PL2: Hệ số điều chỉnh công tác Hotline (Kđc tích hợp 15 điều kiện nhân dồn)
 * - PL4: Vận chuyển Hotline 3 loại xe (Xe công nhân 12.5L, Xe gàu 16L, Xe cẩu 25L x 2 lượt)
 * - PL5: Rào chắn, cảnh giới giao thông (K = 0.5 ca x 298.431 đ/công = 149.215 đ)
 * - PL6: Khảo sát hiện trường (Gpa1 = 0.5 công x 394.809 + Vận chuyển khảo sát)
 * - TH-01: T + GT (65% NC) + TL (6%(T+GT)) + VC + K + Gpa (Gpa1 + 2.46%x0.93xGxd) + GTGT (8%)
 */
export function calculateEVNMultiTaskCost(
  tasks: MaintenanceTask[],
  distanceFromBaseKm: number,
  rates: MaintenanceRates,
  options?: EstimateOptions,
  voltageLevel?: string
): EVNMultiTaskCostBreakdown {
  const effectiveVoltage = (voltageLevel || options?.voltageLevel || '22kV').trim();
  const selectedTasks = tasks.filter((t) => t.isSelected && (t.quantity ?? 1) > 0 && (t.taskCount ?? 1) > 0);
  const hasWork = selectedTasks.length > 0;

  let rawTotalMaterial = 0; // VL phụ (cột 15)
  let rawTotalHotline = 0;  // VL hotline (cột 16)
  let rawTotalLabor = 0;    // NC (cột 17)
  let rawTotalMachinery = 0;// MTC (cột 18)
  let totalWorkTasks = 0;   // Tổng số công tác

  const tasksDetail = selectedTasks.map((task) => {
    const baseRatesForVoltage = getTaskBaseRates(task, effectiveVoltage);
    const rawAuxiliaryMaterial = baseRatesForVoltage.auxiliaryMaterial;
    const rawHotline = baseRatesForVoltage.hotline;
    const rawLabor = baseRatesForVoltage.labor;
    const rawMachinery = baseRatesForVoltage.machinery;

    const coeffs = computeTaskCoefficients(task);
    const coeffAuxiliaryMaterial = coeffs.auxiliaryMaterial;
    const coeffHotline = coeffs.material;
    const coeffLabor = coeffs.labor;
    const coeffMachinery = coeffs.machinery;

    const taskCount = task.taskCount ?? 1;
    const quantity = task.quantity ?? 1;
    totalWorkTasks += taskCount;

    // Thành tiền từng mục = Khối lượng * Đơn giá * Hệ số Kđc
    const finalMaterialPart = Math.round(quantity * rawAuxiliaryMaterial * coeffAuxiliaryMaterial);
    const finalHotlinePart = Math.round(quantity * rawHotline * coeffHotline);
    const finalLaborPart = Math.round(quantity * rawLabor * coeffLabor);
    const finalMachineryPart = Math.round(quantity * rawMachinery * coeffMachinery);

    const itemSubtotal =
      finalMaterialPart + finalHotlinePart + finalLaborPart + finalMachineryPart;

    rawTotalMaterial += finalMaterialPart;
    rawTotalHotline += finalHotlinePart;
    rawTotalLabor += finalLaborPart;
    rawTotalMachinery += finalMachineryPart;

    return {
      code: task.code,
      name: task.name,
      description: task.description || task.name,
      unit: task.unit || '1 bộ',
      taskCount,
      quantity,
      rawAuxiliaryMaterial,
      rawHotline,
      rawLabor,
      rawMachinery,
      coeffAuxiliaryMaterial,
      coeffHotline,
      coeffLabor,
      coeffMachinery,
      finalMaterialPart,
      finalHotlinePart,
      finalLaborPart,
      finalMachineryPart,
      itemSubtotal,
    };
  });

  // Hệ số đồng thời nhóm Kđt1 (Phụ lục 1, Mục B)
  // + Từ 1,0 -> 2,0 công tác (Kvl=1, Knc=1, Kmtc=1)
  // + Từ 3,0 -> 5,0 công tác (Kvl=1, Knc=1, Kmtc=0,9)
  // + Từ >= 6,0 công tác (Kvl=1, Knc=0,95, Kmtc=0,85)
  let concurrentLaborMultiplier = 1.0;
  let concurrentMachineryMultiplier = 1.0;

  if (totalWorkTasks >= 6) {
    concurrentLaborMultiplier = 0.95;
    concurrentMachineryMultiplier = 0.85;
  } else if (totalWorkTasks >= 3) {
    concurrentLaborMultiplier = 1.0;
    concurrentMachineryMultiplier = 0.90;
  } else {
    concurrentLaborMultiplier = 1.0;
    concurrentMachineryMultiplier = 1.0;
  }

  // Phụ lục 1, Mục C: Tổng cộng bao gồm hệ số đồng thời Kđt1
  const finalTotalMaterial = rawTotalMaterial; // VL1
  const finalTotalHotline = rawTotalHotline;   // VL2
  const totalMaterialCost = finalTotalMaterial + finalTotalHotline; // VL = VL1 + VL2
  const finalTotalLabor = Math.round(rawTotalLabor * concurrentLaborMultiplier); // NC
  const finalTotalMachinery = Math.round(rawTotalMachinery * concurrentMachineryMultiplier); // M

  // PHỤ LỤC TH-01: BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ HOTLINE
  // I. Chi phí trực tiếp T = VL + NC + M
  const directCost = totalMaterialCost + finalTotalLabor + finalTotalMachinery;

  // II. Chi phí gián tiếp GT: Chi phí chung C = 65% x NC (theo Quyết định EVN)
  const generalExpenseRate = options?.generalExpenseRate ?? 0.65;
  const totalIndirectCost = Math.round(finalTotalLabor * generalExpenseRate);

  // III. Thu nhập chịu thuế tính trước TL = 6% x (T + GT)
  const taxableIncomeRate = options?.taxableIncomeRate ?? 0.06;
  const taxableIncomeBeforeTax = Math.round((directCost + totalIndirectCost) * taxableIncomeRate);

  // IV. Chi phí vận chuyển Hotline (VC - Phụ lục 4)
  // Cự ly chuẩn L (nếu = 0 hoặc thiếu thì mặc định 56km như tài liệu Tây Ninh)
  const distance = options?.transportDistanceKm ?? distanceFromBaseKm;
  const transportDistanceKm = hasWork && Number.isFinite(distance) ? Math.max(0, distance) : 0;
  const fuelPricePerLiter = options?.fuelPricePerLiter ?? (rates.fuelPricePerLiterVnd > 0 ? rates.fuelPricePerLiterVnd : 30490);
  const workerQuota = options?.workerVehicleQuota ?? 12.5;
  const bucketQuota = options?.bucketVehicleQuota ?? 16.0;
  const craneQuota = options?.craneVehicleQuota ?? 25.0;
  
  // 1. Xe chở công nhân: 1 chuyến x 12.5 L/100km x L x Giá dầu x 2 lượt
  const workerVehicleCost = Math.round(1 * (workerQuota / 100) * transportDistanceKm * fuelPricePerLiter * 2);
  // 2. Xe gàu Hotline: 1 chuyến x 16.0 L/100km x L x Giá dầu x 2 lượt
  const bucketVehicleCost = Math.round(1 * (bucketQuota / 100) * transportDistanceKm * fuelPricePerLiter * 2);
  // 3. Xe cẩu/dựng trụ Hotline: 1 chuyến x 25.0 L/100km x L x Giá dầu x 2 lượt
  const craneVehicleCost = Math.round(1 * (craneQuota / 100) * transportDistanceKm * fuelPricePerLiter * 2);
  const totalTransportationCost = workerVehicleCost + bucketVehicleCost + craneVehicleCost;

  // V. Chi phí khác: Rào chắn, cảnh giới giao thông (K - Phụ lục 5)
  const trafficSafetyShifts = hasWork ? (options?.trafficSafetyShifts ?? 0.5) : 0;
  const trafficSafetyRate = options?.trafficSafetyRate ?? 298431; // Đơn giá công bậc 3/7-nhóm I
  const totalTrafficSafetyCost = hasWork ? Math.round(options?.trafficSafetyCost ?? trafficSafetyShifts * trafficSafetyRate) : 0;

  // A. Giá trị xây dựng trước thuế Gxd = T + GT + TL + VC + K
  const constructionValueBeforeTax =
    directCost + totalIndirectCost + taxableIncomeBeforeTax + totalTransportationCost + totalTrafficSafetyCost;

  // B. Chi phí khảo sát, lập phương án thi công (Gpa = Gpa1 + Gpa2)
  // Phụ lục 6: Chi phí khảo sát Gpa1
  const surveyLaborCost = hasWork ? Math.round(options?.surveyLaborCost ?? 0.5 * 394809) : 0;
  const surveyVehicleCost = workerVehicleCost;       // 1 chuyến x 12.5 L/100km x L x Giá dầu x 2 = 426.860 đ
  const totalSurveyCost = surveyLaborCost + surveyVehicleCost; // Gpa1 = 624.265 đ

  // Lập phương án thi công Gpa2 = 2.46% x 0.93 x Gxd x K (K=1 lắp mới, K=1.2 cải tạo)
  const kRenovation = options?.isRenovation ? 1.2 : 1.0;
  const planPreparationRate = 0.0246 * 0.93 * kRenovation;
  const planPreparationCost = Math.round(planPreparationRate * constructionValueBeforeTax); // 1.277.608 đ
  const totalPlanCost = totalSurveyCost + planPreparationCost; // Gpa = 1.901.873 đ

  // C. Tổng dự toán trước thuế GTGT Gtt = Gxd + Gpa
  const totalEstimateBeforeTax = constructionValueBeforeTax + totalPlanCost; // 57.746.274 đ

  // D. Thuế giá trị gia tăng GTGT = Gtt x 8%
  const vatRate = options?.vatRate ?? 0.08;
  const vatAmount = Math.round(totalEstimateBeforeTax * vatRate); // 4.619.702 đ

  // E. Tổng dự toán sau thuế GTGT Gdt = Gtt + GTGT
  const totalEstimateAfterTax = totalEstimateBeforeTax + vatAmount; // 62.365.976 đ

  // Đọc số tiền bằng chữ chuẩn biểu mẫu EVN
  const totalInWords = numberToVietnameseWords(totalEstimateAfterTax);

  return {
    tasksCount: totalWorkTasks,
    tasksDetail,
    rawTotalMaterial,
    rawTotalHotline,
    rawTotalLabor,
    rawTotalMachinery,
    concurrentLaborMultiplier,
    concurrentMachineryMultiplier,
    finalTotalMaterial,
    finalTotalHotline,
    totalMaterialCost,
    finalTotalLabor,
    finalTotalMachinery,
    directCost,
    generalExpenseRate,
    totalIndirectCost,
    taxableIncomeRate,
    taxableIncomeBeforeTax,
    transportDistanceKm,
    fuelPricePerLiter,
    workerVehicleCost,
    bucketVehicleCost,
    craneVehicleCost,
    totalTransportationCost,
    trafficSafetyShifts,
    trafficSafetyRate,
    totalTrafficSafetyCost,
    constructionValueBeforeTax,
    surveyLaborCost,
    surveyVehicleCost,
    totalSurveyCost,
    planPreparationRate,
    planPreparationCost,
    totalPlanCost,
    totalEstimateBeforeTax,
    vatRate,
    vatAmount,
    totalEstimateAfterTax,
    totalInWords,

    // Aliases
    distanceAllowance: totalTransportationCost,
    totalEstimatedCost: totalEstimateAfterTax,
  };
}

/**
 * Calculates detailed cost breakdown and total maintenance quota cost for a pole.
 */
export function calculatePoleCostBreakdown(
  pole: Pick<
    ElectricPole,
    | 'voltageLevel'
    | 'insulatorCount'
    | 'crossarmType'
    | 'poleStructure'
    | 'distanceFromBaseKm'
  > & { tasks?: MaintenanceTask[] },
  rates: MaintenanceRates
): CostBreakdown {
  // If tasks are available, use EVN multi-task formula
  if (pole.tasks && pole.tasks.length > 0) {
    const evn = calculateEVNMultiTaskCost(
      pole.tasks,
      pole.distanceFromBaseKm,
      rates
    );
    return {
      baseVoltageCost: evn.finalTotalMaterial,
      insulatorCost: evn.finalTotalLabor,
      structureMultiplier: evn.concurrentLaborMultiplier,
      crossarmMultiplier: evn.concurrentMachineryMultiplier,
      subtotalStructure: evn.directCost + evn.totalIndirectCost,
      distanceAllowance: evn.distanceAllowance,
      totalCostVnd: evn.totalEstimatedCost,
      evnBreakdown: evn,
    };
  }

  // Fallback parametric estimation
  const baseVoltageCost = rates.baseCostByVoltage[pole.voltageLevel] ?? rates.baseCostByVoltage['22kV'] ?? 220000;
  const insulatorCost = Math.max(0, pole.insulatorCount) * rates.costPerInsulator;

  const crossarmMultiplier =
    rates.crossarmOptions?.find((o) => o.id === pole.crossarmType)?.multiplier ??
    (pole.crossarmType === 'offset' ? rates.offsetCrossarmMultiplier : 1.0);

  let structureMultiplier = 1.0;
  const customStructure = rates.structureOptions?.find((o) => o.id === pole.poleStructure);
  if (customStructure) {
    structureMultiplier = customStructure.multiplier;
  } else if (pole.poleStructure === 'double') {
    structureMultiplier = rates.doublePoleMultiplier;
  } else if (pole.poleStructure === 'steel_tower') {
    structureMultiplier = rates.steelTowerMultiplier;
  }

  const subtotalStructure = Math.round(
    (baseVoltageCost + insulatorCost) * crossarmMultiplier * structureMultiplier
  );

  const distanceAllowance = Math.round(
    Math.max(0, pole.distanceFromBaseKm) * rates.distanceAllowancePerKm
  );

  const totalCostVnd = subtotalStructure + distanceAllowance;

  return {
    baseVoltageCost,
    insulatorCost,
    structureMultiplier,
    crossarmMultiplier,
    subtotalStructure,
    distanceAllowance,
    totalCostVnd,
  };
}

export function calculatePoleTotalCost(
  pole: Pick<
    ElectricPole,
    | 'voltageLevel'
    | 'insulatorCount'
    | 'crossarmType'
    | 'poleStructure'
    | 'distanceFromBaseKm'
  > & { tasks?: MaintenanceTask[] },
  rates: MaintenanceRates
): number {
  return calculatePoleCostBreakdown(pole, rates).totalCostVnd;
}

/**
 * Solves the Traveling Salesperson Problem (TSP) using Nearest-Neighbor + 2-opt refinement
 */
export function optimizeRoute(
  depot: WorkplaceDepot,
  poles: ElectricPole[],
  rates: MaintenanceRates,
  vehicleType: VehicleType,
  isRoundTrip: boolean = true
): RouteOptimizationResult {
  if (poles.length === 0) {
    return {
      isRoundTrip,
      orderedPoles: [],
      totalDistanceKm: 0,
      roundTripDistanceKm: 0,
      legs: [],
      fuelUsedLiters: 0,
      fuelCostVnd: 0,
      estimatedTravelTimeMinutes: 0,
      vehicleType,
    };
  }

  const unvisited = [...poles];
  const orderedPoles: ElectricPole[] = [];
  let currentLat = depot.lat;
  let currentLng = depot.lng;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = calculateDistanceKm(
        currentLat,
        currentLng,
        unvisited[i].lat,
        unvisited[i].lng
      );
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIndex = i;
      }
    }

    const nextPole = unvisited.splice(nearestIndex, 1)[0];
    orderedPoles.push(nextPole);
    currentLat = nextPole.lat;
    currentLng = nextPole.lng;
  }

  let improved = true;
  let iteration = 0;
  const maxIterations = 50;

  function calculateTourDistance(tour: ElectricPole[]): number {
    let dist = calculateDistanceKm(depot.lat, depot.lng, tour[0].lat, tour[0].lng);
    for (let i = 0; i < tour.length - 1; i++) {
      dist += calculateDistanceKm(
        tour[i].lat,
        tour[i].lng,
        tour[i + 1].lat,
        tour[i + 1].lng
      );
    }
    if (isRoundTrip && tour.length > 0) {
      dist += calculateDistanceKm(
        tour[tour.length - 1].lat,
        tour[tour.length - 1].lng,
        depot.lat,
        depot.lng
      );
    }
    return dist;
  }

  let bestTour = [...orderedPoles];
  let bestDistance = calculateTourDistance(bestTour);

  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;

    for (let i = 0; i < bestTour.length - 1; i++) {
      for (let k = i + 1; k < bestTour.length; k++) {
        const newTour = [
          ...bestTour.slice(0, i),
          ...bestTour.slice(i, k + 1).reverse(),
          ...bestTour.slice(k + 1),
        ];

        const newDistance = calculateTourDistance(newTour);
        if (newDistance < bestDistance - 0.001) {
          bestDistance = newDistance;
          bestTour = newTour;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  const legs: RouteOptimizationResult['legs'] = [];
  let totalKm = 0;

  const firstPole = bestTour[0];
  const leg1Dist = calculateDistanceKm(
    depot.lat,
    depot.lng,
    firstPole.lat,
    firstPole.lng
  );
  totalKm += leg1Dist;
  legs.push({
    fromName: depot.name,
    toName: `${firstPole.code} - ${firstPole.name}`,
    distanceKm: leg1Dist,
    fromCoords: [depot.lat, depot.lng],
    toCoords: [firstPole.lat, firstPole.lng],
  });

  for (let i = 0; i < bestTour.length - 1; i++) {
    const from = bestTour[i];
    const to = bestTour[i + 1];
    const legDist = calculateDistanceKm(from.lat, from.lng, to.lat, to.lng);
    totalKm += legDist;
    legs.push({
      fromName: `${from.code} - ${from.name}`,
      toName: `${to.code} - ${to.name}`,
      distanceKm: legDist,
      fromCoords: [from.lat, from.lng],
      toCoords: [to.lat, to.lng],
    });
  }

  if (isRoundTrip && bestTour.length > 0) {
    const lastPole = bestTour[bestTour.length - 1];
    const returnDist = calculateDistanceKm(
      lastPole.lat,
      lastPole.lng,
      depot.lat,
      depot.lng
    );
    totalKm += returnDist;
    legs.push({
      fromName: `${lastPole.code} - ${lastPole.name}`,
      toName: `${depot.name} (Về Đội QLVH)`,
      distanceKm: returnDist,
      fromCoords: [lastPole.lat, lastPole.lng],
      toCoords: [depot.lat, depot.lng],
    });
  }

  totalKm = Number(totalKm.toFixed(2));

  const fuelRateLitersPer100Km =
    vehicleType === 'motorbike'
      ? rates.fuelConsumption.motorbikeLitersPer100Km
      : rates.fuelConsumption.truckLitersPer100Km;

  const fuelUsedLiters = (totalKm * fuelRateLitersPer100Km) / 100;
  const fuelCostVnd = Math.round(fuelUsedLiters * rates.fuelPricePerLiterVnd);

  const avgSpeed = vehicleType === 'motorbike' ? 35 : 28;
  const transitMinutes = (totalKm / avgSpeed) * 60;
  const workMinutes = bestTour.length * 15;
  const estimatedTravelTimeMinutes = Math.round(transitMinutes + workMinutes);

  return {
    isRoundTrip,
    orderedPoles: bestTour,
    totalDistanceKm: totalKm,
    roundTripDistanceKm: totalKm,
    legs,
    fuelUsedLiters,
    fuelCostVnd,
    estimatedTravelTimeMinutes,
    vehicleType,
  };
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatKm(km: number): string {
  return `${km.toLocaleString('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })} km`;
}

export function formatLiters(liters: number): string {
  return `${liters.toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} lít`;
}

/**
 * Tổng hợp dự toán cho N vị trí trụ (từ 1 đến 20 vị trí):
 * - Nếu chỉ có 1 vị trí có dữ liệu, tính toán theo đúng vị trí đó.
 * - Nếu có từ 2 vị trí trở lên có dữ liệu, gộp tất cả các công tác của các vị trí có dữ liệu,
 *   tính toán tổng số công tác và áp dụng hệ số đồng thời nhóm Kđt1 cho toàn bộ nhóm vị trí.
 */
export function aggregateMultiPositionEstimates(
  positions: PolePositionData[],
  rates: MaintenanceRates,
  options?: EstimateOptions
): EVNMultiTaskCostBreakdown {
  const filledPositions = positions.filter((p) => p.isFilled);

  if (filledPositions.length === 0) {
    return calculateEVNMultiTaskCost([], 0, rates, options);
  }

  if (filledPositions.length === 1) {
    const pos = filledPositions[0];
    return calculateEVNMultiTaskCost(
      pos.tasks,
      pos.distanceKm,
      rates,
      options,
      pos.voltageLevel
    );
  }

  // Gộp tất cả công tác đã chọn của các vị trí có dữ liệu
  const aggregatedTasks: MaintenanceTask[] = [];
  let maxDistanceKm = 0;

  filledPositions.forEach((pos) => {
    if (pos.distanceKm > maxDistanceKm) maxDistanceKm = pos.distanceKm;

    (pos.tasks || []).forEach((t) => {
      if (t.isSelected) {
        aggregatedTasks.push({
          ...t,
          id: `${pos.id}-${t.id}`,
          description: `${t.description || t.name} (${pos.poleCode ? `Trụ ${pos.poleCode}` : `Vị trí ${pos.positionIndex}`})`,
        });
      }
    });
  });

  return calculateEVNMultiTaskCost(
    aggregatedTasks,
    maxDistanceKm,
    rates,
    options,
    filledPositions[0].voltageLevel
  );
}
