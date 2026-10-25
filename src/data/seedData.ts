import {
  CrossarmOption,
  CustomHeaderField,
  ElectricPole,
  HeaderCustomizationSettings,
  MaintenanceRates,
  MaintenanceTask,
  StructureOption,
  TaskCondition,
  WorkplaceDepot,
} from '../types/pole';
import {
  calculateDistanceKm,
  calculateEVNMultiTaskCost,
  calculatePoleTotalCost,
} from '../utils/calculations';

export const DEFAULT_DEPOT: WorkplaceDepot = {
  id: 'depot-01',
  name: 'Đội Quản lý Vận hành Điện lực TP Tây Ninh - Khu vực Bình Minh',
  address: 'Số 86 Đường Trần Phú, Phường Bình Minh, TP Tây Ninh',
  lat: 11.3665,
  lng: 106.1362,
};

export const DEFAULT_HEADER_SETTINGS: HeaderCustomizationSettings = {
  appTitle: 'EVN PoleInspector',
  appSubtitle: 'Quản Lý Trụ Điện & Lộ Trình Bảo Trì',
  brandIcon: '⚡',
  parentOrganization: 'TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM',
  subOrganization: 'TỔNG CÔNG TY ĐIỆN LỰC MIỀN NAM - CÔNG TY ĐIỆN LỰC TÂY NINH',
  unitName: 'Đội Quản lý Vận hành Điện lực TP Tây Ninh - Khu vực Bình Minh',
  unitAddress: 'Số 86 Đường Trần Phú, Phường Bình Minh, TP Tây Ninh',
  themeColor: 'blue',
  navbarStyle: 'clean_white',
  showGpsBadge: true,
  showTotalCostBadge: true,
  frameBorderRadius: 'rounded-xl',
  frameBorderStyle: 'solid',
  frameBorderColor: 'slate',
  frameBgColor: 'white',
  frameShadow: 'sm',
  framePadding: 'normal',
  sectionTitles: {
    mapTitle: 'Bản đồ & Lộ trình',
    routeTitle: 'Chi tiết lộ trình & xăng',
    ledgerTitle: 'Bảng kê trụ',
    ratesTitle: 'Bảng định mức',
  },
  customFields: [
    {
      id: 'field_route',
      label: 'Mã xuất tuyến',
      value: 'Lộ 471 & 473 Bình Minh',
      badgeType: 'primary',
      showInNavbar: true,
      showInReport: true,
    },
    {
      id: 'field_commander',
      label: 'Chỉ huy / Đội trưởng',
      value: 'KS. Nguyễn Văn A (Tổ Hotline)',
      badgeType: 'success',
      showInNavbar: true,
      showInReport: true,
    },
    {
      id: 'field_hotline',
      label: 'Số ĐT khẩn cấp',
      value: '0276.3822.114',
      badgeType: 'warning',
      showInNavbar: true,
      showInReport: true,
    },
    {
      id: 'field_status',
      label: 'Chế độ thi công',
      value: 'Hotline 22kV đang mang điện',
      badgeType: 'info',
      showInNavbar: true,
      showInReport: true,
    },
  ],
};

export const DEFAULT_CROSSARM_OPTIONS: CrossarmOption[] = [
  { id: 'balanced', label: 'ĐÀ LẮP CÂN', sublabel: 'Đối xứng tiêu chuẩn', multiplier: 1.0 },
  { id: 'offset', label: 'ĐÀ LẮP LỆCH', sublabel: 'Lệch tâm (+35%)', multiplier: 1.35 },
];

export const DEFAULT_STRUCTURE_OPTIONS: StructureOption[] = [
  { id: 'single', label: 'TRỤ ĐƠN', sublabel: '1 cột bê tông', multiplier: 1.0 },
  { id: 'double', label: 'TRỤ ĐÔI', sublabel: 'Chữ H / néo (+50%)', multiplier: 1.5 },
  { id: 'steel_tower', label: 'THÁP SẮT', sublabel: 'Cột thép cao', multiplier: 2.2 },
];

