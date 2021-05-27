import './DisplayView.scss';
import React from 'react';
import { Display } from './Display';
import { AudioVolmeter } from './AudioVolmeter';

export interface DisplayViewProps {
  sourceId: string;
  displayIds: string[];
}

export class DisplayView extends React.Component<DisplayViewProps, any> {

  public render() {
    return (
      <div className='DisplayView'>
        <Display displayIds={this.props.displayIds} />
        <AudioVolmeter sourceId={this.props.sourceId} />
      </div>
    );
  }
}
