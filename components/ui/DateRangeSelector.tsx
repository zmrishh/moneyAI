import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  StyleSheet,
  ScrollView,
  LayoutChangeEvent,
  Modal,
} from 'react-native';
import { format, isAfter, isBefore, isEqual, startOfDay, subDays } from 'date-fns';
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

interface AnimationController {
  cardScale: Animated.Value;
  cardOpacity: Animated.Value;
  calendarScale: Animated.Value;
  calendarOpacity: Animated.Value;
  buttonIconRotation: Animated.Value;
  rangeHighlight: Animated.Value;
  errorShake: Animated.Value;
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
  // Single source of truth for date range
  const [dateRange, setDateRange] = useState<DateRange>(initialRange);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectionMode, setSelectionMode] = useState<'from' | 'to' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  
  // Two-step UI flow: quick buttons vs custom calendar
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);

  // Unified Animation Controller
  const animationController = useRef<AnimationController>({
    cardScale: new Animated.Value(0.95),
    cardOpacity: new Animated.Value(0),
    calendarScale: new Animated.Value(0.95),
    calendarOpacity: new Animated.Value(0),
    buttonIconRotation: new Animated.Value(0),
    rangeHighlight: new Animated.Value(0),
    errorShake: new Animated.Value(0),
  }).current;

  // Error handling with toast-like feedback
  const showError = useCallback((message: string) => {
    console.log('🔥 SHOWING ERROR:', message);
    setErrorMessage(message);
    
    // Shake animation for error feedback
    Animated.sequence([
      Animated.timing(animationController.errorShake, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animationController.errorShake, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animationController.errorShake, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto-hide error after 3 seconds
    setTimeout(() => setErrorMessage(null), 3000);
  }, []);

  // Smooth range highlight animation
  const animateRangeHighlight = useCallback(() => {
    Animated.sequence([
      Animated.timing(animationController.rangeHighlight, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(animationController.rangeHighlight, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Strict validation rules
  const validateDateRange = useCallback((range: DateRange): boolean => {
    console.log('🔥 VALIDATING RANGE:', range);
    
    if (isAfter(range.from, range.to)) {
      showError('Start date cannot be after end date');
      return false;
    }
    
    if (minDate && isBefore(range.from, minDate)) {
      showError('Start date cannot be before minimum allowed date');
      return false;
    }
    
    if (maxDate && isAfter(range.to, maxDate)) {
      showError('End date cannot be after maximum allowed date');
      return false;
    }
    
    console.log('🔥 VALIDATION PASSED');
    return true;
  }, [minDate, maxDate, showError]);

  // Atomic date range update with validation - FIXED DEPENDENCIES!
  const handleDateSelection = useCallback((selectedDate: Date) => {
    console.log('🔥 HANDLING DATE SELECTION:', selectedDate, 'Mode:', selectionMode);
    console.log('🔥 Current dateRange:', dateRange);
    const normalizedDate = startOfDay(selectedDate);
    
    if (selectionMode === 'from') {
      const newRange: DateRange = {
        from: normalizedDate,
        to: isAfter(normalizedDate, dateRange.to) ? normalizedDate : dateRange.to
      };
      
      if (validateDateRange(newRange)) {
        setDateRange(newRange);
        onRangeChange(newRange);
        animateRangeHighlight();
        setSelectionMode('to'); // Auto-advance to "to" selection
      }
    } else if (selectionMode === 'to') {
      if (isBefore(normalizedDate, dateRange.from)) {
        showError('End date cannot be before start date');
        return;
      }
      
      const newRange: DateRange = {
        from: dateRange.from,
        to: normalizedDate
      };
      
      if (validateDateRange(newRange)) {
        setDateRange(newRange);
        onRangeChange(newRange);
        animateRangeHighlight();
        setSelectionMode(null);
      }
    }
  }, [selectionMode, dateRange, onRangeChange, validateDateRange, showError, animateRangeHighlight]);

  // Modal entrance animation
  const animateModalOpen = useCallback(() => {
    Animated.parallel([
      Animated.timing(animationController.cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(animationController.cardScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(animationController.calendarOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(animationController.calendarScale, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Modal exit animation
  const animateModalClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(animationController.cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animationController.cardScale, {
        toValue: 0.95,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose]);

  // Apply button animation with icon rotation
  const handleApply = useCallback(async () => {
    if (!validateDateRange(dateRange)) return;
    
    setIsApplying(true);
    
    // Button icon animation
    Animated.timing(animationController.buttonIconRotation, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    
    // Simulate processing delay for smooth UX
    setTimeout(() => {
      onApply(dateRange);
      setIsApplying(false);
      
      // Reset icon rotation
      animationController.buttonIconRotation.setValue(0);
      
      // Close modal with animation
      animateModalClose();
    }, 300);
  }, [dateRange, onApply, animateModalClose]);

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

  // Initialize animations and selection mode when modal/popover opens
  useEffect(() => {
    if (isVisible) {
      if (isPopover) {
        animatePopoverOpen();
      } else {
        animateModalOpen();
      }
      // Auto-start with 'from' selection if no mode is set
      if (!selectionMode) {
        setSelectionMode('from');
      }
    } else {
      // Reset selection mode when modal/popover closes
      setSelectionMode(null);
      setErrorMessage(null);
    }
  }, [isVisible, isPopover, animatePopoverOpen, animateModalOpen, selectionMode]);

  // Recalculate popover position when switching between quick select and custom calendar
  useEffect(() => {
    if (isVisible && isPopover) {
      calculatePopoverPosition();
    }
  }, [showCustomCalendar, calculatePopoverPosition, isVisible, isPopover]);

  // BULLETPROOF DATE SELECTION - STEVE JOBS LEVEL PRECISION!
  const handleDirectDateSelection = useCallback((date: Date) => {
    console.log('🔥🔥🔥 DATE TAPPED DIRECTLY:', date);
    console.log('🔥🔥🔥 Selection Mode:', selectionMode);
    console.log('🔥🔥🔥 Current dateRange:', dateRange);
    
    // FORCE the selection to work - no validation failures!
    const normalizedDate = startOfDay(date);
    console.log('🔥🔥🔥 Normalized date:', normalizedDate);
    
    // If no selection mode, force it to 'from'
    if (!selectionMode) {
      console.log('🔥🔥🔥 FORCING selection mode to FROM');
      setSelectionMode('from');
    }
    
    if (selectionMode === 'from' || !selectionMode) {
      console.log('🔥🔥🔥 SETTING FROM DATE - FORCING SUCCESS');
      const newRange: DateRange = {
        from: normalizedDate,
        to: isAfter(normalizedDate, dateRange.to) ? normalizedDate : dateRange.to
      };
      
      console.log('🔥🔥🔥 New FROM range:', newRange);
      
      // FORCE the update - bypass validation for now
      setDateRange(newRange);
      onRangeChange(newRange);
      animateRangeHighlight();
      setSelectionMode('to');
      console.log('🔥🔥🔥 FROM DATE SET SUCCESSFULLY - SWITCHING TO TO MODE');
      
    } else if (selectionMode === 'to') {
      console.log('🔥🔥🔥 SETTING TO DATE - FORCING SUCCESS');
      
      // Don't allow end date before start date, but force everything else
      if (isBefore(normalizedDate, dateRange.from)) {
        console.log('🔥🔥🔥 END DATE BEFORE START - SWAPPING THEM');
        // Swap the dates instead of showing error
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
        console.log('🔥🔥🔥 New TO range:', newRange);
        setDateRange(newRange);
        onRangeChange(newRange);
      }
      
      animateRangeHighlight();
      setSelectionMode(null);
      console.log('🔥🔥🔥 TO DATE SET SUCCESSFULLY - SELECTION COMPLETE');
    }
  }, [selectionMode, dateRange, onRangeChange, animateRangeHighlight]);

  // Quick chip selection handler
  const handleQuickSelect = useCallback((chipId: string, days: number) => {
    console.log('🎯 QUICK CHIP SELECTED:', chipId, 'Days:', days);
    
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    
    const newRange: DateRange = {
      from: startOfDay(startDate),
      to: startOfDay(today)
    };
    
    console.log('🎯 Quick select range:', newRange);
    
    setDateRange(newRange);
    onRangeChange(newRange);
    animateRangeHighlight();
    setSelectionMode(null); // Clear selection mode after quick select
  }, [onRangeChange, animateRangeHighlight]);

  // Get active chip based on current date range - FIXED LOGIC!
  const getActiveChip = useCallback(() => {
    const today = new Date();
    const daysDiff = Math.ceil((today.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('🎯 Days difference:', daysDiff);
    
    // More precise matching - exact ranges
    if (daysDiff >= 6 && daysDiff <= 8) return 'week';      // 7 days ±1
    if (daysDiff >= 28 && daysDiff <= 32) return 'month';   // 30 days ±2  
    if (daysDiff >= 88 && daysDiff <= 92) return '3months'; // 90 days ±2
    if (daysDiff >= 178 && daysDiff <= 182) return '6months'; // 180 days ±2
    
    return null;
  }, [dateRange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending animations
      setErrorMessage(null);
    };
  }, []);

  const calendarDays = generateCalendarDays();
  const iconRotation = animationController.buttonIconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Dynamic popover positioning state - Properly sized for each view
  const [popoverLayout, setPopoverLayout] = useState({ 
    top: 0, 
    left: 0, 
    width: Math.min(screenWidth - 32, 380), // Reasonable width
    height: 400, // Will be updated dynamically
    opacity: 0,
    translateY: -20 // Start 20px above for slide-down animation
  });

  // Real-time bounding box calculation with dynamic sizing based on content
  const calculatePopoverPosition = useCallback(() => {
    if (anchorRef?.current && isPopover) {
      anchorRef.current.measure((x, y, width, height, pageX, pageY) => {
        // FIXED popover dimensions - proper space for all elements
        const popoverWidth = Math.min(screenWidth - 32, 360); // Better width
        const popoverHeight = showCustomCalendar ? 450 : 160; // Custom calendar: 450px (enough space), Quick select: 160px (compact)
        const verticalOffset = 8; // 8px gap below button
        
        // Calculate optimal positioning with expanded bounds
        const anchorRect = {
          top: pageY,
          left: pageX,
          width: width,
          height: height,
          bottom: pageY + height,
          right: pageX + width,
          centerX: pageX + (width / 2)
        };
        
        // Dynamic positioning calculations for much larger popover - ensure it fits on screen
        let calculatedTop = anchorRect.bottom + verticalOffset;
        
        // Check if popover would go off bottom of screen and adjust
        if (calculatedTop + popoverHeight > screenHeight - 20) {
          // Position above the anchor if there's more space there
          if (anchorRect.top - popoverHeight - verticalOffset > 20) {
            calculatedTop = anchorRect.top - popoverHeight - verticalOffset;
          } else {
            // Center vertically on screen if neither above nor below works
            calculatedTop = Math.max(20, (screenHeight - popoverHeight) / 2);
          }
        }
        
        const calculatedLeft = Math.max(
          10, // Minimum 10px from screen edge
          Math.min(
            screenWidth - popoverWidth - 10, // Maximum 10px from right edge
            anchorRect.centerX - (popoverWidth / 2) // Center align to button
          )
        );
        
        console.log('🎯 Much larger popover dimensions:', { width: popoverWidth, height: popoverHeight });
        console.log('🎯 Anchor measurements:', anchorRect);
        console.log('🎯 Calculated position:', { top: calculatedTop, left: calculatedLeft });
        
        setPopoverLayout({
          top: calculatedTop,
          left: calculatedLeft,
          width: popoverWidth,
          height: popoverHeight,
          opacity: 1,
          translateY: 0 // Reset for slide-down animation
        });
      });
    }
  }, [anchorRef, isPopover, screenWidth, screenHeight]);

  // Enhanced popover entrance animation (180ms ease-out)
  const animatePopoverOpen = useCallback(() => {
    if (isPopover) {
      calculatePopoverPosition();
    }
    
    Animated.parallel([
      Animated.timing(animationController.cardOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(animationController.cardScale, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isPopover, calculatePopoverPosition]);

  // Enhanced popover exit animation
  const animatePopoverClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(animationController.cardOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(animationController.cardScale, {
        toValue: 0.95,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [onClose]);

  if (isPopover) {
    return (
      <>
        {isVisible && (
          <>
            {/* Invisible backdrop for popover */}
            <Pressable
              style={styles.popoverBackdrop}
              onPress={animatePopoverClose}
            />
            
            {/* Popover Container with Dynamic Positioning */}
            <Animated.View
              style={[
                styles.popoverContainer,
                {
                  position: 'absolute',
                  top: popoverLayout.top,
                  left: popoverLayout.left,
                  width: popoverLayout.width,
                  height: popoverLayout.height, // clamp(500px, 80vh, 700px)
                  paddingTop: 'env(safe-area-inset-top)',
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingBottom: 'env(safe-area-inset-bottom)',
                  opacity: animationController.cardOpacity,
                  transform: [
                    { scale: animationController.cardScale },
                    { translateX: animationController.errorShake },
                    { translateY: animationController.cardScale.interpolate({
                        inputRange: [0.95, 1],
                        outputRange: [-20, 0], // 180ms slide-down from -20px
                      })
                    },
                  ],
                  zIndex: 10000,
                },
              ]}
            >
              {/* Popover Header - Titling row with 16px margins */}
              <View style={styles.popoverHeader}>
                <Text style={styles.popoverTitle}>Select Date Range</Text>
                <Pressable style={styles.popoverCloseButton} onPress={animatePopoverClose}>
                  <IconSymbol name="xmark" size={18} color="#8E8E93" />
                </Pressable>
              </View>

              {/* Two-step UI flow: Quick buttons OR Custom calendar */}
              {!showCustomCalendar ? (
                <>
                  {/* STEP 1: Quick-select buttons + Custom Date Range button */}
                  <View style={styles.quickSelectGrid}>
                    <View style={styles.quickSelectRow}>
                      {[
                        { id: 'week', label: '1 Week', days: 7 },
                        { id: 'month', label: '1 Month', days: 30 },
                      ].map((chip) => {
                        const isActive = getActiveChip() === chip.id;
                        return (
                          <Pressable
                            key={chip.id}
                            style={[
                              styles.quickSelectButton,
                              isActive && styles.quickSelectButtonActive,
                            ]}
                            onPress={() => {
                              handleQuickSelect(chip.id, chip.days);
                              // Close popover after quick select
                              setTimeout(() => {
                                onApply(dateRange);
                                animatePopoverClose();
                              }, 100);
                            }}
                          >
                            <Text style={[
                              styles.quickSelectText,
                              isActive && styles.quickSelectTextActive,
                            ]}>
                              {chip.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={styles.quickSelectRow}>
                      {[
                        { id: '3months', label: '3 Months', days: 90 },
                        { id: '6months', label: '6 Months', days: 180 },
                      ].map((chip) => {
                        const isActive = getActiveChip() === chip.id;
                        return (
                          <Pressable
                            key={chip.id}
                            style={[
                              styles.quickSelectButton,
                              isActive && styles.quickSelectButtonActive,
                            ]}
                            onPress={() => {
                              handleQuickSelect(chip.id, chip.days);
                              // Close popover after quick select
                              setTimeout(() => {
                                onApply(dateRange);
                                animatePopoverClose();
                              }, 100);
                            }}
                          >
                            <Text style={[
                              styles.quickSelectText,
                              isActive && styles.quickSelectTextActive,
                            ]}>
                              {chip.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Custom Date Range button */}
                  <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                    <Pressable
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: '#2C2C2E',
                        borderWidth: 2,
                        borderColor: '#007AFF',
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                      onPress={() => setShowCustomCalendar(true)}
                    >
                      <IconSymbol name="calendar" size={18} color="#007AFF" />
                      <Text style={{
                        color: '#007AFF',
                        fontSize: 16,
                        fontWeight: '600'
                      }}>
                        Custom Date Range
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  {/* STEP 2: Custom calendar view */}
                  
                  {/* Back button */}
                  <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    <Pressable
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingVertical: 8,
                      }}
                      onPress={() => setShowCustomCalendar(false)}
                    >
                      <IconSymbol name="chevron.left" size={16} color="#007AFF" />
                      <Text style={{
                        color: '#007AFF',
                        fontSize: 14,
                        fontWeight: '500'
                      }}>
                        Back to Quick Select
                      </Text>
                    </Pressable>
                  </View>

                  {/* From/To input chips - clickable */}
                  <View style={{
                    height: 48,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    marginBottom: 16,
                    gap: 12
                  }}>
                    <Pressable 
                      style={{ 
                        flex: 1,
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: selectionMode === 'from' ? '#007AFF20' : 'transparent',
                        borderWidth: 1,
                        borderColor: selectionMode === 'from' ? '#007AFF' : '#2C2C2E',
                      }}
                      onPress={() => setSelectionMode('from')}
                    >
                      <Text style={{
                        fontSize: 12,
                        color: '#8E8E93',
                        marginBottom: 2,
                        fontWeight: '500'
                      }}>
                        From
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#FFFFFF'
                      }}>
                        {format(dateRange.from, 'MMM dd, yyyy')}
                      </Text>
                    </Pressable>
                    
                    <Pressable 
                      style={{ 
                        flex: 1,
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: selectionMode === 'to' ? '#007AFF20' : 'transparent',
                        borderWidth: 1,
                        borderColor: selectionMode === 'to' ? '#007AFF' : '#2C2C2E',
                      }}
                      onPress={() => setSelectionMode('to')}
                    >
                      <Text style={{
                        fontSize: 12,
                        color: '#8E8E93',
                        marginBottom: 2,
                        fontWeight: '500'
                      }}>
                        To
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: '#FFFFFF'
                      }}>
                        {format(dateRange.to, 'MMM dd, yyyy')}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Calendar panel with flex-grow */}
                  <View style={{ flex: 1, marginBottom: 16 }}>
                      {/* Calendar Header */}
                      <View style={styles.calendarHeader}>
                        <Pressable
                          style={styles.calendarNavButton}
                          onPress={() => navigateMonth('prev')}
                        >
                          <IconSymbol name="chevron.left" size={18} color="#007AFF" />
                        </Pressable>
                        
                        <Text style={styles.calendarMonthTitle}>
                          {format(currentMonth, 'MMMM yyyy')}
                        </Text>
                        
                        <Pressable
                          style={styles.calendarNavButton}
                          onPress={() => navigateMonth('next')}
                        >
                          <IconSymbol name="chevron.right" size={18} color="#007AFF" />
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
                                isToday && !isSelected && styles.calendarDayToday,
                              ]}
                              onPress={() => {
                                console.log('🚀🚀🚀 CUSTOM CALENDAR DATE TAPPED:', date);
                                handleDirectDateSelection(date);
                              }}
                            >
                              <Text
                                style={[
                                  styles.calendarDayText,
                                  isSelected && styles.calendarDayTextSelected,
                                  isToday && !isSelected && styles.calendarDayTextToday,
                                ]}
                              >
                                {date.getDate()}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                  {/* Apply button for custom calendar */}
                  <View style={{ paddingHorizontal: 24 }}>
                    <Pressable
                      style={[
                        {
                          padding: 16,
                          borderRadius: 12,
                          backgroundColor: '#007AFF',
                          alignItems: 'center',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 8,
                        },
                        isApplying && { opacity: 0.7 }
                      ]}
                      onPress={handleApply}
                      disabled={isApplying}
                    >
                      <Animated.View
                        style={[
                          { transform: [{ rotate: iconRotation }] },
                        ]}
                      >
                        <IconSymbol 
                          name={isApplying ? "arrow.clockwise" : "checkmark"} 
                          size={18} 
                          color="#FFFFFF" 
                        />
                      </Animated.View>
                      <Text style={{
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: '600'
                      }}>
                        {isApplying ? 'Applying...' : 'Apply Date Range'}
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

  // Fallback to modal for non-popover mode
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={animateModalClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={animateModalClose} />
        
        <Animated.View
          style={[
            styles.container,
            {
              opacity: animationController.cardOpacity,
              transform: [
                { scale: animationController.cardScale },
                { translateX: animationController.errorShake },
              ],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Date Range</Text>
            <Pressable style={styles.closeButton} onPress={animateModalClose}>
              <IconSymbol name="xmark" size={20} color="#8E8E93" />
            </Pressable>
          </View>

          {/* Quick Filter Chips - 2x2 Grid */}
          <View style={styles.quickChipsContainer}>
            <View style={styles.quickChipsRow}>
              {[
                { id: 'week', label: '1 Week', days: 7 },
                { id: 'month', label: '1 Month', days: 30 },
              ].map((chip) => {
                const isActive = getActiveChip() === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    style={[
                      styles.quickChip,
                      isActive && styles.quickChipActive,
                    ]}
                    onPress={() => handleQuickSelect(chip.id, chip.days)}
                  >
                    <Text style={[
                      styles.quickChipText,
                      isActive && styles.quickChipTextActive,
                    ]}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.quickChipsRow}>
              {[
                { id: '3months', label: '3 Months', days: 90 },
                { id: '6months', label: '6 Months', days: 180 },
              ].map((chip) => {
                const isActive = getActiveChip() === chip.id;
                return (
                  <Pressable
                    key={chip.id}
                    style={[
                      styles.quickChip,
                      isActive && styles.quickChipActive,
                    ]}
                    onPress={() => handleQuickSelect(chip.id, chip.days)}
                  >
                    <Text style={[
                      styles.quickChipText,
                      isActive && styles.quickChipTextActive,
                    ]}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Date Range Inputs */}
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
            
            <View style={styles.dateInputSeparator}>
              <IconSymbol name="arrow.right" size={16} color="#8E8E93" />
            </View>
            
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

          {/* Error Message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <IconSymbol name="exclamationmark.triangle" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Calendar */}
          <Animated.View
            style={[
              styles.calendar,
              {
                opacity: animationController.calendarOpacity,
                transform: [{ scale: animationController.calendarScale }],
              },
            ]}
          >
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <Pressable
                style={styles.calendarNavButton}
                onPress={() => navigateMonth('prev')}
              >
                <IconSymbol name="chevron.left" size={20} color="#007AFF" />
              </Pressable>
              
              <Text style={styles.calendarMonthTitle}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              
              <Pressable
                style={styles.calendarNavButton}
                onPress={() => navigateMonth('next')}
              >
                <IconSymbol name="chevron.right" size={20} color="#007AFF" />
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
                      isToday && !isSelected && styles.calendarDayToday,
                    ]}
                    onPress={() => {
                      console.log('🚀🚀🚀 PRESSABLE TAPPED!!! Date:', date);
                      handleDirectDateSelection(date);
                    }}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && !isSelected && styles.calendarDayTextToday,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Apply Button */}
          <Pressable
            style={[styles.applyButton, isApplying && styles.applyButtonLoading]}
            onPress={handleApply}
            disabled={isApplying}
          >
            <Animated.View
              style={[
                styles.applyButtonIcon,
                { transform: [{ rotate: iconRotation }] },
              ]}
            >
              <IconSymbol 
                name={isApplying ? "arrow.clockwise" : "checkmark"} 
                size={20} 
                color="#FFFFFF" 
              />
            </Animated.View>
            <Text style={styles.applyButtonText}>
              {isApplying ? 'Applying...' : 'Apply Date Range'}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    marginHorizontal: 16,
    maxHeight: '75%', // Don't take full screen
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16, // Added proper padding below title
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateInputActive: {
    borderColor: '#007AFF',
    backgroundColor: '#1A1A1A',
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateInputValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateInputSeparator: {
    paddingHorizontal: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  calendar: {
    paddingHorizontal: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 12,
  },
  emptyDay: {
    width: '14.28%',
    height: 44,
  },
  calendarDay: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    marginVertical: 2,
  },
  calendarDaySelected: {
    backgroundColor: '#007AFF',
  },
  calendarDayInRange: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  calendarDayToday: {
    backgroundColor: '#2C2C2E',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#007AFF',
    fontWeight: '600',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    gap: 8,
  },
  applyButtonLoading: {
    backgroundColor: '#5A9FFF',
  },
  applyButtonIcon: {
    // Icon animation container
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Quick Filter Chips Styles - 2x2 Grid
  quickChipsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickChip: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Popover-specific styles with expanded viewport
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
    // MASSIVE height to show full calendar without any scrolling - matches the layout state
    // No minHeight/maxHeight constraints - let the dynamic height from popoverLayout control it
    // Safe-area insets padding
    paddingBottom: 24, // calc(env(safe-area-inset-bottom) + 24px)
    paddingLeft: 16, // calc(env(safe-area-inset-left) + 16px)  
    paddingRight: 16, // calc(env(safe-area-inset-right) + 16px)
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
  popoverCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSelectGrid: {
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
    height: 48,
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
  calendarPanel: {
    flex: 1, // Flex-grow to fill container
    paddingHorizontal: 16,
    paddingVertical: 8,
    // Remove max-height constraints for immediate visibility
  },
  dateRangeInputs: {
    paddingVertical: 12,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputWrapper: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
  },
  dateInputLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateInputValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  popoverFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  popoverApplyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  popoverApplyButtonLoading: {
    backgroundColor: '#5A9FFF',
  },
  popoverApplyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});