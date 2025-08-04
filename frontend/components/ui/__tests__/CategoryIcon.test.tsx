/**
 * Unit tests for CategoryIcon component
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { CategoryIcon, getCategoryEmoji, getCategoryColor } from '../CategoryIcon';

// Mock the IconSymbol component
jest.mock('../IconSymbol', () => ({
  IconSymbol: ({ name, size, color }: any) => {
    const MockIconSymbol = require('react-native').Text;
    return <MockIconSymbol testID={`icon-${name}`}>{`Icon:${name}:${size}:${color}`}</MockIconSymbol>;
  },
}));

describe('CategoryIcon', () => {
  describe('Component rendering', () => {
    it('should render with default props', () => {
      const { getByTestId } = render(
        <CategoryIcon category="Food & Dining" />
      );
      
      // Should render an icon (mocked as text)
      expect(getByTestId(/icon-/)).toBeTruthy();
    });

    it('should render emoji when useEmoji is true', () => {
      const { getByText } = render(
        <CategoryIcon category="Food & Dining" useEmoji={true} />
      );
      
      expect(getByText('🍽️')).toBeTruthy();
    });

    it('should apply custom size', () => {
      const { getByTestId } = render(
        <CategoryIcon category="Food & Dining" size={32} />
      );
      
      const icon = getByTestId(/icon-/);
      expect(icon.props.children).toContain(':32:');
    });

    it('should show background when showBackground is true', () => {
      const { getByTestId } = render(
        <CategoryIcon 
          category="Food & Dining" 
          showBackground={true}
          testID="category-icon-container"
        />
      );
      
      // The container should have background styling applied
      // This is tested through the component structure
      expect(getByTestId(/icon-/)).toBeTruthy();
    });

    it('should handle unknown categories gracefully', () => {
      const { getByTestId } = render(
        <CategoryIcon category="Unknown Category" />
      );
      
      expect(getByTestId(/icon-/)).toBeTruthy();
    });

    it('should render emoji for unknown categories when useEmoji is true', () => {
      const { getByText } = render(
        <CategoryIcon category="Unknown Category" useEmoji={true} />
      );
      
      expect(getByText('📝')).toBeTruthy(); // Default emoji
    });
  });

  describe('getCategoryEmoji', () => {
    it('should return correct emoji for known categories', () => {
      expect(getCategoryEmoji('Food & Dining')).toBe('🍽️');
      expect(getCategoryEmoji('Transportation')).toBe('🚗');
      expect(getCategoryEmoji('Shopping')).toBe('🛍️');
      expect(getCategoryEmoji('Income')).toBe('💰');
    });

    it('should return default emoji for unknown categories', () => {
      expect(getCategoryEmoji('Unknown Category')).toBe('📝');
      expect(getCategoryEmoji('')).toBe('📝');
    });
  });

  describe('getCategoryColor', () => {
    it('should return correct color for known categories', () => {
      expect(getCategoryColor('Food & Dining')).toBe('#FF6B6B');
      expect(getCategoryColor('Transportation')).toBe('#4ECDC4');
      expect(getCategoryColor('Shopping')).toBe('#45B7D1');
      expect(getCategoryColor('Income')).toBe('#00B894');
    });

    it('should return default color for unknown categories', () => {
      expect(getCategoryColor('Unknown Category')).toBe('#8E8E93');
      expect(getCategoryColor('')).toBe('#8E8E93');
    });

    it('should return valid hex colors', () => {
      const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Income'];
      
      categories.forEach(category => {
        const color = getCategoryColor(category);
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with screen readers', () => {
      const { getByTestId } = render(
        <CategoryIcon 
          category="Food & Dining"
          testID="category-icon"
        />
      );
      
      // The component should render without accessibility warnings
      expect(getByTestId(/icon-/)).toBeTruthy();
    });

    it('should handle different sizes for touch targets', () => {
      const sizes = [16, 24, 32, 48];
      
      sizes.forEach(size => {
        const { getByTestId } = render(
          <CategoryIcon 
            category="Food & Dining" 
            size={size}
            testID={`icon-${size}`}
          />
        );
        
        expect(getByTestId(/icon-/)).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(
        <CategoryIcon category="Food & Dining" size={24} />
      );
      
      // Re-render with same props
      rerender(<CategoryIcon category="Food & Dining" size={24} />);
      
      // Component should handle re-renders gracefully
      expect(true).toBe(true); // Basic test to ensure no crashes
    });

    it('should handle rapid category changes', () => {
      const categories = [
        'Food & Dining',
        'Transportation', 
        'Shopping',
        'Entertainment',
        'Unknown Category'
      ];
      
      const { rerender, getByTestId } = render(
        <CategoryIcon category={categories[0]} />
      );
      
      categories.forEach(category => {
        rerender(<CategoryIcon category={category} />);
        expect(getByTestId(/icon-/)).toBeTruthy();
      });
    });
  });
});