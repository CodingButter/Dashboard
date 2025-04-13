import React from 'react';

interface VectorControlProps {
  label: string;
  value: [number, number, number];
  onChange: (value: [number, number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  axes?: string[];
}

export default function VectorControl({
  label,
  value,
  onChange,
  min = -10,
  max = 10, 
  step = 0.1,
  axes = ['X', 'Y', 'Z']
}: VectorControlProps) {
  const handleValueChange = (index: number, newValue: number) => {
    const newVector = [...value] as [number, number, number];
    newVector[index] = newValue;
    onChange(newVector);
  };

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {value.map((component, index) => (
          <div key={index}>
            <label className="block text-xs text-gray-400">{axes[index]}</label>
            <input 
              type="number" 
              value={component}
              onChange={(e) => handleValueChange(index, Number(e.target.value))}
              className="w-full p-1 bg-gray-700 text-white border-gray-600 rounded-md"
              step={step}
              min={min}
              max={max}
            />
          </div>
        ))}
      </div>
    </div>
  );
}