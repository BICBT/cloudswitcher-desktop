import './SourceDialog.scss';
import React from 'react';
import { Tabs } from 'antd';
import { DialogProps, Source, SourceType } from '../../../common/types';
import { notNull } from '../../../common/util';
import { ModalLayout } from '../../shared/ModalLayout/ModalLayout';
import { initLiveTabState, LiveTab, LiveTabState } from './LiveTab';

export type SourceDialogDefault = {
  index: number;
  source?: Source;
}

export type SourceDialogResult = {
  index: number;
  name: string;
  type: SourceType;
  url: string;
  customPreviewUrl?: string | null;
  hardwareDecoder?: boolean;
};

type SourceDialogProps = DialogProps<SourceDialogDefault, SourceDialogResult>;

type SourceDialogState = {
  live: LiveTabState;
};

export class SourceDialog extends React.Component<SourceDialogProps, SourceDialogState> {

  constructor(props: SourceDialogProps) {
    super(props);
    this.state = {
      live: initLiveTabState(notNull(props.default)),
    };
  }

  public render() {
    return (
      <ModalLayout className='SourceDialog'
        onDoneClicked={() => this.onModalDone()}
        onCancelClicked={() => this.props.onModalCancel()}
      >
        <Tabs className='SourceTabs' tabPosition='left'>
          <Tabs.TabPane tab="Live" key="live">
            <LiveTab
              state={this.state.live}
              handleStateChanged={state => this.handleLiveTabStateChanged(state)}
            />
          </Tabs.TabPane>
        </Tabs>
      </ModalLayout>
    )
  }

  private handleLiveTabStateChanged(state: LiveTabState): void {
    this.setState({
      live: state,
    });
  }

  private onModalDone(): void {
    if (!this.state.live.name || !this.state.live.url) {
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
  }
}
