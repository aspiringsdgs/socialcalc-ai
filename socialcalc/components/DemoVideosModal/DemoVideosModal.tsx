import React, { useState, useRef, useEffect } from "react";
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
  chevronBackOutline,
  chevronForwardOutline,
  playOutline,
  pauseOutline,
  videocamOutline,
  calculatorOutline,
  bulbOutline,
  helpCircleOutline,
} from "ionicons/icons";
import "./DemoVideosModal.css";

export interface DemoVideoItem {
  id: string;
  title: string;
  description: string;
  videoSrc: string;
}

export interface FormulaGuideItem {
  name: string;
  example: string;
  desc: string;
}

export const FORMULA_GUIDES: FormulaGuideItem[] = [
  {
    name: "TODAY (CURRENT DATE)",
    example: "=TODAY()",
    desc: "Automatically shows today's live date (ideal for Invoice Date)",
  },
  {
    name: "SUM",
    example: "=SUM(F14:F26)",
    desc: "Adds all numbers in a range (e.g. Subtotal of line items)",
  },
  {
    name: "AVERAGE",
    example: "=AVERAGE(D14:D26)",
    desc: "Calculates the average value of selected cells",
  },
  {
    name: "MIN & MAX",
    example: "=MIN(F14:F26) , =MAX(F14:F26)",
    desc: "Finds the lowest or highest value in the column",
  },
  {
    name: "PERCENTAGE (%)",
    example: "=F34 * 18%",
    desc: "Calculates tax (GST / VAT) or percentage discount",
  },
  {
    name: "MULTIPLY (*)",
    example: "=C14 * D14",
    desc: "Multiplies Quantity by Unit Price for line items",
  },
  {
    name: "SUBTRACT & ADD",
    example: "=(F34 - G35) + G36",
    desc: "(Subtotal - Discount) + Shipping / Extra Charges",
  },
  {
    name: "IF CONDITION",
    example: '=IF(C14>0, C14*D14, "")',
    desc: "Only calculates when Quantity is entered (keeps empty rows clean)",
  },
  {
    name: "ROUND",
    example: "=ROUND(F34, 2)",
    desc: "Rounds invoice total to 2 decimal places",
  },
];

export const DEMO_VIDEOS: DemoVideoItem[] = [
  {
    id: "col-resizing",
    title: "Column Resizing",
    description: "Drag column borders or use the corner touch handle to adjust column width.",
    videoSrc: "/videos/col-resizing.mp4",
  },
  {
    id: "row-demo",
    title: "Row Actions",
    description: "Tap any row number to open quick actions for inserting or deleting rows.",
    videoSrc: "/videos/row-demo.mp4",
  },
  {
    id: "custom-formulas",
    title: "Custom Formulas",
    description: "Write and calculate custom formulas (e.g. =TODAY(), SUM, IF, multiplication) directly in your invoice cells.",
    videoSrc: "/videos/custom-formulas.mp4",
  },
  {
    id: "cell-modal",
    title: "Cell Editing",
    description: "Tap any cell to update values, formulas, and customize font/background colors.",
    videoSrc: "/videos/cell-model-input-model.mp4",
  },
];

export interface DemoVideosModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos?: DemoVideoItem[];
}

export const DemoVideosModal: React.FC<DemoVideosModalProps> = ({ isOpen, onClose, videos = DEMO_VIDEOS }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoList = videos && videos.length > 0 ? videos : DEMO_VIDEOS;
  const currentVideo = videoList[currentIndex] || videoList[0];

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isOpen, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videoList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + videoList.length) % videoList.length);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      className="demo-videos-modal"
    >
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary" className="demo-videos-modal-toolbar">
          <IonButtons slot="start">
            <div className="demo-modal-title-wrapper">
              <IonIcon icon={helpCircleOutline} className="demo-modal-header-icon" />
              <span className="demo-modal-title-text">Help</span>
            </div>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={onClose} className="demo-modal-close-btn">
              <IonIcon icon={closeOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="demo-videos-modal-content">
        <div className="demo-slider-wrapper">
          {/* Video Title */}
          <h3 className="demo-video-title">{currentVideo.title}</h3>

          {/* Video Player */}
          <div className="demo-video-card" onClick={togglePlayPause}>
            <video
              ref={videoRef}
              src={currentVideo.videoSrc}
              playsInline
              muted
              loop
              autoPlay
              className="demo-video-element"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Play/Pause Overlay */}
            <button
              type="button"
              className={`demo-video-play-btn ${!isPlaying ? "visible" : ""}`}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            >
              <IonIcon icon={isPlaying ? pauseOutline : playOutline} />
            </button>

            {/* Counter */}
            <div className="demo-video-counter">
              {currentIndex + 1} / {videoList.length}
            </div>
          </div>

          {/* One-sentence Description */}
          <p className="demo-video-description">{currentVideo.description}</p>

          {/* Basic Formulas Guide (Shown on Custom Formulas Slide) */}
          {currentVideo.id === "custom-formulas" && (
            <div className="formula-guide-section">
              <div className="formula-guide-header">
                <div className="formula-guide-header-title">
                  <IonIcon icon={calculatorOutline} className="formula-guide-icon" />
                  <span>Basic Formulas Quick Reference</span>
                </div>
                <span className="formula-guide-tip">
                  <IonIcon icon={bulbOutline} />
                  Start formulas with <code>=</code>
                </span>
              </div>

              <div className="formula-guide-grid">
                {FORMULA_GUIDES.map((f, i) => (
                  <div key={i} className="formula-guide-card">
                    <div className="formula-card-top">
                      <span className="formula-name-badge">{f.name}</span>
                      <code className="formula-code">{f.example}</code>
                    </div>
                    <div className="formula-card-desc">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="demo-slider-nav">
            <IonButton
              fill="clear"
              size="small"
              onClick={handlePrev}
              className="demo-nav-btn"
            >
              <IonIcon icon={chevronBackOutline} slot="icon-only" />
            </IonButton>

            <div className="demo-dots">
              {videoList.map((_, idx) => (
                <span
                  key={idx}
                  className={`demo-dot ${idx === currentIndex ? "active" : ""}`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>

            <IonButton
              fill="clear"
              size="small"
              onClick={handleNext}
              className="demo-nav-btn"
            >
              <IonIcon icon={chevronForwardOutline} slot="icon-only" />
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default DemoVideosModal;
