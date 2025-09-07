import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { QRScanner } from './QRScanner';
import { 
  QrCode, 
  LogOut, 
  User, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Bell
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { mockAPI } from '../utils/mockBackend';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
}

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const data = await mockAPI.getStudentProfile(user.id);
      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const handleQRScanResult = async (qrData: string) => {
    setIsLocationLoading(true);
    setIsScanning(false);

    try {
      // Get current location
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;

      // Send scan request
      const data = await mockAPI.scanAttendance({
        qrData,
        lat: latitude,
        lng: longitude,
      }, user.id);

      toast.success(data.message);
      
      // Refresh profile data to show updated attendance
      fetchProfileData();
    } catch (error) {
      console.error('Scan error:', error);
      toast.error(`Scan failed: ${error.message}`);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceStatus = (percentage: number) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 75) return 'Good';
    return 'Below Average';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
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
              className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {profileData?.profile?.name?.split(' ')[0]}!
              </h1>
              <p className="text-gray-600">Student Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setIsScanning(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
              >
                <QrCode className="w-5 h-5 mr-2" />
                Scan QR
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardHeader className="text-center pb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mx-auto mb-4"
                >
                  <Avatar className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500">
                    <AvatarFallback className="text-white text-2xl font-bold">
                      {profileData?.profile?.name?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <CardTitle className="text-xl">{profileData?.profile?.name}</CardTitle>
                <CardDescription className="text-base">
                  {profileData?.profile?.course}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Roll Number</p>
                    <p className="font-semibold">{profileData?.profile?.rollNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Enrollment</p>
                    <p className="font-semibold">{profileData?.profile?.enrollmentNo}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold">{profileData?.profile?.phone}</p>
                  </div>
                </div>

                {/* Overall Attendance */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">Overall Attendance</span>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {profileData?.attendance ? 
                      Math.round(
                        profileData.attendance.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / 
                        profileData.attendance.length
                      ) : 0
                    }%
                  </div>
                  <p className="text-sm text-gray-600">
                    {getAttendanceStatus(
                      profileData?.attendance ? 
                        Math.round(
                          profileData.attendance.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / 
                          profileData.attendance.length
                        ) : 0
                    )}
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subjects and Attendance */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Subject-wise Attendance</h2>
            
            <div className="grid gap-6">
              {profileData?.attendance?.map((subject: any, index: number) => (
                <motion.div
                  key={subject.subject}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="group"
                >
                  <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 group-hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <motion.div
                            whileHover={{ rotate: 10 }}
                            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
                          >
                            <BookOpen className="w-5 h-5 text-white" />
                          </motion.div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {subject.subject}
                            </h3>
                            <p className="text-gray-600 text-sm">Code: {subject.code}</p>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={subject.percentage >= 85 ? 'default' : subject.percentage >= 75 ? 'secondary' : 'destructive'}
                          className="text-sm font-medium"
                        >
                          {subject.percentage}%
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Attendance Progress</span>
                          <span>{subject.attendedSessions}/{subject.totalSessions} sessions</span>
                        </div>
                        <Progress 
                          value={subject.percentage} 
                          className="h-3"
                        />
                      </div>

                      {/* Recent Attendance */}
                      {subject.recentAttendance?.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ delay: 0.3 + 0.1 * index }}
                          className="mt-4 pt-4 border-t border-gray-100"
                        >
                          <p className="text-sm font-medium text-gray-700 mb-2">Recent Sessions</p>
                          <div className="flex space-x-2">
                            {subject.recentAttendance.slice(0, 5).map((record: any, recordIndex: number) => (
                              <motion.div
                                key={recordIndex}
                                whileHover={{ scale: 1.2 }}
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  record.inScanTs && record.outScanTs
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                }`}
                                title={`${new Date(record.inScanTs || record.outScanTs || '').toLocaleDateString()}: ${
                                  record.inScanTs && record.outScanTs ? 'Present' : 'Absent'
                                }`}
                              >
                                {record.inScanTs && record.outScanTs ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <XCircle className="w-3 h-3" />
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* QR Scanner */}
      <QRScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScanResult={handleQRScanResult}
        isProcessing={isLocationLoading}
      />
    </div>
  );
}