import './App.scss';
import React from 'react';
import { Main } from './component/screens/Main/Main';
import { Login } from './component/screens/Login/Login'
import { SelectSwitcher } from './component/screens/SelectSwitcher/SelectSwitcher'
import { Studio } from './component/screens/Studio/Studio';
import { Container } from 'typedi';
import { SourceService } from './service/sourceService';
import { DialogWindow } from './component/dialogs/DialogWindow/DialogWindow';
import { isDialogWindow, isExternalWindow } from './common/util';
import { ExternalWindow } from './component/screens/ExternalWindow/ExternalWindow';
import { AudioService } from './service/audioService';
import { Switch, Route } from 'react-router-dom';

type AppState = {
  initialized: boolean;
};

export class App extends React.Component<{}, AppState> {
  private readonly sourceService = Container.get(SourceService);
  private readonly audioService = Container.get(AudioService);

  constructor(props: {}) {
    super(props);
    this.state = {
      initialized: false,
    };
  }

  async componentDidMount() {
    this.sourceService.initialize();
    this.audioService.initialize();
    this.setState({
      initialized: true,
    });
  }

  public render() {
    if (!this.state.initialized) {
      return <></>;
    }
    if (isDialogWindow()) {
      return <DialogWindow />;
    } else if (isExternalWindow()) {
      const url = new URL(window.location.href);
      const layouts = Number(url.searchParams.get('layouts') || '12');
      return <ExternalWindow layouts={layouts} />
    } else {
      return (
        <div className="App night-theme">
          <Switch>
            <Route path='/' exact component={Login} />
            <Route path='/select' exact component={SelectSwitcher} />
            <Route path="/main" exact>
              <Main>
                <Studio />
              </Main>
            </Route>
          </Switch>
        </div>
      );
    }
  }
}
