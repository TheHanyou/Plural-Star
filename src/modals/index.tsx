// src/modals/index.tsx
import React, {useState} from 'react';
import {View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image, Linking} from 'react-native';
import {Sheet} from '../components/Sheet';
import {PALETTE} from '../theme';
import {Member, JournalEntry, FrontState, SystemInfo, AppSettings, uid, isValidHex, normalizeHex, DEFAULT_MOODS} from '../utils';

const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const Avatar = ({member, size = 36, T}: {member?: Member | null; size?: number; T: any}) => (
  <View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: member?.color || T.muted,
    alignItems: 'center', justifyContent: 'center'}}>
    <Text style={{fontSize: size * 0.35, fontWeight: '700', color: 'rgba(0,0,0,0.75)'}}>{getInitials(member?.name || '?')}</Text>
  </View>
);

const Btn = ({children, onPress, variant = 'primary', disabled = false, fullWidth = false, style = {}, T}: any) => {
  const variants: any = {
    primary: {bg: T.accentBg, color: T.accent, border: `${T.accent}40`},
    ghost:   {bg: 'transparent', color: T.dim, border: T.border},
    danger:  {bg: T.dangerBg, color: T.danger, border: `${T.danger}40`},
    solid:   {bg: T.accent, color: '#0a0508', border: T.accent},
    info:    {bg: T.infoBg, color: T.info, border: `${T.info}40`},
  };
  const v = variants[variant] || variants.primary;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}
      style={[{paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.5 : 1}, fullWidth && {width: '100%'}, style]}>
      <Text style={{fontSize: 14, fontWeight: '500', color: v.color}}>{children}</Text>
    </TouchableOpacity>
  );
};

const Field = ({label, value, onChange, placeholder, multiline = false, numberOfLines = 4, T}: any) => (
  <View style={{marginBottom: 14}}>
    {label && <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 5, fontWeight: '600'}}>{label}</Text>}
    <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={T.muted}
      multiline={multiline} numberOfLines={multiline ? numberOfLines : 1}
      style={{backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: multiline ? 100 : undefined, textAlignVertical: multiline ? 'top' : 'center'}} />
  </View>
);

// ── Set Front Modal ───────────────────────────────────────────────────────────

