export type VoltageLevel = string;
export type CrossarmType = string;
export type PoleStructure = string;
export type PoleStatus = 'inspected' | 'needs_maintenance' | 'critical';
export type VehicleType = 'motorbike' | 'truck';

export interface CrossarmOption {
  id: string;
  label: string;
  sublabel?: string;
  multiplier: number;
}

export interface StructureOption {
  id: string;
  label: string;
  sublabel?: string;
  multiplier: number;
}

export interface EstimateOptions {
  voltageLevel?: string;
  generalExpenseRate?: number;
  taxableIncomeRate?: number;
  transportDistanceKm?: number;
  trafficSafetyCost?: number;
  vatRate?: number;
  isRenovation?: boolean;
  fuelPricePerLiter?: number;
  workerVehicleQuota?: number;
  bucketVehicleQuota?: number;
  craneVehicleQuota?: number;
  trafficSafetyRate?: number;
  trafficSafetyShifts?: number;
  surveyLaborCost?: number;
}

export interface PolePositionData {
  id: string;                       // vd: "pos-1", "pos-2"
  positionIndex: number;            // 1, 2, ... tối đa 20 vị trí
  poleCode: string;                 // Mã số trụ (nhập tay hoặc để trống)
  name?: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  voltageLevel: VoltageLevel;       // 2 cấp 22kV hoặc 12,7kV
  insulatorCount: number;
  crossarmType: CrossarmType;
  crossarmDescription?: string;
  poleStructure: PoleStructure;
  status?: PoleStatus;
  notes?: string;
  tasks: MaintenanceTask[];
  isFilled: boolean;                // true nếu vị trí này có dữ liệu
}

export interface TaskCondition {
  id: string;
  code: string;                     // vd: "16.01.01-1.1", "16.01.01-1.14"
  description: string;
  coefficients: {
    auxiliaryMaterial?: number;     // Kvlp hoặc Kvl
    hotline?: number;               // Kvlhl hoặc Kvl
    labor?: number;                 // Knc
    machinery?: number;             // Kmtc
  };
}

export interface TaskCoefficients {
  material: number;
  auxiliaryMaterial: number;
  labor: number;
  machinery: number;
}

export interface MaintenanceTask {
  id: string;
  code: string;                     // vd: "16.01.01-1", "16.03.02-1", "16.09.01-1", "16.13.01-1", "16.16.05-1"
  name: string;                     // Tên hạng mục: Thay thế cách điện đứng, Kẹp quai, Xà lắp đối xứng...
  description?: string;             // Nội dung công việc: Lắp mới 6 cách điện đứng, Lắp mới 3 kẹp quai...
  unit?: string;                    // Đơn vị: "1 bộ", "1 bộ trụ", "01 bộ"...
  taskCount?: number;               // Số công tác: 2 (cho cách điện đứng), 1...
  quantity?: number;                // Khối lượng: 2, 1...
  positionType?: string;            // Vị trí đặc thù
  baseRates: {
    auxiliaryMaterial: number;      // Vật liệu phụ (VNĐ) - Cột (7)
    hotline: number;                // Vật liệu Hotline (VNĐ) - Cột (8)
    labor: number;                  // Nhân công (VNĐ) - Cột (9)
    machinery: number;              // Máy thi công (VNĐ) - Cột (10)
  };
  baseRatesByVoltage?: Record<string, {
    auxiliaryMaterial: number;
    hotline: number;
    labor: number;
    machinery: number;
  }>;
  positionCoefficients: TaskCoefficients; // Hệ số điều chỉnh Kđc: Kvlp (11), Kvlht (12), Knc (13), Kmtc (14)
  conditions?: TaskCondition[];          // 15 điều kiện thi công hotline hoặc tùy biến
  selectedConditionIds?: string[];       // Danh sách ID các điều kiện được chọn (nhân dồn với nhau)
  isSelected: boolean;
}

