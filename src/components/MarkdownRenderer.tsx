import React from 'react';
import {View, Text, Image, Linking} from 'react-native';

const IMAGE_URL_RE = /https?:\/\/\S+\.(?:gif|png|pnj|jpe?g|webp|bmp|svg)(?:[?#]\S*)?/gi;
const MD_IMAGE_RE = /!\[([^\]]*)\]\(([^)]+)\)/;

const fs = (s: number, T: any): number => Math.round(s * (T?.textScale || 1));

const isHTML = (text: string): boolean => {
  const t = text.trim();
  return t.startsWith('<') || /<(?:p|h[1-6]|div|ul|ol|blockquote|pre|hr)\b/i.test(t);
};

const decodeEntities = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

const renderInlineHTML = (html: string, T: any): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = html;
  let key = 0;
  const hasAnyImage = /<img\s/i.test(html);
  const wrapText = (s: string): React.ReactNode => {
    if (!s) return null;
    if (hasAnyImage) return <Text key={key++} style={{fontSize: fs(13, T), color: T.dim, lineHeight: 20}}>{s}</Text>;
    return s;
  };
  const imgRe = /<img\s[^>]*>/i;
  const inlineRe = /<(strong|b|em|i|s|del|code|a)(\s[^>]*)?>(.+?)<\/\1>/;
  while (remaining.length > 0) {
    const imgM = remaining.match(imgRe);
    const inlineM = remaining.match(inlineRe);
    const imgIdx = imgM?.index ?? Infinity;
    const inlineIdx = inlineM?.index ?? Infinity;

    if (imgIdx < inlineIdx && imgM && imgM.index !== undefined) {
      if (imgM.index > 0) {
        const before = decodeEntities(remaining.slice(0, imgM.index).replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '')).trim();
        const wrapped = wrapText(before);
        if (wrapped) parts.push(wrapped);
      }
      const srcMatch = imgM[0].match(/src=["']([^"']+)["']/);
      const widthMatch = imgM[0].match(/width=["']?(\d+)["']?/);
      const heightMatch = imgM[0].match(/height=["']?(\d+)["']?/);
      if (srcMatch) {
        const url = srcMatch[1];
        const isValidUrl = /^https?:\/\//i.test(url) || /^file:\/\//i.test(url) || url.startsWith('data:');
        const w = widthMatch ? Number(widthMatch[1]) : undefined;
        const h = heightMatch ? Number(heightMatch[1]) : undefined;
        if (isValidUrl) {
          parts.push(<Image key={key++} source={{uri: url}} style={{width: w || 200, height: h || w || 200, borderRadius: 8, marginVertical: 4}} resizeMode="contain" />);
        } else {
          parts.push(<Text key={key++} style={{fontSize: fs(11, T), color: T.muted, fontStyle: 'italic'}}>[broken image: {url}]</Text>);
        }
      }
      remaining = remaining.slice(imgM.index + imgM[0].length);
      continue;
    }

    if (!inlineM || inlineM.index === undefined) {
      const tail = decodeEntities(remaining.replace(/<br\s*\/?>/g, '\n').replace(/<img\s[^>]*>/gi, '').replace(/<[^>]*>/g, ''));
      const wrapped = wrapText(tail);
      if (wrapped) parts.push(wrapped);
      break;
    }
    if (inlineM.index > 0) {
      const before = decodeEntities(remaining.slice(0, inlineM.index).replace(/<br\s*\/?>/g, '\n').replace(/<img\s[^>]*>/gi, '').replace(/<[^>]*>/g, ''));
      const wrapped = wrapText(before);
      if (wrapped) parts.push(wrapped);
    }
    const tag = inlineM[1]; const attrs = inlineM[2] || ''; const inner = inlineM[3];
    switch (tag) {
      case 'strong': case 'b': parts.push(<Text key={key++} style={{fontWeight: '700', color: T.text}}>{renderInlineHTML(inner, T)}</Text>); break;
      case 'em': case 'i': parts.push(<Text key={key++} style={{fontStyle: 'italic'}}>{renderInlineHTML(inner, T)}</Text>); break;
      case 's': case 'del': parts.push(<Text key={key++} style={{textDecorationLine: 'line-through'}}>{renderInlineHTML(inner, T)}</Text>); break;
      case 'code': parts.push(<Text key={key++} style={{fontFamily: 'monospace', backgroundColor: T.surface, paddingHorizontal: 4, borderRadius: 3, fontSize: fs(12, T)}}>{decodeEntities(inner)}</Text>); break;
      case 'a': { const href = (attrs.match(/href=["']([^"']+)["']/) || [])[1] || ''; parts.push(<Text key={key++} style={{color: T.info, textDecorationLine: 'underline'}} onPress={() => href && Linking.openURL(href)}>{renderInlineHTML(inner, T)}</Text>); break; }
      default: { const wrapped = wrapText(decodeEntities(inner)); if (wrapped) parts.push(wrapped); }
    }
    remaining = remaining.slice(inlineM.index + inlineM[0].length);
  }
  return parts.length === 1 ? parts[0] : <>{parts}</>;
};

const renderHTMLBlocks = (html: string, T: any): React.ReactNode => {
  const blocks: React.ReactNode[] = [];
  let key = 0;
  const blockRe = /<(p|h[1-3]|blockquote|ul|ol|pre|hr|li|div)(\s[^>]*)?>|<\/(p|h[1-3]|blockquote|ul|ol|pre|li|div)>/g;
  const tagStack: string[] = [];
  let segments: {tag: string; content: string; listItems?: string[]}[] = [];
  let current = '';
  let currentTag = 'p';
  let listItems: string[] = [];
  let inList = '';
  let lastIdx = 0;
  let match;

  const raw = html.replace(/\n/g, '');

  while ((match = blockRe.exec(raw)) !== null) {
    const [full, openTag, attrs, closeTag] = match;
    const tag = (openTag || closeTag || '').toLowerCase();

    if (openTag) {
      if (tag === 'hr') { if (current.trim()) segments.push({tag: currentTag, content: current}); current = ''; segments.push({tag: 'hr', content: ''}); continue; }
      if (tag === 'ul' || tag === 'ol') { if (current.trim()) segments.push({tag: currentTag, content: current}); current = ''; inList = tag; listItems = []; continue; }
      if (tag === 'li') { current = ''; continue; }
      if (tag === 'pre' || tag === 'blockquote') { if (current.trim()) segments.push({tag: currentTag, content: current}); current = ''; currentTag = tag; continue; }
      if (current.trim()) segments.push({tag: currentTag, content: current});
      current = '';
      currentTag = tag;
    } else if (closeTag) {
      if (closeTag === 'li') { listItems.push(current); current = ''; continue; }
      if (closeTag === 'ul' || closeTag === 'ol') { segments.push({tag: closeTag, content: '', listItems: [...listItems]}); inList = ''; listItems = []; continue; }
      if (current.trim() || closeTag === 'p') segments.push({tag: currentTag, content: current});
      current = '';
      currentTag = 'p';
    }
    lastIdx = match.index + full.length;
    const nextMatch = blockRe.exec(raw);
    if (nextMatch) { current = raw.slice(match.index + full.length, nextMatch.index); blockRe.lastIndex = nextMatch.index; }
    else { current = raw.slice(match.index + full.length); }
  }
  if (current.trim()) segments.push({tag: currentTag, content: current});

  if (segments.length === 0 && raw.trim()) {
    segments.push({tag: 'p', content: raw});
  }

  return (
    <View style={{gap: 2}}>
      {segments.map((seg, i) => {
        switch (seg.tag) {
          case 'h1': return <Text key={i} style={{fontSize: fs(18, T), fontWeight: '700', color: T.text, marginBottom: 4}}>{renderInlineHTML(seg.content, T)}</Text>;
          case 'h2': return <Text key={i} style={{fontSize: fs(16, T), fontWeight: '700', color: T.text, marginBottom: 4}}>{renderInlineHTML(seg.content, T)}</Text>;
          case 'h3': return <Text key={i} style={{fontSize: fs(14, T), fontWeight: '700', color: T.text, marginBottom: 4}}>{renderInlineHTML(seg.content, T)}</Text>;
          case 'blockquote': return <View key={i} style={{borderLeftWidth: 3, borderLeftColor: T.accent, paddingLeft: 10, marginVertical: 2}}><Text style={{fontSize: fs(13, T), color: T.dim, fontStyle: 'italic', lineHeight: 20}}>{renderInlineHTML(seg.content, T)}</Text></View>;
          case 'pre': return <View key={i} style={{backgroundColor: T.surface, padding: 10, borderRadius: 8, marginVertical: 4}}><Text style={{fontFamily: 'monospace', fontSize: fs(12, T), color: T.dim}}>{decodeEntities(seg.content.replace(/<[^>]*>/g, ''))}</Text></View>;
          case 'hr': return <View key={i} style={{height: 1, backgroundColor: T.border, marginVertical: 8}} />;
          case 'ul': return <View key={i} style={{marginVertical: 2}}>{(seg.listItems || []).map((li, j) => <View key={j} style={{flexDirection: 'row', gap: 6, marginVertical: 1}}><Text style={{fontSize: fs(13, T), color: T.dim}}>•</Text><Text style={{fontSize: fs(13, T), color: T.dim, flex: 1, lineHeight: 20}}>{renderInlineHTML(li, T)}</Text></View>)}</View>;
          case 'ol': return <View key={i} style={{marginVertical: 2}}>{(seg.listItems || []).map((li, j) => <View key={j} style={{flexDirection: 'row', gap: 6, marginVertical: 1}}><Text style={{fontSize: fs(13, T), color: T.dim, width: 16, textAlign: 'right'}}>{j + 1}.</Text><Text style={{fontSize: fs(13, T), color: T.dim, flex: 1, lineHeight: 20}}>{renderInlineHTML(li, T)}</Text></View>)}</View>;
          case 'p': default: {
            const content = seg.content.trim();
            if (!content) return <View key={i} style={{height: 4}} />;
            const hasImage = /<img\s/i.test(content);
            if (hasImage) {
              return <View key={i} style={{marginVertical: 2}}>{renderInlineHTML(content, T)}</View>;
            }
            return <Text key={i} style={{fontSize: fs(13, T), color: T.dim, lineHeight: 20}}>{renderInlineHTML(content, T)}</Text>;
          }
        }
      })}
    </View>
  );
};

const renderInline = (text: string, T: any): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const patterns: [RegExp, (m: RegExpMatchArray) => React.ReactNode][] = [
    [/\*\*\*(.+?)\*\*\*/, m => <Text key={key++} style={{fontWeight: '700', fontStyle: 'italic', color: T.text}}>{m[1]}</Text>],
    [/\*\*(.+?)\*\*/, m => <Text key={key++} style={{fontWeight: '700', color: T.text}}>{m[1]}</Text>],
    [/\*(.+?)\*/, m => <Text key={key++} style={{fontStyle: 'italic'}}>{m[1]}</Text>],
    [/~~(.+?)~~/, m => <Text key={key++} style={{textDecorationLine: 'line-through'}}>{m[1]}</Text>],
    [/`(.+?)`/, m => <Text key={key++} style={{fontFamily: 'monospace', backgroundColor: T.surface, paddingHorizontal: 4, borderRadius: 3, fontSize: fs(12, T)}}>{m[1]}</Text>],
    [/!\[([^\]]*)\]\(([^)]+)\)/, m => <Image key={key++} source={{uri: m[2].replace(/[)]+$/, '')}} style={{width: 200, height: 200, borderRadius: 8}} resizeMode="contain" />],
    [/\[(.+?)\]\((.+?)\)/, m => <Text key={key++} style={{color: T.info, textDecorationLine: 'underline'}} onPress={() => Linking.openURL(m[2])}>{m[1]}</Text>],
  ];
  while (remaining.length > 0) {
    let earliest: {idx: number; len: number; node: React.ReactNode} | null = null;
    for (const [re, fn] of patterns) {
      const m = remaining.match(re);
      if (m && m.index !== undefined) {
        const node = fn(m);
        if (!earliest || m.index < earliest.idx) earliest = {idx: m.index, len: m[0].length, node};
      }
    }
    if (!earliest) { parts.push(remaining); break; }
    if (earliest.idx > 0) parts.push(remaining.slice(0, earliest.idx));
    parts.push(earliest.node);
    remaining = remaining.slice(earliest.idx + earliest.len);
  }
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>;
};

