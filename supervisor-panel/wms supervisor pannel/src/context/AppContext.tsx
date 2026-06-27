import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

// --- TypeScript Interfaces ---

export interface User {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  mobile: string;
  role: 'Supervisor' | 'Admin' | 'Skilled Worker' | 'Technician' | 'Operator';
  department: string;
  status: 'Active' | 'Working' | 'Idle' | 'Away' | 'Inactive';
  productivity: number;
  reworkCount: number;
  hoursWorked: number;
  approvalRate: number;
  activitiesCount: number;
  joinedDate: string;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerName: string;
  projectName: string;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  isActive: boolean;
  description: string;
  progress: number;
}

export interface TimelineEvent {
  user: string;
  timestamp: string;
  action: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Rework Assigned' | 'Rework Completed';
  remarks?: string;
}

export interface ActivityLog {
  id: string;
  userId: string; // Employee ID
  workerName: string;
  soNumber: string;
  department: string;
  activity: string;
  durationMinutes: number;
  standardManMinutes: number;
  startTime: string;
  endTime: string;
  activityDate: string;
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Rework';
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
  reworkReason?: string;
  expectedCorrection?: string;
  reworkPriority?: 'Low' | 'Medium' | 'High';
  reworkDueDate?: string;
  coworkers?: string[];
  attachments?: { name: string; type: 'Photo' | 'Document'; url: string }[];
  timeline: TimelineEvent[];
}

export interface Department {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  description: string;
  activities: { name: string; standardMinutes: number }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'New Submission' | 'High Priority Rework' | 'Pending Alert' | 'Threshold Delay' | 'System';
  priority: 'Low' | 'Medium' | 'High';
  status: 'Unread' | 'Read' | 'Archived';
  timestamp: string;
}

export interface SupervisorProfile {
  name: string;
  supervisorId: string;
  email: string;
  mobile: string;
  lastLogin: string;
  avatarUrl?: string;
}

