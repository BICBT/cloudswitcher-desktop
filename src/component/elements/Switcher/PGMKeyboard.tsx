import './PGMKeyboard.scss';
import React from 'react';
import { KeyView } from './KeyView';
import { Container } from 'typedi';
import { SourceService } from '../../../service/SourceService';
import { Source, Transition } from '../../../common/types';

const keyNames = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '10', '11', '12',
];

export class PGMKeyboardState {
  sources: Record<number, Source>;
  programTransition?: Transition;
}

export class PGMSKeyboard extends React.Component<{}, PGMKeyboardState> {
  private readonly sourceService = Container.get(SourceService);

  constructor(props: {}) {
    super(props);
    this.state = {
      sources: {},
    };
  }

  public async componentDidMount() {
    this.sourceService.sourcesChanged.on(this, sources => {
      this.setState({
        sources: sources,
      });
    });
    this.sourceService.programChanged.on(this, event => {
      this.setState({
        programTransition: event.current,
      });
    });
    this.setState({
      sources: await this.sourceService.getSources(),
      programTransition: await this.sourceService.getProgramTransition(),
    });
  }

  public componentWillUnmount() {
    this.sourceService.programChanged.off(this);
  }

  public render() {
    return (
      <div className='PGMKeyboard'>
        <h2 className='header'>PGM</h2>
        <div className='keyboard'>
          {
            keyNames.map((name, index) => {
              const source = this.state.sources[index];
              return (
                <KeyView
                  key={name}
                  name={name}
                  isPreview={false}
                  isProgram={!!source && this.state.programTransition?.source.id === source.id}
                  onButtonClicked={() => this.onKeyClicked(index)}
                />
              );
            })
          }
        </div>
      </div>
    );
  }
  private async onKeyClicked(index: number) {
    const source = this.state.sources[index];
    if (source) {
      await this.sourceService.take(source);
    }
  }
}
