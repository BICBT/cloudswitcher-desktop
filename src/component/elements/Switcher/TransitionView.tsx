import './TransitionView.scss';
import React, { ChangeEvent } from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/sourceService';
import { TransitionType } from '../../../common/types';

const transitions = [
  { value: TransitionType.Cut, label: '直接切换' },
  { value: TransitionType.Fade, label: '淡入淡出' },
  { value: TransitionType.Swipe, label: '滑入滑出' },
  { value: TransitionType.Slide, label: '幻灯片' },
];

type TransitionViewState = {
  transitionType: TransitionType;
}

export class TransitionView extends React.Component<{}, TransitionViewState> {
  private readonly sourceService = Container.get(SourceService);

  constructor(props: {}) {
    super(props);
    this.state = {
      transitionType: TransitionType.Cut,
    };
  }

  public render() {
    return (
      <div className='TransitionView'>
        <div className='transition-header'>
          <h2>切换特技</h2>
        </div>
        <div className='transition-content'>
          <select className='transition-dropdown'
                  value={this.state.transitionType}
                  onChange={option => this.onTransitionTypeChanged(option)}>
            {
              transitions.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))
            }
          </select>
          <button className='button button--default' onClick={() => this.onTakeClicked(this.state.transitionType)}>TAKE</button>
        </div>
      </div>
    );
  }

  private onTransitionTypeChanged(e: ChangeEvent<HTMLSelectElement>) {
    this.setState({
      transitionType: e.target.value as TransitionType,
    });
  }

  private async onTakeClicked(transitionType: TransitionType) {
    if (this.sourceService.previewSource) {
      await this.sourceService.take(this.sourceService.previewSource, transitionType, 3000);
    }
  }
}
