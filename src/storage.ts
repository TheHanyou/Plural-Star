import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

export const KEYS = {
  system:   'ps:system',
  members:  'ps:members',
  front:    'ps:front',
  history:  'ps:history',
  journal:  'ps:journal',
  share:    'ps:share',
  settings: 'ps:settings',
  lightMode:'ps:lightMode',
  language: 'ps:language',
  groups:   'ps:groups',
  palettes: 'ps:palettes',
  chatChannels: 'ps:chatChannels',
};

const CRITICAL_KEYS = new Set([
  KEYS.system, KEYS.members, KEYS.front, KEYS.history,
  KEYS.journal, KEYS.groups, KEYS.chatChannels,
]);

const BACKUP_DIR = `${RNFS.DocumentDirectoryPath}/ps_backup`;

const backupPath = (key: string): string =>
  `${BACKUP_DIR}/${key.replace(/:/g, '_')}.json`;

const ensureBackupDir = async () => {
  const exists = await RNFS.exists(BACKUP_DIR);
  if (!exists) await RNFS.mkdir(BACKUP_DIR);
};

const writeBackup = async (key: string, value: unknown) => {
  try {
    await ensureBackupDir();
    await RNFS.writeFile(backupPath(key), JSON.stringify(value), 'utf8');
  } catch (e) { console.error('[PS] Backup write error:', e); }
};

const readBackup = async <T>(key: string): Promise<T | null> => {
  try {
    const path = backupPath(key);
    const exists = await RNFS.exists(path);
    if (!exists) return null;
    const raw = await RNFS.readFile(path, 'utf8');
    return JSON.parse(raw) as T;
  } catch { return null; }
};

export const chatMsgKey = (channelId: string): string => `ps:chat:${channelId}`;

export const store = {
  async get<T>(key: string, fallback: T | null = null): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
      if (CRITICAL_KEYS.has(key)) {
        const backup = await readBackup<T>(key);
        if (backup !== null) {
          console.warn(`[PS] Recovered ${key} from backup`);
          await AsyncStorage.setItem(key, JSON.stringify(backup));
          return backup;
        }
      }
      return fallback;
    } catch { return fallback; }
  },
  async set(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      if (CRITICAL_KEYS.has(key)) writeBackup(key, value);
    } catch (e) { console.error('Storage write error:', e); }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      if (CRITICAL_KEYS.has(key)) {
        const path = backupPath(key);
        const exists = await RNFS.exists(path);
        if (exists) await RNFS.unlink(path);
      }
    } catch (e) { console.error('Storage remove error:', e); }
  },
  async clearAll(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const psKeys = allKeys.filter(k => k.startsWith('ps:'));
      await AsyncStorage.multiRemove(psKeys);
      const exists = await RNFS.exists(BACKUP_DIR);
      if (exists) await RNFS.unlink(BACKUP_DIR);
    } catch (e) { console.error('Storage clear error:', e); }
  },
};
