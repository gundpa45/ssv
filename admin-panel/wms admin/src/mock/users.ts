import type { User } from '../context/AppContext';

export const mockUsers: User[] = [
  { id: 'USR101', adminName: 'Admin User', userId: 'admin@workforce-management.com', mobile: '9876543210', email: 'admin@workforce-management.com', role: 'Admin', status: 'Active' },
  { id: 'USR102', adminName: 'John Operator', userId: 'john.op@workforce-management.com', mobile: '9876543211', email: 'john.op@workforce-management.com', role: 'Skilled', status: 'Working' },
  { id: 'USR103', adminName: 'Jane Manager', userId: 'jane.mgr@workforce-management.com', mobile: '9876543212', email: 'jane.mgr@workforce-management.com', role: 'Skilled', status: 'Active' },
  { id: 'USR104', adminName: 'Alice Assembly', userId: 'alice.a@workforce-management.com', mobile: '9876543213', email: 'alice.a@workforce-management.com', role: 'Skilled', status: 'Idle' },
  { id: 'USR105', adminName: 'Robert Builder', userId: 'robert.b@workforce-management.com', mobile: '9876543214', email: 'robert.b@workforce-management.com', role: 'Skilled', status: 'Working' },
  { id: 'USR106', adminName: 'Sam Supervisor', userId: 'sam.sup@workforce-management.com', mobile: '9876543215', email: 'sam.sup@workforce-management.com', role: 'Skilled', status: 'Active' },
  { id: 'USR107', adminName: 'Tony Tech', userId: 'tony.tech@workforce-management.com', mobile: '9876543216', email: 'tony.tech@workforce-management.com', role: 'Technician', status: 'Working' },
  { id: 'USR108', adminName: 'Quinn Quality', userId: 'quinn.q@workforce-management.com', mobile: '9876543217', email: 'quinn.q@workforce-management.com', role: 'Technician', status: 'Away' },
  { id: 'USR109', adminName: 'Larry Logistics', userId: 'larry.l@workforce-management.com', mobile: '9876543218', email: 'larry.l@workforce-management.com', role: 'Skilled', status: 'Working' },
  { id: 'USR110', adminName: 'Mike Maintenance', userId: 'mike.m@workforce-management.com', mobile: '9876543219', email: 'mike.m@workforce-management.com', role: 'Technician', status: 'Idle' },
  { id: 'USR111', adminName: 'Paul Plant', userId: 'paul.p@workforce-management.com', mobile: '9876543220', email: 'paul.p@workforce-management.com', role: 'Skilled', status: 'Active' },
  { id: 'USR112', adminName: 'Wendy Worker', userId: 'wendy.w@workforce-management.com', mobile: '9876543221', email: 'wendy.w@workforce-management.com', role: 'Skilled', status: 'Working' },
  { id: 'USR113', adminName: 'Victor Vendor', userId: 'victor.v@workforce-management.com', mobile: '9876543222', email: 'victor.v@workforce-management.com', role: 'Skilled', status: 'Working' },
  { id: 'USR114', adminName: 'Tim Tester', userId: 'tim.t@workforce-management.com', mobile: '9876543223', email: 'tim.t@workforce-management.com', role: 'Technician', status: 'Idle' },
  { id: 'USR115', adminName: 'Sara Setup', userId: 'sara.s@workforce-management.com', mobile: '9876543224', email: 'sara.s@workforce-management.com', role: 'Technician', status: 'Away' }
];
