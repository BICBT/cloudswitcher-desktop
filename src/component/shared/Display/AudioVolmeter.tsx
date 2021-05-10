import './AudioVolmeter.scss';
import React, { RefObject } from 'react';
import { ipcRenderer } from 'electron';
import { compileShader, createProgram, WebGLState } from '../../../common/webgl';

const CHANNEL_WIDTH = 3;
const PADDING_WIDTH = 2;
const PEAK_HEIGHT = 4;
const PEAK_HOLD_CYCLES = 100;
const WARNING_LEVEL = -20;
const DANGER_LEVEL = -9;

// Colors (RGB)
const GREEN = [49, 195, 162];
const YELLOW = [255, 205, 71];
const RED = [252, 62, 63];

const BACKGROUND = { r: 11, g: 22, b: 29 };
const BG_MULTIPLIER = 0.2;

const VERTEX_SHADER = `
attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_scale;

varying vec2 v_position;

void main() {
  // Get the position in unit space
  vec2 position = (a_position * u_scale + u_translation) / u_resolution;

  // Use this position in the fragment shader
  v_position = position;

  // Convert to clip space
  vec2 clipSpace = position * 2.0 - 1.0;

  // convert to vec4
  gl_Position = vec4(clipSpace, 0, 1);
}`;

const FRAGEMENT_SHADER = `
precision mediump float;

// Current volume level from 0 to 1
uniform float u_volume;

// Current peak hold level:
// x: Indicator width from 0 to 1
// y: Volume level from 0 to 1
uniform vec2 u_peakHold;

// Minimum thresholds from 0 to 1
uniform float u_warning;
uniform float u_danger;

// Colors
uniform vec3 u_green;
uniform vec3 u_yellow;
uniform vec3 u_red;

// Brightness multiplier of the background color
uniform float u_bgMultiplier;

// Position of the current pixel from 0 to 1
varying vec2 v_position;

void main() {
  // Default brightness is dark
  vec4 mult = vec4(u_bgMultiplier, u_bgMultiplier, u_bgMultiplier, 1);

  // If the current position is less than the volume, or is within
  // the peak hold band, then it will be bright.
  if (
    (v_position.y < u_volume) ||
    ((v_position.y > u_peakHold.x) && (v_position.y < u_peakHold.x + u_peakHold.y) && u_peakHold.x != 0.0)
  ) {
    mult = vec4(1, 1, 1, 1);
  }

  vec4 baseColor;

  // Set the color based on which band this pixel is in
  if (v_position.y > u_danger) {
    baseColor = vec4(u_red, 1);
  } else if (v_position.y > u_warning) {
    baseColor = vec4(u_yellow, 1);
  } else {
    baseColor = vec4(u_green, 1);
  }

  gl_FragColor = baseColor * mult;
}
`;

function dbToUnitScalar(db: number) {
  return Math.max((db + 60) * (1 / 60), 0);
}

interface AudioVolmeterProps {
  sourceId: string;
}

interface AudioVolmeterState {
  canvasId: number;
}

export class AudioVolmeter extends React.Component<AudioVolmeterProps, AudioVolmeterState> {
  private canvas: RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();
  private spacer: RefObject<HTMLDivElement> = React.createRef<HTMLDivElement>();

  private ctx: CanvasRenderingContext2D | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;

  private positionLocation: number | null;
  private resolutionLocation: WebGLUniformLocation | null = null;
  private translationLocation: WebGLUniformLocation | null = null;
  private scaleLocation: WebGLUniformLocation | null = null;
  private volumeLocation: WebGLUniformLocation | null = null;
  private peakHoldLocation: WebGLUniformLocation | null = null;
  private bgMultiplierLocation: WebGLUniformLocation | null = null;

  private peakHoldCounters: number[] = [];
  private peakHolds: number[] = [];
  private canvasWidth: number = 0;
  private channelCount: number = 0;
  private canvasHeight: number = 0;

  private canvasHeightInterval: number | null;
  private renderingInitialized = false;
  private listener: (e: Electron.Event, sourceId: string, channels: number, magnitude: number[], peak: number[], input_peak: number[]) => void;

  public constructor(props: AudioVolmeterProps) {
    super(props);
    this.handleLostWebglContext = this.handleLostWebglContext.bind(this);
    this.state = {
      canvasId: 1,
    };
  }

