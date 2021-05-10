import './SourceView.scss';
import React from 'react';
import { Container } from 'typedi';
import { SourceService } from '../../../service/SourceService';
import { DisplayView } from '../../shared/Display/DisplayView';
import { Source } from '../../../common/types';
import { DialogService } from '../../../service/DialogService';
import { SourceDialogDefault, SourceDialogResult } from '../../dialogs/SourceDialog/SourceDialog';

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
  private readonly dialogService = Container.get(DialogService);

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
    this.sourceService.sourcePreviewChanged.on(this, source => {
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
    this.sourceService.sourcePreviewChanged.off(this);
  }

  public render() {
    return (
      <div className='SourceView'>
        <div className='DisplayView-container'>
          <div className='content'>
            {
              this.state.source &&
              <DisplayView
                key={this.state.source.id}
                sourceId={this.state.source.id}
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
              <i className="icon-button fas fa-minus" onClick={() => this.handleDeleteSourceClicked()} />
              <i className="icon-button fas fa-cog" onClick={() => this.handleSourceSettingsClicked()} />
            </>
          }
        </div>
      </div>
    );
  }

  private async handleDeleteSourceClicked() {
    if (this.state.source) {
      await this.sourceService.deleteSource(this.state.source.id);
    }
  }

  private async handleSourceSettingsClicked() {
    const result = await this.dialogService.showDialog<SourceDialogDefault, SourceDialogResult>({
      title: 'Source Properties',
      component: 'SourceDialog',
      width: 800,
      height: 600,
    }, {
      index: this.props.index,
      source: this.state.source,
    });
    if (result) {
      if (this.state.source) {
        await this.sourceService.updateSource(this.state.source.id, {
          name: result.name,
          type: result.type,
          url: result.url,
          customPreviewUrl: result.customPreviewUrl,
          hardwareDecoder: result.hardwareDecoder,
        });
      } else {
        await this.sourceService.addSource({
          index: result.index,
          name: result.name,
          type: result.type,
          url: result.url,
          customPreviewUrl: result.customPreviewUrl || undefined,
          hardwareDecoder: result.hardwareDecoder,
        });
      }
    }
  }
}
