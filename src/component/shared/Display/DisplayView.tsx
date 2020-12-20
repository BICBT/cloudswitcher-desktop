import './DisplayView.scss';
import React from 'react';
import { Display } from './Display';
import { AudioVolmeter } from './AudioVolmeter';
import { Source } from '../../../common/types';

export interface DisplayViewProps {
  source: Source;
  displayId: string;
}

export class DisplayView extends React.Component<DisplayViewProps, any> {

  public render() {
    return (
      <div className='DisplayView'>
        <Display displayId={this.props.displayId} />
        <AudioVolmeter source={this.props.source} />
      </div>
    );
  }
}
