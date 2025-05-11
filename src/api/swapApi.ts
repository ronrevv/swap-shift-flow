
import { supabase } from '@/integrations/supabase/client';
import { SwapRequest } from '@/types';
import { format, parseISO } from 'date-fns';
import { createLogEntry } from '@/api/logsApi';

// Get all open swap requests
export async function getOpenSwapRequests() {
  try {
    const { data, error } = await supabase
      .from('swap_requests')
      .select(`
        id,
        requester_id,
        shift_id,
        note,
        status,
        created_at,
        volunteer_id,
        volunteer_shift_id,
        manager_id,
        approved_at,
        rejected_at,
        rejection_reason,
        requesterProfile:profiles!requester_id (name),
        volunteerProfile:profiles!volunteer_id (name),
        managerProfile:profiles!manager_id (name),
        shift:shifts!shift_id (id, date, start_time, end_time, employee_id),
        volunteerShift:shifts!volunteer_shift_id (id, date, start_time, end_time)
      `)
      .eq('status', 'Open')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Format the data to match the SwapRequest type
    return data.map(swap => ({
      id: swap.id,
      shiftId: swap.shift_id,
      requesterId: swap.requester_id,
      requesterName: swap.requesterProfile?.name || '',
      note: swap.note || undefined,
      date: swap.shift?.date || '',
      startTime: swap.shift ? format(parseISO(`1970-01-01T${swap.shift.start_time}`), 'h:mm a') : '',
      endTime: swap.shift ? format(parseISO(`1970-01-01T${swap.shift.end_time}`), 'h:mm a') : '',
      status: swap.status,
      createdAt: swap.created_at,
      volunteerId: swap.volunteer_id || undefined,
      volunteerName: swap.volunteerProfile?.name || undefined,
      volunteerShiftId: swap.volunteer_shift_id || undefined,
      volunteerShiftDate: swap.volunteerShift?.date || undefined,
      volunteerShiftStartTime: swap.volunteerShift ? format(parseISO(`1970-01-01T${swap.volunteerShift.start_time}`), 'h:mm a') : undefined,
      volunteerShiftEndTime: swap.volunteerShift ? format(parseISO(`1970-01-01T${swap.volunteerShift.end_time}`), 'h:mm a') : undefined,
      managerId: swap.manager_id || undefined,
      managerName: swap.managerProfile?.name || undefined,
      approvedAt: swap.approved_at || undefined,
      rejectedAt: swap.rejected_at || undefined,
      reason: swap.rejection_reason || undefined
    }));
  } catch (error) {
    console.error('Error fetching open swap requests:', error);
    throw error;
  }
}

// Create a new swap request
export async function createSwapRequest(swapData: { shiftId: string, note?: string }) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('swap_requests')
      .insert({
        requester_id: userData.user.id,
        shift_id: swapData.shiftId,
        note: swapData.note || null,
        status: 'Open'
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Log the swap request creation
    await createLogEntry({
      entityType: 'swap_request',
      entityId: data.id,
      action: 'created',
      details: {
        shiftId: swapData.shiftId,
        userId: userData.user.id
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error creating swap request:', error);
    throw error;
  }
}

// Volunteer for a swap
export async function volunteerForSwap(swapId: string, volunteerShiftId: string) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      throw new Error('User not authenticated');
    }
    
    // Check if user is a manager (managers can't volunteer)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    if (profileData.role === 'Manager') {
      throw new Error('Managers cannot volunteer for shift swaps');
    }
    
    const { data, error } = await supabase
      .from('swap_requests')
      .update({
        volunteer_id: userData.user.id,
        volunteer_shift_id: volunteerShiftId,
        status: 'Pending'
      })
      .eq('id', swapId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Log volunteering action
    await createLogEntry({
      entityType: 'swap_request',
      entityId: swapId,
      action: 'volunteered',
      details: {
        swapId: swapId,
        volunteerId: userData.user.id,
        volunteerShiftId: volunteerShiftId
      }
    });
    
    return data;
  } catch (error) {
    console.error('Error volunteering for swap:', error);
    throw error;
  }
}

