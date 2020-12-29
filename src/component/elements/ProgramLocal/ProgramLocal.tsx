import './ProgramLocal.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/sourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Transition } from '../../../common/types';

type ProgramLocalState = {
  programTransition?: Transition;
};

export class ProgramLocal extends React.Component<{}, ProgramLocalState> {
  private readonly sourceService: SourceService = Container.get(SourceService);

  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public componentDidMount() {
    this.setState({
      programTransition: this.sourceService.programTransition,
    });
    this.sourceService.programChanged.on(this, transition => {
      this.setState({
        programTransition: transition,
      })
    });
  }

  public componentWillUnmount() {
    this.sourceService.programChanged.off(this);
  }

  public render() {
    return (
      <div className={`ProgramLocal ${this.state.programTransition ? 'isProgram': ''}`}>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.programTransition &&
              <DisplayView
                key={this.state.programTransition.id}
                source={this.state.programTransition.source}
                displayId={this.state.programTransition.id}
              />
            }
          </div>
        </div>
        <div className='toolbar'>
          <h2>PGM输出</h2>
        </div>
      </div>
    );
  }
}
