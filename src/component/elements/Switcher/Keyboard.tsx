import './Keyboard.scss';
import React from 'react';
import { PVWKeyboard } from './PVWKeyboard';
import { PGMSKeyboard } from './PGMKeyboard';

export class Keyboard extends React.Component<{}, {}> {

  public render() {
    return (
      <div className='Keyboard'>
        <PVWKeyboard />
        <PGMSKeyboard />
      </div>
    );
  }
}
