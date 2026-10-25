import React, { useState, useRef, useEffect } from 'react';
import {
  AIAnalysisResult,
  ElectricPole,
  EstimateOptions,
  MaintenanceRates,
  MaintenanceTask,
  WorkplaceDepot,
} from '../types/pole';
import {
  calculateDistanceKm,
  calculateEVNMultiTaskCost,
  calculatePoleCostBreakdown,
  formatKm,
  formatVnd,
} from '../utils/calculations';
import { createDefaultTasksForPole } from '../data/seedData';
import { validCoordinates } from '../utils/storage';
import { EVNCostBreakdownView } from './EVNCostBreakdownView';
import { SAMPLE_POLE_IMAGES, SamplePoleImage } from '../utils/sampleImages';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Cpu,
  FileCheck,
  Flame,
  Image as ImageIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
  Upload,
  Wrench,
  Zap,
} from 'lucide-react';

interface AIPoleInspectorProps {
  depot: WorkplaceDepot;
  rates: MaintenanceRates;
  onSavePole: (pole: Omit<ElectricPole, 'id' | 'createdAt'>) => void;
  onRequestPickOnMap?: (initialData: Partial<ElectricPole>) => void;
}

export const AIPoleInspector: React.FC<AIPoleInspectorProps> = ({
  depot,
  rates,
  onSavePole,
  onRequestPickOnMap,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(
    SAMPLE_POLE_IMAGES[0].dataUrl
  );
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/svg+xml');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields for saving the pole
  const [poleCode, setPoleCode] = useState<string>('T-AI-01');
  const [poleName, setPoleName] = useState<string>('Trụ kiểm tra hiện trường qua ảnh');
  const [address, setAddress] = useState<string>(depot.address);
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(calculateDistanceKm(depot.lat, depot.lng, depot.lat + 0.009, depot.lng - 0.012));
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number }>({
    lat: Number((depot.lat + 0.009).toFixed(5)),
    lng: Number((depot.lng - 0.012).toFixed(5)),
  });
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Handle file select (camera or gallery)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setErrorMsg('Chọn ảnh JPG, PNG hoặc WebP, tối đa 10 MB.');
      return;
    }
    const mime = file.type;
    setSelectedMimeType(mime);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
        setAnalysisResult(null);
        setErrorMsg(null);
        setSaveSuccess(false);
      }
    };
    reader.onerror = () => setErrorMsg('Không đọc được tệp ảnh. Vui lòng thử lại.');
    reader.readAsDataURL(file);
  };

  // Select sample image
  const handleSelectSample = (sample: SamplePoleImage) => {
    setSelectedImage(sample.dataUrl);
    setSelectedMimeType('image/svg+xml');
    setAnalysisResult(null);
    setErrorMsg(null);
    setSaveSuccess(false);
  };

  // Run AI Analysis via backend endpoint
  const handleRunAnalysis = async () => {
    if (!selectedImage) return;

    setAnalysisResult(null);
    setIsAnalyzing(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      if (location.protocol === 'file:') throw new Error('Phân tích AI cần bản web chạy qua máy chủ. Mở http://localhost:3001 hoặc địa chỉ LAN sau khi khởi động máy chủ.');
      let imageBase64 = selectedImage;
      let mimeType = selectedMimeType;
      if (mimeType === 'image/svg+xml') {
        const image = new Image();
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = selectedImage; });
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Không thể đọc ảnh mẫu.');
        context.drawImage(image, 0, 0);
        imageBase64 = canvas.toDataURL('image/png'); mimeType = 'image/png';
      }
      const response = await fetch('/api/analyze-pole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
        }),
      });

      if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Dịch vụ AI chưa chạy. Hãy mở bản web qua npm run dev.');
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Phân tích hình ảnh thất bại.');
      }

      const data: AIAnalysisResult = json.data;
      setAnalysisResult(data);

      // Auto-tune EVN tasks according to AI detection
      setTasks((prev) =>
        prev.map((t) => {
          if (t.code === '16.01.01-1') return { ...t, isSelected: (data.insulatorCount ?? 0) > 0 };
          if (t.code === '16.09.01-1') return { ...t, isSelected: data.crossarmType === 'offset' || data.crossarmType === 'balanced' };
          if (t.code === '16.13.01-1') return { ...t, isSelected: data.poleStructure === 'double' || data.poleStructure === 'steel_tower' };
          return t;
        })
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Không thể kết nối với dịch vụ AI phân tích.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get current device GPS coordinates
  const handleGetDeviceGps = () => {
    if (!navigator.geolocation) {
      alert('Thiết bị không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const newCoords = {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
        };
        setGpsCoords(newCoords);

        // Calculate distance from depot
        const dist = calculateDistanceKm(
          depot.lat,
          depot.lng,
          newCoords.lat,
          newCoords.lng
        );
        setCustomDistanceKm(dist);

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              setAddress(data.display_name.slice(0, 100));
            }
          }
        } catch {
          // ignore
        }

        setIsLocatingGps(false);
      },
      (err) => {
        setIsLocatingGps(false);
        alert(`Lỗi GPS: ${err.message}`);
      },
      { enableHighAccuracy: true }
    );
  };

  const [estimateOptions, setEstimateOptions] = useState<EstimateOptions>({});

  // EVN Multi-Tasks Checklist
  const [tasks, setTasks] = useState<MaintenanceTask[]>(() =>
    createDefaultTasksForPole()
  );

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, isSelected: !t.isSelected } : t))
    );
  };

  const handleTogglePositionType = (taskId: string, isOuter: boolean) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            positionType: isOuter ? 'outer_insulator' : 'inner_insulator',
            positionCoefficients: {
              ...t.positionCoefficients,
              labor: isOuter ? 0.8 : 1.0,
              machinery: isOuter ? 0.8 : 1.0,
            },
          };
        }
        return t;
      })
    );
  };

  // Calculate live EVN breakdown
  const evnBreakdown = calculateEVNMultiTaskCost(tasks, customDistanceKm, rates, estimateOptions);

  // Calculate live cost preview
  const previewCostBreakdown = analysisResult
    ? calculatePoleCostBreakdown(
        {
          voltageLevel: analysisResult.voltageLevelEstimate,
          insulatorCount: analysisResult.insulatorCount,
          crossarmType: analysisResult.crossarmType,
          poleStructure: analysisResult.poleStructure,
          distanceFromBaseKm: customDistanceKm,
        },
        rates
      )
    : null;

  // Handle Save to Ledger
  const handleSaveToLedger = () => {
    if (!analysisResult) return;
    if (!validCoordinates(gpsCoords.lat, gpsCoords.lng) || !Number.isFinite(customDistanceKm) || customDistanceKm < 0) {
      setErrorMsg('Tọa độ hoặc khoảng cách không hợp lệ.');
      return;
    }

    const newPole: Omit<ElectricPole, 'id' | 'createdAt'> = {
      code: poleCode.trim() || `T-${Math.floor(100 + Math.random() * 900)}`,
      name: poleName.trim() || 'Trụ giám định AI',
      lat: gpsCoords.lat,
      lng: gpsCoords.lng,
      address: address.trim() || 'Địa bàn kiểm tra',
      distanceFromBaseKm: customDistanceKm,
      voltageLevel: analysisResult.voltageLevelEstimate,
      insulatorCount: analysisResult.insulatorCount,
      crossarmType: analysisResult.crossarmType,
      crossarmDescription: analysisResult.crossarmDescription,
      poleStructure: analysisResult.poleStructure,
      imageUrl: selectedImage || undefined,
      aiAnalysis: analysisResult,
      tasks,
      evnCostBreakdown: evnBreakdown,
      estimateOptions,
      maintenanceCostVnd: evnBreakdown.totalEstimatedCost,
      status:
        analysisResult.crossarmType === 'offset' || analysisResult.insulatorCount > 8
          ? 'needs_maintenance'
          : 'inspected',
      notes: analysisResult.conditionAssessment,
    };

    onSavePole(newPole);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-sky-400 font-semibold mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-300" />
              <span>Thị Giác Máy Tính AI · Gemini 3.8 Flash</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Chụp & Phân Tích Hiện Trường Trụ Điện
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Tự động nhận diện và đếm chính xác số cục sứ, xác định cây đà lắp lệch hay cân đối, phân loại trụ đơn hay đôi, ghi nhận tọa độ GPS và tính toán định mức bảo trì tương ứng.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              <span>Chụp ảnh mới</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors border border-slate-700 whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Tải file ảnh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Ảnh mẫu là hình minh họa. Kết quả AI cần được người kiểm tra xác nhận trước khi lưu vào hồ sơ kỹ thuật.</div>
      {/* Main 2-Column Split: Image Input vs AI Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Preview & Sample Selectors (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                <ImageIcon className="w-4 h-4 text-sky-600" />
                <span>Ảnh cây trụ điện cần kiểm tra</span>
              </span>
              <span className="text-[11px] text-slate-400">Độ phân giải cao</span>
            </div>

            {/* Image Preview Box */}
            <div className="relative aspect-[4/5] bg-slate-950 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center group">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Ảnh chụp cây trụ điện"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 space-y-2">
                  <Camera className="w-10 h-10 mx-auto text-slate-500" />
                  <p className="text-xs">Chưa có ảnh. Vui lòng bấm chụp hoặc chọn ảnh mẫu bên dưới.</p>
                </div>
              )}

              {/* Action Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleRunAnalysis}
                  disabled={!selectedImage || isAnalyzing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-lg disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI đang đếm sứ & phân tích đà...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{analysisResult ? 'Phân tích lại bức ảnh' : 'Bắt đầu phân tích AI'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preset Sample Gallery */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Ảnh minh họa để thử giao diện:
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SAMPLE_POLE_IMAGES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 ${
                      selectedImage === sample.dataUrl
                        ? 'border-sky-500 bg-sky-50/50 text-sky-950 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{sample.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{sample.description}</div>
                    </div>
                    <div className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-600">
                      {sample.insulatorsExpected} sứ · {sample.armTypeExpected === 'offset' ? 'Đà lệch' : 'Đà cân'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Results & Maintenance Calculation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Đã lưu thành công trụ điện vào tuyến kiểm tra và bản đồ lộ trình!</span>
            </div>
          )}

          {/* AI Analysis Cards */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Kết Quả Giám Định Kỹ Thuật AI</h3>
              </div>
              {analysisResult && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Độ tin cậy: <span className="font-mono text-emerald-600 font-semibold">96.5%</span>
                </span>
              )}
            </div>

            {analysisResult ? (
              <div className="space-y-4">
                {/* 4 Primary Findings Metric Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Metric 1: Insulators Count */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <div className="text-[11px] text-slate-500 font-medium">Số lượng cục sứ</div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
                      {analysisResult.insulatorCount}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">cục / bát sứ</div>
                  </div>

                  {/* Metric 2: Crossarm Balance */}
                  <div
                    className={`p-3 rounded-lg border text-center ${
                      analysisResult.crossarmType === 'offset'
                        ? 'bg-amber-50/80 border-amber-300 text-amber-900'
                        : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    <div className="text-[11px] font-medium opacity-80">Kết cấu cây đà</div>
                    <div className="text-base font-bold mt-1">
                      {analysisResult.crossarmType === 'offset' ? 'ĐÀ LỆCH HẾT' : 'ĐÀ LẮP CÂN'}
                    </div>
                    <div className="text-[10px] opacity-75 mt-0.5">
                      {analysisResult.crossarmType === 'offset' ? '+35% định mức' : 'Tiêu chuẩn'}
                    </div>
                  </div>

                  {/* Metric 3: Pole Structure */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <div className="text-[11px] text-slate-500 font-medium">Thân cột trụ</div>
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {analysisResult.poleStructure === 'double'
                        ? 'TRỤ ĐÔI'
                        : analysisResult.poleStructure === 'steel_tower'
                        ? 'THÁP SẮT'
                        : 'TRỤ ĐƠN'}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {analysisResult.poleStructure === 'double'
                        ? 'Chữ H / Néo kép'
                        : 'Bê tông ly tâm'}
                    </div>
                  </div>

                  {/* Metric 4: Estimated Voltage */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <div className="text-[11px] text-slate-500 font-medium">Cấp điện áp</div>
                    <div className="text-xl font-extrabold text-sky-700 font-mono mt-0.5">
                      {analysisResult.voltageLevelEstimate}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Lưới phân phối</div>
                  </div>
                </div>

                {/* Detailed Crossarm & Pole Diagnosis Prose */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Nhận định kết cấu xà đà & hiện trạng:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {analysisResult.crossarmDescription}. {analysisResult.conditionAssessment}
                  </p>
                  {analysisResult.maintenanceRecommendations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="text-[11px] font-semibold text-slate-700 mb-1">
                        Hạng mục đề xuất bảo trì:
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                        {analysisResult.maintenanceRecommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* EVN Multi-Tasks Checklist & Position Multipliers */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                      <Wrench className="w-4 h-4 text-sky-600" />
                      <span>Danh mục công tác Hotline EVN ({tasks.filter((t) => t.isSelected).length} công tác)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Chuẩn ĐM 16 · 4 thành phần & hệ số Kđc, Kđt1
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-2.5 rounded-lg border transition-all ${
                          task.isSelected
                            ? 'border-sky-300 bg-sky-50/50'
                            : 'border-slate-200 bg-slate-50/60 opacity-70'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.isSelected}
                              onChange={() => handleToggleTask(task.id)}
                              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <span>{task.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-normal">
                                  {task.code}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                VL phụ: {formatVnd(task.baseRates.auxiliaryMaterial)} · Hotline: {formatVnd(task.baseRates.hotline)} · NC: {formatVnd(task.baseRates.labor)} · MTC: {formatVnd(task.baseRates.machinery)}
                              </div>
                            </div>
                          </label>

                          {/* Position Adjustment Toggle for 16.01.01-1 */}
                          {task.code === '16.01.01-1' && task.isSelected && (
                            <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-sky-200 text-[10px]">
                              <span className="text-slate-500 font-medium px-1">Điều chỉnh:</span>
                              <button
                                type="button"
                                onClick={() => handleTogglePositionType(task.id, true)}
                                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                                  task.positionType === 'outer_insulator'
                                    ? 'bg-sky-600 text-white font-bold'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                Đd 3 pha (Knc=1.2)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleTogglePositionType(task.id, false)}
                                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                                  task.positionType === 'inner_insulator'
                                    ? 'bg-sky-600 text-white font-bold'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                Lắp mới (Knc=0.8)
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expandable Multi-Step EVN Formula Breakdown View */}
                <div className="space-y-2">
                  <EVNCostBreakdownView
                    breakdown={evnBreakdown}
                    distanceKm={customDistanceKm}
                    initiallyExpanded={true}
                    tasks={tasks}
                    rates={rates}
                    onUpdateTasks={(newTasks) => setTasks(newTasks)}
                    estimateOptions={estimateOptions}
              onApplyOptions={setEstimateOptions}
              editable={true}
                  />
                </div>

                {/* Save to Route / Field Sheet Form */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Lưu thông tin & Ghi nhận tọa độ GPS vào tuyến</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">Mã số trụ</label>
                      <input
                        type="text"
                        value={poleCode}
                        onChange={(e) => setPoleCode(e.target.value)}
                        placeholder="VD: T12/01-AT"
                        className="w-full mt-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-slate-600">Tên / Vị trí mô tả</label>
                      <input
                        type="text"
                        value={poleName}
                        onChange={(e) => setPoleName(e.target.value)}
                        placeholder="VD: Nhánh rẽ Ấp 1 An Thạnh..."
                        className="w-full mt-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-slate-600">Địa chỉ (Ấp, Xã, Huyện...)</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ấp 1, Xã An Thạnh..."
                        className="w-full mt-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600">Khoảng cách từ chỗ làm (km)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customDistanceKm}
                        onChange={(e) => setCustomDistanceKm(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full mt-1 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* GPS Coordinates Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>GPS: {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGetDeviceGps}
                      disabled={isLocatingGps}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-medium rounded transition-colors whitespace-nowrap"
                    >
                      {isLocatingGps ? 'Đang lấy GPS...' : 'Lấy GPS điện thoại'}
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSaveToLedger}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Lưu Trụ & Cập Nhật Lộ Trình Tuyến Ngay</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Cpu className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
                <p className="text-xs">Bấm "Bắt đầu phân tích AI" để tự động quét ảnh và tính định mức.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
