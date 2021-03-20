import './PVWKeyboard.scss';
import React from 'react';
import { KeyView } from './KeyView';
import { Container } from 'typedi';
import { SourceService } from '../../../service/SourceService';
import { Source } from '../../../common/types';

const keyNames = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '10', '11', '12'
];

type PVWKeyboardState = {
  sources: Record<number, Source>;
  previewSource?: Source;
}

export class PVWKeyboard extends React.Component<{}, PVWKeyboardState> {
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
    this.sourceService.previewChanged.on(this, event => {
      this.setState({
        previewSource: event.current,
      });
    });
    this.setState({
      sources: await this.sourceService.getSources(),
      previewSource: await this.sourceService.getPreviewSource(),
    });
  }

  public componentWillUnmount() {
    this.sourceService.previewChanged.off(this);
  }

  public render() {
    return (
      <div className='PVWKeyboard'>
        <h2 className='header'>PVW</h2>
        <div className='keyboard'>
          {
            keyNames.map((name, index) => {
              const source = this.state.sources[index];
              return (
                <KeyView
                  key={name}
                  name={name}
                  isPreview={!!source && this.state.previewSource?.id === source.id}
                  isProgram={false}
                  onButtonClicked={() => this.onKeyClicked(index)}
                />
              );
            })
          }
        </div>
      </div>
    );
  }

  private onKeyClicked(index: number) {
    const source = this.state.sources[index];
    if (source) {
      this.sourceService.preview(source);
    }
  }
}
