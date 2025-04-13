import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { savePanelPosition, loadPanelPosition, loadPanelState, ensurePanelOnScreen } from '../../utils/controlStateManager';

interface ResizeHandleProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onResize: (deltaX: number, deltaY: number, position: string) => void;
}

interface DraggablePanelProps {
  children: ReactNode;
  title: string;
  componentName: string;
  panelId: string;
  initialWidth?: number;
  initialHeight?: number | 'auto';
  initialPosition?: { x: number; y: number };
  initialCollapsed?: boolean;
  theme?: 'dark' | 'light';
  onPositionChange?: (position: { x: number; y: number }) => void;
  onResize?: (size: { width: number; height: number }) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

// Resize handle component for the panel corners
const ResizeHandle = ({ position, onResize }: ResizeHandleProps) => {
  const handleRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;
    
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      e.preventDefault();
      e.stopPropagation();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      onResize(deltaX, deltaY, position);
      
      startX = e.clientX;
      startY = e.clientY;
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    handle.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      handle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [position, onResize]);
  
  // Position styles for each corner
  const getPositionStyles = () => {
    const baseStyles = "w-6 h-6 bg-transparent cursor-nwse-resize absolute z-50 hover:opacity-100 opacity-20";
    
    switch (position) {
      case 'top-left':
        return `${baseStyles} -top-3 -left-3 cursor-nwse-resize`;
      case 'top-right':
        return `${baseStyles} -top-3 -right-3 cursor-nesw-resize`;
      case 'bottom-left':
        return `${baseStyles} -bottom-3 -left-3 cursor-nesw-resize`;
      case 'bottom-right':
        return `${baseStyles} -bottom-3 -right-3 cursor-nwse-resize`;
      default:
        return baseStyles;
    }
  };
  
  return (
    <div 
      ref={handleRef}
      className={getPositionStyles()}
      // Show a small visual indicator of the resize handle on hover
      style={{
        backdropFilter: 'blur(2px)',
        boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.2)'
      }}
    >
      <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-70" />
    </div>
  );
};

