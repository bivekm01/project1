// Mock backend service for demo purposes
// This simulates the Supabase edge function responses

interface User {
  id: string;
  name: string;
  role: 'student' | 'faculty';
  phone: string;
  rollNo?: string;
  enrollmentNo?: string;
  course?: string;
  department?: string;
  password?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  facultyId: string;
}

interface Session {
  id: string;
  subjectId: string;
  facultyId: string;
  date: string;
  inGenerationTs: string;
  outGenerationTs?: string;
  inQrToken?: string;
  outQrToken?: string;
  status: string;
}

interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  subjectId: string;
  inScanTs?: string;
  outScanTs?: string;
  inScanLocation?: { lat: number; lng: number };
  outScanLocation?: { lat: number; lng: number };
}

// Mock data storage
class MockDatabase {
  private users: Map<string, User> = new Map();
  private subjects: Map<string, Subject> = new Map();
  private sessions: Map<string, Session> = new Map();
  private attendance: Map<string, AttendanceRecord> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Sample students
    const students: User[] = [
      {
        id: 'STU001',
        name: 'Arjun Patel',
        phone: '+91 9876543210',
        rollNo: 'CS21001',
        enrollmentNo: 'EN2021CS001',
        course: 'Computer Science Engineering',
        password: 'student123',
        role: 'student'
      },
      {
        id: 'STU002',
        name: 'Priya Sharma',
        phone: '+91 9876543211',
        rollNo: 'CS21002',
        enrollmentNo: 'EN2021CS002',
        course: 'Computer Science Engineering',
        password: 'student123',
        role: 'student'
      }
    ];

    // Sample faculty
    const faculty: User[] = [
      {
        id: 'FAC001',
        name: 'Dr. Rajesh Kumar',
        phone: '+91 9876543220',
        department: 'Computer Science',
        password: 'faculty123',
        role: 'faculty'
      },
      {
        id: 'FAC002',
        name: 'Prof. Meera Joshi',
        phone: '+91 9876543221',
        department: 'Information Technology',
        password: 'faculty123',
        role: 'faculty'
      }
    ];

    // Sample subjects
    const subjects: Subject[] = [
      {
        id: 'SUB001',
        name: 'Data Structures',
        facultyId: 'FAC001',
        code: 'CS301'
      },
      {
        id: 'SUB002',
        name: 'Database Management Systems',
        facultyId: 'FAC001',
        code: 'CS302'
      },
      {
        id: 'SUB003',
        name: 'Operating Systems',
        facultyId: 'FAC001',
        code: 'CS303'
      },
      {
        id: 'SUB004',
        name: 'Web Development',
        facultyId: 'FAC002',
        code: 'IT301'
      },
      {
        id: 'SUB005',
        name: 'Computer Networks',
        facultyId: 'FAC002',
        code: 'IT302'
      }
    ];

    // Store in maps
    [...students, ...faculty].forEach(user => this.users.set(user.id, user));
    subjects.forEach(subject => this.subjects.set(subject.id, subject));

