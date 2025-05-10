
export type UserRole = "Staff" | "Manager";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
}

export type SwapStatus = "Open" | "Volunteered" | "Pending" | "Approved" | "Rejected";

export interface SwapRequest {
  id: string;
  shiftId: string;
  requesterId: string;
  requesterName: string;
  note?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SwapStatus;
  createdAt: string;
  volunteerId?: string;
  volunteerName?: string;
  volunteerShiftId?: string;
  volunteerShiftDate?: string;
  volunteerShiftStartTime?: string;
  volunteerShiftEndTime?: string;
  managerId?: string;
  managerName?: string;
  approvedAt?: string;
  rejectedAt?: string;
  reason?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}
