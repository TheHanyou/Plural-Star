import React, {useState} from 'react';
import {View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, KeyboardAvoidingView, Modal, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Fonts} from '../theme';
import type {ThemeColors} from '../theme';

interface Props {
  visible: boolean;
  title: string;
  initialContent: string;
  theme: ThemeColors;
  onSave: (content: string) => void;
  onClose: () => void;
}

const MD_TOOLS: {label: string; before: string; after: string; bold?: boolean; italic?: boolean; strike?: boolean}[] = [
  {label: 'B', before: '**', after: '**', bold: true},
  {label: 'I', before: '*', after: '*', italic: true},
  {label: 'S', before: '~~', after: '~~', strike: true},
  {label: 'H1', before: '# ', after: ''},
  {label: 'H2', before: '## ', after: ''},
  {label: 'H3', before: '### ', after: ''},
  {label: '🔗', before: '[', after: '](url)'},
  {label: '•', before: '- ', after: ''},
  {label: '1.', before: '1. ', after: ''},
  {label: '❝', before: '> ', after: ''},
  {label: '</>', before: '`', after: '`'},
  {label: '—', before: '\n---\n', after: ''},
];

const MdToolbar = ({onInsert, T}: {onInsert: (before: string, after: string) => void; T: ThemeColors}) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
    style={{maxHeight: 40, flexGrow: 0, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.surface}}
    contentContainerStyle={{paddingHorizontal: 12, paddingVertical: 6, gap: 6, flexDirection: 'row', alignItems: 'center'}}>
    {MD_TOOLS.map(tool => (
      <TouchableOpacity key={tool.label} onPress={() => onInsert(tool.before, tool.after)} activeOpacity={0.7}
        style={{paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: T.border, backgroundColor: T.bg}}>
        <Text style={{fontSize: 12, fontWeight: tool.bold ? '700' : '500', fontStyle: tool.italic ? 'italic' : 'normal', textDecorationLine: tool.strike ? 'line-through' : 'none', color: T.dim}}>{tool.label}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const MarkdownEditor = ({initialContent, theme: T, onSave, onClose, title}: {initialContent: string; theme: ThemeColors; onSave: (text: string) => void; onClose: () => void; title: string}) => {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(initialContent || '');
  const [isSaving, setIsSaving] = useState(false);

  const insertFormat = (before: string, after: string) => {
    setText(prev => prev + before + (after ? 'text' : '') + after);
  };

  const handleSave = () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      onSave(text);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[s.container, {backgroundColor: T.bg, paddingTop: Platform.OS === 'ios' ? insets.top : 0}]}>
      <View style={[s.header, {borderBottomColor: T.border, backgroundColor: T.bg}]}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={s.headerBtn}>
          <Text style={{fontSize: 14, color: T.dim}}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, {color: T.text}]}>{title}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} activeOpacity={0.7} style={[s.headerBtn, {alignItems: 'flex-end'}]}>
          <Text style={{fontSize: 14, fontWeight: '600', color: isSaving ? T.dim : T.accent}}>{isSaving ? '…' : 'Done'}</Text>
        </TouchableOpacity>
      </View>
      <MdToolbar onInsert={insertFormat} T={T} />
      <ScrollView style={{flex: 1}} contentContainerStyle={{padding: 16, paddingBottom: 40}} keyboardShouldPersistTaps="handled">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write in markdown…"
          placeholderTextColor={T.muted}
          multiline
          autoFocus
          style={{fontSize: 15, color: T.text, lineHeight: 22, fontFamily: 'monospace', minHeight: 300, textAlignVertical: 'top'}}
        />
      </ScrollView>
    </View>
  );
};

export const RichTextEditor = ({visible, title, initialContent, theme, onSave, onClose}: Props) => {
  return (
    <Modal visible={visible} animationType="none" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{flex: 1, backgroundColor: theme.bg}}>
        {visible && (
          <MarkdownEditor 
            title={title} 
            initialContent={initialContent} 
            theme={theme} 
            onSave={onSave} 
            onClose={onClose} 
          />
        )}
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: {flex: 1, overflow: 'hidden'},
  header: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1},
  headerTitle: {fontFamily: Fonts.display, fontSize: 18, fontWeight: '600', fontStyle: 'italic'},
  headerBtn: {padding: 4, minWidth: 60},
});