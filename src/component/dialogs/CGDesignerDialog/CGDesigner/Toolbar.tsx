import './Toolbar.scss';
import React, { ChangeEvent, Component } from 'react';
import { fabric } from 'fabric';
import { SketchPicker } from 'react-color';
import { SourceService } from '../../../../service/SourceService';
import { Container } from 'typedi';
import { Input, remote } from "electron";
import { isMac } from '../../../../common/util';

interface ToolbarProps {
  canvas: fabric.Canvas;
  handleAddImageClicked: () => void;
  handleAddTextClicked: () => void;
}

interface ToolbarState {
  displayColorPicker: boolean;
  fontLoaded: boolean;
  showPreview: boolean;
}

export class Toolbar extends Component<ToolbarProps, ToolbarState> {
  private readonly sourceSource = Container.get(SourceService);
  private readonly copiedObjects: fabric.Object[] = [];

  constructor(props: ToolbarProps) {
    super(props);
    this.state = {
      displayColorPicker: false,
      fontLoaded: false,
      showPreview: false,
    };
    this.props.canvas.on('selection:created', () => {
      this.forceUpdate();
    });
    this.props.canvas.on('selection:updated', () => {
      this.forceUpdate();
    });
    this.props.canvas.on('selection:cleared', () => {
      this.forceUpdate();
    });
    this.props.canvas.on('object:moving', () => {
      this.forceUpdate();
    });
    this.props.canvas.on('object:scaling', () => {
      this.forceUpdate();
    });
  }

  get fontFamily(): string {
    return this.getTextOptions('fontFamily');
  }

  set fontFamily(fontFamily: string) {
    this.setTextOptions({ fontFamily });
  }

  get fontSize() {
    return this.getTextOptions('fontSize');
  }

  set fontSize(fontSize: number) {
    this.setTextOptions({ fontSize });
  }

  get textColor(): string {
    return this.getTextOptions('fill');
  }

  set textColor(color: string) {
    this.setTextOptions({ fill: color });
  }

