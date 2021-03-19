import './AudioMixer.scss';
import React, { ChangeEvent } from 'react';
import { Container } from 'typedi';
import { sequence } from '../../../common/util';
import { SOURCE_COUNT } from '../../../common/constant';
import { MixerItem } from './MixerItem';
import { Checkbox } from '@chakra-ui/react';
import { AudioService } from '../../../service/audioService';
import { SourceService } from '../../../service/sourceService';
import { Source } from '../../../common/types';

export interface AudioMixerState {
  sources?: Record<number, Source>;
  audioWithVideo?: boolean;
}

export class AudioMixer extends React.Component<{}, AudioMixerState> {
  private readonly sourceService: SourceService = Container.get(SourceService);
  private readonly audioService: AudioService = Container.get(AudioService);

  public constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public componentDidMount() {
    this.setState({
      sources: this.sourceService.sources,
      audioWithVideo: this.audioService.audio.audioWithVideo,
    })
    this.sourceService.sourcesChanged.on(this, sources => {
      this.setState({
        sources: sources,
      });
    });
    this.audioService.audioChanged.on(this, audio => {
      this.setState({
        audioWithVideo: audio.audioWithVideo,
      });
    })
  }

  public componentWillUnmount() {
    this.sourceService.sourcesChanged.off(this);
    this.audioService.audioChanged.off(this);
  }

  public render() {
    const { sources, audioWithVideo } = this.state;
    if (sources === undefined || audioWithVideo === undefined) {
      return null;
    }
    return (
      <div className='AudioMixer'>
        <Checkbox
          className='AudioWithVideo'
          isChecked={audioWithVideo ?? true}
          onChange={event => this.handleAudioWithVideoChanged(event)}>
          音频跟随视频
        </Checkbox>
        <div className='AudioMixerItems'>
          {
            sequence(0, SOURCE_COUNT - 1).map(index => {
              const source = sources[index];
              return (
                <MixerItem
                  key={index}
                  index={index}
                  source={source}
                  audioWithVideo={audioWithVideo}
                  isPgm={false}
                />
              );
            })
          }
          {
            <MixerItem
                key={"pgm"}
                index={SOURCE_COUNT}
                audioWithVideo={audioWithVideo}
                isPgm={true}
            />
          }
        </div>
      </div>
    );
  }

  private handleAudioWithVideoChanged(event: ChangeEvent<HTMLInputElement>) {
    const audioWithVideo = event.target.checked || false;
    this.audioService.updateAudio({
      audioWithVideo: audioWithVideo,
    });
  }
}
