import React, { useEffect, useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from "@ionic/react";
import {
  closeOutline,
  documentOutline,
  documentsOutline,
  gridOutline,
  codeDownloadOutline,
  mailOutline,
  printOutline,
  shareSocialOutline,
  downloadOutline,
  cloudUploadOutline,
  phonePortraitOutline,
} from "ionicons/icons";

// Everything below comes from the socialcalc module; this panel only wires it to buttons.
import {
  getCSVContent,
  cleanCSV,
  exportCurrentSheetAsCSV,
  exportMSC,
  parseMSCFile,
  getRegisteredPlugins,
} from "socialcalc";
import {
  configurePdfExport,
  exportCurrentSheetAsPDF,
  exportWorkbookAsPDF,
  isPdfExportEnabled,
  togglePdfExport,
} from "socialcalc/pdf-export";
import {
  getShareCapabilities,
  saveFile,
  shareFile,
  emailCurrentSheet,
  printCurrentSheet,
  isShareEnabled,
  toggleShare,
  type ShareCapabilities,
  type ShareResult,
} from "socialcalc/share";

interface ExportSharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  notify: (msg: string) => void;
  /** Loads an imported MSC file into the workbook (the app owns sheet tabs and mappings). */
  onImportMSC: (data: { msc: any; appMapping?: any; footers?: any[] }, name: string) => void;
}

type AttachmentFormat = "auto" | "pdf" | "html" | "none";

