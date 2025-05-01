// src/components/Rubber.tsx
//import { useState } from 'react';

interface RubberProps {
  onActivate: () => void;
}

export const Rubber = ({ onActivate }: RubberProps) => {
  return (
    <button
      onClick={onActivate}
      className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
    >
      Eraser
    </button>
  );
};
