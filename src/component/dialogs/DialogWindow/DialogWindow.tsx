import './DialogWindow.scss';
import React, { ComponentType } from 'react';
import { Container } from 'typedi';
import { DialogComponent, DialogProps } from '../../../common/types';
import { TitleBar } from '../../shared/TitleBar/TitleBar';
import { DialogService } from '../../../service/DialogService';
import { SourceDialog } from '../SourceDialog/SourceDialog';
import { PreferenceDialog } from '../PreferenceDialog/PreferenceDialog';
import { CGDesignerDialog } from '../CGDesignerDialog/CGDesignerDialog';
import { UpdateDialog } from "../UpdateDialog/UpdateDialog";

const dialogComponents: Record<DialogComponent, ComponentType<DialogProps<any, any>>> = {
  'SourceDialog': SourceDialog,
  'PreferenceDialog': PreferenceDialog,
  'CGDesignerDialog': CGDesignerDialog,
  'UpdateDialog': UpdateDialog,
};

type DialogWindowState = {
  sessionId?: string;
  title?: string
  component?: DialogComponent;
  default?: any;
};

export class DialogWindow extends React.Component<{}, DialogWindowState> {
  private readonly dialogService: DialogService = Container.get(DialogService);

  constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public componentDidMount() {
    this.dialogService.showDialogRequested.on(this, request => {
      this.setState({
        sessionId: request.sessionId,
        title: request.title,
        component: request.component,
        default: request.default,
      });
    });
  }

  public componentWillUnmount() {
    this.dialogService.showDialogRequested.off(this);
  }

  public render() {
    const DialogComponent = this.state.component && dialogComponents[this.state.component];
    return (
      <div className='DialogWindow night-theme'>
        {
          this.state.title &&
          <TitleBar
            title={this.state.title}
            onCloseClicked={() => this.close(undefined)}
          />
        }
        {
          DialogComponent &&
          <DialogComponent
            onModalCancel={() => this.close(undefined)}
            onModalDone={result => this.close(result)}
            default={this.state.default}
          />
        }
      </div>
    );
  }

  private close(result: any) {
    const sessionId = this.state.sessionId as string;
    this.setState({
      sessionId: undefined,
      title: undefined,
      component: undefined,
    }, () => {
      this.dialogService.closeDialog(sessionId, result);
    });
  }
}
