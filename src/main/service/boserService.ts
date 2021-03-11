import {Container, Service} from "typedi";
import {SourceService} from "./sourceService";
import {TransitionType} from "../../common/types";
import * as SerialPort from "serialport";
import ByteLength = SerialPort.parsers.ByteLength;

@Service()
export class BoserService {
    private boser: any;
    private readonly sourceService = Container.get(SourceService);

    constructor() {

    }

    public async initialize(): Promise<void> {
        const ports = await SerialPort.list();
        if (!ports.length) {
            console.warn('No serial port connected.');
            return ;
        }

        this.boser = new SerialPort(ports[0].path, {
            autoOpen: true,
            baudRate: 115200,
            dataBits: 8,
            stopBits: 1,
        });

        this.boser.write(Buffer.from([0x55, 0x0e, 0xff, 0xbb, 0x0d, 0x0a]));

        this.sourceService.previewChanged.on(this, ({lastSource, currentSource}) => {
            if (lastSource) {
                this.boser.write(Buffer.from([0x55, 0x0e, lastSource.index + 33, 0x00, 0x0d, 0x0a]));
            }
            this.boser.write(Buffer.from([0x55, 0x0e, currentSource.index + 33, 0x02, 0x0d, 0x0a]));
        });

        this.sourceService.programChanged.on(this, ({lastSource, currentSource}) => {
            if (lastSource) {
                this.boser.write(Buffer.from([0x55, 0x0e, lastSource.index + 17, 0x00, 0x0d, 0x0a]));
            }
            this.boser.write(Buffer.from([0x55, 0x0e, currentSource.index + 17, 0x01, 0x0d, 0x0a]));
        });

        const parser = this.boser.pipe(new ByteLength({length: 4}));
        parser.on('data', (receivedata: Buffer) => {
              console.log('Data:', receivedata.toString('hex'))
            switch (receivedata[1]){
                case 0x3d:
                    console.log('switch :',receivedata[2]);
                    if (Number(receivedata[2]) <= 24 && receivedata[3] == 0x01){ //pgm switch
                        const pgmIndex = Number(receivedata[2]) - 17;
                        const pgmSource = this.sourceService.sources[pgmIndex];
                        if (pgmIndex >= 0 && pgmSource){
                            this.sourceService.take(pgmSource, TransitionType.Cut, 0);
                        }
                    } else if(24 < Number(receivedata[2]) && Number(receivedata[2]) <= 40 && receivedata[3] == 0x01){  //pvw switch
                        const pvwIndex = Number(receivedata[2]) - 33;
                        const pvwSource = this.sourceService.sources[pvwIndex];
                        if (pvwIndex >= 0 && pvwSource){
                            this.sourceService.preview(pvwSource);
                        }
                    } else if ( receivedata[2] == 0x37 && receivedata[3] == 0x01){    //CUT
                        if (this.sourceService.previewSource) {
                            this.sourceService.take(this.sourceService.previewSource, TransitionType.Cut, 0);
                        }
                    } else if ( receivedata[2] == 0x38 && receivedata[3] == 0x01){    //TAKE
                        if (this.sourceService.previewSource) {
                            this.sourceService.take(this.sourceService.previewSource, TransitionType.Fade, 3000);
                        }
                    }
                    break;
                case 0x31:
                    console.log('aduio :',receivedata[3]);
                    this.boser.write(receivedata);
                    break;
                case 0x32:
                    console.log('T-Bar :',receivedata[3]);
                    break;
            }
          });
    }
}