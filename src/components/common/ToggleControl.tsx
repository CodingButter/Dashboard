import React from 'react';

interface ToggleControlProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  id?: string;
}

export default function ToggleControl({
  label,
  value,
  onChange,
  id = `toggle-${Math.random().toString(36).substring(2, 9)}`
}: ToggleControlProps) {
  return (
    <div className="flex items-center mb-3">
      <input 
        type="checkbox" 
        id={id}
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 bg-gray-700 border-gray-600 rounded"
      />
      <label htmlFor={id} className="ml-2 text-sm font-medium text-gray-300">
        {label}
      </label>
    </div>
  );
}