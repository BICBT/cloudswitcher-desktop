import './AudioTab.scss';
import React from 'react';
import { Checkbox, Form, Select } from 'antd';
import { Output, Source } from '../../../common/types';
import { replaceItem, sequence } from '../../../common/util';

export interface AudioTabState {
  outputMixers: number;
  sourceMixers: { source: Source; mixers: number; }[];
}

export interface AudioTabProps {
  state: AudioTabState;
  handleStateChanged: (state: AudioTabState) => void;
}

export function initAudioTabState(output: Output, sources: Source[]): AudioTabState {
  return {
    outputMixers: output.mixers,
    sourceMixers: sources.map(s => ({ source: s, mixers: s.mixers })),
  };
}

const MAX_MIXER_COUNT = 6;

class BitFlag {

  public static checkBit(number: number, bit: number): boolean {
    return (number & (1 << bit - 1)) !== 0;
  }

  public static addBit(number: number, bit: number): number {
    return number | (1 << bit - 1);
  }

  public static removeBit(number: number, bit: number): number {
    return number & ~(1 << bit - 1);
  }
}

export class AudioTab extends React.Component<AudioTabProps> {

  public render() {
    return (
      <div className='AudioTab'>
        <Form layout='vertical'>
          <Form.Item label="Output Tracks">
            <Select value={String(this.props.state.outputMixers)} onChange={mixers => this.handleOutputMixersChanged(Number(mixers))}>
              <Select.Option value="1">1</Select.Option>
              <Select.Option value="2">2</Select.Option>
              <Select.Option value="3">3</Select.Option>
              <Select.Option value="4">4</Select.Option>
              <Select.Option value="5">5</Select.Option>
              <Select.Option value="6">6</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Source Tracks">
            {
              this.props.state.sourceMixers.map(({ source, mixers}) => (
                <div key={source.id} className="SourceMixer">
                  <span>{source.name}</span>
                  {
                    sequence(1, MAX_MIXER_COUNT).map(i => (
                      <Checkbox
                        key={i}
                        checked={this.getSourceMixerChecked(mixers, i)}
                        onChange={e => this.handleSourceMixerChanged(source, mixers, i, e.target.checked)}>
                        Track {i}
                      </Checkbox>
                    ))
                  }
                </div>
              ))
            }
          </Form.Item>
        </Form>
      </div>
    );
  }

  private getSourceMixerChecked(mixers: number, track: number): boolean {
    return BitFlag.checkBit(mixers, track);
  }

  private handleSourceMixerChanged(source: Source, mixers: number, track: number, checked: boolean): void {
    mixers = checked ? BitFlag.addBit(mixers, track) : BitFlag.removeBit(mixers, track);
    this.props.handleStateChanged({
      ...this.props.state,
      sourceMixers: replaceItem(this.props.state.sourceMixers, { source: source, mixers: mixers }, old => old.source.id === source.id),
    });
  }

  private handleOutputMixersChanged(mixers: number): void {
    this.props.handleStateChanged({
      ...this.props.state,
      outputMixers: mixers,
    });
  }
}
