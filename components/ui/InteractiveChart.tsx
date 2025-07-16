import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
} from 'react-native';
import { format, subDays, startOfDay } from 'date-fns';
import { createChartDataA11yProps } from '@/utils/accessibility';

interface ChartDataPoint {
  day: string;
  amount: number;
  date: Date;
  transactions: number;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  onBarPress?: (dataPoint: ChartDataPoint) => void;
}

export default function InteractiveChart({ data, onBarPress }: InteractiveChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [animatedValues] = useState(() => 
    data.length > 0 ? data.map(() => new Animated.Value(0)) : []
  );

  React.useEffect(() => {
    if (animatedValues.length === 0) return;
    
    // Animate bars on mount
    const animations = animatedValues.map((animValue, index) =>
      Animated.timing(animValue, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: false,
      })
    );

    Animated.stagger(100, animations).start();
  }, [animatedValues]);

  const maxAmount = Math.max(...data.map(d => d.amount));
  const maxHeight = 120;

  const handleBarPress = (dataPoint: ChartDataPoint, index: number) => {
    setSelectedIndex(index);
    onBarPress?.(dataPoint);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      {/* Chart */}
      <View style={styles.chart}>
        {data.map((dataPoint, index) => {
          const height = (dataPoint.amount / maxAmount) * maxHeight;
          const isSelected = selectedIndex === index;
          const isToday = format(dataPoint.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          const a11yProps = createChartDataA11yProps(dataPoint.day, dataPoint.amount, dataPoint.transactions);
          
          return (
            <Pressable
              key={index}
              style={styles.barContainer}
              onPress={() => handleBarPress(dataPoint, index)}
              {...a11yProps}
            >
              <View style={styles.barWrapper}>
                {/* Amount label on hover/selection */}
                {isSelected && (
                  <View style={styles.tooltip}>
                    <Text style={styles.tooltipAmount}>
                      {formatCurrency(dataPoint.amount)}
                    </Text>
                    <Text style={styles.tooltipTransactions}>
                      {dataPoint.transactions} transactions
                    </Text>
                  </View>
                )}
                
                {/* Animated Bar */}
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: animatedValues[index] ? animatedValues[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, height],
                      }) : height,
                      backgroundColor: isSelected 
                        ? '#007AFF' 
                        : isToday 
                        ? '#48484A' 
                        : '#2C2C2E',
                      transform: [{
                        scaleY: isSelected ? 1.05 : 1,
                      }],
                    },
                  ]}
                />
              </View>
              
              {/* Day label */}
              <Text style={[
                styles.dayLabel,
                { color: isSelected || isToday ? '#007AFF' : '#8E8E93' }
              ]}>
                {dataPoint.day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Legend/Info */}
      <View style={styles.legend}>
        {selectedIndex !== null ? (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedAmount}>
              {formatCurrency(data[selectedIndex].amount)}
            </Text>
            <Text style={styles.selectedDate}>
              {format(data[selectedIndex].date, 'EEEE, MMM dd')} • {data[selectedIndex].transactions} transactions
            </Text>
          </View>
        ) : (
          <View style={styles.defaultInfo}>
            <Text style={styles.defaultAmount}>
              {formatCurrency(maxAmount)}
            </Text>
            <Text style={styles.defaultText}>Peak spending this week</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    marginBottom: 16,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  barWrapper: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    zIndex: 10,
  },
  tooltipAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  tooltipTransactions: {
    fontSize: 10,
    color: '#8E8E93',
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  legend: {
    alignItems: 'center',
  },
  selectedInfo: {
    alignItems: 'center',
  },
  selectedAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  selectedDate: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  defaultInfo: {
    alignItems: 'center',
  },
  defaultAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  defaultText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});