import React from "react";
import { PlayCircle } from "lucide-react";
import { HERO_VIDEO } from "../siteConfig";

function youTubeId(src: string): string | null {
  const m = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export const HeroVideo: React.FC = () => {
  const { src, poster, title } = HERO_VIDEO;
  const ytId = src ? youTubeId(src) : null;

  if (ytId) {
    return (
      <div className="hero-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (src) {
    return (
      <div className="hero-video">
        {/* "#t=0.1" makes Safari/iOS paint the first frame instead of a black box before play */}
        <video src={`${src}#t=0.1`} controls playsInline preload="metadata" title={title} />
      </div>
    );
  }

  // No video configured yet: show the poster with a placeholder label.
  return (
    <div className="hero-video hero-video-placeholder" role="img" aria-label={`${title} (video coming soon)`}>
      <img src={poster} alt="" />
      <div className="hero-video-overlay">
        <PlayCircle size={56} strokeWidth={1.4} />
        <span>{title}</span>
        <small>Video coming soon</small>
      </div>
    </div>
  );
};
