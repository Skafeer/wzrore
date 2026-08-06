declare module 'react-native-math-view' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  export interface MathViewProps {
    math: string;
    style?: ViewStyle;
    resizeMode?: 'contain' | 'cover' | 'stretch';
    onError?: (error: Error) => void;
  }

  export default class MathView extends Component<MathViewProps> {}
}