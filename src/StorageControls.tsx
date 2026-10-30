import React, { useEffect, useState } from "react";
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent } from "@ionic/react";
import { closeOutline, trashOutline } from "ionicons/icons";
import type { SheetInfo } from "./storage/tornadoAdapter";
import type { HeliaItem } from "./storage/heliaAdapter";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit(email.trim(), password);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="storage-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Log in to backend</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={submit} className="storage-form">
          <input data-testid="login-email" type="email" placeholder="Email" autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input data-testid="login-password" type="password" placeholder="Password" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button data-testid="login-submit" type="submit" className="pill-btn primary" disabled={busy}>
            {busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      </IonContent>
    </IonModal>
  );
};

interface OpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: SheetInfo[] | null; // null = loading
  currentName: string | null;
  onOpen: (name: string) => void;
  onDelete: (name: string) => void;
}

export const OpenModal: React.FC<OpenModalProps> = ({ isOpen, onClose, sheets, currentName, onOpen, onDelete }) => (
  <IonModal isOpen={isOpen} onDidDismiss={onClose} className="storage-modal">
    <IonHeader>
      <IonToolbar>
        <IonTitle>Open sheet</IonTitle>
        <IonButtons slot="end">
          <IonButton onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding">
      {sheets === null && <p>Loading…</p>}
      {sheets !== null && sheets.length === 0 && <p data-testid="open-empty">No saved sheets.</p>}
      {sheets !== null && sheets.length > 0 && (
        <table className="storage-list" data-testid="open-list">
          <tbody>
            {sheets.map((s) => (
              <tr key={s.name} data-testid={`sheet-row-${s.name}`}>
                <td>
                  <button className="storage-link" data-testid={`open-${s.name}`} onClick={() => onOpen(s.name)}>
                    {s.name}
                  </button>
                  {s.name === currentName ? " (current)" : ""}
                </td>
                <td className="storage-meta">{(s.size / 1024).toFixed(1)} KB</td>
                <td className="storage-meta">{new Date(s.modified).toLocaleString()}</td>
                <td>
                  <IonButton size="small" color="danger" fill="clear" title="Delete" data-testid={`delete-${s.name}`}
                    onClick={() => onDelete(s.name)}>
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </IonContent>
  </IonModal>
);

interface HeliaSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Encrypts with the passphrase, uploads, and resolves with the CID. Rejects with a user-facing Error. */
  onSave: (passphrase: string) => Promise<string>;
  onCopy: (cid: string) => void;
}

export const HeliaSaveModal: React.FC<HeliaSaveModalProps> = ({ isOpen, onClose, onSave, onCopy }) => {
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [cid, setCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCid(null);
      setError(null);
    } else {
      setPassphrase("");
    }
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setCid(await onSave(passphrase));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="storage-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Save to Helia</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {cid === null ? (
          <form onSubmit={submit} className="storage-form">
            <p className="storage-meta">
              The sheet is encrypted in this browser with your passphrase before upload. Whoever opens the CID needs the
              same passphrase; it cannot be recovered.
            </p>
            <input data-testid="helia-save-passphrase" type="password" placeholder="Passphrase" autoComplete="off"
              value={passphrase} onChange={(e) => setPassphrase(e.target.value)} required />
            <button data-testid="helia-save-submit" type="submit" className="pill-btn primary" disabled={busy || !passphrase}>
              {busy ? "Encrypting & uploading…" : "Encrypt & save"}
            </button>
            {error && <p data-testid="helia-save-error" className="storage-error">{error}</p>}
          </form>
        ) : (
          <div className="storage-form">
            <p>Saved. Share this CID (and the passphrase, separately) to let someone open the sheet:</p>
            <code data-testid="helia-cid" className="storage-cid">{cid}</code>
            <button data-testid="helia-copy-cid" className="pill-btn primary" onClick={() => onCopy(cid)}>Copy CID</button>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

interface HeliaOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (cid: string, passphrase: string) => Promise<void>;
  onList: () => Promise<HeliaItem[]>;
}

export const HeliaOpenModal: React.FC<HeliaOpenModalProps> = ({ isOpen, onClose, onOpen, onList }) => {
  const [cid, setCid] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<HeliaItem[] | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPassphrase("");
      return;
    }
    setError(null);
    setRecent(null);
    onList().then(setRecent).catch(() => setRecent([])); // the list is a convenience; typing a CID still works
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onOpen(cid.trim(), passphrase);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="storage-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Open from Helia</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={submit} className="storage-form">
          <input data-testid="helia-open-cid" type="text" placeholder="CID" autoComplete="off" spellCheck={false}
            value={cid} onChange={(e) => setCid(e.target.value)} required />
          <input data-testid="helia-open-passphrase" type="password" placeholder="Passphrase" autoComplete="off"
            value={passphrase} onChange={(e) => setPassphrase(e.target.value)} required />
          <button data-testid="helia-open-submit" type="submit" className="pill-btn primary" disabled={busy || !cid.trim() || !passphrase}>
            {busy ? "Fetching & decrypting…" : "Open"}
          </button>
          {error && <p data-testid="helia-open-error" className="storage-error">{error}</p>}
        </form>
        {recent !== null && recent.length > 0 && (
          <>
            <p className="storage-meta">Stored on this Helia node (click to fill):</p>
            <table className="storage-list" data-testid="helia-list">
              <tbody>
                {recent.map((i) => (
                  <tr key={i.cid}>
                    <td>
                      <button className="storage-link storage-cid" onClick={() => setCid(i.cid)}>{i.cid}</button>
                    </td>
                    <td className="storage-meta">{i.size !== undefined ? `${(i.size / 1024).toFixed(1)} KB` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </IonContent>
    </IonModal>
  );
};
