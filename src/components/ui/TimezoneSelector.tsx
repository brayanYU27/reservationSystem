import React, { useState } from 'react';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { getMexicoTimezones, getTimezoneAbbr, getCurrentTimeInTimezone } from '@/utils/timezoneUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimezoneOption {
    value: string;
    label: string;
    offset: string;
}

interface TimezoneSelectorProps {
    value: string;
    onChange: (timezone: string) => void;
    className?: string;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
    value,
    onChange,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const timezones = getMexicoTimezones();

    const selectedTimezone = timezones.find((tz) => tz.value === value) || timezones[0];

    const getCurrentTime = (timezone: string) => {
        const now = getCurrentTimeInTimezone(timezone);
        return format(now, 'h:mm a', { locale: es });
    };

    return (
        <div className={`relative ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Horaria
            </label>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
                <div className="flex items-center gap-3">
                    <Clock className="size-5 text-gray-500" />
                    <div className="text-left">
                        <p className="font-medium text-gray-900">{selectedTimezone.label}</p>
                        <p className="text-sm text-gray-500">
                            {selectedTimezone.offset} • {getCurrentTime(selectedTimezone.value)}
                        </p>
                    </div>
                </div>
                <ChevronDown
                    className={`size-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto">
                        {timezones.map((timezone) => {
                            const isSelected = timezone.value === value;
                            const currentTime = getCurrentTime(timezone.value);
                            const abbr = getTimezoneAbbr(timezone.value);

                            return (
                                <button
                                    key={timezone.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(timezone.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-gray-900">{timezone.label}</p>
                                            <p className="text-sm text-gray-500">
                                                {timezone.offset} • {currentTime} {abbr}
                                            </p>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <Check className="size-5 text-blue-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            <p className="mt-2 text-sm text-gray-500">
                💡 Esta zona horaria se usará para mostrar todas las citas y horarios de tu negocio.
            </p>
        </div>
    );
};
