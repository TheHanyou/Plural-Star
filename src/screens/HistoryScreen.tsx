// src/screens/HistoryScreen.tsx
import React, {useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Fonts} from '../theme';
import {AccentText} from '../components/AccentText';
import {HistoryEntry, JournalEntry, Member, fmtTime, fmtDate, fmtDur, getInitials} from '../utils';

const Avatar = ({member, size = 26, T}: {member?: Member | null; size?: number; T: any}) => (
  <View style={{width: size, height: size, borderRadius: size / 2, backgroundColor: member?.color || T.muted,
    alignItems: 'center', justifyContent: 'center'}}>
    <Text style={{fontSize: size * 0.35, fontWeight: '700', color: 'rgba(0,0,0,0.75)'}}>{getInitials(member?.name || '?')}</Text>
  </View>
);

type SubTab = 'front' | 'member';

interface Props {
  theme: any;
  history: HistoryEntry[];
  journal: JournalEntry[];
  getMember: (id: string) => Member | undefined;
  members: Member[];
}

export const HistoryScreen = ({theme: T, history, journal, getMember, members}: Props) => {
  const [subTab, setSubTab] = useState<SubTab>('front');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    members.length > 0 ? members[0].id : null,
  );
  const [showMemberPicker, setShowMemberPicker] = useState(false);

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // ── Front History ──────────────────────────────────────────────────────────
  const frontHistory = history.filter(e => !e.changeType || e.changeType === 'front');

  const frontGroups: Record<string, HistoryEntry[]> = {};
  frontHistory.forEach(e => {
    const k = fmtDate(e.startTime);
    if (!frontGroups[k]) frontGroups[k] = [];
    frontGroups[k].push(e);
  });

  // ── Member History ─────────────────────────────────────────────────────────
  // All history events where this member was fronting
  const memberHistoryEvents = selectedMemberId
    ? history
        .filter(e => (e.memberIds || []).includes(selectedMemberId))
        .map(e => ({
          type: e.changeType || 'front',
          time: e.changeTime ?? e.startTime,
          entry: e,
        }))
    : [];

  // Journal entries authored by this member
  const memberJournalEvents = selectedMemberId
    ? journal
        .filter(e => (e.authorIds || []).includes(selectedMemberId))
        .map(e => ({type: 'journal' as const, time: e.timestamp, journalEntry: e}))
    : [];

  // Merge and sort all events by time descending
  const allMemberEvents = [
    ...memberHistoryEvents,
    ...memberJournalEvents,
  ].sort((a, b) => b.time - a.time);

  const EVENT_ICONS: Record<string, string> = {
    front:    '◈',
    mood:     '◉',
    location: '⊙',
    note:     '✎',
    journal:  '📖',
  };

  const getEventLabel = (type: string, entry: HistoryEntry): string => {
    if ((type === 'mood' || type === 'location') && entry.mood && entry.location) return 'Mood & Location Changed';
    if (type === 'mood')     return 'Mood Changed';
    if (type === 'location') return 'Location Changed';
    if (type === 'note')     return 'Note Updated';
    if (type === 'journal')  return 'Journal Entry';
    return 'Front Switch';
  };

  return (
    <View style={{flex: 1, backgroundColor: T.bg}}>
      {/* Subtab header */}
      <View style={{backgroundColor: T.bg, paddingHorizontal: 16, paddingTop: 16}}>
        <Text style={[s.heading, {color: T.text}]}>History</Text>
        <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.border, marginTop: 4}}>
          {(['front', 'member'] as SubTab[]).map(tab => (
            <TouchableOpacity key={tab} onPress={() => setSubTab(tab)} activeOpacity={0.7}
              style={[s.subtab, {
                borderBottomWidth: 2,
                borderBottomColor: subTab === tab ? T.accent : 'transparent',
              }]}>
              <AccentText T={T} style={{
                fontSize: 13,
                fontWeight: subTab === tab ? '600' : '400',
                color: subTab === tab ? T.accent : T.dim,
              }}>
                {tab === 'front' ? 'Front History' : 'Member History'}
              </AccentText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── FRONT HISTORY ── */}
      {subTab === 'front' && (
        <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 16, paddingBottom: 32}}>
          {frontHistory.length === 0 ? (
            <View style={{alignItems: 'center', paddingVertical: 48}}>
              <Text style={{fontSize: 36, opacity: 0.4, marginBottom: 12}}>◷</Text>
              <Text style={{fontSize: 13, color: T.dim, textAlign: 'center'}}>
                No history yet. Front changes will appear here automatically.
              </Text>
            </View>
          ) : (
            Object.entries(frontGroups).map(([date, entries]) => (
              <View key={date} style={{marginBottom: 24}}>
                <Text style={{fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
                  color: T.dim, marginBottom: 8, fontWeight: '600'}}>{date}</Text>
                {entries.map((entry, i) => {
                  const fronters = (entry.memberIds || []).map(getMember).filter(Boolean) as Member[];
                  const isOpen = entry.endTime === null;
                  return (
                    <View key={i} style={{flexDirection: 'row', gap: 10}}>
                      <View style={{alignItems: 'center', width: 16}}>
                        <View style={{width: 8, height: 8, borderRadius: 4,
                          backgroundColor: isOpen ? T.accent : T.dim, marginTop: 16}} />
                        {i < entries.length - 1 &&
                          <View style={{flex: 1, width: 1, backgroundColor: T.border, marginTop: 2}} />}
                      </View>
                      <View style={[s.card, {backgroundColor: T.card,
                        borderColor: isOpen ? `${T.accent}40` : T.border, marginBottom: 8}]}>
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4}}>
                          <View style={{flexDirection: 'row'}}>
                            {fronters.slice(0, 3).map((m, j) => (
                              <View key={m.id} style={{marginLeft: j ? -8 : 0, zIndex: 10 - j}}>
                                <Avatar member={m} size={26} T={T} />
                              </View>
                            ))}
                          </View>
                          <Text style={{flex: 1, fontSize: 14, fontWeight: '500', color: T.text}} numberOfLines={1}>
                            {fronters.map(m => m.name).join(', ') || 'Unknown'}
                          </Text>
                          <AccentText T={T} style={{fontSize: 12, color: T.accent, fontWeight: '500'}}>
                            {fmtDur(entry.startTime, entry.endTime)}
                          </AccentText>
                        </View>
                        <Text style={{fontSize: 11, color: T.muted, marginBottom: 4}}>
                          {fmtTime(entry.startTime)}
                          {isOpen ? ' → now' : entry.endTime ? ` → ${fmtTime(entry.endTime)}` : ''}
                        </Text>
                        {(entry.mood || entry.location) && (
                          <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4}}>
                            {entry.mood && (
                              <View style={[s.badge, {backgroundColor: T.surface}]}>
                                <Text style={{fontSize: 10, color: T.dim}}>mood </Text>
                                <Text style={{fontSize: 11, color: T.text, fontWeight: '500'}}>{entry.mood}</Text>
                              </View>
                            )}
                            {entry.location && (
                              <View style={[s.badge, {backgroundColor: T.surface}]}>
                                <Text style={{fontSize: 10, color: T.dim}}>at </Text>
                                <Text style={{fontSize: 11, color: T.text, fontWeight: '500'}}>{entry.location}</Text>
                              </View>
                            )}
                          </View>
                        )}
                        {entry.note ? (
                          <View style={{backgroundColor: T.surface, borderRadius: 6, padding: 8}}>
                            <Text style={{fontSize: 12, color: T.dim, lineHeight: 18}}>{entry.note}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── MEMBER HISTORY ── */}
      {subTab === 'member' && (
        <View style={{flex: 1}}>
          {/* Member selector */}
          {members.length === 0 ? (
            <View style={{alignItems: 'center', paddingVertical: 48}}>
              <Text style={{fontSize: 13, color: T.dim}}>No members added yet.</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity onPress={() => setShowMemberPicker(!showMemberPicker)}
                activeOpacity={0.7}
                style={{margin: 16, marginBottom: 0, flexDirection: 'row', alignItems: 'center',
                  gap: 10, padding: 12, borderRadius: 10, borderWidth: 1,
                  backgroundColor: T.card, borderColor: selectedMember ? `${selectedMember.color}50` : T.border}}>
                {selectedMember && <Avatar member={selectedMember} size={32} T={T} />}
                <View style={{flex: 1}}>
                  <Text style={{fontSize: 15, fontWeight: '500', color: T.text}}>
                    {selectedMember?.name || 'Select a member'}
                  </Text>
                  {selectedMember?.pronouns
                    ? <Text style={{fontSize: 11, color: T.dim}}>{selectedMember.pronouns}</Text>
                    : null}
                </View>
                <Text style={{fontSize: 16, color: T.dim}}>{showMemberPicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showMemberPicker && (
                <View style={{marginHorizontal: 16, backgroundColor: T.card, borderRadius: 10,
                  borderWidth: 1, borderColor: T.border, overflow: 'hidden', marginTop: 4}}>
                  {members.map(m => (
                    <TouchableOpacity key={m.id}
                      onPress={() => {setSelectedMemberId(m.id); setShowMemberPicker(false);}}
                      activeOpacity={0.7}
                      style={{flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                        borderBottomWidth: 1, borderBottomColor: T.border,
                        backgroundColor: selectedMemberId === m.id ? `${m.color}12` : 'transparent'}}>
                      <Avatar member={m} size={28} T={T} />
                      <Text style={{fontSize: 14, fontWeight: '500', color: T.text}}>{m.name}</Text>
                      {selectedMemberId === m.id &&
                        <Text style={{color: m.color, marginLeft: 'auto'}}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Stats summary */}
              {selectedMember && allMemberEvents.length > 0 && (() => {
                const frontE = memberHistoryEvents.filter(e => !e.entry.changeType || e.entry.changeType === 'front');
                const totalMs = frontE.reduce((sum, e) => sum + ((e.entry.endTime ?? Date.now()) - e.entry.startTime), 0);
                const moodCounts: Record<string, number> = {};
                memberHistoryEvents.forEach(e => {if (e.entry.mood) moodCounts[e.entry.mood] = (moodCounts[e.entry.mood] || 0) + 1;});
                const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
                const locCounts: Record<string, number> = {};
                memberHistoryEvents.forEach(e => {if (e.entry.location) locCounts[e.entry.location] = (locCounts[e.entry.location] || 0) + 1;});
                const topLoc = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0];
                return (
                  <View style={{flexDirection: 'row', gap: 8, margin: 16, marginBottom: 8}}>
                    <View style={[s.stat, {backgroundColor: T.card, borderColor: T.border}]}>
                      <Text style={{fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 3}}>Total Time</Text>
                      <AccentText T={T} style={{fontSize: 15, fontWeight: '700', color: T.accent}}>{fmtDur(0, totalMs)}</AccentText>
                    </View>
                    <View style={[s.stat, {backgroundColor: T.card, borderColor: T.border}]}>
                      <Text style={{fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 3}}>Sessions</Text>
                      <Text style={{fontSize: 15, fontWeight: '700', color: T.text}}>{frontE.length}</Text>
                    </View>
                    {topMood && (
                      <View style={[s.stat, {backgroundColor: T.card, borderColor: T.border}]}>
                        <Text style={{fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 3}}>Top Mood</Text>
                        <Text style={{fontSize: 12, fontWeight: '600', color: T.text}} numberOfLines={1}>{topMood[0]}</Text>
                      </View>
                    )}
                    {topLoc && (
                      <View style={[s.stat, {backgroundColor: T.card, borderColor: T.border}]}>
                        <Text style={{fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: T.dim, marginBottom: 3}}>Top Location</Text>
                        <Text style={{fontSize: 12, fontWeight: '600', color: T.text}} numberOfLines={1}>{topLoc[0]}</Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 16, paddingTop: 8, paddingBottom: 32}}>
                {allMemberEvents.length === 0 ? (
                  <View style={{alignItems: 'center', paddingVertical: 32}}>
                    <Text style={{fontSize: 13, color: T.dim, textAlign: 'center'}}>
                      No recorded activity for {selectedMember?.name} yet.
                    </Text>
                  </View>
                ) : (
                  allMemberEvents.map((event, i) => {
                    const icon = EVENT_ICONS[event.type] || '◈';
                    const label = 'entry' in event ? getEventLabel(event.type, event.entry) : getEventLabel(event.type, {} as any);
                    const color = event.type === 'front'
                      ? T.accent
                      : event.type === 'journal'
                      ? T.info
                      : T.dim;

                    return (
                      <View key={i} style={{flexDirection: 'row', gap: 10, marginBottom: 8}}>
                        <View style={{alignItems: 'center', width: 16}}>
                          <View style={{width: 8, height: 8, borderRadius: event.type === 'front' ? 4 : 2,
                            backgroundColor: color, marginTop: 14}} />
                          {i < allMemberEvents.length - 1 &&
                            <View style={{flex: 1, width: 1, backgroundColor: T.border, marginTop: 2}} />}
                        </View>
                        <View style={[s.card, {flex: 1, backgroundColor: T.card, borderColor: T.border}]}>
                          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                            <Text style={{fontSize: 12, color, marginRight: 6, fontWeight: '600',
                              }}>{icon} {label}</Text>
                            <Text style={{fontSize: 11, color: T.muted, marginLeft: 'auto'}}>{fmtTime(event.time)}</Text>
                          </View>

                          {'entry' in event && event.entry && (() => {
                            const e = event.entry;
                            const isOpen = e.endTime === null && event.type === 'front';
                            return (
                              <>
                                {event.type === 'front' && (
                                  <Text style={{fontSize: 11, color: T.muted, marginBottom: 4}}>
                                    {fmtTime(e.startTime)}{isOpen ? ' → now' : e.endTime ? ` → ${fmtTime(e.endTime)}` : ''}
                                    {'  '}<AccentText T={T} style={{color: T.accent}}>{fmtDur(e.startTime, e.endTime)}</AccentText>
                                  </Text>
                                )}
                                {(e.mood || e.location) && (
                                  <View style={{flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: e.note ? 4 : 0}}>
                                    {e.mood && (
                                      <View style={[s.badge, {backgroundColor: T.surface}]}>
                                        <Text style={{fontSize: 10, color: T.dim}}>mood </Text>
                                        <Text style={{fontSize: 11, color: T.text, fontWeight: '500'}}>{e.mood}</Text>
                                      </View>
                                    )}
                                    {e.location && (
                                      <View style={[s.badge, {backgroundColor: T.surface}]}>
                                        <Text style={{fontSize: 10, color: T.dim}}>at </Text>
                                        <Text style={{fontSize: 11, color: T.text, fontWeight: '500'}}>{e.location}</Text>
                                      </View>
                                    )}
                                  </View>
                                )}
                                {e.note ? (
                                  <View style={{backgroundColor: T.surface, borderRadius: 6, padding: 7}}>
                                    <Text style={{fontSize: 12, color: T.dim, lineHeight: 17}}>{e.note}</Text>
                                  </View>
                                ) : null}
                              </>
                            );
                          })()}

                          {'journalEntry' in event && event.journalEntry && (
                            <>
                              <Text style={{fontSize: 14, fontWeight: '500', color: T.text, marginBottom: 2}}>
                                {event.journalEntry.title || 'Untitled'}
                              </Text>
                              {event.journalEntry.body ? (
                                <Text style={{fontSize: 12, color: T.dim, lineHeight: 17}} numberOfLines={2}>
                                  {event.journalEntry.body}
                                </Text>
                              ) : null}
                              {(event.journalEntry.hashtags || []).length > 0 && (
                                <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6}}>
                                  {(event.journalEntry.hashtags || []).map((t: string) => (
                                    <View key={t} style={{paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999,
                                      backgroundColor: `${T.info}12`, borderWidth: 1, borderColor: `${T.info}30`}}>
                                      <Text style={{fontSize: 10, color: T.info}}>{t}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  heading: {fontFamily: Fonts.display, fontSize: 24, fontWeight: '600', fontStyle: 'italic', marginBottom: 0},
  subtab: {paddingHorizontal: 16, paddingVertical: 10, marginBottom: -1},
  card: {borderRadius: 12, borderWidth: 1, padding: 12},
  badge: {flexDirection: 'row', alignItems: 'center', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3},
  stat: {flex: 1, borderRadius: 10, borderWidth: 1, padding: 10},
});