export interface EVNMultiTaskCostBreakdown {
  tasksCount: number;
  tasksDetail: Array<{
    code: string;
    name: string;
    description?: string;
    unit?: string;
    taskCount: number;
    quantity: number;
    rawAuxiliaryMaterial: number;
    rawHotline: number;
    rawLabor: number;
    rawMachinery: number;
    coeffAuxiliaryMaterial: number;
    coeffHotline: number;
    coeffLabor: number;
    coeffMachinery: number;
    finalMaterialPart: number;
    finalHotlinePart: number;
    finalLaborPart: number;
    finalMachineryPart: number;
    itemSubtotal: number;
  }>;
  // Phụ lục 1: Tổng trước hệ số đồng thời (Mục A)
  rawTotalMaterial: number;          // Tổng VL phụ trước Kđt1 (VL1)
  rawTotalHotline: number;           // Tổng VL hotline trước Kđt1 (VL2)
  rawTotalLabor: number;             // Tổng Nhân công trước Kđt1
  rawTotalMachinery: number;         // Tổng Máy thi công trước Kđt1
  // Hệ số đồng thời nhóm Kđt1 (Mục B)
  concurrentLaborMultiplier: number;    // Knc: >=6 công tác là 0.95, 3-5 là 1.0, 1-2 là 1.0
  concurrentMachineryMultiplier: number;// Kmtc: >=6 công tác là 0.85, 3-5 là 0.90, 1-2 là 1.0
  // Sau hệ số đồng thời (Mục C)
  finalTotalMaterial: number;        // VL1
  finalTotalHotline: number;         // VL2
  totalMaterialCost: number;         // VL = VL1 + VL2
  finalTotalLabor: number;           // NC = rawTotalLabor * Knc
  finalTotalMachinery: number;       // M = rawTotalMachinery * Kmtc
  
  // BẢNG TỔNG HỢP DỰ TOÁN CHI PHÍ HOTLINE (Phụ lục TH-01)
  // I. Chi phí trực tiếp (T = VL + NC + M)
  directCost: number;
  // II. Chi phí gián tiếp (GT = C = 65% x NC)
  generalExpenseRate: number;        // 0.65 (65%)
  totalIndirectCost: number;         // C = 65% x NC
  // III. Thu nhập chịu thuế tính trước (TL = 6% x (T + GT))
  taxableIncomeRate: number;         // 0.06 (6%)
  taxableIncomeBeforeTax: number;    // TL
  // IV. Chi phí vận chuyển Hotline (VC - Phụ lục 4)
  transportDistanceKm: number;       // Cự ly (km)
  fuelPricePerLiter: number;         // Đơn giá dầu DO (30.490 đ/lít)
  workerVehicleCost: number;         // Xe chở công nhân (12.5 L/100km x 2 lượt)
  bucketVehicleCost: number;         // Xe gàu Hotline (16.0 L/100km x 2 lượt)
  craneVehicleCost: number;          // Xe cẩu/dựng trụ Hotline (25.0 L/100km x 2 lượt)
  totalTransportationCost: number;   // VC = Tổng 3 xe
  // V. Chi phí khác: Rào chắn, cảnh giới giao thông (K - Phụ lục 5)
  trafficSafetyShifts: number;       // 0.5 ca máy
  trafficSafetyRate: number;         // 298.431 đ/công (bậc 3/7)
  totalTrafficSafetyCost: number;    // K = 149.215 đ
  // A. Giá trị xây dựng trước thuế (Gxd = T + GT + TL + VC + K)
  constructionValueBeforeTax: number;// Gxd
  // B. Chi phí khảo sát, lập phương án thi công (Gpa = Gpa1 + Gpa2)
  surveyLaborCost: number;           // Nhân công khảo sát bậc 4.5/7 (197.405 đ)
  surveyVehicleCost: number;         // Vận chuyển khảo sát 12.5 L/100km (426.860 đ)
  totalSurveyCost: number;           // Gpa1 = Phụ lục 6 (624.265 đ)
  planPreparationRate: number;       // 2.46% x 0.93 x Gxd x K (K=1 lắp mới, K=1.2 cải tạo)
  planPreparationCost: number;       // Gpa2 (1.277.608 đ)
  totalPlanCost: number;             // Gpa = Gpa1 + Gpa2 (1.901.873 đ)
  // C. Tổng dự toán trước thuế (Gtt = Gxd + Gpa)
  totalEstimateBeforeTax: number;    // Gtt (57.746.274 đ)
  // D. Thuế giá trị gia tăng (GTGT = 8% x Gtt)
  vatRate: number;                   // 0.08 (8%)
  vatAmount: number;                 // GTGT (4.619.702 đ)
  // E. Tổng dự toán sau thuế (Gdt = Gtt + GTGT)
  totalEstimateAfterTax: number;     // Gdt (62.365.976 đ)
  totalInWords: string;              // Viết bằng chữ

