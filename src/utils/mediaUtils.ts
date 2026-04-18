import RNFS from 'react-native-fs';
import {Image} from 'react-native';

let ImageEditor: any = null;
try {
  ImageEditor = require('@react-native-community/image-editor').default || require('@react-native-community/image-editor');
} catch {
  ImageEditor = null;
}

const AVATAR_DIR = `${RNFS.DocumentDirectoryPath}/ps_avatars`;
const CHAT_MEDIA_DIR = `${RNFS.DocumentDirectoryPath}/ps_chat_media`;
const BIO_IMAGE_DIR = `${RNFS.DocumentDirectoryPath}/ps_bio_images`;

export const BANNER_WIDTH = 900;
export const BANNER_HEIGHT = 300;

const ensureDir = async (dir: string) => {
  const exists = await RNFS.exists(dir);
  if (!exists) await RNFS.mkdir(dir);
};

export const saveAvatar = async (memberId: string, base64: string): Promise<string> => {
  await ensureDir(AVATAR_DIR);
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  // Detect actual format from the first bytes of the base64 data rather than
  // trusting the declared MIME type — picked images are often mislabelled as JPEG
  // when they're actually PNG, leading to files saved with the wrong extension.
  // Base64 magic byte prefixes: PNG=iVBOR, GIF=R0lGO, WEBP=/9j is JPEG, PNG/WEBP differ
  let ext = 'jpg';
  if (raw.startsWith('iVBOR')) ext = 'png';
  else if (raw.startsWith('R0lGO')) ext = 'gif';
  else if (raw.startsWith('UklGR')) ext = 'webp';
  const path = `${AVATAR_DIR}/${memberId}.${ext}`;
  await RNFS.writeFile(path, raw, 'base64');
  return `file://${path}?t=${Date.now()}`;
};

export const saveAvatarFromUrl = async (memberId: string, url: string): Promise<string | undefined> => {
  if (!url || !url.startsWith('http')) return undefined;
  try {
    await ensureDir(AVATAR_DIR);
    const urlExt = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
    const ext = ['png', 'gif', 'webp'].includes(urlExt) ? urlExt : 'jpg';
    const path = `${AVATAR_DIR}/${memberId}.${ext}`;
    const result = await RNFS.downloadFile({fromUrl: url, toFile: path}).promise;
    if (result.statusCode === 200) return `file://${path}?t=${Date.now()}`;
    return undefined;
  } catch { return undefined; }
};

export const deleteAvatar = async (memberId: string): Promise<void> => {
  try {
    for (const ext of ['jpg', 'png', 'gif', 'webp']) {
      const path = `${AVATAR_DIR}/${memberId}.${ext}`;
      const exists = await RNFS.exists(path);
      if (exists) { await RNFS.unlink(path); break; }
    }
  } catch {}
};

export const saveChatMedia = async (messageId: string, base64: string, ext: string = 'jpg'): Promise<string> => {
  await ensureDir(CHAT_MEDIA_DIR);
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const path = `${CHAT_MEDIA_DIR}/${messageId}.${safeExt}`;
  await RNFS.writeFile(path, raw, 'base64');
  return `file://${path}?t=${Date.now()}`;
};

export const saveChatFileFromUri = async (messageId: string, sourceUri: string, ext: string = 'bin'): Promise<string> => {
  await ensureDir(CHAT_MEDIA_DIR);
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const path = `${CHAT_MEDIA_DIR}/${messageId}.${safeExt}`;
  await RNFS.copyFile(sourceUri.replace('file://', ''), path);
  return `file://${path}?t=${Date.now()}`;
};

export const deleteChatMedia = async (messageId: string, ext: string = 'jpg'): Promise<void> => {
  try {
    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
    const path = `${CHAT_MEDIA_DIR}/${messageId}.${safeExt}`;
    const exists = await RNFS.exists(path);
    if (exists) await RNFS.unlink(path);
  } catch {}
};

