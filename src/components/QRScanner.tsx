import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

const QRScanner = ({ onScanSuccess }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Check if we're running on HTTPS or localhost
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      console.error("Camera access requires HTTPS. Please access the app via HTTPS or localhost.");
      return;
    }

    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
    }, false);

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        scanner.clear(); // stop scanning after success
      },
      (error) => {
        console.warn("QR scan error:", error);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return <div id="qr-reader" style={{ width: "100%" }} />;
};

export default QRScanner;
