export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const midiNoteToName = (note: number): string => {
  const octave = Math.floor(note / 12) - 1;
  const name = NOTE_NAMES[note % 12];
  return `${name}${octave}`;
};

export const parseMidiMessage = (data: Uint8Array) => {
  const command = data[0] >> 4;
  const channel = (data[0] & 0xf) + 1;
  const note = data[1];
  const velocity = data.length > 2 ? data[2] : 0;

  return { command, channel, note, velocity };
};

// Generate a unique key for the active notes map
export const getNoteKey = (channel: number, note: number) => `${channel}-${note}`;
