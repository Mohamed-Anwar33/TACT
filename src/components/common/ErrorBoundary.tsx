import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorType: "chunk" | "generic" | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorType: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Detect typical chunk loading failure messages from Vite/Webpack
    const isChunkError = 
      /failed to fetch/i.test(error.message) ||
      /dynamically imported module/i.test(error.message) ||
      /chunk/i.test(error.message);
      
    return { 
      hasError: true, 
      errorType: isChunkError ? "chunk" : "generic" 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isChunk = this.state.errorType === "chunk";
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0C363A] text-white p-6 text-center font-arabic">
          <div className="max-w-md bg-[#0A2629]/50 border border-gold/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute -right-16 -bottom-16 w-36 h-36 rounded-full bg-gold/5 blur-2xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/40 text-gold flex items-center justify-center mx-auto mb-6 shadow-lg">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-2xl font-serif font-bold text-white mb-4">
              {isChunk ? "عذرًا، حدث خطأ أثناء تحميل الصفحة" : "عذرًا، حدث خطأ غير متوقع"}
            </h2>
            
            <p className="text-sm text-white/70 leading-relaxed mb-8">
              {isChunk 
                ? "يبدو أنه تم تحديث الموقع أو هناك انقطاع مؤقت في الاتصال بالإنترنت. يرجى إعادة تحميل الصفحة لتحديث الملفات وتفعيل التعديلات." 
                : "نواجه مشكلة في عرض هذه الصفحة حاليًا. يمكنك محاولة إعادة تحميل الصفحة أو العودة للرئيسية."}
            </p>

            <button
              onClick={this.handleReload}
              className="w-full btn-gold !py-3 font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-gold/15 cursor-pointer text-sm text-[#0C363A] hover:bg-white transition-all duration-300"
            >
              <RefreshCw size={16} />
              <span>إعادة تحميل الصفحة الآن</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
