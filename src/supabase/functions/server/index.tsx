import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js'
import { sign, verify } from 'npm:hono/jwt'
import bcrypt from 'npm:bcryptjs'
import crypto from 'node:crypto'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE'],
}))

app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const JWT_SECRET = 'university-attendance-secret-key'

// Parul University, Waghodia, Vadodara coordinates
const CAMPUS_BOUNDARY = {
  lat: 22.3039,
  lng: 73.3620,
  radius: 2000 // 2km radius in meters
}

// Helper functions
const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12)
}

const verifyPassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash)
}

const generateQRToken = (sessionId: string, scanType: 'IN' | 'OUT') => {
  const payload = {
    sessionId,
    scanType,
    timestamp: Date.now(),
    expiry: Date.now() + (30 * 60 * 1000) // 30 minutes
  }
  const token = JSON.stringify(payload)
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(token).digest('hex')
  return { token, signature }
}

const verifyQRToken = (token: string, signature: string) => {
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(token).digest('hex')
  if (signature !== expectedSignature) return false
  
  try {
    const payload = JSON.parse(token)
    return payload.expiry > Date.now() ? payload : false
  } catch {
    return false
  }
}

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180
  const φ2 = lat2 * Math.PI/180
  const Δφ = (lat2-lat1) * Math.PI/180
  const Δλ = (lng2-lng1) * Math.PI/180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

const isWithinCampus = (lat: number, lng: number) => {
  const distance = calculateDistance(lat, lng, CAMPUS_BOUNDARY.lat, CAMPUS_BOUNDARY.lng)
  return distance <= CAMPUS_BOUNDARY.radius
}

// Auth middleware
const requireAuth = async (c: any, next: any) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }

    const decoded = await verify(token, JWT_SECRET)
    c.set('user', decoded)
    await next()
  } catch (error) {
    console.log('Auth error:', error)
    return c.json({ error: 'Invalid token' }, 401)
  }
}

// Initialize default data
const initializeData = async () => {
  try {
    // Check if data already exists
    const existingStudents = await kv.get('students:initialized')
    if (existingStudents) return

    // Create sample students
    const students = [
      {
        id: 'STU001',
        name: 'Arjun Patel',
        phone: '+91 9876543210',
        rollNo: 'CS21001',
        enrollmentNo: 'EN2021CS001',
        course: 'Computer Science Engineering',
        password: await hashPassword('student123'),
        role: 'student'
      },
      {
        id: 'STU002',
        name: 'Priya Sharma',
        phone: '+91 9876543211',
        rollNo: 'CS21002',
        enrollmentNo: 'EN2021CS002',
        course: 'Computer Science Engineering',
        password: await hashPassword('student123'),
        role: 'student'
      }
    ]

    // Create sample faculty
    const faculty = [
      {
        id: 'FAC001',
        name: 'Dr. Rajesh Kumar',
        phone: '+91 9876543220',
        department: 'Computer Science',
        password: await hashPassword('faculty123'),
        role: 'faculty'
      },
      {
        id: 'FAC002',
        name: 'Prof. Meera Joshi',
        phone: '+91 9876543221',
        department: 'Information Technology',
        password: await hashPassword('faculty123'),
        role: 'faculty'
      }
    ]

    // Create sample subjects
    const subjects = [
      {
        id: 'SUB001',
        name: 'Data Structures',
        facultyId: 'FAC001',
        code: 'CS301'
      },
      {
        id: 'SUB002',
        name: 'Database Management',
        facultyId: 'FAC001',
        code: 'CS302'
      },
      {
        id: 'SUB003',
        name: 'Web Development',
        facultyId: 'FAC002',
        code: 'IT301'
      }
    ]

    // Store data
    for (const student of students) {
      await kv.set(`student:${student.id}`, student)
    }
    
    for (const fac of faculty) {
      await kv.set(`faculty:${fac.id}`, fac)
    }
    
    for (const subject of subjects) {
      await kv.set(`subject:${subject.id}`, subject)
    }

    await kv.set('students:initialized', 'true')
    console.log('Sample data initialized')
  } catch (error) {
    console.log('Error initializing data:', error)
  }
}

// Initialize data on startup
await initializeData()

