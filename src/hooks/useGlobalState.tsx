import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';
import { loadJsonFromUrl } from '../utils/storageUtils';

/* eslint-disable react-refresh/only-export-components */
// Type for the GlobalState context
export interface GlobalStateContextType {
  state: Record<string, any>;
  isLoaded: boolean;
  setState?: (newState: Record<string, any>) => void;
}

// Create the context with a default empty state
const GlobalStateContext = createContext<GlobalStateContextType>({
  state: {},
  isLoaded: false
});

// Props for the GlobalStateProvider
export interface GlobalStateProviderProps {
  children: ReactNode;
  configPath?: string;
}

// GlobalStateProvider component that loads JSON config and provides it via context
export function GlobalStateProvider({ children, configPath = '/config/global-state.json' }: GlobalStateProviderProps) {
  const [globalState, setGlobalState] = useState<Record<string, any>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    async function loadGlobalConfig() {
      try {
        const data = await loadJsonFromUrl(configPath);
        console.log(`Loaded global config from ${configPath}`);
        setGlobalState(data);
      } catch {
        console.error(`Error loading global config from ${configPath}`);
        setGlobalState({});
      } finally {
        setIsLoaded(true);
      }
    }
    
    loadGlobalConfig();
  }, [configPath]);
  
  return (
    <GlobalStateContext.Provider 
      value={{ 
        state: globalState, 
        isLoaded,
        setState: setGlobalState 
      }}
    >
      <div 
        data-global-state-provider="true" 
        data-config-path={configPath}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
    </GlobalStateContext.Provider>
  );
}

// Hook to access the global state
export function useGlobalState(): GlobalStateContextType & {
  resetState: () => Promise<void>;
  loadStateFromFile: (file: File) => Promise<boolean>;
} {
  const context = useContext(GlobalStateContext);
  const [, forceUpdate] = useState({});
  
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  
  // Add functionality to reset state by reloading from config file
  const resetState = useCallback(async () => {
    try {
      const provider = document.querySelector('[data-global-state-provider="true"]');
      const configPath = provider?.getAttribute('data-config-path') || '/config/global-state.json';
      
      const data = await import('../utils/storageUtils')
        .then(module => module.loadJsonFromUrl(configPath));
      
      // We need to be careful not to lose the Provider's ability to update state
      if (context.setState && typeof context.setState === 'function') {
        context.setState(data);
      }
      
      // Force update to ensure UI reflects the new state
      forceUpdate({});
    } catch {
      console.error('Failed to reset global state');
    }
  }, [context]);
  
  // Add functionality to load state from uploaded file
  const loadStateFromFile = useCallback(async (file: File): Promise<boolean> => {
    try {
      const { loadStateFromFile: loadFile } = await import('../utils/storageUtils');
      const newState = await loadFile(file);
      
      // Only update if we got valid data
      if (newState && typeof newState === 'object' && Object.keys(newState).length > 0) {
        // Update the global state with the new data
        if (context.setState && typeof context.setState === 'function') {
          context.setState(newState);
        }
        
        // Force update to ensure UI reflects the new state
        forceUpdate({});
        return true;
      }
      
      return false;
    } catch {
      console.error('Failed to load state from file');
      return false;
    }
  }, [context]);
  
  return {
    ...context,
    resetState,
    loadStateFromFile
  };
}