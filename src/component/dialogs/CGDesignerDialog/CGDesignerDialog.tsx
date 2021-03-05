import React, { ChangeEvent } from 'react';
import * as uuid from 'uuid';
import { CG, DialogProps } from '../../../common/types';
import { ModalLayout } from '../../shared/ModalLayout/ModalLayout';
import { CGDesigner } from './CGDesigner/CGDesigner';
import { Input, Modal } from 'antd';

export interface CGDesignerDialogResult {
  cg: CG;
}

interface CGDesignerDialogProps extends DialogProps<CGDesignerDialogResult> {
}

interface CGDesignerDialogState {
  cgName?: string;
  saveModalVisible: boolean;
}

export class CGDesignerDialog extends React.Component<CGDesignerDialogProps, CGDesignerDialogState> {
  private readonly designerRef: React.RefObject<CGDesigner>;
  private readonly cg: CG | undefined;

  public constructor(props: CGDesignerDialogProps) {
    super(props);
    this.designerRef = React.createRef();
    this.cg = this.props.defaultValue as CG | undefined;
    this.state = {
      saveModalVisible: false,
      cgName: this.cg?.name,
    };
  }

  public render() {
    return (
      <ModalLayout
        onDoneClicked={() => this.onModalDone()}
        onCancelClicked={() => this.props.onModalCancel()}>
        <CGDesigner
          ref={this.designerRef}
          cg={this.cg}
          canvasWidth={960}
          canvasHeight={540}
        />
        <Modal
          title="Save"
          visible={this.state.saveModalVisible}
          onOk={this.handleSaveModelOK.bind(this)}
          onCancel={this.handleSaveModelCancel.bind(this)}
        >
          <Input
            placeholder="Input CG name"
            value={this.state.cgName}
            onChange={this.handleCGNameChanged.bind(this)}
            required={true}
          />
        </Modal>
      </ModalLayout>
    )
  }

  private onModalDone() {
    this.setState({
      saveModalVisible: true,
    });
  }

  private handleSaveModelOK() {
    this.setState({
      saveModalVisible: false,
    });
    if (this.designerRef.current && this.state.cgName) {
      this.props.onModalDone({
        cg: {
          id: this.cg?.id ?? uuid.v4(),
          name: this.state.cgName,
          ...this.designerRef.current.getCG(),
        },
      });
    }
  }

  private handleSaveModelCancel() {
    this.setState({
      saveModalVisible: false,
    });
  }

  private handleCGNameChanged(event: ChangeEvent<HTMLInputElement>) {
    this.setState({
      cgName: event.target.value,
    });
  }
}
