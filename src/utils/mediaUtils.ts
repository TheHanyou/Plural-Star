import RNFS from 'react-native-fs';

const AVATAR_DIR = `${RNFS.DocumentDirectoryPath}/ps_avatars`;
const CHAT_MEDIA_DIR = `${RNFS.DocumentDirectoryPath}/ps_chat_media`;

const ensureDir = async (dir: string) => {
  const exists = await RNFS.exists(dir);
  if (!exists) await RNFS.mkdir(dir);
};

export const saveAvatar = async (memberId: string, base64: string): Promise<string> => {
  await ensureDir(AVATAR_DIR);
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  const path = `${AVATAR_DIR}/${memberId}.jpg`;
  await RNFS.writeFile(path, raw, 'base64');
  return `file://${path}`;
};

export const saveAvatarFromUrl = async (memberId: string, url: string): Promise<string | undefined> => {
  if (!url || !url.startsWith('http')) return undefined;
  try {
    await ensureDir(AVATAR_DIR);
    const path = `${AVATAR_DIR}/${memberId}.jpg`;
    const result = await RNFS.downloadFile({fromUrl: url, toFile: path}).promise;
    if (result.statusCode === 200) return `file://${path}`;
    return undefined;
  } catch { return undefined; }
};

export const deleteAvatar = async (memberId: string): Promise<void> => {
  try {
    const path = `${AVATAR_DIR}/${memberId}.jpg`;
    const exists = await RNFS.exists(path);
    if (exists) await RNFS.unlink(path);
  } catch {}
};

export const saveChatMedia = async (messageId: string, base64: string, ext: string = 'jpg'): Promise<string> => {
  await ensureDir(CHAT_MEDIA_DIR);
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const path = `${CHAT_MEDIA_DIR}/${messageId}.${safeExt}`;
  await RNFS.writeFile(path, raw, 'base64');
  return `file://${path}`;
};

export const saveChatFileFromUri = async (messageId: string, sourceUri: string, ext: string = 'bin'): Promise<string> => {
  await ensureDir(CHAT_MEDIA_DIR);
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const path = `${CHAT_MEDIA_DIR}/${messageId}.${safeExt}`;
  await RNFS.copyFile(sourceUri.replace('file://', ''), path);
  return `file://${path}`;
};

export const deleteChatMedia = async (messageId: string, ext: string = 'jpg'): Promise<void> => {
  try {
    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
    const path = `${CHAT_MEDIA_DIR}/${messageId}.${safeExt}`;
    const exists = await RNFS.exists(path);
    if (exists) await RNFS.unlink(path);
  } catch {}
};

export const migrateInlineAvatars = async (members: any[]): Promise<{members: any[]; changed: boolean}> => {
  let changed = false;
  const updated = [];
  await ensureDir(AVATAR_DIR);
  for (const m of members) {
    if (m.avatar && m.avatar.startsWith('data:')) {
      try {
        const uri = await saveAvatar(m.id, m.avatar);
        updated.push({...m, avatar: uri});
        changed = true;
      } catch {
        updated.push({...m, avatar: undefined});
        changed = true;
      }
    } else {
      updated.push(m);
    }
  }
  return {members: updated, changed};
};

export const migrateInlineChatMedia = async (messages: any[]): Promise<{messages: any[]; changed: boolean}> => {
  let changed = false;
  const updated = [];
  await ensureDir(CHAT_MEDIA_DIR);
  for (const msg of messages) {
    if ((msg.type === 'image' || msg.type === 'file') && msg.content && msg.content.startsWith('data:')) {
      try {
        const mimeMatch = msg.content.match(/^data:([^;]+);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const extMap: Record<string, string> = {
          'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
          'application/pdf': 'pdf', 'text/plain': 'txt', 'application/json': 'json',
        };
        const ext = extMap[mime] || mime.split('/')[1] || 'bin';
        const uri = await saveChatMedia(msg.id, msg.content, ext);
        updated.push({...msg, content: uri});
        changed = true;
      } catch {
        updated.push(msg);
      }
    } else {
      updated.push(msg);
    }
  }
  return {messages: updated, changed};
};

export const clearAllMedia = async (): Promise<void> => {
  try {
    const avatarExists = await RNFS.exists(AVATAR_DIR);
    if (avatarExists) await RNFS.unlink(AVATAR_DIR);
    const chatExists = await RNFS.exists(CHAT_MEDIA_DIR);
    if (chatExists) await RNFS.unlink(CHAT_MEDIA_DIR);
  } catch {}
};