export const DEFAULT_QUICK_INSULATORS: number[] = [3, 6, 9, 12];

export function getCrossarmOptions(rates?: MaintenanceRates): CrossarmOption[] {
  if (rates?.crossarmOptions && rates.crossarmOptions.length > 0) {
    return rates.crossarmOptions;
  }
  return [
    { id: 'balanced', label: 'ĐÀ LẮP CÂN', sublabel: 'Đối xứng tiêu chuẩn', multiplier: 1.0 },
    { id: 'offset', label: 'ĐÀ LẮP LỆCH', sublabel: 'Lệch tâm (+35%)', multiplier: rates?.offsetCrossarmMultiplier || 1.35 },
  ];
}

export function getStructureOptions(rates?: MaintenanceRates): StructureOption[] {
  if (rates?.structureOptions && rates.structureOptions.length > 0) {
    return rates.structureOptions;
  }
  return [
    { id: 'single', label: 'TRỤ ĐƠN', sublabel: '1 cột bê tông', multiplier: 1.0 },
    { id: 'double', label: 'TRỤ ĐÔI', sublabel: 'Chữ H / néo (+50%)', multiplier: rates?.doublePoleMultiplier || 1.5 },
    { id: 'steel_tower', label: 'THÁP SẮT', sublabel: 'Cột thép cao', multiplier: rates?.steelTowerMultiplier || 2.2 },
  ];
}

export function getQuickInsulatorCounts(rates?: MaintenanceRates): number[] {
  return rates?.quickInsulatorCounts && rates.quickInsulatorCounts.length > 0
    ? rates.quickInsulatorCounts
    : DEFAULT_QUICK_INSULATORS;
}

export const DEFAULT_MAINTENANCE_RATES: MaintenanceRates = {
  baseCostByVoltage: {
    '0.4kV': 120000,
    '12,7kV': 185000,
    '12.7kV': 185000,
    '22kV': 220000,
    '35kV': 320000,
    '110kV': 650000,
  },
  costPerInsulator: 45000,
  offsetCrossarmMultiplier: 1.35,
  doublePoleMultiplier: 1.5,
  steelTowerMultiplier: 2.2,
  crossarmOptions: [...DEFAULT_CROSSARM_OPTIONS],
  structureOptions: [...DEFAULT_STRUCTURE_OPTIONS],
  quickInsulatorCounts: [...DEFAULT_QUICK_INSULATORS],
  distanceAllowancePerKm: 3500,
  fuelConsumption: {
    motorbikeLitersPer100Km: 2.5,
    truckLitersPer100Km: 14.5,
  },
  fuelPricePerLiterVnd: 30490, // Giá dầu DO 0,05S-II theo Petrolimex (Phụ lục 4)
  petrolPricePerLiterVnd: 23850, // Giá xăng RON 95-III hiện hành
  dieselPricePerLiterVnd: 20490, // Giá dầu DO 0,05S hiện hành
  fixedTravelAllowanceVnd: 0,
  fixedOperationAllowanceVnd: 0,
  isFixedAllowanceEnabled: false,
  section2CategoryTitles: {
    voltage: 'Cấp điện áp đường dây',
    insulator: 'Số lượng cục sứ',
    crossarm: 'Cây đà lắp đặt',
    structure: 'Kết cấu thân trụ',
  },
  customTechnicalCategories: [],
};

/**
 * 15 điều kiện thi công Hotline chuẩn EVN (QĐ 409 & Bảng tính Phụ lục 2)
 * áp dụng cho công tác 16.01.01-1 (Thay thế cách điện đứng, chân sứ đỉnh, uclevis)
 */
