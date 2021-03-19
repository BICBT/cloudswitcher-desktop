import './SelectSwitcher.scss';
import React from 'react';
import { Table, Space, Divider, Button } from 'antd';
import axios from 'axios';
import "antd/dist/antd.css";
import { SWITCHER_BASE_URL } from '../../../common/constant';
import { SwitcherResponse } from '../../../common/types';
import { remote } from 'electron';

export interface SwitcherPageProps {
    history: {
        push: (path: string) => void;
    }
}

export interface SwitcherPageState {
    loading: boolean;
    data: SwitcherResponse[];
    keyIndex: number;
    selectedSwitcherIds: string[];
}

export class SelectSwitcher extends React.Component<SwitcherPageProps, SwitcherPageState>{
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

    public async componentDidMount(): Promise<void> {
        await this.refresh();
    }

    public constructor(props: SwitcherPageProps) {
        super(props);
        this.state = {
            loading: false,
            data: [],
            keyIndex: 0,
            selectedSwitcherIds: [],
        };
        this.startClick = this.startClick.bind(this);
    }

    private rowSelection = {
        onChange: (selectedRowKeys: any, selectedRows: any) => {
            console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
            this.setState({
                selectedSwitcherIds: selectedRowKeys,
            });
        },
    };

    //refresh data
    public async refreshClick(): Promise<void> {
        await this.refresh();
    }

    startClick() {
        this.props.history.push('/main');
        remote.getCurrentWindow().setFullScreen(true);
    }

    private async refresh() {
        this.setState({
            loading: true,
        });
        const data = (await axios.get(`${SWITCHER_BASE_URL}/v1/switchers?switcherstatus=started`)).data as SwitcherResponse[];
        this.setState({
            loading: false,
            data: data,
        });
    }

    public render(): JSX.Element {
        //let isDisable = true;
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
}