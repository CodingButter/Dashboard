import React from 'react';

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function ColorControl({
  label,
  value,
  onChange
}: ColorControlProps) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <input 
          type="color" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 border-0 rounded cursor-pointer"
        />
        <span className="text-sm text-gray-300">{value}</span>
      </div>
    </div>
  );
}