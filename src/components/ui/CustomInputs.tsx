import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Palette, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/utils';
import { motion, AnimatePresence } from 'motion/react';
import { HexColorPicker } from 'react-colorful';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isValid } from 'date-fns';
import 'react-day-picker/dist/style.css';

// --- Custom Select ---

interface SelectOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, onChange, placeholder = "Select...", className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : <span className="text-zinc-500">{placeholder}</span>}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 w-full mt-1 bg-[#121212] border border-[#333] rounded-md shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[#222] transition-colors",
                  value === option.value ? "text-cyan-400 font-medium bg-cyan-900/20" : "text-zinc-300"
                )}
              >
                {option.icon}
                <span className="flex-1 truncate">{option.label}</span>
                {value === option.value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Custom Color Picker ---

interface CustomColorPickerProps {
  color: string; // Hex string (e.g., "#FF0000")
  onChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  "#5865F2", "#EB459E", "#ED4245", "#FEE75C", 
  "#57F287", "#FFFFFF", "#000000", "#2B2D31"
];

export const CustomColorPicker: React.FC<CustomColorPickerProps> = ({ color, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-md border border-[#333] shadow-sm flex items-center justify-center overflow-hidden relative group"
          style={{ backgroundColor: color }}
        >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            <Palette className="w-4 h-4 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">#</span>
            <input
                type="text"
                value={color.replace('#', '')}
                onChange={(e) => {
                    const val = e.target.value;
                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                        onChange('#' + val);
                    }
                }}
                maxLength={6}
                className="w-full h-10 bg-[#0a0a0a] border border-[#333] rounded-md pl-6 pr-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 left-0 mt-2 w-64 bg-[#121212] border border-[#333] rounded-lg shadow-xl p-3"
          >
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(c)}
                  className={cn(
                    "w-8 h-8 rounded-full border border-[#333] shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-[#121212]",
                    color.toLowerCase() === c.toLowerCase() && "ring-2 ring-offset-2 ring-cyan-500 ring-offset-[#121212]"
                  )}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            
            <div className="mt-2">
              <HexColorPicker color={color} onChange={onChange} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Custom Date Picker ---

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const parsedDate = value ? parseISO(value) : undefined;
  const isValidDate = parsedDate && isValid(parsedDate);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(isValidDate ? parsedDate : undefined);
  const [timeString, setTimeString] = useState(isValidDate ? format(parsedDate, 'HH:mm') : '12:00');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      updateValue(date, timeString);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTimeString(newTime);
    if (selectedDate) {
      updateValue(selectedDate, newTime);
    }
  };

  const updateValue = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours || 0, minutes || 0, 0, 0);
    onChange(newDate.toISOString());
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#0a0a0a] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
      >
        <span className="flex items-center gap-2 truncate text-zinc-300">
          <CalendarIcon className="w-4 h-4 text-zinc-500" />
          {isValidDate ? format(parsedDate, 'PPp') : <span className="text-zinc-500">Select Date & Time</span>}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 left-0 mt-2 bg-[#121212] border border-[#333] rounded-lg shadow-xl p-3"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="border-b border-[#333] pb-3 mb-3"
                classNames={{
                  day_selected: "bg-cyan-600 text-white hover:bg-cyan-700",
                  day_today: "font-bold text-cyan-600",
                  button: "hover:bg-[#222] rounded-md transition-colors text-white",
                  head_cell: "text-zinc-400 font-medium",
                  nav_button: "hover:bg-[#222] text-zinc-300",
                  caption: "text-white font-medium",
                }}
            />
            <div className="flex items-center gap-2 px-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              <input
                type="time"
                value={timeString}
                onChange={handleTimeChange}
                className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            {isValidDate && (
              <button
                onClick={() => {
                  onChange('');
                  setSelectedDate(undefined);
                  setIsOpen(false);
                }}
                className="w-full mt-3 text-xs text-red-500 hover:text-red-400 font-medium py-1"
              >
                Clear Timestamp
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
