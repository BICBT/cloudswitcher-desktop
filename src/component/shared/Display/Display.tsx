import './Display.scss';
import * as uuid from 'uuid';
import React, { RefObject } from 'react';
import electron from "electron";
import { getCurrentDisplay, isMac } from '../../../common/util';
import { Container } from 'typedi';
import { DisplayService } from '../../../service/displayService';
import { Bounds } from '../../../common/types';

type DisplayProps = {
  displayId: string;
};

type DisplayState = {
  fullscreen: boolean;
};

const DISPLAY_ELEMENT_POLLING_INTERVAL = 500;

export class Display extends React.Component<DisplayProps, DisplayState> {
  private readonly displayService = Container.get(DisplayService);
  private readonly electronWindowId: number;
  private readonly name: string;
  private currentPosition: Bounds = { x: 0, y: 0, width: 0, height: 0 };
  private trackingInterval?: number;
  private ref: RefObject<HTMLDivElement> = React.createRef();

  constructor(props: DisplayProps) {
    super(props);
    this.name = uuid.v4();
    this.electronWindowId = electron.remote.getCurrentWindow().id;
    this.state = {
      fullscreen: false,
    };
  }

  public componentDidMount() {
    if (this.ref.current) {
      const scaleFactor = getCurrentDisplay().scaleFactor;
      this.displayService.createOBSDisplay(this.name, this.electronWindowId, scaleFactor, this.props.displayId);
      this.trackElement(this.ref.current);
    }
  }

  public componentWillUnmount() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    this.displayService.destroyOBSDisplay(this.name)
  }

  public render() {
    return (
      <div className="Display">
        {
          this.state.fullscreen &&
          <div className='Fullscreen-cover' onDoubleClick={this.hideFullscreen.bind(this)} />
        }
        <div className="Display-content content" ref={this.ref} onDoubleClick={this.showFullscreen.bind(this)} />
      </div>
    );
  }

  private trackElement(element: HTMLElement) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    const trackingFun = () => {
      const rect = this.getCurrentPosition(element.getBoundingClientRect());
      if (
        rect.x !== this.currentPosition.x ||
        rect.y !== this.currentPosition.y ||
        rect.width !== this.currentPosition.width ||
        rect.height !== this.currentPosition.height) {
        this.move(rect.x, rect.y, rect.width, rect.height);
      }
    };
    trackingFun();
    this.trackingInterval = window.setInterval(trackingFun, DISPLAY_ELEMENT_POLLING_INTERVAL);
  }

  private getCurrentPosition(rect: ClientRect): Bounds {
    // Windows: Top-left origin
    // Mac: Bottom-left origin
    const y = isMac() ? window.innerHeight - rect.bottom : rect.top;

    return {
      x: rect.left + 2,
      y: y + 2,
      width: rect.width - 4,
      height: rect.height,
    };
  }

  private move(x: number, y: number, width: number, height: number) {
    this.currentPosition.x = x;
    this.currentPosition.y = y;
    this.currentPosition.width = width;
    this.currentPosition.height = height;
    this.displayService.moveOBSDisplay(this.name, x, y, width, height);
  }

  private showFullscreen() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    const bounds = getCurrentDisplay().bounds;
    this.move(0, 0, bounds.width, bounds.height);
    this.setState({
      fullscreen: true,
    });
  }

  private hideFullscreen() {
    this.setState({
      fullscreen: false,
    });
    if (this.ref.current) {
      this.trackElement(this.ref.current);
    }
  }
}
