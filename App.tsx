import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectionCanvas } from './components/ProjectionCanvas';
import { ShapeEditor } from './components/ShapeEditor';
import { MappingList } from './components/MappingList';
import { Shape, Point, ActiveNotesMap, AppMode, MidiMessage, MIDIAccess, MIDIInput, MIDIMessageEvent } from './types';
import { parseMidiMessage, getNoteKey } from './utils/midiUtils';
import { 
  Settings, 
  Maximize, 
  Download, 
  Upload, 
  Cable, 
  Play, 
  Square,
  List,
  EyeOff,
  Plus
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<ActiveNotesMap>(new Map());
  const [mode, setMode] = useState<AppMode>(AppMode.EDIT);
  const [showMatrix, setShowMatrix] = useState(false);
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [midiInputs, setMidiInputs] = useState<MIDIInput[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  
  // Use a ref for active notes to update visually without always re-rendering entire React tree if we optimize later.
  // For now, we sync ref to state for React rendering.
  const activeNotesRef = useRef<ActiveNotesMap>(new Map());

  // --- MIDI Setup ---
  useEffect(() => {
    const onMIDISuccess = (access: MIDIAccess) => {
      setMidiAccess(access);
      const inputs = Array.from(access.inputs.values());
      setMidiInputs(inputs);
      if (inputs.length > 0) {
        setSelectedInputId(inputs[0].id);
      }
      
      access.onstatechange = (e) => {
        setMidiInputs(Array.from(access.inputs.values()));
      };
    };

    const onMIDIFailure = () => {
      console.error('Could not access your MIDI devices.');
    };

    if ((navigator as any).requestMIDIAccess) {
      (navigator as any).requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Allow exiting performance mode with Escape
      if (e.key === 'Escape' && mode === AppMode.PERFORMANCE) {
        setMode(AppMode.EDIT);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [mode]);

  // --- MIDI Message Handling ---
  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const { command, channel, note, velocity } = parseMidiMessage(event.data);
    const key = getNoteKey(channel, note);
    const newMap = new Map(activeNotesRef.current);

    // Note On (usually 9, but sometimes 9 with vel 0 is note off)
    if (command === 9 && velocity > 0) {
      newMap.set(key, { velocity, timestamp: Date.now() });
    } 
    // Note Off (8) or Note On with 0 velocity
    else if (command === 8 || (command === 9 && velocity === 0)) {
      newMap.delete(key);
    }
    
    // We update the Ref immediately for logic
    activeNotesRef.current = newMap;
    // We update state to trigger render
    setActiveNotes(newMap);
  }, []);

  // Attach listener to selected input
  useEffect(() => {
    if (!midiAccess || !selectedInputId) return;

    const input = midiAccess.inputs.get(selectedInputId);
    if (!input) return;

    input.onmidimessage = handleMidiMessage;

    return () => {
      input.onmidimessage = null;
    };
  }, [midiAccess, selectedInputId, handleMidiMessage]);

  // --- Shape Management ---
  const handleNewShape = (points: Point[]) => {
    const newShape: Shape = {
      id: crypto.randomUUID(),
      name: `Shape ${shapes.length + 1}`,
      points,
      channel: 0, // Omni
      noteStart: 60, // Middle C
      noteEnd: 60,
      color: '#00ffcc',
      velocitySensitive: false,
      baseOpacity: 1.0,
    };
    setShapes([...shapes, newShape]);
    setSelectedShapeId(newShape.id);
  };

  const updateShape = (updated: Shape) => {
    setShapes(shapes.map(s => s.id === updated.id ? updated : s));
  };

  const deleteShape = (id: string) => {
    setShapes(shapes.filter(s => s.id !== id));
    if (selectedShapeId === id) setSelectedShapeId(null);
  };

  // --- Data Persistence ---
  const saveProject = () => {
    const data = JSON.stringify(shapes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumamap-project-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setShapes(parsed);
          alert('Project loaded successfully!');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to load project file.');
      }
    };
    reader.readAsText(file);
  };

  const selectedShape = shapes.find(s => s.id === selectedShapeId);

  return (
    <div className="flex flex-col w-full h-screen bg-black text-white overflow-hidden">
      
      {/* Top Bar - Hidden in Performance Mode unless hovered (or use keyboard to toggle) */}
      {mode === AppMode.EDIT && (
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-xl tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              LumaMap
            </h1>
            
            <div className="h-6 w-px bg-gray-700 mx-2"></div>
            
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Cable size={16} />
              <select 
                value={selectedInputId}
                onChange={(e) => setSelectedInputId(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white outline-none focus:ring-1 focus:ring-cyan-500 max-w-[200px]"
              >
                {midiInputs.length === 0 && <option value="">No MIDI Devices</option>}
                {midiInputs.map(input => (
                  <option key={input.id} value={input.id}>{input.name}</option>
                ))}
              </select>
            </div>
            
            {activeNotes.size > 0 && (
               <span className="flex items-center gap-1 text-xs text-green-400 animate-pulse">
                 <span className="w-2 h-2 rounded-full bg-green-400 block"></span>
                 MIDI In
               </span>
            )}
          </div>

          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowMatrix(!showMatrix)}
               className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${showMatrix ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
             >
               <List size={16} /> Matrix
             </button>

             <div className="h-6 w-px bg-gray-700 mx-1"></div>

             <button onClick={saveProject} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors" title="Save Project">
                <Download size={18} />
             </button>
             <label className="p-2 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer" title="Load Project">
                <Upload size={18} />
                <input type="file" accept=".json" onChange={loadProject} className="hidden" />
             </label>

             <div className="h-6 w-px bg-gray-700 mx-1"></div>

             <button
               onClick={() => setMode(AppMode.PERFORMANCE)}
               className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-4 py-1.5 rounded-full font-medium text-sm transition-all shadow-lg shadow-cyan-900/20"
             >
               <Play size={16} fill="currentColor" /> Perform
             </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* Canvas Layer */}
        <div className="flex-1 relative z-10">
          <ProjectionCanvas 
            shapes={shapes}
            activeNotes={activeNotes}
            mode={mode}
            selectedShapeId={selectedShapeId}
            onShapeSelect={setSelectedShapeId}
            onShapeUpdate={updateShape}
            onNewShapePoints={handleNewShape}
          />
        </div>

        {/* Matrix View Overlay (only in Edit mode) */}
        {mode === AppMode.EDIT && showMatrix && (
          <div className="absolute top-0 left-0 bottom-0 w-96 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 z-30 flex flex-col transform transition-transform duration-300">
             <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="font-bold text-gray-200">Mappings Matrix</h2>
                <button onClick={() => setShowMatrix(false)} className="text-gray-400 hover:text-white"><EyeOff size={16} /></button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar">
                <MappingList 
                  shapes={shapes}
                  selectedId={selectedShapeId}
                  onSelect={setSelectedShapeId}
                  onDelete={deleteShape}
                />
             </div>
          </div>
        )}

        {/* Sidebar Editor (only in Edit mode when shape selected) */}
        {mode === AppMode.EDIT && selectedShape && (
          <ShapeEditor 
            shape={selectedShape}
            onUpdate={updateShape}
            onDelete={deleteShape}
            onClose={() => setSelectedShapeId(null)}
          />
        )}
      </div>

      {/* Performance Mode Exit Button (Floating) - Visual fallback */}
      {mode === AppMode.PERFORMANCE && (
        <button
          onClick={() => setMode(AppMode.EDIT)}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black text-white/30 hover:text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 hover:opacity-100 group"
          title="Exit Performance Mode (Esc)"
        >
          <Square size={24} fill="currentColor" />
          <span className="absolute right-full mr-2 top-2 bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap hidden group-hover:block">Press ESC to exit</span>
        </button>
      )}
    </div>
  );
};

export default App;