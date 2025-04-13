import { useState, useEffect } from 'react';
import { useGlobalState } from './useGlobalState';

// Enhanced useStorage hook that can leverage global state
export function useStorage<T>(key: string, initialValue: T) {
  // Get global state if available
  const { state: globalState, isLoaded } = useGlobalState();
  
  // Use global value if available, otherwise use provided initialValue
  const effectiveInitialValue = isLoaded && globalState[key] !== undefined 
    ? globalState[key] as T 
    : initialValue;
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Check localStorage first
      const item = window.localStorage.getItem(key);
      // If item exists in localStorage, use it
      if (item) {
        try {
          // Parse the JSON
          const parsedItem = JSON.parse(item);
          
          // Check if this is our special high-precision format
          if (parsedItem && 
              parsedItem._type === 'high-precision-array' &&
              typeof parsedItem.x === 'number' &&
              typeof parsedItem.y === 'number' &&
              typeof parsedItem.z === 'number') {
            // Convert back to array with full precision
            return [parsedItem.x, parsedItem.y, parsedItem.z] as unknown as T;
          }
          
          // Otherwise use custom JSON.parse to preserve numerical precision
          const parsedValue = JSON.parse(item, (key, value) => {
            // Handle array of numbers with full precision
            if (Array.isArray(value) && 
                value.length === 3 && 
                value.every(item => typeof item === 'number' || typeof item === 'string')) {
              // Ensure each value is parsed with full precision
              return value.map(item => typeof item === 'string' ? parseFloat(item) : item);
            }
            return value;
          });
          return parsedValue;
        } catch {
          // If parsing fails, fall back to simple JSON.parse
          return JSON.parse(item);
        }
      }
      // Otherwise use the effective initial value (from global or provided default)
      return effectiveInitialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return effectiveInitialValue;
    }
  });
  
  // Effect to update from global state when it loads (if not already in localStorage)
  useEffect(() => {
    if (isLoaded && globalState[key] !== undefined) {
      try {
        // Only update from global if localStorage doesn't have this key
        const item = window.localStorage.getItem(key);
        if (!item) {
          const globalValue = globalState[key] as T;
          setStoredValue(globalValue);
          window.localStorage.setItem(key, JSON.stringify(globalValue));
        }
      } catch {
        console.error(`Error syncing with global state for key "${key}"`);
      }
    }
  }, [isLoaded, globalState, key]);
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Use full precision when storing arrays (for camera positions, etc.)
      const jsonValue = JSON.stringify(valueToStore, (key, val) => {
        // Special handling for 3D coordinates to ensure full precision
        if (Array.isArray(val) && val.length === 3 && val.every(item => typeof item === 'number')) {
          // Store each value with full floating point precision
          return val.map(num => {
            // For camera positions, we need the raw numbers without any loss of precision
            return num;
          });
        }
        return val;
      });
      
      // For camera positions or other 3D arrays, use a special storage format
      if (Array.isArray(valueToStore) && 
          valueToStore.length === 3 && 
          valueToStore.every(item => typeof item === 'number')) {
        // Store with a specific prefix to identify as high-precision array
        const highPrecisionValue = JSON.stringify({
          _type: 'high-precision-array',
          x: valueToStore[0],
          y: valueToStore[1],
          z: valueToStore[2]
        });
        window.localStorage.setItem(key, highPrecisionValue);
      } else {
        window.localStorage.setItem(key, jsonValue);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue) {
          try {
            // Parse the JSON
            const parsedItem = JSON.parse(event.newValue);
            
            // Check if this is our special high-precision format
            if (parsedItem && 
                parsedItem._type === 'high-precision-array' &&
                typeof parsedItem.x === 'number' &&
                typeof parsedItem.y === 'number' &&
                typeof parsedItem.z === 'number') {
              // Convert back to array with full precision
              setStoredValue([parsedItem.x, parsedItem.y, parsedItem.z] as unknown as T);
            } else {
              // Normal JSON parse
              setStoredValue(parsedItem);
            }
          } catch {
            // If parsing fails, fall back to simple JSON.parse
            setStoredValue(JSON.parse(event.newValue));
          }
        } else {
          // No value, use default
          setStoredValue(effectiveInitialValue);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, effectiveInitialValue]);
  
  return [storedValue, setValue] as const;
}