const renderMarkdownLine = (line: string, T: any, i: number): React.ReactNode => {
  if (line.startsWith('### ')) return <Text key={i} style={{fontSize: fs(14, T), fontWeight: '700', color: T.text, marginBottom: 4}}>{line.slice(4)}</Text>;
  if (line.startsWith('## ')) return <Text key={i} style={{fontSize: fs(16, T), fontWeight: '700', color: T.text, marginBottom: 4}}>{line.slice(3)}</Text>;
  if (line.startsWith('# ')) return <Text key={i} style={{fontSize: fs(18, T), fontWeight: '700', color: T.text, marginBottom: 4}}>{line.slice(2)}</Text>;
  if (line.startsWith('> ')) return <View key={i} style={{borderLeftWidth: 3, borderLeftColor: T.accent, paddingLeft: 10, marginVertical: 2}}><Text style={{fontSize: fs(13, T), color: T.dim, fontStyle: 'italic', lineHeight: 20}}>{line.slice(2)}</Text></View>;
  if (line.startsWith('---') || line.startsWith('***')) return <View key={i} style={{height: 1, backgroundColor: T.border, marginVertical: 8}} />;
  if (line.match(/^[-*] /)) return <View key={i} style={{flexDirection: 'row', gap: 6, marginVertical: 1}}><Text style={{fontSize: fs(13, T), color: T.dim}}>•</Text><Text style={{fontSize: fs(13, T), color: T.dim, flex: 1, lineHeight: 20}}>{renderInline(line.slice(2), T)}</Text></View>;
  if (line.match(/^\d+\. /)) {const m = line.match(/^(\d+)\. (.*)$/); return <View key={i} style={{flexDirection: 'row', gap: 6, marginVertical: 1}}><Text style={{fontSize: fs(13, T), color: T.dim, width: 16, textAlign: 'right'}}>{m?.[1]}.</Text><Text style={{fontSize: fs(13, T), color: T.dim, flex: 1, lineHeight: 20}}>{renderInline(m?.[2] || '', T)}</Text></View>;}
  if (!line.trim()) return <View key={i} style={{height: 8}} />;
  return <Text key={i} style={{fontSize: fs(13, T), color: T.dim, lineHeight: 20}}>{renderInline(line, T)}</Text>;
};

