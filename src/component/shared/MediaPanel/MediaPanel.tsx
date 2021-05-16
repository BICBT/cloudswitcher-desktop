import './MediaPanel.scss';
import React, { ChangeEvent, Component, KeyboardEvent } from 'react';
import { Input, List, Upload } from 'antd';
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Container } from 'typedi';
import { Media, MediaType } from '../../../common/types';
import { MediaService } from '../../../service/MediaService';

interface MediaPanelProps {
  type: MediaType;
  handleMediaClicked: (media: Media) => void;
}

interface MediaPanelState {
  search: string;
  uploading: boolean;
  medias: Media[];
}

export class MediaPanel extends Component<MediaPanelProps, MediaPanelState> {
  private readonly mediaService = Container.get(MediaService);

  public constructor(props: MediaPanelProps) {
    super(props);
    this.state = {
      search: '',
      uploading: false,
      medias: [],
    };
  }

  public async componentDidMount() {
    await this.searchMedias();
  }

  public render() {
    return (
      <div className="MediaPanel">
        <Input
          placeholder={`Search ${this.props.type === MediaType.image ? 'Image' : 'Video'}`}
          value={this.state.search}
          onChange={this.handleSearchChanged.bind(this)}
          onKeyPress={this.handleSearchKeyDown.bind(this)}
        />
        <Upload
          className="Upload"
          accept={this.props.type === MediaType.video ? 'video/*' : 'image/*'}
          showUploadList={false}
          customRequest={options => this.handleMediaUpload(options.file)}
        >
          <div className="UploadButton">
            {this.state.uploading ? <LoadingOutlined /> : <PlusOutlined />}
            <span>Upload</span>
          </div>
        </Upload>
        <List className="MediaList"
              dataSource={this.state.medias}
              grid={{ column: 2 }}
              renderItem={item => (
                <List.Item key={item.id} className="MediaListItem" onClick={() => this.handleMediaClicked(item)}>
                  <div className='MediaContainer'>
                    <img src={item.coverUrl || item.url} alt=''/>
                    <span>{item.name}</span>
                  </div>
                </List.Item>
              )}
        />
      </div>
    );
  }

  private handleSearchChanged(e: ChangeEvent<HTMLInputElement>) {
    this.setState({
      search: e.target.value,
    });
  }

  private async handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      await this.searchMedias();
    }
  }

  private handleMediaClicked(media: Media) {
    this.props.handleMediaClicked(media);
  }

  private async handleMediaUpload(file: File) {
    this.setState({
      uploading: true,
    });
    await this.mediaService.addMedia(file);
    this.setState({
      uploading: false,
    });
    await this.searchMedias();
  }

  private async searchMedias() {
    this.setState({
      medias: await this.mediaService.getMedias(this.props.type, this.state.search),
    })
  }
}
