import React, { useRef, useEffect } from 'react';

type VideoLoaderProps = {
  src: string; // video URL
  poster?: string; // fallback poster image
  loop?: boolean; // loop the video
  autoplay?: boolean; // autoplay the video
  muted?: boolean; // mute by default for autoplay policies
  onEnded?: () => void; // callback when video ends
  autoSkipSeconds?: number; // if autoplay blocked, auto-skip after this many seconds
  className?: string;
  showSkip?: boolean; // show skip button
  onSkip?: () => void;
};

const VideoLoader: React.FC<VideoLoaderProps> = ({
  src,
  poster,
  loop = false,
  autoplay = true,
  muted = true,
  onEnded,
  autoSkipSeconds,
  className = '',
  showSkip = true,
  onSkip,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playBlocked, setPlayBlocked] = React.useState(false);
  const [playError, setPlayError] = React.useState(false);
  const autoSkipTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Try to play when mounted if autoplay is desired
    if (autoplay) {
      const p = v.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          // played successfully
        }).catch((err) => {
          // autoplay may be blocked; show fallback UI and optionally auto-skip
          console.warn('Autoplay blocked:', err);
          setPlayBlocked(true);
          if (autoSkipSeconds && typeof autoSkipSeconds === 'number' && autoSkipSeconds > 0) {
            // schedule auto-skip
            autoSkipTimerRef.current = window.setTimeout(() => {
              if (onSkip) onSkip();
            }, autoSkipSeconds * 1000);
          }
        });
      }
    }
    return () => {
      if (autoSkipTimerRef.current) {
        clearTimeout(autoSkipTimerRef.current);
        autoSkipTimerRef.current = null;
      }
    };
  }, [autoplay]);

  return (
    // fixed full-screen overlay so the video always shows above other UI
    <div className={`fixed inset-0 flex items-center justify-center bg-black z-50 ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop={loop}
        autoPlay={autoplay}
        muted={muted}
        playsInline
        onEnded={() => onEnded && onEnded()}
        onError={() => setPlayError(true)}
        // occupy viewport while maintaining aspect ratio
        className="w-full h-full object-cover"
      />
      {/* Fallback UI when autoplay is blocked or an error occurs: show poster + spinner */}
      {(playBlocked || playError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-60">
          {poster ? (
            <img src={poster} alt="loading poster" className="max-w-xs mb-4 rounded" />
          ) : null}
          <div className="flex items-center space-x-2 text-white">
            <div className="loader-border w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            <span>Loading...</span>
          </div>
          {showSkip && (
            <button
              onClick={() => onSkip && onSkip()}
              className="mt-6 bg-white/90 text-[#7D3C0A] px-4 py-2 rounded shadow-lg"
            >
              Skip
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoLoader;
