import './ProgramLive.scss';
import React from 'react';
import { Container } from 'typedi';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Output } from '../../../common/types';
import { OutputService } from '../../../service/OutputService';

type ProgramLiveState = {
  output?: Output;
};

export class ProgramLive extends React.Component<{}, ProgramLiveState> {
  private readonly outputService = Container.get(OutputService);

  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public async componentDidMount() {
    this.outputService.outputChanged.on(this, output => {
      this.setState({
        output: output,
      });
    });
    this.setState({
      output: await this.outputService.getOutput(),
    });
  }

  public componentWillUnmount() {
    this.outputService.outputChanged.off(this);
  }

  public render() {
    return (
      <div className='ProgramLive'>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.output &&
              <DisplayView
                key={this.state.output.url}
                sourceId={this.state.output.id}
                displayId={this.state.output.id}
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
