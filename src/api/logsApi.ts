import { supabase } from '@/integrations/supabase/client';
import { ActivityLog } from '@/types';
import { format } from 'date-fns';

// Get activity logs (for managers) with filters and pagination
export async function getActivityLogs({
  employeeFilter = 'all',
  dateFrom,
  dateTo,
  page = 1,
  pageSize = 50
}: {
  employeeFilter?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
} = {}) {
  try {
    let query = supabase
      .from('activity_logs')
      .select(`
        id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at,
        profiles:user_id (name)
      `);
    
    // Apply filters
    if (employeeFilter !== 'all') {
      query = query.eq('user_id', employeeFilter);
    }
    
    if (dateFrom) {
      query = query.gte('created_at', dateFrom.toISOString());
    }
    
    if (dateTo) {
      // Set time to end of day for 'to' date
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Get count for pagination
    const { count: totalCount } = await supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true });
    
    // Execute the query
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      throw error;
    }
    
    // Format the data to match the ActivityLog type
    const logs = data.map(log => ({
      id: log.id,
      userId: log.user_id || undefined,
      userName: log.profiles?.name || 'System',
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.details,
      createdAt: log.created_at
    }));
    
    return {
      logs,
      pagination: {
        page,
        pageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize)
      }
    };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
}

// Create a log entry
export async function createLogEntry(logData: {
  entityType: string;
  entityId: string;
  action: string;
  details?: any;
}) {
  try {
    const { data, error } = await supabase
      .rpc('log_activity', {
        entity_type: logData.entityType,
        entity_id: logData.entityId,
        action: logData.action,
        details: logData.details || null
      });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating log entry:', error);
    throw error;
  }
}

// Get all employees for filtering
export async function getEmployeesForFilter() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
}

// Export logs as CSV
export async function exportLogsAsCsv(filters: {
  employeeFilter?: string;
  dateFrom?: Date;
  dateTo?: Date;
} = {}) {
  try {
    // Get all logs matching the filters (no pagination)
    const result = await getActivityLogs({
      employeeFilter: filters.employeeFilter,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: 1,
      pageSize: 1000 // Get more logs for export
    });
    
    // Convert logs to CSV format
    const headers = ['ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'Created At'];
    const rows = result.logs.map(log => [
      log.id,
      log.userName || 'System',
      log.action,
      log.entityType,
      log.entityId,
      JSON.stringify(log.details || {}),
      format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Wrap values in quotes if they contain commas or quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');
    
    return csvContent;
  } catch (error) {
    console.error('Error exporting logs as CSV:', error);
    throw error;
  }
}

// Export logs as PDF
export async function exportLogsAsPdf() {
  try {
    // PDF generation would typically be handled by a library like jspdf
    // This is a placeholder for the functionality
    throw new Error('PDF export is not implemented yet');
  } catch (error) {
    console.error('Error exporting logs as PDF:', error);
    throw error;
  }
}
