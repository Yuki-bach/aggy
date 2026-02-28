import { t } from "../../lib/i18n";
import { Dropzone } from "./Dropzone";

interface FileUploadPanelProps {
  csvFileName: string | null;
  layoutFileName: string | null;
  onCsvFile: (file: File) => void;
  onLayoutFile: (file: File) => void;
}

export function FileUploadPanel({
  csvFileName,
  layoutFileName,
  onCsvFile,
  onLayoutFile,
}: FileUploadPanelProps) {
  return (
    <div class="flex flex-col gap-3 md:flex-row">
      <div class="flex-1">
        <Dropzone
          accept=".csv"
          icon={t("dropzone.csv.icon")}
          text={t("dropzone.csv.text")}
          hint={t("dropzone.csv.hint")}
          loadedFileName={csvFileName}
          onFile={onCsvFile}
        />
      </div>
      <div class="flex-1">
        <Dropzone
          accept=".json"
          icon={t("dropzone.layout.icon")}
          text={t("dropzone.layout.text")}
          hint={t("dropzone.layout.hint")}
          loadedFileName={layoutFileName}
          onFile={onLayoutFile}
        />
      </div>
    </div>
  );
}
