import './HeadNav.scss';
import React from 'react';
import { Container } from 'typedi';
import { DialogService } from '../../../service/dialogService';
import { OutputSetting } from '../../dialogs/OutputSettingDialog/OutputSettingDialog';
import { SourceService } from '../../../service/sourceService';
import { remote } from 'electron';
import logo from './img/logo.png';

type HeadNavState = {
  fullscreen: boolean;
};

export class HeadNav extends React.Component<{}, HeadNavState> {
  private readonly dialogService = Container.get(DialogService);
  private readonly sourceService = Container.get(SourceService);

  constructor(props: {}) {
    super(props);
    this.state = {
      fullscreen: remote.getCurrentWindow().isFullScreen(),
    };
  }

  public render() {
    return (
      <div className='HeadNav night-theme'>
        <div className='full-screen' onClick={() => this.onFullScreenClicked()}>
          <i className={`${this.state.fullscreen ? 'icon-reduce-screen-alt' : 'icon-full-screen-alt'} icon-button`} aria-hidden="true"/>
        </div>
        <div className='logo'>
          <img className='logo' src={logo} alt='' />
        </div>
      </div>
    );
  }

  private onFullScreenClicked() {
    remote.getCurrentWindow().setFullScreen(!this.state.fullscreen);
    this.setState({
      fullscreen: !this.state.fullscreen,
    });
  }

  private async onOutputSettingClicked() {
    const setting = await this.dialogService.showDialog<OutputSetting>({
      title: 'Output',
      component: 'OutputSettingDialog',
      width: 400,
      height: 300,
    }, {
      url: this.sourceService.liveSource?.url,
    });
    if (setting && setting.url) {
      await this.sourceService.updateLiveUrl(setting.url);
    }
  }
}
