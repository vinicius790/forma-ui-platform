import { createId } from '../primitives/id';

export interface FileLike {
  name: string;
  size: number;
  type: string;
}

export type FileRejectReason = 'too-many-files' | 'file-too-large' | 'invalid-type';

export interface RejectedFile<F extends FileLike = FileLike> {
  file: F;
  reason: FileRejectReason;
}

export interface FileUploadOptions<F extends FileLike = FileLike> {
  id?: string;
  accept?: string[];
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  onFilesChange?: (accepted: F[], rejected: RejectedFile<F>[]) => void;
}

export class FileUploadController<F extends FileLike = FileLike> {
  private options: FileUploadOptions<F>;
  private acceptedList: F[] = [];
  private rejectedList: RejectedFile<F>[] = [];
  private dragging = false;
  readonly inputId: string;

  constructor(options: FileUploadOptions<F> = {}) {
    this.options = { maxFiles: Infinity, maxFileSize: Infinity, ...options };
    this.inputId = `${options.id ?? createId('forma-file-upload')}-input`;
  }

  get acceptedFiles(): readonly F[] {
    return this.acceptedList;
  }

  get rejectedFiles(): readonly RejectedFile<F>[] {
    return this.rejectedList;
  }

  get isDragging(): boolean {
    return this.dragging;
  }

  private matchesAccept(file: F): boolean {
    const accept = this.options.accept;
    if (!accept || accept.length === 0) return true;
    return accept.some((rule) => {
      if (rule.endsWith('/*')) return file.type.startsWith(rule.slice(0, -1));
      if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule.toLowerCase());
      return file.type === rule;
    });
  }

  addFiles(incoming: readonly F[]): void {
    if (this.options.disabled) return;
    const maxFiles = this.options.maxFiles ?? Infinity;
    const maxSize = this.options.maxFileSize ?? Infinity;
    const nextAccepted = [...this.acceptedList];
    const nextRejected: RejectedFile<F>[] = [];

    for (const file of incoming) {
      if (!this.matchesAccept(file)) {
        nextRejected.push({ file, reason: 'invalid-type' });
      } else if (file.size > maxSize) {
        nextRejected.push({ file, reason: 'file-too-large' });
      } else if (nextAccepted.length >= maxFiles) {
        nextRejected.push({ file, reason: 'too-many-files' });
      } else {
        nextAccepted.push(file);
      }
    }

    this.acceptedList = nextAccepted;
    this.rejectedList = nextRejected;
    this.options.onFilesChange?.([...this.acceptedList], [...this.rejectedList]);
  }

  removeFile(index: number): void {
    if (index < 0 || index >= this.acceptedList.length) return;
    this.acceptedList = this.acceptedList.filter((_, i) => i !== index);
    this.options.onFilesChange?.([...this.acceptedList], [...this.rejectedList]);
  }

  clear(): void {
    this.acceptedList = [];
    this.rejectedList = [];
    this.dragging = false;
    this.options.onFilesChange?.([], []);
  }

  getDropzoneProps() {
    return {
      role: 'region' as const,
      'aria-disabled': this.options.disabled ? ('true' as const) : undefined,
      'data-dragging': this.dragging ? 'true' : 'false',
      onDragOver: (e: Pick<Event, 'preventDefault'>) => {
        if (this.options.disabled) return;
        e.preventDefault();
        this.dragging = true;
      },
      onDragLeave: () => {
        this.dragging = false;
      },
      onDrop: (e: Pick<Event, 'preventDefault'> & { dataTransfer?: { files?: ArrayLike<F> } | null }) => {
        e.preventDefault();
        this.dragging = false;
        if (this.options.disabled || !e.dataTransfer?.files) return;
        this.addFiles(Array.from(e.dataTransfer.files));
      },
    };
  }

  getInputProps() {
    return {
      id: this.inputId,
      type: 'file' as const,
      multiple: (this.options.maxFiles ?? Infinity) > 1,
      accept: this.options.accept?.join(','),
      disabled: Boolean(this.options.disabled),
    };
  }

  destroy(): void {
    this.dragging = false;
  }
}

export function createFileUploadController<F extends FileLike = FileLike>(
  options: FileUploadOptions<F> = {},
): FileUploadController<F> {
  return new FileUploadController(options);
}
