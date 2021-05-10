import React from 'react';
import { Tabs } from 'antd';
import { ModalLayout } from '../../shared/ModalLayout/ModalLayout';
import { DialogProps, Encoding, Output, Preview } from '../../../common/types';
import { initOutputTabState, OutputTab, OutputTabState } from './OutputTab';
import { initPreviewTabState, PreviewTab, PreviewTabState } from './PreviewTab';

export interface PreferenceDialogDefault {
  output: Output;
  preview: Preview;
}

export interface PreferenceDialogResult {
  output: {
    url: string;
    encoding: Encoding;
  };
  outputChanged: boolean;
  preview: {
    encoding: Encoding;
  }
  previewChanged: boolean;
}

type PreferenceDialogProps = DialogProps<PreferenceDialogDefault, PreferenceDialogResult>;

interface PreferenceDialogState {
  output: OutputTabState;
  outputChanged: boolean;
  preview: PreviewTabState;
  previewChanged: boolean;
}

export class PreferenceDialog extends React.Component<PreferenceDialogProps, PreferenceDialogState> {
  constructor(props: PreferenceDialogProps) {
    super(props);
    this.state = {
      output: initOutputTabState(this.props.default.output),
      outputChanged: false,
      preview: initPreviewTabState(this.props.default.preview),
      previewChanged: false,
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

  private onModalDone(): void {
    this.props.onModalDone({
      output: {
        url: this.state.output.url,
        encoding: this.state.output.encoding,
      },
      outputChanged: this.state.outputChanged,
      preview: {
        encoding: this.state.preview.encoding,
      },
      previewChanged: this.state.previewChanged,
    });
  }
}
