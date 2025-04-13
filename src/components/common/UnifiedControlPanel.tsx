import React from 'react';
import { DraggablePanel, CollapsibleSection } from './';

interface SectionConfig {
  id: string;
  title: string;
  initialCollapsed?: boolean;
  content: React.ReactNode;
}

interface UnifiedControlPanelProps {
  title: string;
  componentName: string;
  panelId: string;
  sections: SectionConfig[];
  initialPosition?: { x: number; y: number };
  initialCollapsed?: boolean;
  onPositionChange?: (position: { x: number; y: number }) => void;
  theme?: 'dark' | 'light';
  initialWidth?: number;
  initialHeight?: number | 'auto';
}

export default function UnifiedControlPanel({
  title,
  componentName,
  panelId,
  sections,
  initialPosition,
  initialCollapsed = false,
  onPositionChange,
  theme = 'dark',
  initialWidth = 350,
  initialHeight = 'auto'
}: UnifiedControlPanelProps) {
  return (
    <DraggablePanel
      title={title}
      componentName={componentName}
      panelId={panelId}
      initialPosition={initialPosition}
      initialCollapsed={initialCollapsed}
      onPositionChange={onPositionChange}
      theme={theme}
      initialWidth={initialWidth}
      initialHeight={initialHeight}
    >
      <div className="space-y-2">
        {sections.map((section) => (
          <CollapsibleSection 
            key={section.id}
            title={section.title}
            initialCollapsed={section.initialCollapsed}
          >
            {section.content}
          </CollapsibleSection>
        ))}
      </div>
    </DraggablePanel>
  );
}