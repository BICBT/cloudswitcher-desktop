import './SourceDialog.scss';
import React from 'react';
import { Tabs } from 'antd';
import { DialogProps, Source, SourceType } from '../../../common/types';
import { notNull } from '../../../common/util';
import { ModalLayout } from '../../shared/ModalLayout/ModalLayout';
import { initLiveState, LiveTab, LiveState } from './LiveTab';
import { initMediaState, MediaTab, MediaState } from './MediaTab';

export type SourceDialogDefault = {
  index: number;
  source?: Source;
}

export type SourceDialogResult = {
  index: number;
  name: string;
  type: SourceType;
  url?: string;
  customPreviewUrl?: string | null;
  mediaId?: string;
  playOnActive?: boolean;
  hardwareDecoder?: boolean;
};

type SourceDialogProps = DialogProps<SourceDialogDefault, SourceDialogResult>;

type SourceDialogState = {
  type: SourceType;
  live: LiveState;
  media: MediaState;
};

export class SourceDialog extends React.Component<SourceDialogProps, SourceDialogState> {

  constructor(props: SourceDialogProps) {
    super(props);
    this.state = {
      type: props.default.source?.type ?? SourceType.live,
      live: initLiveState(notNull(props.default)),
      media: initMediaState(notNull(props.default)),
    };
  }

  public render() {
    return (
      <ModalLayout className='SourceDialog'
        onDoneClicked={() => this.onModalDone()}
        onCancelClicked={() => this.props.onModalCancel()}
      >
        <Tabs className='SourceTabs'
              tabPosition='left'
              activeKey={this.state.type}
              onChange={type => this.handleSourceTypeChanged(type as SourceType)}>
          <Tabs.TabPane tab="Live" key={SourceType.live}>
            <LiveTab
              state={this.state.live}
              handleStateChanged={state => this.handleLiveTabStateChanged(state)}
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Media" key={SourceType.media}>
            <MediaTab
              state={this.state.media}
              handleStateChanged={state => this.handleMediaTabStateChanged(state)}
            />
          </Tabs.TabPane>
        </Tabs>
      </ModalLayout>
    )
  }

  private handleSourceTypeChanged(type: SourceType) {
    this.setState({
      type: type,
    });
  }

  private handleLiveTabStateChanged(state: LiveState): void {
    this.setState({
      live: state,
    });
  }

  private handleMediaTabStateChanged(state: MediaState): void {
    this.setState({
      media: state,
    });
  }

  private async onModalDone(): Promise<void> {
    switch (this.state.type) {
      case SourceType.live:
        if (!this.state.live.name || !this.state.live.url) {
          this.setState({
            live: {
              ...this.state.live,
              showValidation: true,
            }
          });
          return;
        }
        this.props.onModalDone({
          index: this.state.live.index,
          name: this.state.live.name,
          type: SourceType.live,
          url: this.state.live.url,
          customPreviewUrl: this.state.live.customPreviewUrl,
          hardwareDecoder: this.state.live.hardwareDecoder,
        });
        break;
      case SourceType.media:
        if (!this.state.media.name || !this.state.media.mediaId) {
          this.setState({
            media: {
              ...this.state.media,
              showValidation: true,
            }
          });
          return;
        }
        this.props.onModalDone({
          index: this.state.media.index,
          name: this.state.media.name,
          type: SourceType.media,
          mediaId: this.state.media.mediaId,
          playOnActive: this.state.media.playOnActive,
          hardwareDecoder: this.state.media.hardwareDecoder,
        });
        break;
    }
  }
}
