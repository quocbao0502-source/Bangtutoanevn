import React, { useState } from 'react';
import { ActiveTab } from './Navbar';
import {
  Camera,
  Crosshair,
  FileText,
  Map,
  Menu,
  Plus,
  Route,
  Sparkles,
  X,
} from 'lucide-react';

interface MobileBottomBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  mobileSubView: 'map' | 'route';
  onSetMobileSubView: (subView: 'map' | 'route') => void;
  onOpenDrawer: () => void;
  onOpenAddModal: () => void;
  poleCount: number;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeTab,
  onSelectTab,
  mobileSubView,
  onSetMobileSubView,
  onOpenDrawer,
  onOpenAddModal,
  poleCount,
}) => {
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  return (
    <>
      {/* Quick Action Sheet Modal for Central Button */}
      {isActionSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end md:hidden"
          onClick={() => setIsActionSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl p-5 border-t border-slate-200 shadow-2xl space-y-3 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Tác Nghiệp Nhanh Hiện Trường
              </span>
              <button
                type="button"
                onClick={() => setIsActionSheetOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action 1: AI Camera */}
            <button
              type="button"
              onClick={() => {
                setIsActionSheetOpen(false);
                onSelectTab('ai_inspect');
              }}
              className="w-full flex items-center gap-3 p-3.5 bg-sky-50/80 hover:bg-sky-100/80 rounded-xl border border-sky-200 text-left transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Camera className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <span>Chụp Ảnh & Đếm Sứ AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-200 text-sky-800 font-semibold">Gemini 3.8</span>
                </div>
                <div className="text-[11px] text-sky-700 line-clamp-1">
                  Đếm số cục sứ, phát hiện đà lệch/cân, loại trụ và tính định mức
                </div>
              </div>
            </button>

            {/* Action 2: GPS Check-in */}
            <button
              type="button"
              onClick={() => {
                setIsActionSheetOpen(false);
                onOpenAddModal();
              }}
              className="w-full flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Crosshair className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900">
                  Check-in Tọa Độ GPS & Nhập Thủ Công
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  Lấy vị trí GPS điện thoại hoặc nhập ấp, xã và điều kiện trụ
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden">
        <div className="grid grid-cols-5 items-center h-16 px-1 max-w-md mx-auto">
          {/* Tab 1: Map */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('map_route');
              onSetMobileSubView('map');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'map_route' && mobileSubView === 'map'
                ? 'text-sky-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Bản đồ</span>
          </button>

          {/* Tab 2: Route */}
          <button
            type="button"
            onClick={() => {
              onSelectTab('map_route');
              onSetMobileSubView('route');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
              activeTab === 'map_route' && mobileSubView === 'route'
                ? 'text-sky-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Route className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Lộ trình</span>
          </button>

          {/* Tab 3 (Center): Prominent Quick Action Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsActionSheetOpen(true)}
              className="w-13 h-13 -mt-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg border-3 border-white active:scale-95 transition-transform cursor-pointer"
              title="Chụp ảnh AI hoặc Check-in GPS"
            >
              <div className="relative">
                <Camera className="w-5 h-5 text-sky-400" />
                <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1" />
              </div>
            </button>
          </div>

          {/* Tab 4: Ledger */}
          <button
            type="button"
            onClick={() => onSelectTab('ledger')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
              activeTab === 'ledger'
                ? 'text-sky-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <FileText className="w-5 h-5" />
              {poleCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[8px] font-bold rounded-full bg-slate-900 text-white">
                  {poleCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Bảng kê</span>
          </button>

          {/* Tab 5: Menu / Drawer */}
          <button
            type="button"
            onClick={onOpenDrawer}
            className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Menu</span>
          </button>
        </div>
      </div>
    </>
  );
};
