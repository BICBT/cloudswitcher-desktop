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
}

function hexToABGR(hex: string) {
  // convert #rgb to ABGR
  hex = hex.substring(1);
  return `ff${hex.substring(4, 6)}${hex.substring(2, 4)}${hex.substring(0, 2)}`;
}

function abgrToHex(abgr: string) {
  // convert ABGR to #rgb
  return `#${abgr.substring(6, 8)}${abgr.substring(4, 6)}${abgr.substring(2, 4)}`;
}

export class CGDesigner extends React.Component<CGDesignerProps, CGDesignerState> {
  public constructor(props: CGDesignerProps) {
    super(props);
    this.state = {
      showImagePanel: false,
    };
  }

  public getCGItems(): CGItem[] {
    const items: CGItem[] = [];
    if (this.state.canvas) {
      this.state.canvas.discardActiveObject().renderAll();
      this.state.canvas.getObjects().forEach(o => {
        if (o.type === 'image') {
          const image: CGImage = {
            type: 'image',
            x: o.left ?? 0,
            y: o.top ?? 0,
            width: o.getScaledWidth() ?? 0,
            height: o.getScaledHeight() ?? 0,
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
            content: (o as fabric.Text).text ?? '',
            fontSize: (o as fabric.Text).fontSize ?? 0,
            fontFamily: (o as fabric.Text).fontFamily ?? '',
            colorABGR: hexToABGR((o as fabric.Text).fill as string),
          };
          items.push(text);
        }
      });
    }
    return items;
  }

  public componentDidMount() {
    const canvas = new fabric.Canvas('main-canvas', {
      width: this.props.canvasWidth,
      height: this.props.canvasHeight,
      preserveObjectStacking: true,
    });
    // disable group controls
    fabric.Group.prototype.hasControls = false;
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
    this.addText(100, 100, 200, 20, 'Add Text', 18, 'SimSun', '#000000');
  }

  private handleAddImageClicked() {
    this.setState({
      showImagePanel: true,
    });
  }

  private async handleImageAddClicked(url: string) {
    await this.addImage(100, 100, 200, url);
    this.setState({
      showImagePanel: false,
    });
  }

  private closeImagePanel() {
    this.setState({
      showImagePanel: false,
    });
  }

  private async loadCG(cg: CG) {
    for (const item of cg.items)  {
      if (item.type === 'image') {
        const image = item as CGImage;
        await this.addImage(image.x, image.y, image.width, image.url);
      } else if (item.type === 'text') {
        const text = item as CGText;
        this.addText(text.x, text.y, text.width, text.height, text.content, text.fontSize, text.fontFamily, abgrToHex(text.colorABGR));
      }
    }
    this.state.canvas?.discardActiveObject().renderAll();
  }

  private addText(x: number, y: number, width: number, height: number, content: string, fontSize: number, fontFamily: string, textColor: string) {
    const text = new fabric.Textbox(content, {
      type: 'text',
      left: x,
      top: y,
      width: width,
      height: height,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
      padding: 0,
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

  private async addImage(x: number, y: number, width: number, url: string): Promise<fabric.Image> {
    return new Promise(resolve => {
      fabric.Image.fromURL(url, (image) => {
        image.set({
          left: x,
          top: y,
          padding: 0,
        });
        image.setControlsVisibility({
          mb: false,
          mr: false,
          mt: false,
          ml: false,
          mtr: false,
        });
        (image as any).url = url;
        this.state.canvas?.add(image);
        image.scaleToWidth(width);
        this.state.canvas?.setActiveObject(image);
        resolve(image);
      });
    });
  }
}
