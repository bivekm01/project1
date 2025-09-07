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
  X
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

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

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
    }
    
    return () => stopScanning();
  }, [isOpen]);

  const startScanning = async () => {
    setScanError('');
    
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraActive(true);
            scanForQRCode();
          }).catch(error => {
            console.error('Video play error:', error);
            setScanError('Failed to start video stream');
          });
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          setScanError('Video stream error');
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      let errorMessage = 'Camera access denied or not available';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera is not supported in this browser.';
      }
      
      setScanError(errorMessage);
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
    if (!scanForQRCode.lastTip || now - scanForQRCode.lastTip > 8000) {
      scanForQRCode.lastTip = now;
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
              <Alert variant={scanError.includes('Scanning') ? 'default' : 'destructive'}>
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
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
          <div className="flex space-x-3">
            <Button
              onClick={startScanning}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isCameraActive ? 'Restart Camera' : 'Start Camera'}
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