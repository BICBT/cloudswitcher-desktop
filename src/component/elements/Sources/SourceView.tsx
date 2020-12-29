import './SourceView.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/sourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Source } from '../../../common/types';

export type SourceViewProps = {
  index: number;
  source?: Source;
  hideSetting?: boolean;
};

export type SourceViewState = {
  source?: Source;
};

export class SourceView extends React.Component<SourceViewProps, SourceViewState> {
  private readonly sourceService = Container.get(SourceService);

  public constructor(props: SourceViewProps) {
    super(props);
    this.state = {
      source: props.source,
    };
  }

  public componentDidMount() {
    this.sourceService.sourceChanged.on(this, source => {
      if (source.id === this.state.source?.id) {
        this.setState({
          source: source,
        });
      }
    });
    this.sourceService.sourceRestarted.on(this, source => {
      if (source.id === this.state.source?.id) {
        this.setState({
          source: undefined,
        });
        this.setState({
          source: source,
        });
      }
    });
  }

  componentWillUnmount() {
    this.sourceService.sourceChanged.off(this);
    this.sourceService.sourceRestarted.off(this);
  }

  public render() {
    return (
      <div className='SourceView'>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.source &&
              <DisplayView
                source={this.state.source}
                displayId={this.state.source.id}
              />
            }
          </div>
        </div>
        <div className='toolbar'>
          <div className='number'>{this.props.index + 1}</div>
          <div className='name'>{this.state.source?.name}</div>
          {
            !this.props.hideSetting &&
            <>
              <i className="icon-reset icon-button" onClick={() => this.onRestartClicked()} />
            </>
          }
        </div>
      </div>
    );
  }

  private onRestartClicked() {
    if (this.state.source) {
      this.sourceService.restart(this.state.source);
    }
  }
}
