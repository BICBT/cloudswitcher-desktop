import './MixerItem.scss';
import React from 'react';
import { Box, Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/react';

export interface MixerItemProps {
  index: number;
  pgm: boolean;
  volume: number
  audioLock: boolean;
  monitor: boolean;
  disabled: boolean;
  active: boolean;
  muted: boolean;
  handleVolumeChanged: (volume: number) => void;
  handleMonitorChanged: (monitor: boolean) => void;
  handleAudioLockChanged: (audioLock: boolean) => void;
}

export interface MixerItemState {
  selectingVolume: number;
}

export const MIN_VOLUME = -60;
export const MAX_VOLUME = 0;
const SLIDER_COLOR = 'black';
const SLIDER_FILL_COLOR = '#81868C';
const SLIDER_ACTIVE_FILL_COLOR = '#36ade0';

const MixerThumb = () => {
  return (
    <svg width="24" height="14" xmlns="http://www.w3.org/2000/svg">
      <path fill="#81868C" d="M8,10H17V5H8zM8,7H17V8H8z"/>
    </svg>
  );
};

export class MixerItem extends React.Component<MixerItemProps, MixerItemState> {
  public constructor(props: MixerItemProps) {
    super(props);
    this.state = {
      selectingVolume: props.volume,
    };
  }

  public render() {
    return (
      <div className='MixerItem'>
        <div className='toolbar'>
          {
            !this.props.pgm &&
            <i className={`icon-button ${this.props.disabled ? 'disabled' : ''} ${this.props.monitor ? 'active' : ''}`}
               onClick={() => this.handleMonitorClicked()}>
              {
                this.props.monitor ?
                  <i className='fas fa-headphones'/> :
                  <span className='fa-stack'>
                <i className='fas fa-headphones fa-stack-1x'/>
                <i className='fas fa-slash fa-stack-1x fa-xs'/>
              </span>
              }
            </i>
          }
          <div className='index'>
            {
              this.props.pgm
                  ? <div className='PGM-title'>PGM</div>
                  : <div className='number'>{(this.props.index ?? 0) + 1}</div>
            }
          </div>
          {
            !this.props.pgm &&
            <i className={`icon-button ${this.props.disabled ? 'disabled' : ''} ${this.props.audioLock ? 'active' : ''}`}
               onClick={() => this.handleAudioLockClicked()}>
              <i className={`${this.props.audioLock ? 'fas fa-lock' : 'fas fa-unlock'}`}/>
            </i>
          }
        </div>
        <div className='slider-wrapper'>
          <div className='slider-left'>
            <span className='max-value'>{MAX_VOLUME}dB</span>
            <span className='min-value'>{MIN_VOLUME}dB</span>
          </div>
          <Slider
            isDisabled={this.props.disabled}
            min={MIN_VOLUME}
            max={MAX_VOLUME}
            value={this.state.selectingVolume}
            orientation="vertical"
            focusThumbOnChange={false}
            onChange={volume => this.handleVolumeChange(volume)}
            onChangeEnd={volume => this.handleVolumeChangeEnd(volume)}>
            <SliderTrack bg={SLIDER_COLOR}>
              <SliderFilledTrack bg={this.props.active ? SLIDER_ACTIVE_FILL_COLOR : SLIDER_FILL_COLOR}/>
            </SliderTrack>
            <SliderThumb boxSize={6}>
              <Box as={MixerThumb}/>
            </SliderThumb>
          </Slider>
          <div className='slider-right'>
            <span className='current-value'>{this.state.selectingVolume}dB</span>
          </div>
        </div>
        <div className='bottom-bar'>
          <i className={`icon-button ${this.props.muted ? 'icon-mute' : 'icon-audio'} ${this.props.disabled ? 'disabled' : ''} `}
             onClick={() => this.handleMuteClicked()} />
        </div>
      </div>
    );
  }

  private handleMonitorClicked(): void {
    if (!this.props.disabled) {
      this.props.handleMonitorChanged(!this.props.monitor);
    }
  }

  private handleAudioLockClicked(): void {
    if (!this.props.disabled) {
      this.props.handleAudioLockChanged(!this.props.audioLock);
    }
  }

  private handleVolumeChange(volume: number): void {
    if (!this.props.disabled) {
      this.setState({
        selectingVolume: volume,
      });
    }
  }

  private handleVolumeChangeEnd(volume: number): void {
    if (!this.props.disabled && this.props.volume !== volume) {
      this.props.handleVolumeChanged(volume);
    }
  }

  private handleMuteClicked(): void {
    if (!this.props.disabled) {
      // this will call handleVolumeChangeEnd after selectingVolume is changed
      this.setState({
        selectingVolume: MIN_VOLUME,
      });
    }
  }
}