export const RichText = ({text, T, numberOfLines}: {text: string; T: any; numberOfLines?: number}) => {
  if (!text) return null;
  if (isHTML(text)) return renderHTMLBlocks(text, T);
  const lines = text.split('\n');
  const displayLines = numberOfLines ? lines.slice(0, numberOfLines) : lines;
  const elements: React.ReactNode[] = [];
  displayLines.forEach((line, i) => {
    const mdImgMatch = line.match(MD_IMAGE_RE);
    if (mdImgMatch && mdImgMatch.index !== undefined) {
      const before = line.slice(0, mdImgMatch.index).trim();
      const after = line.slice(mdImgMatch.index + mdImgMatch[0].length).trim();
      const url = mdImgMatch[2].replace(/[)]+$/, '').replace(/#\d+x\d+$/, '');
      if (before) elements.push(renderMarkdownLine(before, T, i * 3));
      elements.push(<Image key={i * 3 + 1} source={{uri: url}} style={{width: '100%', height: 200, borderRadius: 8}} resizeMode="contain" />);
      if (after) elements.push(renderMarkdownLine(after, T, i * 3 + 2));
      return;
    }
    const imgMatch = line.match(IMAGE_URL_RE);
    if (imgMatch) {
      const before = line.slice(0, line.indexOf(imgMatch[0])).trim();
      const after = line.slice(line.indexOf(imgMatch[0]) + imgMatch[0].length).trim();
      if (before) elements.push(renderMarkdownLine(before, T, i * 3));
      elements.push(<Image key={i * 3 + 1} source={{uri: imgMatch[0]}} style={{width: '100%', height: 200, borderRadius: 8}} resizeMode="contain" />);
      if (after) elements.push(renderMarkdownLine(after, T, i * 3 + 2));
    } else {
      elements.push(renderMarkdownLine(line, T, i));
    }
  });
  return <View style={{gap: 2}}>{elements}</View>;
};
