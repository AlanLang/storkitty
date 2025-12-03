// 类型来源: https://unpkg.com/excalidraw-embed@0.18.1/dist/index.d.ts

export interface ExcalidrawAPI {
  updateScene: (scene: any) => void;
  getSceneElements: () => readonly any[];
  getAppState: () => any;
  history: {
    clear: () => void;
  };
  scrollToContent: (
    target?: any | readonly any[],
    opts?: {
      fitToContent?: boolean;
      animate?: boolean;
      duration?: number;
    },
  ) => void;
  refresh: () => void;
  setToast: (
    toast: { message: string; closable?: boolean; duration?: number } | null,
  ) => void;
  id: string;
  setActiveTool: (tool: { type: string } | null) => void;
  setCursor: (cursor: string) => void;
  resetCursor: () => void;
  toggleSidebar: (opts: {
    name: string;
    tab?: string;
    force?: boolean;
  }) => boolean;
}

export interface ExcalidrawEmbedModule {
  renderExcalidraw: (
    container: HTMLElement,
    opts?: {
      data?: any;
      onChange?: (elements: readonly any[], appState: any) => void;
      options?: Record<string, any>;
    },
  ) => Promise<ExcalidrawAPI>;
}
