import React from 'react';
import { Form, Select } from 'antd';
import { EncodingView } from './EncodingView';
import { Encoding, Preview, StreamType } from '../../../common/types';

export interface PreviewTabState {
  type: StreamType;
  encoding: Encoding;
}

export interface PreviewTabProps {
  state: PreviewTabState;
  handleStateChanged: (state: PreviewTabState) => void;
}

export function initPreviewTabState(preview: Preview): PreviewTabState {
  return {
    type: preview.type,
    encoding: preview.encoding,
  };
}

export class PreviewTab extends React.Component<PreviewTabProps> {

  public render() {
    return (
      <div className='PreviewTab'>
        <Form>
          <Form.Item label="Stream Type">
            <Select value={this.props.state.type} onChange={type => this.handleTypeChanged(type)}>
              <Select.Option value={StreamType.rtmp}>RTMP</Select.Option>
              <Select.Option value={StreamType.srt}>SRT</Select.Option>
            </Select>
          </Form.Item>
          <EncodingView
            encoding={this.props.state.encoding}
            handleEncodingChanged={encoding => this.handleEncodingChanged(encoding)}
          />
        </Form>
      </div>
    );
  }

  private handleTypeChanged(type: StreamType): void {
    this.props.handleStateChanged({
      ...this.props.state,
      type: type,
    });
  }

  private handleEncodingChanged(encoding: Encoding): void {
    this.props.handleStateChanged({
      ...this.props.state,
      encoding: encoding,
    });
  }
}
