import './Studio.scss';
import React from 'react';
import { Preview } from '../../elements/Preview/Preview';
import { ProgramLocal } from '../../elements/ProgramLocal/ProgramLocal';
import { ProgramLive } from '../../elements/ProgramLive/ProgramLive';
import { Sources } from '../../elements/Sources/Sources';
import { Switcher } from '../../elements/Switcher/Switcher';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { AudioMixer } from '../../elements/AudioMixer/AudioMixer';

export class Studio extends React.Component {

  public render() {
    return (
      <div className='Studio'>
        <div className='top'>
          <Preview/>
          <ProgramLocal/>
          <ProgramLive/>
        </div>
        <div className='middle'>
          <Sources />
        </div>
        <div className='bottom'>
          <Tabs isFitted className='Switcher-tabs'>
            <TabList className='Switcher-tablist'>
              <Tab className='Switcher-tab'>导播切换</Tab>
              <Tab className='Switcher-tab'>调音台</Tab>
            </TabList>
            <TabPanels className='Switcher-tabpanels'>
              <TabPanel className='Switcher-tabpanel'>
                <Switcher />
              </TabPanel>
              <TabPanel className='Switcher-tabpanel'>
                <AudioMixer />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </div>
    );
  }
}
