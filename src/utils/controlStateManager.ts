import { loadJsonFromUrl } from './storageUtils';

// Default panel positions if nothing is loaded
const DEFAULT_PANEL_POSITIONS = {
  'wheel': { x: 20, y: 20 },
  'lighting': { x: 20, y: 300 },
  'shadow': { x: 350, y: 20 },
  'settings': { x: 350, y: 300 }
};

// Types for the control state
export interface PanelPosition {
  x: number;
  y: number;
}

export interface PanelState {
  position: PanelPosition;
  collapsed?: boolean;
  hidden?: boolean;
  width?: number;
  height?: number;
}

export interface ComponentState {
  panel: PanelState;
  values: Record<string, any>;
}

export interface ControlState {
  global: {
    showControls: boolean;
  };
  components: {
    [key: string]: ComponentState;
  };
}

// Default fallback state if config loading fails
export const fallbackState: ControlState = {
  global: {
    showControls: true
  },
  components: {
    SteeringWheel: {
      panel: {
        position: { x: 20, y: 20 },
        collapsed: false,
        hidden: false,
        width: 400,
        height: 600
      },
      values: {
        steeringControl: 0,
        rotationX: 90,
        rotationY: 0,
        rotationZ: 0, 
        scaleXYZ: 0.01,
        cameraY: 10,
        groundHeight: -2,
        groundSize: 30,
        groundVisible: false,
        shadowOpacity: 0.6,
        ambience: 0.2,
        brightness: 2.5,
        fillLightIntensity: 0.8,
        mainLightX: 5,
        mainLightY: 8,
        mainLightZ: 5
      }
    }
  }
};

// Load control state from JSON config
export async function loadControlState(
  configPath = '/config/controlState.json'
): Promise<ControlState> {
  try {
    const data = await loadJsonFromUrl(configPath);
    
    // Validate the data structure
    if (
      typeof data === 'object' && 
      data !== null && 
      'global' in data && 
      'components' in data
    ) {
      return data as ControlState;
    }
    
    console.warn('Control state config has invalid structure, using fallback');
    return fallbackState;
  } catch (error) {
    console.error('Failed to load control state config:', error);
    return fallbackState;
  }
}

// Save panel state to sessionStorage
export function savePanelPosition(
  componentName: string,
  panelId: string,
  position: PanelPosition,
  collapsed?: boolean
): void {
  try {
    const storageKey = `panel_${componentName}_${panelId}`;
    const panelState = { position, collapsed };
    sessionStorage.setItem(storageKey, JSON.stringify(panelState));
  } catch (error) {
    console.error('Failed to save panel state:', error);
  }
}

// Load panel state from sessionStorage with fallback
export function loadPanelState(
  componentName: string,
  panelId: string
): { position: PanelPosition; collapsed?: boolean } {
  try {
    const storageKey = `panel_${componentName}_${panelId}`;
    const savedState = sessionStorage.getItem(storageKey);
    
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      // Handle older format where it was just the position
      if (!parsedState.position && typeof parsedState.x === 'number') {
        return { 
          position: parsedState,
          collapsed: false
        };
      }
      
      return parsedState;
    }
    
    // Use default positions if nothing is saved
    return { 
      position: DEFAULT_PANEL_POSITIONS[panelId] || { x: 20, y: 20 },
      collapsed: false
    };
  } catch (error) {
    console.error('Failed to load panel state:', error);
    return { 
      position: { x: 20, y: 20 },
      collapsed: false
    };
  }
}

// Backward-compatible function for just loading position
export function loadPanelPosition(
  componentName: string,
  panelId: string
): PanelPosition {
  const state = loadPanelState(componentName, panelId);
  return state.position;
}

// Reset all panel positions to defaults
export function resetPanelPositions(): void {
  try {
    // Find all panel position keys in sessionStorage
    const panelKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('panel_')) {
        panelKeys.push(key);
      }
    }
    
    // Clear the panel positions
    panelKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    // Force a page reload to apply default positions
    window.location.reload();
  } catch (error) {
    console.error('Failed to reset panel positions:', error);
  }
}

// Check if panel would be offscreen and fix position if needed
export function ensurePanelOnScreen(position: PanelPosition, panelWidth = 300, panelHeight = 400): PanelPosition {
  if (typeof window === 'undefined') {
    return position;
  }
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Make sure panel doesn't go off-screen
  const safeX = Math.max(10, Math.min(position.x, viewportWidth - panelWidth - 10));
  const safeY = Math.max(10, Math.min(position.y, viewportHeight - panelHeight - 10));
  
  return { x: safeX, y: safeY };
}

// Create a DraggablePanel component in React
export function setupCustomDragging(
  panelElement: HTMLElement,
  handleElement: HTMLElement,
  initialPosition: PanelPosition,
  onPositionChange: (position: PanelPosition) => void
): () => void {
  if (!panelElement || !handleElement) {
    return () => {}; // Return empty cleanup function if elements don't exist
  }
  
  let isDragging = false;
  let startX = 0, startY = 0;
  let startPosX = 0, startPosY = 0;
  
  const onMouseDown = (e: MouseEvent) => {
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    // Don't handle clicks on children of the handle (like buttons)
    if (e.target !== handleElement && !handleElement.contains(e.target as Node)) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startPosX = initialPosition.x;
    startPosY = initialPosition.y;
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  
  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const newX = startPosX + dx;
    const newY = startPosY + dy;
    
    // Apply the new position directly
    panelElement.style.left = `${newX}px`;
    panelElement.style.top = `${newY}px`;
  };
  
  const onMouseUp = (e: MouseEvent) => {
    if (!isDragging) return;
    
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    const newX = startPosX + dx;
    const newY = startPosY + dy;
    
    // Ensure panel is on screen
    const safePosition = ensurePanelOnScreen({ x: newX, y: newY });
    
    // Update position in parent component
    onPositionChange(safePosition);
    
    // Also directly update the element for immediate visual feedback
    panelElement.style.left = `${safePosition.x}px`;
    panelElement.style.top = `${safePosition.y}px`;
  };
  
  // Add the mousedown listener
  handleElement.addEventListener('mousedown', onMouseDown);
  
  // Return cleanup function
  return () => {
    handleElement.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
}