import React from 'react';
import { Shape } from '../types';
import { midiNoteToName } from '../utils/midiUtils';
import { Trash2, X, Save } from 'lucide-react';

interface ShapeEditorProps {
  shape: Shape;
  onUpdate: (updatedShape: Shape) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const ShapeEditor: React.FC<ShapeEditorProps> = ({ shape, onUpdate, onDelete, onClose }) => {
  const handleChange = (field: keyof Shape, value: any) => {
    onUpdate({ ...shape, [field]: value });
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-gray-900/90 backdrop-blur-md text-white p-6 rounded-xl border border-gray-700 shadow-2xl z-50 overflow-y-auto max-h-[90vh]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Edit Shape</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Label</label>
          <input
            type="text"
            value={shape.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
            placeholder="e.g. Bass Drum Polygon"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={shape.color}
              onChange={(e) => handleChange('color', e.target.value)}
              className="h-10 w-full bg-transparent cursor-pointer rounded overflow-hidden"
            />
          </div>
        </div>

        {/* MIDI Channel */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">MIDI Channel</label>
          <select
            value={shape.channel}
            onChange={(e) => handleChange('channel', parseInt(e.target.value))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
          >
            <option value={0}>Omni (All Channels)</option>
            {Array.from({ length: 16 }, (_, i) => i + 1).map(ch => (
              <option key={ch} value={ch}>Channel {ch}</option>
            ))}
          </select>
        </div>

        {/* Note Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Note Start</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="127"
                value={shape.noteStart}
                onChange={(e) => handleChange('noteStart', parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              />
              <span className="absolute right-2 top-2 text-xs text-gray-500">{midiNoteToName(shape.noteStart)}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Note End</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="127"
                value={shape.noteEnd}
                onChange={(e) => handleChange('noteEnd', parseInt(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              />
              <span className="absolute right-2 top-2 text-xs text-gray-500">{midiNoteToName(shape.noteEnd)}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 p-3 rounded text-xs text-gray-400">
           Triggers on notes {shape.noteStart} ({midiNoteToName(shape.noteStart)}) through {shape.noteEnd} ({midiNoteToName(shape.noteEnd)})
        </div>

        {/* Dynamics */}
        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="veloSensitive"
            checked={shape.velocitySensitive}
            onChange={(e) => handleChange('velocitySensitive', e.target.checked)}
            className="w-4 h-4 text-cyan-500 rounded focus:ring-cyan-500 bg-gray-700 border-gray-600"
          />
          <label htmlFor="veloSensitive" className="text-sm text-gray-300">Velocity Sensitive Opacity</label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
            Base Opacity: {Math.round(shape.baseOpacity * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={shape.baseOpacity}
            onChange={(e) => handleChange('baseOpacity', parseFloat(e.target.value))}
            className="w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-gray-700 mt-2">
           <button
            onClick={() => onDelete(shape.id)}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded transition-colors text-sm font-medium border border-red-500/20"
          >
            <Trash2 size={16} /> Delete Shape
          </button>
        </div>
      </div>
    </div>
  );
};
