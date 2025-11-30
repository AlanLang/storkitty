import {
  type ChangeEvent,
  type InputHTMLAttributes,
  useCallback,
  useRef,
  useState,
} from "react";

interface UseFileUploadOptions {
  accept?: string;
  multiple?: boolean;
  uploadFunc: (
    file: File,
    onProgress: (p: Progress) => void,
    onError: (error: unknown) => void,
  ) => void;
  abortFunc: (file: File) => void;
}

export interface Progress {
  percent: number;
  transferredBytes: number;
}

export type UploadFileTask =
  | {
      file: File;
      status: "completed" | "failed" | "paused";
      createdAt: number;
    }
  | {
      file: File;
      status: "in_progress";
      percent: number;
      uploaded: number;
      createdAt: number;
    };

export function useFileUpload(options: UseFileUploadOptions) {
  const { accept = "*", multiple = true } = options;
  const [tasks, setTasks] = useState<UploadFileTask[]>([]);

  const addTask = useCallback((file: File) => {
    setTasks((prev) => [
      ...prev,
      {
        file,
        status: "in_progress",
        speed: 0,
        uploaded: 0,
        percent: 0,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const failTask = useCallback((file: File) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.file.name === file.name ? { ...t, status: "failed", file } : t,
      ),
    );
  }, []);

  const updateTask = useCallback((file: File, p: Progress) => {
    const update = (task: UploadFileTask, p: Progress): UploadFileTask => {
      if (p.percent === 1) {
        return {
          ...task,
          status: "completed",
        };
      }
      return {
        ...task,
        ...p,
        status: "in_progress",
        percent: p.percent,
        uploaded: p.transferredBytes,
      };
    };

    setTasks((prev) =>
      prev.map((t) => (t.file.name === file.name ? update(t, p) : t)),
    );
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  const openFileDialog = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        Array.from(e.target.files).forEach((file) => {
          addTask(file);
          options.uploadFunc(
            file,
            (p) => {
              updateTask(file, p);
            },
            () => {
              failTask(file);
            },
          );
        });
        e.target.value = "";
      }
    },
    [options.uploadFunc, addTask, updateTask, failTask],
  );

  const getInputProps = useCallback(
    (props: InputHTMLAttributes<HTMLInputElement> = {}) => {
      return {
        ...props,
        type: "file" as const,
        onChange: handleFileChange,
        accept: accept,
        multiple: multiple,
        ref: inputRef,
      };
    },
    [accept, multiple, handleFileChange],
  );

  const cleanTasks = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === "in_progress"));
  }, []);

  const removeTask = useCallback(
    (file: File) => {
      const task = tasks.find((t) => t.file.name === file.name);
      if (!task) return;
      setTasks((prev) => prev.filter((t) => t.file.name !== file.name));
      if (task.status === "in_progress") {
        options.abortFunc(file);
      }
    },
    [options.abortFunc, tasks],
  );

  return {
    openFileDialog,
    getInputProps,
    tasks,
    cleanTasks,
    removeTask,
  };
}
