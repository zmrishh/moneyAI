/**
 * Unit tests for IconRegistry
 */

import {
  ICON_REGISTRY,
  CATEGORY_ICONS,
  DEFAULT_ICON_CONFIG,
  getCategoryIconConfig,
  getIconName,
  hasIcon,
} from '../IconRegistry';

describe('IconRegistry', () => {
  describe('ICON_REGISTRY', () => {
    it('should contain core navigation icons', () => {
      expect(ICON_REGISTRY.home).toBeDefined();
      expect(ICON_REGISTRY.transactions).toBeDefined();
      expect(ICON_REGISTRY.insights).toBeDefined();
      expect(ICON_REGISTRY.settings).toBeDefined();
    });

    it('should have platform-specific mappings for each icon', () => {
      Object.values(ICON_REGISTRY).forEach(iconDef => {
        expect(iconDef.ios).toBeDefined();
        expect(iconDef.android).toBeDefined();
        expect(iconDef.web).toBeDefined();
        expect(iconDef.fallback).toBeDefined();
      });
    });

    it('should have consistent icon definitions', () => {
      Object.entries(ICON_REGISTRY).forEach(([key, iconDef]) => {
        expect(typeof iconDef.ios).toBe('string');
        expect(typeof iconDef.android).toBe('string');
        expect(typeof iconDef.web).toBe('string');
        expect(typeof iconDef.fallback).toBe('string');
        expect(iconDef.ios.length).toBeGreaterThan(0);
        expect(iconDef.android.length).toBeGreaterThan(0);
      });
    });
  });

  describe('CATEGORY_ICONS', () => {
    it('should contain common financial categories', () => {
      expect(CATEGORY_ICONS['Food & Dining']).toBeDefined();
      expect(CATEGORY_ICONS['Transportation']).toBeDefined();
      expect(CATEGORY_ICONS['Shopping']).toBeDefined();
      expect(CATEGORY_ICONS['Income']).toBeDefined();
    });

    it('should have complete configuration for each category', () => {
      Object.values(CATEGORY_ICONS).forEach(config => {
        expect(config.icon).toBeDefined();
        expect(config.color).toBeDefined();
        expect(config.emoji).toBeDefined();
        expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // Valid hex color
        expect(config.emoji.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getCategoryIconConfig', () => {
    it('should return correct config for existing categories', () => {
      const config = getCategoryIconConfig('Food & Dining');
      expect(config).toBe(CATEGORY_ICONS['Food & Dining']);
      expect(config.emoji).toBe('🍽️');
      expect(config.color).toBe('#FF6B6B');
    });

    it('should return default config for unknown categories', () => {
      const config = getCategoryIconConfig('Unknown Category');
      expect(config).toBe(DEFAULT_ICON_CONFIG);
      expect(config.emoji).toBe('📝');
      expect(config.color).toBe('#8E8E93');
    });

    it('should handle empty string category', () => {
      const config = getCategoryIconConfig('');
      expect(config).toBe(DEFAULT_ICON_CONFIG);
    });
  });

  describe('getIconName', () => {
    it('should return correct platform-specific icon names', () => {
      const homeIcon = getIconName('home', 'ios');
      expect(homeIcon).toBe('house.fill');

      const homeIconAndroid = getIconName('home', 'android');
      expect(homeIconAndroid).toBe('home');
    });

    it('should return fallback for unknown icons', () => {
      // Mock console.warn to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const unknownIcon = getIconName('unknown-icon');
      expect(unknownIcon).toBe('help-outline');
      expect(consoleSpy).toHaveBeenCalledWith(
        "Icon 'unknown-icon' not found in registry, using fallback"
      );
      
      consoleSpy.mockRestore();
    });

    it('should default to android platform', () => {
      const icon = getIconName('home');
      expect(icon).toBe('home');
    });

    it('should use fallback when platform-specific icon is missing', () => {
      // Create a mock icon with missing platform
      const mockRegistry = {
        'test-icon': {
          ios: 'test.ios',
          android: '', // Missing android icon
          web: 'test-web',
          fallback: 'test-fallback'
        }
      };

      // Temporarily replace registry
      const originalRegistry = { ...ICON_REGISTRY };
      Object.assign(ICON_REGISTRY, mockRegistry);

      const icon = getIconName('test-icon', 'android');
      expect(icon).toBe('test-fallback');

      // Restore original registry
      Object.keys(ICON_REGISTRY).forEach(key => delete ICON_REGISTRY[key]);
      Object.assign(ICON_REGISTRY, originalRegistry);
    });
  });

  describe('hasIcon', () => {
    it('should return true for existing icons', () => {
      expect(hasIcon('home')).toBe(true);
      expect(hasIcon('search')).toBe(true);
      expect(hasIcon('add')).toBe(true);
    });

    it('should return false for non-existing icons', () => {
      expect(hasIcon('non-existent-icon')).toBe(false);
      expect(hasIcon('')).toBe(false);
    });
  });

  describe('Icon registry completeness', () => {
    it('should have all required financial icons', () => {
      const requiredIcons = [
        'income', 'expense', 'transfer', 'budget', 'goal',
        'safe-to-spend', 'bill', 'payment', 'reminder'
      ];

      requiredIcons.forEach(iconKey => {
        expect(hasIcon(iconKey)).toBe(true);
      });
    });

    it('should have all required action icons', () => {
      const actionIcons = [
        'add', 'edit', 'delete', 'share', 'split', 'repeat'
      ];

      actionIcons.forEach(iconKey => {
        expect(hasIcon(iconKey)).toBe(true);
      });
    });

    it('should have all required status icons', () => {
      const statusIcons = [
        'success', 'warning', 'error', 'info'
      ];

      statusIcons.forEach(iconKey => {
        expect(hasIcon(iconKey)).toBe(true);
      });
    });
  });
});