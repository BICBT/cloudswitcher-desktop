import './Display.scss';
import * as uuid from 'uuid';
import React, { RefObject } from 'react';
import electron from "electron";
import { arraysEquals, getCurrentDisplay, isMac } from '../../../common/util';
import { Container } from 'typedi';
import { ObsService } from '../../../service/ObsService';
import { Bounds } from '../../../common/types';

type DisplayProps = {
  displayIds: string[];
};

type DisplayState = {
  fullscreen: boolean;
};

const DISPLAY_ELEMENT_POLLING_INTERVAL = 500;

export class Display extends React.Component<DisplayProps, DisplayState> {
  private readonly obsService = Container.get(ObsService);
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

  public async componentDidMount() {
    const scaleFactor = getCurrentDisplay().scaleFactor;
    await this.obsService.createDisplay(this.name, this.electronWindowId, scaleFactor, this.props.displayIds);
    if (this.ref.current) {
      await this.trackElement(this.ref.current);
    }
  }

  public async componentDidUpdate(prevProps: Readonly<DisplayProps>, prevState: Readonly<DisplayState>) {
    if (!arraysEquals(this.props.displayIds, prevProps.displayIds)) {
      await this.obsService.updateDisplay(this.name, this.props.displayIds);
    }
  }

  public async componentWillUnmount() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    await this.obsService.destroyDisplay(this.name)
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

  private async trackElement(element: HTMLElement) {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    const trackingFun = async () => {
      const rect = this.getCurrentPosition(element.getBoundingClientRect());
      if (
        rect.x !== this.currentPosition.x ||
        rect.y !== this.currentPosition.y ||
        rect.width !== this.currentPosition.width ||
        rect.height !== this.currentPosition.height) {
        await this.move(rect.x, rect.y, rect.width, rect.height);
      }
    };
    await trackingFun();
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

  private async move(x: number, y: number, width: number, height: number) {
    this.currentPosition.x = x;
    this.currentPosition.y = y;
    this.currentPosition.width = width;
    this.currentPosition.height = height;
    await this.obsService.moveDisplay(this.name, x, y, width, height);
  }

  private async showFullscreen() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    const bounds = getCurrentDisplay().bounds;
    await this.move(0, 0, bounds.width, bounds.height);
    this.setState({
      fullscreen: true,
    });
  }

  private async hideFullscreen() {
    this.setState({
      fullscreen: false,
    });
    if (this.ref.current) {
      await this.trackElement(this.ref.current);
    }
  }
}