export const SetFrontModal = ({visible, theme: T, members, current, settings, lastKnownLocation, onSave, onClose}: any) => {
  const [sel, setSel] = useState<Set<string>>(new Set(current?.memberIds || []));
  const [note, setNote] = useState(current?.note || '');
  const [mood, setMood] = useState(current?.mood || '');
  const [customMood, setCustomMood] = useState('');
  const [showCustomMood, setShowCustomMood] = useState(false);
  const [location, setLocation] = useState(current?.location || lastKnownLocation || '');

  React.useEffect(() => {
    if (visible) {
      setSel(new Set(current?.memberIds || []));
      setNote(current?.note || '');
      setMood(current?.mood || '');
      setCustomMood('');
      setShowCustomMood(false);
      setLocation(current?.location || lastKnownLocation || '');
    }
  }, [visible, current?.mood, current?.location, current?.note, lastKnownLocation]);
  const allMoods = [...DEFAULT_MOODS, ...(settings?.customMoods || [])];
  const allLocations = settings?.locations || [];

  const tog = (id: string) => {const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s);};

  return (
    <Sheet visible={visible} title="Update Front" theme={T} onClose={onClose} footer={
      <>
        <Btn variant="ghost" T={T} onPress={() => {onSave([], '', undefined, undefined); onClose();}}>Clear</Btn>
        <Btn T={T} onPress={() => {onSave([...sel], note, showCustomMood ? customMood || undefined : mood || undefined, location || undefined); onClose();}}>Save</Btn>
      </>
    }>
      {members.length === 0 && <Text style={{fontSize: 13, color: T.dim, marginBottom: 12}}>Add members first.</Text>}
      <View style={{gap: 7, marginBottom: 16}}>
        {members.map((m: Member) => (
          <TouchableOpacity key={m.id} onPress={() => tog(m.id)} activeOpacity={0.7}
            style={{flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 10, borderWidth: 1,
              backgroundColor: sel.has(m.id) ? `${m.color}18` : T.surface, borderColor: sel.has(m.id) ? `${m.color}55` : T.border}}>
            <Avatar member={m} size={36} T={T} />
            <View style={{flex: 1}}>
              <Text style={{fontSize: 15, fontWeight: '500', color: T.text}}>{m.name}</Text>
              {m.pronouns ? <Text style={{fontSize: 12, color: T.dim}}>{m.pronouns}</Text> : null}
            </View>
            {sel.has(m.id) && <Text style={{fontSize: 16, fontWeight: '700', color: m.color}}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 8, fontWeight: '600'}}>Mood</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 6}}>
        <View style={{flexDirection: 'row', gap: 6}}>
          {allMoods.map((m: string) => (
            <TouchableOpacity key={m} onPress={() => {setMood(m); setShowCustomMood(false);}} activeOpacity={0.7}
              style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
                backgroundColor: mood === m && !showCustomMood ? `${T.accent}20` : T.surface,
                borderColor: mood === m && !showCustomMood ? `${T.accent}60` : T.border}}>
              <Text style={{fontSize: 12, color: mood === m && !showCustomMood ? T.accent : T.dim, fontWeight: mood === m && !showCustomMood ? '600' : '400'}}>{m}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => {setShowCustomMood(true); setMood('');}} activeOpacity={0.7}
            style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
              backgroundColor: showCustomMood ? `${T.accent}20` : T.surface, borderColor: showCustomMood ? `${T.accent}60` : T.border}}>
            <Text style={{fontSize: 12, color: showCustomMood ? T.accent : T.dim}}>Custom…</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showCustomMood && <TextInput value={customMood} onChangeText={setCustomMood} placeholder="Enter mood…" placeholderTextColor={T.muted}
        style={{backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, marginTop: 6}} />}

      <View style={{height: 12}} />
      <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 8, fontWeight: '600'}}>Location</Text>
      {allLocations.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 6}}>
          <View style={{flexDirection: 'row', gap: 6}}>
            {allLocations.map((l: string) => (
              <TouchableOpacity key={l} onPress={() => setLocation(location === l ? '' : l)} activeOpacity={0.7}
                style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
                  backgroundColor: location === l ? `${T.accent}20` : T.surface, borderColor: location === l ? `${T.accent}60` : T.border}}>
                <Text style={{fontSize: 12, color: location === l ? T.accent : T.dim, fontWeight: location === l ? '600' : '400'}}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      <TextInput value={location} onChangeText={setLocation} placeholder="Or type a location…" placeholderTextColor={T.muted}
        style={{backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, marginTop: 6}} />
      <View style={{height: 12}} />
      <Field label="Note (optional)" value={note} onChange={setNote} placeholder="What's happening right now?" multiline numberOfLines={3} T={T} />
    </Sheet>
  );
};

// ── Edit Front Detail Modal ───────────────────────────────────────────────────

