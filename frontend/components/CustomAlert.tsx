import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useResponsive } from '../hooks/useResponsive';
import { Colors } from '../constants/colors';
import { MotionView } from './motion';

export type AlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type AlertOptions = {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
};

export interface CustomAlertRef {
  show: (options: AlertOptions) => void;
  hide: () => void;
}

const CustomAlert = forwardRef<CustomAlertRef, {}>((props, ref) => {
  const { rs } = useResponsive();
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({});

  useImperativeHandle(ref, () => ({
    show: (opts) => {
      setOptions(opts);
      setVisible(true);
    },
    hide: () => {
      setVisible(false);
    },
  }));

  const handleButtonPress = (onPress?: () => void) => {
    setVisible(false);
    if (onPress) {
      setTimeout(onPress, 300);
    }
  };

  const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    if (style === 'destructive') return { backgroundColor: '#FEF2F2', textColor: Colors.error };
    if (style === 'cancel') return { backgroundColor: Colors.background, textColor: Colors.text.secondary };
    return { backgroundColor: Colors.primary, textColor: Colors.white };
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={() => setVisible(false)}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={() => {}}>
        <Animated.View 
          entering={FadeIn.duration(300)} 
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <MotionView delay={100} style={[styles.alertBox, { padding: rs(24), borderRadius: rs(20), width: rs(320) }]}>
            {options.title && (
              <Text style={[styles.title, { fontSize: rs(18), marginBottom: rs(8) }]}>
                {options.title}
              </Text>
            )}
            {options.message && (
              <Text style={[styles.message, { fontSize: rs(14), marginBottom: rs(20) }]}>
                {options.message}
              </Text>
            )}
            
            <View style={styles.buttonContainer}>
              {(options.buttons || []).map((btn, index) => {
                const { backgroundColor, textColor } = getButtonStyle(btn.style);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      { backgroundColor, paddingVertical: rs(12), borderRadius: rs(12), flex: 1 },
                      index > 0 && { marginRight: rs(8) },
                    ]}
                    onPress={() => handleButtonPress(btn.onPress)}
                  >
                    <Text style={[styles.buttonText, { fontSize: rs(15), color: textColor }]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </MotionView>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

export default CustomAlert;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    alignItems: 'center',
  },
  title: {
    color: Colors.text.primary,
    fontFamily: 'Tajawal_800ExtraBold',
    textAlign: 'center',
  },
  message: {
    color: Colors.text.secondary,
    fontFamily: 'Tajawal_500Medium',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Tajawal_700Bold',
  },
});