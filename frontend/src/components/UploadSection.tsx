import { Film, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Rail } from "@/components/Rail";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_REPORT_BYTES = 10 * 1024 * 1024;
const REPORT_EXTENSIONS = [".txt", ".md"];

interface UploadSectionProps {
  videoFile: File | null;
  setVideoFile: (file: File | null) => void;
  textFile: File | null;
  setTextFile: (file: File | null) => void;
  textDescription: string;
  setTextDescription: (text: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

interface DropFieldProps {
  id: string;
  accept: string;
  icon: typeof Film;
  prompt: string;
  hint: string;
  file: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

/**
 * Empty state shows the action and the accepted formats; the action label never
 * truncates, so the hint drops to its own line when both will not fit. Once a
 * file is chosen the field switches to solid border, name, size, and a clear
 * control.
 */
const DropField = ({
  id,
  accept,
  icon: Icon,
  prompt,
  hint,
  file,
  onSelect,
  onClear,
  disabled
}: DropFieldProps) => {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-4 py-3.5 transition-colors",
        file
          ? "border-solid border-border-strong bg-surface"
          : "border-dashed border-border-strong",
        disabled
          ? "cursor-not-allowed opacity-50"
          : !file && "hover:border-accent/50 hover:bg-surface"
      )}
      data-selected={file ? "true" : "false"}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (selected) onSelect(selected);
          event.target.value = "";
        }}
      />
      <Icon
        className="h-4 w-4 shrink-0 text-muted-foreground group-data-[selected=true]:text-accent"
        aria-hidden
      />

      {file ? (
        <>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{file.name}</span>
          <span className="tabular shrink-0 font-mono text-xs text-muted-foreground">
            {formatSize(file.size)}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="-mr-1 shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Remove ${file.name}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <label
          htmlFor={id}
          className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-0.5 sm:flex-row sm:items-baseline sm:gap-2"
        >
          <span className="shrink-0 text-sm text-foreground">{prompt}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </label>
      )}
    </div>
  );
};

export const UploadSection = ({
  videoFile,
  setVideoFile,
  textFile,
  setTextFile,
  textDescription,
  setTextDescription,
  onAnalyze,
  isAnalyzing
}: UploadSectionProps) => {
  const { toast } = useToast();
  const ready = Boolean(videoFile) && (Boolean(textFile) || textDescription.trim().length > 0);

  const handleVideo = (file: File) => {
    if (file.size > MAX_VIDEO_BYTES) {
      toast({
        title: "Video too large",
        description: "The API accepts clips up to 100 MB. Trim the clip and try again.",
        variant: "destructive"
      });
      return;
    }
    setVideoFile(file);
  };

  const handleReport = (file: File) => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
    if (!REPORT_EXTENSIONS.includes(extension)) {
      toast({
        title: "Unsupported report format",
        description: "Reports are read as plain text. Upload a .txt or .md file.",
        variant: "destructive"
      });
      return;
    }
    if (file.size > MAX_REPORT_BYTES) {
      toast({
        title: "Report too large",
        description: "The API accepts reports up to 10 MB.",
        variant: "destructive"
      });
      return;
    }
    setTextFile(file);
  };

  return (
    <section aria-label="Evidence">
      <Rail label="Video">
        <DropField
          id="video-upload"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
          icon={Film}
          prompt="Choose a clip"
          hint="MP4, MOV, AVI, MKV · up to 100 MB"
          file={videoFile}
          onSelect={handleVideo}
          onClear={() => setVideoFile(null)}
          disabled={isAnalyzing}
        />
      </Rail>

      <Rail label="Report">
        <div className="space-y-3">
          <DropField
            id="report-upload"
            accept=".txt,.md"
            icon={FileText}
            prompt="Choose a report"
            hint="TXT or MD · up to 10 MB"
            file={textFile}
            onSelect={handleReport}
            onClear={() => setTextFile(null)}
            disabled={isAnalyzing}
          />

          <Textarea
            id="report-text"
            aria-label="Report text"
            placeholder="Or type the claims to check — for example: two people and one car, no weapons."
            value={textDescription}
            onChange={(event) => setTextDescription(event.target.value)}
            disabled={Boolean(textFile) || isAnalyzing}
            className="min-h-20 resize-y"
          />

          {textFile && (
            <p className="text-xs text-muted-foreground">
              The uploaded file takes precedence. Remove it to type a report instead.
            </p>
          )}
        </div>
      </Rail>

      <Rail label="Run">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button onClick={onAnalyze} disabled={!ready || isAnalyzing} className="min-w-36">
            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            {isAnalyzing ? "Analyzing" : "Analyze"}
          </Button>
          <p className="text-xs text-muted-foreground" role="status">
            {isAnalyzing
              ? "Sampling frames and running detection. A 30-second clip takes about 30 seconds."
              : ready
                ? "Ready."
                : "A clip and a report are both required."}
          </p>
        </div>
      </Rail>
    </section>
  );
};
