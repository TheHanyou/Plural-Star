import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet, StatusBar, Platform, PermissionsAndroid, Alert} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';

import {T, TLight} from './src/theme';
import {AccentText} from './src/components/AccentText';
import {store, KEYS} from './src/storage';
import {SystemInfo, Member, FrontState, HistoryEntry, JournalEntry, ShareSettings, AppSettings} from './src/utils';
import {showFrontNotification, clearFrontNotification} from './src/services/NotificationService';

import {SetupScreen} from './src/screens/SetupScreen';
import {FrontScreen} from './src/screens/FrontScreen';
import {MembersScreen} from './src/screens/MembersScreen';
import {HistoryScreen} from './src/screens/HistoryScreen';
import {JournalScreen} from './src/screens/JournalScreen';
import {ShareScreen} from './src/screens/ShareScreen';
import {SetFrontModal, EditFrontDetailModal, MemberModal, JournalModal, SystemModal} from './src/modals';

type Tab = 'front' | 'members' | 'history' | 'journal' | 'share';

const TABS: {id: Tab; label: string; icon: string}[] = [
  {id: 'front',   label: 'Front',   icon: '◈'},
  {id: 'members', label: 'Members', icon: '◇'},
  {id: 'history', label: 'History', icon: '◷'},
  {id: 'journal', label: 'Journal', icon: '◉'},
  {id: 'share',   label: 'Share',   icon: '↑'},
];

const DEFAULT_SETTINGS: AppSettings = {locations: [], customMoods: [], lightMode: false, gpsEnabled: false};

