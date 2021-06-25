import React from 'react';
import { Progress } from 'antd';
import { Container } from "typedi";
import { ModalLayout } from '../../shared/ModalLayout/ModalLayout';
import { UpdateService } from "../../../service/UpdateService";
import { DialogProps } from "../../../common/types";

export type UpdateDialogDefault = {
  newVersion: string;
};

type UpdateDialogProps = DialogProps<UpdateDialogDefault, unknown>;

interface UpdateDialogState {
  progress: number;
  downloading: boolean;
  downloaded: boolean;
}

export class UpdateDialog extends React.Component<UpdateDialogProps, UpdateDialogState> {
  private readonly updateService = Container.get(UpdateService);

  constructor(props: UpdateDialogProps) {
    super(props);
    this.state = {
      progress: 0,
      downloading: false,
      downloaded: false,
    };
  }

  public componentDidMount() {
    this.updateService.downloadProgress.on(this, progress => {
      this.setState({
        downloading: true,
        progress: progress.percent,
      });
    });
    this.updateService.downloaded.on(this, async () => {
      this.setState({
        downloading: false,
        downloaded: true,
      });
    });
  }

  public componentWillUnmount() {
    this.updateService.downloadProgress.off(this);
    this.updateService.downloaded.off(this);
  }

  public render() {
    const message = this.state.downloading ? '正在下载...' : this.state.downloaded ? '下载完成，是否重新启动并安装？' : `发现新版本${this.props.default.newVersion}，是否下载并更新？`;
    const okText = this.state.downloaded ? '重新启动' : '下载并更新';
    return (
      <ModalLayout className='UpdateDialog' customControls={
        <>
          <button className="button button--default" onClick={() => this.handleCancel()}>取消</button>
          {
            !this.state.downloading &&
            <button className="button button--action" onClick={() => this.handleOK()}>{okText}</button>
          }
        </>
      }>
        <div>{message}</div>
        {
          this.state.downloading &&
          <Progress percent={this.state.progress} showInfo={false} />
        }
      </ModalLayout>
    );
  }

  private handleCancel() {
    this.props.onModalCancel();
  }

  private async handleOK() {
    if (this.state.downloaded) {
      await this.updateService.quitAndInstall();
    } else {
      await this.updateService.downloadUpdate();
    }
  }
}
