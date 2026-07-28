import { useWindowDimensions, Platform, DimensionValue, ViewStyle, TextStyle } from 'react-native';
import { useCallback, useMemo } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const breakpoint: Breakpoint = width >= BREAKPOINTS.desktop
    ? 'desktop'
    : width >= BREAKPOINTS.tablet
      ? 'tablet'
      : 'mobile';

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';
  const isWeb = Platform.OS === 'web';

  const getResponsiveValue = useCallback(<T>(values: { mobile: T; tablet?: T; desktop?: T }): T => {
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    if (isTablet && values.tablet !== undefined) return values.tablet;
    return values.mobile;
  }, [isDesktop, isTablet]);

  const getResponsiveStyle = useCallback((styles: { mobile: ViewStyle; tablet?: ViewStyle; desktop?: ViewStyle }): ViewStyle => {
    if (isDesktop && styles.desktop) return styles.desktop;
    if (isTablet && styles.tablet) return styles.tablet;
    return styles.mobile;
  }, [isDesktop, isTablet]);

  const getResponsiveTextStyle = useCallback((styles: { mobile: TextStyle; tablet?: TextStyle; desktop?: TextStyle }): TextStyle => {
    if (isDesktop && styles.desktop) return styles.desktop;
    if (isTablet && styles.tablet) return styles.tablet;
    return styles.mobile;
  }, [isDesktop, isTablet]);

  const maxWidth: DimensionValue = getResponsiveValue<DimensionValue>({
    mobile: '100%',
    tablet: 480,
    desktop: 440,
  });

  const horizontalPadding = getResponsiveValue({
    mobile: 24,
    tablet: 32,
    desktop: 40,
  });

  const formWidth: DimensionValue = getResponsiveValue<DimensionValue>({
    mobile: '100%',
    tablet: 420,
    desktop: 400,
  });

  return useMemo(() => ({
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWeb,
    maxWidth,
    horizontalPadding,
    formWidth,
    getResponsiveValue,
    getResponsiveStyle,
    getResponsiveTextStyle,
  }), [
    width, height, breakpoint, isMobile, isTablet, isDesktop, isWeb,
    maxWidth, horizontalPadding, formWidth,
    getResponsiveValue, getResponsiveStyle, getResponsiveTextStyle,
  ]);
}
