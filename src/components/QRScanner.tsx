import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  QrCode, 
  Camera, 
  Upload, 
  Loader2, 
  CheckCircle, 
  MapPin,
  X,
  AlertTriangle,
  Settings,
  RefreshCw,
  Info
} from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (qrData: string) => void;
  isProcessing: boolean;
}

export function QRScanner({ isOpen, onClose, onScanResult, isProcessing }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [scanError, setScanError] = useState('');
  const [lastScanResult, setLastScanResult] = useState('');
  const [manualQRInput, setManualQRInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied' | 'prompt'>('checking');
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    } else {
      stopScanning();
    }
    
    return () => stopScanning();
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      // Check if permissions API is supported
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setPermissionState(permission.state);
        
        if (permission.state === 'granted') {
          startScanning();
        } else if (permission.state === 'denied') {
          setScanError('Camera access denied. Please enable camera permission in your browser settings.');
          setShowPermissionHelp(true);
        }
      } else {
        // Fallback for browsers without permissions API
        setPermissionState('prompt');
      }
    } catch (error) {
      console.error('Permission check error:', error);
      setPermissionState('prompt');
    }
  };

  const requestCameraPermission = async () => {
    setScanError('');
    setShowPermissionHelp(false);
    
    try {
      // First, try to get basic access to check if camera exists
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        setScanError('No camera found on this device. Please connect a camera or use manual input.');
        return;
      }

      // Try to access camera with progressive fallback
      const constraints = [
        // Try environment camera first (back camera on mobile)
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          }
        },
        // Fallback to any camera
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          }
        },
        // Basic camera access
        {
          video: true
        }
      ];

      let stream = null;
      let constraintIndex = 0;

      while (!stream && constraintIndex < constraints.length) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints[constraintIndex]);
          break;
        } catch (err) {
          console.warn(`Camera constraint ${constraintIndex} failed:`, err);
          constraintIndex++;
        }
      }

      if (!stream) {
        throw new Error('Unable to access camera with any configuration');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setPermissionState('granted');
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
            scanForQRCode();
            setScanError('Camera active. Position QR code in the frame.');
          }).catch(error => {
            console.error('Video play error:', error);
            setScanError('Failed to start video playback. Try refreshing the page.');
          });
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setScanError('Video stream error. Please try again.');
        };
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      setPermissionState('denied');
      
      let errorMessage = 'Camera access failed';
      let helpNeeded = false;
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser.';
        helpNeeded = true;
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found. Please connect a camera or use manual input.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser. Try Chrome, Firefox, or Safari.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera configuration not supported. Trying basic camera access...';
        // Retry with basic constraints
        setTimeout(() => requestCameraPermission(), 1000);
        return;
      } else if (error.message?.includes('secure origin')) {
        errorMessage = 'Camera requires HTTPS. Use manual input for testing.';
      }
      
      setScanError(errorMessage);
      setShowPermissionHelp(helpNeeded);
    }
  };

  const startScanning = () => {
    if (permissionState === 'granted') {
      requestCameraPermission();
    } else {
      requestCameraPermission();
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsCameraActive(false);
  };

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanForQRCode);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // In a real implementation, you would use a QR detection library here
    // For demo purposes, we'll provide better instructions
    
    // Check if we should show scanning tips (for demo)
    const now = Date.now();
    if (!(scanForQRCode as any).lastTip || now - (scanForQRCode as any).lastTip > 8000) {
      (scanForQRCode as any).lastTip = now;
      setScanError('Scanning... For demo: Use manual input with "DEMO-IN" or "DEMO-OUT"');
    }

    animationFrameRef.current = requestAnimationFrame(scanForQRCode);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const filename = file.name.toLowerCase();
    
    // Demo QR data patterns
    if (filename.includes('demo') || filename.includes('qr')) {
      const sessionId = 'SUB001:' + Date.now();
      const scanType = filename.includes('out') ? 'OUT' : 'IN';
      const timestamp = Date.now();
      const expiry = timestamp + (30 * 60 * 1000);
      
      const demoQRData = JSON.stringify({ sessionId, scanType, timestamp, expiry });
      const signature = 'demo-signature-' + timestamp;
      
      onScanResult(`${demoQRData}:${signature}`);
    } else {
      setScanError('For demo: Use files with "demo" or "qr" in the filename, or use manual input.');
    }
  };

  const handleManualInput = () => {
    if (!manualQRInput.trim()) return;
    
    let qrData = manualQRInput.trim();
    
    // Handle demo shortcuts
    if (qrData === 'DEMO-IN' || qrData === 'DEMO-OUT') {
      const sessionId = 'SUB001:' + Date.now();
      const scanType = qrData === 'DEMO-OUT' ? 'OUT' : 'IN';
      const timestamp = Date.now();
      const expiry = timestamp + (30 * 60 * 1000);
      
      const demoQRPayload = JSON.stringify({ sessionId, scanType, timestamp, expiry });
      const signature = 'demo-signature-' + timestamp;
      qrData = `${demoQRPayload}:${signature}`;
    }
    
    onScanResult(qrData);
    setManualQRInput('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <QrCode className="w-6 h-6 mr-2" />
              Scan Attendance QR Code
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Position the QR code within the camera frame or use manual input
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {scanError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert variant={scanError.includes('active') || scanError.includes('Scanning') ? 'default' : 'destructive'}>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {showPermissionHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">Enable Camera Access</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Chrome/Edge:</strong> Click the camera icon in the address bar</p>
                    <p><strong>Firefox:</strong> Click Allow when prompted</p>
                    <p><strong>Safari:</strong> Go to Safari → Preferences → Websites → Camera</p>
                    <p><strong>Mobile:</strong> Allow camera in browser settings</p>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button
                      size="sm"
                      onClick={requestCameraPermission}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Try Again
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPermissionHelp(false)}
                    >
                      Close Help
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {lastScanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>{lastScanResult}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Camera View */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Enhanced Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Scanning Frame */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-48 h-48 border-2 border-blue-500 rounded-xl relative"
                >
                  {/* Corner markers */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-xl"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-xl"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-xl"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-xl"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <motion.div
                      animate={{
                        y: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 via-white to-transparent opacity-90 shadow-lg"
                      style={{
                        boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
                      }}
                    />
                  </div>
                </motion.div>
              </div>
              
              {/* Instructions overlay */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <div className="bg-black/80 text-white px-4 py-2 rounded-lg mx-4 backdrop-blur-sm">
                  <p className="text-sm font-medium">Position QR code within the frame</p>
                </div>
              </div>
              
              {/* Status indicator */}
              <div className="absolute top-4 right-4">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
                  isCameraActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isCameraActive ? 'bg-white animate-pulse' : 'bg-white'
                  }`}></div>
                  <span>{isCameraActive ? 'SCANNING' : 'CAMERA OFF'}</span>
                </div>
              </div>
            </div>
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="bg-white rounded-xl p-6 flex items-center space-x-3 shadow-2xl">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="font-medium">Verifying location...</span>
                </div>
              </div>
            )}
          </div>

          {/* Manual QR Input */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">For demo purposes, you can manually enter QR data:</p>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter QR data or use 'DEMO-IN' or 'DEMO-OUT'"
                  value={manualQRInput}
                  onChange={(e) => setManualQRInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
                  className="flex-1"
                />
                <Button
                  onClick={handleManualInput}
                  disabled={isProcessing || !manualQRInput.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Scan
                </Button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Button
                onClick={startScanning}
                disabled={isProcessing}
                className={`flex-1 ${
                  permissionState === 'denied' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                }`}
              >
                <Camera className="w-4 h-4 mr-2" />
                {permissionState === 'denied' ? 'Request Camera Access' : 
                 isCameraActive ? 'Restart Camera' : 'Start Camera'}
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 border-2 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </Button>
            </div>

            {permissionState === 'denied' && (
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPermissionHelp(!showPermissionHelp)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Camera Permission Help
                </Button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>QR scanning only works within campus boundaries</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}