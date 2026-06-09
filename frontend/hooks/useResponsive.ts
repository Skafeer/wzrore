import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 390;
const MIN_SCALE = 0.88;
const MAX_SCALE = 1.18;

export type ResponsiveMetrics = {
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
  rs: (size: number) => number;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  contentWidth: number;
  gutter: number;
  pagePadding: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function wp(percentage: number): number {
  return (SCREEN_WIDTH * percentage) / 100;
}

export function hp(percentage: number): number {
  return (SCREEN_HEIGHT * percentage) / 100;
}

export function rs(size: number): number {
  const scale = clamp(SCREEN_WIDTH / BASE_WIDTH, MIN_SCALE, MAX_SCALE);
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

export function isTablet(): boolean {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return SCREEN_WIDTH >= 768 || aspectRatio < 1.6;
}

export function useResponsive(): ResponsiveMetrics {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const tablet = width >= 768 || shortSide >= 700;
  const desktop = Platform.OS === 'web' && width >= 1024;
  const scale = clamp(width / BASE_WIDTH, MIN_SCALE, desktop ? 1.1 : MAX_SCALE);
  const maxContentWidth = desktop ? 1080 : tablet ? 760 : width;
  const contentWidth = Math.min(width, maxContentWidth);
  const gutter = desktop ? 32 : tablet ? 28 : 20;

  return {
    wp: (percentage: number) => (width * percentage) / 100,
    hp: (percentage: number) => (height * percentage) / 100,
    rs: (size: number) => Math.round(PixelRatio.roundToNearestPixel(size * scale)),
    isTablet: tablet,
    isDesktop: desktop,
    screenWidth: width,
    screenHeight: height,
    contentWidth,
    gutter,
    pagePadding: Math.max((width - contentWidth) / 2 + gutter, gutter),
  };
}