  // Aliases for compatibility
  distanceAllowance: number;
  totalEstimatedCost: number;
}

export interface AIAnalysisResult {
  insulatorCount: number;
  crossarmType: CrossarmType;
  crossarmDescription: string;
  poleStructure: PoleStructure;
  voltageLevelEstimate: VoltageLevel;
  conditionAssessment: string;
  maintenanceRecommendations: string[];
  confidenceScore?: number;
}

export interface ElectricPole {
  id: string;
  code: string;                  // Mã số trụ, ví dụ: "T45/02-C2"
  name: string;                  // Tên/mô tả vị trí trụ
  lat: number;                   // Vĩ độ GPS
  lng: number;                   // Kinh độ GPS
  address: string;               // Địa chỉ chi tiết (Ấp, Xã, Huyện, Tỉnh)
  distanceFromBaseKm: number;    // Khoảng cách từ chỗ làm (km)
  voltageLevel: VoltageLevel;    // Cấp điện áp
  insulatorCount: number;        // Số cục sứ
  crossarmType: CrossarmType;    // Cây đà lắp lệch hay cân
  crossarmDescription?: string;  // Chi tiết xà đà
  poleStructure: PoleStructure;  // Trụ đơn hay trụ đôi, tháp sắt
  imageUrl?: string;             // Ảnh chụp cây trụ
  aiAnalysis?: AIAnalysisResult; // Kết quả phân tích từ AI
  tasks?: MaintenanceTask[];     // Danh sách các công tác bảo trì áp dụng tại trụ
  evnCostBreakdown?: EVNMultiTaskCostBreakdown; // Bóc tách dự toán đa công tác chuẩn EVN
  estimateOptions?: EstimateOptions;
  maintenanceCostVnd: number;    // Số tiền định mức bảo trì tính toán
  status: PoleStatus;            // Tình trạng kiểm tra
  notes?: string;                // Ghi chú công nhân hiện trường
  createdAt: string;             // Ngày tạo / kiểm tra
}

export interface WorkplaceDepot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface MaintenanceRates {
  baseCostByVoltage: Record<string, number>;
  costPerInsulator: number;         // Đơn giá kiểm tra/vệ sinh mỗi cục sứ (VNĐ)
  offsetCrossarmMultiplier: number; // Hệ số nhân khi đà lắp lệch (ví dụ 1.35 = tăng 35%)
  doublePoleMultiplier: number;     // Hệ số nhân trụ đôi (ví dụ 1.50 = tăng 50%)
  steelTowerMultiplier: number;     // Hệ số nhân tháp sắt (ví dụ 2.20 = tăng 120%)
  crossarmOptions?: CrossarmOption[]; // Danh sách các loại cây đà lắp đặt tùy biến
  structureOptions?: StructureOption[]; // Danh sách các loại kết cấu thân trụ tùy biến
  quickInsulatorCounts?: number[];    // Danh sách các nút chọn nhanh số lượng cục sứ
  distanceAllowancePerKm: number;   // Phụ cấp khoảng cách (VNĐ/km)
  fuelConsumption: {
    motorbikeLitersPer100Km: number; // Định mức xe máy (lít/100km, ví dụ: 2.5)
    truckLitersPer100Km: number;     // Định mức xe tải cẩu (lít/100km, ví dụ: 14.5)
  };
  fuelPricePerLiterVnd: number;      // Giá xăng dầu hiện hành (VNĐ/lít)
  petrolPricePerLiterVnd?: number;   // Giá xăng RON 95 (VNĐ/lít)
  dieselPricePerLiterVnd?: number;   // Giá dầu DO 0,05S (VNĐ/lít)
  fixedTravelAllowanceVnd?: number;  // Định mức di chuyển cố định (Admin/Mod)
  fixedOperationAllowanceVnd?: number; // Định mức vận hành cố định (Admin/Mod)
  isFixedAllowanceEnabled?: boolean; // Bật chế độ cố định định mức
  section2CategoryTitles?: Record<string, string>; // Tên các mục tùy biến trong Section 2
  customTechnicalCategories?: Array<{
    id: string;
    name: string;
    options: Array<{
      id: string;
      label: string;
      sublabel?: string;
      multiplier?: number;
    }>;
  }>;
}