export const DEFAULT_CONDITIONS_16_01_01_1: TaskCondition[] = [
  {
    id: 'cond-1.1',
    code: '16.01.01-1.1',
    description: 'Nếu trên trụ có thiết bị bảo vệ đường dây (liên quan đến thực hiện an toàn thi công hotline)',
    coefficients: { labor: 1.3 },
  },
  {
    id: 'cond-1.2',
    code: '16.01.01-1.2',
    description: 'Nếu trên trụ có máy biến áp (liên quan đến thực hiện an toàn thi công hotline)',
    coefficients: { labor: 1.4 },
  },
  {
    id: 'cond-1.3',
    code: '16.01.01-1.3',
    description: 'Nếu trên trụ có nhánh rẽ hoặc góc < 15° (liên quan đến thực hiện an toàn thi công hotline)',
    coefficients: { labor: 1.2 },
  },
  {
    id: 'cond-1.4',
    code: '16.01.01-1.4',
    description: 'Nếu lắp chân sứ đỉnh đà thẳng, đà góc (loại đơn)',
    coefficients: { labor: 0.5 },
  },
  {
    id: 'cond-1.5',
    code: '16.01.01-1.5',
    description: 'Nếu lắp chân sứ đỉnh đà thẳng, đà góc (loại kép)',
    coefficients: { labor: 0.7 },
  },
  {
    id: 'cond-1.6',
    code: '16.01.01-1.6',
    description: 'Nếu thay 1 cách điện pha ngoài cùng',
    coefficients: { auxiliaryMaterial: 0.7, hotline: 0.7, labor: 0.7, machinery: 0.5 },
  },
  {
    id: 'cond-1.7',
    code: '16.01.01-1.7',
    description: 'Nếu thay 1 cách điện pha giữa',
    coefficients: { labor: 0.9, machinery: 0.7 },
  },
  {
    id: 'cond-1.8',
    code: '16.01.01-1.8',
    description: 'Nếu thay 1 cách điện pha trong cùng',
    coefficients: { labor: 0.8, machinery: 0.6 },
  },
  {
    id: 'cond-1.9',
    code: '16.01.01-1.9',
    description: 'Nếu thay 2 cách điện trên đường dây',
    coefficients: { labor: 0.9, machinery: 0.9 },
  },
  {
    id: 'cond-1.10',
    code: '16.01.01-1.10',
    description: 'Nếu thay 3 cách điện trên đường dây (QĐ 409)',
    coefficients: { labor: 1.0, machinery: 1.0 },
  },
  {
    id: 'cond-1.11',
    code: '16.01.01-1.11',
    description: 'Nếu thay 1 Uclevis + sứ ống chỉ trên đường dây 3 pha (để treo dây chống sét)',
    coefficients: { labor: 0.5, machinery: 0.5 },
  },
  {
    id: 'cond-1.12',
    code: '16.01.01-1.12',
    description: 'Nếu đường dây nhiều mạch, phải thực hiện bọc cả 2 mạch',
    coefficients: { labor: 1.5 },
  },
  {
    id: 'cond-1.13',
    code: '16.01.01-1.13',
    description: 'Nếu đường dây nhiều mạch, phải thực hiện bọc cả 3 mạch',
    coefficients: { auxiliaryMaterial: 1.5, hotline: 1.5, labor: 1.9, machinery: 1.1 },
  },
  {
    id: 'cond-1.14',
    code: '16.01.01-1.14',
    description: 'Nếu chỉ lắp mới',
    coefficients: { labor: 0.8 },
  },
  {
    id: 'cond-1.15',
    code: '16.01.01-1.15',
    description: 'Nếu tháo gỡ không lắp lại',
    coefficients: { labor: 0.45, machinery: 0.45 },
  },
];

/**
 * Standard 5 Official EVN Hotline Maintenance Tasks template from Định Mức 16 & Phụ lục TH-01
 */
