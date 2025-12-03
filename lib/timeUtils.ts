import { format } from 'date-fns';

/**
 * Formats a Date or date string to 12-hour time format with AM/PM
 * @param date - Date object or date string
 * @param includeSeconds - Whether to include seconds (default: false)
 * @returns Formatted time string (e.g., "12:18 PM" or "12:18:30 PM")
 */
export function formatTime12Hour(date: Date | string, includeSeconds: boolean = false): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (includeSeconds) {
    return format(d, 'hh:mm:ss a');
  }
  return format(d, 'hh:mm a');
}

/**
 * Formats a 24-hour time string (HH:mm) to 12-hour format with AM/PM
 * @param time24 - Time string in 24-hour format (e.g., "14:30")
 * @returns Formatted time string (e.g., "02:30 PM")
 */
export function formatTimeString12Hour(time24: string): string {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const min = minutes || '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${min} ${period}`;
}

/**
 * Formats a time range from "HH:MM-HH:MM" to "h:mm AM - h:mm PM"
 * @param timeRange - Time range string (e.g., "09:00-17:00" or "09:00")
 * @returns Formatted time range string (e.g., "09:00 AM - 05:00 PM")
 */
export function formatTimeRange12Hour(timeRange: string): string {
  if (!timeRange) return '';
  
  if (timeRange.includes('-')) {
    const [from, to] = timeRange.split('-');
    return `${formatTimeString12Hour(from.trim())} - ${formatTimeString12Hour(to.trim())}`;
  }
  
  return formatTimeString12Hour(timeRange);
}

/**
 * Formats current time display with hours, minutes, seconds and AM/PM
 * @param date - Date object
 * @returns Object with formatted time parts and period
 */
export function formatTimeDisplay(date: Date): {
  hours: string;
  minutes: string;
  seconds: string;
  period: string;
} {
  const hours12 = format(date, 'hh');
  const minutes = format(date, 'mm');
  const seconds = format(date, 'ss');
  const period = format(date, 'a');
  
  return {
    hours: hours12,
    minutes,
    seconds,
    period,
  };
}

/**
 * Converts decimal hours to HH:MM:SS format
 * @param decimalHours - Hours as a decimal number (e.g., 0.83, 8.5)
 * @returns Formatted time string in HH:MM:SS format (e.g., "00:49:48", "08:30:00")
 */
export function formatHoursToHHMMSS(decimalHours: number): string {
  if (isNaN(decimalHours) || decimalHours < 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.round(decimalHours * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