export const EditFrontDetailModal = ({visible, theme: T, front, settings, lastKnownLocation, onSave, onClose}: any) => {
  const [mood, setMood] = useState(front?.mood || '');
  const [customMood, setCustomMood] = useState('');
  const [showCustomMood, setShowCustomMood] = useState(false);
  const [location, setLocation] = useState(front?.location || lastKnownLocation || '');
  const [note, setNote] = useState(front?.note || '');
  const allMoods = [...DEFAULT_MOODS, ...(settings?.customMoods || [])];
  const allLocations = settings?.locations || [];

  React.useEffect(() => {
    if (visible) {setMood(front?.mood || ''); setLocation(front?.location || lastKnownLocation || ''); setNote(front?.note || ''); setShowCustomMood(false); setCustomMood('');}
  }, [visible, front, lastKnownLocation]);

  return (
    <Sheet visible={visible} title="Edit Front Details" theme={T} onClose={onClose}
      footer={<Btn T={T} onPress={() => {onSave(showCustomMood ? customMood || undefined : mood || undefined, location || undefined, note || undefined); onClose();}}>Save</Btn>}>
      <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 8, fontWeight: '600'}}>Mood</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 6}}>
        <View style={{flexDirection: 'row', gap: 6}}>
          {allMoods.map((m: string) => (
            <TouchableOpacity key={m} onPress={() => {setMood(m); setShowCustomMood(false);}} activeOpacity={0.7}
              style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
                backgroundColor: mood === m && !showCustomMood ? `${T.accent}20` : T.surface,
                borderColor: mood === m && !showCustomMood ? `${T.accent}60` : T.border}}>
              <Text style={{fontSize: 12, color: mood === m && !showCustomMood ? T.accent : T.dim}}>{m}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => {setShowCustomMood(true); setMood('');}} activeOpacity={0.7}
            style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
              backgroundColor: showCustomMood ? `${T.accent}20` : T.surface, borderColor: showCustomMood ? `${T.accent}60` : T.border}}>
            <Text style={{fontSize: 12, color: showCustomMood ? T.accent : T.dim}}>Custom…</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {showCustomMood && <TextInput value={customMood} onChangeText={setCustomMood} placeholder="Enter mood…" placeholderTextColor={T.muted}
        style={{backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, marginTop: 6}} />}
      <View style={{height: 12}} />
      <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 8, fontWeight: '600'}}>Location</Text>
      {allLocations.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 6}}>
          <View style={{flexDirection: 'row', gap: 6}}>
            {allLocations.map((l: string) => (
              <TouchableOpacity key={l} onPress={() => setLocation(location === l ? '' : l)} activeOpacity={0.7}
                style={{paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1,
                  backgroundColor: location === l ? `${T.accent}20` : T.surface, borderColor: location === l ? `${T.accent}60` : T.border}}>
                <Text style={{fontSize: 12, color: location === l ? T.accent : T.dim}}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
      <TextInput value={location} onChangeText={setLocation} placeholder="Or type a location…" placeholderTextColor={T.muted}
        style={{backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, marginTop: 6}} />
      <View style={{height: 12}} />
      <Field label="Note" value={note} onChange={setNote} placeholder="What's happening right now?" multiline numberOfLines={3} T={T} />
    </Sheet>
  );
};

// ── Member Modal ──────────────────────────────────────────────────────────────

export const MemberModal = ({visible, theme: T, member, onSave, onDelete, onClose}: any) => {
  const isNew = !member;
  const [f, setF] = useState<Member>(member || {id: uid(), name: '', pronouns: '', role: '', color: PALETTE[0], description: ''});
  const [hexInput, setHexInput] = useState(member?.color || PALETTE[0]);
  const [hexError, setHexError] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  React.useEffect(() => {
    if (visible) {
      const fresh = member || {id: uid(), name: '', pronouns: '', role: '', color: PALETTE[0], description: ''};
      setF(fresh); setHexInput(fresh.color); setHexError(false); setConfirmDel(false);
    }
  }, [visible, member]);

  const set = (k: keyof Member, v: string) => setF(x => ({...x, [k]: v}));

  const handleHexChange = (val: string) => {
    setHexInput(val);
    const n = normalizeHex(val);
    if (isValidHex(n)) {set('color', n); setHexError(false);} else setHexError(val.length > 1);
  };

  return (
    <Sheet visible={visible} title={isNew ? 'Add Member' : 'Edit Member'} theme={T} onClose={onClose} footer={
      <>
        {!isNew && !confirmDel && <Btn variant="danger" T={T} onPress={() => setConfirmDel(true)}>Delete</Btn>}
        {confirmDel && (<><Btn variant="danger" T={T} onPress={() => {onDelete(member.id); onClose();}}>Confirm Delete</Btn><Btn variant="ghost" T={T} onPress={() => setConfirmDel(false)}>Cancel</Btn></>)}
        {!confirmDel && <Btn T={T} onPress={() => {if (f.name.trim()) {onSave(f); onClose();}}}>Save</Btn>}
      </>
    }>
      <Field label="Name *" value={f.name} onChange={(v: string) => set('name', v)} placeholder="Headmate name" T={T} />
      <Field label="Pronouns" value={f.pronouns} onChange={(v: string) => set('pronouns', v)} placeholder="e.g. they/them" T={T} />
      <Field label="Role / Archetype" value={f.role} onChange={(v: string) => set('role', v)} placeholder="Host, Protector, Gatekeeper…" T={T} />
      <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 8, fontWeight: '600'}}>Color</Text>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10}}>
        <View style={{width: 36, height: 36, borderRadius: 18, backgroundColor: f.color, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)'}} />
        <TextInput value={hexInput} onChangeText={handleHexChange} placeholder="#C9A96E" placeholderTextColor={T.muted}
          maxLength={7} autoCapitalize="characters"
          style={{flex: 1, backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: hexError ? T.danger : T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, fontFamily: 'monospace'}} />
      </View>
      {hexError && <Text style={{fontSize: 11, color: T.danger, marginBottom: 8}}>Invalid hex color</Text>}
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14}}>
        {PALETTE.map((c: string) => (
          <TouchableOpacity key={c} onPress={() => {set('color', c); setHexInput(c); setHexError(false);}} activeOpacity={0.8}
            style={{width: 30, height: 30, borderRadius: 15, backgroundColor: c, borderWidth: 2, borderColor: f.color === c ? '#fff' : 'transparent'}} />
        ))}
      </View>
      <Field label="Description / Bio" value={f.description} onChange={(v: string) => set('description', v)} placeholder="A bit about this headmate…" multiline numberOfLines={4} T={T} />
    </Sheet>
  );
};

