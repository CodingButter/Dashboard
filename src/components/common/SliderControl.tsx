import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  displayPrecision?: number;
  unit?: string;
}

export default function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  displayPrecision = 2,
  unit = ''
}: SliderControlProps) {
  // Format the display value based on precision
  const displayValue = () => {
    if (step >= 1) return Math.round(value).toString();
    return value.toFixed(displayPrecision);
  };

  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <label className="block text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm text-gray-400">{displayValue()}{unit}</span>
      </div>
      
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}