const ExportSharePanel: React.FC<ExportSharePanelProps> = ({ isOpen, onClose, notify, onImportMSC }) => {
  const [filename, setFilename] = useState("invoice");
  const [footerText, setFooterText] = useState("SocialCalc");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [format, setFormat] = useState<"a4" | "letter" | "legal">("a4");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("Here is your invoice");
  const [emailBody, setEmailBody] = useState("Please find the attached invoice.");
  const [attachmentFormat, setAttachmentFormat] = useState<AttachmentFormat>("auto");
  const [printAsPdf, setPrintAsPdf] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string | null>(null);
  const [caps, setCaps] = useState<ShareCapabilities>(() => getShareCapabilities());
  const [pdfOn, setPdfOn] = useState(isPdfExportEnabled());
  const [shareOn, setShareOn] = useState(isShareEnabled());

  const refresh = () => {
    setCaps(getShareCapabilities());
    setPdfOn(isPdfExportEnabled());
    setShareOn(isShareEnabled());
  };

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen]);

  // Page defaults for every PDF (also used by email / print when they make a PDF)
  useEffect(() => {
    configurePdfExport({ footerText, orientation, format });
  }, [footerText, orientation, format]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLog((prev) => [`${time}  ${msg}`, ...prev].slice(0, 30));
  };

  const run = async (label: string, action: () => Promise<ShareResult | string | void>) => {
    setBusy(label);
    setProgress("");
    try {
      const result = await action();
      const detail = typeof result === "string" ? result : result ? `${result.method} on ${result.platform}` : "done";
      addLog(`${label}: ${detail}`);
      notify(`${label}: ${detail}`);
    } catch (err: any) {
      const message = err?.cause?.message ? `${err.message} (${err.cause.message})` : err?.message || String(err);
      addLog(`${label} failed: ${message}`);
      notify(`${label} failed: ${message}`);
    } finally {
      setBusy(null);
      setProgress("");
    }
  };

  const name = filename.trim() || "export";
  const pdfOptions = { onProgress: setProgress };

  // ─── PDF ──────────────────────────────────────────────────────────────────
  const downloadPdf = () => run("PDF (current sheet)", () => exportCurrentSheetAsPDF({ ...pdfOptions, filename: name }).then(() => "downloaded"));
  const downloadAllPdf = () =>
    run("PDF (all sheets)", () => exportWorkbookAsPDF({ ...pdfOptions, filename: `${name}_all_sheets` }).then(() => "downloaded"));
  const sharePdf = () =>
    run("Share PDF", async () => {
      const blob = await exportCurrentSheetAsPDF({ ...pdfOptions, filename: name, returnBlob: true });
      return shareFile({ blob, filename: `${name}.pdf`, message: "PDF generated with SocialCalc" });
    });
  const savePdf = () =>
    run("Save PDF", async () => {
      const blob = await exportCurrentSheetAsPDF({ ...pdfOptions, filename: name, returnBlob: true });
      return saveFile({ blob, filename: `${name}.pdf`, dialogTitle: "Save PDF" });
    });

  // ─── CSV ──────────────────────────────────────────────────────────────────
  const downloadCsv = () => run("CSV", () => exportCurrentSheetAsCSV({ filename: name }).then(() => "downloaded"));
  const shareCsv = () =>
    run("Share CSV", async () => {
      const blob = await exportCurrentSheetAsCSV({ filename: name, returnBlob: true });
      return shareFile({ blob: blob as Blob, filename: `${name}.csv`, message: "Sheet data exported as CSV" });
    });
  const previewCsv = () => {
    try {
      setCsvPreview(cleanCSV(getCSVContent()));
    } catch (err: any) {
      notify(`CSV preview failed: ${err?.message || err}`);
    }
  };

  // ─── MSC ──────────────────────────────────────────────────────────────────
  const downloadMsc = () => run("MSC", () => exportMSC({ filename: name }).then(() => "downloaded"));
  const downloadTemplateJson = () =>
    run("Template JSON", () =>
      exportMSC({ filename: name, extension: "json", includeAppMapping: true, pretty: true }).then(() => "downloaded")
    );
  const shareMsc = () =>
    run("Share MSC", async () => {
      const blob = await exportMSC({ filename: name, returnBlob: true });
      return shareFile({ blob: blob as Blob, filename: `${name}.msc`, message: "SocialCalc workbook" });
    });
  const importMsc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    file
      .text()
      .then((text) => {
        onImportMSC(parseMSCFile(text), file.name);
        addLog(`Imported ${file.name}`);
      })
      .catch((err) => notify(`Import failed: ${err?.message || err}`));
  };

  // ─── Email & print ────────────────────────────────────────────────────────
  const email = () =>
    run("Email", () =>
      emailCurrentSheet({
        filename: name,
        to: emailTo.split(",").map((s) => s.trim()).filter(Boolean),
        subject: emailSubject,
        body: emailBody,
        attachmentFormat: attachmentFormat === "auto" ? undefined : attachmentFormat,
        pdfOptions,
      })
    );
  const print = () => run("Print", () => printCurrentSheet({ name, orientation, usePdf: printAsPdf, pdfOptions }));

  const onTogglePdf = () => {
    const on = togglePdfExport();
    refresh();
    notify(`PDF Export plugin: ${on ? "ON" : "OFF"}`);
  };
  const onToggleShare = () => {
    const on = toggleShare();
    refresh();
    notify(`Share, Email & Print plugin: ${on ? "ON" : "OFF"}`);
  };

  const disabled = !!busy;
  const autoAttachment = caps.platform === "android" ? "HTML" : caps.pdfAvailable ? "PDF" : "HTML";
  const exportPlugins = getRegisteredPlugins().filter((p: any) => p.name === "pdfExport" || p.name === "share");

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="export-panel-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Export, Share &amp; Print</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="export-panel">
          {/* Platform */}
          <section className="export-card">
            <h3>
              <IonIcon icon={phonePortraitOutline} /> Platform: <span className="platform-badge">{caps.platform}</span>
            </h3>
            <div className="export-kv">
              <span>Save file</span>
              <code>{caps.saveMethod}</code>
              <span>Email</span>
              <code>{caps.emailMethod}</code>
              <span>Print</span>
              <code>{caps.printMethod}</code>
              <span>PDF plugin</span>
              <code>{caps.pdfAvailable ? "available" : "not available"}</code>
              <span>Native adapters</span>
              <code>{caps.adapters.join(", ") || "none"}</code>
            </div>
            {caps.missingAdapters.length > 0 && (
              <p className="export-warning">Missing on this device: {caps.missingAdapters.join(", ")}</p>
            )}
            <div className="export-row">
              {exportPlugins.map((p) => (
                <button
                  key={p.name}
                  className={`plugin-btn ${(p.name === "pdfExport" ? pdfOn : shareOn) ? "active" : ""}`}
                  onClick={p.name === "pdfExport" ? onTogglePdf : onToggleShare}
                  title={p.metadata?.description}
                >
                  {p.metadata?.displayName || p.name}: {(p.name === "pdfExport" ? pdfOn : shareOn) ? "ON" : "OFF"}
                </button>
              ))}
            </div>
          </section>

          {/* Common options */}
          <section className="export-card">
            <h3>Options</h3>
            <div className="export-form">
              <label>
                File name
                <input value={filename} onChange={(e) => setFilename(e.target.value)} />
              </label>
              <label>
                PDF footer
                <input value={footerText} onChange={(e) => setFooterText(e.target.value)} />
              </label>
              <label>
                Orientation
                <select value={orientation} onChange={(e) => setOrientation(e.target.value as any)}>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>
              <label>
                Page size
                <select value={format} onChange={(e) => setFormat(e.target.value as any)}>
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </label>
            </div>
            {busy && (
              <p className="export-progress">
                {busy}… {progress}
              </p>
            )}
          </section>

          {/* PDF */}
          <section className="export-card">
            <h3>
              <IonIcon icon={documentOutline} /> PDF (offline)
            </h3>
            <p className="export-hint">
              <code>socialcalc/pdf-export</code>: jsPDF + html2canvas, rows never split across pages.
            </p>
            <div className="export-row">
              <button className="export-btn" disabled={disabled} onClick={downloadPdf}>
                <IonIcon icon={downloadOutline} /> Current sheet
              </button>
              <button className="export-btn" disabled={disabled} onClick={downloadAllPdf}>
                <IonIcon icon={documentsOutline} /> All sheets
              </button>
              <button className="export-btn" disabled={disabled} onClick={savePdf}>
                <IonIcon icon={downloadOutline} /> Save (platform)
              </button>
              <button className="export-btn" disabled={disabled} onClick={sharePdf}>
                <IonIcon icon={shareSocialOutline} /> Share
              </button>
            </div>
          </section>

          {/* CSV */}
          <section className="export-card">
            <h3>
              <IonIcon icon={gridOutline} /> CSV
            </h3>
            <div className="export-row">
              <button className="export-btn" disabled={disabled} onClick={downloadCsv}>
                <IonIcon icon={downloadOutline} /> Download
              </button>
              <button className="export-btn" disabled={disabled} onClick={shareCsv}>
                <IonIcon icon={shareSocialOutline} /> Share
              </button>
              <button className="export-btn" disabled={disabled} onClick={previewCsv}>
                Preview
              </button>
            </div>
            {csvPreview !== null && <textarea className="export-preview" readOnly value={csvPreview || "(empty)"} />}
          </section>

          {/* MSC */}
          <section className="export-card">
            <h3>
              <IonIcon icon={codeDownloadOutline} /> MSC workbook
            </h3>
            <div className="export-row">
              <button className="export-btn" disabled={disabled} onClick={downloadMsc}>
                <IonIcon icon={downloadOutline} /> .msc
              </button>
              <button className="export-btn" disabled={disabled} onClick={downloadTemplateJson}>
                <IonIcon icon={downloadOutline} /> Template .json (+ mappings)
              </button>
              <button className="export-btn" disabled={disabled} onClick={shareMsc}>
                <IonIcon icon={shareSocialOutline} /> Share
              </button>
              <label className="export-btn">
                <IonIcon icon={cloudUploadOutline} /> Import
                <input type="file" accept=".msc,.json" style={{ display: "none" }} onChange={importMsc} />
              </label>
            </div>
          </section>

          {/* Email */}
          <section className="export-card">
            <h3>
              <IonIcon icon={mailOutline} /> Email
            </h3>
            <p className="export-hint">
              iOS: share sheet with PDF · Android: email composer with HTML · Web: Web Share with the file, else mailto: +
              download.
            </p>
            <div className="export-form">
              <label>
                To (comma separated)
                <input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="name@example.com" />
              </label>
              <label>
                Subject
                <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </label>
              <label className="wide">
                Body
                <input value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
              </label>
              <label>
                Attachment
                <select value={attachmentFormat} onChange={(e) => setAttachmentFormat(e.target.value as AttachmentFormat)}>
                  <option value="auto">Auto ({autoAttachment})</option>
                  <option value="pdf">PDF</option>
                  <option value="html">HTML</option>
                  <option value="none">None</option>
                </select>
              </label>
            </div>
            <div className="export-row">
              <button className="export-btn" disabled={disabled} onClick={email}>
                <IonIcon icon={mailOutline} /> Send email
              </button>
            </div>
          </section>

          {/* Print */}
          <section className="export-card">
            <h3>
              <IonIcon icon={printOutline} /> Print
            </h3>
            <p className="export-hint">Native printer (AirPrint / PrintService) on devices, browser print dialog on the web.</p>
            <div className="export-row">
              <label className="export-check">
                <input type="checkbox" checked={printAsPdf} onChange={(e) => setPrintAsPdf(e.target.checked)} />
                Print as PDF on devices
              </label>
              <button className="export-btn" disabled={disabled} onClick={print}>
                <IonIcon icon={printOutline} /> Print current sheet
              </button>
            </div>
          </section>

          {/* Activity */}
          <section className="export-card">
            <h3>Activity</h3>
            <pre className="export-log">{log.length ? log.join("\n") : "No actions yet."}</pre>
          </section>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ExportSharePanel;
