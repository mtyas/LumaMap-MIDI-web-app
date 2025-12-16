import React from 'react';
import { Shape } from '../types';
import { midiNoteToName } from '../utils/midiUtils';
import { Edit2, Trash2 } from 'lucide-react';

interface MappingListProps {
  shapes: Shape[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  selectedId: string | null;
}

export const MappingList: React.FC<MappingListProps> = ({ shapes, onSelect, onDelete, selectedId }) => {
  if (shapes.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>No shapes created yet.</p>
        <p className="text-sm mt-2">Draw on the canvas to start.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-semibold text-gray-400 border-b border-gray-700 uppercase tracking-wider">
            <th className="p-3">Name</th>
            <th className="p-3">Color</th>
            <th className="p-3">CH</th>
            <th className="p-3">Trigger</th>
            <th className="p-3">Dyn</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {shapes.map(shape => (
            <tr 
              key={shape.id} 
              className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${selectedId === shape.id ? 'bg-gray-800 ring-1 ring-cyan-500/50' : ''}`}
            >
              <td className="p-3 font-medium text-white">{shape.name}</td>
              <td className="p-3">
                <div 
                  className="w-4 h-4 rounded-full border border-white/20" 
                  style={{ backgroundColor: shape.color }}
                />
              </td>
              <td className="p-3 text-gray-300">{shape.channel === 0 ? 'All' : shape.channel}</td>
              <td className="p-3 text-gray-300">
                {shape.noteStart === shape.noteEnd 
                  ? `${shape.noteStart} (${midiNoteToName(shape.noteStart)})`
                  : `${midiNoteToName(shape.noteStart)} - ${midiNoteToName(shape.noteEnd)}`
                }
              </td>
              <td className="p-3 text-gray-300">
                {shape.velocitySensitive ? <span className="text-green-400 text-xs px-1 border border-green-400/30 rounded">VEL</span> : '-'}
              </td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => onSelect(shape.id)} 
                    className="p-1 hover:text-cyan-400 text-gray-400 transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => onDelete(shape.id)} 
                    className="p-1 hover:text-red-400 text-gray-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
