import React, { useRef, useState, useEffect } from 'react';
import { Shape, Point, ActiveNotesMap, AppMode } from '../types';
import { getNoteKey } from '../utils/midiUtils';

interface ProjectionCanvasProps {
  shapes: Shape[];
  activeNotes: ActiveNotesMap;
  mode: AppMode;
  selectedShapeId: string | null;
  onShapeSelect: (id: string | null) => void;
  onShapeUpdate: (shape: Shape) => void;
  onNewShapePoints: (points: Point[]) => void;
}

export const ProjectionCanvas: React.FC<ProjectionCanvasProps> = ({
  shapes,
  activeNotes,
  mode,
  selectedShapeId,
  onShapeSelect,
  onShapeUpdate,
  onNewShapePoints
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);

  // Refs to hold latest state for event handlers without triggering re-binds
  const shapesRef = useRef(shapes);
  shapesRef.current = shapes;
  const selectedShapeIdRef = useRef(selectedShapeId);
  selectedShapeIdRef.current = selectedShapeId;

  // Helper to convert Client Coordinates to Percentage (0-100)
  const getCoords = (clientX: number, clientY: number): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    };
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (mode === AppMode.PERFORMANCE) return;
    
    // If clicking on background while selecting, deselect
    // We check if target is the SVG itself to avoid deselecting when clicking a shape
    if (selectedShapeId && !isDrawing && (e.target as Element).tagName === 'svg') {
      onShapeSelect(null);
      return;
    }

    if (!isDrawing && !selectedShapeId) {
       // Start drawing if nothing selected
       setIsDrawing(true);
       setDrawingPoints([getCoords(e.clientX, e.clientY)]);
    } else if (isDrawing) {
       // Add point
       setDrawingPoints(prev => [...prev, getCoords(e.clientX, e.clientY)]);
    }
  };

  const finishDrawing = () => {
    if (drawingPoints.length >= 3) {
      onNewShapePoints(drawingPoints);
    }
    setDrawingPoints([]);
    setIsDrawing(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (mode === AppMode.PERFORMANCE) return;

    if (e.key === 'Enter' && isDrawing) {
      finishDrawing();
    }
    if (e.key === 'Escape') {
      if (isDrawing) {
        setDrawingPoints([]);
        setIsDrawing(false);
      } else {
        onShapeSelect(null);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, drawingPoints, mode]);

  // Robust Point Dragging Logic using Refs
  useEffect(() => {
    if (draggedPointIndex === null) return;

    const handleWindowMouseMove = (e: MouseEvent) => {
      // Access latest state via refs
      const currentShapes = shapesRef.current;
      const currentId = selectedShapeIdRef.current;
      
      if (!currentId) return;
      const shape = currentShapes.find(s => s.id === currentId);
      if (!shape) return;

      const point = getCoords(e.clientX, e.clientY);
      // Clamp to 0-100 to keep inside canvas
      point.x = Math.max(0, Math.min(100, point.x));
      point.y = Math.max(0, Math.min(100, point.y));
      
      const newPoints = [...shape.points];
      newPoints[draggedPointIndex] = point;
      
      onShapeUpdate({ ...shape, points: newPoints });
    };

    const handleWindowMouseUp = () => {
      setDraggedPointIndex(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggedPointIndex, onShapeUpdate]); // Dependencies minimal to prevent re-binding

  // Logic to determine if a shape is active based on MIDI
  const isShapeActive = (shape: Shape): { active: boolean; velocity: number } => {
    let maxVelocity = 0;
    let isActive = false;

    for (let note = shape.noteStart; note <= shape.noteEnd; note++) {
      if (shape.channel === 0) {
        for (let ch = 1; ch <= 16; ch++) {
           const key = getNoteKey(ch, note);
           if (activeNotes.has(key)) {
             isActive = true;
             maxVelocity = Math.max(maxVelocity, activeNotes.get(key)!.velocity);
           }
        }
      } else {
        const key = getNoteKey(shape.channel, note);
        if (activeNotes.has(key)) {
          isActive = true;
          maxVelocity = Math.max(maxVelocity, activeNotes.get(key)!.velocity);
        }
      }
    }
    return { active: isActive, velocity: maxVelocity };
  };

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  return (
    <div className={`w-full h-full relative overflow-hidden ${mode === AppMode.PERFORMANCE ? 'cursor-none bg-black' : 'bg-gray-900 cursor-crosshair'}`}>
      {/* Grid for editing reference */}
      {mode === AppMode.EDIT && (
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ 
               backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', 
               backgroundSize: '5% 5%' 
             }} 
        />
      )}

      {/* SVG Container with viewBox */}
      <svg 
        ref={svgRef}
        className="w-full h-full absolute inset-0 block"
        onClick={handleSvgClick}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Render Existing Shapes */}
        {shapes.map(shape => {
          const { active, velocity } = isShapeActive(shape);
          const isSelected = shape.id === selectedShapeId;
          
          let opacity = 0;
          if (active) {
            opacity = shape.velocitySensitive 
              ? (velocity / 127) * shape.baseOpacity 
              : shape.baseOpacity;
          } else if (mode === AppMode.EDIT) {
             opacity = 0.2; 
          }

          const pointsStr = shape.points.map(p => `${p.x},${p.y}`).join(' ');

          return (
            <g key={shape.id} onClick={(e) => {
              if (mode === AppMode.EDIT) {
                e.stopPropagation();
                onShapeSelect(shape.id);
              }
            }}>
              <polygon
                points={pointsStr}
                fill={shape.color}
                fillOpacity={opacity}
                stroke={mode === AppMode.EDIT ? (isSelected ? '#22d3ee' : 'rgba(255,255,255,0.3)') : 'none'}
                strokeWidth={mode === AppMode.EDIT ? (isSelected ? 1.5 : 0.5) : 0}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-75 ease-out"
              />
              {mode === AppMode.EDIT && (
                <text 
                  x={shape.points[0].x} 
                  y={shape.points[0].y} 
                  fill="white" 
                  fontSize="2"
                  dy="-1"
                  className="pointer-events-none select-none drop-shadow-md"
                  style={{ textShadow: '0 1px 2px black' }}
                >
                  {shape.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Selected Shape Edit Handles */}
        {mode === AppMode.EDIT && selectedShape && !isDrawing && (
           <g>
             {/* Dashed outline connecting the dots */}
             <polygon
                points={selectedShape.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                vectorEffect="non-scaling-stroke"
                className="pointer-events-none"
             />
             {/* Draggable Handles */}
             {selectedShape.points.map((p, i) => (
               <circle
                 key={i}
                 cx={p.x}
                 cy={p.y}
                 r="1.5" 
                 fill="#22d3ee"
                 stroke="black"
                 strokeWidth="0.5"
                 vectorEffect="non-scaling-stroke"
                 className="cursor-move hover:fill-white transition-colors"
                 onMouseDown={(e) => {
                   e.stopPropagation();
                   e.preventDefault(); // Prevent text selection
                   setDraggedPointIndex(i);
                 }}
               />
             ))}
           </g>
        )}

        {/* Render Shape Currently Being Drawn */}
        {isDrawing && (
          <g className="pointer-events-none">
            <polyline
              points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1"
              strokeDasharray="1 1"
              vectorEffect="non-scaling-stroke"
            />
            {drawingPoints.map((p, i) => (
              <circle 
                key={i} 
                cx={p.x} 
                cy={p.y} 
                r="1"
                fill="#22d3ee" 
                vectorEffect="non-scaling-stroke" 
              />
            ))}
          </g>
        )}
      </svg>
      
      {/* Drawing Instructions Overlay */}
      {mode === AppMode.EDIT && isDrawing && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur border border-white/10 pointer-events-none">
          Click to add points • Press <span className="font-bold text-cyan-400">Enter</span> to finish • <span className="font-bold text-red-400">Esc</span> to cancel
        </div>
      )}
    </div>
  );
};
