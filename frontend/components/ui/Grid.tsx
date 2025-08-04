/**
 * Responsive Grid System for MoneyAI
 * Provides flexible grid layout with responsive breakpoints
 */

import { useResponsive, useResponsiveSpacing, useResponsiveValue } from '@/frontend/hooks/useResponsive';
import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

interface GridProps {
  children: ReactNode;
  columns?: number | { mobile: number; tablet?: number; desktop?: number };
  gap?: number | { mobile: number; tablet?: number; desktop?: number };
  style?: ViewStyle;
}

export function Grid({ children, columns = 1, gap = 16, style }: GridProps) {
  const spacing = useResponsiveSpacing();
  
  const responsiveColumns = useResponsiveValue(
    typeof columns === 'number' 
      ? { mobile: columns }
      : { mobile: columns.mobile, tablet: columns.tablet, desktop: columns.desktop }
  );
  
  const responsiveGap = useResponsiveValue(
    typeof gap === 'number'
      ? { mobile: gap }
      : { mobile: gap.mobile, tablet: gap.tablet, desktop: gap.desktop }
  );

  const gridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -responsiveGap / 2,
    ...style,
  };

  const childrenArray = React.Children.toArray(children);
  
  return (
    <View style={gridStyle}>
      {childrenArray.map((child, index) => (
        <GridItem
          key={index}
          columns={responsiveColumns}
          gap={responsiveGap}
        >
          {child}
        </GridItem>
      ))}
    </View>
  );
}

interface GridItemProps {
  children: ReactNode;
  columns: number;
  gap: number;
  span?: number | { mobile: number; tablet?: number; desktop?: number };
}

function GridItem({ children, columns, gap, span = 1 }: GridItemProps) {
  const responsiveSpan = useResponsiveValue(
    typeof span === 'number'
      ? { mobile: span }
      : { mobile: span.mobile, tablet: span.tablet, desktop: span.desktop }
  );

  const width = `${(100 / columns) * Math.min(responsiveSpan, columns)}%`;
  
  const itemStyle: ViewStyle = {
    width,
    paddingHorizontal: gap / 2,
    marginBottom: gap,
  };

  return <View style={itemStyle}>{children}</View>;
}

interface ContainerProps {
  children: ReactNode;
  maxWidth?: number | { mobile: number; tablet?: number; desktop?: number };
  padding?: number | { mobile: number; tablet?: number; desktop?: number };
  style?: ViewStyle;
}

export function Container({ 
  children, 
  maxWidth = { mobile: 320, tablet: 768, desktop: 1024 },
  padding,
  style 
}: ContainerProps) {
  const spacing = useResponsiveSpacing();
  const { width: screenWidth } = useResponsive();
  
  const responsiveMaxWidth = useResponsiveValue(
    typeof maxWidth === 'number'
      ? { mobile: maxWidth }
      : { mobile: maxWidth.mobile, tablet: maxWidth.tablet, desktop: maxWidth.desktop }
  );
  
  const responsivePadding = useResponsiveValue(
    typeof padding === 'number'
      ? { mobile: padding }
      : padding 
        ? { mobile: padding.mobile, tablet: padding.tablet, desktop: padding.desktop }
        : { mobile: spacing.md, tablet: spacing.lg, desktop: spacing.xl }
  );

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth: Math.min(responsiveMaxWidth, screenWidth),
    alignSelf: 'center',
    paddingHorizontal: responsivePadding,
    ...style,
  };

  return <View style={containerStyle}>{children}</View>;
}

interface FlexProps {
  children: ReactNode;
  direction?: 'row' | 'column' | { mobile: 'row' | 'column'; tablet?: 'row' | 'column'; desktop?: 'row' | 'column' };
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  wrap?: boolean;
  gap?: number;
  style?: ViewStyle;
}

export function Flex({ 
  children, 
  direction = 'column',
  justify = 'flex-start',
  align = 'stretch',
  wrap = false,
  gap = 0,
  style 
}: FlexProps) {
  const responsiveDirection = useResponsiveValue(
    typeof direction === 'string'
      ? { mobile: direction }
      : { mobile: direction.mobile, tablet: direction.tablet, desktop: direction.desktop }
  );

  const flexStyle: ViewStyle = {
    flexDirection: responsiveDirection,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap: gap,
    ...style,
  };

  return <View style={flexStyle}>{children}</View>;
}