  get position(): string {
    const object = this.props.canvas.getActiveObject();
    return `${Math.trunc(object.left ?? 0)}, ${Math.trunc(object.top ?? 0)}, ${Math.trunc(object.getScaledWidth() ?? 0)}, ${Math.trunc(object.getScaledHeight() ?? 0)}`;
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        fontLoaded: true,
      });
    }, 0);
    remote.getCurrentWebContents().on('before-input-event', this.handleKeyEvents);
  }

  componentWillUnmount() {
    remote.getCurrentWebContents().off('before-input-event', this.handleKeyEvents);
  }

  render() {
    const selectedObject = this.props.canvas.getActiveObject();
    return (
      <div className="Toolbar">
        {
          // to load fonts, we need insert an empty span
          !this.state.fontLoaded &&
          <>
            <span style={{ fontFamily: 'SimHei' }}>&nbsp;</span>
            <span style={{ fontFamily: 'Microsoft YaHei' }}>&nbsp;</span>
            <span style={{ fontFamily: 'KaiTi' }}>&nbsp;</span>
          </>
        }
        <div className="Toolbar-item operation-container">
          <i className="toolbar-icon fas fa-font" title="Add Text" onClick={this.handleAddTextClicked.bind(this)}/>
          <i className="toolbar-icon fas fa-images" title="Add Image" onClick={this.handleAddImageClicked.bind(this)}/>
          <i className={`toolbar-icon fas fa-eye ${this.state.showPreview ? 'selected' : ''}`} title="Show Preview"
             onClick={this.togglePreview}/>
        </div>
        {
          selectedObject &&
          <>
            {
              selectedObject.type === 'text' &&
              <>
                <div className="Toolbar-item font-family-container">
                  <select onChange={this.setFontFamily} title="Font Family" value={this.fontFamily}>
                    <option value='SimHei'>黑体</option>
                    <option value='Microsoft YaHei'>微软雅黑</option>
                    <option value='KaiTi'>楷体</option>
                  </select>
                </div>
                <div title="Font Size" className="Toolbar-item font-size-container">
                  <select onChange={this.setFontSize} value={this.fontSize}>
                    <option>10</option>
                    <option>12</option>
                    <option>14</option>
                    <option>16</option>
                    <option>18</option>
                    <option>20</option>
                    <option>22</option>
                    <option>24</option>
                    <option>26</option>
                    <option>28</option>
                    <option>30</option>
                    <option>32</option>
                    <option>34</option>
                    <option>36</option>
                    <option>38</option>
                    <option>40</option>
                  </select>
                </div>
                <div className="Toolbar-item font-color-container" onClick={this.openColorPicker}>
                  <div className="primcol textcolpick" style={{ backgroundColor: this.textColor }} />
                  <i className="fas fa-angle-down"/>
                </div>
                {
                  this.state.displayColorPicker &&
                  <div className='ColorPicker-popover'>
                    <div className='ColorPicker-cover' onClick={this.closeColorPicker}/>
                    <SketchPicker color={this.textColor} onChangeComplete={this.setTextColor}/>
                  </div>
                }
              </>
            }
            <div className="Toolbar-item overlap-container">
              <i className="toolbar-icon fas fa-arrow-up" title="Bring Forward" onClick={this.bringForward}/>
              <i className="toolbar-icon fas fa-arrow-down" title="Send Backwards" onClick={this.sendBackwards}/>
            </div>
            <div className="Toolbar-item delete-container">
              <i className="toolbar-icon fas fa-trash-alt" title="Delete" onClick={this.deleteObject}/>
            </div>
            <div className="Toolbar-item position-container">
              <span>{this.position}</span>
            </div>
          </>
        }
      </div>
    );
  }

  private handleAddTextClicked() {
    this.props.handleAddTextClicked();
  }

  private handleAddImageClicked() {
    this.props.handleAddImageClicked();
  }

  togglePreview = async () => {
    if (this.state.showPreview) {
      this.props.canvas.backgroundImage = undefined;
      this.props.canvas.renderAll();
    } else {
      const previewSource = await this.sourceSource.getPreviewSource();
      if (previewSource) {
        const imageBase64 = await this.sourceSource.screenshot(previewSource);
        fabric.Image.fromURL(`data:image/png;base64,${imageBase64}`, (image) => {
          image.scaleToWidth(this.props.canvas.width ?? 0);
          this.props.canvas.backgroundImage = image;
          this.props.canvas.renderAll();
        });
      }
    }
    this.setState({
      showPreview: !this.state.showPreview,
    });
  };

  setFontFamily = async (event: ChangeEvent<HTMLSelectElement>) => {
    this.fontFamily = event.target.value;
  };

  setFontSize = (event: ChangeEvent<HTMLSelectElement>) => {
    this.fontSize = Number(event.target.value);
  };

  setTextColor = (color: {hex: string}) => {
    this.textColor = color.hex;
  };

  openColorPicker = () => {
    this.setState({
      displayColorPicker: true,
    });
  };

  closeColorPicker = () => {
    this.setState({
      displayColorPicker: false,
    });
  };

  bringForward = () => {
    this.props.canvas.getActiveObjects().forEach(o => {
      this.props.canvas.bringToFront(o);
    });
    this.props.canvas.renderAll();
  };

  sendBackwards = () => {
    this.props.canvas.getActiveObjects().forEach(o => {
      this.props.canvas.sendBackwards(o);
    });
    this.props.canvas.renderAll();
  };

  deleteObject = () => {
    this.props.canvas.remove(...this.props.canvas.getActiveObjects());
  };

  private getTextOptions(key: keyof fabric.TextOptions) {
    const object = this.props.canvas.getActiveObject();
    if (object && object.type === 'text') {
      return (object as fabric.Text).get(key);
    }
    return undefined;
  }

  private setTextOptions(options: fabric.TextOptions) {
    const object = this.props.canvas.getActiveObject();
    if (object && object.type === 'text') {
      object.setOptions(options);
      this.props.canvas.renderAll();
      this.forceUpdate();
    }
  }

  handleKeyEvents =(event: Event, input: Input) => {
    const object = this.props.canvas?.getActiveObject();
    if (object?.type === 'text' && (object as fabric.Textbox).isEditing) {
      return;
    }
    if (input.type === 'keyDown') {
      if (input.key === 'ArrowUp') {
        this.moveUp();
      } else if (input.key === 'ArrowDown') {
        this.moveDown();
      } else if (input.key === 'ArrowLeft') {
        this.moveLeft();
      } else if (input.key === 'ArrowRight') {
        this.moveRight();
      } else if ((isMac() ? input.meta : input.control) && input.key === 'c') {
        this.copy();
      } else if ((isMac() ? input.meta : input.control) && input.key === 'v') {
        this.paste();
      } else if ((!isMac() && input.key === 'Delete') || (isMac() && input.key === 'Backspace')) {
        this.deleteObject();
      }
      this.props.canvas?.renderAll();
      this.forceUpdate();
    }
  }

  private moveUp() {
    (this.props.canvas?.getActiveObjects() || []).forEach(o => o.top = (o.top ?? 0) - 1);
  }

  private moveDown() {
    (this.props.canvas?.getActiveObjects() || []).forEach(o => o.top = (o.top ?? 0) + 1);
  }

  private moveLeft() {
    (this.props.canvas?.getActiveObjects() || []).forEach(o => o.left = (o.left ?? 0) - 1);
  }

  private moveRight() {
    (this.props.canvas?.getActiveObjects() || []).forEach(o => o.left = (o.left ?? 0) + 1);
  }

  private copy() {
    this.copiedObjects.length = 0;
    (this.props.canvas?.getActiveObjects() || []).forEach(o => {
      this.copiedObjects.push(fabric.util.object.clone(o));
    });
  }

  private paste() {
    this.copiedObjects.forEach(o => {
      const copied = fabric.util.object.clone(o);
      copied.left = (o.left ?? 0) + 10;
      copied.top = (o.top ?? 0) + 10;
      this.props.canvas?.add(copied);
      this.props.canvas?.setActiveObject(copied);
      this.props.canvas?.renderAll();
    });
  }
}