// GPS helper — requests permission, reverse geocodes to city/neighbourhood via Nominatim
const getGPSLocation = (): Promise<string | null> =>
  new Promise(async resolve => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          {title: 'Location Permission', message: 'Plural Space wants to tag your approximate location when fronting.', buttonPositive: 'Allow', buttonNegative: 'Deny'},
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {resolve(null); return;}
      }
      (navigator as any).geolocation?.getCurrentPosition(
        async (pos: any) => {
          try {
            const {latitude, longitude} = pos.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`,
              {headers: {'User-Agent': 'PluralSpace/1.0'}},
            );
            const data = await res.json();
            // Prefer neighbourhood > suburb > town > city > county
            const a = data.address || {};
            const name =
              a.neighbourhood || a.suburb || a.village ||
              a.town || a.city || a.county || a.state || null;
            resolve(name);
          } catch {
            resolve(null);
          }
        },
        () => resolve(null),
        {timeout: 8000, maximumAge: 120000},
      );
    } catch {
      resolve(null);
    }
  });

function MainAppContent() {
  const [loaded, setLoaded] = useState(false);
  const [firstRun, setFirstRun] = useState(false);
  const [tab, setTab] = useState<Tab>('front');
  const [lightMode, setLightMode] = useState(false);
  const [system, setSystem] = useState<SystemInfo>({name: '', description: ''});
  const [members, setMembers] = useState<Member[]>([]);
  const [front, setFront] = useState<FrontState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({showFront: true, showMembers: true, showDescriptions: false});
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [showSetFront, setShowSetFront] = useState(false);
  const [showEditFrontDetail, setShowEditFrontDetail] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const [editJournal, setEditJournal] = useState<JournalEntry | null>(null);
  const [showSystem, setShowSystem] = useState(false);

  const insets = useSafeAreaInsets();
  const C = lightMode ? TLight : T;

  const loadAll = useCallback(async () => {
    const [sys, mem, fr, hist, jour, share, settings, light] = await Promise.all([
      store.get<SystemInfo>(KEYS.system),
      store.get<Member[]>(KEYS.members, []),
      store.get<FrontState | null>(KEYS.front),
      store.get<HistoryEntry[]>(KEYS.history, []),
      store.get<JournalEntry[]>(KEYS.journal, []),
      store.get<ShareSettings>(KEYS.share, {showFront: true, showMembers: true, showDescriptions: false}),
      store.get<AppSettings>(KEYS.settings, DEFAULT_SETTINGS),
      store.get<boolean>(KEYS.lightMode, false),
    ]);
    if (!sys) {setFirstRun(true);} else {setSystem(sys);}
    setMembers(mem || []);
    setFront(fr || null);
    setHistory(hist || []);
    setJournal(jour || []);
    setShareSettings(share || {showFront: true, showMembers: true, showDescriptions: false});
    setAppSettings(settings || DEFAULT_SETTINGS);
    setLightMode(light || false);
    setLoaded(true);
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return;
    try {
      // Notification permission (Android 13+)
      await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS' as any,
        {title: 'Notifications', message: 'Allow Plural Space to show front status notifications.', buttonPositive: 'Allow', buttonNegative: 'Not now'},
      );
      // Location permission (only if GPS is enabled)
      if (appSettings.gpsEnabled) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          {title: 'Location', message: 'Allow Plural Space to tag your approximate location when fronting.', buttonPositive: 'Allow', buttonNegative: 'Not now'},
        );
      }
    } catch {}
  };

  useEffect(() => { loadAll(); }, []);

  // Request permissions once on first load (after setup) and whenever settings change GPS on
  useEffect(() => {
    if (loaded && !firstRun) {
      requestPermissions();
    }
  }, [loaded, firstRun]);

  // Update notification immediately when front/members change
  useEffect(() => {
    showFrontNotification(front, members);
  }, [front, members]);

  // Also refresh every 5 minutes so the time-fronting counter stays current
  useEffect(() => {
    if (!front) return;
    const interval = setInterval(() => {
      showFrontNotification(front, members);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [front, members]);

  const saveSystem = async (d: SystemInfo) => {setSystem(d); await store.set(KEYS.system, d);};
  const saveMembers = async (d: Member[]) => {setMembers(d); await store.set(KEYS.members, d);};
  const saveHistory = async (d: HistoryEntry[]) => {setHistory(d); await store.set(KEYS.history, d);};
  const saveJournal = async (d: JournalEntry[]) => {setJournal(d); await store.set(KEYS.journal, d);};
  const saveShareSettings = async (d: ShareSettings) => {setShareSettings(d); await store.set(KEYS.share, d);};
  const saveAppSettings = async (d: AppSettings) => {setAppSettings(d); await store.set(KEYS.settings, d);};

  const toggleLightMode = async () => {
    const next = !lightMode;
    setLightMode(next);
    await store.set(KEYS.lightMode, next);
  };

  const [lastKnownLocation, setLastKnownLocation] = useState<string | undefined>(undefined);

  const getMember = (id: string) => members.find(m => m.id === id);

  // Persist last known location so it carries across front switches
  const updateLastLocation = async (loc: string | undefined) => {
    if (loc) {
      setLastKnownLocation(loc);
      await store.set('ps:lastLocation', loc);
    }
  };

  // Load lastKnownLocation on startup — add to loadAll
  useEffect(() => {
    store.get<string>('ps:lastLocation').then(loc => {
      if (loc) setLastKnownLocation(loc);
    });
  }, []);

  // Optionally fetch GPS location if enabled
  const maybeGPS = async (manualLocation?: string): Promise<string | undefined> => {
    // Treat empty string the same as undefined
    const loc = manualLocation?.trim() || undefined;
    if (loc) return loc;
    if (appSettings.gpsEnabled) {
      const gps = await getGPSLocation();
      return gps || undefined;
    }
    return undefined;
  };

  const updateFront = async (memberIds: string[], note = '', mood?: string, location?: string) => {
    const now = Date.now();
    const resolvedLocation = await maybeGPS(location?.trim() || lastKnownLocation);
    let newHistory = [...history];

    // Close existing open front entry — only set endTime, preserve original state
    if (front) {
      newHistory = newHistory.map(e =>
        e.endTime === null && e.startTime === front.startTime && e.changeType === 'front'
          ? {...e, endTime: now} : e
      );
    }

    const nf = memberIds.length > 0
      ? {memberIds, startTime: now, note, mood, location: resolvedLocation}
      : null;

    if (nf) {
      // Always log the front switch event
      const frontEntry: HistoryEntry = {
        memberIds, startTime: now, endTime: null,
        note, mood, location: resolvedLocation,
        changeType: 'front', changeTime: now,
      };
      newHistory = [frontEntry, ...newHistory];

      if (resolvedLocation) await updateLastLocation(resolvedLocation);

      newHistory = newHistory.slice(0, 1000);
    }

    setFront(nf);
    await store.set(KEYS.front, nf);
    await saveHistory(newHistory);
  };

  const updateFrontNote = async (note: string) => {
    if (!front) return;
    const now = Date.now();
    const u = {...front, note};
    setFront(u);
    await store.set(KEYS.front, u);
    if (note !== front.note) {
      const noteEntry: HistoryEntry = {
        memberIds: front.memberIds, startTime: front.startTime, endTime: null,
        note, mood: front.mood, location: front.location,
        changeType: 'note', changeTime: now,
      };
      await saveHistory([noteEntry, ...history].slice(0, 1000));
    }
  };

  const updateFrontDetails = async (mood?: string, location?: string, note?: string) => {
    if (!front) return;
    const now = Date.now();
    const resolvedLocation = await maybeGPS(location?.trim() || lastKnownLocation);
    const u = {...front, mood, location: resolvedLocation, note: note ?? front.note};
    setFront(u);
    await store.set(KEYS.front, u);

    if (resolvedLocation) await updateLastLocation(resolvedLocation);

    // Do NOT mutate the original front switch entry — it preserves the state at switch time.
    // Only log new change events for what actually changed.
    const extras: HistoryEntry[] = [];
    const moodChanged = (mood || undefined) !== (front.mood || undefined);
    const locChanged = (resolvedLocation || undefined) !== (front.location || undefined);
    const noteChanged = note !== undefined && (note || undefined) !== (front.note || undefined);

    if (moodChanged || locChanged) {
      extras.push({
        memberIds: front.memberIds, startTime: front.startTime, endTime: null,
        note: note ?? front.note,
        mood: mood ?? front.mood,
        location: resolvedLocation ?? front.location,
        changeType: moodChanged && locChanged ? 'mood' : moodChanged ? 'mood' : 'location',
        changeTime: now,
      });
    }
    if (noteChanged) {
      extras.push({
        memberIds: front.memberIds, startTime: front.startTime, endTime: null,
        note, mood: mood ?? front.mood, location: resolvedLocation ?? front.location,
        changeType: 'note', changeTime: now + 1,
      });
    }

    if (extras.length > 0) {
      await saveHistory([...extras, ...history].slice(0, 1000));
    }
  };

  const saveMember = async (m: Member) => {
    const u = members.find(x => x.id === m.id) ? members.map(x => (x.id === m.id ? m : x)) : [...members, m];
    await saveMembers(u);
  };
  const deleteMember = async (id: string) => saveMembers(members.filter(m => m.id !== id));
  const saveEntry = async (e: JournalEntry) => {
    const u = journal.find(x => x.id === e.id) ? journal.map(x => (x.id === e.id ? e : x)) : [e, ...journal];
    await saveJournal(u);
  };
  const deleteEntry = async (id: string) => saveJournal(journal.filter(e => e.id !== id));
  const addJournalEntry = async (e: JournalEntry) => saveJournal([e, ...journal]);

  const handleDeleteAccount = async () => {
    await clearFrontNotification();
    await store.clearAll();
    setSystem({name: '', description: ''}); setMembers([]); setFront(null);
    setHistory([]); setJournal([]); setLightMode(false);
    setShareSettings({showFront: true, showMembers: true, showDescriptions: false});
    setAppSettings(DEFAULT_SETTINGS);
    setTab('front'); setFirstRun(true);
  };

  if (!loaded) {
    return (
      <View style={[styles.loading, {backgroundColor: T.bg}]}>
        <StatusBar barStyle="light-content" backgroundColor={T.bg} translucent={false} />
        <Image source={require('./src/assets/splash-logo.png')} style={styles.splashLogo} resizeMode="contain" />
        <Text style={[styles.splashName, {color: T.accent}]}>Plural Space</Text>
      </View>
    );
  }

  if (firstRun) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} translucent={false} />
        <SetupScreen theme={C} onSave={async s => {await saveSystem(s); setFirstRun(false); setTimeout(requestPermissions, 500);}} />
      </>
    );
  }

  const renderScreen = () => {
    switch (tab) {
      case 'front':
        return <FrontScreen theme={C} front={front} getMember={getMember} onSetFront={() => setShowSetFront(true)} onUpdateNote={updateFrontNote} onEditDetails={() => setShowEditFrontDetail(true)} />;
      case 'members':
        return <MembersScreen theme={C} members={members} front={front} onAdd={() => {setEditMember(null); setShowMember(true);}} onEdit={m => {setEditMember(m); setShowMember(true);}} />;
      case 'history':
        return <HistoryScreen theme={C} history={history} journal={journal} getMember={getMember} members={members} />;
      case 'journal':
        return <JournalScreen theme={C} journal={journal} members={members} systemJournalPassword={system.journalPassword} onAdd={() => {setEditJournal(null); setShowJournal(true);}} onEdit={e => {setEditJournal(e); setShowJournal(true);}} onDelete={deleteEntry} />;
      case 'share':
        return <ShareScreen theme={C} system={system} members={members} front={front} history={history} journal={journal} shareSettings={shareSettings} onSettingsChange={saveShareSettings} getMember={getMember} onDataImported={loadAll} onAddJournalEntry={addJournalEntry} onDeleteAccount={handleDeleteAccount} />;
    }
  };

  return (
    <View style={[styles.root, {backgroundColor: C.bg}]}>
      <StatusBar barStyle={lightMode ? 'dark-content' : 'light-content'} backgroundColor={C.bg} translucent={false} />
      <View style={{backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0}}>
        <View style={[styles.header, {borderBottomColor: C.border, backgroundColor: C.bg}]}>
          <AccentText T={C} style={[styles.headerTitle, {color: C.accent}]}>{system.name}</AccentText>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleLightMode} activeOpacity={0.7} style={styles.settingsBtn}>
              <Text style={[styles.settingsIcon, {color: C.dim}]}>{lightMode ? '◑' : '◐'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSystem(true)} activeOpacity={0.7} style={styles.settingsBtn}>
              <Text style={[styles.settingsIcon, {color: C.dim}]}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.content}>{renderScreen()}</View>

      <View style={[styles.tabBar, {backgroundColor: C.surface, borderTopColor: C.border, paddingBottom: insets.bottom || 0}]}>
        {TABS.map(({id, label, icon}) => (
          <TouchableOpacity key={id} onPress={() => setTab(id)} activeOpacity={0.7} style={styles.tabBtn}>
            <AccentText T={C} style={[styles.tabIcon, {color: tab === id ? C.accent : C.muted}]}>{icon}</AccentText>
            <AccentText T={C} style={[styles.tabLabel, {color: tab === id ? C.accent : C.muted}]}>{label}</AccentText>
          </TouchableOpacity>
        ))}
      </View>

      <SetFrontModal visible={showSetFront} theme={C} members={members} current={front} settings={appSettings}
        lastKnownLocation={lastKnownLocation}
        onSave={async (ids, note, mood, location) => {await updateFront(ids, note, mood, location); setShowSetFront(false);}}
        onClose={() => setShowSetFront(false)} />

      {front && (
        <EditFrontDetailModal visible={showEditFrontDetail} theme={C} front={front} settings={appSettings}
          lastKnownLocation={lastKnownLocation}
          onSave={async (mood, location, note) => {await updateFrontDetails(mood, location, note); setShowEditFrontDetail(false);}}
          onClose={() => setShowEditFrontDetail(false)} />
      )}

      <MemberModal visible={showMember} theme={C} member={editMember}
        onSave={async m => {await saveMember(m); setShowMember(false);}}
        onDelete={async id => {await deleteMember(id); setShowMember(false);}}
        onClose={() => setShowMember(false)} />

      <JournalModal visible={showJournal} theme={C} entry={editJournal} members={members}
        onSave={async e => {await saveEntry(e); setShowJournal(false);}}
        onClose={() => setShowJournal(false)} />

      <SystemModal visible={showSystem} theme={C} system={system} settings={appSettings}
        onSave={async s => {await saveSystem(s); setShowSystem(false);}}
        onSaveSettings={async s => {await saveAppSettings(s); setShowSystem(false);}}
        onClose={() => setShowSystem(false)} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainAppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  splashLogo: {width: 200, height: 200},
  splashName: {fontFamily: 'Georgia', fontSize: 22, fontStyle: 'italic', letterSpacing: 2, marginTop: 16},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1},
  headerTitle: {fontFamily: 'Georgia', fontSize: 20, fontWeight: '600', fontStyle: 'italic', letterSpacing: 0.3},
  headerRight: {flexDirection: 'row', alignItems: 'center'},
  settingsBtn: {padding: 4, marginLeft: 8},
  settingsIcon: {fontSize: 18},
  content: {flex: 1},
  tabBar: {flexDirection: 'row', borderTopWidth: 1},
  tabBtn: {flex: 1, alignItems: 'center', paddingVertical: 8, paddingTop: 10},
  tabIcon: {fontSize: 18, marginBottom: 2},
  tabLabel: {fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase'},
});
