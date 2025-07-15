import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActionSheetIOS,
  Animated,
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { dbService } from '@/services/database';
import { nlpService } from '@/services/nlp';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Auto-scrolling Marquee Component with Dynamic Width
const MarqueeRow = ({ suggestions, direction, onSuggestionPress }: {
  suggestions: { icon: string; text: string }[];
  direction: 'left' | 'right';
  onSuggestionPress: (text: string) => void;
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [chipWidths, setChipWidths] = useState<number[]>([]);
  const [totalWidth, setTotalWidth] = useState(0);

  // Precise text width calculation based on actual measurements
  const calculateChipWidth = (text: string) => {
    // Character width mapping for better accuracy at 14px font size
    const getTextWidth = (str: string) => {
      let width = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        // More accurate character widths
        if (char === ' ') width += 4;
        else if ('il'.includes(char)) width += 3;
        else if ('ftj'.includes(char)) width += 4;
        else if ('r'.includes(char)) width += 4.5;
        else if ('aceghnopqsuvxyz'.includes(char)) width += 7;
        else if ('bdk'.includes(char)) width += 7;
        else if ('mw'.includes(char)) width += 10;
        else if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(char)) width += 8;
        else if ('MW'.includes(char)) width += 11;
        else if ('I'.includes(char)) width += 4;
        else if ("'".includes(char)) width += 3;
        else if ('?:'.includes(char)) width += 6;
        else width += 7; // default
      }
      return width;
    };

    const iconWidth = 16; // Icon size
    const iconMargin = 8; // Space after icon  
    const horizontalPadding = 24; // 12px on each side
    const textWidth = getTextWidth(text);

    return iconWidth + iconMargin + textWidth + horizontalPadding;
  };

  useEffect(() => {
    // Calculate widths for all chips
    const widths = suggestions.map(suggestion => calculateChipWidth(suggestion.text));
    setChipWidths(widths);

    // Calculate total width including gaps
    const total = widths.reduce((sum, width) => sum + width + 12, 0); // 12px gap between chips
    setTotalWidth(total);
  }, [suggestions]);

  useEffect(() => {
    if (totalWidth === 0) return;

    const startAnimation = () => {
      const duration = totalWidth * 30; // Adjust speed based on total width

      const animation = Animated.loop(
        Animated.timing(scrollX, {
          toValue: direction === 'right' ? totalWidth : -totalWidth,
          duration: duration,
          useNativeDriver: true,
        })
      );

      animation.start();
      return animation;
    };

    const animation = startAnimation();
    return () => animation.stop();
  }, [totalWidth, direction]);

  // Duplicate suggestions for seamless loop
  const duplicatedSuggestions = [...suggestions, ...suggestions, ...suggestions];
  const duplicatedWidths = [...chipWidths, ...chipWidths, ...chipWidths];

  return (
    <View style={styles.marqueeContainer}>
      <Animated.View
        style={[
          styles.marqueeContent,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        {duplicatedSuggestions.map((suggestion, index) => (
          <Pressable
            key={`${suggestion.text}-${index}`}
            style={[
              styles.suggestionChip,
              {
                width: duplicatedWidths[index] || calculateChipWidth(suggestion.text),
                minWidth: 'auto', // Remove fixed minWidth
              }
            ]}
            onPress={() => onSuggestionPress(suggestion.text)}
          >
            <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
            <Text style={styles.suggestionText} numberOfLines={1}>
              {suggestion.text}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
};

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const suggestions = [
    // Row 1
    [
      { icon: "💰", text: "What's my balance?" },
      { icon: "📊", text: "Show spending breakdown" },
      { icon: "💳", text: "Add coffee expense" },
      { icon: "📈", text: "Recent transactions" },
      { icon: "🎯", text: "Monthly budget status" },
      { icon: "💸", text: "Biggest expenses this week" },
    ],
    // Row 2
    [
      { icon: "🏦", text: "Account summary" },
      { icon: "📱", text: "Split bill calculation" },
      { icon: "💡", text: "Budget recommendations" },
      { icon: "🔍", text: "Find duplicate expenses" },
      { icon: "📅", text: "Weekly spending report" },
      { icon: "⚡", text: "Quick expense entry" },
    ]
  ];

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await processAIMessage(userMessage.text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble processing that request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const processAIMessage = async (message: string): Promise<string> => {
    await dbService.initialize();

    // Check if it's a transaction input
    if (message.toLowerCase().includes('add') || message.toLowerCase().includes('spent') || message.toLowerCase().includes('bought')) {
      const parsed = nlpService.parseTransaction(message);
      if (parsed.amount > 0) {
        await dbService.addTransaction({
          amount: parsed.amount,
          description: parsed.description,
          category: parsed.category,
          type: parsed.type,
          source: 'manual',
          date: new Date(),
        });
        return `✅ Got it! Added ${parsed.description} for ₹${parsed.amount.toLocaleString('en-IN')}`;
      }
    }

    // Check for balance inquiry
    if (message.toLowerCase().includes('balance') || message.toLowerCase().includes('total')) {
      const balance = await dbService.getTotalBalance();
      return `💰 Your balance: ₹${balance.balance.toLocaleString('en-IN')}\n\n💚 Money in: ₹${balance.income.toLocaleString('en-IN')}\n💸 Money out: ₹${balance.expenses.toLocaleString('en-IN')}`;
    }

    // Check for spending inquiry
    if (message.toLowerCase().includes('spend') || message.toLowerCase().includes('expense')) {
      const transactions = await dbService.getTransactions(10);
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return `📊 You spent ₹${totalExpenses.toLocaleString('en-IN')} recently\n\nBiggest expenses:\n${transactions
        .filter(t => t.type === 'expense')
        .slice(0, 3)
        .map(t => `• ${t.description}: ₹${t.amount.toLocaleString('en-IN')}`)
        .join('\n')}`;
    }

    // Check for recent transactions
    if (message.toLowerCase().includes('recent') || message.toLowerCase().includes('transaction')) {
      const transactions = await dbService.getTransactions(5);
      if (transactions.length === 0) {
        return `📝 No transactions yet!\n\nTry saying:\n• "Add coffee ₹150"\n• "Add salary ₹50,000"`;
      }

      return `📋 Recent activity:\n\n${transactions
        .map(t => `${t.type === 'income' ? '💰' : '💸'} ${t.description}: ${t.type === 'income' ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}`)
        .join('\n')}`;
    }

    // Check for category breakdown
    if (message.toLowerCase().includes('category') || message.toLowerCase().includes('breakdown')) {
      const transactions = await dbService.getTransactions(50);
      const categoryTotals: { [key: string]: number } = {};

      transactions.filter(t => t.type === 'expense').forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

      const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      if (sortedCategories.length === 0) {
        return `📊 No spending categories yet!\n\nStart tracking to see where your money goes.`;
      }

      return `📊 Where your money goes:\n\n${sortedCategories
        .map(([category, amount]) => `• ${category}: ₹${amount.toLocaleString('en-IN')}`)
        .join('\n')}`;
    }

    // Default AI response
    return `Hi! I'm your AI money assistant 👋\n\nI can help you:\n• Track spending & income\n• See where your money goes\n• Answer money questions\n\nJust ask me naturally like:\n"Add lunch ₹300" or "What's my balance?"`;
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion.replace(/^[💰📊💳💵📈🎯]\s/, ''));
    inputRef.current?.focus();
  };

  const handleAttachmentPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Photos', 'Choose Document'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handleChoosePhoto();
          } else if (buttonIndex === 3) {
            handleChooseDocument();
          }
        }
      );
    } else {
      // Android implementation
      Alert.alert(
        'Add Attachment',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose Photo', onPress: handleChoosePhoto },
          { text: 'Choose Document', onPress: handleChooseDocument },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Process the image (you can add OCR or AI processing here)
      Alert.alert('Photo captured', 'Processing receipt...');
    }
  };

  const handleChoosePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      // Process the image
      Alert.alert('Photo selected', 'Processing receipt...');
    }
  };

  const handleChooseDocument = async () => {
    // Simplified document handling without DocumentPicker
    Alert.alert('Coming Soon', 'Document upload feature will be available soon!');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      {/* Header - Perplexity Style */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton}>
          <Text style={styles.headerButtonText}>G</Text>
        </Pressable>
        <Text style={styles.headerTitle}>MoneyAI pro</Text>
        <Pressable style={styles.headerButton}>
          <IconSymbol name="person.badge.plus" size={18} color="#8E8E93" />
        </Pressable>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          // Perplexity-Style Welcome State
          <ScrollView
            style={styles.welcomeScrollView}
            contentContainerStyle={[
              styles.welcomeContainer,
              isKeyboardVisible && styles.welcomeContainerKeyboard
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Centered Logo and Tagline - Hide when keyboard is visible */}
            {!isKeyboardVisible && (
              <View style={styles.logoSection}>
                <View style={styles.mainLogo}>
                  <IconSymbol name="sparkles" size={40} color="#20B2AA" />
                </View>
                <Text style={styles.tagline}>Understand your money</Text>
              </View>
            )}

            {/* Suggestion Chips - 2 Row Auto-Scrolling Marquee */}
            <View style={[
              styles.suggestionsWrapper,
              isKeyboardVisible && styles.suggestionsWrapperKeyboard
            ]}>
              {suggestions.map((row, rowIndex) => (
                <MarqueeRow
                  key={rowIndex}
                  suggestions={row}
                  direction={rowIndex === 0 ? 'right' : 'left'}
                  onSuggestionPress={handleSuggestionPress}
                />
              ))}
            </View>
          </ScrollView>
        ) : (
          // Messages
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessage : styles.aiMessage
                ]}
              >
                {!message.isUser && (
                  <View style={styles.aiAvatar}>
                    <IconSymbol name="sparkles" size={14} color="#20B2AA" />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.aiBubble
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser ? styles.userText : styles.aiText
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              </View>
            ))}

            {isLoading && (
              <View style={[styles.messageContainer, styles.aiMessage]}>
                <View style={styles.aiAvatar}>
                  <IconSymbol name="sparkles" size={14} color="#20B2AA" />
                </View>
                <View style={[styles.messageBubble, styles.aiBubble]}>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                    <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
                    <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Bottom Input Bar - Perplexity Style */}
        <View style={[
          styles.inputContainer,
          isKeyboardVisible && styles.inputContainerKeyboard
        ]}>
          <View style={styles.inputBar}>
            <Pressable
              style={styles.plusButton}
              onPress={handleAttachmentPress}
            >
              <IconSymbol name="plus" size={20} color="#8E8E93" />
            </Pressable>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Ask anything..."
              placeholderTextColor="#6B7280"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              multiline={false}
              maxLength={500}
            />
            <Pressable style={styles.voiceButton}>
              <IconSymbol name="waveform" size={20} color="#8E8E93" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Dark background like Perplexity
  },

  // Header - Perplexity Style
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1A1A1A',
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Main Container
  mainContainer: {
    flex: 1,
  },

  // Welcome State - Perplexity Style
  welcomeScrollView: {
    flex: 1,
  },
  welcomeContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  welcomeContainerKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  // Suggestions Marquee - 2 Rows
  suggestionsWrapper: {
    gap: 4, // Reduced gap between rows
  },
  suggestionsWrapperKeyboard: {
    marginTop: 20,
    gap: 4,
  },
  marqueeContainer: {
    height: 36,
    overflow: 'hidden',
  },
  marqueeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    height: 36,
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '400',
    flex: 1,
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 120,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#20B2AA',
  },
  aiBubble: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  aiText: {
    color: '#FFFFFF',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8E8E93',
  },

  // Bottom Input Bar - Perplexity Style
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 88 + 8 : 70 + 8, // Tab bar height + small gap
    backgroundColor: '#1A1A1A',
  },
  inputContainerKeyboard: {
    paddingBottom: Platform.OS === 'ios' ? 0 : 12, // Minimal padding when keyboard is visible
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  plusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 4,
  },
  voiceButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});