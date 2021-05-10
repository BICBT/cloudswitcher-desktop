import React from 'react';
import { Form } from 'antd';
import { EncodingView } from './EncodingView';
import { Encoding, Preview } from '../../../common/types';

export interface PreviewTabState {
  encoding: Encoding;
}

export interface PreviewTabProps {
  state: PreviewTabState;
  handleStateChanged: (state: PreviewTabState) => void;
}

export function initPreviewTabState(preview: Preview): PreviewTabState {
  return {
    encoding: preview.encoding,
  };
}

export class PreviewTab extends React.Component<PreviewTabProps> {

  public render() {
    return (
      <div className='PreviewTab'>
        <Form>
          <EncodingView
            encoding={this.props.state.encoding}
            handleEncodingChanged={encoding => this.handleEncodingChanged(encoding)}
          />
        </Form>
      </div>
    );
  }

  private handleEncodingChanged(encoding: Encoding): void {
    this.props.handleStateChanged({
      ...this.props.state,
      encoding: encoding,
    });
  }
}
