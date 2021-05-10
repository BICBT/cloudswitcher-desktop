import './AudioMixer.scss';
import React from 'react';
import { Container } from 'typedi';
import { sequence } from '../../../common/util';
import { SOURCE_COUNT } from '../../../common/constant';
import { MIN_VOLUME, MixerItem } from './MixerItem';
import { Checkbox } from '@chakra-ui/react';
import { AudioService } from '../../../service/AudioService';
import { SourceService } from '../../../service/SourceService';
import { Source } from '../../../common/types';
import { Audio } from 'obs-node';

export interface AudioMixerState {
  audio?: Audio;
  sources?: Source[];
  activeSource?: Source;
}

export class AudioMixer extends React.Component<{}, AudioMixerState> {
  private readonly sourceService: SourceService = Container.get(SourceService);
  private readonly audioService: AudioService = Container.get(AudioService);

  public constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public async componentDidMount() {
    this.audioService.audioChanged.on(this, audio => {
      this.setState({
        audio: audio,
      });
      this.forceUpdate();
    })
    this.sourceService.sourcesChanged.on(this, sources => {
      this.setState({
        sources: sources,
      });
      this.forceUpdate();
    });
    this.sourceService.sourceChanged.on(this, source => {
      const sources = [...this.state.sources || []];
      const index = sources.findIndex(s => s.id === source.id);
      if (index > -1) {
        sources.splice(index, 1, source);
        this.setState({
          sources: sources,
        });
        this.forceUpdate();
      }
    });
    this.sourceService.programChanged.on(this, e => {
      this.setState({
        activeSource: e.current.source,
      });
      this.forceUpdate();
    });
    this.setState({
      audio: await this.audioService.getAudio(),
      sources: await this.sourceService.getSources(),
      activeSource: (await this.sourceService.getProgramTransition())?.source,
    });
  }

  public componentWillUnmount() {
    this.audioService.audioChanged.off(this);
    this.sourceService.sourcesChanged.off(this);
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
            this.state.sources &&
            sequence(0, SOURCE_COUNT - 1).map(index => {
              const source = (this.state.sources || []).find(s => s.index === index);
              return (
                <MixerItem
                  key={source?.id ?? index}
                  index={index}
                  pgm={false}
                  volume={source?.volume ?? MIN_VOLUME}
                  audioLock={source?.audioLock ?? false}
                  monitor={source?.monitor ?? false}
                  disabled={!source}
                  active={source ? this.checkSourceActive(source) : false}
                  muted={source?.volume === MIN_VOLUME}
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
              audioLock={false}
              monitor={false}
              disabled={!this.state.audio}
              active={false}
              muted={this.state.audio?.volume === MIN_VOLUME}
              handleVolumeChanged={volume => this.handleAudioVolumeChanged(volume)}
              handleMonitorChanged={() => {}}
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

  private async handleSourceVolumeChanged(source: Source, volume: number): Promise<void> {
    await this.sourceService.updateVolume(source, volume);
  }

  private async handleSourceMonitorChanged(source: Source, monitor: boolean): Promise<void> {
    await this.sourceService.updateMonitor(source, monitor);
  }

  private async handleSourceAudioLockChanged(source: Source, audioLock: boolean): Promise<void> {
    await this.sourceService.updateAudioLock(source, audioLock);
  }

  private async handleAudioVolumeChanged(volume: number): Promise<void> {
    await this.audioService.updateVolume(volume);
  }
}
