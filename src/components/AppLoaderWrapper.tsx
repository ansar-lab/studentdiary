import React, { useState } from 'react';
import VideoLoader from '@/components/VideoLoader';
import App from '@/App';

const AppLoaderWrapper: React.FC = () => {
  const [showLoader, setShowLoader] = useState(true);

  const handleEnded = () => setShowLoader(false);
  const handleSkip = () => setShowLoader(false);

  return (
    <>
      <App />
      {showLoader && (
        <VideoLoader
          src="/Mobile_App_Loading_Screen_Animation.mp4"
          poster="/placeholder.svg"
          loop={false}
          autoplay={true}
          muted={true}
          autoSkipSeconds={8}
          onEnded={handleEnded}
          onSkip={handleSkip}
          showSkip={true}
        />
      )}
    </>
  );
};

export default AppLoaderWrapper;
