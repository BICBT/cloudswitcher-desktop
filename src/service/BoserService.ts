import { Container, Service } from 'typedi';
import { SourceService } from './SourceService';
import { Source, TransitionType } from "../common/types";
import SerialPort from "serialport";
import { AudioService } from './AudioService';
import { isMainProcess } from '../common/util';

const ByteLength = SerialPort.parsers.ByteLength;

@Service()
export class BoserService {
  private readonly sourceService = Container.get(SourceService);
  private readonly audioService = Container.get(AudioService);
  private boser: any;
  private sources: Source[] = [];
  private previewSource?: Source;

  public async initialize(): Promise<void> {
    if (!isMainProcess()) {
      return;
    }
    const ports = await SerialPort.list();
    if (!ports.length) {
      console.warn('No serial port connected.');
      return;
    }
    this.boser = new SerialPort(ports[0].path, {
      autoOpen: true,
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
    });
    this.sources = await this.sourceService.getSources();
    this.previewSource = await this.sourceService.getPreviewSource();
    this.sourceService.sourcesChanged.on(this, sources => {
      this.sources = sources;
    });
    this.sourceService.previewChanged.on(this, ({ previous, current }) => {
      if (previous) {
        this.boser.write(Buffer.from([0x55, 0x0e, previous.index + 33, 0x00, 0x0d, 0x0a]));
      }
      this.boser.write(Buffer.from([0x55, 0x0e, current.index + 33, 0x02, 0x0d, 0x0a]));
      this.previewSource = current;
    });
    this.sourceService.programChanged.on(this, ({ previous, current }) => {
      if (previous) {
        this.boser.write(Buffer.from([0x55, 0x0e, previous.source.index + 17, 0x00, 0x0d, 0x0a]));
      }
      this.boser.write(Buffer.from([0x55, 0x0e, current.source.index + 17, 0x01, 0x0d, 0x0a]));
    });

    this.boser.write(Buffer.from([0x55, 0x0e, 0xff, 0xbb, 0x0d, 0x0a]));
    const parser = this.boser.pipe(new ByteLength({ length: 4 }));
    parser.on('data', async (receivedata: Buffer) => {
      switch (receivedata[1]) {
        case 0x3d:
          if (Number(receivedata[2]) <= 24 && receivedata[3] === 0x01) { //pgm switch
            const pgmIndex = Number(receivedata[2]) - 17;
            const pgmSource = await this.sources.find(s => s.index === pgmIndex);
            if (pgmIndex >= 0 && pgmSource) {
              await this.sourceService.take(pgmSource);
            }
          } else if (24 < Number(receivedata[2]) && Number(receivedata[2]) <= 40 && receivedata[3] === 0x01) {  //pvw switch
            const pvwIndex = Number(receivedata[2]) - 33;
            const pvwSource = this.sources.find(s => s.index === pvwIndex);
            if (pvwIndex >= 0 && pvwSource) {
              await this.sourceService.preview(pvwSource);
            }
          } else if (receivedata[2] === 0x37 && receivedata[3] === 0x01) {
            if (this.previewSource) {
              await this.sourceService.take(this.previewSource, TransitionType.Cut, 0, true);
            }
          } else if (receivedata[2] === 0x38 && receivedata[3] === 0x01) {
            if (this.previewSource) {
              await this.sourceService.take(this.previewSource, TransitionType.Fade, 2000, true);
            }
          }
          break;
        case 0x31:
          await this.audioService.updateVolume(Math.round(Number(receivedata[3]) * 60 / 100 - 60));
          this.boser.write(receivedata);
          break;
        case 0x32:
          break;
      }
    });
  }
}
