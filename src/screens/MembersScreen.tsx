// src/screens/MembersScreen.tsx
import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Image} from 'react-native';
import {Fonts} from '../theme';
import {Member, FrontState, getInitials} from '../utils';

const IMAGE_URL_RE = /https?:\/\/\S+\.(?:gif|png|jpe?g|webp)(?:\?\S*)?/gi;

const RichDescription = ({text, T}: {text: string; T: any}) => {
  if (!text) return null;
  const parts: {type: 'text' | 'image'; value: string}[] = [];
  let last = 0;
  const matches = [...text.matchAll(IMAGE_URL_RE)];
  if (matches.length === 0) {
    return <Text style={{fontSize: 13, color: T.dim, lineHeight: 20}}>{text}</Text>;
  }
  for (const match of matches) {
    const idx = match.index ?? 0;
    if (idx > last) parts.push({type: 'text', value: text.slice(last, idx).trim()});
    parts.push({type: 'image', value: match[0]});
    last = idx + match[0].length;
  }
  if (last < text.length) parts.push({type: 'text', value: text.slice(last).trim()});
  return (
    <View style={{gap: 8}}>
      {parts.map((p, i) =>
        p.type === 'image' ? (
          <Image key={i} source={{uri: p.value}} style={{width: '100%', height: 200, borderRadius: 8}}
            resizeMode="contain" />
        ) : p.value ? (
          <Text key={i} style={{fontSize: 13, color: T.dim, lineHeight: 20}}>{p.value}</Text>
        ) : null
      )}
    </View>
  );
};

const Avatar = ({member, size = 40, pulse = false, T}: {member?: Member | null; size?: number; pulse?: boolean; T: any}) => (
  <View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: member?.color || T.muted,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: pulse ? member?.color : 'transparent', shadowOpacity: pulse ? 0.5 : 0, shadowRadius: pulse ? 8 : 0, elevation: pulse ? 4 : 0}}>
    <Text style={{fontSize: size * 0.35, fontWeight: '700', color: 'rgba(0,0,0,0.75)'}}>{getInitials(member?.name || '?')}</Text>
  </View>
);

interface Props {
  theme: any;
  members: Member[];
  front: FrontState | null;
  onAdd: () => void;
  onEdit: (member: Member) => void;
}

export const MembersScreen = ({theme: T, members, front, onAdd, onEdit}: Props) => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const frontIds = new Set(front?.memberIds || []);
  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) ||
    m.role?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ScrollView style={{flex: 1, backgroundColor: T.bg}} contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled">
      <View style={s.headerRow}>
        <Text style={[s.heading, {color: T.text}]}>Members</Text>
        <TouchableOpacity onPress={onAdd} activeOpacity={0.7}
          style={[s.addBtn, {backgroundColor: T.accentBg, borderColor: `${T.accent}40`}]}>
          <Text style={{fontSize: 13, fontWeight: '500', color: T.accent}}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {members.length > 3 && (
        <TextInput value={query} onChangeText={setQuery} placeholder="Search…"
          placeholderTextColor={T.muted}
          style={[s.search, {backgroundColor: T.surface, color: T.text, borderColor: T.border}]} />
      )}

      {members.length === 0 ? (
        <View style={s.empty}>
          <Text style={{fontSize: 36, opacity: 0.4, marginBottom: 12}}>◇</Text>
          <Text style={{fontSize: 13, color: T.dim, textAlign: 'center', marginBottom: 16}}>No members yet. Add your first headmate.</Text>
          <TouchableOpacity onPress={onAdd} activeOpacity={0.7}
            style={[s.addBtn, {backgroundColor: T.accentBg, borderColor: `${T.accent}40`}]}>
            <Text style={{fontSize: 13, fontWeight: '500', color: T.accent}}>Add Member</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{gap: 8}}>
          {filtered.map(m => (
            <TouchableOpacity key={m.id} activeOpacity={0.75}
              style={[s.card, {backgroundColor: T.card, borderColor: frontIds.has(m.id) ? `${m.color}60` : T.border}]}
              onPress={() => setExpanded(expanded === m.id ? null : m.id)}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
                <Avatar member={m} size={44} pulse={frontIds.has(m.id)} T={T} />
                <View style={{flex: 1, overflow: 'hidden'}}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2}}>
                    <Text style={{fontSize: 15, fontWeight: '500', color: T.text}}>{m.name}</Text>
                    {frontIds.has(m.id) && (
                      <View style={{paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
                        backgroundColor: `${m.color}18`, borderWidth: 1, borderColor: `${m.color}35`}}>
                        <Text style={{fontSize: 10, color: m.color, fontWeight: '500'}}>FRONT</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{fontSize: 12, color: T.dim}}>
                    {[m.pronouns, m.role].filter(Boolean).join(' · ') || 'No details set'}
                  </Text>
                  {m.description && expanded !== m.id ? (
                    <Text style={{fontSize: 11, color: T.muted, marginTop: 3}} numberOfLines={1}>{m.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => onEdit(m)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={{fontSize: 14, color: T.muted}}>✎</Text>
                </TouchableOpacity>
              </View>
              {expanded === m.id && m.description ? (
                <View style={{marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.border}}>
                  <RichDescription text={m.description} T={T} />
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  content: {padding: 16, paddingBottom: 32},
  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14},
  heading: {fontFamily: Fonts.display, fontSize: 26, fontWeight: '600', fontStyle: 'italic'},
  addBtn: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1},
  search: {borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13, marginBottom: 14},
  empty: {alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24},
  card: {borderRadius: 12, borderWidth: 1, padding: 14},
});
