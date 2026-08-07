import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { Colors } from '../constants/colors';
import { RichBlock } from '../types';

type Props = {
  richContent?: RichBlock[] | null;
  fallbackText: string;
  fontSize: number;
  color?: string;
  fontFamily?: string;
};

// ═══ تحميل ملفات KaTeX المحلية مرة واحدة وتخزينها بالذاكرة ═══
let cachedKatexJs: string | null = null;
let cachedKatexCss: string | null = null;
let loadingPromise: Promise<void> | null = null;

async function loadKatexAssets(): Promise<void> {
  if (cachedKatexJs && cachedKatexCss) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const jsAsset = Asset.fromModule(require('../assets/katex/katex.min.js'));
    const cssAsset = Asset.fromModule(require('../assets/katex/katex.min.css'));

    await Promise.all([jsAsset.downloadAsync(), cssAsset.downloadAsync()]);

    const [js, css] = await Promise.all([
      FileSystem.readAsStringAsync(jsAsset.localUri!),
      FileSystem.readAsStringAsync(cssAsset.localUri!),
    ]);

    cachedKatexJs = js;
    cachedKatexCss = css;
  })();

  return loadingPromise;
}

function LatexBlock({ content, fontSize }: { content: string; fontSize: number }) {
  const [height, setHeight] = useState(fontSize * 2);
  const [ready, setReady] = useState(!!(cachedKatexJs && cachedKatexCss));

  useEffect(() => {
    if (!ready) {
      loadKatexAssets().then(() => setReady(true));
    }
  }, [ready]);

  if (!ready || !cachedKatexJs || !cachedKatexCss) {
    // أثناء التحميل — اعرض نص خام مؤقتاً بدل فراغ
    return (
      <Text style={{ fontSize, color: Colors.text.disabled, fontFamily: 'monospace', textAlign: 'right' }}>
        {content}
      </Text>
    );
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>${cachedKatexCss}</style>
      <style>
        body {
          margin: 0;
          padding: 8px;
          display: flex;
          justify-content: flex-end;
          direction: rtl;
          background: transparent;
        }
        #math { font-size: ${fontSize}px; }
      </style>
    </head>
    <body>
      <div id="math"></div>
      <script>${cachedKatexJs}</script>
      <script>
        try {
          katex.render(${JSON.stringify(content)}, document.getElementById('math'), {
            throwOnError: false,
            displayMode: false,
          });
          window.ReactNativeWebView.postMessage(document.body.scrollHeight.toString());
        } catch (e) {
          document.getElementById('math').innerText = ${JSON.stringify(content)};
        }
      </script>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    return (
      <View style={{ width: '100%', minHeight: fontSize * 2 }}>
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: fontSize * 2.5, border: 'none' }}
          title="latex"
        />
      </View>
    );
  }

  return (
    <WebView
      source={{ html }}
      style={{ height, width: '100%', backgroundColor: 'transparent' }}
      scrollEnabled={false}
      onMessage={(e) => {
        const h = parseInt(e.nativeEvent.data, 10);
        if (h > 0) setHeight(h);
      }}
      originWhitelist={['*']}
    />
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
            <View key={block.id} style={styles.latexWrap}>
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
  latexWrap: { width: '100%', marginVertical: 4 },
});