interface AppContextType {
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  isAuthenticated: boolean;
  user: SupervisorProfile | null;
  login: (supervisorId: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (fields: Partial<SupervisorProfile>) => void;
  changePassword: (oldPass: string, newPass: string) => Promise<boolean>;

  // Data Lists
  users: User[];
  salesOrders: SalesOrder[];
  departments: Department[];
  activityLogs: ActivityLog[];
  notifications: Notification[];

  // Supervisor Actions
  checkoutActivityForReview: (id: string, supervisorName: string) => void;
  releaseActivityFromReview: (id: string) => void;
  approveActivity: (id: string, remarks?: string) => void;
  rejectActivity: (id: string, reason: string) => void;
  assignRework: (id: string, fields: { reason: string; expectedCorrection: string; priority: 'Low' | 'Medium' | 'High'; dueDate: string }) => void;
  bulkVerifyActivities: (ids: string[], action: 'Approve' | 'Reject', remarksOrReason: string) => void;

  // Notification Operations
  markNotificationRead: (id: string) => void;
  archiveNotification: (id: string) => void;
  markAllNotificationsRead: () => void;

  // KPI Calculations
  dashboardKPIs: {
    pendingVerification: number;
    underReview: number;
    approvedToday: number;
    rejectedToday: number;
    reworkAssignedToday: number;
    activeWorkers: number;
    idleWorkers: number;
    averageProductivity: number;
    overdueActivities: number;
    approvedByMe: number;
    rejectedByMe: number;
    reworksAssignedByMe: number;
    averageReviewTime: number; // in mins
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Mock Data Generators ---

const generateMockUsers = (): User[] => {
  const departments = ['Coil Assembly', 'Welding', 'Painting & Coating', 'Quality Control', 'Testing', 'Logistics', 'Maintenance', 'Final Assembly', 'Core Stacking', 'Insulation'];
  const roles = ['Skilled Worker', 'Technician', 'Operator'] as const;
  const statuses = ['Working', 'Idle', 'Away', 'Active'] as const;
  const firstNames = ['Amit', 'Rahul', 'Sanjay', 'Vikram', 'Rajesh', 'Anil', 'Deepak', 'Vijay', 'Sunil', 'Karan', 'Manoj', 'Arjun', 'Suresh', 'Ramesh', 'Harish', 'Nitin', 'Alok', 'Pankaj', 'Abhishek', 'Gaurav', 'Ravi', 'Sandip', 'Vivek', 'Yogesh', 'Pradeep', 'Ajay', 'Ashok', 'Dinesh', 'Vinay', 'Kishore'];
  const lastNames = ['Verma', 'Sharma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Joshi', 'Mehra', 'Yadav', 'Rao', 'Reddy', 'Nair', 'Mishra', 'Trivedi', 'Pandey', 'Deshmukh', 'Choudhury', 'Sen', 'Das', 'Roy', 'Saxena', 'Bose', 'Chatterjee', 'Dutta', 'Banerjee', 'Kapoor', 'Malhotra', 'Sari', 'Grover', 'Bahl'];

  const generated: User[] = [];
  
  // Add a specific Supervisor User
  generated.push({
    id: 'USR-SUP01',
    employeeId: 'SUP-101',
    name: 'Amit Verma',
    email: 'amit.verma@workforce-management.com',
    mobile: '9876543215',
    role: 'Supervisor',
    department: 'Quality Control',
    status: 'Active',
    productivity: 95,
    reworkCount: 2,
    hoursWorked: 168,
    approvalRate: 98.4,
    activitiesCount: 245,
    joinedDate: '2025-01-10',
  });

  // Generate 1000+ employees
  for (let i = 1; i <= 1015; i++) {
    const fn = firstNames[i % firstNames.length]!;
    const ln = lastNames[Math.floor(i / firstNames.length) % lastNames.length]!;
    const dept = departments[i % departments.length]!;
    const role = roles[i % roles.length]!;
    const status = statuses[i % statuses.length]!;
    const employeeId = `EMP-${String(i).padStart(4, '0')}`;
    const productivity = 70 + (i % 26); // 70% to 95%
    const reworkCount = i % 8 === 0 ? 3 : (i % 15 === 0 ? 5 : i % 3);
    const hoursWorked = 120 + (i % 60);
    const activitiesCount = 140 + (i % 100);
    const approvalRate = 90 + (i % 10);
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@transformer-manufacturing.com`;
    const mobile = `98765${String(10000 + i).slice(-5)}`;

    generated.push({
      id: `USR-${i}`,
      employeeId,
      name: `${fn} ${ln}`,
      email,
      mobile,
      role,
      department: dept,
      status,
      productivity,
      reworkCount,
      hoursWorked,
      approvalRate,
      activitiesCount,
      joinedDate: `2025-${String((i % 12) + 1).padStart(2, '0')}-15`,
    });
  }

  return generated;
};

const generateMockSalesOrders = (): SalesOrder[] => {
  const customers = ['Global Power Grid', 'National Electricity Board', 'Heavy Electrics Corp', 'WindGrid Solutions', 'HydroTech Gen', 'SolarDistribution Inc', 'MetroRail Power', 'Apex Utilities', 'SmartGrid Co', 'Infinite Energy'];
  const projects = ['Substation Transformer A', 'Step-down Units Block B', 'Generator Step-up (GSU) T1', 'Distribution Transformer Q2', 'Furnace Transformer Custom', 'Dry-type Auxiliary Unit', 'Rectifier Transformer R4', 'Auto-Transformer Substation', 'Wind Turbine Step-up', 'Phase Shifting Transformer'];
  
  const generated: SalesOrder[] = [];

  for (let i = 1; i <= 112; i++) {
    const cust = customers[i % customers.length]!;
    const proj = projects[i % projects.length]!;
    const soNumber = `SO-2026-${String(1000 + i)}`;
    const statusVal = i % 25 === 0 ? 'Delayed' : (i % 6 === 0 ? 'Completed' : (i % 10 === 0 ? 'Not Started' : 'In Progress'));
    const progressVal = statusVal === 'Completed' ? 100 : (statusVal === 'Not Started' ? 0 : 25 + (i % 65));
    const startVal = `2026-${String(((i % 5) + 1)).padStart(2, '0')}-01`;
    const endVal = `2026-${String(((i % 5) + 3)).padStart(2, '0')}-28`;

    generated.push({
      id: `SO-${i}`,
      soNumber,
      customerName: cust,
      projectName: `${proj} #${i}`,
      startDate: startVal,
      endDate: endVal,
      status: statusVal,
      isActive: statusVal !== 'Completed',
      description: `Production of heavy-duty core and copper windings for ${proj} to specification standards.`,
      progress: progressVal,
    });
  }

  return generated;
};

const generateMockDepartments = (): Department[] => {
  return [
    {
      id: 'DEP1',
      name: 'Coil Assembly',
      status: 'Active',
      description: 'Windings assembly and copper coils insulation wrap',
      activities: [
        { name: 'Core Insulation', standardMinutes: 45 },
        { name: 'HV Coil Winding', standardMinutes: 180 },
        { name: 'LV Coil Winding', standardMinutes: 120 },
        { name: 'Lead Assembly', standardMinutes: 60 }
      ]
    },
    {
      id: 'DEP2',
      name: 'Welding',
      status: 'Active',
      description: 'Tank assembly and structural welding',
      activities: [
        { name: 'TIG Welding tank joints', standardMinutes: 90 },
        { name: 'Radiator Flange Welding', standardMinutes: 75 },
        { name: 'Base Plate welding', standardMinutes: 120 }
      ]
    },
    {
      id: 'DEP3',
      name: 'Painting & Coating',
      status: 'Active',
      description: 'Corrosion resistance paint and blast coating',
      activities: [
        { name: 'Sandblasting Tank Surface', standardMinutes: 50 },
        { name: 'Primer Coating application', standardMinutes: 40 },
        { name: 'Epoxy Paint Spraying', standardMinutes: 60 }
      ]
    },
    {
      id: 'DEP4',
      name: 'Quality Control',
      status: 'Active',
      description: 'Visual safety audit and mechanical checklists',
      activities: [
        { name: 'Windings Visual Audit', standardMinutes: 30 },
        { name: 'Tank Weld Dye Penetrant Inspection', standardMinutes: 45 },
        { name: 'Core Stacking Dimension Check', standardMinutes: 20 }
      ]
    },
    {
      id: 'DEP5',
      name: 'Testing',
      status: 'Active',
      description: 'Electrical insulation and transformer load testing',
      activities: [
        { name: 'No-Load Loss Testing', standardMinutes: 40 },
        { name: 'Impulse Voltage Test', standardMinutes: 80 },
        { name: 'Temperature Rise Telemetry', standardMinutes: 150 },
        { name: 'Oil Dielectric Strength Test', standardMinutes: 30 }
      ]
    },
    {
      id: 'DEP6',
      name: 'Logistics',
      status: 'Active',
      description: 'Raw materials dispatch and heavy plant transport',
      activities: [
        { name: 'Copper Strip Offloading', standardMinutes: 25 },
        { name: 'Core Steel Laminations Dispatch', standardMinutes: 30 },
        { name: 'Crating Components', standardMinutes: 45 }
      ]
    },
    {
      id: 'DEP7',
      name: 'Maintenance',
      status: 'Active',
      description: 'Machine calibrations and plant breakdown repair',
      activities: [
        { name: 'Winding Machine Calibration', standardMinutes: 60 },
        { name: 'Overhead Crane Grease & Check', standardMinutes: 90 },
        { name: 'Oven Heating Elements Inspection', standardMinutes: 120 }
      ]
    },
    {
      id: 'DEP8',
      name: 'Final Assembly',
      status: 'Active',
      description: 'Active part assembly, core insertion into tank',
      activities: [
        { name: 'Core-Coil Assembly Insertion', standardMinutes: 240 },
        { name: 'Bushing Mounts Torqueing', standardMinutes: 90 },
        { name: 'Conservator Pipe connections', standardMinutes: 110 }
      ]
    },
    {
      id: 'DEP9',
      name: 'Core Stacking',
      status: 'Active',
      description: 'Silicon steel sheet stacking and clamping',
      activities: [
        { name: 'Yoke Stacking', standardMinutes: 120 },
        { name: 'Limb Stacking', standardMinutes: 180 },
        { name: 'Core Clamping bolt torque', standardMinutes: 70 }
      ]
    },
    {
      id: 'DEP10',
      name: 'Insulation',
      status: 'Active',
      description: 'Pressboard and insulation paper cuttings',
      activities: [
        { name: 'Pressboard cylinder preparation', standardMinutes: 45 },
        { name: 'Spacer block cutting & glue', standardMinutes: 35 }
      ]
    }
  ];
};

const generateMockActivityLogs = (users: User[], salesOrders: SalesOrder[], depts: Department[]): ActivityLog[] => {
  const generated: ActivityLog[] = [];
  const logCount = 8200; // Generate a massive dataset of logs over the last 30 days
  
  const statusPool: ('Approved' | 'Rejected' | 'Rework' | 'Pending')[] = ['Approved', 'Approved', 'Approved', 'Approved', 'Approved', 'Approved', 'Approved', 'Rejected', 'Rework'];
  const priorities: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
  
  // Coworkers pool
  const coworkersNames = ['John Operator', 'Alice Assembly', 'Robert Builder', 'Wendy Worker', 'Tony Tech', 'Quinn Quality', 'Victor Vendor', 'Larry Logistics'];
  
  const now = new Date();
  
  // 1. Create a core set of PENDING and UNDER REVIEW logs for today to populate the verification queue
  for (let i = 1; i <= 155; i++) {
    const worker = users[i % users.length]!;
    if (worker.role === 'Supervisor') continue;
    const so = salesOrders[i % salesOrders.length]!;
    const dept = depts[i % depts.length]!;
    const act = dept.activities[i % dept.activities.length]!;
    
    // Duration deviations (realistic durations)
    const deviation = -5 + (i % 16); // -5 to +10 mins deviation
    const duration = Math.max(10, act.standardMinutes + deviation);
    
    const submittedHoursAgo = i % 18;
    const logDate = new Date(now.getTime() - submittedHoursAgo * 60 * 60 * 1000);
    const startStr = new Date(logDate.getTime() - duration * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const endStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Status distribution
    const isUnderReview = i % 7 === 0;
    const status: 'Pending' | 'Under Review' = isUnderReview ? 'Under Review' : 'Pending';
    const isOverdue = submittedHoursAgo > 4; // Submitted more than 4 hours ago is overdue in our plant rules
    
    const timeline: TimelineEvent[] = [
      {
        user: worker.name,
        timestamp: new Date(logDate.getTime() - duration * 60 * 1000).toISOString(),
        action: 'Submitted',
        remarks: 'WMS submit: work complete.',
      }
    ];

    if (isUnderReview) {
      timeline.push({
        user: 'Amit Verma',
        timestamp: new Date(logDate.getTime() - 5 * 60 * 1000).toISOString(),
        action: 'Under Review',
        remarks: 'Inspecting measurements and times.',
      });
    }

    generated.push({
      id: `LOG-PEND-${i}`,
      userId: worker.employeeId,
      workerName: worker.name,
      soNumber: so.soNumber,
      department: dept.name,
      activity: act.name,
      durationMinutes: duration,
      standardManMinutes: act.standardMinutes,
      startTime: startStr,
      endTime: endStr,
      activityDate: logDate.toISOString().split('T')[0]!,
      status,
      reviewedBy: isUnderReview ? 'Amit Verma' : undefined,
      reviewedAt: isUnderReview ? new Date(logDate.getTime() - 5 * 60 * 1000).toISOString() : undefined,
      remarks: i % 3 === 0 ? 'Minor alignment adjustments made.' : 'Standard process completed.',
      timeline,
      coworkers: i % 4 === 0 ? [coworkersNames[i % coworkersNames.length]!, coworkersNames[(i + 1) % coworkersNames.length]!] : undefined,
      attachments: i % 2 === 0 ? [
        { name: 'transformer_coil.jpg', type: 'Photo', url: '#' },
        { name: 'winding_sheet.pdf', type: 'Document', url: '#' }
      ] : undefined
    });
  }

  // 2. Generate historical approved, rejected, and rework logs (past 30 days)
  for (let i = 1; i <= logCount; i++) {
    const worker = users[(i + 150) % users.length]!;
    if (worker.role === 'Supervisor') continue;
    const so = salesOrders[(i + 40) % salesOrders.length]!;
    const dept = depts[i % depts.length]!;
    const act = dept.activities[i % dept.activities.length]!;
    
    const deviation = -10 + (i % 25);
    const duration = Math.max(15, act.standardMinutes + deviation);
    
    // Days spread: 1 to 30 days ago
    const daysAgo = 1 + (i % 29);
    const logDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - (i % 24) * 60 * 60 * 1000);
    const startStr = new Date(logDate.getTime() - duration * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const endStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const status = statusPool[i % statusPool.length]!;
    const supervisorNames = ['Sam Supervisor', 'Alice Inspector', 'Dave Lead'];
    const supervisor = supervisorNames[i % supervisorNames.length]!;
    
    const timeline: TimelineEvent[] = [
      {
        user: worker.name,
        timestamp: new Date(logDate.getTime() - duration * 60 * 1000).toISOString(),
        action: 'Submitted',
        remarks: 'WMS log submit.'
      }
    ];

    let reworkReason: string | undefined;
    let expectedCorrection: string | undefined;
    let reworkPriority: 'Low' | 'Medium' | 'High' | undefined;
    let reworkDueDate: string | undefined;

    if (status === 'Approved') {
      timeline.push({
        user: supervisor,
        timestamp: logDate.toISOString(),
        action: 'Approved',
        remarks: i % 6 === 0 ? 'Verified - excellent efficiency.' : 'Approved.',
      });
    } else if (status === 'Rejected') {
      timeline.push({
        user: supervisor,
        timestamp: logDate.toISOString(),
        action: 'Rejected',
        remarks: 'Duration logged exceeds standard time by more than 50% without valid explanation.',
      });
    } else if (status === 'Rework') {
      reworkReason = 'Insulation wrapping has gaps in bottom section.';
      expectedCorrection = 'Rewrap insulating paper around bottom terminals and check dielectric seal.';
      reworkPriority = priorities[i % priorities.length]!;
      reworkDueDate = new Date(logDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
      
      timeline.push({
        user: supervisor,
        timestamp: logDate.toISOString(),
        action: 'Rework Assigned',
        remarks: reworkReason,
      });

      // Simulate a completed rework event for half of the rework cases
      if (i % 2 === 0) {
        timeline.push({
          user: worker.name,
          timestamp: new Date(logDate.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          action: 'Rework Completed',
          remarks: 'Insulation rewrapped and tested. Looks good.',
        });
      }
    }

    generated.push({
      id: `LOG-HIST-${i}`,
      userId: worker.employeeId,
      workerName: worker.name,
      soNumber: so.soNumber,
      department: dept.name,
      activity: act.name,
      durationMinutes: duration,
      standardManMinutes: act.standardMinutes,
      startTime: startStr,
      endTime: endStr,
      activityDate: logDate.toISOString().split('T')[0]!,
      status,
      reviewedBy: supervisor,
      reviewedAt: logDate.toISOString(),
      remarks: i % 4 === 0 ? 'Inspected. Standards met.' : undefined,
      reworkReason,
      expectedCorrection,
      reworkPriority,
      reworkDueDate,
      timeline,
      coworkers: i % 8 === 0 ? [coworkersNames[i % coworkersNames.length]!] : undefined,
    });
  }

  return generated;
};

const generateMockNotifications = (): Notification[] => {
  const now = new Date();
  return [
    {
      id: 'NOT-1',
      title: 'New Coil Winding Activity Submitted',
      message: 'Worker John Operator (EMP-0102) has logged 120 minutes on LV Coil Winding (SO-2026-1001).',
      type: 'New Submission',
      priority: 'Low',
      status: 'Unread',
      timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: 'NOT-2',
      title: 'CRITICAL: High Priority Rework Re-submitted',
      message: 'Welder Robert Builder (EMP-0105) completed rework on SO-2026-1003 Flange Joints.',
      type: 'High Priority Rework',
      priority: 'High',
      status: 'Unread',
      timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'NOT-3',
      title: 'Queue Overdue Alert (4 Hours Threshold)',
      message: '12 activities in department "Coil Assembly" have been waiting for verification for more than 4 hours.',
      type: 'Pending Alert',
      priority: 'Medium',
      status: 'Unread',
      timestamp: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'NOT-4',
      title: 'Efficiency Degradation Warning',
      message: 'Department "Welding" average productivity dropped to 72% for the afternoon shift.',
      type: 'System',
      priority: 'Medium',
      status: 'Read',
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'NOT-5',
      title: 'Rework Rate Alert',
      message: 'Weekly rework rate has exceeded 6.5% for final assembly line.',
      type: 'System',
      priority: 'High',
      status: 'Read',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];
};

// --- Context Provider Implementation ---

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem('supThemeMode');
    return (stored as 'light' | 'dark') || 'light';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('supIsAuth') === 'true';
  });

  const [user, setUser] = useState<SupervisorProfile | null>(() => {
    const stored = localStorage.getItem('supUser');
    return stored ? JSON.parse(stored) : null;
  });

  // Master Databases (instantiated once and cached in state memory)
  const [users, setUsers] = useState<User[]>(() => generateMockUsers());
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => generateMockSalesOrders());
  const [departments, setDepartments] = useState<Department[]>(() => generateMockDepartments());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const u = generateMockUsers();
    const so = generateMockSalesOrders();
    const d = generateMockDepartments();
    return generateMockActivityLogs(u, so, d);
  });
  const [notifications, setNotifications] = useState<Notification[]>(() => generateMockNotifications());

  const syncStateToStorage = (key: string, data: any) => {
    // No-op to avoid QuotaExceededError with massive datasets in localStorage
  };

  const toggleTheme = () => {
    setThemeMode(prev => {
      const mode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('supThemeMode', mode);
      return mode;
    });
  };

  const login = async (supervisorId: string, password?: string): Promise<boolean> => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: supervisorId, password: password || '' }),
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns: { accessToken, employeeId, firstName, lastName, role }
        const { accessToken, employeeId, firstName, lastName } = data;

        const activeSup: SupervisorProfile = {
          name: `${firstName} ${lastName}`.trim(),
          supervisorId: employeeId,
          email: '',
          mobile: '',
          lastLogin: new Date().toLocaleString(),
        };

        localStorage.setItem('supAccessToken', accessToken);
        localStorage.setItem('supIsAuth', 'true');
        localStorage.setItem('supUser', JSON.stringify(activeSup));
        setUser(activeSup);
        setIsAuthenticated(true);
        return true;
      }
    } catch (err) {
      console.warn('Backend login failed, using dev fallback:', err);
    }

    // Dev fallback: accept any supervisorId for local development
    if (supervisorId.toLowerCase() === 'supervisor' || supervisorId.startsWith('SUP') || supervisorId.startsWith('EMP')) {
      const activeSup: SupervisorProfile = {
        name: supervisorId,
        supervisorId,
        email: '',
        mobile: '',
        lastLogin: new Date().toLocaleString(),
      };
      localStorage.setItem('supIsAuth', 'true');
      localStorage.setItem('supUser', JSON.stringify(activeSup));
      setUser(activeSup);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };


  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('supIsAuth');
    localStorage.removeItem('supUser');
  };

  const updateProfile = (fields: Partial<SupervisorProfile>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...fields };
      localStorage.setItem('supUser', JSON.stringify(updated));
      return updated;
    });
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    // Simulated successful update
    return new Promise(resolve => setTimeout(() => resolve(true), 600));
  };

  // --- Supervisor Actions ---

  // Locking mechanism: Open review sets 'Under Review' status
  const checkoutActivityForReview = (id: string, supervisorName: string) => {
    setActivityLogs(prev => {
      const updated = prev.map(log => {
        if (log.id === id && log.status === 'Pending') {
          const updatedTimeline = [
            ...log.timeline,
            {
              user: supervisorName,
              timestamp: new Date().toISOString(),
              action: 'Under Review' as const,
              remarks: 'Supervisor check-out started.'
            }
          ];
          return {
            ...log,
            status: 'Under Review' as const,
            reviewedBy: supervisorName,
            reviewedAt: new Date().toISOString(),
            timeline: updatedTimeline
          };
        }
        return log;
      });
      syncStateToStorage('supActivityLogs', updated);
      return updated;
    });
  };

  // Unlock logic: Release back to Pending
  const releaseActivityFromReview = (id: string) => {
    setActivityLogs(prev => {
      const updated = prev.map(log => {
        if (log.id === id && log.status === 'Under Review') {
          // Remove the last timeline 'Under Review' event
          const updatedTimeline = log.timeline.filter(e => e.action !== 'Under Review');
          return {
            ...log,
            status: 'Pending' as const,
            reviewedBy: undefined,
            reviewedAt: undefined,
            timeline: updatedTimeline
          };
        }
        return log;
      });
      syncStateToStorage('supActivityLogs', updated);
      return updated;
    });
  };

  // Permanently Approve
  const approveActivity = (id: string, remarks?: string) => {
    setActivityLogs(prev => {
      const updated = prev.map(log => {
        if (log.id === id && (log.status === 'Pending' || log.status === 'Under Review')) {
          const updatedTimeline = [
            ...log.timeline.filter(e => e.action !== 'Under Review'),
            {
              user: user?.name || 'Amit Verma',
              timestamp: new Date().toISOString(),
              action: 'Approved' as const,
              remarks: remarks || 'Work accepted and verified.'
            }
          ];
          
          // Trigger employee productivity update
          updateEmployeeKPIs(log.userId, 'Approved', log.standardManMinutes, log.durationMinutes);

          return {
            ...log,
            status: 'Approved' as const,
            reviewedBy: user?.name || 'Amit Verma',
            reviewedAt: new Date().toISOString(),
            remarks: remarks || undefined,
            timeline: updatedTimeline
          };
        }
        return log;
      });
      syncStateToStorage('supActivityLogs', updated);
      return updated;
    });

    addNotification(
      'New Submission', 
      `Activity ${id} approved by ${user?.name || 'Amit Verma'}.`,
      'Low'
    );
  };

  // Permanently Reject
  const rejectActivity = (id: string, reason: string) => {
    setActivityLogs(prev => {
      const updated = prev.map(log => {
        if (log.id === id && (log.status === 'Pending' || log.status === 'Under Review')) {
          const updatedTimeline = [
            ...log.timeline.filter(e => e.action !== 'Under Review'),
            {
              user: user?.name || 'Amit Verma',
              timestamp: new Date().toISOString(),
              action: 'Rejected' as const,
              remarks: reason
            }
          ];
          
          updateEmployeeKPIs(log.userId, 'Rejected', log.standardManMinutes, log.durationMinutes);

          return {
            ...log,
            status: 'Rejected' as const,
            reviewedBy: user?.name || 'Amit Verma',
            reviewedAt: new Date().toISOString(),
            reworkReason: reason,
            timeline: updatedTimeline
          };
        }
        return log;
      });
      syncStateToStorage('supActivityLogs', updated);
      return updated;
    });
  };

  // Assign Rework
  const assignRework = (id: string, fields: { reason: string; expectedCorrection: string; priority: 'Low' | 'Medium' | 'High'; dueDate: string }) => {
    setActivityLogs(prev => {
      const updated = prev.map(log => {
        if (log.id === id && (log.status === 'Pending' || log.status === 'Under Review')) {
          const updatedTimeline = [
            ...log.timeline.filter(e => e.action !== 'Under Review'),
            {
              user: user?.name || 'Amit Verma',
              timestamp: new Date().toISOString(),
              action: 'Rework Assigned' as const,
              remarks: fields.reason
            }
          ];

          updateEmployeeKPIs(log.userId, 'Rework', log.standardManMinutes, log.durationMinutes);

          return {
            ...log,
            status: 'Rework' as const,
            reviewedBy: user?.name || 'Amit Verma',
            reviewedAt: new Date().toISOString(),
            reworkReason: fields.reason,
            expectedCorrection: fields.expectedCorrection,
            reworkPriority: fields.priority,
            reworkDueDate: fields.dueDate,
            timeline: updatedTimeline
          };
        }
        return log;
      });
      syncStateToStorage('supActivityLogs', updated);
      return updated;
    });

    if (fields.priority === 'High') {
      addNotification(
        'High Priority Rework',
        `High Priority Rework assigned for activity ${id}: ${fields.reason}`,
        'High'
      );
    }
  };

  // Bulk Verify
  const bulkVerifyActivities = (ids: string[], action: 'Approve' | 'Reject', remarksOrReason: string) => {
    setActivityLogs(prev => {
      const updated = prev.map(log => {
        if (ids.includes(log.id) && (log.status === 'Pending' || log.status === 'Under Review')) {
          const act = action === 'Approve' ? 'Approved' : 'Rejected';
          const updatedTimeline = [
            ...log.timeline.filter(e => e.action !== 'Under Review'),
            {
              user: user?.name || 'Amit Verma',
              timestamp: new Date().toISOString(),
              action: act as any,
              remarks: remarksOrReason
            }
          ];

          updateEmployeeKPIs(log.userId, act, log.standardManMinutes, log.durationMinutes);

          return {
            ...log,
            status: act as any,
            reviewedBy: user?.name || 'Amit Verma',
            reviewedAt: new Date().toISOString(),
            remarks: action === 'Approve' ? remarksOrReason : undefined,
            reworkReason: action === 'Reject' ? remarksOrReason : undefined,
            timeline: updatedTimeline
          };
        }
        return log;
      });
      syncStateToStorage('supActivityLogs', updated);
      return updated;
    });
  };

  // Helper to adjust live stats for workers in state
  const updateEmployeeKPIs = (employeeId: string, action: 'Approved' | 'Rejected' | 'Rework', stdMins: number, actualMins: number) => {
    setUsers(prev => {
      const updated = prev.map(w => {
        if (w.employeeId === employeeId) {
          const actCount = w.activitiesCount + 1;
          const newHours = w.hoursWorked + (actualMins / 60);
          
          let score = w.productivity;
          let rCount = w.reworkCount;
          let approvedCount = Math.round((w.approvalRate / 100) * w.activitiesCount);

          if (action === 'Approved') {
            approvedCount += 1;
            // Productivity calculation: standard time vs actual duration
            // Simulate gradual productivity score change
            const ratio = stdMins > 0 ? (stdMins / actualMins) * 100 : 100;
            score = Math.round((w.productivity * 9 + Math.min(150, ratio)) / 10);
          } else if (action === 'Rework') {
            rCount += 1;
            score = Math.max(50, w.productivity - 2); // rework penalizes score slightly
          } else if (action === 'Rejected') {
            score = Math.max(50, w.productivity - 5); // rejections penalize score
          }

          const approvalRate = Math.round((approvedCount / actCount) * 100);

          return {
            ...w,
            activitiesCount: actCount,
            hoursWorked: Math.round(newHours * 10) / 10,
            productivity: score,
            reworkCount: rCount,
            approvalRate: Math.min(100, Math.max(10, approvalRate))
          };
        }
        return w;
      });
      syncStateToStorage('supUsers', updated);
      return updated;
    });
  };

  // --- Notifications management ---

  const addNotification = (type: Notification['type'], message: string, priority: Notification['priority']) => {
    setNotifications(prev => {
      const newNotif: Notification = {
        id: `NOT-${Date.now()}`,
        title: type === 'New Submission' ? 'New Activity Submitted' : (type === 'High Priority Rework' ? 'High Priority Rework Assigned' : 'System Notice'),
        message,
        type,
        priority,
        status: 'Unread',
        timestamp: new Date().toISOString(),
      };
      const updated = [newNotif, ...prev];
      syncStateToStorage('supNotifications', updated);
      return updated;
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, status: 'Read' as const } : n);
      syncStateToStorage('supNotifications', updated);
      return updated;
    });
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, status: 'Archived' as const } : n);
      syncStateToStorage('supNotifications', updated);
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => n.status === 'Unread' ? { ...n, status: 'Read' as const } : n);
      syncStateToStorage('supNotifications', updated);
      return updated;
    });
  };

  // --- KPI Calculations (Memoized for High Performance) ---

  const dashboardKPIs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]!;
    
    // Filter today's reviews
    const todayLogs = activityLogs.filter(log => log.reviewedAt?.split('T')[0] === todayStr);
    
    const pendingVerification = activityLogs.filter(log => log.status === 'Pending').length;
    const underReview = activityLogs.filter(log => log.status === 'Under Review').length;
    
    const approvedToday = todayLogs.filter(log => log.status === 'Approved').length;
    const rejectedToday = todayLogs.filter(log => log.status === 'Rejected').length;
    const reworkAssignedToday = todayLogs.filter(log => log.status === 'Rework').length;

    // Active workers = unique workers who submitted logs today
    const activeWorkersSet = new Set(activityLogs.filter(log => log.activityDate === todayStr).map(log => log.userId));
    const activeWorkers = Math.min(users.length, activeWorkersSet.size);
    const idleWorkers = Math.max(0, users.filter(w => w.role !== 'Supervisor').length - activeWorkers);

    // Productivity metrics (average of approved workers)
    const activeProductiveUsers = users.filter(u => u.role !== 'Supervisor' && u.activitiesCount > 0);
    const totalProd = activeProductiveUsers.reduce((sum, u) => sum + u.productivity, 0);
    const averageProductivity = activeProductiveUsers.length > 0 ? Math.round(totalProd / activeProductiveUsers.length) : 88;

    // Overdue = pending logs submitted more than 4 hours ago
    const nowEpoch = Date.now();
    const overdueActivities = activityLogs.filter(log => {
      if (log.status !== 'Pending') return false;
      const submittedTime = log.timeline[0] ? new Date(log.timeline[0].timestamp).getTime() : 0;
      return (nowEpoch - submittedTime) > 4 * 60 * 60 * 1000;
    }).length;

    // My performance (filtered by logged supervisor)
    const myName = user?.name || 'Amit Verma';
    const myTodayLogs = todayLogs.filter(log => log.reviewedBy === myName);
    
    const approvedByMe = myTodayLogs.filter(log => log.status === 'Approved').length;
    const rejectedByMe = myTodayLogs.filter(log => log.status === 'Rejected').length;
    const reworksAssignedByMe = myTodayLogs.filter(log => log.status === 'Rework').length;

    return {
      pendingVerification,
      underReview,
      approvedToday,
      rejectedToday,
      reworkAssignedToday,
      activeWorkers,
      idleWorkers,
      averageProductivity,
      overdueActivities,
      approvedByMe,
      rejectedByMe,
      reworksAssignedByMe,
      averageReviewTime: 2.4, // Mocked plant metric
    };
  }, [activityLogs, users, user]);

  return (
    <AppContext.Provider value={{
      themeMode,
      toggleTheme,
      isAuthenticated,
      user,
      login,
      logout,
      updateProfile,
      changePassword,
      users,
      salesOrders,
      departments,
      activityLogs,
      notifications,
      checkoutActivityForReview,
      releaseActivityFromReview,
      approveActivity,
      rejectActivity,
      assignRework,
      bulkVerifyActivities,
      markNotificationRead,
      archiveNotification,
      markAllNotificationsRead,
      dashboardKPIs,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
