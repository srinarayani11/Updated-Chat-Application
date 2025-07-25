// src/components/VirtualKeyboard.tsx
import React from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import './VirtualKeyboard.css';

interface Props {
  onChange: (input: string) => void;
}

const VirtualKeyboard = ({ onChange }: Props) => {
  return (
    <div className="virtual-keyboard">
      <Keyboard
        onChange={onChange}
        theme="hg-theme-default hg-layout-default myTheme"
        layout={{
          default: [
            '1 2 3 4 5 6 7 8 9 0',
            'q w e r t y u i o p',
            'a s d f g h j k l',
            'z x c v b n m',
            '{space} {bksp}',
          ],
        }}
        display={{
          '{bksp}': '⌫',
          '{space}': '␣',
        }}
      />
    </div>
  );
};

export default VirtualKeyboard;
