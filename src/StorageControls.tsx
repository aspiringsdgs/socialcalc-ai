import React, { useState } from "react";
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent } from "@ionic/react";
import { closeOutline, trashOutline } from "ionicons/icons";
import type { SheetInfo } from "./storage/tornadoAdapter";

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
