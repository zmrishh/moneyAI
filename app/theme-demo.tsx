/**
 * Theme System Demo Screen
 * Demonstrates the comprehensive theme system and responsive design
 */

import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function ThemeDemoScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Theme Demo' }} />
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Theme Demo</Text>
          <Text style={styles.subtitle}>This is a demo screen for theme testing</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
});