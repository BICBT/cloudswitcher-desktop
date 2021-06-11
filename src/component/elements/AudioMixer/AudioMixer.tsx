import './AudioMixer.scss';
import React from 'react';
import { Container } from 'typedi';
import { replaceItem, sequence } from '../../../common/util';
import { SOURCE_COUNT } from '../../../common/constant';
import { MIN_VOLUME, MixerItem } from './MixerItem';
import { Checkbox } from '@chakra-ui/react';
import { AudioService } from '../../../service/AudioService';
import { SourceService } from '../../../service/SourceService';
import { Source, Audio } from '../../../common/types';

interface MixerSource extends Source {
  selectingVolume: number;
}

interface MixerAudio extends Audio {
  selectingVolume: number;
}

function getMixerAudio(audio: Audio): MixerAudio {
  return {
    ...audio,
    selectingVolume: audio.volume,
  };
}

function getMixerSource(source: Source): MixerSource {
  return {
    ...source,
    selectingVolume: source.volume,
  };
}

export interface AudioMixerState {
  audio?: MixerAudio;
  sources: MixerSource[];
  activeSource?: Source;
}

export class AudioMixer extends React.Component<{}, AudioMixerState> {
  private readonly sourceService: SourceService = Container.get(SourceService);
  private readonly audioService: AudioService = Container.get(AudioService);

  public constructor(props: {}) {
    super(props);
    this.state = {
      sources: [],
    };
  }

  public async componentDidMount() {
    this.audioService.audioChanged.on(this, audio => {
      this.setState({
        audio: getMixerAudio(audio),
      });
    });
    this.sourceService.sourcesChanged.on(this, sources => {
      this.setState({
        sources: sources.map(getMixerSource),
      });
    });
    this.sourceService.sourceChanged.on(this, source => {
      this.setState({
        sources: replaceItem(this.state.sources, getMixerSource(source), s => s.id === source.id),
      });
    });
    this.sourceService.programChanged.on(this, e => {
      this.setState({
        activeSource: e.current.source,
      });
    });
    const audio = await this.audioService.getAudio();
    this.setState({
      audio: audio && getMixerAudio(audio),
      sources: (await this.sourceService.getSources()).map(getMixerSource),
      activeSource: (await this.sourceService.getProgramTransition())?.source,
    });
  }

  public componentWillUnmount() {
    this.audioService.audioChanged.off(this);
    this.sourceService.sourcesChanged.off(this);
    this.sourceService.sourceChanged.off(this);
    this.sourceService.programChanged.off(this);
  }

  public render() {
    return (
      <div className='AudioMixer'>
        <Checkbox
          className='AudioMode'
          isChecked={this.state.audio?.mode === 'follow'}
          onChange={e => this.handleAudioModeChanged(e.target.checked)}>
          音频跟随视频
        </Checkbox>
        <div className='AudioMixerItems'>
          {
            sequence(0, SOURCE_COUNT - 1).map(index => {
              const source = this.state.sources.find(s => s.index === index);
              return (
                <MixerItem
                  key={source?.id ?? index}
                  index={index}
                  pgm={false}
                  volume={source?.volume ?? MIN_VOLUME}
                  selectingVolume={source?.selectingVolume ?? MIN_VOLUME}
                  audioLock={source?.audioLock ?? false}
                  monitor={source?.monitor ?? false}
                  disabled={!source}
                  active={source ? this.checkSourceActive(source) : false}
                  muted={source?.volume === MIN_VOLUME}
                  handleVolumeChanging={volume => source && this.handleSourceVolumeChanging(source, volume)}
                  handleVolumeChanged={volume => source && this.handleSourceVolumeChanged(source, volume)}
                  handleMonitorChanged={monitor => source && this.handleSourceMonitorChanged(source, monitor)}
                  handleAudioLockChanged={audioLock => source && this.handleSourceAudioLockChanged(source, audioLock)}
                />
              );
            })
          }
          {
            this.state.audio &&
            <MixerItem
              key={"pgm"}
              index={-1}
              pgm={true}
              volume={this.state.audio?.volume ?? MIN_VOLUME}
              selectingVolume={this.state.audio?.selectingVolume ?? MIN_VOLUME}
              audioLock={false}
              monitor={this.state.audio?.monitor}
              disabled={!this.state.audio}
              active={false}
              muted={this.state.audio?.volume === MIN_VOLUME}
              handleVolumeChanging={volume => this.handleAudioVolumeChanging(volume)}
              handleVolumeChanged={volume => this.handleAudioVolumeChanged(volume)}
              handleMonitorChanged={monitor => this.handleAudioMonitorChanged(monitor)}
              handleAudioLockChanged={() => {}}
            />
          }
        </div>
      </div>
    );
  }

  private checkSourceActive(source: Source): boolean {
    return source.audioLock
      || (this.state.audio?.mode === 'follow' && source.id === this.state.activeSource?.id);
  }

  private async handleAudioModeChanged(follow: boolean): Promise<void> {
    await this.audioService.updateMode(follow ? 'follow' : 'standalone');
  }

  private handleSourceVolumeChanging(source: Source, volume: number): void {
    this.setState({
      sources: replaceItem(this.state.sources, { ...source, selectingVolume: volume }, s => s.id === source.id),
    });
  }

  private async handleSourceVolumeChanged(source: Source, volume: number): Promise<void> {
    await this.sourceService.updateVolume(source, volume);
  }

  private async handleSourceMonitorChanged(source: Source, monitor: boolean): Promise<void> {
    await this.sourceService.updateMonitor(source, monitor);
  }

  private async handleSourceAudioLockChanged(source: Source, audioLock: boolean): Promise<void> {
    await this.sourceService.updateAudioLock(source, audioLock);
  }

  private handleAudioVolumeChanging(volume: number): void {
    if (this.state.audio) {
      this.setState({
        audio: {
          ...this.state.audio,
          selectingVolume: volume,
        },
      });
    }
  }

  private async handleAudioVolumeChanged(volume: number): Promise<void> {
    await this.audioService.updateVolume(volume);
  }

  private async handleAudioMonitorChanged(monitor: boolean): Promise<void> {
    await this.audioService.monitor(monitor);
  }
}