  public render() {
    return (
      <div className="AudioVolmeter">
        <canvas className='volmeter' ref={this.canvas} key={this.state.canvasId} />
        <div className="volmeter-spacer" ref={this.spacer}/>
      </div>
    );
  }

  public componentDidMount() {
    this.subscribeVolmeter();
    this.setupNewCanvas();
  }

  public componentWillUnmount() {
    this.canvas.current?.removeEventListener('webglcontextlost', this.handleLostWebglContext);
    WebGLState.activeWebglContexts -= 1;
    if (this.canvasHeightInterval) {
      clearInterval(this.canvasHeightInterval);
    }
    this.unsubscribeVolmeter();
  }

  private setupNewCanvas() {
    // Make sure all state is cleared out
    this.ctx = null;
    this.gl = null;
    this.program = null;
    this.positionLocation = null;
    this.resolutionLocation = null;
    this.translationLocation = null;
    this.scaleLocation = null;
    this.volumeLocation = null;
    this.peakHoldLocation = null;
    this.bgMultiplierLocation = null;
    this.canvasWidth = 0;
    this.channelCount = 0;
    this.canvasHeight = 0;
    this.renderingInitialized = false;
    // Assume 2 channels until we know otherwise. This prevents too much
    // visual jank as the volmeters are initializing.
    this.setChannelCount(2);
    this.setCanvasHeight();
    this.canvasHeightInterval = window.setInterval(() => this.setCanvasHeight(), 500);
  }

  private initRenderingContext() {
    if (this.renderingInitialized) {
      return;
    }
    if (!this.canvas.current) {
      console.error(`Canvas is null.`);
      return;
    }
    this.gl = this.canvas.current.getContext('webgl', { alpha: false });
    if (!this.gl) {
      console.error(`Webgl is not supported.`);
      return;
    }
    this.renderingInitialized = true;
    this.initWebglRendering();
    WebGLState.activeWebglContexts += 1;
    this.canvas.current.addEventListener('webglcontextlost', this.handleLostWebglContext);
  }

  private handleLostWebglContext() {
    // Only do this if there are free contexts, otherwise we will churn forever
    console.warn(`Lost webgl context.`);
    if (WebGLState.activeWebglContexts < 16) {
      console.warn('Lost WebGL context and attempting restore.');

      if (this.canvasHeightInterval) {
        clearInterval(this.canvasHeightInterval);
        this.canvasHeightInterval = null;
      }

      this.canvas.current?.removeEventListener('webglcontextlost', this.handleLostWebglContext);

      WebGLState.activeWebglContexts -= 1;
      this.setState({
        canvasId: this.state.canvasId + 1
      });

      setImmediate(() => {
        this.setupNewCanvas();
      });
    } else {
      console.warn('Lost WebGL context and not attempting restore due to too many active contexts');
    }
  }

  private initWebglRendering() {
    if (!this.gl) {
      return;
    }

    const vShader = compileShader(this.gl, VERTEX_SHADER, this.gl.VERTEX_SHADER);
    const fShader = compileShader(this.gl, FRAGEMENT_SHADER, this.gl.FRAGMENT_SHADER);
    this.program = createProgram(this.gl, vShader, fShader);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // Vertex geometry for a unit square
    // eslint-disable-next-line
    const positions = [
      0, 0,
      0, 1,
      1, 0,
      1, 0,
      0, 1,
      1, 1,
    ];

    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    // look up where the vertex data needs to go.
    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');

    // lookup uniforms
    this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.translationLocation = this.gl.getUniformLocation(this.program, 'u_translation');
    this.scaleLocation = this.gl.getUniformLocation(this.program, 'u_scale');
    this.volumeLocation = this.gl.getUniformLocation(this.program, 'u_volume');
    this.peakHoldLocation = this.gl.getUniformLocation(this.program, 'u_peakHold');
    this.bgMultiplierLocation = this.gl.getUniformLocation(this.program, 'u_bgMultiplier');

    this.gl.useProgram(this.program);

    const warningLocation = this.gl.getUniformLocation(this.program, 'u_warning');
    this.gl.uniform1f(warningLocation, dbToUnitScalar(WARNING_LEVEL));

    const dangerLocation = this.gl.getUniformLocation(this.program, 'u_danger');
    this.gl.uniform1f(dangerLocation, dbToUnitScalar(DANGER_LEVEL));

    // Set colors
    this.setColorUniform('u_green', GREEN);
    this.setColorUniform('u_yellow', YELLOW);
    this.setColorUniform('u_red', RED);
  }

