/**
 * Simple validation script for the icon system
 * Run with: node scripts/validate-icons.js
 */

const { ICON_REGISTRY, CATEGORY_ICONS, getCategoryIconConfig, getIconName, hasIcon } = require('../components/ui/IconRegistry.ts');

console.log('🔍 Validating Icon System...\n');

// Test 1: Check if core icons exist
console.log('✅ Testing core icon registry...');
const coreIcons = ['home', 'transactions', 'insights', 'settings', 'search', 'add'];
let coreIconsValid = true;

coreIcons.forEach(iconKey => {
  if (!hasIcon(iconKey)) {
    console.log(`❌ Missing core icon: ${iconKey}`);
    coreIconsValid = false;
  }
});

if (coreIconsValid) {
  console.log('✅ All core icons present');
} else {
  console.log('❌ Some core icons missing');
}

// Test 2: Check category icons
console.log('\n✅ Testing category icons...');
const testCategories = ['Food & Dining', 'Transportation', 'Shopping', 'Income'];
let categoryIconsValid = true;

testCategories.forEach(category => {
  const config = getCategoryIconConfig(category);
  if (!config.icon || !config.color || !config.emoji) {
    console.log(`❌ Invalid config for category: ${category}`);
    categoryIconsValid = false;
  }
});

if (categoryIconsValid) {
  console.log('✅ All category icons configured correctly');
} else {
  console.log('❌ Some category icons have invalid configuration');
}

// Test 3: Check platform-specific mappings
console.log('\n✅ Testing platform mappings...');
let platformMappingsValid = true;

Object.entries(ICON_REGISTRY).forEach(([key, iconDef]) => {
  if (!iconDef.ios || !iconDef.android || !iconDef.web || !iconDef.fallback) {
    console.log(`❌ Incomplete platform mapping for: ${key}`);
    platformMappingsValid = false;
  }
});

if (platformMappingsValid) {
  console.log('✅ All platform mappings complete');
} else {
  console.log('❌ Some platform mappings incomplete');
}

// Test 4: Test getIconName function
console.log('\n✅ Testing getIconName function...');
try {
  const homeIos = getIconName('home', 'ios');
  const homeAndroid = getIconName('home', 'android');
  
  if (homeIos && homeAndroid) {
    console.log('✅ getIconName function working correctly');
    console.log(`   iOS: ${homeIos}, Android: ${homeAndroid}`);
  } else {
    console.log('❌ getIconName function not working correctly');
  }
} catch (error) {
  console.log(`❌ Error in getIconName function: ${error.message}`);
}

console.log('\n🎉 Icon system validation complete!');
console.log(`📊 Registry contains ${Object.keys(ICON_REGISTRY).length} icons`);
console.log(`📊 Category icons: ${Object.keys(CATEGORY_ICONS).length} categories`);