// Prism.js 类型声明
declare global {
  interface Window {
    Prism?: {
      highlightElement: (element: Element) => void;
      plugins: {
        autoloader: {
          languages_path: string;
        };
      };
    };
  }
}

export {};
