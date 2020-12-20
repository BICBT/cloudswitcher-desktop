import './Switcher.scss'
import React from 'react';
import { PVWKeyboard } from './PVWKeyboard';
import { PGMSKeyboard } from './PGMKeyboard';
import { TransitionView } from './TransitionView';
import { CGTable } from './CGTable';
import { DDRTable } from './DDRTable';
import { Keyboard } from './Keyboard';

export class Switcher extends React.Component {

  public render() {
    return (
      <div className='Switcher'>
        <div className='Switcher-container'>
          <Keyboard />
          <TransitionView />
        </div>
        <div className='PlayList-container'>
          <CGTable />
          <DDRTable />
        </div>
      </div>
    );
  }
}
