import React, { useState, useEffect, useCallback } from 'react';
import './ResizableLayout.css';

const ResizableLayout = ({ leftPanel, mainContent, rightPanel }) => {
  const minLeftWidth = 200;
  const maxLeftWidth = 500;
  const minRightWidth = 250;
  const maxRightWidth = 600;

  // Initialize state with saved values from localStorage or defaults
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('inkwell-layout-left-width');
    const parsed = saved ? parseInt(saved, 10) : 300;
    return Math.max(minLeftWidth, Math.min(maxLeftWidth, parsed));
  });

  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('inkwell-layout-right-width');
    const parsed = saved ? parseInt(saved, 10) : 350;
    return Math.max(minRightWidth, Math.min(maxRightWidth, parsed));
  });

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const handleLeftMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  }, []);

  const handleRightMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDraggingRight(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDraggingLeft) {
      const newLeftWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, e.clientX));
      setLeftWidth(newLeftWidth);
      localStorage.setItem('inkwell-layout-left-width', newLeftWidth.toString());
    }
    
    if (isDraggingRight) {
      const newRightWidth = Math.max(minRightWidth, Math.min(maxRightWidth, window.innerWidth - e.clientX));
      setRightWidth(newRightWidth);
      localStorage.setItem('inkwell-layout-right-width', newRightWidth.toString());
    }
  }, [isDraggingLeft, isDraggingRight, minLeftWidth, maxLeftWidth, minRightWidth, maxRightWidth]);

  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
  }, []);

  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp]);

  return (
    <div className="resizable-layout">
      {/* Left Panel */}
      <div 
        className="resizable-left-panel" 
        style={{ width: leftWidth }}
      >
        {leftPanel}
      </div>

      {/* Left Resize Handle */}
      <div
        className={`resize-handle resize-handle-left ${isDraggingLeft ? 'dragging' : ''}`}
        style={{ left: leftWidth }}
        onMouseDown={handleLeftMouseDown}
      />

      {/* Main Content */}
      <div 
        className="resizable-main-content"
        style={{ 
          marginLeft: leftWidth + 4,
          marginRight: rightPanel ? rightWidth + 4 : 0
        }}
      >
        {mainContent}
      </div>

      {/* Right Resize Handle - only show if rightPanel exists */}
      {rightPanel && (
        <div
          className={`resize-handle resize-handle-right ${isDraggingRight ? 'dragging' : ''}`}
          style={{ right: rightWidth }}
          onMouseDown={handleRightMouseDown}
        />
      )}

      {/* Right Panel - only render if rightPanel exists */}
      {rightPanel && (
        <div 
          className="resizable-right-panel" 
          style={{ width: rightWidth }}
        >
          {rightPanel}
        </div>
      )}
    </div>
  );
};

export default ResizableLayout;