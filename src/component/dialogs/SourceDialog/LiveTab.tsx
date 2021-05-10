import './LiveTab.scss';
import React from 'react';
import { Checkbox, Form, Input, Select, Tooltip } from 'antd';
import { StreamType } from '../../../common/types';
import { SwitcherService } from '../../../service/SwitcherService';
import { Container } from 'typedi';
import { SourceDialogDefault } from './SourceDialog';

export interface LiveTabState {
  index: number;
  name?: string;
  url?: string;
  customPreviewUrl?: string | null;
  hardwareDecoder?: boolean;
  streamType?: StreamType;
}

export interface LiveTabProps {
  state: LiveTabState;
  handleStateChanged: (state: LiveTabState) => void;
}

function getStreamType(url: string): StreamType {
  return url.startsWith('srt') ? StreamType.srt : StreamType.rtmp;
}

export function initLiveTabState(value: SourceDialogDefault): LiveTabState {
  return {
    index: value.index,
    name: value.source?.name,
    url: value.source?.url,
    customPreviewUrl: value.source?.customPreviewUrl,
    hardwareDecoder: value.source?.hardwareDecoder,
    streamType: value.source?.url ? getStreamType(value.source?.url) : StreamType.rtmp,
  };
}

export class LiveTab extends React.Component<LiveTabProps> {
  private readonly switcherService = Container.get(SwitcherService);

  public async componentDidMount(): Promise<void> {
    if (!this.props.state.url) {
      await this.generateUrl(StreamType.rtmp);
    }
  }

  public render() {
    return (
      <Form className='LiveTab' layout="vertical">
        <Form.Item label="Name">
          <Input value={this.props.state.name} onChange={e => this.handleNameChanged(e.target.value)} />
        </Form.Item>
        <Form.Item label="Stream Type">
          <Select value={this.props.state.streamType ?? StreamType.rtmp} onChange={streamType => this.handleStreamTypeChanged(streamType)}>
            <Select.Option value="rtmp">RTMP</Select.Option>
            <Select.Option value="srt">SRT</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label={
          <div className="StreamUrlLabel">
            <span>Stream Url</span>
            <Tooltip title="Copy stream url to your camera encoder">
              <i className="fas fa-info-circle"/>
            </Tooltip>
          </div>
        }>
          <Input value={this.props.state.url} onChange={e => this.handleUrlChanged(e.target.value)} />
        </Form.Item>
        <Form.Item label="Preview Url (Optional)">
          <Input value={this.props.state.customPreviewUrl || undefined} onChange={e => this.handlePreviewUrlChanged(e.target.value)} />
        </Form.Item>
        <Form.Item>
          <Checkbox checked={this.props.state.hardwareDecoder} onChange={e => this.handleHardwareDecoderChanged(e.target.checked)}>
            GPU Decode
          </Checkbox>
        </Form.Item>
      </Form>
    );
  }

  private handleNameChanged(name: string): void {
    this.props.handleStateChanged({
      ...this.props.state,
      name: name,
    });
  }

  private async handleStreamTypeChanged(streamType: StreamType): Promise<void> {
    this.props.handleStateChanged({
      ...this.props.state,
      streamType: streamType,
    });
    if (!this.props.state.url || streamType !== getStreamType(this.props.state.url)) {
      await this.generateUrl(streamType);
    }
  }

  private handleUrlChanged(url: string): void {
    this.props.handleStateChanged({
      ...this.props.state,
      url: url,
    });
  }

  private handlePreviewUrlChanged(url: string): void {
    this.props.handleStateChanged({
      ...this.props.state,
      customPreviewUrl: url || null,
    });
  }

  private handleHardwareDecoderChanged(hardwareDecoder: boolean): void {
    this.props.handleStateChanged({
      ...this.props.state,
      hardwareDecoder: hardwareDecoder,
    });
  }

  private async generateUrl(streamType: StreamType): Promise<void> {
    const url = (await this.switcherService.generateUrl(streamType, this.props.state.index)).url;
    this.handleUrlChanged(url);
  }
}
