import React, { ChangeEvent } from 'react';
import * as uuid from 'uuid';
import { CG, DialogProps } from '../../../common/types';
import { ModalLayout } from '../../shared/ModalLayout/ModalLayout';
import { CGDesigner } from './CGDesigner/CGDesigner';
import { Input, Modal } from 'antd';

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

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
        customControls={
          <>
            <button className="button button--default" onClick={() => this.cancel()}>Cancel</button>
            <button className="button button--action" onClick={() => this.save()}>Save</button>
            <button className="button button--action" onClick={() => this.saveAs()}>Save As</button>
          </>
        }>
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

  private handleSaveModelOK() {
    if (this.state.cgName) {
      this.onModelDone(this.state.cgName);
      this.setState({
        saveModalVisible: false,
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

  private cancel() {
    this.props.onModalCancel();
  }

  private save() {
    if (!this.state.cgName) {
      return this.saveAs();
    } else {
      this.onModelDone(this.state.cgName);
    }
  }

  private saveAs() {
    this.setState({
      saveModalVisible: true,
    });
  }

  private onModelDone(cgName: string) {
    if (!this.designerRef.current) {
      console.error(`designer is empty`);
      return;
    }
    this.props.onModalDone({
      cg: {
        id: this.cg?.id ?? uuid.v4(),
        name: cgName,
        type: 'cg',
        status: this.cg?.status ?? 'down',
        baseWidth: CANVAS_WIDTH,
        baseHeight: CANVAS_HEIGHT,
        items: this.designerRef.current.getCGItems(),
      },
    });
  }
}
