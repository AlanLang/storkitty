import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFileBinaryQuery } from "../../hooks/useFiles";
import {
  getPDFPageCount,
  isPDFSupported,
  renderPDFPage,
} from "../../utils/pdf";
import { Button } from "../ui/button";

interface PDFPreviewProps {
  directoryId: string;
  filePath: string;
}

export function PDFPreview({ directoryId, filePath }: PDFPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDataRef = useRef<number[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // 查询文件二进制内容（PDF 文件，无需认证）
  const {
    data: fileData,
    isLoading,
    error,
  } = useFileBinaryQuery(directoryId, filePath, true);

  // 初始化 PDF 和获取页面数量
  useEffect(() => {
    if (!fileData?.success || !fileData.data || !isPDFSupported()) {
      return;
    }

    const initializePDF = async () => {
      try {
        const arrayBuffer = fileData.data;

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error("Empty or invalid PDF data");
        }

        // Store as a plain number array to avoid ArrayBuffer issues
        const originalData = new Uint8Array(arrayBuffer);
        const dataArray = Array.from(originalData);
        pdfDataRef.current = dataArray;

        const pageCount = await getPDFPageCount(originalData);
        setTotalPages(pageCount);
        setCurrentPage(1);
        setRenderError(null);
      } catch (error) {
        console.error("Failed to initialize PDF:", error);
        setRenderError("无法初始化 PDF 文件");
        pdfDataRef.current = null;
      }
    };

    initializePDF();
  }, [fileData]);

  // 渲染当前页面
  useEffect(() => {
    if (
      !pdfDataRef.current ||
      !canvasRef.current ||
      !totalPages ||
      !isPDFSupported()
    ) {
      return;
    }

    const renderCurrentPage = async () => {
      try {
        setIsRenderingPage(true);
        setRenderError(null);

        // Convert cached array back to Uint8Array for rendering
        const dataArray = pdfDataRef.current;
        if (!dataArray) {
          throw new Error("PDF data not available");
        }

        const pdfData = new Uint8Array(dataArray);
        if (canvasRef.current) {
          await renderPDFPage(pdfData, currentPage, canvasRef.current, scale);
        }
      } catch (error) {
        console.error("Failed to render PDF page:", error);
        setRenderError(`无法渲染第 ${currentPage} 页`);
      } finally {
        setIsRenderingPage(false);
      }
    };

    renderCurrentPage();
  }, [currentPage, scale, totalPages]);

  // 页面导航函数
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  // 缩放函数
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));

  if (!isPDFSupported()) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">不支持 PDF 预览</h3>
        <p className="text-muted-foreground">当前环境不支持 PDF 预览功能</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
        <span className="text-muted-foreground">加载 PDF 文件中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground">
          无法加载 PDF 文件，请检查文件是否存在或重试
        </p>
      </div>
    );
  }

  if (fileData && !fileData.success) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">无法预览文件</h3>
        <p className="text-muted-foreground">
          {fileData.message || "PDF 文件内容无法显示"}
        </p>
      </div>
    );
  }

  if (renderError) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">渲染失败</h3>
        <p className="text-muted-foreground">{renderError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* PDF 控制工具栏 */}
      {totalPages > 0 && (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 mb-6 sticky top-20 z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* 页面导航 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage <= 1 || isRenderingPage}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2 text-sm">
                <span>第</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = Number.parseInt(e.target.value, 10);
                    if (!Number.isNaN(page)) {
                      goToPage(page);
                    }
                  }}
                  className="w-16 h-8 px-2 text-center border rounded"
                  disabled={isRenderingPage}
                />
                <span>页 / 共 {totalPages} 页</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages || isRenderingPage}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 缩放控制 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={scale <= 0.5 || isRenderingPage}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-sm min-w-16 text-center">
                {Math.round(scale * 100)}%
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={scale >= 3 || isRenderingPage}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF 渲染区域 */}
      <div className="flex justify-center">
        <div className="relative border rounded-lg bg-white shadow-lg overflow-hidden">
          {isRenderingPage && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>渲染中...</span>
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="max-w-full h-auto"
            style={{
              display: totalPages > 0 ? "block" : "none",
              opacity: isRenderingPage ? 0.5 : 1,
            }}
          />

          {totalPages === 0 && !isLoading && (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>正在解析 PDF 文件...</p>
            </div>
          )}
        </div>
      </div>

      {/* 页面快速跳转 */}
      {totalPages > 5 && (
        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground mb-2">快速跳转</div>
          <div className="flex justify-center gap-1 flex-wrap">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const pageNum = Math.floor((i * totalPages) / 10) + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  disabled={isRenderingPage}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
