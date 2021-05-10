import './DisplayView.scss';
import React from 'react';
import { Display } from './Display';
import { AudioVolmeter } from './AudioVolmeter';

export interface DisplayViewProps {
  sourceId: string;
  displayId: string;
}

export class DisplayView extends React.Component<DisplayViewProps, any> {

  public render() {
    return (
      <div className='DisplayView'>
        <Display displayId={this.props.displayId} />
        <AudioVolmeter sourceId={this.props.sourceId} />
      </div>
    );
  }
}
