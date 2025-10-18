import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import ReactWebcam from "react-webcam";
import { Html5Qrcode } from "html5-qrcode";
import { startAuthentication } from "@simplewebauthn/browser";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

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
  const [verificationStep, setVerificationStep] = useState<'initial' | 'qr' | 'biometric' | 'location' | 'complete'>('initial');
  const scannerRef = useRef<Html5Qrcode | null>(null);
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
      
      // In a real implementation, you would:
      // 1. Request challenge from your server
      // 2. Use startAuthentication with the challenge
      // 3. Verify the authentication on your server
      
      // For demo purposes, we'll simulate a successful authentication
      // In production, use actual WebAuthn flow
      
      // Simulate biometric verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Move to location verification
      setVerificationStep('location');
      setProcessing(false);
      
    } catch (error: any) {
      console.error("Biometric verification error:", error);
      setError("Biometric verification failed");
      setProcessing(false);
      setVerificationStep('initial');
    }
  };

  const verifyLocation = async () => {
    try {
      setProcessing(true);
      
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
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
      
      // Insert attendance record
      const { error } = await supabase
        .from("attendance_records")
        .insert({
          student_id: user.id,
          session_id: sessionData.session_id,
          subject: sessionData.subject,
          location_lat: latitude,
          location_long: longitude,
          biometric_verified: true,
          status: "Present"
        });
      
      if (error) throw error;
      
    } catch (error: any) {
      console.error("Failed to record attendance:", error);
      throw new Error("Failed to record attendance");
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
    <div className="container mx-auto p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Mark Attendance</h1>
      
      {verificationStep === 'initial' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scan Attendance QR Code</CardTitle>
            <CardDescription>
              Scan the QR code displayed by your teacher to mark your attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Button 
              onClick={startScanner} 
              className="w-full max-w-xs bg-accent"
              disabled={scanning || processing}
            >
              {scanning ? "Scanning..." : "Scan QR Code"}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {verificationStep === 'qr' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scanning QR Code</CardTitle>
            <CardDescription>
              Position the QR code within the scanner
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div id={scannerDivId} className="w-full max-w-xs h-64 mx-auto"></div>
            <Button 
              onClick={resetProcess} 
              variant="outline" 
              className="mt-4"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
      
      {verificationStep === 'biometric' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Biometric Verification</CardTitle>
            <CardDescription>
              Verify your identity using your device's biometric authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Button 
              onClick={verifyBiometric} 
              className="w-full max-w-xs bg-accent mb-4"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify with Biometric"
              )}
            </Button>
            <Button 
              onClick={resetProcess} 
              variant="outline"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
      
      {verificationStep === 'location' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Location Verification</CardTitle>
            <CardDescription>
              Verify you are within the campus area
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Button 
              onClick={verifyLocation} 
              className="w-full max-w-xs bg-accent mb-4"
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Location...
                </>
              ) : (
                "Verify Location"
              )}
            </Button>
            <Button 
              onClick={resetProcess} 
              variant="outline"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}
      
      {verificationStep === 'complete' && success && (
        <Card className="mb-6 border-green-500">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">Attendance Marked!</h2>
              <p className="text-gray-600 mb-6">
                Your attendance has been successfully recorded.
              </p>
              <Button 
                onClick={() => navigate("/student/attendance")} 
                className="bg-accent"
              >
                View Attendance History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button 
                onClick={resetProcess} 
                variant="outline"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <BottomNav />
    </div>
  );
};

export default MarkAttendance;