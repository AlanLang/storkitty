import { AlertCircle, Loader2, Save, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSaveFileMutation, useShowFileQuery } from "../../hooks/useFiles";
import {
  type MonacoEditor,
  createEditor,
  getLanguageDisplayName,
  getMonacoLanguage,
  isEditable,
} from "../../utils/editor";
import { Button } from "../ui/button";

interface TextEditorProps {
  directoryId: string;
  filePath: string;
  fileExtension: string;
  onExitEdit?: () => void;
  onSaveSuccess?: (content: string) => void; // 保存成功回调
  forceEditable?: boolean; // 强制允许编辑任何文件
  preloadedContent?: string; // 预加载的文件内容
}

export function TextEditor({
  directoryId,
  filePath,
  fileExtension,
  onExitEdit,
  onSaveSuccess,
  forceEditable = false,
  preloadedContent,
}: TextEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<
    MonacoEditor["editor"]["IStandaloneCodeEditor"] | null
  >(null);
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 查询文件内容 - 强制编辑模式下使用不同的获取方法
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [contentError, setContentError] = useState<Error | null>(null);

  // 使用传统的 show API（仅当非强制编辑模式）
  const {
    data: fileData,
    isLoading: isLoadingShowContent,
    error: showContentError,
  } = useShowFileQuery(directoryId, filePath, !forceEditable);

  // 数据获取逻辑：优先使用预加载内容，避免重复请求
  useEffect(() => {
    // 如果有预加载内容，直接使用
    if (preloadedContent !== undefined) {
      setFileContent(preloadedContent);
      setIsLoadingContent(false);
      setContentError(null);
      return;
    }

    if (!forceEditable) {
      // 非强制模式，使用 show API 的结果
      setIsLoadingContent(isLoadingShowContent);
      setContentError(showContentError);
      setFileContent(fileData?.success ? (fileData.content ?? "") : null);
      return;
    }

    // 强制编辑模式且无预加载内容，使用 download 端点
    const fetchFileContent = async () => {
      try {
        setIsLoadingContent(true);
        setContentError(null);

        const response = await fetch(
          `/api/files/${encodeURIComponent(directoryId)}/download/${encodeURIComponent(filePath)}`,
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        setFileContent(text);
      } catch (error) {
        console.error("Failed to fetch file content:", error);
        setContentError(error as Error);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchFileContent();
  }, [
    directoryId,
    filePath,
    forceEditable,
    preloadedContent,
    fileData,
    isLoadingShowContent,
    showContentError,
  ]);

  // 保存文件 mutation
  const saveFileMutation = useSaveFileMutation(directoryId);

  // 确定语言类型
  const language = getMonacoLanguage(fileExtension);
  const languageDisplayName =
    forceEditable && !isEditable(fileExtension)
      ? `${fileExtension.toUpperCase()} 文件 (文本模式)`
      : getLanguageDisplayName(language);

  // 检查是否可编辑
  const canEdit = forceEditable || isEditable(fileExtension);

  // 初始化编辑器
  const initializeEditor = useCallback(async () => {
    if (!editorContainerRef.current || fileContent === null) {
      return;
    }

    try {
      setIsEditorLoading(true);
      setEditorError(null);

      // 清理现有编辑器
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }

      // 创建新编辑器
      const editor = await createEditor(
        editorContainerRef.current,
        fileContent || "", // 使用统一的 fileContent
        language,
        {
          theme: "vs", // 使用浅色主题
          automaticLayout: true,
        },
      );

      editorRef.current = editor;

      // 监听内容变化
      editor.onDidChangeModelContent(() => {
        setHasUnsavedChanges(true);
      });

      // 键盘快捷键：Ctrl+S 保存
      // biome-ignore lint/suspicious/noExplicitAny: Monaco Editor API types not available
      const monaco = (window as any).monaco;
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        handleSave();
      });
    } catch (error) {
      console.error("Failed to initialize editor:", error);
      setEditorError("无法初始化编辑器");
    } finally {
      setIsEditorLoading(false);
    }
  }, [fileContent, language]);

  // 保存文件
  const handleSave = useCallback(async () => {
    if (!editorRef.current || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const content = editorRef.current.getValue();

      await saveFileMutation.mutateAsync({
        filePath,
        content,
        forceEdit: forceEditable,
      });

      setHasUnsavedChanges(false);
      toast.success("文件保存成功");

      // 通知父组件内容已更新
      if (onSaveSuccess) {
        onSaveSuccess(content);
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("文件保存失败");
    } finally {
      setIsSaving(false);
    }
  }, [filePath, saveFileMutation, isSaving, forceEditable, onSaveSuccess]);

  // 退出编辑模式
  const handleExitEdit = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm("您有未保存的更改，确定要退出编辑吗？")) {
        return;
      }
    }

    if (editorRef.current) {
      editorRef.current.dispose();
      editorRef.current = null;
    }

    onExitEdit?.();
  }, [hasUnsavedChanges, onExitEdit]);

  // 初始化编辑器
  useEffect(() => {
    if (fileContent !== null) {
      initializeEditor();
    }
  }, [initializeEditor, fileContent]);

  // 组件卸载时清理编辑器
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  // 键盘快捷键：ESC 退出编辑
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleExitEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleExitEdit]);

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">不支持编辑</h3>
        <p className="text-muted-foreground">此文件类型不支持在线编辑</p>
      </div>
    );
  }

  if (isLoadingContent) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
        <span className="text-muted-foreground">加载文件内容中...</span>
      </div>
    );
  }

  if (contentError) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground">
          无法加载文件内容，请检查文件是否存在或重试
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto h-full flex flex-col">
      {/* 编辑器工具栏 */}
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 mb-4 sticky top-20 z-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-primary">编辑模式</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {languageDisplayName}
              </span>
              {hasUnsavedChanges && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-orange-600 font-medium">未保存</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存 (Ctrl+S)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExitEdit}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              退出编辑
            </Button>
          </div>
        </div>
      </div>

      {/* 编辑器容器 */}
      <div className="flex-1 border rounded-lg overflow-hidden bg-white shadow-lg">
        {isEditorLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
            <span className="text-muted-foreground">初始化编辑器中...</span>
          </div>
        )}

        {editorError && (
          <div className="flex flex-col items-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">编辑器加载失败</h3>
            <p className="text-muted-foreground">{editorError}</p>
          </div>
        )}

        <div
          ref={editorContainerRef}
          className="w-full h-96 min-h-96"
          style={{
            display: isEditorLoading || editorError ? "none" : "block",
            height: "600px", // 设置一个固定高度
          }}
        />
      </div>

      {/* 底部提示 */}
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          使用 <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+S</kbd>
          保存文件，
          <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd> 退出编辑
        </p>
      </div>
    </div>
  );
}
