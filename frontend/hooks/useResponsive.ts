import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

export function wp(percentage: number): number {
  return (SCREEN_WIDTH * percentage) / 100;
}

export function hp(percentage: number): number {
  return (SCREEN_HEIGHT * percentage) / 100;
}

export function rs(size: number): number {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export function isTablet(): boolean {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return SCREEN_WIDTH >= 768 || aspectRatio < 1.6;
}

export function useResponsive() {
  const tablet = isTablet();

  return {
    wp,
    hp,
    rs,
    isTablet: tablet,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    contentWidth: tablet ? Math.min(SCREEN_WIDTH * 0.75, 600) : SCREEN_WIDTH,
  };
}