// ── Journal Modal ─────────────────────────────────────────────────────────────

export const JournalModal = ({visible, theme: T, entry, members, onSave, onClose}: any) => {
  const isNew = !entry;
  const [f, setF] = useState<JournalEntry>(entry || {id: uid(), title: '', body: '', authorIds: [], hashtags: [], timestamp: Date.now()});
  const [showPwField, setShowPwField] = useState(false);
  const [tagInput, setTagInput] = useState('');

  React.useEffect(() => {
    if (visible) {
      const fresh = entry || {id: uid(), title: '', body: '', authorIds: [], hashtags: [], timestamp: Date.now()};
      setF(fresh); setShowPwField(!!fresh.password); setTagInput('');
    }
  }, [visible, entry]);

  const set = (k: keyof JournalEntry, v: any) => setF(x => ({...x, [k]: v}));

  const togAuthor = (id: string) =>
    set('authorIds', (f.authorIds || []).includes(id) ? (f.authorIds || []).filter((i: string) => i !== id) : [...(f.authorIds || []), id]);

  const addTag = () => {
    const raw = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (!raw) return;
    const current = f.hashtags || [];
    if (!current.includes(`#${raw}`)) set('hashtags', [...current, `#${raw}`]);
    setTagInput('');
  };

  return (
    <Sheet visible={visible} title={isNew ? 'New Entry' : 'Edit Entry'} theme={T} onClose={onClose} footer={
      <Btn T={T} onPress={() => {
        onSave({...f, timestamp: isNew ? Date.now() : f.timestamp, password: showPwField && f.password ? f.password : undefined});
        onClose();
      }}>Save</Btn>
    }>
      <Field label="Title" value={f.title} onChange={(v: string) => set('title', v)} placeholder="Entry title…" T={T} />
      <Field label="Body" value={f.body} onChange={(v: string) => set('body', v)} placeholder="Write here…" multiline numberOfLines={6} T={T} />

      <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 8, fontWeight: '600'}}>Tags</Text>
      {(f.hashtags || []).length > 0 && (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8}}>
          {(f.hashtags || []).map((t: string) => (
            <TouchableOpacity key={t} onPress={() => set('hashtags', (f.hashtags || []).filter((x: string) => x !== t))} activeOpacity={0.7}
              style={{flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
                backgroundColor: `${T.info}18`, borderWidth: 1, borderColor: `${T.info}40`}}>
              <Text style={{fontSize: 12, color: T.info}}>{t}</Text>
              <Text style={{fontSize: 10, color: T.danger}}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={{flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 14}}>
        <TextInput value={tagInput} onChangeText={setTagInput} placeholder="#topic" placeholderTextColor={T.muted}
          autoCapitalize="none" autoCorrect={false}
          style={{flex: 1, backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13}}
          onSubmitEditing={addTag} returnKeyType="done" />
        <Btn T={T} onPress={addTag} style={{paddingHorizontal: 12, paddingVertical: 9}}>Add</Btn>
      </View>

      {members.length > 0 && (
        <>
          <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 8, fontWeight: '600'}}>Authors</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14}}>
            {members.map((m: Member) => {
              const active = (f.authorIds || []).includes(m.id);
              return (
                <TouchableOpacity key={m.id} onPress={() => togAuthor(m.id)} activeOpacity={0.7}
                  style={{flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1,
                    backgroundColor: active ? `${m.color}20` : T.surface, borderColor: active ? `${m.color}50` : T.border}}>
                  <View style={{width: 7, height: 7, borderRadius: 3.5, backgroundColor: m.color}} />
                  <Text style={{fontSize: 12, color: active ? m.color : T.dim}}>{m.name}</Text>
                  {active && <Text style={{fontSize: 11, fontWeight: '700', color: m.color}}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      <View style={{borderTopWidth: 1, borderTopColor: T.border, paddingTop: 14}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
          <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, fontWeight: '600'}}>Entry Password</Text>
          <TouchableOpacity onPress={() => {setShowPwField(!showPwField); if (showPwField) set('password', undefined);}}>
            <Text style={{fontSize: 12, color: T.accent, fontWeight: '600'}}>{showPwField ? 'Remove' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
        {showPwField && (
          <TextInput value={f.password || ''} onChangeText={(v: string) => set('password', v || undefined)}
            placeholder="Set a password for this entry…" placeholderTextColor={T.muted} secureTextEntry
            style={{backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14}} />
        )}
      </View>
    </Sheet>
  );
};

// ── System Modal ──────────────────────────────────────────────────────────────

export const SystemModal = ({visible, theme: T, system, settings, onSave, onSaveSettings, onClose}: any) => {
  const [f, setF] = useState({...system});
  const [showJournalPw, setShowJournalPw] = useState(!!system.journalPassword);
  const [newLocation, setNewLocation] = useState('');
  const [newMood, setNewMood] = useState('');
  const [locs, setLocs] = useState<string[]>(settings?.locations || []);
  const [moods, setMoods] = useState<string[]>(settings?.customMoods || []);

  React.useEffect(() => {
    if (visible) {
      setF({...system}); setShowJournalPw(!!system.journalPassword);
      setLocs(settings?.locations || []); setMoods(settings?.customMoods || []);
      setNewLocation(''); setNewMood('');
    }
  }, [visible, system, settings]);

  const addLoc = () => {if (newLocation.trim() && !locs.includes(newLocation.trim())) {setLocs([...locs, newLocation.trim()]); setNewLocation('');} };
  const addMood = () => {if (newMood.trim() && !moods.includes(newMood.trim())) {setMoods([...moods, newMood.trim()]); setNewMood('');} };

  return (
    <Sheet visible={visible} title="System Settings" theme={T} onClose={onClose} footer={
      <Btn T={T} onPress={() => {
        onSave({...f, journalPassword: showJournalPw && f.journalPassword ? f.journalPassword : undefined});
        onSaveSettings({...settings, locations: locs, customMoods: moods});
        onClose();
      }}>Save</Btn>
    }>
      <Field label="System Name" value={f.name} onChange={(v: string) => setF((x: any) => ({...x, name: v}))} placeholder="Your system's name" T={T} />
      <Field label="Description" value={f.description} onChange={(v: string) => setF((x: any) => ({...x, description: v}))} placeholder="A brief description…" multiline numberOfLines={3} T={T} />

      <View style={{borderTopWidth: 1, borderTopColor: T.border, paddingTop: 14, marginTop: 4}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
          <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, fontWeight: '600'}}>Global Journal Password</Text>
          <TouchableOpacity onPress={() => {setShowJournalPw(!showJournalPw); if (showJournalPw) setF((x: any) => ({...x, journalPassword: undefined}));}}>
            <Text style={{fontSize: 12, color: T.accent, fontWeight: '600'}}>{showJournalPw ? 'Remove' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
        {showJournalPw && (
          <TextInput value={f.journalPassword || ''} onChangeText={(v: string) => setF((x: any) => ({...x, journalPassword: v || undefined}))}
            placeholder="Lock entire journal…" placeholderTextColor={T.muted} secureTextEntry
            style={{backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14}} />
        )}
      </View>

      <View style={{borderTopWidth: 1, borderTopColor: T.border, paddingTop: 14, marginTop: 14}}>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <View style={{flex: 1}}>
            <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, fontWeight: '600', marginBottom: 4}}>GPS Location</Text>
            <Text style={{fontSize: 11, color: T.muted, lineHeight: 15}}>Auto-fill location from GPS when setting front. Off by default.</Text>
          </View>
          <TouchableOpacity onPress={() => {const next = !settings?.gpsEnabled; onSaveSettings({...settings, locations: locs, customMoods: moods, gpsEnabled: next});}}
            activeOpacity={0.8} style={{width: 40, height: 22, borderRadius: 11, backgroundColor: settings?.gpsEnabled ? T.accent : T.muted, justifyContent: 'center', marginLeft: 12}}>
            <View style={{width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', position: 'absolute', left: settings?.gpsEnabled ? 20 : 3}} />
          </TouchableOpacity>
        </View>
      </View>

      {[['Locations', locs, setLocs, newLocation, setNewLocation, addLoc], ['Custom Moods', moods, setMoods, newMood, setNewMood, addMood]].map(([label, items, setItems, val, setVal, add]: any) => (
        <View key={label} style={{borderTopWidth: 1, borderTopColor: T.border, paddingTop: 14, marginTop: 14}}>
          <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 8, fontWeight: '600'}}>{label}</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8}}>
            {items.map((l: string) => (
              <TouchableOpacity key={l} onPress={() => setItems(items.filter((x: string) => x !== l))} activeOpacity={0.7}
                style={{flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface}}>
                <Text style={{fontSize: 12, color: T.dim}}>{l}</Text>
                <Text style={{fontSize: 10, color: T.danger}}>✕</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
            <TextInput value={val} onChangeText={setVal} placeholder={`Add ${label.toLowerCase().slice(0, -1)}…`}
              placeholderTextColor={T.muted} style={{flex: 1, backgroundColor: T.surface, color: T.text, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13}}
              onSubmitEditing={add} returnKeyType="done" />
            <Btn T={T} onPress={add} style={{paddingHorizontal: 12, paddingVertical: 9}}>Add</Btn>
          </View>
        </View>
      ))}

      <View style={{borderTopWidth: 1, borderTopColor: T.border, paddingTop: 14, marginTop: 14, alignItems: 'center'}}>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://www.buymeacoffee.com/PluralSpace')}
          activeOpacity={0.8}
          style={{paddingVertical: 11, paddingHorizontal: 28, borderRadius: 8, borderWidth: 1, borderColor: T.accent, backgroundColor: T.accentBg}}>
          <Text style={{fontSize: 15, fontWeight: '600', color: T.accent}}>☕  Support PS</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
};
