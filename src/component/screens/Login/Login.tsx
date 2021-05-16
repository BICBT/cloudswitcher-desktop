import './Login.scss';
import React from 'react';
import { Form, Input, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AUTH_BASE_URL } from '../../../common/constant';
import { LoginInfo, LoginResponse } from '../../../common/types';
import { Container } from 'typedi';
import { StorageService } from '../../../service/StorageService';

export interface LoginPageState {
  LoginInfo: LoginInfo[],
}

export interface LoginPageProps {
  history: {
    push: (path: string) => void;
  }
}

export class Login extends React.Component<LoginPageProps, LoginPageState> {
  private readonly storageService = Container.get(StorageService);

  // Interface setting and error prompt，use catch controll error
  onFinish = async (values: LoginPageProps): Promise<void> => {
    try {
      const res = (await axios.post<LoginResponse>(`${AUTH_BASE_URL}/v1/token`, values)).data as LoginResponse;
      await this.storageService.setToken(res.token);
      this.props.history.push('/select');
    } catch (e) {
      console.error(e);
      message.error('Please enter the correct username and password');
    }
  };

  public render(): JSX.Element {
    return (
      <div className="LoginPage">
          <div className="title">
            极目云转播平台
          </div>
          <Form layout='vertical' name="basic" initialValues={{ remember: true }} onFinish={this.onFinish} >

            <Form.Item label="用户名" name="username" rules={[{ required: true }]} >
              <Input prefix={<UserOutlined style={{ color: 'rgba(250,250,250,.80)' }} />} placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item label="密码" name="password" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined style={{ color: 'rgba(250,250,250,.80)' }} />} type="password" placeholder="请输入密码" />
            </Form.Item>

            <Form.Item className="login-button">
              <div className="login-button-container">
                <button className='button button--default' type="submit">登&nbsp;&nbsp;&nbsp;&nbsp;录</button>
              </div>
            </Form.Item>

          </Form>
      </div>
    );
  }
}
