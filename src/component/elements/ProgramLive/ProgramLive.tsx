import './ProgramLive.scss';
import React from 'react';
import { Container } from 'typedi';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Output } from '../../../common/types';
import { OutputService } from '../../../service/OutputService';

type ProgramLiveState = {
  output?: Output;
  displayKey: number;
};

export class ProgramLive extends React.Component<{}, ProgramLiveState> {
  private readonly outputService = Container.get(OutputService);

  constructor(props: {}) {
    super(props);
    this.state = {
      displayKey: 0,
    };
  }

  public async componentDidMount() {
    this.outputService.outputChanged.on(this, output => {
      this.setState({
        output: output,
        displayKey: this.state.displayKey + 1,
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
                key={this.state.displayKey}
                sourceId={this.state.output.id}
                displayIds={[this.state.output.id]}
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
