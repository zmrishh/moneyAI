import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Country, getPopularCountries, searchCountries } from '@/constants/CountryCodes';

interface CountrySelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
  selectedCountry?: Country;
}

export function CountrySelector({ visible, onClose, onSelect, selectedCountry }: CountrySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const popularCountries = useMemo(() => getPopularCountries(), []);
  const filteredCountries = useMemo(() => searchCountries(searchQuery), [searchQuery]);
  
  const handleSelectCountry = (country: Country) => {
    onSelect(country);
    setSearchQuery('');
    onClose();
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <Pressable
      style={[
        styles.countryItem,
        selectedCountry?.code === item.code && styles.selectedCountryItem
      ]}
      onPress={() => handleSelectCountry(item)}
    >
      <View style={styles.countryInfo}>
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.countryDetails}>
          <Text style={styles.countryName}>{item.name}</Text>
          <Text style={styles.dialCode}>{item.dialCode}</Text>
        </View>
      </View>
      {selectedCountry?.code === item.code && (
        <Ionicons name="checkmark" size={20} color="#007AFF" />
      )}
    </Pressable>
  );

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Select Country</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </Pressable>
          )}
        </View>

        {/* Countries List */}
        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          renderItem={renderCountryItem}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            searchQuery.length === 0 ? (
              <View>
                {renderSectionHeader('Popular Countries')}
                {popularCountries.map((country) => (
                  <View key={country.code}>
                    {renderCountryItem({ item: country })}
                  </View>
                ))}
                {renderSectionHeader('All Countries')}
              </View>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#48484A',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 60, // Same width as close button for centering
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#FFFFFF',
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#48484A',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#48484A',
  },
  selectedCountryItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  countryDetails: {
    flex: 1,
  },
  countryName: {
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  dialCode: {
    fontSize: 15,
    color: '#8E8E93',
  },
});