    // Create some sample sessions and attendance
    this.createSampleSessions();
  }

  private createSampleSessions() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Sample sessions
    const sessions: Session[] = [
      {
        id: 'SUB001:' + yesterday.getTime(),
        subjectId: 'SUB001',
        facultyId: 'FAC001',
        date: yesterday.toISOString().split('T')[0],
        inGenerationTs: yesterday.toISOString(),
        outGenerationTs: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      },
      {
        id: 'SUB002:' + now.getTime(),
        subjectId: 'SUB002',
        facultyId: 'FAC001',
        date: now.toISOString().split('T')[0],
        inGenerationTs: now.toISOString(),
        status: 'active'
      }
    ];

    sessions.forEach(session => this.sessions.set(session.id, session));

    // Sample attendance records
    const attendanceRecords: AttendanceRecord[] = [
      {
        id: 'STU001:SUB001:' + yesterday.getTime(),
        sessionId: 'SUB001:' + yesterday.getTime(),
        studentId: 'STU001',
        subjectId: 'SUB001',
        inScanTs: yesterday.toISOString(),
        outScanTs: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        inScanLocation: { lat: 22.3039, lng: 73.3620 },
        outScanLocation: { lat: 22.3039, lng: 73.3620 }
      },
      {
        id: 'STU002:SUB001:' + yesterday.getTime(),
        sessionId: 'SUB001:' + yesterday.getTime(),
        studentId: 'STU002',
        subjectId: 'SUB001',
        inScanTs: yesterday.toISOString(),
        inScanLocation: { lat: 22.3039, lng: 73.3620 }
        // Missing out scan - incomplete attendance
      }
    ];

    attendanceRecords.forEach(record => this.attendance.set(record.id, record));
  }

  // API methods
  async login(id: string, password: string) {
    const user = this.users.get(id);
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = 'mock-jwt-token-' + Date.now();
    
    return { token, user: userWithoutPassword };
  }

  async getStudentProfile(studentId: string) {
    const student = this.users.get(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    // Calculate attendance for each subject
    const subjectAttendance = Array.from(this.subjects.values()).map(subject => {
      const subjectSessions = Array.from(this.sessions.values())
        .filter(session => session.subjectId === subject.id);
      
      const studentAttendanceRecords = Array.from(this.attendance.values())
        .filter(record => record.studentId === studentId && record.subjectId === subject.id);
      
      const totalSessions = subjectSessions.length;
      const attendedSessions = studentAttendanceRecords
        .filter(record => record.inScanTs && record.outScanTs).length;
      
      const percentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      return {
        subject: subject.name,
        code: subject.code,
        totalSessions,
        attendedSessions,
        percentage,
        recentAttendance: studentAttendanceRecords.slice(-5).reverse()
      };
    });

    const { password: _, ...profile } = student;
    
    return {
      profile,
      attendance: subjectAttendance
    };
  }

  async getFacultyDashboard(facultyId: string) {
    const faculty = this.users.get(facultyId);
    if (!faculty || faculty.role !== 'faculty') {
      throw new Error('Faculty not found');
    }

    const facultySubjects = Array.from(this.subjects.values())
      .filter(subject => subject.facultyId === facultyId);
    
    const recentSessions = Array.from(this.sessions.values())
      .filter(session => session.facultyId === facultyId)
      .sort((a, b) => new Date(b.inGenerationTs || 0).getTime() - new Date(a.inGenerationTs || 0).getTime())
      .slice(0, 10);

    const { password: _, ...profile } = faculty;

    return {
      profile,
      subjects: facultySubjects,
      recentSessions
    };
  }

  async createSession(facultyId: string, subjectId: string, date: string, startTime?: string) {
    const sessionId = `${subjectId}:${Date.now()}`;
    const inGenerationTs = startTime || new Date().toISOString();
    
    const session: Session = {
      id: sessionId,
      subjectId,
      facultyId,
      date,
      inGenerationTs,
      status: 'active'
    };

    this.sessions.set(sessionId, session);

    // Generate mock QR data
    const qrPayload = {
      sessionId,
      scanType: 'IN',
      timestamp: Date.now(),
      expiry: Date.now() + (30 * 60 * 1000)
    };
    
    const qrToken = JSON.stringify(qrPayload);
    const signature = 'mock-signature-' + Date.now();

    return {
      sessionId,
      inQrData: `${qrToken}:${signature}`
    };
  }

  async generateOutQR(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const qrPayload = {
      sessionId,
      scanType: 'OUT',
      timestamp: Date.now(),
      expiry: Date.now() + (30 * 60 * 1000)
    };
    
    const qrToken = JSON.stringify(qrPayload);
    const signature = 'mock-signature-' + Date.now();

    session.outGenerationTs = new Date().toISOString();
    this.sessions.set(sessionId, session);

    return {
      outQrData: `${qrToken}:${signature}`
    };
  }

  async scanAttendance(studentId: string, qrData: string, lat: number, lng: number) {
    // Verify campus location (Parul University)
    const campusLat = 22.3039;
    const campusLng = 73.3620;
    const maxDistance = 2000; // 2km

    const distance = this.calculateDistance(lat, lng, campusLat, campusLng);
    if (distance > maxDistance) {
      throw new Error('Scan location is outside campus boundary');
    }

    // Parse QR data
    const [token, signature] = qrData.split(':');
    let qrPayload;
    
    try {
      qrPayload = JSON.parse(token);
    } catch {
      throw new Error('Invalid QR code format');
    }

    if (qrPayload.expiry < Date.now()) {
      throw new Error('QR code has expired');
    }

    const { sessionId, scanType } = qrPayload;
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Get or create attendance record
    const attendanceKey = `${studentId}:${sessionId}`;
    let attendance = this.attendance.get(attendanceKey) || {
      id: attendanceKey,
      sessionId,
      studentId,
      subjectId: session.subjectId
    };

    const timestamp = new Date().toISOString();
    const location = { lat, lng };

    if (scanType === 'IN') {
      attendance.inScanTs = timestamp;
      attendance.inScanLocation = location;
    } else {
      attendance.outScanTs = timestamp;
      attendance.outScanLocation = location;
    }

    this.attendance.set(attendanceKey, attendance);

    return {
      success: true,
      message: `${scanType} scan recorded successfully`,
      attendance
    };
  }

  async getSubjects(facultyId?: string) {
    let subjects = Array.from(this.subjects.values());
    
    if (facultyId) {
      subjects = subjects.filter(subject => subject.facultyId === facultyId);
    }

    return { subjects };
  }

  async getSessionAttendance(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const sessionAttendance = Array.from(this.attendance.values())
      .filter(record => record.sessionId === sessionId);

    // Enhance with student details
    const attendanceWithStudents = sessionAttendance.map(record => {
      const student = this.users.get(record.studentId);
      return {
        ...record,
        studentName: student?.name || 'Unknown',
        rollNo: (student as any)?.rollNo || 'Unknown',
        isComplete: !!(record.inScanTs && record.outScanTs)
      };
    });

    return {
      session,
      attendance: attendanceWithStudents,
      totalScans: sessionAttendance.length,
      completeAttendance: sessionAttendance.filter(r => r.inScanTs && r.outScanTs).length
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

// Create singleton instance
const mockDB = new MockDatabase();

// Mock API functions that simulate the original backend
export const mockAPI = {
  async login(id: string, password: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockDB.login(id, password);
  },

  async getStudentProfile(studentId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDB.getStudentProfile(studentId);
  },

  async getFacultyDashboard(facultyId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDB.getFacultyDashboard(facultyId);
  },

  async createSession(facultyId: string, data: { subjectId: string; date: string; startTime?: string }) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockDB.createSession(facultyId, data.subjectId, data.date, data.startTime);
  },

  async generateOutQR(sessionId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDB.generateOutQR(sessionId);
  },

  async scanAttendance(data: { qrData: string; lat: number; lng: number }, studentId: string) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return mockDB.scanAttendance(studentId, data.qrData, data.lat, data.lng);
  },

  async getSubjects(facultyId?: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockDB.getSubjects(facultyId);
  },

  async getSessionAttendance(sessionId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDB.getSessionAttendance(sessionId);
  }
};