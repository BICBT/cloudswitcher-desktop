import './CGDesigner.scss';
import React from 'react';
import { Toolbar } from './Toolbar';
import { fabric } from 'fabric';
import { Drawer } from 'antd';
import { ImagePanel } from './ImagePanel';
import { CG, CGImage, CGItem, CGText } from '../../../../common/types';

interface CGDesignerProps {
  cg?: CG;
  canvasWidth: number;
  canvasHeight: number;
}

interface CGDesignerState {
  canvas?: fabric.Canvas;
  showImagePanel: boolean;
  saveModalVisible: boolean;
}

export class CGDesigner extends React.Component<CGDesignerProps, CGDesignerState> {
  public constructor(props: CGDesignerProps) {
    super(props);
    this.state = {
      showImagePanel: false,
      saveModalVisible: false,
    };
  }

  public getCG() {
    return {
      snapshotBase64: this.getSnapshotBase64(),
      items: this.getCGItems(),
    }
  }

  public componentDidMount() {
    const canvas = new fabric.Canvas('main-canvas', {
      width: this.props.canvasWidth,
      height: this.props.canvasHeight,
      selection: false,
    });
    this.setState({
      canvas: canvas,
    }, () => {
      if (this.props.cg) {
        this.loadCG(this.props.cg);
      }
    });
  }

  public render() {
    return (
      <div className='CGDesigner'>
        {
          this.state.canvas &&
          <Toolbar
            canvas={this.state.canvas}
            handleAddTextClicked={this.handleAddTextClicked.bind(this)}
            handleAddImageClicked={this.handleAddImageClicked.bind(this)}
          />
        }
        <div className='Canvas-container'>
          <div className="canvas-area"
               style={{
                 width: this.props.canvasWidth,
                 height: this.props.canvasHeight,
               }}>
            <canvas id='main-canvas' />
          </div>
          {
            this.state.canvas && this.state.showImagePanel &&
            <Drawer
              getContainer={false}
              style={{ position: 'absolute' }}
              placement='left'
              width={300}
              closable={false}
              visible={this.state.showImagePanel}
              onClose={this.closeImagePanel.bind(this)}>
              <ImagePanel
                canvas={this.state.canvas}
                handleImageAddClicked={this.handleImageAddClicked.bind(this)}
              />
            </Drawer>
          }
        </div>
      </div>
    );
  }

  private handleAddTextClicked() {
    this.addText(100, 100, 200, 20, 'Add Text', 18, 'SimSun', 'black');
  }

  private handleAddImageClicked() {
    this.setState({
      showImagePanel: true,
    });
  }

  private handleImageAddClicked(url: string) {
    this.addImage(100, 100, 200, 200, url);
    this.setState({
      showImagePanel: false,
    });
  }

  private closeImagePanel() {
    this.setState({
      showImagePanel: false,
    });
  }

  private getSnapshotBase64(): string {
    this.state.canvas?.discardActiveObject().renderAll();
    return this.state.canvas?.toDataURL({
      format: 'png',
      multiplier: 0.5,
    }) ?? '';
  }

  private getCGItems(): CGItem[] {
    const items: CGItem[] = [];
    if (this.state.canvas) {
      this.state.canvas.getObjects().forEach(o => {
        if (o.type === 'image') {
          const image: CGImage = {
            type: 'image',
            x: o.left ?? 0,
            y: o.top ?? 0,
            width: o.width ?? 0,
            height: o.height ?? 0,
            layer: this.state.canvas?.getObjects().indexOf(o) ?? 0,
            url: (o as any).url
          };
          items.push(image);
        } else if (o.type === 'text') {
          const text: CGText = {
            type: 'text',
            x: o.left ?? 0,
            y: o.top ?? 0,
            width: o.width ?? 0,
            height: o.height ?? 0,
            layer: this.state.canvas?.getObjects().indexOf(o) ?? 0,
            content: (o as fabric.Text).text ?? '',
            fontSize: (o as fabric.Text).fontSize ?? 0,
            fontFamily: (o as fabric.Text).fontFamily ?? '',
            colorHex: (o as fabric.Text).fill as string,
          };
          items.push(text);
        }
      });
    }
    return items;
  }

  private loadCG(cg: CG) {
    [...cg.items].sort((i1, i2) => i1.layer - i2.layer).forEach(i => {
      if (i.type === 'image') {
        const image = i as CGImage;
        this.addImage(image.x, image.y, image.width, image.height, image.url);
      } else if (i.type === 'text') {
        const text = i as CGText;
        this.addText(text.x, text.y, text.width, text.height, text.content, text.fontSize, text.fontFamily, text.colorHex);
      }
    });
    this.state.canvas?.renderAll();
  }

  private addText(x: number, y: number, width: number, height: number, content: string, fontSize: number, fontFamily: string, textColor: string) {
    console.log(`addText: ${content}`);
    const text = new fabric.Textbox(content, {
      type: 'text',
      left: x,
      top: y,
      width: width,
      height: height,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
    });
    text.setControlsVisibility({
      tl: false,
      tr: false,
      bl: false,
      br: false,
      mb: false,
      mt: false,
      mtr: false,
    });
    this.state.canvas?.add(text);
    this.state.canvas?.setActiveObject(text);
    this.state.canvas?.renderAll();
  };

  private addImage(x: number, y: number, width: number, height: number, url: string) {
    return fabric.Image.fromURL(url, (image) => {
      image.set({
        left: x,
        top: y,
      });
      image.setControlsVisibility({
        mb: false,
        mr: false,
        mt: false,
        ml: false,
        mtr: false,
      });
      (image as any).url = url;
      image.scaleToWidth(width);
      this.state.canvas?.add(image);
      this.state.canvas?.setActiveObject(image);
    });
  }
}