export const saveBioImage = async (
  imageId: string,
  base64: string,
  ext: string = 'png'
): Promise<string> => {
  await ensureDir(BIO_IMAGE_DIR);
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const path = `${BIO_IMAGE_DIR}/${imageId}.${safeExt}`;
  await RNFS.writeFile(path, raw, 'base64');
  return `file://${path}?t=${Date.now()}`;
};

const getImageSize = (uri: string): Promise<{width: number; height: number}> =>
  new Promise((resolve, reject) => {
    Image.getSize(uri, (width: number, height: number) => resolve({width, height}), reject);
  });

export const saveBannerImage = async (
  imageId: string,
  sourceUri: string
): Promise<string> => {
  await ensureDir(BIO_IMAGE_DIR);
  const destPath = `${BIO_IMAGE_DIR}/${imageId}.png`;
  try { await RNFS.unlink(destPath); } catch {}
  try {
    if (!ImageEditor || !ImageEditor.cropImage) throw new Error('ImageEditor unavailable');
    const {width: srcW, height: srcH} = await getImageSize(sourceUri);
    const targetAspect = BANNER_WIDTH / BANNER_HEIGHT;
    const srcAspect = srcW / srcH;
    let cropW: number, cropH: number, offsetX: number, offsetY: number;
    if (srcAspect > targetAspect) {
      cropH = srcH;
      cropW = Math.round(srcH * targetAspect);
      offsetX = Math.round((srcW - cropW) / 2);
      offsetY = 0;
    } else {
      cropW = srcW;
      cropH = Math.round(srcW / targetAspect);
      offsetX = 0;
      offsetY = Math.round((srcH - cropH) / 2);
    }
    const cropped = await ImageEditor.cropImage(sourceUri, {
      offset: {x: offsetX, y: offsetY},
      size: {width: cropW, height: cropH},
      displaySize: {width: BANNER_WIDTH, height: BANNER_HEIGHT},
      resizeMode: 'cover',
      format: 'png',
      quality: 0.9,
    });
    const croppedPath = (cropped as any).uri ? (cropped as any).uri.replace('file://', '') : String(cropped).replace('file://', '');
    await RNFS.copyFile(croppedPath, destPath);
    try { await RNFS.unlink(croppedPath); } catch {}
    return `file://${destPath}?t=${Date.now()}`;
  } catch {
    const readPath = sourceUri.replace('file://', '');
    const raw = await RNFS.readFile(readPath, 'base64');
    await RNFS.writeFile(destPath, raw, 'base64');
    return `file://${destPath}?t=${Date.now()}`;
  }
};

export const migrateInlineImagesInDescriptions = async (
  members: any[]
): Promise<{ members: any[]; changed: boolean }> => {
  let changed = false;
  const updated: any[] = [];

  const imageRegex = /!\[([^\]]*)\]\(data:([^;]+);base64,([A-Za-z0-9+/=]+)\)/g;

  for (const m of members) {
    if (typeof m.description !== 'string' || !m.description.includes('data:')) {
      updated.push(m);
      continue;
    }

    let newDesc = m.description;
    let match: RegExpExecArray | null;

    while ((match = imageRegex.exec(m.description)) !== null) {
      const alt = match[1];
      const mime = match[2];
      const b64 = match[3];

      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };
      const ext = extMap[mime] || 'bin';

      const bioId = `${m.id}_bio_${Date.now()}_${Math.random().toString(36).slice(2)}`;

      try {
        const fileUri = await saveBioImage(bioId, b64, ext);
        newDesc = newDesc.replace(match[0], `![${alt}](${fileUri})`);
        changed = true;
      } catch (e) {
        console.error('[PS] Failed to migrate bio image for', m.id, e);
      }
    }

    updated.push({ ...m, description: newDesc });
  }

  return { members: updated, changed };
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
    const bioExists = await RNFS.exists(BIO_IMAGE_DIR);
    if (bioExists) await RNFS.unlink(BIO_IMAGE_DIR);
  } catch {}
};