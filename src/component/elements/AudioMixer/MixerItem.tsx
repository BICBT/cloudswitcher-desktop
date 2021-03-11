import './MixerItem.scss';
import React from 'react';
import { Box, Slider, SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/react';
import { Source } from '../../../common/types';
import { Container } from 'typedi';
import { SourceService } from '../../../service/sourceService';
import {AudioService} from "../../../service/audioService";

export interface MixerItemProps {
  index: number;
  source?: Source;
  audioWithVideo: boolean;
  isPgm: boolean;
}

export interface MixerItemState {
  disabled: boolean;
  volume: number;
  selectingVolume: number;
  audioLock: boolean;
  audioMonitor: boolean;
  pgmSource?: Source;
}

const MIN_VOLUME = -60;
const MAX_VOLUME = 0;
const DEFAULT_VOLUME = MAX_VOLUME;
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
  private readonly sourceService = Container.get(SourceService);
  private readonly audioService = Container.get(AudioService);

  public constructor(props: MixerItemProps) {
    super(props);
    this.state = {
      disabled: !props.source && !props.isPgm,
      volume: props.source?.volume ?? DEFAULT_VOLUME,
      selectingVolume: props.source?.volume ?? DEFAULT_VOLUME,
      audioLock: props.source?.audioLock ?? false,
      audioMonitor: props.source?.audioMonitor ?? false,
    };
  }

  private get active(): boolean {
    return this.state.audioLock ||
      (this.props.audioWithVideo
        && !!this.props.source
        && this.props.source.id === this.state.pgmSource?.id);
  }

  public componentDidMount() {
    this.sourceService.sourceChanged.on(this, source => {
      if (this.props.source?.id === source.id) {
        this.setState({
          volume: source.volume,
          selectingVolume: source.volume,
          audioLock: source.audioLock,
          audioMonitor: source.audioMonitor,
        });
      }
    });
    this.sourceService.programChanged.on(this, transition => {
      this.setState({
        pgmSource: transition?.source,
      });
    });
    this.setState({
      pgmSource: this.sourceService.programTransition?.source,
    });
    this.audioService.audioChanged.on(this, audio => {
      if (this.props.isPgm && this.state.volume !== audio.masterVolume) {
        this.setState({
          volume: audio.masterVolume,
          selectingVolume: audio.masterVolume,
        });
      }
    });
  }

  public componentWillUnmount() {
    this.sourceService.sourceChanged.off(this);
    this.sourceService.programChanged.off(this);
    this.audioService.audioChanged.off(this);
  }

  public render() {
    return (
      <div className='MixerItem'>
        <div className='toolbar'>
          <i className={`icon-button ${this.state.disabled ? 'disabled' : ''} ${this.state.audioMonitor ? 'active' : ''}`}
             onClick={() => this.handleMonitorClicked()}>
            {
              this.state.audioMonitor ?
              <i className='fas fa-headphones'/> :
              <span className='fa-stack'>
                <i className='fas fa-headphones fa-stack-1x'/>
                <i className='fas fa-slash fa-stack-1x fa-xs'/>
              </span>
            }
          </i>
          <div className='index'>
            {
              this.props.isPgm
                  ? <div className='PGM-title'>PGM</div>
                  : <div className='number'>{(this.props.index ?? 0) + 1}</div>
            }
          </div>
          {
            !this.props.isPgm &&
            <i className={`icon-button ${this.state.disabled ? 'disabled' : ''} ${this.state.audioLock ? 'active' : ''}`}
               onClick={() => this.handleAudioLockClicked()}>
              <i className={`${this.state.audioLock ? 'fas fa-lock' : 'fas fa-unlock'}`}/>
            </i>
          }
        </div>
        <div className='slider-wrapper'>
          <div className='slider-left'>
            <span className='max-value'>{MAX_VOLUME}dB</span>
            <span className='min-value'>{MIN_VOLUME}dB</span>
          </div>
          <Slider
            isDisabled={this.state.disabled}
            min={MIN_VOLUME}
            max={MAX_VOLUME}
            value={this.state.selectingVolume}
            orientation="vertical"
            focusThumbOnChange={false}
            onChange={volume => this.handleVolumeChange(volume)}
            onChangeEnd={volume => this.handleVolumeChangeEnd(volume)}>
            <SliderTrack bg={SLIDER_COLOR}>
              <SliderFilledTrack bg={this.active ? SLIDER_ACTIVE_FILL_COLOR : SLIDER_FILL_COLOR}/>
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
          <i className={`icon-button ${this.state.volume === MIN_VOLUME ? 'icon-mute' : 'icon-audio'} ${this.state.disabled ? 'disabled' : ''} `}
             onClick={() => this.handleMuteClicked()} />
        </div>
      </div>
    );
  }

  private handleMonitorClicked() {
    if (this.props.isPgm) {
      this.audioService.updateAudio({
        pgmMonitor: !this.state.audioMonitor,
      });
      this.setState({
        audioMonitor: !this.state.audioMonitor,
      });
    } else if (this.props.source) {
      this.sourceService.updateSource(this.props.source, {
        audioMonitor: !this.state.audioMonitor,
      });
    }
  }

  private handleAudioLockClicked() {
    if (this.props.source) {
      this.sourceService.updateSource(this.props.source, {
        audioLock: !this.state.audioLock,
      });
    }
  }

  private handleVolumeChange(volume: number) {
    this.setState({
      selectingVolume: volume,
    });
  }

  private handleVolumeChangeEnd(volume: number) {
    this.updateVolume(volume);
  }

  private handleMuteClicked() {
    this.updateVolume(MIN_VOLUME);
  }

  private updateVolume(volume: number) {
    if (this.state.volume !== volume) {
      if (this.props.isPgm) {
        this.audioService.updateAudio({
          masterVolume: volume
        });
      } else if (this.props.source) {
        this.sourceService.updateSource(this.props.source, {
          volume: volume,
        });
      }
    }
  }
}
