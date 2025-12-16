export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  name: string;
  points: Point[]; // Coordinates in percentage (0-100)
  
  // MIDI Config
  channel: number; // 0 = Omni, 1-16
  noteStart: number; // 0-127
  noteEnd: number; // 0-127
  
  // Visual Config
  color: string;
  velocitySensitive: boolean; // If true, opacity scales with velocity
  baseOpacity: number; // 0-1
}

export interface MidiMessage {
  command: number;
  channel: number;
  note: number;
  velocity: number;
  timestamp: number;
}

export interface ActiveNote {
  velocity: number;
  timestamp: number;
}

// Map key: "channel-note" -> ActiveNote
export type ActiveNotesMap = Map<string, ActiveNote>;

export enum AppMode {
  EDIT = 'EDIT',
  PERFORMANCE = 'PERFORMANCE'
}

// Web MIDI API Types
export interface MIDIMessageEvent {
  data: Uint8Array;
}

export interface MIDIInput {
  id: string;
  name: string;
  onmidimessage: ((event: MIDIMessageEvent) => void) | null;
}

export interface MIDIAccess {
  inputs: Map<string, MIDIInput>;
  onstatechange: ((event: any) => void) | null;
}
