import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onLoadingComplete?: () => void;
}

const LoadingScreen = ({ onLoadingComplete }: LoadingScreenProps) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    // Auto-complete loading after video ends or after 5 seconds max
    const timer = setTimeout(() => {
      if (onLoadingComplete) onLoadingComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  const handleVideoEnd = () => {
    if (onLoadingComplete) onLoadingComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Replace the src with your video path: public/loading-video.mp4 */}
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onLoadedData={() => setIsVideoLoaded(true)}
          onEnded={handleVideoEnd}
        >
          <source src="/loading-video.mp4" type="video/mp4" />
          {/* Fallback content if video doesn't load */}
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Loading...</p>
            </div>
          </div>
        </video>

        {/* Fallback loader while video is loading */}
        {!isVideoLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
