import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

// Required: register background event handler before anything else
notifee.onBackgroundEvent(async () => {});

// Register foreground service runner (keeps notification alive)
notifee.registerForegroundService(() => new Promise(() => {}));

AppRegistry.registerComponent(appName, () => App);
