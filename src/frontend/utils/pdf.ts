// 动态加载 PDF.js 库的工具函数
// 使用 CDN 加载，避免增加打包体积

interface PDFjsLib {
  getDocument(src: string | Uint8Array): PDFDocumentLoadingTask;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
}

interface PDFDocumentLoadingTask {
  promise: Promise<PDFDocumentProxy>;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  render(renderContext: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PDFPageViewport;
  }): PDFRenderTask;
  getViewport(options: { scale: number }): PDFPageViewport;
}

interface PDFPageViewport {
  width: number;
  height: number;
}

interface PDFRenderTask {
  promise: Promise<void>;
}

// 缓存已加载的实例
let pdfLibInstance: PDFjsLib | null = null;
let loadingPromise: Promise<PDFjsLib> | null = null;

/**
 * 动态加载 PDF.js 库并返回实例
 */
export async function loadPDFjs(): Promise<PDFjsLib> {
  // 如果已经有实例，直接返回
  if (pdfLibInstance) {
    return pdfLibInstance;
  }

  // 如果正在加载，等待加载完成
  if (loadingPromise) {
    return loadingPromise;
  }

  // 开始加载
  loadingPromise = new Promise<PDFjsLib>((resolve, reject) => {
    try {
      // 检查是否已经存在全局 pdfjsLib
      const globalPDFjs = (window as unknown as Record<string, unknown>)
        .pdfjsLib;
      if (globalPDFjs) {
        const instance = globalPDFjs as PDFjsLib;
        // 设置 worker
        instance.GlobalWorkerOptions.workerSrc =
          "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
        pdfLibInstance = instance;
        resolve(instance);
        return;
      }

      // 动态加载 PDF.js
      const script = document.createElement("script");
      script.src = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js";
      script.crossOrigin = "anonymous";

      script.onload = () => {
        try {
          const PDFjsLib = (window as unknown as Record<string, unknown>)
            .pdfjsLib as PDFjsLib;

          if (!PDFjsLib) {
            reject(new Error("Failed to load PDF.js library"));
            return;
          }

          // 设置 worker 路径
          PDFjsLib.GlobalWorkerOptions.workerSrc =
            "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

          pdfLibInstance = PDFjsLib;
          resolve(PDFjsLib);
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load PDF.js from CDN"));
      };

      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return loadingPromise;
}

/**
 * 渲染 PDF 页面到 Canvas
 */
export async function renderPDFPage(
  pdfData: Uint8Array,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.5,
): Promise<void> {
  try {
    // Validate input data
    if (!pdfData || pdfData.length === 0) {
      throw new Error("Invalid PDF data: empty or null");
    }

    if (pdfData.buffer.detached) {
      throw new Error("Invalid PDF data: ArrayBuffer is detached");
    }

    const pdfLib = await loadPDFjs();
    const loadingTask = pdfLib.getDocument(pdfData);
    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Failed to get canvas context");
    }

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
  } catch (error) {
    console.error("Failed to render PDF page:", error);
    throw error;
  }
}

/**
 * 获取 PDF 页面数量
 */
export async function getPDFPageCount(pdfData: Uint8Array): Promise<number> {
  try {
    // Validate input data
    if (!pdfData || pdfData.length === 0) {
      throw new Error("Invalid PDF data: empty or null");
    }

    if (pdfData.buffer.detached) {
      throw new Error("Invalid PDF data: ArrayBuffer is detached");
    }

    const pdfLib = await loadPDFjs();
    const loadingTask = pdfLib.getDocument(pdfData);
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (error) {
    console.error("Failed to get PDF page count:", error);
    throw error;
  }
}

/**
 * 检查是否支持 PDF 预览（用于服务端渲染兼容性）
 */
export function isPDFSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