// Routes
app.post('/make-server-adf12d42/auth/login', async (c) => {
  try {
    const { id, password } = await c.req.json()
    
    // Try student login first
    let user = await kv.get(`student:${id}`)
    if (!user) {
      // Try faculty login
      user = await kv.get(`faculty:${id}`)
    }
    
    if (!user || !await verifyPassword(password, user.password)) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    const token = await sign({ id: user.id, role: user.role }, JWT_SECRET)
    const { password: _, ...userWithoutPassword } = user
    
    return c.json({ token, user: userWithoutPassword })
  } catch (error) {
    console.log('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

app.get('/make-server-adf12d42/student/:id/profile', requireAuth, async (c) => {
  try {
    const studentId = c.req.param('id')
    const currentUser = c.get('user')
    
    if (currentUser.role !== 'student' || currentUser.id !== studentId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    const student = await kv.get(`student:${studentId}`)
    if (!student) {
      return c.json({ error: 'Student not found' }, 404)
    }
    
    // Get all subjects
    const allSubjects = await kv.getByPrefix('subject:')
    
    // Get attendance for this student
    const attendanceRecords = await kv.getByPrefix(`attendance:${studentId}:`)
    
    // Calculate attendance percentages
    const subjectAttendance = {}
    for (const subject of allSubjects) {
      const subjectSessions = await kv.getByPrefix(`session:${subject.id}:`)
      const subjectAttendanceRecords = attendanceRecords.filter(record => 
        record.sessionId && record.sessionId.startsWith(subject.id)
      )
      
      const totalSessions = subjectSessions.length
      const attendedSessions = subjectAttendanceRecords.filter(record => 
        record.inScanTs && record.outScanTs
      ).length
      
      subjectAttendance[subject.id] = {
        subject: subject.name,
        code: subject.code,
        totalSessions,
        attendedSessions,
        percentage: totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0,
        recentAttendance: subjectAttendanceRecords.slice(-5).reverse()
      }
    }
    
    const { password: _, ...studentProfile } = student
    
    return c.json({ 
      profile: studentProfile,
      attendance: Object.values(subjectAttendance)
    })
  } catch (error) {
    console.log('Profile fetch error:', error)
    return c.json({ error: 'Failed to fetch profile' }, 500)
  }
})

app.post('/make-server-adf12d42/faculty/session', requireAuth, async (c) => {
  try {
    const currentUser = c.get('user')
    if (currentUser.role !== 'faculty') {
      return c.json({ error: 'Faculty access required' }, 403)
    }
    
    const { subjectId, date, startTime } = await c.req.json()
    
    const sessionId = `${subjectId}:${Date.now()}`
    const inQRData = generateQRToken(sessionId, 'IN')
    
    const session = {
      id: sessionId,
      subjectId,
      facultyId: currentUser.id,
      date,
      startTime: startTime || new Date().toISOString(),
      inGenerationTs: new Date().toISOString(),
      inQrToken: inQRData.token,
      inQrSignature: inQRData.signature,
      status: 'active'
    }
    
    await kv.set(`session:${sessionId}`, session)
    
    return c.json({ 
      sessionId,
      inQrData: `${inQRData.token}:${inQRData.signature}`
    })
  } catch (error) {
    console.log('Session creation error:', error)
    return c.json({ error: 'Failed to create session' }, 500)
  }
})

app.post('/make-server-adf12d42/faculty/session/:id/generate-out', requireAuth, async (c) => {
  try {
    const currentUser = c.get('user')
    if (currentUser.role !== 'faculty') {
      return c.json({ error: 'Faculty access required' }, 403)
    }
    
    const sessionId = c.req.param('id')
    const session = await kv.get(`session:${sessionId}`)
    
    if (!session || session.facultyId !== currentUser.id) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    const outQRData = generateQRToken(sessionId, 'OUT')
    
    session.outGenerationTs = new Date().toISOString()
    session.outQrToken = outQRData.token
    session.outQrSignature = outQRData.signature
    
    await kv.set(`session:${sessionId}`, session)
    
    return c.json({ 
      outQrData: `${outQRData.token}:${outQRData.signature}`
    })
  } catch (error) {
    console.log('OUT QR generation error:', error)
    return c.json({ error: 'Failed to generate OUT QR' }, 500)
  }
})

app.post('/make-server-adf12d42/attendance/scan', requireAuth, async (c) => {
  try {
    const currentUser = c.get('user')
    if (currentUser.role !== 'student') {
      return c.json({ error: 'Student access required' }, 403)
    }
    
    const { qrData, lat, lng } = await c.req.json()
    
    // Verify GPS location
    if (!isWithinCampus(lat, lng)) {
      return c.json({ error: 'Scan location is outside campus boundary' }, 400)
    }
    
    // Parse QR data
    const [token, signature] = qrData.split(':')
    const qrPayload = verifyQRToken(token, signature)
    
    if (!qrPayload) {
      return c.json({ error: 'Invalid or expired QR code' }, 400)
    }
    
    const { sessionId, scanType } = qrPayload
    const session = await kv.get(`session:${sessionId}`)
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    // Get or create attendance record
    const attendanceKey = `attendance:${currentUser.id}:${sessionId}`
    let attendance = await kv.get(attendanceKey) || {
      id: `${currentUser.id}:${sessionId}`,
      sessionId,
      studentId: currentUser.id,
      subjectId: session.subjectId
    }
    
    const timestamp = new Date().toISOString()
    const location = { lat, lng }
    
    if (scanType === 'IN') {
      attendance.inScanTs = timestamp
      attendance.inScanLocation = location
    } else {
      attendance.outScanTs = timestamp
      attendance.outScanLocation = location
    }
    
    await kv.set(attendanceKey, attendance)
    
    return c.json({ 
      success: true, 
      message: `${scanType} scan recorded successfully`,
      attendance
    })
  } catch (error) {
    console.log('Attendance scan error:', error)
    return c.json({ error: 'Failed to record attendance' }, 500)
  }
})

app.get('/make-server-adf12d42/faculty/:id/dashboard', requireAuth, async (c) => {
  try {
    const facultyId = c.req.param('id')
    const currentUser = c.get('user')
    
    if (currentUser.role !== 'faculty' || currentUser.id !== facultyId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    const faculty = await kv.get(`faculty:${facultyId}`)
    if (!faculty) {
      return c.json({ error: 'Faculty not found' }, 404)
    }
    
    // Get faculty's subjects
    const allSubjects = await kv.getByPrefix('subject:')
    const facultySubjects = allSubjects.filter(subject => subject.facultyId === facultyId)
    
    // Get recent sessions
    const recentSessions = await kv.getByPrefix('session:')
    const facultySessions = recentSessions
      .filter(session => session.facultyId === facultyId)
      .sort((a, b) => new Date(b.inGenerationTs || 0).getTime() - new Date(a.inGenerationTs || 0).getTime())
      .slice(0, 10)
    
    const { password: _, ...facultyProfile } = faculty
    
    return c.json({
      profile: facultyProfile,
      subjects: facultySubjects,
      recentSessions: facultySessions
    })
  } catch (error) {
    console.log('Faculty dashboard error:', error)
    return c.json({ error: 'Failed to fetch dashboard' }, 500)
  }
})

app.get('/make-server-adf12d42/session/:id/attendance', requireAuth, async (c) => {
  try {
    const sessionId = c.req.param('id')
    const currentUser = c.get('user')
    
    const session = await kv.get(`session:${sessionId}`)
    if (!session) {
      return c.json({ error: 'Session not found' }, 404)
    }
    
    if (currentUser.role === 'faculty' && session.facultyId !== currentUser.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Get all attendance records for this session
    const allAttendance = await kv.getByPrefix('attendance:')
    const sessionAttendance = allAttendance.filter(record => record.sessionId === sessionId)
    
    // Enhance with student details
    const attendanceWithStudents = []
    for (const record of sessionAttendance) {
      const student = await kv.get(`student:${record.studentId}`)
      if (student) {
        attendanceWithStudents.push({
          ...record,
          studentName: student.name,
          rollNo: student.rollNo,
          isComplete: !!(record.inScanTs && record.outScanTs)
        })
      }
    }
    
    return c.json({
      session,
      attendance: attendanceWithStudents,
      totalScans: sessionAttendance.length,
      completeAttendance: sessionAttendance.filter(r => r.inScanTs && r.outScanTs).length
    })
  } catch (error) {
    console.log('Session attendance error:', error)
    return c.json({ error: 'Failed to fetch attendance' }, 500)
  }
})

// Get all subjects (for dropdowns)
app.get('/make-server-adf12d42/subjects', requireAuth, async (c) => {
  try {
    const currentUser = c.get('user')
    
    if (currentUser.role === 'faculty') {
      const allSubjects = await kv.getByPrefix('subject:')
      const facultySubjects = allSubjects.filter(subject => subject.facultyId === currentUser.id)
      return c.json({ subjects: facultySubjects })
    } else {
      const allSubjects = await kv.getByPrefix('subject:')
      return c.json({ subjects: allSubjects })
    }
  } catch (error) {
    console.log('Subjects fetch error:', error)
    return c.json({ error: 'Failed to fetch subjects' }, 500)
  }
})

export default app

Deno.serve(app.fetch)