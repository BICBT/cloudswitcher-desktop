import './Preview.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/SourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import {Overlay, Source} from '../../../common/types';
import {CGService} from "../../../service/CGService";

type PreviewState = {
  previewSource?: Source;
  overlayIds: string[];
  displayKey: number;
};

export function getPreviewOverlayIds(overlays: Overlay[]): string[] {
  return overlays.filter(overlay => overlay.preview).map(overlay => overlay.id);
}

export class Preview extends React.Component<{}, PreviewState> {
  private readonly sourceService: SourceService = Container.get(SourceService);
  private readonly cgService: CGService = Container.get(CGService);

  constructor(props: {}) {
    super(props);
    this.state = {
      overlayIds: [],
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
    this.cgService.cgsChanged.on(this, cgs => {
      this.setState({
        overlayIds: getPreviewOverlayIds(cgs),
        displayKey: this.state.displayKey + 1,
      });
    });
    this.setState({
      previewSource: await this.sourceService.getPreviewSource(),
      overlayIds: getPreviewOverlayIds(await this.cgService.getCGs()),
    });
  }

  public componentWillUnmount() {
    this.sourceService.previewChanged.off(this);
    this.sourceService.sourcePreviewChanged.off(this);
    this.cgService.cgsChanged.off(this);
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
                displayIds={[this.state.previewSource.id, ...this.state.overlayIds]}
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