export const DEFAULT_EVN_TASKS_TEMPLATE: MaintenanceTask[] = [
  {
    id: 'task-01-cach-dien-dung',
    code: '16.01.01-1',
    name: 'Thay thế cách điện đứng, chân sứ đỉnh, uclevis đỡ dây chống sét trên Đd 3 pha',
    description: 'Thay 3 cách điện đứng',
    unit: '1 bộ',
    taskCount: 2, // 2 công tác theo Phụ lục 1 cột (5)
    quantity: 2,  // Khối lượng 2 theo Phụ lục 1 cột (6)
    positionType: 'outer_insulator',
    baseRates: {
      auxiliaryMaterial: 276250, // Cột (7)
      hotline: 155131,           // Cột (8)
      labor: 1237423,            // Cột (9)
      machinery: 2920434,        // Cột (10)
    },
    baseRatesByVoltage: {
      '22kV': {
        auxiliaryMaterial: 276250,
        hotline: 155131,
        labor: 1237423,
        machinery: 2920434,
      },
      '12,7kV': {
        auxiliaryMaterial: 185000,
        hotline: 103900,
        labor: 829000,
        machinery: 1956000,
      },
      '12.7kV': {
        auxiliaryMaterial: 185000,
        hotline: 103900,
        labor: 829000,
        machinery: 1956000,
      },
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0, // Kvlp (11)
      material: 1.0,          // Kvlht (12)
      labor: 0.8,             // Knc (13) theo Phụ lục 1
      machinery: 1.0,         // Kmtc (14)
    },
    conditions: [...DEFAULT_CONDITIONS_16_01_01_1],
    selectedConditionIds: ['cond-1.14'], // Lắp mới Knc=0.8
    isSelected: true,
  },
  {
    id: 'task-02-kep-quai',
    code: '16.03.02-1',
    name: 'Thay thế kẹp quai, kẹp hotline, kẹp IPC, kẹp néo cáp, đèn báo pha trên Đd 3 pha',
    description: 'Lắp mới 3 kẹp quai',
    unit: '1 bộ',
    taskCount: 1,
    quantity: 1,
    positionType: 'outer_insulator',
    baseRates: {
      auxiliaryMaterial: 276250,
      hotline: 150316,
      labor: 706978,
      machinery: 1649186,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 1.6,
      machinery: 1.0,
    },
    isSelected: true,
  },
  {
    id: 'task-03-xa-doi-xung',
    code: '16.09.01-1',
    name: 'Thay thế xà lắp đối xứng trên Đd 3 pha',
    description: 'Lắp mới 2 bộ xà cân',
    unit: '1 bộ',
    taskCount: 1,
    quantity: 1,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 276250,
      hotline: 356698,
      labor: 1283879,
      machinery: 3951175,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.5,
      material: 1.5,
      labor: 2.4,
      machinery: 1.5,
    },
    isSelected: true,
  },
  {
    id: 'task-04-trong-tru-btlt',
    code: '16.13.01-1',
    name: 'Thay thế (trồng mới/nhổ trụ) trụ trên Đd 3 pha',
    description: 'Trồng mới trụ BTLT 14m ghép xen lưới 3 pha 2 mạch',
    unit: '1 bộ trụ',
    taskCount: 1,
    quantity: 1,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 429000,
      hotline: 612566,
      labor: 2495961,
      machinery: 7511573,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.5,
      material: 1.5,
      labor: 2.736,
      machinery: 1.9,
    },
    isSelected: true,
  },
  {
    id: 'task-05-cat-vo-day-boc',
    code: '16.16.05-1',
    name: 'Công tác cắt vỏ dây bọc cách điện tạo điểm hở trên Đd',
    description: 'Tách vỏ dây bọc cách điện tạo 3 điểm hở',
    unit: '01 bộ',
    taskCount: 1,
    quantity: 1,
    positionType: 'standard',
    baseRates: {
      auxiliaryMaterial: 6250,
      hotline: 59787,
      labor: 291407,
      machinery: 635624,
    },
    positionCoefficients: {
      auxiliaryMaterial: 1.0,
      material: 1.0,
      labor: 2.0,
      machinery: 1.0,
    },
    isSelected: true,
  },
];

