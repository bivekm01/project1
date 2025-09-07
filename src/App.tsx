import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoginForm } from './components/LoginForm';
import { StudentDashboard } from './components/StudentDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { Toaster } from './components/ui/sonner';
import { BookOpen, Users, GraduationCap, MapPin, Clock, Shield } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activePortal, setActivePortal] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setActivePortal('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {user.role === 'student' ? (
          <StudentDashboard user={user} onLogout={handleLogout} />
        ) : (
          <FacultyDashboard user={user} onLogout={handleLogout} />
        )}
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 right-10 w-48 h-48 bg-purple-200 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-200 rounded-full opacity-30 blur-lg"
        />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className="p-2 bg-white rounded-xl shadow-lg"
              >
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Parul University
                </h1>
                <p className="text-gray-600 text-sm">Smart Attendance System</p>
              </div>
            </motion.div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-6 md:px-8 pb-8">
          <AnimatePresence mode="wait">
            {!activePortal ? (
              <motion.div
                key="portal-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Hero Section */}
                <motion.div
                  variants={itemVariants}
                  className="text-center mb-12"
                >
                  <motion.h2
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
                  >
                    Welcome to the Future of
                    <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      University Management
                    </span>
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
                  >
                    Experience seamless attendance tracking with GPS-enabled QR scanning,
                    real-time updates, and intelligent analytics for students and faculty.
                  </motion.p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                  variants={itemVariants}
                  className="grid md:grid-cols-3 gap-6 mb-12"
                >
                  {[
                    {
                      icon: MapPin,
                      title: "GPS-Enabled Scanning",
                      description: "Secure attendance with campus geofencing",
                      color: "from-blue-500 to-cyan-500"
                    },
                    {
                      icon: Clock,
                      title: "Real-Time Updates",
                      description: "Instant attendance synchronization",
                      color: "from-purple-500 to-pink-500"
                    },
                    {
                      icon: Shield,
                      title: "Anti-Cheat Security",
                      description: "Advanced verification and fraud prevention",
                      color: "from-green-500 to-teal-500"
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                      whileHover={{ 
                        scale: 1.05,
                        transition: { duration: 0.2 }
                      }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + index * 0.1, duration: 0.3, type: "spring" }}
                        className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4`}
                      >
                        <feature.icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Portal Selection */}
                <motion.div
                  variants={itemVariants}
                  className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActivePortal('student')}
                    className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50 cursor-pointer hover:shadow-3xl transition-all duration-500"
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatDelay: 2
                      }}
                      className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300"
                    >
                      <BookOpen className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-center mb-4 text-gray-900">Student Portal</h3>
                    <p className="text-gray-600 text-center mb-6">
                      Access your profile, view attendance, and scan QR codes for class participation
                    </p>
                    <div className="flex justify-center">
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="text-blue-600 font-medium flex items-center"
                      >
                        Login as Student
                        <motion.span
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActivePortal('faculty')}
                    className="group bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50 cursor-pointer hover:shadow-3xl transition-all duration-500"
                  >
                    <motion.div
                      animate={{
                        rotate: [0, -5, 5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        repeatDelay: 2,
                        delay: 1
                      }}
                      className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300"
                    >
                      <Users className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-center mb-4 text-gray-900">Faculty Portal</h3>
                    <p className="text-gray-600 text-center mb-6">
                      Create sessions, generate QR codes, and manage student attendance records
                    </p>
                    <div className="flex justify-center">
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="text-purple-600 font-medium flex items-center"
                      >
                        Login as Faculty
                        <motion.span
                          animate={{ x: [0, 3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="max-w-md mx-auto"
              >
                <LoginForm
                  portalType={activePortal}
                  onLogin={handleLogin}
                  onBack={() => setActivePortal('')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <Toaster position="top-right" />
    </div>
  );
}