export interface RouteOptimizationResult {
  isRoundTrip: boolean;
  orderedPoles: ElectricPole[];
  totalDistanceKm: number;
  roundTripDistanceKm: number;
  legs: Array<{
    fromName: string;
    toName: string;
    distanceKm: number;
    fromCoords: [number, number];
    toCoords: [number, number];
  }>;
  fuelUsedLiters: number;
  fuelCostVnd: number;
  estimatedTravelTimeMinutes: number;
  vehicleType: VehicleType;
}

export interface CostBreakdown {
  baseVoltageCost: number;
  insulatorCost: number;
  structureMultiplier: number;
  crossarmMultiplier: number;
  subtotalStructure: number;
  distanceAllowance: number;
  totalCostVnd: number;
  evnBreakdown?: EVNMultiTaskCostBreakdown;
}

export type HeaderBadgeType = 'primary' | 'success' | 'warning' | 'info' | 'purple' | 'slate' | 'rose';

export interface CustomHeaderField {
  id: string;
  label: string;       // Tiêu đề trường (VD: "Mã xuất tuyến", "Chỉ huy trực tiếp", "Số điện thoại")
  value: string;       // Giá trị (VD: "Lộ 471 & 473 Bình Minh", "KS. Nguyễn Văn A", "0276.3822.114")
  badgeType: HeaderBadgeType; // Kiểu hiển thị huy hiệu màu
  showInNavbar: boolean; // Hiển thị trên thanh tiêu đề/khung ngữ cảnh
  showInReport: boolean; // Hiển thị trên báo cáo phiếu in A4
}

export interface HeaderCustomizationSettings {
  appTitle: string;          // Tên ứng dụng (Mặc định: "EVN PoleInspector")
  appSubtitle: string;       // Tiêu đề phụ (Mặc định: "Quản Lý Trụ Điện & Lộ Trình Bảo Trì")
  brandIcon: string;         // Biểu tượng (Mặc định: "⚡")
  parentOrganization: string;// Đơn vị cấp trên (Mặc định: "TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM")
  subOrganization: string;   // Công ty trực thuộc (Mặc định: "TỔNG CÔNG TY ĐIỆN LỰC MIỀN NAM - CÔNG TY ĐIỆN LỰC TÂY NINH")
  unitName: string;          // Đội / Phân xưởng (Mặc định: "Đội Quản lý Vận hành Điện lực TP Tây Ninh - Khu vực Bình Minh")
  unitAddress: string;       // Địa chỉ trụ sở (Mặc định: "Số 86 Đường Trần Phú, Phường Bình Minh, TP Tây Ninh")
  themeColor: 'blue' | 'navy' | 'emerald' | 'amber' | 'crimson'; // Tông màu chủ đạo
  navbarStyle: 'clean_white' | 'dark_navy' | 'evn_blue';        // Kiểu nền thanh tiêu đề
  showGpsBadge: boolean;     // Hiển thị tọa độ GPS trên khung tiêu đề
  showTotalCostBadge: boolean; // Hiển thị tổng tiền định mức toàn tuyến trên khung tiêu đề
  
  // Tùy chỉnh vẽ khung & giao diện khung thông tin (Frame Styling)
  frameBorderRadius?: 'rounded-none' | 'rounded-lg' | 'rounded-xl' | 'rounded-2xl';
  frameBorderStyle?: 'solid' | 'dashed' | 'double';
  frameBorderColor?: 'slate' | 'sky' | 'blue' | 'emerald' | 'amber';
  frameBgColor?: 'white' | 'slate_light' | 'sky_light' | 'amber_light' | 'emerald_light';
  frameShadow?: 'none' | 'sm' | 'md' | 'lg';
  framePadding?: 'compact' | 'normal' | 'spacious';

  // Tùy chỉnh các tiêu đề phân hệ trên trang web (Section Headings)
  sectionTitles?: {
    mapTitle?: string;
    routeTitle?: string;
    ledgerTitle?: string;
    ratesTitle?: string;
  };

  customFields: CustomHeaderField[]; // Các trường tùy biến do người dùng tạo thêm
}
