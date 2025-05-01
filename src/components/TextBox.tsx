// components/TextBox.tsx
import { useState } from 'react';

interface TextBoxProps {
  onTextSubmit: (text: string) => void;
}

const TextBox = ({ onTextSubmit }: TextBoxProps) => {
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  return (
    <div onClick={handleClick} className="relative w-[200px]">
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
          className="border border-gray-300 rounded px-2 py-1"
        />
      ) : (
        <span className="cursor-pointer text-gray-700">{text || 'Click to add text'}</span>
      )}
    </div>
  );
};

export default TextBox;
