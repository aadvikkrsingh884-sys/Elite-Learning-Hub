import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { generateProgressReport } from "@/lib/generateProgressReport";
import { useAuth } from "@/contexts/AuthContext";

interface ProgressReportButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ProgressReportButton({
  variant = "outline",
  size = "sm",
  className = "",
}: ProgressReportButtonProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      await generateProgressReport(token ?? undefined);
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={variant}
        size={size}
        className={`font-bold gap-2 ${className}`}
        onClick={handleDownload}
        disabled={loading}
        aria-label="Download comprehensive progress report as PDF"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {loading ? "Generating PDF…" : "Download Progress Report"}
      </Button>
      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}
    </div>
  );
}
