import './MediaTab.scss';
import 'video.js/dist/video-js.css';
import React, { RefObject } from 'react';
import videojs from 'video.js';
import { Checkbox, Drawer, Form, Input, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { SourceDialogDefault } from './SourceDialog';
import { MediaPanel } from '../../shared/MediaPanel/MediaPanel';
import { Media, MediaType } from '../../../common/types';
import { Container } from 'typedi';
import { MediaService } from '../../../service/MediaService';

export interface MediaState {
  index: number;
  name?: string;
  mediaId?: string;
  playOnActive?: boolean;
  hardwareDecoder?: boolean;
  showValidation: boolean,
}

export interface MediaTabProps {
  state: MediaState;
  handleStateChanged: (state: MediaState) => void;
}

export interface MediaTabState {
  showMediaPanel: boolean;
  url?: string;
}

export function initMediaState(value: SourceDialogDefault): MediaState {
  return {
    index: value.index,
    name: value.source?.name,
    mediaId: value.source?.mediaId,
    playOnActive: value.source?.playOnActive,
    hardwareDecoder: value.source?.hardwareDecoder,
    showValidation: false,
  };
}

export class MediaTab extends React.Component<MediaTabProps, MediaTabState> {
  private readonly mediaService = Container.get(MediaService);
  private readonly videoRef: RefObject<HTMLVideoElement> = React.createRef<HTMLVideoElement>();
  private player?: videojs.Player;

  public constructor(props: MediaTabProps) {
    super(props);
    this.state = {
      showMediaPanel: false,
    };
  }

  public async componentDidMount() {
    this.player = videojs(this.videoRef.current);
    if (this.props.state.mediaId) {
      await this.refreshMedia(this.props.state.mediaId);
    }
  }

  public componentWillUnmount() {
    if (this.player) {
      this.player.dispose();
      this.player = undefined;
    }
  }

  public render() {
    return (
      <Form className='MediaTab' layout="vertical">
        <Form.Item
          validateStatus={this.props.state.showValidation && !this.props.state.name ? 'error' : undefined }
          help={this.props.state.showValidation && !this.props.state.name ? `Name can't be empty` : undefined }
          label="Name">
          <Input value={this.props.state.name} onChange={e => this.handleNameChanged(e.target.value)} />
        </Form.Item>
        <Form.Item label="Media">
          {
            !this.props.state.mediaId &&
            <div className="SelectMedia" onClick={() => this.handleSelectMediaClicked()}>
              <PlusOutlined />
              <span>Select Media</span>
            </div>
          }
          <div className="VideoContainer" hidden={!this.props.state.mediaId}>
            <video className="video-js vjs-default-skin vjs-big-play-centered"
                   controls
                   width={320}
                   height={180}
                   ref={this.videoRef} />
            <i className="icon-button fas fa-edit" onClick={() => this.handleSelectMediaClicked()} />
          </div>
        </Form.Item>
        <Form.Item>
          <Checkbox checked={this.props.state.playOnActive} onChange={e => this.handlePlayOnActiveChanged(e.target.checked)}>
            <div className="PlayOnActiveLabel">
              <span>Play On Active</span>
              <Tooltip title="Start playing media after source is outputted">
                <i className="fas fa-info-circle"/>
              </Tooltip>
            </div>
          </Checkbox>
        </Form.Item>
        <Form.Item>
          <Checkbox checked={this.props.state.hardwareDecoder} onChange={e => this.handleHardwareDecoderChanged(e.target.checked)}>
            GPU Decode
          </Checkbox>
        </Form.Item>
        {
          this.state.showMediaPanel &&
          <Drawer
            getContainer={false}
            style={{ position: 'absolute' }}
            placement='left'
            width={300}
            closable={false}
            visible={this.state.showMediaPanel}
            onClose={(() => this.handleMediaPanelClosed())}>
            <MediaPanel
              type={MediaType.video}
              handleMediaClicked={media => this.handleMediaSelected(media)}
            />
          </Drawer>
        }
      </Form>
    );
  }

  private handleNameChanged(name: string): void {
    this.props.handleStateChanged({
      ...this.props.state,
      name: name,
    });
  }

  private handleSelectMediaClicked(): void {
    this.setState({
      showMediaPanel: true,
    });
  }

  private async handleMediaSelected(media: Media): Promise<void> {
    this.props.handleStateChanged({
      ...this.props.state,
      mediaId: media.id,
    });
    this.setState({
      showMediaPanel: false,
    });
    await this.refreshMedia(media.id);
  }

  private handleMediaPanelClosed(): void {
    this.setState({
      showMediaPanel: false,
    });
  }

  private handlePlayOnActiveChanged(playOnActive: boolean) {
    this.props.handleStateChanged({
      ...this.props.state,
      playOnActive: playOnActive,
    });
  }

  private handleHardwareDecoderChanged(hardwareDecoder: boolean): void {
    this.props.handleStateChanged({
      ...this.props.state,
      hardwareDecoder: hardwareDecoder,
    });
  }

  private async refreshMedia(mediaId: string): Promise<void> {
    const url = (await this.mediaService.getMedia(mediaId)).url;
    this.setState({
      url: url,
    });
    this.player?.pause();
    this.player?.src({ src: url });
  }
}
