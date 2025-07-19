import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width, height } = Dimensions.get('window');

interface WalkthroughPage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
}

export default function WalkthroughScreen() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const walkthroughPages: WalkthroughPage[] = [
    {
      id: 1,
      title: 'Smart Expense',
      subtitle: 'Tracking',
      description: 'Automatically categorize and track your expenses with AI-powered insights.',
    },
    {
      id: 2,
      title: 'AI-Powered',
      subtitle: 'Budgeting',
      description: 'Get personalized budget recommendations based on your spending patterns.',
    },
    {
      id: 3,
      title: 'Account Aggregator',
      subtitle: 'Integration',
      description: 'Securely connect all your bank accounts through RBI-approved Account Aggregator.',
    },
    {
      id: 4,
      title: 'Financial Goals',
      subtitle: '& Insights',
      description: 'Set savings goals, track progress, and get actionable insights.',
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
      router.push('/signup');
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
    router.push('/signup');
  };

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const pageIndex = Math.round(contentOffset.x / width);
    setCurrentPage(pageIndex);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1A1A1A" />
      
      <View style={styles.header}>
        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.progressContainer}>
        {walkthroughPages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index === currentPage ? '#0ea5e9' : '#333',
                width: index === currentPage ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {walkthroughPages.map((page) => (
          <View key={page.id} style={styles.page}>
            <View style={styles.content}>
              <View style={styles.illustrationSection}>
                <View style={styles.placeholder}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={64} color="#0ea5e9" />
                </View>
              </View>

              <View style={styles.textContent}>
                <Text style={styles.title}>
                  {page.title}
                  {'\n'}
                  <Text style={styles.titleHighlight}>{page.subtitle}</Text>
                </Text>
                <Text style={styles.description}>{page.description}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.navigation}>
        <Pressable
          style={[styles.navButton, { opacity: currentPage === 0 ? 0.3 : 1 }]}
          onPress={handlePrevious}
          disabled={currentPage === 0}
        >
          <IconSymbol name="chevron.left" size={24} color="#8E8E93" />
        </Pressable>

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentPage === walkthroughPages.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          {currentPage < walkthroughPages.length - 1 && (
            <IconSymbol name="chevron.right" size={20} color="#1A1A1A" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 8,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    width,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  illustrationSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 20,
  },
  titleHighlight: {
    color: '#0ea5e9',
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 50,
    paddingTop: 20,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});