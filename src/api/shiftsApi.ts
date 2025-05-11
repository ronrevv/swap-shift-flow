
import { supabase } from '@/integrations/supabase/client';
import { Shift } from '@/types';
import { format, parseISO } from 'date-fns';

// Get shifts for the current user
export async function getUserShifts() {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        id,
        employee_id,
        date,
        start_time,
        end_time,
        role,
        profiles:employee_id (name)
      `)
      .eq('employee_id', user.user.id)
      .order('date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Format the data to match the Shift type
    return data.map(shift => ({
      id: shift.id,
      employeeId: shift.employee_id,
      employeeName: shift.profiles?.name || '',
      date: shift.date,
      startTime: format(parseISO(`1970-01-01T${shift.start_time}`), 'h:mm a'),
      endTime: format(parseISO(`1970-01-01T${shift.end_time}`), 'h:mm a'),
      role: shift.role
    }));
  } catch (error) {
    console.error('Error fetching shifts:', error);
    throw error;
  }
}

// Get all shifts (for managers)
export async function getAllShifts() {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        id,
        employee_id,
        date,
        start_time,
        end_time,
        role,
        profiles:employee_id (name)
      `)
      .order('date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Format the data to match the Shift type
    return data.map(shift => ({
      id: shift.id,
      employeeId: shift.employee_id,
      employeeName: shift.profiles?.name || '',
      date: shift.date,
      startTime: format(parseISO(`1970-01-01T${shift.start_time}`), 'h:mm a'),
      endTime: format(parseISO(`1970-01-01T${shift.end_time}`), 'h:mm a'),
      role: shift.role
    }));
  } catch (error) {
    console.error('Error fetching all shifts:', error);
    throw error;
  }
}

// Create a new shift
export async function createShift(shiftData: Omit<Shift, 'id' | 'employeeName'>) {
  try {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        employee_id: shiftData.employeeId,
        date: shiftData.date,
        start_time: shiftData.startTime,
        end_time: shiftData.endTime,
        role: shiftData.role
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating shift:', error);
    throw error;
  }
}

// Import shifts from CSV data
export async function importShifts(csvData: any[]) {
  try {
    const formattedData = csvData.map(row => ({
      employee_id: row.employeeId,
      date: row.date,
      start_time: row.startTime,
      end_time: row.endTime,
      role: row.role
    }));
    
    const { data, error } = await supabase
      .from('shifts')
      .insert(formattedData)
      .select();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error importing shifts:', error);
    throw error;
  }
}
