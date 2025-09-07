import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Eye, EyeOff, BookOpen, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { mockAPI } from '../utils/mockBackend';

interface LoginFormProps {
  portalType: 'student' | 'faculty';
  onLogin: (userData: any) => void;
  onBack: () => void;
}

export function LoginForm({ portalType, onLogin, onBack }: LoginFormProps) {
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await mockAPI.login(formData.id, formData.password);

      // Verify the user role matches the portal type
      if (data.user.role !== portalType) {
        throw new Error(`This portal is for ${portalType}s only. Please use the correct portal.`);
      }

      localStorage.setItem('token', data.token);
      toast.success('Login successful! Welcome back.');
      onLogin(data.user);
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = portalType === 'student' 
    ? [
        { id: 'STU001', name: 'Arjun Patel (CS21001)' },
        { id: 'STU002', name: 'Priya Sharma (CS21002)' }
      ]
    : [
        { id: 'FAC001', name: 'Dr. Rajesh Kumar' },
        { id: 'FAC002', name: 'Prof. Meera Joshi' }
      ];

  const fillDemoCredentials = (id: string) => {
    setFormData({
      id,
      password: portalType === 'student' ? 'student123' : 'faculty123'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4"
          >
            <div className={`w-16 h-16 bg-gradient-to-r ${
              portalType === 'student' 
                ? 'from-blue-500 to-cyan-500' 
                : 'from-purple-500 to-pink-500'
            } rounded-2xl flex items-center justify-center`}>
              {portalType === 'student' ? (
                <BookOpen className="w-8 h-8 text-white" />
              ) : (
                <Users className="w-8 h-8 text-white" />
              )}
            </div>
          </motion.div>
          
          <CardTitle className="text-2xl font-bold capitalize">
            {portalType} Portal
          </CardTitle>
          <CardDescription>
            Sign in to access your {portalType} dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
            >
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="id">
                {portalType === 'student' ? 'Student ID' : 'Faculty ID'}
              </Label>
              <Input
                id="id"
                type="text"
                placeholder={portalType === 'student' ? 'Enter student ID' : 'Enter faculty ID'}
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                required
                className="transition-all duration-200 focus:scale-105"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="pr-10 transition-all duration-200 focus:scale-105"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="pt-4"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full h-12 text-base font-medium bg-gradient-to-r ${
                  portalType === 'student' 
                    ? 'from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600' 
                    : 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                } transition-all duration-300 hover:shadow-lg hover:scale-105`}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="bg-gray-50 rounded-xl p-4 space-y-3"
          >
            <h4 className="text-sm font-medium text-gray-700">Demo Credentials:</h4>
            <div className="space-y-2">
              {demoCredentials.map((cred, index) => (
                <motion.button
                  key={cred.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fillDemoCredentials(cred.id)}
                  className="w-full text-left p-2 text-xs rounded-lg bg-white hover:bg-gray-50 border transition-colors"
                >
                  <div className="font-medium text-gray-800">{cred.id}</div>
                  <div className="text-gray-600">{cred.name}</div>
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Password: {portalType === 'student' ? 'student123' : 'faculty123'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="w-full group hover:bg-gray-100"
            >
              <motion.div
                whileHover={{ x: -3 }}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Portal Selection
              </motion.div>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}