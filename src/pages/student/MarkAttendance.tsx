import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ReactWebcam from "react-webcam";
import { Html5Qrcode } from "html5-qrcode";
import { startAuthentication } from "@simplewebauthn/browser";
import { CheckCircle, XCircle, Loader2, Camera, Fingerprint } from "lucide-react";

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyCQ-BNwE_wZwzI45pSFaIoPOIPQtjbd6vo";

// Campus coordinates for the college
const CAMPUS_LAT = 17.994341243916168;
const CAMPUS_LONG = 83.41410562270677;
const ALLOWED_DISTANCE = 200; // meters

const MarkAttendance = () => {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [verificationStep, setVerificationStep] = useState<'initial' | 'qr' | 'biometric' | 'facial' | 'location' | 'complete'>('initial');
  const [facialImage, setFacialImage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const webcamRef = useRef<ReactWebcam>(null);
  const scannerDivId = "qr-reader";
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    return () => {
      // Clean up scanner when component unmounts
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const startScanner = () => {
    setScanning(true);
    setVerificationStep('qr');
    setError(null);
    
    // Request camera permissions explicitly first
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(() => {
        // Create a small delay to ensure the div is rendered
        setTimeout(() => {
          const html5QrCode = new Html5Qrcode(scannerDivId);
          scannerRef.current = html5QrCode;
          
          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            onScanSuccess,
            onScanFailure
          ).catch((err) => {
            console.error("Failed to start scanner:", err);
            setError("Failed to start camera. Please check permissions.");
            setScanning(false);
          });
        }, 500);
      })
      .catch(err => {
        console.error("Camera permission denied:", err);
        setError("Camera access denied. Please enable camera permissions in your browser settings.");
        setScanning(false);
      });
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    try {
      stopScanner();
      setProcessing(true);
      
      // Parse QR data
      const qrData = JSON.parse(decodedText);
      const { session_id, subject, timestamp } = qrData;
      
      if (!session_id) {
        throw new Error("Invalid QR code");
      }
      
      // Verify session is valid
      const { data: session, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("*")
        .eq("session_id", session_id)
        .eq("is_active", true)
        .single();
      
      if (sessionError || !session) {
        throw new Error("Session not found or expired");
      }
      
      // Check if session is still valid (not expired)
      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      
      if (now > expiresAt) {
        throw new Error("QR code has expired");
      }
      
      // Store session data for later use
      setSessionData(session);
      
      // Move to biometric verification
      setVerificationStep('biometric');
      setProcessing(false);
      
    } catch (error: any) {
      console.error("QR scan error:", error);
      setError(error.message || "Failed to process QR code");
      setProcessing(false);
      setVerificationStep('initial');
    }
  };

  const onScanFailure = (error: any) => {
    // Don't show errors for normal scanning failures
    console.log("QR scan failure:", error);
  };

  const verifyBiometric = async () => {
    try {
      setProcessing(true);
      
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported in this browser");
      }
      
      // Check if platform authenticator is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        console.log("Platform authenticator not available, switching to facial recognition");
        setVerificationStep('facial');
        setProcessing(false);
        return;
      }
      
      // Mock challenge - in a real app, this would come from your server
      const mockChallenge = new Uint8Array(32);
      window.crypto.getRandomValues(mockChallenge);
      
      // Start authentication with WebAuthn
      try {
        await startAuthentication({
          challenge: Buffer.from(mockChallenge).toString('base64'),
          allowCredentials: [],
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        });
        
        // If successful, proceed to location verification
        setVerificationStep('location');
        setProcessing(false);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          throw new Error("Fingerprint verification was denied");
        } else if (err.name === 'NotSupportedError') {
          console.log("Fingerprint not supported, switching to facial recognition");
          setVerificationStep('facial');
          setProcessing(false);
          return;
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error("Biometric verification error:", error);
      setError(error.message || "Failed to verify biometrics");
      setProcessing(false);
      setVerificationStep('initial');
    }
  };

  // Capture facial image for verification
  const captureFacialImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setFacialImage(imageSrc);
      
      // In a real implementation, you would send this image to your server
      // for facial recognition verification against the student's registered face
      
      // For this implementation, we'll simulate a successful verification
      setTimeout(() => {
        setVerificationStep('location');
        setProcessing(false);
      }, 1500);
    } else {
      setError("Camera not available. Please check permissions.");
      setProcessing(false);
      setVerificationStep('initial');
    }
  }, []);

  const verifyLocation = async () => {
    try {
      setProcessing(true);
      
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, (error) => {
          // Handle specific geolocation errors
          if (error.code === 1) {
            reject(new Error("Location permission denied. Please enable location services."));
          } else if (error.code === 2) {
            reject(new Error("Location unavailable. Please try again."));
          } else if (error.code === 3) {
            reject(new Error("Location request timed out. Please try again."));
          } else {
            reject(error);
          }
        }, {
          enableHighAccuracy: true,
          timeout: 10000, // Increased timeout
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      
      // Calculate distance from campus (using Haversine formula)
      const distance = calculateDistance(
        latitude, longitude,
        CAMPUS_LAT, CAMPUS_LONG
      );
      
      if (distance > ALLOWED_DISTANCE) {
        throw new Error("You are outside the allowed campus area");
      }
      
      // Record attendance
      await recordAttendance(latitude, longitude);
      
      // Show success
      setVerificationStep('complete');
      setSuccess(true);
      setProcessing(false);
      
    } catch (error: any) {
      console.error("Location verification error:", error);
      setError(error.message || "Failed to verify location");
      setProcessing(false);
      setVerificationStep('initial');
    }
  };

  const recordAttendance = async (latitude: number, longitude: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Check if sessionData exists
      if (!sessionData || !sessionData.session_id) {
        throw new Error("Session data is missing");
      }
      
      // Insert attendance record
      const { error } = await supabase
        .from("attendance_records")
        .insert({
          student_id: user.id,
          session_id: sessionData.session_id,
          subject: sessionData.subject || "Unknown",
          location_lat: latitude,
          location_long: longitude,
          biometric_verified: true,
          status: "Present"
        });
      
      if (error) {
        console.error("Supabase error:", error);
        // Check if it's a duplicate record error
        if (error.code === "23505") {
          throw new Error("You have already marked attendance for this session");
        }
        throw error;
      }
      
    } catch (error: any) {
      console.error("Failed to record attendance:", error);
      throw new Error(error.message || "Failed to record attendance");
    }
  };

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    
    return d; // distance in meters
  };

  const resetProcess = () => {
    setScanning(false);
    setProcessing(false);
    setSuccess(false);
    setError(null);
    setSessionData(null);
    setVerificationStep('initial');
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F9F5EB]">
      <div className="flex-1 container mx-auto p-4">
        <h1 className="text-2xl font-bold text-[#7D3C0A] mb-4">Mark Attendance</h1>
        
        {verificationStep === 'initial' && (
          <Card className="bg-[#F9F5EB] border-[#E4DCCF]">
            <CardHeader>
              <CardTitle className="text-[#7D3C0A]">Scan Attendance QR Code</CardTitle>
              <CardDescription>Scan the QR code displayed by your teacher to mark your attendance</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex flex-col items-center text-red-700">
                  <XCircle className="h-12 w-12 text-red-500 mb-2" />
                  <p className="text-center font-medium">Error</p>
                  <p className="text-center text-sm">{error}</p>
                  <Button 
                    variant="outline" 
                    className="mt-2 bg-white hover:bg-gray-100"
                    onClick={() => {
                      setError(null);
                      setVerificationStep('initial');
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {!error && !scanning && (
                <Button 
                  className="w-full bg-[#7FB3D5] hover:bg-[#5499C7] text-white"
                  onClick={() => startScanner()}
                >
                  Scan QR Code
                </Button>
              )}
              
              {scanning && (
                <div className="flex flex-col items-center">
                  <div id={scannerDivId} className="w-full max-w-sm mx-auto"></div>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => stopScanner()}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {verificationStep === 'biometric' && (
          <Card className="bg-[#F9F5EB] border-[#E4DCCF]">
            <CardHeader>
              <CardTitle className="text-[#7D3C0A]">Biometric Verification</CardTitle>
              <CardDescription>Verify your identity using fingerprint</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {processing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-[#7D3C0A] animate-spin mb-2" />
                  <p>Verifying biometrics...</p>
                </div>
              ) : (
                <Button 
                  className="w-full bg-[#7FB3D5] hover:bg-[#5499C7] text-white"
                  onClick={verifyBiometric}
                >
                  <Fingerprint className="mr-2 h-5 w-5" />
                  Verify with Fingerprint
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {verificationStep === 'facial' && (
          <Card className="bg-[#F9F5EB] border-[#E4DCCF]">
            <CardHeader>
              <CardTitle className="text-[#7D3C0A]">Facial Recognition</CardTitle>
              <CardDescription>Verify your identity using your face</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {!facialImage ? (
                <>
                  <div className="w-full max-w-sm mx-auto mb-4 rounded-lg overflow-hidden border-2 border-[#E4DCCF]">
                    <ReactWebcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        facingMode: "user"
                      }}
                      className="w-full"
                    />
                  </div>
                  {processing ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-12 w-12 text-[#7D3C0A] animate-spin mb-2" />
                      <p>Processing...</p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full bg-[#7FB3D5] hover:bg-[#5499C7] text-white"
                      onClick={() => {
                        setProcessing(true);
                        captureFacialImage();
                      }}
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Capture Image
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-sm mx-auto mb-4 rounded-lg overflow-hidden border-2 border-[#E4DCCF]">
                    <img src={facialImage} alt="Captured face" className="w-full" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 text-[#7D3C0A] animate-spin mb-2" />
                    <p>Verifying identity...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {verificationStep === 'location' && (
          <Card className="bg-[#F9F5EB] border-[#E4DCCF]">
            <CardHeader>
              <CardTitle className="text-[#7D3C0A]">Location Verification</CardTitle>
              <CardDescription>Verify you are within the campus area</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {processing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-12 w-12 text-[#7D3C0A] animate-spin mb-2" />
                  <p>Verifying location...</p>
                </div>
              ) : (
                <>
                  <Button 
                    className="w-full bg-[#7FB3D5] hover:bg-[#5499C7] text-white mb-2"
                    onClick={verifyLocation}
                  >
                    Verify Location
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setVerificationStep('initial')}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
        
        {verificationStep === 'complete' && (
          <Card className="bg-[#F9F5EB] border-[#E4DCCF]">
            <CardContent className="flex flex-col items-center pt-6">
              {success ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-xl font-semibold text-[#7D3C0A] mb-2">Attendance Recorded</h2>
                  <p className="text-center mb-4">Your attendance has been successfully recorded.</p>
                  <Button 
                    className="bg-[#7FB3D5] hover:bg-[#5499C7] text-white"
                    onClick={() => navigate('/student/dashboard')}
                  >
                    Return to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <XCircle className="h-16 w-16 text-red-500 mb-4" />
                  <h2 className="text-xl font-semibold text-[#7D3C0A] mb-2">Failed to Record Attendance</h2>
                  <p className="text-center mb-4">{error || "An error occurred while recording attendance."}</p>
                  <Button 
                    className="bg-[#7FB3D5] hover:bg-[#5499C7] text-white"
                    onClick={() => {
                      setError(null);
                      setVerificationStep('initial');
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default MarkAttendance;