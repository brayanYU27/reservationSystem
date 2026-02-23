import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Timezone Service
 * Handles all timezone conversions and formatting
 */
export class TimezoneService {
    /**
     * Convert UTC date to business timezone
     */
    static toBusinessTime(utcDate: Date | string, timezone: string): Date {
        const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
        return toZonedTime(date, timezone);
    }

    /**
     * Convert business timezone date to UTC
     */
    static toUTC(localDate: Date, timezone: string): Date {
        return fromZonedTime(localDate, timezone);
    }

    /**
     * Format date in specific timezone
     */
    static formatInTimezone(
        date: Date | string,
        timezone: string,
        formatStr: string = 'PPpp'
    ): string {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return formatInTimeZone(dateObj, timezone, formatStr, { locale: es });
    }

    /**
     * Get timezone offset in hours
     */
    static getTimezoneOffset(timezone: string): number {
        const now = new Date();
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
    }

    /**
     * Get timezone abbreviation (e.g., CST, EST)
     */
    static getTimezoneAbbr(timezone: string): string {
        const date = new Date();
        const formatted = formatInTimeZone(date, timezone, 'zzz');
        return formatted;
    }

    /**
     * Validate timezone string
     */
    static isValidTimezone(timezone: string): boolean {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get common timezones for Mexico
     */
    static getMexicoTimezones(): Array<{ value: string; label: string; offset: string }> {
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
    }

    /**
     * Format appointment time with timezone
     */
    static formatAppointmentTime(
        date: Date | string,
        time: string,
        timezone: string
    ): string {
        const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
        const dateTime = parseISO(`${dateStr}T${time}`);
        const localTime = this.toBusinessTime(dateTime, timezone);

        return formatInTimeZone(
            localTime,
            timezone,
            "d 'de' MMMM 'a las' h:mm a",
            { locale: es }
        );
    }

    /**
     * Get current time in business timezone
     */
    static getCurrentTimeInTimezone(timezone: string): Date {
        return toZonedTime(new Date(), timezone);
    }

    /**
     * Check if date is today in business timezone
     */
    static isToday(date: Date | string, timezone: string): boolean {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        const localDate = this.toBusinessTime(dateObj, timezone);
        const today = this.getCurrentTimeInTimezone(timezone);

        return (
            localDate.getDate() === today.getDate() &&
            localDate.getMonth() === today.getMonth() &&
            localDate.getFullYear() === today.getFullYear()
        );
    }

    /**
     * Parse date string in business timezone
     */
    static parseInTimezone(dateString: string, timezone: string): Date {
        const parsed = parseISO(dateString);
        return fromZonedTime(parsed, timezone);
    }
}