// Main draggable panel component - use memo for better performance
export default React.memo(function DraggablePanel({
  children,
  title,
  componentName,
  panelId,
  initialWidth = 320,
  initialHeight = 'auto', // Change to auto height by default
  initialPosition,
  initialCollapsed = false,
  theme = 'dark',
  onPositionChange,
  onResize,
  onCollapseChange
}: DraggablePanelProps) {
  // Load saved state or use provided initial values
  const savedState = loadPanelState(componentName, panelId);
  const effectiveInitialPosition = initialPosition || savedState.position;
  const effectiveInitialCollapsed = savedState.collapsed !== undefined ? savedState.collapsed : initialCollapsed;
  
  // State for panel position, size, and collapse state
  const [position, setPosition] = useState(effectiveInitialPosition);
  const [size, setSize] = useState({ 
    width: initialWidth, 
    height: initialHeight === 'auto' ? 'auto' : initialHeight 
  });
  const [collapsed, setCollapsed] = useState(effectiveInitialCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for DOM elements
  const panelRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  
  // Enhanced drag operations with improved vertical movement
  useEffect(() => {
    const panel = panelRef.current;
    const titleBar = titleBarRef.current;
    
    if (!panel || !titleBar) return;
    
    let startX = 0;
    let startY = 0;
    let startPosX = position.x;
    let startPosY = position.y;
    let isDragActive = false; // Track drag state locally to avoid React state updates during drag
    
    const handleMouseDown = (e: MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      
      // Check if the click is on a child element like a button
      if (e.target !== titleBar && !titleBar.contains(e.target as Node)) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Set dragging visually and track locally
      setIsDragging(true);
      isDragActive = true;
      
      // Store initial cursor and position
      startX = e.clientX;
      startY = e.clientY;
      startPosX = position.x;
      startPosY = position.y;
      
      // Use capture phase for the events
      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('mouseup', handleMouseUp, true);
      
      // Mark the panel being dragged
      panel.setAttribute('data-dragging', 'true');
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragActive) return;
      
      // Stop propagation to prevent other handlers
      e.stopPropagation();
      
      // Calculate the movement delta
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // Calculate new position
      const newX = startPosX + dx;
      const newY = startPosY + dy;
      
      // Apply directly to DOM for smooth movement
      panel.style.left = `${newX}px`;
      panel.style.top = `${newY}px`;
      
      // Check if console logs are needed for debugging
      if (Math.abs(dy) > 5) {
        console.log('Vertical movement:', dy, 'New Y:', newY);
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (!isDragActive) return;
      
      // Stop propagation and prevent default
      e.stopPropagation();
      e.preventDefault();
      
      // Clear dragging state
      isDragActive = false;
      setIsDragging(false);
      panel.removeAttribute('data-dragging');
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      
      // Calculate final delta
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // Calculate new position
      const newX = startPosX + dx;
      const newY = startPosY + dy;
      
      // Apply bounds checking
      const effectiveHeight = typeof size.height === 'number' ? size.height : panel.offsetHeight;
      const safePosition = ensurePanelOnScreen(
        { x: newX, y: newY },
        size.width,
        effectiveHeight
      );
      
      // Update position state
      setPosition(safePosition);
      
      // Save position and collapse state to storage
      savePanelPosition(componentName, panelId, safePosition, collapsed);
      
      // Call position change callback if provided
      if (onPositionChange) {
        onPositionChange(safePosition);
      }
    };
    
    // Add mouse event listeners
    titleBar.addEventListener('mousedown', handleMouseDown);
    
    // Add touch support for mobile devices
    const handleTouchStart = (e: TouchEvent) => {
      // Prevent scrolling while dragging
      e.preventDefault();
      
      // Set dragging state
      setIsDragging(true);
      isDragActive = true;
      
      // Store initial touch position
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        startPosX = position.x;
        startPosY = position.y;
        
        // Mark panel as being dragged
        panel.setAttribute('data-dragging', 'true');
        
        // Add touch move and end listeners
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragActive) return;
      
      // Prevent scrolling while dragging
      e.preventDefault();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        
        // Calculate the movement delta
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        
        // Calculate new position
        const newX = startPosX + dx;
        const newY = startPosY + dy;
        
        // Apply directly to DOM for smooth movement
        panel.style.left = `${newX}px`;
        panel.style.top = `${newY}px`;
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragActive) return;
      
      // Clear dragging state
      isDragActive = false;
      setIsDragging(false);
      panel.removeAttribute('data-dragging');
      
      // Remove event listeners
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      
      // Only process if we have the last touch position
      if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        
        // Calculate final delta
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        
        // Calculate new position
        const newX = startPosX + dx;
        const newY = startPosY + dy;
        
        // Apply bounds checking
        const effectiveHeight = typeof size.height === 'number' ? size.height : panel.offsetHeight;
        const safePosition = ensurePanelOnScreen(
          { x: newX, y: newY },
          size.width,
          effectiveHeight
        );
        
        // Update position state
        setPosition(safePosition);
        
        // Save position and collapse state to storage
        savePanelPosition(componentName, panelId, safePosition, collapsed);
        
        // Call position change callback if provided
        if (onPositionChange) {
          onPositionChange(safePosition);
        }
      }
    };
    
    // Add touch event listeners
    titleBar.addEventListener('touchstart', handleTouchStart, { passive: false });
    
    // Ensure cleanup
    return () => {
      // Mouse events
      titleBar.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      
      // Touch events
      titleBar.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    position, 
    isDragging, 
    componentName, 
    panelId, 
    onPositionChange, 
    size.width, 
    size.height
  ]);
  
  // Handle resize operations
  const handleResize = (deltaX: number, deltaY: number, resizePosition: string) => {
    // Only adjust width if auto height is used
    const isAutoHeight = size.height === 'auto';
    
    let newWidth = size.width;
    let newHeight = isAutoHeight ? 'auto' : size.height as number;
    let newX = position.x;
    let newY = position.y;
    
    // Get current panel height for calculations even if auto
    const currentHeight = isAutoHeight && panelRef.current 
      ? panelRef.current.offsetHeight 
      : (size.height as number);
    
    // Update size and position based on which handle is being dragged
    switch (resizePosition) {
      case 'top-left':
        newWidth = Math.max(200, size.width - deltaX);
        if (!isAutoHeight) {
          newHeight = Math.max(150, currentHeight - deltaY) as number;
        }
        newX = position.x + (size.width - newWidth);
        if (!isAutoHeight) {
          newY = position.y + (currentHeight - (newHeight as number));
        }
        break;
      case 'top-right':
        newWidth = Math.max(200, size.width + deltaX);
        if (!isAutoHeight) {
          newHeight = Math.max(150, currentHeight - deltaY) as number;
          newY = position.y + (currentHeight - (newHeight as number));
        }
        break;
      case 'bottom-left':
        newWidth = Math.max(200, size.width - deltaX);
        if (!isAutoHeight) {
          newHeight = Math.max(150, currentHeight + deltaY) as number;
        }
        newX = position.x + (size.width - newWidth);
        break;
      case 'bottom-right':
        newWidth = Math.max(200, size.width + deltaX);
        if (!isAutoHeight) {
          newHeight = Math.max(150, currentHeight + deltaY) as number;
        }
        break;
    }
    
    // Update size state
    setSize({ width: newWidth, height: newHeight });
    
    // Update position if needed (for top/left resizing)
    if (newX !== position.x || newY !== position.y) {
      // Get actual height for bounds checking
      const effectiveHeight = isAutoHeight && panelRef.current 
        ? panelRef.current.offsetHeight 
        : (newHeight as number);
      
      // Ensure panel stays on screen
      const safePosition = ensurePanelOnScreen(
        { x: newX, y: newY },
        newWidth,
        effectiveHeight
      );
      
      setPosition(safePosition);
      
      // Save position and collapse state to storage
      savePanelPosition(componentName, panelId, safePosition, collapsed);
      
      // Call position change callback if provided
      if (onPositionChange) {
        onPositionChange(safePosition);
      }
    }
    
    // Call resize callback if provided
    if (onResize) {
      onResize({ width: newWidth, height: typeof newHeight === 'number' ? newHeight : 0 });
    }
    
    // Apply size directly to element for smooth resizing
    if (panelRef.current) {
      panelRef.current.style.width = `${newWidth}px`;
      
      // Only set height if not auto
      if (!isAutoHeight) {
        panelRef.current.style.height = `${newHeight}px`;
      } else {
        panelRef.current.style.height = 'auto';
      }
      
      panelRef.current.style.left = `${newX}px`;
      panelRef.current.style.top = `${newY}px`;
    }
  };
  
  // Set initial panel position and size
  useEffect(() => {
    if (panelRef.current) {
      // Set width
      panelRef.current.style.width = `${size.width}px`;
      
      // Set height only if it's not auto
      if (size.height !== 'auto') {
        panelRef.current.style.height = `${size.height}px`;
      } else {
        panelRef.current.style.height = 'auto';
      }
      
      // Set position
      panelRef.current.style.left = `${position.x}px`;
      panelRef.current.style.top = `${position.y}px`;
    }
  }, [position.x, position.y, size.width, size.height]);
  
  // Set background based on theme
  const getThemeClasses = () => {
    return theme === 'dark'
      ? 'bg-gray-800 text-white border-gray-700'
      : 'bg-white text-gray-800 border-gray-300';
  };
  
  return (
    <div
      ref={panelRef}
      className={`fixed rounded-md border overflow-hidden shadow-lg ${getThemeClasses()} ${
        isDragging ? 'cursor-grabbing pointer-events-auto' : ''
      }`}
      style={{
        position: 'fixed',
        width: `${size.width}px`,
        height: size.height === 'auto' ? 'auto' : `${size.height}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9000, // Use high z-index to ensure the panel appears above other elements
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease-in-out',
        boxShadow: isDragging 
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Title bar with improved drag handle */}
      <div
        ref={titleBarRef}
        className={`p-3 font-medium border-b cursor-move ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
        } flex justify-between items-center select-none touch-none`}
        onMouseDown={(e) => {
          // Prevent default to stop any text selection
          e.preventDefault();
        }}
      >
        <div className="flex items-center">
          {/* Drag handle icon */}
          <div className="w-4 h-4 mr-2 opacity-60 flex flex-col justify-between">
            <div className="h-[2px] w-full bg-current"></div>
            <div className="h-[2px] w-full bg-current"></div>
            <div className="h-[2px] w-full bg-current"></div>
          </div>
          <div className="truncate">{title}</div>
        </div>
        <div className="flex space-x-1">
          {/* Collapse/expand button */}
          <button 
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              const newCollapsed = !collapsed;
              setCollapsed(newCollapsed);
              savePanelPosition(componentName, panelId, position, newCollapsed);
              if (onCollapseChange) {
                onCollapseChange(newCollapsed);
              }
            }}
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Main content - conditionally rendered based on collapsed state */}
      {!collapsed && (
        <div className="overflow-auto p-3" style={{ 
          maxHeight: size.height !== 'auto' ? `calc(100% - 46px)` : 'none',
          minHeight: '50px'
        }}>
          {children}
        </div>
      )}
      
      {/* Resize handles - only shown when not collapsed */}
      {!collapsed && (
        <>
          <ResizeHandle position="top-left" onResize={handleResize} />
          <ResizeHandle position="top-right" onResize={handleResize} />
          <ResizeHandle position="bottom-left" onResize={handleResize} />
          <ResizeHandle position="bottom-right" onResize={handleResize} />
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Use shallow comparison for props that would affect rendering
  return (
    prevProps.title === nextProps.title &&
    prevProps.theme === nextProps.theme &&
    prevProps.initialWidth === nextProps.initialWidth &&
    prevProps.initialHeight === nextProps.initialHeight
  );
});