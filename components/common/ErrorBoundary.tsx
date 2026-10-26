import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Production-ready React Error Boundary
 * Isolates runtime exceptions to prevent complete application unmounting.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] Caught error in ${this.props.sectionName || 'Section'}:`, error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    try {
      if (typeof window !== 'undefined' && this.props.sectionName?.includes('Sơ đồ Lớp học')) {
        localStorage.removeItem('lop_hoc_5b2_v4_desks');
        localStorage.removeItem('lop_hoc_5b2_v4_seating_plans');
      }
    } catch {
      // ignore
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleResetData = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lop_hoc_5b2_v4_desks');
        localStorage.removeItem('lop_hoc_5b2_v4_seating_plans');
      }
    } catch {
      // ignore
    }
    this.handleRetry();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const sectionTitle = this.props.sectionName || 'Mục này';

      return (
        <div className="w-full my-6 p-6 sm:p-8 bg-amber-50/90 border-2 border-amber-200/90 rounded-3xl shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight mb-2">
            Đã xảy ra sự cố tại: {sectionTitle}
          </h3>

          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
            Hệ thống đã tự động cách ly sự cố này để đảm bảo toàn bộ lớp học và các tính năng khác vẫn hoạt động bình thường và an toàn.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold rounded-2xl shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại tính năng</span>
            </button>

            <button
              onClick={this.handleResetData}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-sm font-bold rounded-2xl shadow-xs transition-all cursor-pointer"
              title="Khôi phục trạng thái chuẩn ban đầu của lớp học"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Khôi phục dữ liệu gốc</span>
            </button>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                window.location.hash = '';
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Bỏ qua lỗi</span>
            </button>
          </div>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details className="mt-6 text-left max-w-xl mx-auto bg-white/80 p-4 rounded-xl border border-amber-200 text-xs font-mono text-red-600 overflow-auto">
              <summary className="font-bold cursor-pointer text-slate-700 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Chi tiết lỗi kỹ thuật (Dành cho nhà phát triển)
              </summary>
              <p className="mt-2 font-bold">{this.state.error.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-[11px] text-slate-600 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
