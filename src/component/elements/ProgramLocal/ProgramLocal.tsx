import './ProgramLocal.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/SourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Transition } from '../../../common/types';

type ProgramLocalState = {
  programTransition?: Transition;
  displayKey: number;
};

export class ProgramLocal extends React.Component<{}, ProgramLocalState> {
  private readonly sourceService: SourceService = Container.get(SourceService);

  constructor(props: {}) {
    super(props);
    this.state = {
      displayKey: 0,
    };
  }

  public async componentDidMount() {
    this.sourceService.programChanged.on(this, event => {
      this.setState({
        programTransition: event.current,
      });
    });
    this.sourceService.sourcePreviewChanged.on(this, source => {
      if (this.state.programTransition?.source.id === source.id) {
        this.setState({
          displayKey: this.state.displayKey + 1,
        });
      }
    });
    this.setState({
      programTransition: await this.sourceService.getProgramTransition(),
    });
  }

  public componentWillUnmount() {
    this.sourceService.programChanged.off(this);
    this.sourceService.sourcePreviewChanged.off(this);
  }

  public render() {
    return (
      <div className={`ProgramLocal ${this.state.programTransition ? 'isProgram': ''}`}>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.programTransition &&
              <DisplayView
                key={`${this.state.programTransition.source.id}-${this.state.displayKey}`}
                sourceId={this.state.programTransition.source.id}
                displayId='output'
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
