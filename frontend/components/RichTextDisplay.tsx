import { View, Text, StyleSheet } from 'react-native';
import MathView from 'react-native-math-view';
import { Colors } from '../constants/colors';
import { RichBlock } from '../types';

type Props = {
  richContent?: RichBlock[] | null;
  fallbackText: string;
  fontSize: number;
  color?: string;
  fontFamily?: string;
};

export default function RichTextDisplay({
  richContent, fallbackText, fontSize, color, fontFamily,
}: Props) {
  if (!richContent || richContent.length === 0) {
    return (
      <Text style={{
        fontSize,
        color: color ?? Colors.text.primary,
        fontFamily: fontFamily ?? 'Tajawal_500Medium',
        textAlign: 'right',
        lineHeight: fontSize * 1.6,
      }}>
        {fallbackText}
      </Text>
    );
  }

  return (
    <View style={styles.wrap}>
      {richContent.map(block => {
        if (block.type === 'latex') {
          return (
            <View key={block.id} style={[styles.latexWrap, { marginVertical: 6 }]}>
              <MathView
                math={block.content}
                style={{ alignSelf: 'flex-end' }}
                resizeMode="contain"
              />
            </View>
          );
        }
        return (
          <Text
            key={block.id}
            style={{
              fontSize,
              color: color ?? Colors.text.primary,
              fontFamily: fontFamily ?? 'Tajawal_500Medium',
              textAlign: 'right',
              lineHeight: fontSize * 1.6,
            }}
          >
            {block.content}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  latexWrap: { alignItems: 'flex-end', width: '100%' },
});