// Get pending swap requests (for managers)
export async function getPendingSwapRequests() {
  try {
    console.log('Fetching pending swap requests...');
    const { data, error } = await supabase
      .from('swap_requests')
      .select(`
        id,
        requester_id,
        shift_id,
        note,
        status,
        created_at,
        volunteer_id,
        volunteer_shift_id,
        rejected_at,
        rejection_reason,
        approved_at,
        manager_id,
        requesterProfile:profiles!requester_id(name),
        volunteerProfile:profiles!volunteer_id(name),
        managerProfile:profiles!manager_id(name),
        shift:shifts!shift_id(id, date, start_time, end_time, employee_id),
        volunteerShift:shifts!volunteer_shift_id(id, date, start_time, end_time)
      `)
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pending swap requests:', error);
      throw error;
    }
    
    console.log('Pending swap requests data:', data);
    
    // Format the data to match the SwapRequest type
    return data.map(swap => ({
      id: swap.id,
      shiftId: swap.shift_id,
      requesterId: swap.requester_id,
      requesterName: swap.requesterProfile?.name || '',
      note: swap.note || undefined,
      date: swap.shift?.date || '',
      startTime: swap.shift ? format(parseISO(`1970-01-01T${swap.shift.start_time}`), 'h:mm a') : '',
      endTime: swap.shift ? format(parseISO(`1970-01-01T${swap.shift.end_time}`), 'h:mm a') : '',
      status: swap.status,
      createdAt: swap.created_at,
      volunteerId: swap.volunteer_id || undefined,
      volunteerName: swap.volunteerProfile?.name || undefined,
      volunteerShiftId: swap.volunteer_shift_id || undefined,
      volunteerShiftDate: swap.volunteerShift?.date || undefined,
      volunteerShiftStartTime: swap.volunteerShift ? format(parseISO(`1970-01-01T${swap.volunteerShift.start_time}`), 'h:mm a') : undefined,
      volunteerShiftEndTime: swap.volunteerShift ? format(parseISO(`1970-01-01T${swap.volunteerShift.end_time}`), 'h:mm a') : undefined,
      managerId: swap.manager_id || undefined,
      managerName: swap.managerProfile?.name || undefined,
      approvedAt: swap.approved_at || undefined,
      rejectedAt: swap.rejected_at || undefined,
      reason: swap.rejection_reason || undefined
    }));
  } catch (error) {
    console.error('Error fetching pending swap requests:', error);
    throw error;
  }
}

// Approve a swap request
export async function approveSwapRequest(swapId: string) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      throw new Error('User not authenticated');
    }
    
    // Check if user is a manager
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    if (profileData.role !== 'Manager') {
      throw new Error('Only managers can approve swap requests');
    }
    
    const { data, error } = await supabase
      .from('swap_requests')
      .update({
        status: 'Approved',
        manager_id: userData.user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', swapId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error approving swap request:', error);
    throw error;
  }
}

// Reject a swap request
export async function rejectSwapRequest(swapId: string, reason?: string) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      throw new Error('User not authenticated');
    }
    
    // Check if user is a manager
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    if (profileData.role !== 'Manager') {
      throw new Error('Only managers can reject swap requests');
    }
    
    const { data, error } = await supabase
      .from('swap_requests')
      .update({
        status: 'Rejected',
        manager_id: userData.user.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason || null
      })
      .eq('id', swapId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error rejecting swap request:', error);
    throw error;
  }
}

