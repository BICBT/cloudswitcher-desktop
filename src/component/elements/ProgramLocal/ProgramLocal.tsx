import './ProgramLocal.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/SourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Overlay, Transition } from '../../../common/types';
import { CGService } from "../../../service/CGService";

type ProgramLocalState = {
  programTransition?: Transition;
  overlayIds: string[];
  displayKey: number;
};

export function getUpOverlayIds(overlays: Overlay[]): string[] {
  return overlays.filter(overlay => overlay.status === 'up').map(overlay => overlay.id);
}

export class ProgramLocal extends React.Component<{}, ProgramLocalState> {
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
    this.sourceService.programChanged.on(this, event => {
      this.setState({
        programTransition: event.current,
      });
    });
    this.cgService.cgsChanged.on(this, cgs => {
      this.setState({
        overlayIds: getUpOverlayIds(cgs),
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
      overlayIds: getUpOverlayIds(await this.cgService.getCGs()),
    });
  }

  public componentWillUnmount() {
    this.sourceService.programChanged.off(this);
    this.sourceService.sourcePreviewChanged.off(this);
    this.cgService.cgsChanged.off(this);
  }

  public render() {
    return (
      <div className={`ProgramLocal ${this.state.programTransition ? 'isProgram': ''}`}>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.programTransition &&
              <DisplayView
                key={this.state.displayKey}
                sourceId={this.state.programTransition.source.id}
                displayIds={[this.state.programTransition.id, ...this.state.overlayIds]}
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
