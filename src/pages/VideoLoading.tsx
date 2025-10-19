import React, { useState } from 'react';
import VideoLoader from '@/components/VideoLoader';
import BottomNav from '@/components/BottomNav';

const VideoLoadingPage: React.FC = () => {
  const [show, setShow] = useState(true);

  const handleEnded = () => setShow(false);
  const handleSkip = () => setShow(false);

  return (
    <div className="min-h-screen bg-[#F9F5EB] flex flex-col">
      {show ? (
        <VideoLoader
          src="/Mobile_App_Loading_Screen_Animation.mp4"
          poster="/placeholder.svg"
          loop={false}
          autoplay={true}
          muted={true}
          onEnded={handleEnded}
          onSkip={handleSkip}
          showSkip={true}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#7D3C0A]">Loading finished</h2>
            <p className="text-sm text-gray-600">Video file: <code>/Mobile_App_Loading_Screen_Animation.mp4</code> (placed in the public directory)</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default VideoLoadingPage;