// Get swap history for current user
export async function getUserSwapHistory() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('swap_requests')
      .select(`
        id,
        requester_id,
        shift_id,
        note,
        status,
        created_at,
        volunteer_id,
        volunteer_shift_id,
        manager_id,
        approved_at,
        rejected_at,
        rejection_reason,
        requesterProfile:profiles!requester_id (name),
        volunteerProfile:profiles!volunteer_id (name),
        managerProfile:profiles!manager_id (name),
        shift:shifts!shift_id (id, date, start_time, end_time, employee_id),
        volunteerShift:shifts!volunteer_shift_id (id, date, start_time, end_time)
      `)
      .or(`requester_id.eq.${userData.user.id},volunteer_id.eq.${userData.user.id}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Format the data to match the SwapRequest type
    return data.map(swap => ({
      id: swap.id,
      shiftId: swap.shift_id,
      requesterId: swap.requester_id,
      requesterName: swap.requesterProfile?.name || '',
      note: swap.note || undefined,
      date: swap.shift?.date || '',
      startTime: swap.shift ? format(parseISO(`1970-01-01T${swap.shift.start_time}`), 'h:mm a') : '',
      endTime: swap.shift ? format(parseISO(`1970-01-01T${swap.shift.end_time}`), 'h:mm a') : '',
      status: swap.status,
      createdAt: swap.created_at,
      volunteerId: swap.volunteer_id || undefined,
      volunteerName: swap.volunteerProfile?.name || undefined,
      volunteerShiftId: swap.volunteer_shift_id || undefined,
      volunteerShiftDate: swap.volunteerShift?.date || undefined,
      volunteerShiftStartTime: swap.volunteerShift ? format(parseISO(`1970-01-01T${swap.volunteerShift.start_time}`), 'h:mm a') : undefined,
      volunteerShiftEndTime: swap.volunteerShift ? format(parseISO(`1970-01-01T${swap.volunteerShift.end_time}`), 'h:mm a') : undefined,
      managerId: swap.manager_id || undefined,
      managerName: swap.managerProfile?.name || undefined,
      approvedAt: swap.approved_at || undefined,
      rejectedAt: swap.rejected_at || undefined,
      reason: swap.rejection_reason || undefined
    }));
  } catch (error) {
    console.error('Error fetching user swap history:', error);
    throw error;
  }
}

// Get all swap requests (for managers)
export async function getAllSwapRequests() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData || !userData.user) {
      throw new Error('User not authenticated');
    }
    
    // Check if user is a manager
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    
    if (profileData.role !== 'Manager') {
      throw new Error('Only managers can view all swap requests');
    }
    
    const { data, error } = await supabase
      .from('swap_requests')
      .select(`
        id,
        requester_id,
        shift_id,
        note,
        status,
        created_at,
        volunteer_id,
        volunteer_shift_id,
        manager_id,
        approved_at,
        rejected_at,
        rejection_reason,
        requesterProfile:profiles!requester_id (name),
        volunteerProfile:profiles!volunteer_id (name),
        managerProfile:profiles!manager_id (name),
        shift:shifts!shift_id (id, date, start_time, end_time, employee_id),
        volunteerShift:shifts!volunteer_shift_id (id, date, start_time, end_time)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Format the data to match the SwapRequest type
    return data.map(swap => ({
      id: swap.id,
      shiftId: swap.shift_id,
      requesterId: swap.requester_id,
      requesterName: swap.requesterProfile?.name || '',
      note: swap.note || undefined,
      date: swap.shift?.date || '',
      startTime: swap.shift ? format(parseISO(`1970-01-01T${swap.shift.start_time}`), 'h:mm a') : '',
      endTime: swap.shift ? format(parseISO(`1970-01-01T${swap.shift.end_time}`), 'h:mm a') : '',
      status: swap.status,
      createdAt: swap.created_at,
      volunteerId: swap.volunteer_id || undefined,
      volunteerName: swap.volunteerProfile?.name || undefined,
      volunteerShiftId: swap.volunteer_shift_id || undefined,
      volunteerShiftDate: swap.volunteerShift?.date || undefined,
      volunteerShiftStartTime: swap.volunteerShift ? format(parseISO(`1970-01-01T${swap.volunteerShift.start_time}`), 'h:mm a') : undefined,
      volunteerShiftEndTime: swap.volunteerShift ? format(parseISO(`1970-01-01T${swap.volunteerShift.end_time}`), 'h:mm a') : undefined,
      managerId: swap.manager_id || undefined,
      managerName: swap.managerProfile?.name || undefined,
      approvedAt: swap.approved_at || undefined,
      rejectedAt: swap.rejected_at || undefined,
      reason: swap.rejection_reason || undefined
    }));
  } catch (error) {
    console.error('Error fetching all swap requests:', error);
    throw error;
  }
}
