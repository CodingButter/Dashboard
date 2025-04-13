/**
 * Utility functions for localStorage operations
 */

// Export all localStorage as a downloadable JSON file
export function exportLocalStorageAsJson(): void {
  try {
    // Create an object containing all localStorage items
    const allStorageData: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            allStorageData[key] = JSON.parse(value);
          }
        } catch {
          // If we can't parse as JSON, store as string
          const rawValue = localStorage.getItem(key);
          if (rawValue) {
            allStorageData[key] = rawValue;
          }
        }
      }
    }
    
    // Convert to JSON string with pretty formatting
    const jsonStr = JSON.stringify(allStorageData, null, 2);
    
    // Create and trigger download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'local-storage-export.json';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export localStorage:', error);
  }
}

// Load JSON from URL with cache-busting
export async function loadJsonFromUrl(url: string): Promise<Record<string, any>> {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const response = await fetch(`${url}?t=${timestamp}`);
    
    if (!response.ok) {
      console.warn(`Could not load JSON from ${url}.`);
      return {};
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading JSON from ${url}:`, error);
    return {};
  }
}

// Load state from file
export function loadStateFromFile(file: File): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const jsonData = JSON.parse(event.target.result as string);
          resolve(jsonData);
        } else {
          reject(new Error('Failed to read file content'));
        }
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

// Import state from file and update localStorage
export async function importStateFromFile(file: File): Promise<boolean> {
  try {
    const stateData = await loadStateFromFile(file);
    
    // Only proceed if we have valid data
    if (stateData && typeof stateData === 'object' && Object.keys(stateData).length > 0) {
      // Loop through all keys in the imported state and save to localStorage
      Object.entries(stateData).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // Silently skip keys that can't be stored
        }
      });
      
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}