/**
 * Utility functions for math operations used in the application
 */

// Angle conversion functions
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

// Constraint function to clamp values
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Linear interpolation
export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

// Vector operations
export type Vector2 = {
  x: number;
  y: number;
};

export function vectorAdd(a: Vector2, b: Vector2): Vector2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
}

export function vectorSubtract(a: Vector2, b: Vector2): Vector2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}

export function vectorMultiply(v: Vector2, scalar: number): Vector2 {
  return {
    x: v.x * scalar,
    y: v.y * scalar
  };
}

export function vectorDistance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Screen bound checking for UI elements
export function isPointInScreen(x: number, y: number, margin = 0): boolean {
  if (typeof window === 'undefined') return true;
  
  return (
    x >= margin &&
    x <= window.innerWidth - margin &&
    y >= margin &&
    y <= window.innerHeight - margin
  );
}

// Ensure a value is within screen bounds
export function constrainToScreen(
  point: Vector2, 
  elementWidth: number, 
  elementHeight: number, 
  margin = 10
): Vector2 {
  if (typeof window === 'undefined') return point;
  
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  return {
    x: clamp(point.x, margin, screenWidth - elementWidth - margin),
    y: clamp(point.y, margin, screenHeight - elementHeight - margin)
  };
}
