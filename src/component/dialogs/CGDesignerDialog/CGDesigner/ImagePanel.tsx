import './ImagePanel.scss';
import React, { ChangeEvent, Component, KeyboardEvent } from 'react';
import { fabric } from 'fabric';
import { Input, List } from 'antd';
import { Container } from 'typedi';
import { MediaService } from '../../../../service/mediaService';
import { Image } from '../../../../common/types';

interface LeftPanelProps {
  canvas: fabric.Canvas;
  handleImageAddClicked: (url: string) => void;
}

interface LeftPanelState {
  search: string;
  images: Image[];
}

export class ImagePanel extends Component<LeftPanelProps, LeftPanelState> {
  private readonly mediaService = Container.get(MediaService);

  public constructor(props: LeftPanelProps) {
    super(props);
    this.state = {
      search: '',
      images: [],
    };
  }

  public componentDidMount() {
    this.mediaService.searchImagesResult.on(this, images => {
      this.setState({
        images: images,
      })
    });
    this.searchImages();
  }

  public componentWillUnmount() {
    this.mediaService.searchImagesResult.off(this);
  }

  public render() {
    return (
      <div className="ImagePanel">
        <Input
          placeholder="Search Image"
          value={this.state.search}
          onChange={this.handleSearchChanged.bind(this)}
          onKeyPress={this.handleSearchKeyDown.bind(this)}
        />
        <List className="Image-List"
              dataSource={this.state.images}
              grid={{ column: 2 }}
              renderItem={item => (
                <List.Item key={item.id} className="Image-List-Item" onClick={() => this.handleImageClicked(item.url)}>
                  <div className='Image-Container'>
                    <img src={item.url} alt=''/>
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
      await this.searchImages();
    }
  }

  private handleImageClicked(url: string) {
    this.props.handleImageAddClicked(url);
  }

  private searchImages() {
    this.mediaService.searchImages(this.state.search);
  }
}
