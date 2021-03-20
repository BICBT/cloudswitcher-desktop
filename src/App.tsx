import React from 'react';
import { isDialogWindow, isExternalWindow } from './common/util';
import { DialogWindow } from './component/dialogs/DialogWindow/DialogWindow';
import { ExternalWindow } from './component/screens/ExternalWindow/ExternalWindow';
import { Main } from './component/screens/Main/Main';
import { Studio } from './component/screens/Studio/Studio';

type AppState = {
  initialized: boolean;
};

export class App extends React.Component<{}, AppState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      initialized: false,
    };
  }

  async componentDidMount() {
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
        <Main>
          <Studio />
        </Main>
      );
    }
  }
}
