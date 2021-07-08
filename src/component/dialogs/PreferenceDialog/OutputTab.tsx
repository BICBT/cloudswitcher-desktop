import React from 'react';
import { Form, Input } from 'antd';
import { EncodingView } from './EncodingView';
import { Encoding, Output } from '../../../common/types';

export interface OutputTabState {
  url: string;
  encoding: Encoding;
  delaySec: number;
}

export interface OutputTabProps {
  state: OutputTabState;
  handleStateChanged: (state: OutputTabState) => void;
}

export function initOutputTabState(output: Output): OutputTabState {
  return {
    url: output.url,
    encoding: output.encoding,
    delaySec: output.delaySec,
  };
}

export class OutputTab extends React.Component<OutputTabProps> {

  public render() {
    return (
      <div className='OutputTab'>
        <Form>
          <Form.Item label="Url">
            <Input value={this.props.state.url} onChange={e => this.handleUrlChanged(e.target.value)} />
          </Form.Item>
          <EncodingView
            encoding={this.props.state.encoding}
            handleEncodingChanged={encoding => this.handleEncodingChanged(encoding)}
          />
          <Form.Item label="Output Delay (second)">
            <Input value={this.props.state.delaySec} onChange={e => this.handleOutputDelayChanged(e.target.value)} />
          </Form.Item>
        </Form>
      </div>
    );
  }

  private handleUrlChanged(url: string): void {
    this.props.handleStateChanged({
      ...this.props.state,
      url: url,
    })
  }

  private handleEncodingChanged(encoding: Encoding): void {
    this.props.handleStateChanged({
      ...this.props.state,
      encoding: encoding,
    });
  }

  private handleOutputDelayChanged(delay: string) {
    this.props.handleStateChanged({
      ...this.props.state,
      delaySec: Number(delay),
    });
  }
}
