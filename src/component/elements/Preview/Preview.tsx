import './Preview.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/SourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Source } from '../../../common/types';

type PreviewState = {
  previewSource?: Source;
};

export class Preview extends React.Component<{}, PreviewState> {
  private readonly sourceService: SourceService = Container.get(SourceService);

  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public async componentDidMount() {
    this.sourceService.previewChanged.on(this, event => {
      this.setState({
        previewSource: event.current,
      })
    });
    this.setState({
      previewSource: await this.sourceService.getPreviewSource(),
    });
  }

  public componentWillUnmount() {
    this.sourceService.previewChanged.off(this);
  }

  public render() {
    return (
      <div className={`Preview ${this.state.previewSource ? 'isPreview': ''}`}>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.previewSource &&
              <DisplayView
                key={this.state.previewSource.sceneId}
                source={this.state.previewSource}
                displayId={this.state.previewSource.sceneId}
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
