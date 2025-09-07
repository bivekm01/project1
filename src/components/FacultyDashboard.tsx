import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  LogOut, 
  Plus, 
  QrCode, 
  Calendar, 
  Clock, 
  BookOpen,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  RefreshCw,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { mockAPI } from '../utils/mockBackend';
// Enhanced QR Code generation function using high-resolution canvas
const generateQRDataURL = (text: string, color: string = '#000000') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Use high resolution to prevent blurriness
  const size = 400;
  const scale = 2; // For retina displays
  canvas.width = size * scale;
  canvas.height = size * scale;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  
  // Scale the context to match the device pixel ratio
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false; // Crisp edges
  
  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  
  // Create a more sophisticated QR-like pattern
  ctx.fillStyle = color;
  const gridSize = 25; // More detailed grid
  const cellSize = size / gridSize;
  const padding = cellSize;
  
  // Generate a deterministic pattern based on the text
  const hash = Array.from(text).reduce((acc, char, idx) => acc + char.charCodeAt(0) * (idx + 1), 0);
  
  // Create QR-like pattern with proper structure
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Skip corner marker areas
      const isCornerMarker = (
        (i < 7 && j < 7) || 
        (i < 7 && j >= gridSize - 7) || 
        (i >= gridSize - 7 && j < 7)
      );
      
      if (!isCornerMarker) {
        // Create pattern based on text hash and position
        const shouldFill = ((hash + i * 7 + j * 13 + i * j) % 5) < 2;
        if (shouldFill) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
  }
  
  // Add corner markers (finder patterns)
  const drawCornerMarker = (x: number, y: number) => {
    // Outer square
    ctx.fillRect(x, y, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = color;
    ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
  };
  
  drawCornerMarker(0, 0);
  drawCornerMarker(0, (gridSize - 7) * cellSize);
  drawCornerMarker((gridSize - 7) * cellSize, 0);
  
  // Add timing patterns
  ctx.fillStyle = color;
  for (let i = 8; i < gridSize - 8; i++) {
    if (i % 2 === 0) {
      ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
      ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
  
  // Add data encoding in center
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${Math.floor(cellSize * 0.8)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Extract session info from QR data for display
  try {
    const [qrPayload] = text.split(':');
    const data = JSON.parse(qrPayload);
    const displayText = data.scanType || 'QR';
    ctx.fillText(displayText, size / 2, size / 2);
  } catch {
    ctx.fillText('SCAN', size / 2, size / 2);
  }
  
  // Add border for better definition
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, size - 2, size - 2);
  
  return canvas.toDataURL('image/png', 1.0);
};

interface FacultyDashboardProps {
  user: any;
  onLogout: () => void;
}

export function FacultyDashboard({ user, onLogout }: FacultyDashboardProps) {
  const [dashboardData, setDashboardData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: ''
  });
  const [qrCodes, setQrCodes] = useState({ in: '', out: '' });
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isGeneratingOut, setIsGeneratingOut] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchSubjects();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await mockAPI.getFacultyDashboard(user.id);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const data = await mockAPI.getSubjects(user.id);
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const createSession = async () => {
    setIsCreatingSession(true);
    try {
      const data = await mockAPI.createSession(user.id, formData);
      
      // Generate QR code data URL for IN
      const inQRImage = generateQRDataURL(data.inQrData);

      setSessionData({
        ...data,
        subject: subjects.find(s => s.id === formData.subjectId)?.name || 'Unknown Subject',
        date: formData.date,
        startTime: formData.startTime || new Date().toLocaleTimeString()
      });
      
      setQrCodes({ in: inQRImage, out: '' });
      setShowCreateSession(false);
      setShowQRModal(true);
      
      toast.success('Session created successfully! IN QR code generated.');
      fetchDashboardData(); // Refresh dashboard
    } catch (error) {
      console.error('Session creation error:', error);
      toast.error(error.message);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const generateOutQR = async () => {
    if (!sessionData?.sessionId) return;
    
    setIsGeneratingOut(true);
    try {
      const data = await mockAPI.generateOutQR(sessionData.sessionId);
      
      // Generate QR code data URL for OUT
      const outQRImage = generateQRDataURL(data.outQrData, '#dc2626');

      setQrCodes(prev => ({ ...prev, out: outQRImage }));
      toast.success('OUT QR code generated successfully!');
    } catch (error) {
      console.error('OUT QR generation error:', error);
      toast.error(error.message);
    } finally {
      setIsGeneratingOut(false);
    }
  };

  const viewSessionAttendance = async (session) => {
    try {
      const data = await mockAPI.getSessionAttendance(session.id);
      setSelectedSessionForAttendance(session);
      setAttendanceData(data);
      setShowAttendanceModal(true);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance data');
    }
  };

  const downloadQR = (qrDataUrl: string, type: 'IN' | 'OUT') => {
    const link = document.createElement('a');
    link.download = `${sessionData?.subject || 'session'}-${type}-QR.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg"
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, Dr. {dashboardData?.profile?.name?.split(' ').slice(1).join(' ')}
              </h1>
              <p className="text-gray-600">Faculty Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowCreateSession(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Session
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" onClick={onLogout} className="hover:bg-red-50 hover:text-red-600">
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Profile Card */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardHeader className="text-center pb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mx-auto mb-4"
                >
                  <Avatar className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500">
                    <AvatarFallback className="text-white text-xl font-bold">
                      {dashboardData?.profile?.name?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <CardTitle className="text-lg">{dashboardData?.profile?.name}</CardTitle>
                <CardDescription>{dashboardData?.profile?.department}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 text-sm">Phone</p>
                  <p className="font-semibold">{dashboardData?.profile?.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Subjects</span>
                  <Badge variant="secondary">{dashboardData?.subjects?.length || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Recent Sessions</span>
                  <Badge variant="secondary">{dashboardData?.recentSessions?.length || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
          >
            {/* Subjects */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Subjects</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {dashboardData?.subjects?.map((subject: any, index: number) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-3">
                          <motion.div
                            whileHover={{ rotate: 10 }}
                            className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex-shrink-0"
                          >
                            <BookOpen className="w-5 h-5 text-white" />
                          </motion.div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {subject.name}
                            </h3>
                            <p className="text-gray-600 text-sm">Code: {subject.code}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Sessions</h2>
              <div className="space-y-4">
                {dashboardData?.recentSessions?.length > 0 ? (
                  dashboardData.recentSessions.map((session: any, index: number) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <motion.div
                                whileHover={{ rotate: 10 }}
                                className={`p-3 rounded-xl ${
                                  session.status === 'active' 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                }`}
                              >
                                <Activity className="w-6 h-6 text-white" />
                              </motion.div>
                              
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {subjects.find(s => s.id === session.subjectId)?.name || 'Unknown Subject'}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {new Date(session.date).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {new Date(session.inGenerationTs).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <Badge 
                                variant={session.status === 'active' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {session.status}
                              </Badge>
                              
                              <div className="flex items-center space-x-1">
                                {session.inQrToken && (
                                  <div className="w-3 h-3 bg-green-500 rounded-full" title="IN QR Generated" />
                                )}
                                {session.outQrToken && (
                                  <div className="w-3 h-3 bg-red-500 rounded-full" title="OUT QR Generated" />
                                )}
                              </div>
                              
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => viewSessionAttendance(session)}
                                  className="hover:bg-blue-50"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">No recent sessions found</p>
                    <p className="text-gray-500 text-sm mt-1">Create your first session to get started</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Create Session Modal */}
      <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="w-6 h-6 mr-2" />
              Create New Session
            </DialogTitle>
            <DialogDescription>
              Set up a new class session and generate QR codes for attendance
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select 
                value={formData.subjectId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time (Optional)</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                placeholder="Will use current time if empty"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={createSession}
                disabled={isCreatingSession || !formData.subjectId}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isCreatingSession ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Codes Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <QrCode className="w-6 h-6 mr-2" />
              Session QR Codes
            </DialogTitle>
            <DialogDescription>
              {sessionData?.subject} - {sessionData?.date}
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            {/* IN QR Code */}
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="default" className="mb-4">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  IN QR Code
                </Badge>
                {qrCodes.in && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <img src={qrCodes.in} alt="IN QR Code" className="w-full max-w-[250px] mx-auto rounded-lg shadow-lg" />
                  </motion.div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadQR(qrCodes.in, 'IN')}
                  disabled={!qrCodes.in}
                  className="mt-3"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            {/* OUT QR Code */}
            <div className="space-y-4">
              <div className="text-center">
                <Badge variant="destructive" className="mb-4">
                  <XCircle className="w-4 h-4 mr-1" />
                  OUT QR Code
                </Badge>
                {qrCodes.out ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <img src={qrCodes.out} alt="OUT QR Code" className="w-full max-w-[250px] mx-auto rounded-lg shadow-lg" />
                  </motion.div>
                ) : (
                  <div className="w-full max-w-[250px] mx-auto aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Generate when class ends</p>
                    </div>
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={qrCodes.out ? () => downloadQR(qrCodes.out, 'OUT') : generateOutQR}
                  disabled={isGeneratingOut}
                  className={`mt-3 ${!qrCodes.out ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
                >
                  {isGeneratingOut ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                    </motion.div>
                  ) : qrCodes.out ? (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate OUT QR
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Show the IN QR code when class starts</li>
              <li>• Generate and show the OUT QR code when class ends</li>
              <li>• Students must scan both QR codes for complete attendance</li>
              <li>• QR codes expire after 30 minutes for security</li>
            </ul>
            <div className="mt-3 p-3 bg-white rounded border">
              <p className="text-xs text-gray-600 mb-2">Demo: Students can use these codes for testing:</p>
              <div className="flex space-x-2">
                <code className="px-2 py-1 bg-gray-100 rounded text-xs">DEMO-IN</code>
                <code className="px-2 py-1 bg-gray-100 rounded text-xs">DEMO-OUT</code>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Session Attendance Modal */}
      <Dialog open={showAttendanceModal} onOpenChange={setShowAttendanceModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Session Attendance
            </DialogTitle>
            <DialogDescription>
              {subjects.find(s => s.id === selectedSessionForAttendance?.subjectId)?.name} - {' '}
              {new Date(selectedSessionForAttendance?.date || '').toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {attendanceData && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{attendanceData.totalScans}</div>
                    <div className="text-sm text-gray-600">Total Scans</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{attendanceData.completeAttendance}</div>
                    <div className="text-sm text-gray-600">Complete Attendance</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {attendanceData.totalScans > 0 ? Math.round((attendanceData.completeAttendance / attendanceData.totalScans) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </CardContent>
                </Card>
              </div>

              {/* Attendance List */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Student Attendance Records</h4>
                {attendanceData.attendance.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceData.attendance.map((record: any, index: number) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`${record.isComplete ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  record.isComplete ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                  {record.isComplete ? (
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-white" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{record.studentName}</div>
                                  <div className="text-sm text-gray-600">Roll: {record.rollNo}</div>
                                </div>
                              </div>
                              
                              <div className="text-right text-sm">
                                {record.inScanTs && (
                                  <div className="text-green-600">
                                    IN: {new Date(record.inScanTs).toLocaleTimeString()}
                                  </div>
                                )}
                                {record.outScanTs && (
                                  <div className="text-red-600">
                                    OUT: {new Date(record.outScanTs).toLocaleTimeString()}
                                  </div>
                                )}
                                {!record.isComplete && (
                                  <div className="text-gray-500">
                                    {record.inScanTs ? 'Missing OUT scan' : 'Missing IN scan'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No attendance records yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}