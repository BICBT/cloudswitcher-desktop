import './HeadNav.scss';
import React from 'react';
import { remote } from 'electron';
import logo from './img/logo.png';

type HeadNavState = {
  fullscreen: boolean;
};

export class HeadNav extends React.Component<{}, HeadNavState> {

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
          <i className={`${this.state.fullscreen ? 'icon-reduce-screen-alt' : 'icon-full-screen-alt'} icon-button`}
             aria-hidden="true"/>
        </div>
        <div className='logo'>
          <img className='logo' src={logo} alt=''/>
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
}
