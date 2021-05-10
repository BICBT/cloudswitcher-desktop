import './Sources.scss';
import React from 'react';
import { Container } from 'typedi';
import { sequence } from '../../../common/util';
import { SourceView } from './SourceView';
import { SourceService } from '../../../service/SourceService';
import { Source, Transition } from '../../../common/types';

type SourcesProps = {
  rows: number;
  sourceCount: number;
  hideSetting?: boolean;
}

type SourcesState = {
  rows: number;
  sourceCount: number;
  sources: Source[];
  previewSource?: Source;
  programTransition?: Transition;
};

export class Sources extends React.Component<SourcesProps, SourcesState> {
  static defaultProps = {
    rows: 2,
    sourceCount: 12,
  };

  private readonly sourceService = Container.get(SourceService);

  constructor(props: SourcesProps) {
    super(props);
    this.state = {
      rows: props.rows,
      sourceCount: props.sourceCount,
      sources: [],
    };
  }

  public async componentDidMount() {
    this.sourceService.sourcesChanged.on(this, sources => {
      this.setState({
        sources: sources
      });
    });
    this.sourceService.previewChanged.on(this, event => {
      this.setState({
        previewSource: event.current,
      })
    });
    this.sourceService.programChanged.on(this, event => {
      this.setState({
        programTransition: event.current,
      })
    });
    this.setState({
      sources: await this.sourceService.getSources(),
      previewSource: await this.sourceService.getPreviewSource(),
      programTransition: await this.sourceService.getProgramTransition(),
    });
  }

  public componentDidUpdate(prevProps: Readonly<SourcesProps>, prevState: Readonly<SourcesState>, snapshot?: any) {
    if (this.props.sourceCount !== prevProps.sourceCount || this.props.rows !== prevProps.rows) {
      this.setState({
        sourceCount: this.props.sourceCount,
        rows: this.props.rows,
      });
    }
  }

  public componentWillUnmount() {
    this.sourceService.sourcesChanged.off(this);
    this.sourceService.previewChanged.off(this);
    this.sourceService.programChanged.off(this);
  }

  public render() {
    return (
      <div className='Sources'>
        <div className={`SourceView-list sources${this.state.sourceCount}`}>
          {
            sequence(0, this.state.sourceCount - 1).map(index => {
              const source = this.state.sources.find(s => s.index === index);
              const isPreview = !!source && this.state.previewSource?.id === source?.id;
              const isProgram = !!source && this.state.programTransition?.source?.id === source?.id;
              return (
                <div key={source?.id || index}
                     className={`SourceView-item rows${this.props.rows} ${isPreview ? 'isPreview' : ''} ${isProgram ? 'isProgram' : ''}`}>
                  <SourceView
                    index={index}
                    source={source}
                    hideSetting={this.props.hideSetting}
                  />
                </div>
              );
            })
          }
        </div>
      </div>
    );
  }
}
