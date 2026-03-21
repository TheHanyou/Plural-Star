// src/screens/FrontScreen.tsx
import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet} from 'react-native';
import {Fonts} from '../theme';
import {FrontState, Member, fmtTime, fmtDur} from '../utils';

const getInitials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const Avatar = ({member, size = 40, pulse = false, T}: {member?: Member | null; size?: number; pulse?: boolean; T: any}) => (
  <View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: member?.color || T.muted,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: pulse ? member?.color : 'transparent', shadowOpacity: pulse ? 0.5 : 0, shadowRadius: pulse ? 8 : 0, elevation: pulse ? 4 : 0}}>
    <Text style={{fontSize: size * 0.35, fontWeight: '700', color: 'rgba(0,0,0,0.75)'}}>{getInitials(member?.name || '?')}</Text>
  </View>
);

interface Props {
  theme: any;
  front: FrontState | null;
  getMember: (id: string) => Member | undefined;
  onSetFront: () => void;
  onUpdateNote: (note: string) => void;
  onEditDetails: () => void;
}

export const FrontScreen = ({theme: T, front, getMember, onSetFront, onUpdateNote, onEditDetails}: Props) => {
  const [editNote, setEditNote] = useState(false);
  const [note, setNote] = useState(front?.note || '');
  const [tick, setTick] = useState(0);

  useEffect(() => {setNote(front?.note || '');}, [front]);
  useEffect(() => {const t = setInterval(() => setTick(n => n + 1), 30000); return () => clearInterval(t);}, []);

  const fronters = (front?.memberIds || []).map(getMember).filter(Boolean) as Member[];

  return (
    <ScrollView style={{flex: 1, backgroundColor: T.bg}} contentContainerStyle={s.content}>
      <View style={s.headerRow}>
        <Text style={[s.heading, {color: T.text}]}>Currently Fronting</Text>
        <TouchableOpacity onPress={onSetFront} activeOpacity={0.7}
          style={[s.btn, {backgroundColor: T.accentBg, borderColor: `${T.accent}40`}]}>
          <Text style={[s.btnText, {color: T.accent}]}>+ Update</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.frontCard, {backgroundColor: T.card, borderColor: fronters.length ? `${T.accent}40` : T.border}]}>
        {fronters.length === 0 ? (
          <View style={s.emptyFront}>
            <Text style={{color: T.muted, fontSize: 13}}>No one is currently fronting.</Text>
            <TouchableOpacity onPress={onSetFront} activeOpacity={0.7}
              style={[s.btn, {backgroundColor: T.accentBg, borderColor: `${T.accent}40`, marginTop: 8}]}>
              <Text style={[s.btnText, {color: T.accent}]}>Set Front</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{gap: 14, marginBottom: 14}}>
              {fronters.map(m => (
                <View key={m.id} style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <Avatar member={m} size={52} pulse={false} T={T} />
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 17, fontWeight: '500', color: T.text}}>{m.name}</Text>
                    {m.pronouns ? <Text style={{fontSize: 12, color: T.dim}}>{m.pronouns}</Text> : null}
                    {m.role ? <Text style={{fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: 2, color: m.color}}>{m.role.toUpperCase()}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
            <View style={{borderTopWidth: 1, borderTopColor: T.border, paddingTop: 10}}>
              <Text style={{fontSize: 11, color: T.muted}}>
                Fronting for <Text style={{color: T.accent}}>{fmtDur(front!.startTime)}</Text>{' · '}since {fmtTime(front!.startTime)}
              </Text>
            </View>
          </>
        )}
      </View>

      {front && (
        <>
          {(front.mood || front.location) ? (
            <View style={[s.metaCard, {backgroundColor: T.card, borderColor: T.border}]}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 16}}>
                {front.mood && (
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 2}}>MOOD</Text>
                    <Text style={{fontSize: 14, fontWeight: '500', color: T.text}}>{front.mood}</Text>
                  </View>
                )}
                {front.location && (
                  <View style={{flex: 1}}>
                    <Text style={{fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 2}}>LOCATION</Text>
                    <Text style={{fontSize: 14, fontWeight: '500', color: T.text}}>{front.location}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={onEditDetails} style={{padding: 4}}>
                  <Text style={{fontSize: 16, color: T.dim}}>✎</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={onEditDetails} style={{paddingVertical: 8, paddingHorizontal: 2, marginBottom: 8}}>
              <Text style={{fontSize: 13, color: T.dim}}>+ Add mood / location</Text>
            </TouchableOpacity>
          )}

          <View style={[s.noteCard, {backgroundColor: T.card, borderColor: T.border}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
              <Text style={{fontSize: 10, letterSpacing: 1, color: T.dim, fontWeight: '600'}}>FRONT NOTE</Text>
              {!editNote ? (
                <TouchableOpacity onPress={() => setEditNote(true)}>
                  <Text style={{fontSize: 16, color: T.dim}}>✎</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => {setEditNote(false); onUpdateNote(note);}}>
                  <Text style={{fontSize: 16, color: T.success}}>✓</Text>
                </TouchableOpacity>
              )}
            </View>
            {editNote ? (
              <TextInput value={note} onChangeText={setNote} multiline numberOfLines={3}
                placeholder="What's happening right now?" placeholderTextColor={T.muted}
                style={{backgroundColor: T.surface, color: T.text, borderRadius: 6, padding: 10,
                  fontSize: 13, textAlignVertical: 'top', minHeight: 72, borderWidth: 1, borderColor: T.borderLt}} />
            ) : (
              <Text style={{fontSize: 13, lineHeight: 20, color: note ? T.text : T.muted}}>
                {note || 'No note. Tap ✎ to add one.'}
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  content: {padding: 16, paddingBottom: 32},
  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  heading: {fontFamily: Fonts.display, fontSize: 26, fontWeight: '600', fontStyle: 'italic'},
  btn: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center'},
  btnText: {fontSize: 13, fontWeight: '500'},
  frontCard: {borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 12, minHeight: 100},
  emptyFront: {alignItems: 'center', paddingVertical: 20},
  metaCard: {borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10},
  noteCard: {borderRadius: 12, borderWidth: 1, padding: 14},
});
