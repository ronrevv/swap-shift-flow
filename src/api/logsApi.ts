
import { supabase } from '@/integrations/supabase/client';
import { ActivityLog } from '@/types';

// Get activity logs (for managers)
export async function getActivityLogs() {
  try {
    const { data, error } = await supabase
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
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Format the data to match the ActivityLog type
    return data.map(log => ({
      id: log.id,
      userId: log.user_id || undefined,
      userName: log.profiles?.name || undefined,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.details,
      createdAt: log.created_at
    }));
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

// Export logs as CSV
export async function exportLogsAsCsv() {
  const logs = await getActivityLogs();
  
  // Convert logs to CSV format
  const headers = ['ID', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'Created At'];
  const rows = logs.map(log => [
    log.id,
    log.userName || 'System',
    log.action,
    log.entityType,
    log.entityId,
    JSON.stringify(log.details || {}),
    log.createdAt
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}
