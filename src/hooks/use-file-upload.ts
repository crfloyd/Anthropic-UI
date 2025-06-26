// src/hooks/use-file-upload.ts
import { useState, useCallback } from "react";

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  type: "image" | "text" | "code" | "archive" | "other";
}

export function useFileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const getFileType = useCallback((file: File): UploadedFile["type"] => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("text/") || file.type === "application/json")
      return "text";
    if (
      file.type === "application/javascript" ||
      file.type === "application/typescript" ||
      file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|html|css|sql)$/i)
    ) {
      return "code";
    }
    if (
      file.type === "application/zip" ||
      file.type === "application/x-rar-compressed" ||
      file.name.match(/\.(zip|rar|7z|tar|gz)$/i)
    ) {
      return "archive";
    }
    return "other";
  }, []);

  const createFilePreview = useCallback(
    async (file: File): Promise<string | undefined> => {
      if (file.type.startsWith("image/")) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }
      return undefined;
    },
    []
  );

  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const newUploadedFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }

        const type = getFileType(file);
        const preview = await createFilePreview(file);

        newUploadedFiles.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          preview,
          type,
        });
      }

      setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
    },
    [getFileType, createFilePreview]
  );

  const removeFile = useCallback((fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const files: File[] = [];

      items.forEach((item) => {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            files.push(file);
          }
        }
      });

      if (files.length > 0) {
        e.preventDefault();
        await addFiles(files);
      }
    },
    [addFiles]
  );

  return {
    uploadedFiles,
    addFiles,
    removeFile,
    clearFiles,
    handlePaste,
    setUploadedFiles,
  };
}
