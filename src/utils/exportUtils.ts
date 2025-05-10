
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const exportLogsToCSV = async () => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        created_at,
        details,
        profiles:user_id (name, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching logs:', error);
      throw new Error('Failed to fetch logs');
    }
    
    if (!data || data.length === 0) {
      throw new Error('No logs found to export');
    }
    
    // Format data for CSV
    const formattedData = data.map(log => ({
      'Log ID': log.id,
      'Date': format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      'User': log.profiles?.name || 'System',
      'Email': log.profiles?.email || '-',
      'Action': log.action,
      'Entity Type': log.entity_type,
      'Entity ID': log.entity_id,
      'Details': log.details ? JSON.stringify(log.details) : '-'
    }));
    
    // Convert to CSV
    const headers = Object.keys(formattedData[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of formattedData) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains commas
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      });
      csvRows.push(values.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `shiftswap_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting logs:', error);
    throw error;
  }
};
