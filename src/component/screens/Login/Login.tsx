import './Login.scss';
import React from 'react';
import { Form, Input, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Container } from 'typedi';
import { AuthService } from '../../../service/AuthService';

export interface LoginPageProps {
  history: {
    push: (path: string) => void;
  }
}

interface FormValues {
  username: string;
  password: string;
}

export class Login extends React.Component<LoginPageProps> {
  private readonly authService = Container.get(AuthService);

  public render(): JSX.Element {
    return (
      <div className="LoginPage">
          <div className="title">
            极目云转播平台
          </div>
          <Form layout='vertical'
                name="basic"
                onFinish={values => this.handleLogin(values)}
          >
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

  private async handleLogin(values: FormValues): Promise<void> {
    try {
      await this.authService.login(values.username, values.password);
      this.props.history.push('/select');
    } catch (e) {
      console.error(e);
      message.error('Please enter the correct username and password').then();
    }
  }
}
