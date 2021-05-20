import './SelectSwitcher.scss';
import React from 'react';
import { Table, Space, Divider, Button } from 'antd';
import axios from 'axios';
import "antd/dist/antd.css";
import { SWITCHER_BASE_URL } from '../../../common/constant';
import { Switcher } from '../../../common/types';
import { ipcRenderer, remote } from 'electron';
import { Container } from 'typedi';
import { SwitcherService } from '../../../service/SwitcherService';

export interface SwitcherPageProps {
    history: {
        push: (path: string) => void;
    }
}

export interface SwitcherPageState {
    loading: boolean;
    data: Switcher[];
    keyIndex: number;
    selectedSwitcherIds: string[];
}

export class SelectSwitcher extends React.Component<SwitcherPageProps, SwitcherPageState>{
    private readonly switcherService = Container.get(SwitcherService);
    private columns = [
        {
            title: '导播台名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '类型',
            dataIndex: 'format',
            key: 'format'
        },
        {
            title: '地域',
            dataIndex: 'region',
            key: 'region'
        },
    ];

    public constructor(props: SwitcherPageProps) {
        super(props);
        this.state = {
            loading: false,
            data: [],
            keyIndex: 0,
            selectedSwitcherIds: [],
        };
        this.startClick = this.startClick.bind(this);
        this.handleInitialized = this.handleInitialized.bind(this);
    }

    public async componentDidMount(): Promise<void> {
        ipcRenderer.on('initialized', this.handleInitialized);
        await this.refresh();
    }

    public componentWillUnmount(): void {
        ipcRenderer.off('initialized', this.handleInitialized);
    }

    public render(): JSX.Element {
        return (
          <div className="SelectPage">
              <Space className="title">
                  请选择你要开启的导播台&nbsp;&nbsp;&nbsp;
                  <i className="icon-button fas fa-sync-alt" onClick={() => this.refreshClick()} />
              </Space>
              <Table
                rowSelection={{
                    type: "radio",
                    selectedRowKeys: this.state.selectedSwitcherIds,
                    ...this.rowSelection
                }}
                rowKey="id"
                columns={this.columns}
                pagination={false}
                dataSource={this.state.data}
                loading={this.state.loading}
              />
              <Divider />
              <div onClick={this.startClick} >
                  <Button type="primary" id="btn" shape="round" disabled={this.state.selectedSwitcherIds.length === 0} >
                      开启导播台
                  </Button>
              </div>
          </div>
        )
    }

    private rowSelection = {
        onChange: (selectedRowKeys: any) => {
            this.setState({
                selectedSwitcherIds: selectedRowKeys,
            });
        },
    };

    private async refreshClick(): Promise<void> {
        await this.refresh();
    }

    private async startClick(): Promise<void> {
        const switcher = this.state.data.find(s => s.id === this.state.selectedSwitcherIds[0]);
        if (switcher) {
            this.setState({
                loading: true,
            });
            await this.switcherService.setSwitcher(switcher);
            ipcRenderer.send('switcherSelected');
        }
    }

    private async refresh(): Promise<void> {
        this.setState({
            loading: true,
        });
        const data = (await axios.get(`${SWITCHER_BASE_URL}/v1/switchers?switcherstatus=started`)).data as Switcher[];
        this.setState({
            loading: false,
            data: data,
        });
    }

    private handleInitialized(): void {
        this.setState({
            loading: false,
        });
        this.props.history.push('/main');
        remote.getCurrentWindow().setFullScreen(true);
    }
}
