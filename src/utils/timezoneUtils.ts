import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Frontend Timezone Utilities
 */

/**
 * Detect user's timezone
 */
export const detectUserTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert UTC date to specific timezone
 */
export const toTimezone = (utcDate: Date | string, timezone: string): Date => {
    const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
    return toZonedTime(date, timezone);
};

/**
 * Convert timezone date to UTC
 */
export const toUTC = (localDate: Date, timezone: string): Date => {
    return fromZonedTime(localDate, timezone);
};

/**
 * Format date in specific timezone
 */
export const formatInTimezone = (
    date: Date | string,
    timezone: string,
    formatStr: string = 'PPpp'
): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(dateObj, timezone, formatStr, { locale: es });
};

/**
 * Get timezone abbreviation
 */
export const getTimezoneAbbr = (timezone: string): string => {
    const date = new Date();
    return formatInTimeZone(date, timezone, 'zzz');
};

/**
 * Format time with timezone indicator
 */
export const formatTimeWithTz = (
    date: Date | string,
    time: string,
    timezone: string
): string => {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    const dateTime = parseISO(`${dateStr}T${time}`);
    const abbr = getTimezoneAbbr(timezone);

    return `${formatInTimeZone(dateTime, timezone, 'h:mm a', { locale: es })} ${abbr}`;
};

/**
 * Get common Mexico timezones
 */
export const getMexicoTimezones = (): Array<{
    value: string;
    label: string;
    offset: string;
}> => {
    return [
        {
            value: 'America/Mexico_City',
            label: 'Ciudad de México (Zona Centro)',
            offset: 'UTC-6',
        },
        {
            value: 'America/Cancun',
            label: 'Cancún (Zona Sureste)',
            offset: 'UTC-5',
        },
        {
            value: 'America/Tijuana',
            label: 'Tijuana (Zona Noroeste)',
            offset: 'UTC-8',
        },
        {
            value: 'America/Hermosillo',
            label: 'Hermosillo (Zona Pacífico)',
            offset: 'UTC-7',
        },
        {
            value: 'America/Chihuahua',
            label: 'Chihuahua (Zona Norte)',
            offset: 'UTC-7',
        },
    ];
};

/**
 * Validate timezone string
 */
export const isValidTimezone = (timezone: string): boolean => {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;
    } catch (e) {
        return false;
    }
};

/**
 * Get current time in timezone
 */
export const getCurrentTimeInTimezone = (timezone: string): Date => {
    return toZonedTime(new Date(), timezone);
};

/**
 * Check if date is today in timezone
 */
export const isToday = (date: Date | string, timezone: string): boolean => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const localDate = toTimezone(dateObj, timezone);
    const today = getCurrentTimeInTimezone(timezone);

    return (
        localDate.getDate() === today.getDate() &&
        localDate.getMonth() === today.getMonth() &&
        localDate.getFullYear() === today.getFullYear()
    );
};

/**
 * Format appointment datetime
 */
export const formatAppointmentDateTime = (
    date: Date | string,
    time: string,
    timezone: string
): string => {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    const dateTime = parseISO(`${dateStr}T${time}`);

    return formatInTimeZone(
        dateTime,
        timezone,
        "EEEE, d 'de' MMMM 'a las' h:mm a",
        { locale: es }
    );
};

/**
 * Get timezone offset display
 */
export const getTimezoneOffsetDisplay = (timezone: string): string => {
    const now = new Date();
    const offset = formatInTimeZone(now, timezone, 'XXX');
    return `UTC${offset}`;
};
