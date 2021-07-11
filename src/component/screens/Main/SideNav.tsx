import './SideNav.scss';
import React from 'react';
import { ipcRenderer } from 'electron';
import isDev from 'electron-is-dev';
import { Popover, PopoverContent, PopoverTrigger } from '@chakra-ui/react';
import { Container } from 'typedi';
import { DialogService } from '../../../service/DialogService';
import { PreferenceDialogDefault, PreferenceDialogResult } from '../../dialogs/PreferenceDialog/PreferenceDialog';
import { OutputService } from '../../../service/OutputService';
import { notNull } from '../../../common/util';
import { PreviewService } from '../../../service/PreviewService';
import { SourceService } from '../../../service/SourceService';

export class SideNav extends React.Component {
  private readonly dialogService = Container.get(DialogService);
  private readonly outputService = Container.get(OutputService);
  private readonly previewService = Container.get(PreviewService);
  private readonly sourceService = Container.get(SourceService);

  public render() {
    return (
      <div className='side-nav'>
        <div className='container'>
          <div className='bottom-tools'>
            {
              isDev &&
              <div
                title='Dev Tools'
                className='cell'
                onClick={() => this.onDevToolClicked()}
              >
                <i className="icon-developer" />
              </div>
            }
            <div
              title='Preference'
              className='cell'
              onClick={() => this.onPreferenceClicked()}
            >
              <i className="icon-button fas fa-cog fa-2x" />
            </div>
            <Popover placement='right'>
              <PopoverTrigger>
                <div
                  title='External'
                  className='cell'
                >
                  <i className="fas fa-th-large" aria-hidden="true"/>
                </div>
              </PopoverTrigger>
              <PopoverContent zIndex={4} className='External-items'>
                <div className='External-item cell' onClick={() => this.onExternalClicked(12)}>
                  <i className="fas fa-th-large" aria-hidden="true"/>
                  <span>12</span>
                </div>
                <div className='External-item cell' onClick={() => this.onExternalClicked(4)}>
                  <i className="fas fa-th-large" aria-hidden="true"/>
                  <span>4</span>
                </div>
              </PopoverContent>
            </Popover>
            <div
              title='Logout'
              className='cell'
              onClick={() => this.onExitClicked()}
            >
              <i className='fas fa-sign-out-alt'/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private onDevToolClicked() {
    ipcRenderer.send('openDevTools');
  }

  private async onPreferenceClicked() {
    const [output, preview, sources ] = await Promise.all([
      this.outputService.getOutput().then(notNull),
      this.previewService.getPreview(),
      this.sourceService.getSources(),
    ]);
    const result = await this.dialogService.showDialog<PreferenceDialogDefault, PreferenceDialogResult>({
      title: 'Preference',
      component: 'PreferenceDialog',
      width: 800,
      height: 600,
    }, {
      output: output,
      preview: preview,
      sources: sources,
    });
    if (result) {
      // update output
      if (result.outputChanged) {
        await this.outputService.updateOutput(result.output);
      }
      // update preview
      if (result.previewChanged) {
        await this.previewService.updatePreview(result.preview);
      }
      // update audio
      if (result.audioChanged) {
        if (result.audio.outputMixers !== output.mixers) {
          await this.outputService.updateOutput({ mixers: result.audio.outputMixers });
        }
        await Promise.all(
          result.audio.sourceMixers
            .filter(({ source, mixers }) => source.mixers !== mixers)
            .map(({ source, mixers }) => this.sourceService.updateSource(source.id, { mixers: mixers }))
        );
      }
    }
  }

  private onExternalClicked(layouts: number) {
    ipcRenderer.send('showExternalWindow', layouts);
  }

  private onExitClicked() {
    ipcRenderer.send('exit');
  }
}
