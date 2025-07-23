import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { SignupModal } from './signup';

const { width } = Dimensions.get('window');

interface WalkthroughPage {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  backgroundColor: string;
  isDark: boolean;
}

export default function WalkthroughScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const [showSignupModal, setShowSignupModal] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const walkthroughPages: WalkthroughPage[] = [
    {
      id: 1,
      title: 'Hi there! I\'m MoneyAI 👋',
      subtitle: 'I\'m here to help you boost your financial results.',
      description: '',
      backgroundColor: '#1A1A1A',
      isDark: true,
    },
    {
      id: 2,
      title: 'Smart budgeting',
      subtitle: 'made simple',
      description: 'Get AI-powered budget recommendations based on your spending patterns and financial goals.',
      backgroundColor: '#1A1A1A',
      isDark: true,
    },
    {
      id: 3,
      title: 'Connect all your',
      subtitle: 'bank accounts',
      description: 'Securely link all your accounts through RBI-approved Account Aggregator for complete financial visibility.',
      backgroundColor: '#1A1A1A',
      isDark: true,
    },
    {
      id: 4,
      title: 'Achieve your',
      subtitle: 'financial goals',
      description: 'Set savings targets, track progress, and get personalized insights to reach your dreams faster.',
      backgroundColor: '#1A1A1A',
      isDark: true,
    },
  ];

  const handleNext = () => {
    if (currentPage < walkthroughPages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
    } else {
      // Show signup modal overlay
      setShowSignupModal(true);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      scrollViewRef.current?.scrollTo({
        x: prevPage * width,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    setShowSignupModal(true);
  };

  const handleCloseSignupModal = () => {
    setShowSignupModal(false);
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const pageIndex = Math.round(contentOffset.x / width);
    setCurrentPage(pageIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" hidden={true} />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={[styles.scrollView, { 
          opacity: showSignupModal ? 0 : 1,
          display: showSignupModal ? 'none' : 'flex'
        }]}
        pointerEvents={showSignupModal ? 'none' : 'auto'}
      >
        {walkthroughPages.map((page, index) => (
          <View key={page.id} style={[styles.page, { backgroundColor: page.backgroundColor }]}>

            {/* Header with Skip */}
            <View style={styles.header}>
              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>
            </View>

            {/* Progress Dots */}
            <View style={styles.progressContainer}>
              {walkthroughPages.map((_, dotIndex) => (
                <View
                  key={dotIndex}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: dotIndex === currentPage ? '#007AFF' : (page.isDark ? '#48484A' : '#C7C7CC'),
                      width: dotIndex === currentPage ? 20 : 6,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Main Content Area */}
            <View style={styles.contentArea}>

              {/* Illustration */}
              <View style={styles.illustrationContainer}>
                {index === 0 && (
                  <View style={styles.welcomeContainer}>
                    <View style={styles.gradientBlob}>
                      <IconSymbol name="chart.line.uptrend.xyaxis" size={48} color="#fff" />
                    </View>
                  </View>
                )}

                {index === 1 && (
                  <View style={styles.budgetingContainer}>
                    <View style={styles.cardStack}>
                      <View style={[styles.budgetCard, styles.backCard, { backgroundColor: '#5856D6' }]} />
                      <View style={[styles.budgetCard, styles.middleCard, { backgroundColor: '#32D74B' }]} />
                      <View style={[styles.budgetCard, styles.frontCard, { backgroundColor: '#00C7BE' }]}>
                        <Text style={styles.cardLabel}>SAVINGS</Text>
                      </View>
                    </View>
                  </View>
                )}

                {index === 2 && (
                  <View style={styles.aggregatorContainer}>
                    <View style={styles.bankCardStack}>
                      <View style={[styles.bankCard, styles.blueCard, { backgroundColor: '#007AFF' }]}>
                        <Text style={styles.bankCardTitle}>MoneyAI</Text>
                      </View>
                      <View style={[styles.bankCard, styles.redCard, { backgroundColor: '#FF3B30' }]}>
                        <Text style={styles.bankCardTitle}>MoneyAI</Text>
                        <Text style={styles.bankCardSubtitle}>SECURE CONNECT</Text>
                      </View>
                    </View>
                  </View>
                )}

                {index === 3 && (
                  <View style={styles.goalsContainer}>
                    <View style={styles.aiAvatar}>
                      <View style={styles.eyes}>
                        <View style={styles.eye} />
                        <View style={styles.eye} />
                      </View>
                      <View style={styles.smile} />
                    </View>
                  </View>
                )}
              </View>

              {/* Text Content */}
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: page.isDark ? '#FFFFFF' : '#1D1D1F' }]}>
                  {page.title}
                </Text>
                {page.subtitle && (
                  <Text style={[styles.title, { color: page.isDark ? '#FFFFFF' : '#1D1D1F' }]}>
                    {page.subtitle}
                  </Text>
                )}
                <Text style={[styles.subtitle, { color: '#8E8E93' }]}>
                  {page.description}
                </Text>
              </View>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottomSection}>
              <View style={styles.navigationContainer}>
                <Pressable
                  style={[styles.backBtn, { opacity: currentPage === 0 ? 0 : 1 }]}
                  onPress={handlePrevious}
                  disabled={currentPage === 0}
                >
                  <IconSymbol name="chevron.left" size={20} color="#8E8E93" />
                </Pressable>

                <Pressable
                  style={[
                    currentPage === 0 ? styles.specialNextBtn : styles.nextBtn
                  ]}
                  onPress={handleNext}
                >
                  <Text style={[
                    currentPage === 0 ? styles.specialNextBtnText : styles.nextBtnText
                  ]}>
                    {currentPage === walkthroughPages.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  {currentPage < walkthroughPages.length - 1 && (
                    <IconSymbol
                      name="chevron.right"
                      size={14}
                      color={currentPage === 0 ? "#fff" : "#000"}
                    />
                  )}
                </Pressable>
              </View>

              {/* Home Indicator */}
              {/* <View style={styles.homeIndicator} /> */}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Signup Modal Overlay */}
      {showSignupModal && (
        <SignupModal
          visible={showSignupModal}
          onClose={handleCloseSignupModal}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  skipButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  // Page 1 - Welcome
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBlob: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#5856D6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
  },
  // Page 2 - Budgeting
  budgetingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStack: {
    position: 'relative',
    width: 180,
    height: 120,
  },
  budgetCard: {
    position: 'absolute',
    width: 160,
    height: 90,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  backCard: {
    top: 15,
    left: 10,
    transform: [{ rotate: '-8deg' }],
  },
  middleCard: {
    top: 8,
    left: 5,
    transform: [{ rotate: '4deg' }],
  },
  frontCard: {
    top: 0,
    left: 0,
    transform: [{ rotate: '0deg' }],
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  // Page 3 - Aggregator
  aggregatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankCardStack: {
    position: 'relative',
    width: 220,
    height: 140,
  },
  bankCard: {
    position: 'absolute',
    width: 200,
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  blueCard: {
    top: 0,
    left: 0,
    transform: [{ rotate: '-3deg' }],
  },
  redCard: {
    top: -60,
    left: 10,
    transform: [{ rotate: '3deg' }],
  },
  bankCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  bankCardSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.8,
    alignSelf: 'flex-end',
  },
  // Page 4 - Goals
  goalsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#5856D6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  eyes: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  eye: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  smile: {
    width: 20,
    height: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    borderTopWidth: 0,
  },
  // Text Content
  textContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
    marginTop: 16,
  },
  // Bottom Section
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 100,
    justifyContent: 'center',
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  // Special button for first page (gradient blue)
  specialNextBtn: {
    backgroundColor: '#5856D6',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  specialNextBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
    alignSelf: 'center',
    opacity: 0.4,
    marginBottom: 8,
  },
});