import React from 'react';
import { Tabs } from 'antd';
import { ModalLayout } from '../../shared/ModalLayout/ModalLayout';
import { DialogProps, Encoding, Output, Preview, Source, StreamType } from '../../../common/types';
import { initOutputTabState, OutputTab, OutputTabState } from './OutputTab';
import { initPreviewTabState, PreviewTab, PreviewTabState } from './PreviewTab';
import { AudioTab, AudioTabState, initAudioTabState } from './AudioTab';

export interface PreferenceDialogDefault {
  output: Output;
  preview: Preview;
  sources: Source[];
}

export interface PreferenceDialogResult {
  output: {
    url: string;
    encoding: Encoding;
    delaySec: number;
  };
  outputChanged: boolean;
  preview: {
    type: StreamType;
    encoding: Encoding;
  }
  previewChanged: boolean;
  audio: {
    outputMixers: number;
    sourceMixers: { source: Source; mixers: number; }[];
  };
  audioChanged: boolean;
}

type PreferenceDialogProps = DialogProps<PreferenceDialogDefault, PreferenceDialogResult>;

interface PreferenceDialogState {
  output: OutputTabState;
  outputChanged: boolean;
  preview: PreviewTabState;
  previewChanged: boolean;
  audio: AudioTabState;
  audioChanged: boolean;
}

export class PreferenceDialog extends React.Component<PreferenceDialogProps, PreferenceDialogState> {
  constructor(props: PreferenceDialogProps) {
    super(props);
    this.state = {
      output: initOutputTabState(this.props.default.output),
      outputChanged: false,
      preview: initPreviewTabState(this.props.default.preview),
      previewChanged: false,
      audio: initAudioTabState(this.props.default.output, this.props.default.sources),
      audioChanged: false,
    };
  }

  public render() {
    return (
      <ModalLayout
        className='PreferenceDialog'
        onDoneClicked={() => this.onModalDone()}
        onCancelClicked={() => this.props.onModalCancel()}
      >
        <Tabs tabPosition='left'>
          <Tabs.TabPane tab="Output" key="output">
            <OutputTab state={this.state.output} handleStateChanged={state => this.handleOutputTabStateChanged(state)} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Preview" key="preview">
            <PreviewTab state={this.state.preview} handleStateChanged={state => this.handlePreviewTabStateChanged(state)} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Audio" key="audio">
            <AudioTab state={this.state.audio} handleStateChanged={state => this.handleAudioTabStateChanged(state)} />
          </Tabs.TabPane>
        </Tabs>
      </ModalLayout>
    );
  }

  private handleOutputTabStateChanged(state: OutputTabState): void {
    this.setState({
      output: state,
      outputChanged: true,
    });
  }

  private handlePreviewTabStateChanged(state: PreviewTabState): void {
    this.setState({
      preview: state,
      previewChanged: true,
    });
  }

  private handleAudioTabStateChanged(state: AudioTabState): void {
    this.setState({
      audio: state,
      audioChanged: true,
    });
  }

  private onModalDone(): void {
    this.props.onModalDone({
      output: {
        url: this.state.output.url,
        encoding: this.state.output.encoding,
        delaySec: this.state.output.delaySec,
      },
      outputChanged: this.state.outputChanged,
      preview: {
        type: this.state.preview.type,
        encoding: this.state.preview.encoding,
      },
      previewChanged: this.state.previewChanged,
      audio: {
        outputMixers: this.state.audio.outputMixers,
        sourceMixers: this.state.audio.sourceMixers,
      },
      audioChanged: this.state.audioChanged,
    });
  }
}
