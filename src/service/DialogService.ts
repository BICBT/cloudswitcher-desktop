import { ipcRenderer, remote } from 'electron';
import * as uuid from 'uuid';
import { Service } from 'typedi';
import { isDialogWindow, isMainWindow } from '../common/util';
import { SimpleEvent } from '../common/event';
import { DialogComponent, DialogOptions } from '../common/types';

export type SessionId = string;
type Resolver = (result: any) => void;

export type ShowDialogRequest = {
  sessionId: SessionId;
  component: DialogComponent;
  title: string;
  default: any;
};

@Service()
export class DialogService {
  private readonly resolvers: Map<SessionId, Resolver> = new Map<SessionId, Resolver>();
  public showDialogRequested = new SimpleEvent<ShowDialogRequest>();

  public async initialize(): Promise<void> {
    if (isDialogWindow()) {
      ipcRenderer.on('showDialog', (event, sessionId: SessionId, options: DialogOptions, defaultValue: any) => {
        this.showDialogRequested.emit({
          sessionId: sessionId,
          component: options.component,
          title: options.title,
          default: defaultValue,
        });
        const dialogWindow = remote.getCurrentWindow();
        dialogWindow.setSize(options.width, options.height);
        dialogWindow.center();
        dialogWindow.show();
      });
    } else if (isMainWindow()) {
      ipcRenderer.on('dialogClosed', (event, sessionId: SessionId, result: any) => {
        const resolver = this.resolvers.get(sessionId);
        if (!resolver) {
          console.log(`Unexpected behaviour: cannot find resolver`);
          return;
        }
        this.resolvers.delete(sessionId);
        resolver(result);
      });
    }
  }

  public showDialog<T, R>(options: DialogOptions, defaultValue: T): Promise<R | undefined> {
    if (isDialogWindow()) {
      throw new Error(`Only main window can request show dialog.`);
    }
    const sessionId: SessionId = uuid.v4();
    ipcRenderer.send('showDialog', sessionId, options, defaultValue);
    return new Promise(resolve => {
      this.resolvers.set(sessionId, resolve);
    });
  }

  public closeDialog(sessionId: SessionId, result: any) {
    if (!isDialogWindow()) {
      throw new Error(`Only dialog window can request dialog closed.`);
    }
    remote.getCurrentWindow().hide();
    ipcRenderer.send('dialogClosed', sessionId, result);
  }
}
