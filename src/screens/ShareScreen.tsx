import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, ActivityIndicator} from 'react-native';
import DocumentPicker from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {exportJSON, exportHTML, exportEmail, exportAllJournalJSON, exportAllJournalTxt, exportAllJournalMd} from '../export/exportUtils';
import {store, KEYS} from '../storage';
import {SystemInfo, Member, FrontState, HistoryEntry, JournalEntry, ShareSettings, ExportPayload, uid} from '../utils';

type Section = 'export' | 'import' | 'shareview';
type ImportSource = 'backup' | 'journal' | 'simplyplural' | 'pluralkit';

interface Props {
  theme: any;
  system: SystemInfo;
  members: Member[];
  front: FrontState | null;
  history: HistoryEntry[];
  journal: JournalEntry[];
  shareSettings: ShareSettings;
  onSettingsChange: (s: ShareSettings) => void;
  getMember: (id: string) => Member | undefined;
  onDataImported: () => void;
  onAddJournalEntry: (entry: JournalEntry) => void;
  onDeleteAccount: () => void;
}

export const ShareScreen = ({theme: T, system, members, front, history, journal, shareSettings, onSettingsChange, getMember, onDataImported, onAddJournalEntry, onDeleteAccount}: Props) => {
  const [section, setSection] = useState<Section>('export');
  const [emailAddr, setEmailAddr] = useState('');
  const [restoreFile, setRestoreFile] = useState<string | null>(null);
  const [restoreData, setRestoreData] = useState<ExportPayload | null>(null);
  const [restoreSel, setRestoreSel] = useState({system: true, members: true, journal: true, frontHistory: true});
  const [restoreError, setRestoreError] = useState('');
  const [restoreDone, setRestoreDone] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMsg, setImportMsg] = useState('');
  const [importSource, setImportSource] = useState<ImportSource>('backup');
  const [extToken, setExtToken] = useState('');
  const [extLoading, setExtLoading] = useState(false);
  const [extPreview, setExtPreview] = useState<{members: any[]; switches: any[]; system: any} | null>(null);
  const [extSel, setExtSel] = useState({system: true, members: true, frontHistory: true});

  const fronters = (front?.memberIds || []).map(getMember).filter(Boolean) as Member[];
  const tog = (k: keyof ShareSettings) => onSettingsChange({...shareSettings, [k]: !shareSettings[k]});
  const togR = (k: keyof typeof restoreSel) => setRestoreSel(s => ({...s, [k]: !s[k]}));
  const togE = (k: keyof typeof extSel) => setExtSel(s => ({...s, [k]: !s[k]}));

  const handleJSON = async () => {try {await exportJSON(system, members, history, journal);} catch (e) {Alert.alert('Export Failed', String(e));}};
  const handleHTML = async () => {try {await exportHTML(system, members, history, journal);} catch (e) {Alert.alert('Export Failed', String(e));}};
  const handleEmail = () => {
    if (!emailAddr.trim() || !emailAddr.includes('@')) {Alert.alert('Invalid Email', 'Enter a valid email address first.'); return;}
    exportEmail(system, members, history, journal, emailAddr);
  };
  const handleJournalExport = async (fmt: 'json' | 'txt' | 'md') => {
    try {
      if (fmt === 'json') await exportAllJournalJSON(journal, system.name);
      else if (fmt === 'txt') await exportAllJournalTxt(journal, members, system.name);
      else await exportAllJournalMd(journal, members, system.name);
    } catch (e) {Alert.alert('Export Failed', String(e));}
  };

  const handleImportJournalFile = async () => {
    setImportStatus('idle'); setImportMsg('');
    try {
      const [res] = await DocumentPicker.pick({type: ['public.text', 'public.plain-text', 'text/plain', 'text/markdown', 'application/json', 'public.json']});
      const ext = (res.name || '').split('.').pop()?.toLowerCase() || '';
      const titleBase = (res.name || 'Imported Entry').replace(/\.[^.]+$/, '');
      let body = '';
      if (['txt', 'md', 'markdown'].includes(ext)) {body = await RNFS.readFile(res.uri, 'utf8');}
      else if (ext === 'json') {
        const raw = await RNFS.readFile(res.uri, 'utf8');
        try {
          const parsed = JSON.parse(raw);
          if (parsed._meta?.app === 'Plural Space') {setImportStatus('error'); setImportMsg('That looks like a backup file. Use Restore Backup instead.'); return;}
          body = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2);
        } catch {body = raw;}
      } else {setImportStatus('error'); setImportMsg(`Unsupported format ".${ext}". Supported: .txt, .md, .json`); return;}
      onAddJournalEntry({id: uid(), title: titleBase, body, authorIds: [], hashtags: [], timestamp: Date.now()});
      setImportStatus('success'); setImportMsg(`"${titleBase}" imported as a new journal entry.`);
    } catch (e: any) {if (!DocumentPicker.isCancel(e)) {setImportStatus('error'); setImportMsg(e.message || 'Could not import file.');}}
  };

  const handlePickBackup = async () => {
    setRestoreError(''); setRestoreData(null); setRestoreFile(null); setRestoreDone(false);
    try {
      const [res] = await DocumentPicker.pick({type: ['application/json', 'public.json']});
      const content = await RNFS.readFile(res.uri, 'utf8');
      const parsed: ExportPayload = JSON.parse(content);
      if (!parsed._meta || parsed._meta.app !== 'Plural Space') throw new Error('Not a valid Plural Space export file.');
      setRestoreFile(res.name || 'backup.json'); setRestoreData(parsed);
    } catch (e: any) {if (!DocumentPicker.isCancel(e)) setRestoreError(e.message || 'Could not read file.');}
  };

  const handleRestore = () => {
    if (!restoreData) return;
    Alert.alert('Restore Data', 'This will overwrite the selected categories. Continue?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Restore', style: 'destructive', onPress: async () => {
        if (restoreSel.system && restoreData.system) await store.set(KEYS.system, restoreData.system);
        if (restoreSel.members && restoreData.members) await store.set(KEYS.members, restoreData.members);
        if (restoreSel.journal && restoreData.journal) await store.set(KEYS.journal, restoreData.journal);
        if (restoreSel.frontHistory && restoreData.frontHistory) await store.set(KEYS.history, restoreData.frontHistory);
        setRestoreDone(true); setTimeout(() => onDataImported(), 800);
      }},
    ]);
  };

  const handleSimplyPluralFetch = async () => {
    if (!extToken.trim()) {Alert.alert('Token Required', 'Enter your Simply Plural API token.'); return;}
    setExtLoading(true); setExtPreview(null);
    try {
      const headers = {Authorization: extToken.trim(), 'Content-Type': 'application/json'};
      const meRes = await fetch('https://v2.apparyllis.com/v1/me', {headers});
      if (!meRes.ok) throw new Error(`Auth failed (${meRes.status}). Check your token.`);
      const meData = await meRes.json();
      const userId = meData.id || meData.uid;
      const [mRes, sRes] = await Promise.all([
        fetch(`https://v2.apparyllis.com/v1/members/${userId}`, {headers}),
        fetch(`https://v2.apparyllis.com/v1/switches/${userId}?limit=500`, {headers}),
      ]);
      let mData: any = []; let sData: any = [];
      try { mData = await mRes.json(); } catch { mData = []; }
      try { sData = await sRes.json(); } catch { sData = []; }
      const memberList = Array.isArray(mData) ? mData : (mData.members || []);
      const switchList = Array.isArray(sData) ? sData : (sData.switches || []);
      const sanitized = memberList.map((m: any) => {
        if (m?.content?.name) m.content.name = String(m.content.name).replace(/[-\u001F\u007F]/g, '').trim();
        if (m?.name) m.name = String(m.name).replace(/[-\u001F\u007F]/g, '').trim();
        return m;
      });
      setExtPreview({system: meData, members: sanitized, switches: switchList});
    } catch (e: any) {Alert.alert('Import Failed', e.message || 'Could not connect to Simply Plural.');}
    finally {setExtLoading(false);}
  };

  const handlePluralKitFetch = async () => {
    if (!extToken.trim()) {Alert.alert('Token Required', 'Enter your PluralKit token.'); return;}
    setExtLoading(true); setExtPreview(null);
    try {
      const headers = {Authorization: extToken.trim(), 'Content-Type': 'application/json', 'User-Agent': 'PluralSpace/1.0'};
      const [sRes, mRes, swRes] = await Promise.all([
        fetch('https://api.pluralkit.me/v2/systems/@me', {headers}),
        fetch('https://api.pluralkit.me/v2/systems/@me/members', {headers}),
        fetch('https://api.pluralkit.me/v2/systems/@me/switches?limit=500', {headers}),
      ]);
      if (!sRes.ok) throw new Error(`Auth failed (${sRes.status}). Check your token.`);
      let sData: any = {}; let mData: any = []; let swData: any = [];
      try { sData = await sRes.json(); } catch { sData = {}; }
      try { mData = await mRes.json(); } catch { mData = []; }
      try { swData = await swRes.json(); } catch { swData = []; }
      const memberList = Array.isArray(mData) ? mData : [];
      const sanitized = memberList.map((m: any) => {
        if (m?.display_name) m.display_name = String(m.display_name).replace(/[-\u001F\u007F]/g, '').trim();
        if (m?.name) m.name = String(m.name).replace(/[-\u001F\u007F]/g, '').trim();
        return m;
      });
      setExtPreview({system: sData, members: sanitized, switches: Array.isArray(swData) ? swData : []});
    } catch (e: any) {Alert.alert('Import Failed', e.message || 'Could not connect to PluralKit.');}
    finally {setExtLoading(false);}
  };

  const handleExtImport = () => {
    if (!extPreview) return;
    const isPK = importSource === 'pluralkit';
    Alert.alert('Import Data', 'This will add data to your existing records. Continue?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Import', onPress: async () => {
        if (extSel.system && extPreview.system) {
          const name = isPK ? extPreview.system.name : (extPreview.system.username || extPreview.system.name || system.name);
          await store.set(KEYS.system, {...system, name: name || system.name, description: extPreview.system.description || system.description});
        }

        if (extSel.members && extPreview.members.length > 0) {
          const newM: Member[] = extPreview.members.map((m: any) => ({
            id: uid(), 
            name: isPK ? m.display_name || m.name : (m.content?.name || m.name || 'Unknown'),
            pronouns: isPK ? (m.pronouns || '') : (m.content?.pronouns || ''),
            role: isPK ? '' : (m.content?.role || ''),
            color: isPK ? (m.color ? `#${m.color}` : '#DAA520') : (m.content?.color || '#DAA520'),
            description: isPK ? (m.description || '') : (m.content?.desc || ''),
          }));
          const merged = [...members, ...newM.filter(nm => !members.find(em => em.name.toLowerCase() === nm.name.toLowerCase()))];
          await store.set(KEYS.members, merged);

          const idMap: Record<string, string> = {};
          extPreview.members.forEach((m: any, i: number) => {
            const externalId = isPK ? (m.uuid || m.id) : (m.id);
            const localMember = merged.find(lm => lm.name.toLowerCase() === newM[i]?.name.toLowerCase());
            if (externalId && localMember) idMap[externalId] = localMember.id;
            if (isPK && m.id && localMember) idMap[m.id] = localMember.id;
          });

          if (extSel.frontHistory && extPreview.switches.length > 0) {
            const newH: HistoryEntry[] = extPreview.switches.map((sw: any, i: number, arr: any[]) => {
              const next = arr[i - 1];
              // FIXED: Simply Plural uses flat "members" array (not sw.content.members)
              const externalMemberIds: string[] = Array.isArray(sw.members) 
                ? sw.members 
                : (Array.isArray(sw.content?.members) ? sw.content.members : []);

              const resolvedIds = externalMemberIds
                .map((eid: string) => idMap[eid])
                .filter(Boolean) as string[];

              return {
                memberIds: resolvedIds,
                startTime: isPK 
                  ? new Date(sw.timestamp).getTime() 
                  : (sw.timestamp ? new Date(sw.timestamp).getTime() : Date.now()),
                endTime: isPK 
                  ? (next ? new Date(next.timestamp).getTime() : null) 
                  : (next ? new Date(next.timestamp).getTime() : null),
                note: isPK ? '' : (sw.content?.comment || ''),
                mood: undefined,
                location: undefined,
              };
            });
            await store.set(KEYS.history, [...newH, ...history].sort((a, b) => b.startTime - a.startTime).slice(0, 1000));
          }
        } 
        // Fallback: front history only (no new members)
        else if (extSel.frontHistory && extPreview.switches.length > 0) {
          const existingIdMap: Record<string, string> = {};
          extPreview.members.forEach((m: any) => {
            const externalId = isPK ? (m.uuid || m.id) : m.id;
            const name = isPK ? (m.display_name || m.name || '') : (m.content?.name || m.name || '');
            const localMember = members.find(lm => lm.name.toLowerCase() === name.toLowerCase());
            if (externalId && localMember) existingIdMap[externalId] = localMember.id;
            if (isPK && m.id && localMember) existingIdMap[m.id] = localMember.id;
          });

          const newH: HistoryEntry[] = extPreview.switches.map((sw: any, i: number, arr: any[]) => {
            const next = arr[i - 1];
            const externalMemberIds: string[] = Array.isArray(sw.members) 
              ? sw.members 
              : (Array.isArray(sw.content?.members) ? sw.content.members : []);

            const resolvedIds = externalMemberIds
              .map((eid: string) => existingIdMap[eid])
              .filter(Boolean) as string[];

            return {
              memberIds: resolvedIds,
              startTime: isPK 
                ? new Date(sw.timestamp).getTime() 
                : (sw.timestamp ? new Date(sw.timestamp).getTime() : Date.now()),
              endTime: isPK 
                ? (next ? new Date(next.timestamp).getTime() : null) 
                : (next ? new Date(next.timestamp).getTime() : null),
              note: isPK ? '' : (sw.content?.comment || ''),
              mood: undefined,
              location: undefined,
            };
          });
          await store.set(KEYS.history, [...newH, ...history].sort((a, b) => b.startTime - a.startTime).slice(0, 1000));
        }

        setExtPreview(null); setExtToken(''); setTimeout(() => onDataImported(), 500);
      }},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete All Data', 'This will permanently erase everything. This cannot be undone.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete Everything', style: 'destructive', onPress: () => {
        Alert.alert('Are you absolutely sure?', 'All your data will be gone forever.', [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Yes, Delete Everything', style: 'destructive', onPress: onDeleteAccount},
        ]);
      }},
    ]);
  };

  // ... rest of your component (SectionBtn, SourceBtn, Divider, Toggle, SectionRow, return JSX) is unchanged ...

  return (
    <ScrollView style={{flex: 1, backgroundColor: T.bg}} contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled">
      {/* ... your entire JSX is unchanged from previous version ... */}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  content: {padding: 16, paddingBottom: 40},
  heading: {fontFamily: 'Georgia', fontSize: 26, fontWeight: '600', fontStyle: 'italic', marginBottom: 16},
  para: {fontSize: 13, lineHeight: 19, marginBottom: 14},
  hint: {fontSize: 11, marginBottom: 4, lineHeight: 16},
});