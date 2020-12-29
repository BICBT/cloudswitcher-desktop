import './ProgramLive.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/sourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Source } from '../../../common/types';

type ProgramLiveState = {
  liveSource?: Source;
};

export class ProgramLive extends React.Component<{}, ProgramLiveState> {
  private readonly sourceService: SourceService = Container.get(SourceService);

  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public componentDidMount() {
    this.setState({
      liveSource: this.sourceService.liveSource,
    });
    this.sourceService.liveChanged.on(this, source => {
      this.setState({
        liveSource: source,
      });
    });
  }

  public componentWillUnmount() {
    this.sourceService.liveChanged.off(this);
  }

  public render() {
    return (
      <div className='ProgramLive'>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.liveSource &&
              <DisplayView
                key={this.state.liveSource.url}
                source={this.state.liveSource}
                displayId={this.state.liveSource.id}
              />
            }
          </div>
        </div>
        <div className='toolbar'>
          <h2>LIVE输出</h2>
        </div>
      </div>
    );
  }
}
