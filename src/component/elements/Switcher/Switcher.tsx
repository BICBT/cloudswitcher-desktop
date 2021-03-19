import './Switcher.scss'
import React from 'react';
import { TransitionView } from './TransitionView';
import { CGTable } from './CGTable';
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
        </div>
      </div>
    );
  }
}
