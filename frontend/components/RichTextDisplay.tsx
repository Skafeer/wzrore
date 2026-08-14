import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { RichBlock } from '../types';

type Props = {
  richContent?: RichBlock[] | null;
  fallbackText: string;
  fontSize: number;
  color?: string;
  fontFamily?: string;
};

function LatexBlock({ content, fontSize }: { content: string; fontSize: number }) {
  // على الويب — نستخدم iframe بسيط مع KaTeX من CDN (الويب دايماً متصل بالنت وقت الفتح)
  if (Platform.OS === 'web') {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
        <style>
          body { margin: 0; padding: 6px; display: flex; justify-content: flex-end; direction: rtl; background: transparent; }
          #math { font-size: ${fontSize}px; }
        </style>
      </head>
      <body>
        <div id="math"></div>
        <script>
          window.onload = function() {
            try {
              katex.render(${JSON.stringify(content)}, document.getElementById('math'), { throwOnError: false });
            } catch (e) {
              document.getElementById('math').innerText = ${JSON.stringify(content)};
            }
          };
        </script>
      </body>
      </html>
    `;
    return (
      <View style={{ width: '100%', minHeight: fontSize * 2 }}>
        <iframe srcDoc={html} style={{ width: '100%', height: fontSize * 2.5, border: 'none' }} title="latex" />
      </View>
    );
  }

  // على الموبايل — react-native-katex (مكتبة جاهزة ومختبرة)
  const Katex = require('react-native-katex').default;

  return (
    <View style={styles.latexWrap}>
      <Katex
        expression={content}
        displayMode={false}
        throwOnError={false}
        style={{ width: '100%', minHeight: fontSize * 2 }}
      />
    </View>
  );
}

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
            <View key={block.id} style={styles.blockWrap}>
              <LatexBlock content={block.content} fontSize={fontSize} />
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
  blockWrap: { width: '100%', marginVertical: 4 },
  latexWrap: { width: '100%', alignItems: 'flex-end' },
});