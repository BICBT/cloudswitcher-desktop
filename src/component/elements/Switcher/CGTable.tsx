import './CGTable.scss';
import React from 'react';
import { DialogService } from '../../../service/dialogService';
import { Container } from 'typedi';
import { CGDesignerDialogResult } from '../../dialogs/CGDesignerDialog/CGDesignerDialog';
import { Table, Image } from 'antd';
import { CG } from '../../../common/types';
import { CGService } from '../../../service/cgService';
import { ColumnType } from 'antd/lib/table/interface';

interface CGTableState {
  cgs: CG[];
}

export class CGTable extends React.Component<unknown, CGTableState> {
  private readonly dialogService: DialogService = Container.get(DialogService);
  private readonly cgService: CGService = Container.get(CGService);

  private readonly columns: ColumnType<CG>[] = [
    {
      key: 'name',
      dataIndex: 'name',
      align: 'center',
      width: 100,
    },
    {
      key: 'snapshot',
      align: 'center',
      render: (cg: CG) => (
        <div className='snapshot'>
          <Image src={cg.snapshotBase64} preview={false} onClick={() => this.handleCGEdit(cg)} />
        </div>
      ),
    },
    {
      key: 'edit',
      align: 'center',
      width: 100,
      render: (cg: CG) => (
        <div className='delete'>
          <i className='icon-button fas fa-edit' onClick={() => this.handleCGEdit(cg)} />
          <i className='icon-button fas fa-trash-alt' onClick={() => this.handleCGDelete(cg)} />
        </div>
      ),
    },
    {
      key: 'upDown',
      align: 'center',
      width: 100,
      render: (cg: CG) => (
        <div className='edit'>
          <button className="button--action">UP</button>
        </div>
      ),
    }
  ];

  public constructor(props: unknown) {
    super(props);
    this.state = {
      cgs: this.cgService.cgs,
    };
  }

  public render() {
    return (
      <div className='CGTable'>
        <div className='CGTable-header'>
          <h2>CG</h2>
          <button className='button--trans' onClick={this.handleAddCG.bind(this)}>添加</button>
        </div>
        <div className='CGTable-content'>
          <Table
            rowKey="id"
            locale={{emptyText: ''}}
            dataSource={this.state.cgs}
            columns={this.columns}
            showHeader={false}
            pagination={false}
          />
        </div>
      </div>
    );
  }

  private async handleAddCG() {
    await this.addOrUpdateCG();
  }

  private async handleCGEdit(cg: CG) {
    await this.addOrUpdateCG(cg);
  }

  private handleCGDelete(cg: CG) {
    this.cgService.deleteCG(cg);
    this.setState({
      cgs: [...this.cgService.cgs],
    });
  }

  private async addOrUpdateCG(cg?: CG) {
    const result = await this.dialogService.showDialog<CGDesignerDialogResult>({
      title: 'CG Designer',
      component: 'CGDesignerDialog',
      width: 1000,
      height: 700,
    }, cg);
    if (result?.cg) {
      this.cgService.saveCG(result.cg);
      this.setState({
        cgs: [...this.cgService.cgs],
      });
    }
  }
}
