import './Preview.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/SourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Source } from '../../../common/types';

type PreviewState = {
  previewSource?: Source;
  displayKey: number;
};

export class Preview extends React.Component<{}, PreviewState> {
  private readonly sourceService: SourceService = Container.get(SourceService);

  constructor(props: {}) {
    super(props);
    this.state = {
      displayKey: 0,
    };
  }

  public async componentDidMount() {
    this.sourceService.previewChanged.on(this, event => {
      this.setState({
        previewSource: event.current,
      });
    });
    this.sourceService.sourcePreviewChanged.on(this, source => {
      if (this.state.previewSource?.id === source.id) {
        this.setState({
          displayKey: this.state.displayKey + 1,
        });
      }
    });
    this.setState({
      previewSource: await this.sourceService.getPreviewSource(),
    });
  }

  public componentWillUnmount() {
    this.sourceService.previewChanged.off(this);
    this.sourceService.sourcePreviewChanged.off(this);
  }

  public render() {
    return (
      <div className={`Preview ${this.state.previewSource ? 'isPreview': ''}`}>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.previewSource &&
              <DisplayView
                key={`${this.state.previewSource.id}-${this.state.displayKey}`}
                sourceId={this.state.previewSource.id}
                displayId={this.state.previewSource.id}
              />
            }
          </div>
        </div>
        <div className='toolbar'>
          <h2>PVW预监</h2>
        </div>
      </div>
    );
  }
}