  private setColorUniform(uniform: string, color: number[]) {
    if (!this.gl || !this.program) {
      return;
    }
    const location = this.gl.getUniformLocation(this.program, uniform);
    this.gl.uniform3fv(location, color.map(c => c / 255));
  }

  private setChannelCount(channels: number) {
    if (channels !== this.channelCount) {
      this.channelCount = channels;
      this.canvasWidth = Math.max(
        channels * (CHANNEL_WIDTH + PADDING_WIDTH) - PADDING_WIDTH,
        0,
      );
      if (!this.canvas.current || !this.spacer.current) {
        return;
      }
      this.canvas.current.width = this.canvasWidth;
      this.canvas.current.style.width = `${this.canvasWidth}px`;
      this.spacer.current.style.width = `${this.canvasWidth}px`;
    }
  }

  private setCanvasHeight() {
    if (!this.canvas.current || !this.canvas.current.parentElement) {
      console.error(`Canvas is null`);
      return;
    }
    const height = Math.floor(this.canvas.current.parentElement.offsetHeight);
    if (height !== this.canvasHeight) {
      this.canvasHeight = height;
      this.canvas.current.height = height;
      this.canvas.current.style.height = `${height}px`;
    }
  }

  private drawVolmeterWebgl(peaks: number[]) {
    if (!this.gl) {
      console.error(`WebGL is null.`);
      return;
    }

    const bg = BACKGROUND;
    this.gl.clearColor(bg.r / 255, bg.g / 255, bg.b / 255, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    if (this.canvas.current) {
      this.canvasHeight = this.canvas.current.height;
    }

    if (this.canvasWidth <= 0 || this.canvasHeight <= 0) {
      return;
    }
    this.gl.viewport(0, 0, this.canvasWidth, this.canvasHeight);

    if (this.positionLocation !== null) {
      this.gl.enableVertexAttribArray(this.positionLocation);
      this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    // Set uniforms
    this.gl.uniform2f(this.resolutionLocation, this.canvasWidth, 1);
    this.gl.uniform1f(this.bgMultiplierLocation, BG_MULTIPLIER);

    peaks.forEach((peak, channel) => {
      this.drawVolmeterChannelWebgl(peak, channel);
    });
  }

  private drawVolmeterChannelWebgl(peak: number, channel: number) {
    if (!this.gl) {
      console.error(`WebGL is null.`);
      return;
    }

    this.updatePeakHold(peak, channel);
    this.gl.uniform2f(this.scaleLocation, CHANNEL_WIDTH, 1);
    this.gl.uniform2f(this.translationLocation, channel * (CHANNEL_WIDTH + PADDING_WIDTH), 0);
    this.gl.uniform1f(this.volumeLocation, dbToUnitScalar(peak));

    // X component is the location of peak hold from 0 to 1
    // Y component is height of the peak hold from 0 to 1
    this.gl.uniform2f(
      this.peakHoldLocation,
      dbToUnitScalar(this.peakHolds[channel]),
      PEAK_HEIGHT / this.canvasHeight,
    );
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  updatePeakHold(peak: number, channel: number) {
    if (!this.peakHoldCounters[channel] || peak > this.peakHolds[channel]) {
      this.peakHolds[channel] = peak;
      this.peakHoldCounters[channel] = PEAK_HOLD_CYCLES;
      return;
    }
    this.peakHoldCounters[channel] -= 1;
  }

  subscribeVolmeter() {
    this.listener = (e: Electron.Event, sourceId: string, channels: number, magnitude: number[], peak: number[]) => {
      if (sourceId !== this.props.sourceId) {
        return;
      }
      if (this.canvasWidth <= 0 || this.canvasHeight <= 0) {
        return;
      }
      if (this.canvas.current) {
        // don't init context for inactive sources
        if (!peak.length && !this.renderingInitialized) {
          return;
        }

        this.initRenderingContext();
        this.setChannelCount(peak.length);

        // don't render sources then channelsCount is 0
        // happens when the browser source stops playing audio
        if (!peak.length) {
          return;
        }
        this.drawVolmeterWebgl(peak);
      }
    };
    ipcRenderer.on(`volmeterChanged`, this.listener);
  }

  unsubscribeVolmeter() {
    ipcRenderer.removeListener(`volmeterChanged`, this.listener);
  }
}
