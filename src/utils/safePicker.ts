import {Keyboard, Platform, InteractionManager} from 'react-native';
import {pick as pickDocument, isCancel as isPickerCancel} from '@react-native-documents/picker';

export {isPickerCancel};

export const safePick = (options: {type: string[]}): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Keyboard.dismiss();
    const launch = () => {
      try {
        pickDocument(options).then(resolve).catch(reject);
      } catch (e) {
        reject(e);
      }
    };
    if (Platform.OS === 'android') {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(launch, 150);
      });
    } else {
      launch();
    }
  });
};