export function createDefaultTasksForPole(
  selectedCodes: string[] = [
    '16.01.01-1',
    '16.03.02-1',
    '16.09.01-1',
    '16.13.01-1',
    '16.16.05-1',
  ]
): MaintenanceTask[] {
  return DEFAULT_EVN_TASKS_TEMPLATE.map((t) => ({
    ...t,
    id: `${t.id}-${Math.random().toString(36).slice(2, 6)}`,
    isSelected: selectedCodes.includes(t.code),
  }));
}

// Initial realistic seed poles around the depot
const RAW_SEED_POLES: Array<
  Omit<ElectricPole, 'distanceFromBaseKm' | 'maintenanceCostVnd' | 'evnCostBreakdown'> & {
    selectedTaskCodes: string[];
  }
> = [
  // --- TUYẾN 471 BÌNH MINH (DỌC ĐƯỜNG BỜI LỜI) ---
  {
    id: 'pole-01',
    code: 'T01/471-BM',
    name: 'Trụ xuất tuyến 471 Bời Lời',
    lat: 11.3688,
    lng: 106.1385,
    address: 'Số 12 Đường Bời Lời, Phường Bình Minh, TP Tây Ninh',
    voltageLevel: '22kV',
    insulatorCount: 6,
    crossarmType: 'balanced',
    crossarmDescription: 'Trụ BTLT 14m ghép xen lưới 3 pha 2 mạch, lắp mới 2 bộ xà cân',
    poleStructure: 'single',
    status: 'needs_maintenance',
    notes: 'Trụ đầu tuyến 471 Bời Lời, xà cân 2 mạch 22kV, áp dụng trọn vẹn 5 công tác Hotline chuẩn ĐM 16',
    createdAt: '2026-10-15T08:30:00Z',
    selectedTaskCodes: [
      '16.01.01-1',
      '16.03.02-1',
      '16.09.01-1',
      '16.13.01-1',
      '16.16.05-1',
    ],
    aiAnalysis: {
      insulatorCount: 6,
      crossarmType: 'balanced',
      crossarmDescription: 'Trồng mới trụ BTLT 14m ghép xen lưới 3 pha 2 mạch, lắp mới 2 bộ xà cân',
      poleStructure: 'single',
      voltageLevelEstimate: '22kV',
      conditionAssessment: 'Công tác Hotline kết hợp: Lắp mới 6 cách điện đứng, 2 bộ xà cân, tách vỏ dây bọc tạo 3 điểm hở, lắp 3 kẹp quai và tiếp địa',
      maintenanceRecommendations: [
        'Lắp mới 6 cách điện đứng và 3 kẹp quai',
        'Trồng mới trụ BTLT 14m ghép xen lưới 3 pha 2 mạch',
      ],
      confidenceScore: 0.98,
    },
  },
  {
    id: 'pole-02',
    code: 'T06/471-BM',
    name: 'Trụ đỡ thẳng 22kV Cầu K13 Bời Lời',
    lat: 11.3725,
    lng: 106.142,
    address: 'Khu vực Cầu K13, Đường Bời Lời, Phường Bình Minh, TP Tây Ninh',
    voltageLevel: '22kV',
    insulatorCount: 3,
    crossarmType: 'balanced',
    crossarmDescription: 'Xà đỡ composite 3 pha lắp cân đối tiêu chuẩn',
    poleStructure: 'single',
    status: 'inspected',
    notes: 'Đoạn qua ngã 3 Cầu K13 giao thông đông, dây bọc 24kV, làm 3 công tác bảo dưỡng cách điện và xà đỡ',
    createdAt: '2026-10-15T09:15:00Z',
    selectedTaskCodes: ['16.01.01-1', '16.03.02-1', '16.16.05-1'],
    aiAnalysis: {
      insulatorCount: 3,
      crossarmType: 'balanced',
      crossarmDescription: 'Xà sứ đứng 3 pha lắp đều cân tâm',
      poleStructure: 'single',
      voltageLevelEstimate: '22kV',
      conditionAssessment: '3 quả sứ đứng còn nguyên vẹn, dây định vị và kẹp siết tốt',
      maintenanceRecommendations: ['Bảo dưỡng tra mỡ bu-lông gá xà định kỳ'],
      confidenceScore: 0.96,
    },
  },
  {
    id: 'pole-03',
    code: 'T12/471-BM',
    name: 'Trụ rẽ nhánh KDC Ninh Trung - Bình Minh',
    lat: 11.377,
    lng: 106.1465,
    address: 'Đường Bời Lời, Khu phố Ninh Trung, Phường Bình Minh, TP Tây Ninh',
    voltageLevel: '22kV',
    insulatorCount: 6,
    crossarmType: 'offset',
    crossarmDescription: 'Xà néo thép mạ kẽm lắp lệch sang phải 70cm để tránh cây ăn trái',
    poleStructure: 'single',
    status: 'needs_maintenance',
    notes: 'Xà néo lệch tâm tránh tán cây cao su và vườn cây, thực hiện 5 công tác Hotline đồng thời',
    createdAt: '2026-10-16T08:00:00Z',
    selectedTaskCodes: [
      '16.01.01-1',
      '16.03.02-1',
      '16.09.01-1',
      '16.13.01-1',
      '16.16.05-1',
    ],
    aiAnalysis: {
      insulatorCount: 6,
      crossarmType: 'offset',
      crossarmDescription: 'Xà néo lệch tâm 70cm, cách điện đứng polyme',
      poleStructure: 'single',
      voltageLevelEstimate: '22kV',
      conditionAssessment: 'Sứ chuỗi bám bụi mùa khô nắng gió Tây Ninh, dây bọc có vết cọ quẹt nhẹ cành cây',
      maintenanceRecommendations: [
        'Phát quang tán cây hành lang an toàn lưới điện cao áp',
        'Siết lại kẹp quai và thay thế sứ đứng vị trí số 2',
      ],
      confidenceScore: 0.93,
    },
  },
  {
    id: 'pole-04',
    code: 'T18/471-BM',
    name: 'Trụ néo góc 22kV hướng Núi Bà Đen',
    lat: 11.3835,
    lng: 106.1528,
    address: 'Đoạn cuối Đường Bời Lời, Chân Núi Bà, Phường Bình Minh, TP Tây Ninh',
    voltageLevel: '22kV',
    insulatorCount: 12,
    crossarmType: 'balanced',
    crossarmDescription: 'Trụ đôi chữ H lắp xà giằng néo kép chịu lực căng góc cua lên Núi Bà',
    poleStructure: 'double',
    status: 'critical',
    notes: 'Trụ đôi chữ H néo góc chuyển hướng cung đường lên KDL Núi Bà Đen, sứ chuỗi bám bụi mùa khô, cần thi công Hotline ngay',
    createdAt: '2026-10-16T10:00:00Z',
    selectedTaskCodes: [
      '16.01.01-1',
      '16.03.02-1',
      '16.09.01-1',
      '16.13.01-1',
      '16.16.05-1',
    ],
    aiAnalysis: {
      insulatorCount: 12,
      crossarmType: 'balanced',
      crossarmDescription: 'Trụ đôi chữ H lắp xà giằng kép chịu lực căng néo góc',
      poleStructure: 'double',
      voltageLevelEstimate: '22kV',
      conditionAssessment: 'Bu-lông giằng xà có hiện tượng oxy hóa do sương ẩm chân núi, sứ chuỗi bám bụi đất đỏ cần vệ sinh Hotline',
      maintenanceRecommendations: [
        'Sơn chống rỉ và siết lại toàn bộ ốc bulong xà giằng',
        'Đo điện trở tiếp địa cột mùa nắng trước mùa giông sét Núi Bà',
      ],
      confidenceScore: 0.94,
    },
  },

  // --- TUYẾN 473 BÌNH MINH (DỌC ĐƯỜNG TRẦN PHÚ) ---
  {
    id: 'pole-05',
    code: 'T03/473-BM',
    name: 'Trụ đỡ ba pha Trần Phú - Bình Minh',
    lat: 11.3645,
    lng: 106.133,
    address: 'Số 145 Đường Trần Phú, Phường Bình Minh, TP Tây Ninh',
    voltageLevel: '22kV',
    insulatorCount: 3,
    crossarmType: 'balanced',
    crossarmDescription: 'Xà đỡ thẳng composite 3 pha lắp cân đối tiêu chuẩn',
    poleStructure: 'single',
    status: 'inspected',
    notes: 'Tuyến 473 cấp điện cho khu dân cư trung tâm phường, tình trạng sứ đứng tốt',
    createdAt: '2026-10-16T14:20:00Z',
    selectedTaskCodes: ['16.01.01-1', '16.03.02-1', '16.16.05-1'],
    aiAnalysis: {
      insulatorCount: 3,
      crossarmType: 'balanced',
      crossarmDescription: 'Xà đỡ thẳng 3 pha 22kV kết hợp hộp chia công tơ',
      poleStructure: 'single',
      voltageLevelEstimate: '22kV',
      conditionAssessment: 'Hộp chia dây công tơ gọn gàng, kẹp tiếp địa an toàn',
      maintenanceRecommendations: ['Bảo dưỡng định kỳ mối nối dây bọc'],
      confidenceScore: 0.95,
    },
  },
  {
    id: 'pole-06',
    code: 'T09/473-BM',
    name: 'Trụ liên kết tuyến 473 Trần Phú',
    lat: 11.3615,
    lng: 106.129,
    address: 'Đường Trần Phú, Hẻm 12, Phường Bình Minh, TP Tây Ninh',
    voltageLevel: '22kV',
    insulatorCount: 6,
    crossarmType: 'offset',
    crossarmDescription: 'Xà néo lắp lệch mép đường kết hợp bộ dao cách ly phân đoạn',
    poleStructure: 'single',
    status: 'needs_maintenance',
    notes: 'Trụ liên kết lộ 473 có lắp dao cách ly phân đoạn, thực hiện 4 công tác bảo dưỡng Hotline',
    createdAt: '2026-10-17T08:30:00Z',
    selectedTaskCodes: [
      '16.01.01-1',
      '16.03.02-1',
      '16.09.01-1',
      '16.16.05-1',
    ],
    aiAnalysis: {
      insulatorCount: 6,
      crossarmType: 'offset',
      crossarmDescription: 'Xà néo lệch góc lắp bộ DCL phân đoạn mạch vòng',
      poleStructure: 'single',
      voltageLevelEstimate: '22kV',
      conditionAssessment: 'Lưỡi tiếp điểm dao cách ly có vết muội than đóng cắt, sứ đỡ cần bảo dưỡng',
      maintenanceRecommendations: [
        'Vệ sinh tra mỡ dẫn điện tiếp điểm dao cách ly',
        'Kiểm tra độ võng dây lèo Hotline',
      ],
      confidenceScore: 0.92,
    },
  },
  {
    id: 'pole-07',
    code: 'T15/473-BM',
    name: 'Trụ Trạm biến áp phân phối Bình Minh 3',
    lat: 11.358,
    lng: 106.1245,
    address: 'Gần Chợ Bình Minh, Đường Trần Phú, Phường Bình Minh, TP Tây Ninh',
    voltageLevel: '22kV',
    insulatorCount: 9,
    crossarmType: 'balanced',
    crossarmDescription: 'Trụ đôi giàn trạm biến áp phân phối 3x50kVA cấp điện Chợ Bình Minh',
    poleStructure: 'double',
    status: 'needs_maintenance',
    notes: 'Trụ đôi lắp trạm biến áp giàn 3x50kVA cấp điện Chợ Bình Minh, cần kiểm tra kẹp rẽ Hotline và dây lèo',
    createdAt: '2026-10-17T11:00:00Z',
    selectedTaskCodes: [
      '16.01.01-1',
      '16.03.02-1',
      '16.09.01-1',
      '16.13.01-1',
      '16.16.05-1',
    ],
    aiAnalysis: {
      insulatorCount: 9,
      crossarmType: 'balanced',
      crossarmDescription: 'Trụ đôi giàn TBA treo 3 pha, bộ chống sét van LA và FCO Hotline',
      poleStructure: 'double',
      voltageLevelEstimate: '22kV',
      conditionAssessment: 'Chống sét van LA hoạt động tốt, chì FCO chưa bị phóng điện, cần kiểm tra kẹp rẽ Hotline',
      maintenanceRecommendations: [
        'Đo nhiệt độ tiếp xúc kẹp quai rẽ nhánh vào trạm lúc cao điểm',
        'Thay thế sứ chuỗi néo đầu trạm',
      ],
      confidenceScore: 0.96,
    },
  },
  {
    id: 'pole-08',
    code: 'T24/473-BM',
    name: 'Cột tháp chuyển tiếp 110kV/22kV Trần Phú',
    lat: 11.353,
    lng: 106.1195,
    address: 'Đoạn cuối Đường Trần Phú, Giáp ranh Ninh Thạnh, TP Tây Ninh',
    voltageLevel: '110kV',
    insulatorCount: 18,
    crossarmType: 'balanced',
    crossarmDescription: 'Tháp sắt kết cấu không gian mạ kẽm đấu nối lộ 473 về trạm 110kV Tây Ninh 2',
    poleStructure: 'steel_tower',
    status: 'critical',
    notes: 'Cột tháp thép không gian đấu nối lộ 473 về trạm 110kV Tây Ninh 2, sứ treo thủy tinh bám bụi rỉ sét nhẹ bu lông gá',
    createdAt: '2026-10-17T15:00:00Z',
    selectedTaskCodes: [
      '16.01.01-1',
      '16.03.02-1',
      '16.09.01-1',
      '16.16.05-1',
    ],
    aiAnalysis: {
      insulatorCount: 18,
      crossarmType: 'balanced',
      crossarmDescription: 'Tháp sắt kết cấu không gian, xà đà đối xứng đa tầng 110kV/22kV',
      poleStructure: 'steel_tower',
      voltageLevelEstimate: '110kV',
      conditionAssessment: 'Chuỗi sứ thủy tinh cách điện bám bụi đất đỏ Tây Ninh, phát hiện tổ chim trên đỉnh xà chống sét',
      maintenanceRecommendations: [
        'Gỡ bỏ tổ chim trên đỉnh xà chống sự cố phóng điện bẩn',
        'Kiểm tra dây chống sét OPGW và hệ thống kim thu sét chân núi',
      ],
      confidenceScore: 0.97,
    },
  },
];

export function getInitialPoles(
  depot: WorkplaceDepot = DEFAULT_DEPOT,
  rates: MaintenanceRates = DEFAULT_MAINTENANCE_RATES
): ElectricPole[] {
  return RAW_SEED_POLES.map((raw) => {
    const { selectedTaskCodes, ...poleData } = raw;
    const dist = calculateDistanceKm(depot.lat, depot.lng, poleData.lat, poleData.lng);
    const tasks = createDefaultTasksForPole(selectedTaskCodes);
    const evnBreakdown = calculateEVNMultiTaskCost(tasks, dist, rates);

    return {
      ...poleData,
      distanceFromBaseKm: dist,
      tasks,
      evnCostBreakdown: evnBreakdown,
      maintenanceCostVnd: evnBreakdown.totalEstimatedCost,
    };
  });
}
