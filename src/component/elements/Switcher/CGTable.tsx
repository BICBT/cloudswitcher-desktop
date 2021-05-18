import './CGTable.scss';
import React from 'react';
import { DialogService } from '../../../service/DialogService';
import { Container } from 'typedi';
import { CGDesignerDialogDefault, CGDesignerDialogResult } from '../../dialogs/CGDesignerDialog/CGDesignerDialog';
import { Table } from 'antd';
import { CG } from '../../../common/types';
import { CGService } from '../../../service/CGService';
import { ColumnType } from 'antd/lib/table/interface';

interface CGTableState {
  cgs: CG[];
}

export class CGTable extends React.Component<unknown, CGTableState> {
  private readonly dialogService: DialogService = Container.get(DialogService);
  private readonly cgService: CGService = Container.get(CGService);

  private readonly columns: ColumnType<CG>[] = [
    {
      key: 'delete',
      align: 'center',
      width: 100,
      render: (cg: CG) => (
        <div className='delete'>
          <i className='icon-button fas fa-trash-alt' onClick={() => this.handleCGDelete(cg)} />
        </div>
      ),
    },
    {
      key: 'name',
      align: 'center',
      render: (cg: CG) => (
        <button className='button--trans' onClick={() => this.handleCGEdit(cg)}>
          {cg.name}
        </button>
      ),
    },
    {
      key: 'upDown',
      align: 'right',
      width: 125,
      render: (cg: CG) => (
        <button className="UpDown-button  button button--default" onClick={() => this.handleUpDownClicked(cg)}>
          { cg.status === 'down' ? 'Up' : 'Down' }
        </button>
      ),
    }
  ];

  public constructor(props: unknown) {
    super(props);
    this.state = {
      cgs: [],
    };
  }

  public async componentDidMount() {
    this.cgService.cgsChanged.on(this, cgs => {
      this.setState({
        cgs: [...cgs],
      });
      this.forceUpdate();
    });
    this.setState({
      cgs: await this.cgService.getCGs(),
    });
  }

  public componentWillUnmount() {
    this.cgService.cgsChanged.off(this);
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

  private async handleCGDelete(cg: CG) {
    await this.cgService.deleteCG(cg);
  }

  private async addOrUpdateCG(cg?: CG) {
    const result = await this.dialogService.showDialog<CGDesignerDialogDefault, CGDesignerDialogResult>({
      title: 'CG Designer',
      component: 'CGDesignerDialog',
      width: 1000,
      height: 700,
    }, {
      cg: cg,
    });
    if (result?.cg) {
      if (!cg) {
        await this.cgService.addCG(result.cg);
      } else {
        await this.cgService.updateCG(result.cg);
      }
    }
  }

  private async handleUpDownClicked(cg: CG) {
    if (cg.status === 'down') {
      await this.cgService.upCG(cg);
    } else {
      await this.cgService.downCG(cg);
    }
  }
}
