import './Canvas.scss';
import React, { Component } from 'react';
import { fabric } from 'fabric';

interface CanvasProps {
  canvasWidth: number;
  canvasHeight: number;
  handleCanvasCreated: (canvas: fabric.Canvas) => void;
}

export class Canvas extends Component<CanvasProps, CanvasState> {

  private canvas?: fabric.Canvas;

  public componentDidMount() {
    this.canvas = new fabric.Canvas('main-canvas', {
      width: this.props.canvasWidth,
      height: this.props.canvasHeight,
      selection: false,
    });
    this.props.handleCanvasCreated(this.canvas);
  }

  public render() {
    return (
      <div className="Canvas">
        <div className="canvas-area"
             style={{
               width: this.props.canvasWidth,
               height: this.props.canvasHeight,
             }}>
          <canvas id='main-canvas'/>
        </div>
      </div>
    );
  }
}
