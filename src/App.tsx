import './App.scss';
import { remote } from "electron";
import isDev from "electron-is-dev";
import React from 'react';
import { isDialogWindow, isExternalWindow, isMainWindow } from './common/util';
import { DialogWindow } from './component/dialogs/DialogWindow/DialogWindow';
import { ExternalWindow } from './component/screens/ExternalWindow/ExternalWindow';
import { Main } from './component/screens/Main/Main';
import { Studio } from './component/screens/Studio/Studio';
import { Login } from './component/screens/Login/Login'
import { SelectSwitcher } from './component/screens/SelectSwitcher/SelectSwitcher'
import { Switch, Route } from 'react-router-dom';
import { Container } from "typedi";
import { UpdateService } from "./service/UpdateService";
import { DialogService } from "./service/DialogService";
import { UpdateDialogDefault } from "./component/dialogs/UpdateDialog/UpdateDialog";

export class App extends React.Component {
  private readonly updateService = Container.get(UpdateService);
  private readonly dialogService = Container.get(DialogService);

  public async componentDidMount() {
    if (isMainWindow()) {
      try {
        if (!isDev) {
          await this.checkUpdate();
        }
      } finally {
        remote.getCurrentWindow().show();
      }
    }
  }

  public render() {
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

  private async checkUpdate(): Promise<void> {
    const newVersion = await this.updateService.checkNewVersion();
    if (newVersion) {
      await this.dialogService.showDialog<UpdateDialogDefault, unknown>({
        title: '自动更新',
        component: 'UpdateDialog',
        width: 600,
        height: 200,
      }, {
        newVersion: newVersion,
      });
    }
  }
}
