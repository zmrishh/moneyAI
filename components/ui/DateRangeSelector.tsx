import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  Modal,
} from 'react-native';
import { format, isAfter, isBefore, isEqual, startOfDay } from 'date-fns';
import { IconSymbol } from './IconSymbol';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangeProps {
  initialRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  onApply: (range: DateRange) => void;
  isVisible: boolean;
  onClose: () => void;
  minDate?: Date;
  maxDate?: Date;
  isPopover?: boolean;
  anchorRef?: React.RefObject<View>;
}

export const DateRangeSelector: React.FC<DateRangeProps> = ({
  initialRange,
  onRangeChange,
  onApply,
  isVisible,
  onClose,
  minDate,
  maxDate = new Date(),
  isPopover = false,
  anchorRef,
}) => {
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState<'from' | 'to' | null>(null);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Popover positioning
  const [popoverLayout, setPopoverLayout] = useState({
    top: 0,
    left: 0,
    width: Math.min(screenWidth - 32, 360),
    height: showCustomCalendar ? 560 : 240,
  });

  // Calculate popover position
  const calculatePopoverPosition = useCallback(() => {
    if (anchorRef?.current && isPopover) {
      anchorRef.current.measure((x, y, width, height, pageX, pageY) => {
        const popoverWidth = Math.min(screenWidth - 32, 360);
        const popoverHeight = showCustomCalendar ? 560 : 240;
        const verticalOffset = 8;

        let calculatedTop = pageY + height + verticalOffset;
        
        // Check if popover would go off bottom of screen
        if (calculatedTop + popoverHeight > screenHeight - 20) {
          calculatedTop = pageY - popoverHeight - verticalOffset;
        }

        const calculatedLeft = Math.max(
          16,
          Math.min(
            screenWidth - popoverWidth - 16,
            pageX + (width / 2) - (popoverWidth / 2)
          )
        );

        setPopoverLayout({
          top: calculatedTop,
          left: calculatedLeft,
          width: popoverWidth,
          height: popoverHeight,
        });
      });
    }
  }, [anchorRef, isPopover, screenWidth, screenHeight, showCustomCalendar]);

  // Animate popover open
  const animateOpen = useCallback(() => {
    if (isPopover) {
      calculatePopoverPosition();
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isPopover, calculatePopoverPosition, fadeAnim, scaleAnim]);

  // Animate popover close
  const animateClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [fadeAnim, scaleAnim, onClose]);

  // Quick select handler
  const handleQuickSelect = useCallback((days: number) => {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    
    const newRange: DateRange = {
      from: startOfDay(startDate),
      to: startOfDay(today)
    };
    
    setDateRange(newRange);
    onRangeChange(newRange);
    
    // Auto-apply and close for quick selections
    setTimeout(() => {
      onApply(newRange);
      animateClose();
    }, 100);
  }, [onRangeChange, onApply, animateClose]);

  // Get active quick select button
  const getActiveQuickSelect = useCallback(() => {
    const today = new Date();
    const daysDiff = Math.ceil((today.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 6 && daysDiff <= 8) return 'week';
    if (daysDiff >= 28 && daysDiff <= 32) return 'month';
    if (daysDiff >= 88 && daysDiff <= 92) return '3months';
    if (daysDiff >= 178 && daysDiff <= 182) return '6months';
    
    return null;
  }, [dateRange]);

  // Calendar generation
  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Empty cells for days before month start
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentMonth]);

  // Handle date selection
  const handleDateSelection = useCallback((date: Date) => {
    const normalizedDate = startOfDay(date);
    
    if (selectionMode === 'from' || !selectionMode) {
      const newRange: DateRange = {
        from: normalizedDate,
        to: isAfter(normalizedDate, dateRange.to) ? normalizedDate : dateRange.to
      };
      setDateRange(newRange);
      onRangeChange(newRange);
      setSelectionMode('to');
    } else if (selectionMode === 'to') {
      if (isBefore(normalizedDate, dateRange.from)) {
        // Swap dates if end is before start
        const newRange: DateRange = {
          from: normalizedDate,
          to: dateRange.from
        };
        setDateRange(newRange);
        onRangeChange(newRange);
      } else {
        const newRange: DateRange = {
          from: dateRange.from,
          to: normalizedDate
        };
        setDateRange(newRange);
        onRangeChange(newRange);
      }
      setSelectionMode(null);
    }
  }, [selectionMode, dateRange, onRangeChange]);

  // Month navigation
  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);

  // Handle apply
  const handleApply = useCallback(() => {
    setIsApplying(true);
    setTimeout(() => {
      onApply(dateRange);
      setIsApplying(false);
      animateClose();
    }, 200);
  }, [dateRange, onApply, animateClose]);

  // Initialize animations
  useEffect(() => {
    if (isVisible) {
      animateOpen();
      if (!selectionMode) {
        setSelectionMode('from');
      }
    } else {
      setSelectionMode(null);
      setShowCustomCalendar(false);
    }
  }, [isVisible, animateOpen, selectionMode]);

  // Recalculate position when switching views
  useEffect(() => {
    if (isVisible && isPopover) {
      calculatePopoverPosition();
    }
  }, [showCustomCalendar, calculatePopoverPosition, isVisible, isPopover]);

  const calendarDays = generateCalendarDays();

  if (isPopover) {
    return (
      <>
        {isVisible && (
          <>
            {/* Backdrop */}
            <Pressable
              style={styles.popoverBackdrop}
              onPress={animateClose}
            />
            
            {/* Popover Container */}
            <Animated.View
              style={[
                styles.popoverContainer,
                {
                  position: 'absolute',
                  top: popoverLayout.top,
                  left: popoverLayout.left,
                  width: popoverLayout.width,
                  height: popoverLayout.height,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                  zIndex: 10000,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.popoverHeader}>
                <Text style={styles.popoverTitle}>Select Date Range</Text>
                <Pressable style={styles.closeButton} onPress={animateClose}>
                  <IconSymbol name="xmark" size={16} color="#8E8E93" />
                </Pressable>
              </View>

              {!showCustomCalendar ? (
                <>
                  {/* Quick Select Buttons */}
                  <View style={styles.quickSelectContainer}>
                    <View style={styles.quickSelectRow}>
                      {[
                        { id: 'week', label: '1 Week', days: 7 },
                        { id: 'month', label: '1 Month', days: 30 },
                      ].map((option) => {
                        const isActive = getActiveQuickSelect() === option.id;
                        return (
                          <Pressable
                            key={option.id}
                            style={[
                              styles.quickSelectButton,
                              isActive && styles.quickSelectButtonActive,
                            ]}
                            onPress={() => handleQuickSelect(option.days)}
                          >
                            <Text style={[
                              styles.quickSelectText,
                              isActive && styles.quickSelectTextActive,
                            ]}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.quickSelectRow}>
                      {[
                        { id: '3months', label: '3 Months', days: 90 },
                        { id: '6months', label: '6 Months', days: 180 },
                      ].map((option) => {
                        const isActive = getActiveQuickSelect() === option.id;
                        return (
                          <Pressable
                            key={option.id}
                            style={[
                              styles.quickSelectButton,
                              isActive && styles.quickSelectButtonActive,
                            ]}
                            onPress={() => handleQuickSelect(option.days)}
                          >
                            <Text style={[
                              styles.quickSelectText,
                              isActive && styles.quickSelectTextActive,
                            ]}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Custom Date Range Button */}
                  <View style={styles.customButtonContainer}>
                    <Pressable
                      style={styles.customButton}
                      onPress={() => setShowCustomCalendar(true)}
                    >
                      <IconSymbol name="calendar" size={16} color="#007AFF" />
                      <Text style={styles.customButtonText}>Custom Date Range</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  {/* Back Button */}
                  <View style={styles.backButtonContainer}>
                    <Pressable
                      style={styles.backButton}
                      onPress={() => setShowCustomCalendar(false)}
                    >
                      <IconSymbol name="chevron.left" size={14} color="#007AFF" />
                      <Text style={styles.backButtonText}>Back to Quick Select</Text>
                    </Pressable>
                  </View>

                  {/* Date Inputs */}
                  <View style={styles.dateInputsContainer}>
                    <Pressable 
                      style={[
                        styles.dateInput,
                        selectionMode === 'from' && styles.dateInputActive,
                      ]}
                      onPress={() => setSelectionMode('from')}
                    >
                      <Text style={styles.dateInputLabel}>From</Text>
                      <Text style={styles.dateInputValue}>
                        {format(dateRange.from, 'MMM dd, yyyy')}
                      </Text>
                    </Pressable>
                    
                    <Pressable 
                      style={[
                        styles.dateInput,
                        selectionMode === 'to' && styles.dateInputActive,
                      ]}
                      onPress={() => setSelectionMode('to')}
                    >
                      <Text style={styles.dateInputLabel}>To</Text>
                      <Text style={styles.dateInputValue}>
                        {format(dateRange.to, 'MMM dd, yyyy')}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Calendar */}
                  <View style={styles.calendarContainer}>
                    {/* Calendar Header */}
                    <View style={styles.calendarHeader}>
                      <Pressable
                        style={styles.calendarNavButton}
                        onPress={() => navigateMonth('prev')}
                      >
                        <IconSymbol name="chevron.left" size={16} color="#007AFF" />
                      </Pressable>
                      
                      <Text style={styles.calendarMonthTitle}>
                        {format(currentMonth, 'MMMM yyyy')}
                      </Text>
                      
                      <Pressable
                        style={styles.calendarNavButton}
                        onPress={() => navigateMonth('next')}
                      >
                        <IconSymbol name="chevron.right" size={16} color="#007AFF" />
                      </Pressable>
                    </View>

                    {/* Days of Week */}
                    <View style={styles.weekHeader}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <Text key={day} style={styles.weekDay}>{day}</Text>
                      ))}
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                      {calendarDays.map((date, index) => {
                        if (!date) {
                          return <View key={index} style={styles.emptyDay} />;
                        }

                        const isSelected = 
                          isEqual(startOfDay(date), startOfDay(dateRange.from)) ||
                          isEqual(startOfDay(date), startOfDay(dateRange.to));
                        
                        const isInRange = 
                          isAfter(date, dateRange.from) && isBefore(date, dateRange.to);
                        
                        const isToday = isEqual(startOfDay(date), startOfDay(new Date()));

                        return (
                          <Pressable
                            key={index}
                            style={[
                              styles.calendarDay,
                              isSelected && styles.calendarDaySelected,
                              isInRange && styles.calendarDayInRange,
                              isToday && styles.calendarDayToday,
                            ]}
                            onPress={() => handleDateSelection(date)}
                          >
                            <Text style={[
                              styles.calendarDayText,
                              isSelected && styles.calendarDayTextSelected,
                              isInRange && styles.calendarDayTextInRange,
                              isToday && styles.calendarDayTextToday,
                            ]}>
                              {date.getDate()}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Apply Button */}
                  <View style={styles.applyButtonContainer}>
                    <Pressable
                      style={[
                        styles.applyButton,
                        isApplying && styles.applyButtonLoading,
                      ]}
                      onPress={handleApply}
                      disabled={isApplying}
                    >
                      <IconSymbol 
                        name={isApplying ? "arrow.clockwise" : "checkmark"} 
                        size={16} 
                        color="#FFFFFF" 
                      />
                      <Text style={styles.applyButtonText}>
                        Apply Date Range
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>
          </>
        )}
      </>
    );
  }

  // Modal version (fallback)
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.modalTitle}>Select Date Range</Text>
          <Pressable style={styles.modalCloseButton} onPress={onClose}>
            <Text style={styles.modalCloseText}>Close</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Popover styles
  popoverBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  popoverContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  popoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  popoverTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Quick select styles
  quickSelectContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickSelectButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickSelectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickSelectTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Custom button styles
  customButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  customButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  customButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Back button styles
  backButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // Date inputs styles
  dateInputsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  dateInput: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  dateInputActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF20',
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateInputValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Calendar styles
  calendarContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  calendarNavButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18, // Make it circular (half of height)
  },
  calendarDaySelected: {
    backgroundColor: '#007AFF',
    borderRadius: 18, // Keep circular when selected
  },
  calendarDayInRange: {
    backgroundColor: '#007AFF30',
    borderRadius: 18, // Keep circular for range
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 18, // Keep circular for today
  },
  calendarDayText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextInRange: {
    color: '#007AFF',
    fontWeight: '600',
  },
  calendarDayTextToday: {
    color: '#007AFF',
    fontWeight: '700',
  },
  emptyDay: {
    width: '14.28%',
    height: 36,
  },

  // Apply button styles
  applyButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  applyButtonLoading: {
    backgroundColor: '#5A9FFF',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Modal styles (fallback)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
  },
  modalCloseText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});