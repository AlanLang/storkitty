import { FileType } from "@/api/file/list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Loader2, Maximize, Minimize, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DIALOG_CONTENT_CLASSNAME } from "../constant";
import { FileIcon } from "../file-icon";
import type { FileOpenDialogProps } from "./type";

export function ExcalidrawEditDialog(props: FileOpenDialogProps) {
  const { isOpen, onCancel, onFinish, fileName } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const cssRef = useRef<HTMLLinkElement>(null);
  const editorRef = useRef<unknown>(null);

  useEffect(() => {
    const loadExcalidrawCss = loadCss(
      "https://unpkg.com/excalidraw-embed/dist/excalidraw-embed.css",
    );
    const loadExcalidrawJs = import(
      // @ts-expect-error
      "https://unpkg.com/excalidraw-embed@0.18.1/dist/index.js"
    );

    Promise.all([loadExcalidrawCss, loadExcalidrawJs]).then(([css, js]) => {
      const el = document.createElement("div");
      el.style.height = "100%";
      el.style.width = "100%";
      js.renderExcalidraw(el).then((api: unknown) => {
        editorRef.current = api;
        ref.current?.appendChild(el);
        setIsLoading(false);
      });
      cssRef.current = css;
    });

    return () => {
      if (cssRef.current) {
        document.head.removeChild(cssRef.current);
      }
    };
  }, []);

  const handleClose = () => {
    onFinish();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
        showCloseButton={false}
        className={cn(
          DIALOG_CONTENT_CLASSNAME,
          "sm:max-w-[90vw] sm:w-[90vw] sm:h-[90vh] w-full max-w-full h-full sm:rounded-lg rounded-none flex flex-col p-0 gap-0 overflow-hidden",
          isMaximized &&
            "sm:max-w-full sm:w-full sm:h-full w-full max-w-full h-full rounded-none flex flex-col p-0 gap-0 overflow-hidden shadow-none border-none sm:rounded-none",
        )}
      >
        <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileIcon fileInfo={{ name: fileName, fileType: FileType.File }} />
            {fileName}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize /> : <Maximize />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={handleClose}
            >
              <Save />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={handleClose}
            >
              <X />
            </Button>
          </div>
        </DialogHeader>
        <div style={{ height: "100%", width: "100%" }} ref={ref}></div>
      </DialogContent>
    </Dialog>
  );
}

export function loadCss(url: string): Promise<HTMLLinkElement> {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;

    link.onload = () => resolve(link);
    link.onerror = (err) => reject(err);

    document.head.appendChild(link);
  });
}
