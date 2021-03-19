import './Login.scss';
import React from 'react';
import { Form, Input, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AUTH_BASE_URL } from '../../../common/constant';
import { LoginInfo, LoginResponse } from '../../../common/types';

export interface LoginPageState {
  LoginInfo: LoginInfo[],
}

export interface LoginPageProps {
  history: {
    push: (path: string) => void;
  }
}

export class Login extends React.Component<LoginPageProps, LoginPageState> {
  // Interface setting and error prompt，use catch controll error
  onFinish = (values: LoginPageProps): void => {
    axios.post<LoginResponse>(`${AUTH_BASE_URL}/v1/token`, values).then(res => {
      // Save token
      const token = res.data.token;
      console.log('请检查token值是否获取正确（正式代码请删除）：', token);
      window.localStorage.setItem('token', token);
      //Jump to select page
      this.props.history.push('/select');
      //remote.getCurrentWindow().setFullScreen(true);
      return message.info('Login succeed');
    }).catch(error => {
      console.error(error);
      return message.error('Please enter the correct username and password');
    });
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
