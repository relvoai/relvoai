import React, { useState, useRef, useCallback } from 'react';
import { Button, Card, cn } from './UI';
import { UploadCloud, X, File, Image as ImageIcon, Trash2 } from 'lucide-react';

interface FileUploadManagerProps {
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[]; // e.g., ['image/*', '.pdf']
  onChange?: (files: File[]) => void;
  className?: string;
}

export function FileUploadManager({
  multiple = true,
  maxFiles = 5,
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  onChange,
  className
}: FileUploadManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerSelect = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File ${file.name} exceeds ${maxSizeMB}MB limit.`;
    }
    // Simple MIME check - for production regex matching is better
    // This is a static mock, so we'll be lenient
    return null;
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setError(null);

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(newFiles).forEach(file => {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors[0]); // Just show first error for simplicity
    }

    setFiles(prev => {
        const updated = multiple ? [...prev, ...validFiles] : [...validFiles];
        // Enforce max files
        const capped = updated.slice(0, maxFiles);
        if (onChange) onChange(capped);
        return capped;
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
        const updated = prev.filter((_, i) => i !== index);
        if (onChange) onChange(updated);
        return updated;
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div 
        onClick={triggerSelect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border-2 border-dashed border-input hover:border-primary/50 hover:bg-muted/50 transition-colors rounded-lg p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
      >
        <div className="p-3 bg-primary/10 rounded-full text-primary mb-2">
            <UploadCloud className="w-6 h-6" />
        </div>
        <div className="text-sm font-medium">
            <span className="text-primary hover:underline">Click to upload</span> or drag and drop
        </div>
        <div className="text-xs text-muted-foreground">
            {multiple ? `Up to ${maxFiles} files` : 'Single file'} • Max {maxSizeMB}MB each
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple={multiple} 
            accept={acceptedTypes.join(',')}
            onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded px-3">
              {error}
          </div>
      )}

      {files.length > 0 && (
          <div className="space-y-2">
              {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 border border-border rounded-lg bg-card">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {file.type.startsWith('image/') ? (
                              <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                              <File className="w-5 h-5 text-muted-foreground" />
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{file.name}</div>
                          <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive">
                          <X className="w-4 h-4" />
                      </Button>
                  </div>
              ))}
              <div className="flex justify-end">
                   <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setFiles([]); if(onChange) onChange([]); }}>
                        <Trash2 className="w-3 h-3 mr-1" /> Clear all
                   </Button>
              </div>
          </div>
      )}
    </div>
  );
}