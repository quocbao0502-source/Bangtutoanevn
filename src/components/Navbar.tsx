import React, { useState } from 'react';
import {
  Building2,
  Camera,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Map,
  MapPin,
  Menu,
  Palette,
  PlusCircle,
  Printer,
  RotateCcw,
  Sliders,
  Sparkles,
  Table,
  X,
  Zap,
} from 'lucide-react';
import { HeaderCustomizationSettings, WorkplaceDepot } from '../types/pole';

export type ActiveTab = 'map_route' | 'ai_inspect' | 'manual_add' | 'ledger' | 'rates';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenReport: () => void;
  onOpenRates: () => void;
  onOpenAddModal: () => void;
  onOpenHeaderSettings?: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
  poleCount: number;
  depot: WorkplaceDepot;
  headerSettings?: HeaderCustomizationSettings;
  isDrawerOpen: boolean;
  onToggleDrawer: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenReport,
  onOpenRates,
  onOpenAddModal,
  onOpenHeaderSettings,
  onExportExcel,
  onExportCsv,
  onResetData,
  poleCount,
  depot,
  headerSettings,
  isDrawerOpen,
  onToggleDrawer,
}) => {
  const brandIcon = headerSettings?.brandIcon || '⚡';
  const appTitle = headerSettings?.appTitle || 'EVN PoleInspector';
  const navStyle = headerSettings?.navbarStyle || 'clean_white';

  const headerBgClass =
    navStyle === 'dark_navy'
      ? 'bg-slate-950 border-slate-800 text-white'
      : navStyle === 'evn_blue'
      ? 'bg-sky-950 border-sky-800 text-white'
      : 'bg-white border-slate-200 text-slate-900';

  const brandTextClass =
    navStyle === 'clean_white' ? 'text-slate-900 hover:text-sky-700' : 'text-white hover:text-sky-300';

  const navItemClass = (tab: ActiveTab) => {
    const isSelected = activeTab === tab;
    if (navStyle === 'clean_white') {
      return isSelected
        ? 'bg-slate-900 text-white font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
    }
    return isSelected
      ? 'bg-white/20 text-white font-semibold shadow-xs ring-1 ring-white/30'
      : 'text-slate-300 hover:text-white hover:bg-white/10';
  };
  return (
    <>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-40 border-b transition-colors ${headerBgClass}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5 sm:py-3.5">
          {/* Zone 1: Mobile Hamburger + Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Mobile Hamburger Trigger */}
            <button
              type="button"
              onClick={() => onToggleDrawer(true)}
              className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Mở menu ngăn kéo"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs border border-white/20">
              {brandIcon}
            </div>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('map_route');
              }}
              className={`text-sm sm:text-base md:text-lg font-bold tracking-tight whitespace-nowrap shrink-0 transition-colors ${brandTextClass}`}
            >
              {appTitle}
            </a>
          </div>

          {/* Zone 2: Desktop 4–5 single-line navigation tabs (hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => onSelectTab('map_route')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${navItemClass('map_route')}`}
            >
              {headerSettings?.sectionTitles?.mapTitle || 'Bản đồ & Lộ trình'}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('ai_inspect')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${navItemClass('ai_inspect')}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Chụp ảnh AI</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAddModal()}
              className="px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              Nhập & Check-in
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('ledger')}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${navItemClass('ledger')}`}
            >
              <span>{headerSettings?.sectionTitles?.ledgerTitle ? `${headerSettings.sectionTitles.ledgerTitle} (${poleCount})` : `Bảng kê trụ (${poleCount})`}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenRates()}
              className="px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <Sliders className="w-3 h-3" />
              <span>{headerSettings?.sectionTitles?.ratesTitle || 'Bảng định mức'}</span>
            </button>
          </nav>

          {/* Zone 3: Actions buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenHeaderSettings && (
              <button
                type="button"
                onClick={onOpenHeaderSettings}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer min-h-[38px] shadow-2xs"
                title="Tùy chỉnh giao diện khung tiêu đề & thêm các trường"
              >
                <Palette className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden lg:inline">Tùy chỉnh giao diện</span>
                <span className="lg:hidden">Giao diện</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenReport}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[38px]"
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Xuất phiếu công tác</span>
              <span className="sm:hidden">Phiếu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Side Drawer Menu for Mobile */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex md:hidden"
          onClick={() => onToggleDrawer(false)}
        >
          {/* Drawer Container */}
          <div
            className="w-4/5 max-w-xs h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-sky-400 flex items-center justify-center font-bold text-xs border border-white/20">
                    {brandIcon}
                  </div>
                  <span className="font-bold text-sm text-slate-900 tracking-tight">
                    {appTitle}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleDrawer(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Station Card in Drawer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-[10px] uppercase font-bold text-sky-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-sky-600" />
                  <span>Đội QLVH Đường Dây</span>
                </div>
                <div className="font-bold text-slate-900 text-xs">{headerSettings?.unitName || depot.name}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1">{headerSettings?.unitAddress || depot.address}</div>
              </div>
            </div>

            {/* Drawer Navigation Links */}
            <div className="p-4 space-y-1 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
                Phân hệ công tác
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('map_route');
                  onToggleDrawer(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'map_route'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Map className="w-4 h-4 text-sky-400" />
                  <span>Bản đồ & Lộ trình tối ưu</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('ai_inspect');
                  onToggleDrawer(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'ai_inspect'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4 text-sky-500" />
                  <span>Chụp ảnh & Đếm sứ AI</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-semibold">AI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleDrawer(false);
                  onOpenAddModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Nhập thủ công & Check-in GPS</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('ledger');
                  onToggleDrawer(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-colors ${
                  activeTab === 'ledger'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Table className="w-4 h-4 text-blue-600" />
                  <span>Bảng kê trụ toàn tuyến</span>
                </div>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                  {poleCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleDrawer(false);
                  onOpenRates();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-slate-600" />
                  <span>Bảng định mức chi phí EVN</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              {onOpenHeaderSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleDrawer(false);
                    onOpenHeaderSettings();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-sky-600" />
                    <span>Tùy chỉnh giao diện & Khung tiêu đề</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-bold">Mới</span>
                </button>
              )}

              {/* Data & Export Group */}
              <div className="pt-3 border-t border-slate-100 mt-2 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                  Báo cáo & Xuất dữ liệu
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onToggleDrawer(false);
                    onOpenReport();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Printer className="w-4 h-4 text-sky-600" />
                  <span>In phiếu công tác định mức</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleDrawer(false);
                    onExportExcel();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Xuất bảng tính Excel (.xls)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleDrawer(false);
                    onExportCsv();
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Xuất tệp CSV (.csv)</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
              <button
                type="button"
                onClick={() => {
                  onToggleDrawer(false);
                  onResetData();
                }}
                className="w-full flex items-center justify-center gap-1.5 p-2 text-[11px] font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục dữ liệu mẫu ban đầu</span>
              </button>
              <div className="text-[10px] text-center text-slate-400">
                Phiên bản số hóa hiện trường EVN · v2.4
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
