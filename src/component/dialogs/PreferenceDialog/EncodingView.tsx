import React from 'react';
import { Encoding, Preset, Profile, RateControl, Tune } from '../../../common/types';
import { Checkbox, Form, Input, Select } from 'antd';

export interface EncodingViewProps {
  encoding: Encoding;
  handleEncodingChanged: (encoding: Encoding) => void;
}

function getResolution(encoding: Encoding): string {
  return `${encoding.width}x${encoding.height}`;
}

export class EncodingView extends React.Component<EncodingViewProps> {

  public render() {
    return (
      <div className="EncodingView">
        <Form.Item label="Resolution">
          <Select value={getResolution(this.props.encoding)} onChange={resolution => this.handleResolutionChanged(resolution)}>
            <Select.Option value="3840x2160">3840x2160</Select.Option>
            <Select.Option value="1920x1080">1920x1080</Select.Option>
            <Select.Option value="1280x720">1280x720</Select.Option>
            <Select.Option value="960x540">960x540</Select.Option>
            <Select.Option value="640x360">640x360</Select.Option>
            <Select.Option value="320x180">320x180</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Frame Rate">
          <Select value={String(this.props.encoding.fpsNum)} onChange={frameRate => this.handleFrameRateChanged(frameRate)}>
            <Select.Option value="25">25fps</Select.Option>
            <Select.Option value="30">30fps</Select.Option>
            <Select.Option value="50">50fps</Select.Option>
            <Select.Option value="60">60fps</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Rate Control">
          <Select value={this.props.encoding.rateControl} onChange={rateControl => this.handleRateControlChanged(rateControl)}>
            <Select.Option value="CBR">CBR</Select.Option>
            <Select.Option value="VBR">VBR</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Preset">
          <Select value={this.props.encoding.preset} onChange={preset => this.handlePresetChanged(preset)}>
            <Select.Option value="ultrafast">ultrafast</Select.Option>
            <Select.Option value="veryfast">veryfast</Select.Option>
            <Select.Option value="fast">fast</Select.Option>
            <Select.Option value="medium">medium</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Profile">
          <Select value={this.props.encoding.profile} onChange={profile => this.handleProfileChanged(profile)}>
            <Select.Option value="baseline">baseline</Select.Option>
            <Select.Option value="main">main</Select.Option>
            <Select.Option value="high">high</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Tune">
          <Select value={this.props.encoding.tune} onChange={tune => this.handleTuneChanged(tune)}>
            <Select.Option value="zerolatency">zerolatency</Select.Option>
            <Select.Option value="default">default</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Key Frame Interval (second)">
          <Input value={this.props.encoding.keyIntSec} onChange={e => this.handleKeyIntSecChanged(e.target.value)} />
        </Form.Item>
        <Form.Item label="Audio Sample Rate">
          <Select value={String(this.props.encoding.samplerate)} onChange={samplerate => this.handleSamplerateChanged(samplerate)}>
            <Select.Option value="48000">48000</Select.Option>
            <Select.Option value="44100">44100</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="Video Bitrate (kbps)">
          <Input value={this.props.encoding.videoBitrateKbps} onChange={e => this.handleVideoBitrateChanged(e.target.value)} />
        </Form.Item>
        <Form.Item label="Audio Bitrate (kbps)">
          <Input value={this.props.encoding.audioBitrateKbps} onChange={e => this.handleAudioBitrateChanged(e.target.value)} />
        </Form.Item>
        <Form.Item>
          <Checkbox checked={this.props.encoding.hardwareEnable} onChange={e => this.handleHardwareEnableChanged(e.target.checked)}>
            GPU Enable
          </Checkbox>
        </Form.Item>
      </div>
    );
  }

  private handleResolutionChanged(resolution: string): void {
    const [width, height] = resolution.split('x').map(s => Number(s));
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      width: width,
      height: height,
    });
  }

  private handleFrameRateChanged(frameRate: string): void {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      fpsNum: Number(frameRate),
    });
  }

  private handleRateControlChanged(rateControl: RateControl): void {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      rateControl: rateControl,
    });
  }

  private handlePresetChanged(preset: Preset): void {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      preset: preset,
    });
  }

  private handleProfileChanged(profile: Profile): void {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      profile: profile,
    });
  }

  private handleTuneChanged(tune: Tune): void {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      tune: tune,
    });
  }

  private handleKeyIntSecChanged(keyIntSec: string) {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      keyIntSec: Number(keyIntSec),
    });
  }

  private handleSamplerateChanged(samplerate: string) {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      samplerate: Number(samplerate),
    });
  }

  private handleVideoBitrateChanged(bitrate: string) {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      videoBitrateKbps: Number(bitrate),
    });
  }

  private handleAudioBitrateChanged(bitrate: string) {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      audioBitrateKbps: Number(bitrate),
    });
  }

  private handleHardwareEnableChanged(hardwareEnable: boolean) {
    this.props.handleEncodingChanged({
      ...this.props.encoding,
      hardwareEnable: hardwareEnable,
    });
  }
}
