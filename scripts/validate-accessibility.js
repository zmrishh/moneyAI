#!/usr/bin/env node

/**
 * Accessibility Validation Script for MoneyAI
 * Validates that accessibility improvements are properly implemented
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

function checkFileContains(filePath, searchTerms) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    const results = searchTerms.map(term => ({
      term,
      found: content.includes(term)
    }));
    
    return results;
  } catch (error) {
    return searchTerms.map(term => ({ term, found: false }));
  }
}

function validateAccessibilityImplementation() {
  log(`${colors.bold}🔍 MoneyAI Accessibility Validation${colors.reset}\n`);

  let totalChecks = 0;
  let passedChecks = 0;

  // Check if accessibility utility files exist
  log(`${colors.blue}📁 Checking Accessibility Files...${colors.reset}`);
  
  const requiredFiles = [
    'utils/accessibility.ts',
    'utils/accessibilityAudit.ts',
    'utils/keyboardNavigation.ts',
    'components/ui/AccessibleComponents.tsx',
    'ACCESSIBILITY.md'
  ];

  requiredFiles.forEach(file => {
    totalChecks++;
    if (checkFileExists(file)) {
      log(`  ✅ ${file}`, colors.green);
      passedChecks++;
    } else {
      log(`  ❌ ${file}`, colors.red);
    }
  });

  // Check accessibility implementations in main screens
  log(`\n${colors.blue}📱 Checking Screen Implementations...${colors.reset}`);
  
  const screenChecks = [
    {
      file: 'app/(tabs)/index.tsx',
      terms: ['accessibilityRole', 'accessibilityLabel', 'accessibilityLevel']
    },
    {
      file: 'app/(tabs)/transactions.tsx',
      terms: ['accessibilityRole', 'accessibilityLabel', 'accessibilityHint']
    },
    {
      file: 'app/(tabs)/insights.tsx',
      terms: ['accessibilityRole', 'accessibilityLabel']
    },
    {
      file: 'app/(tabs)/budgets.tsx',
      terms: ['accessibilityRole', 'accessibilityLabel']
    }
  ];

  screenChecks.forEach(({ file, terms }) => {
    const results = checkFileContains(file, terms);
    const passed = results.filter(r => r.found).length;
    const total = results.length;
    
    totalChecks += total;
    passedChecks += passed;
    
    if (passed === total) {
      log(`  ✅ ${file} (${passed}/${total})`, colors.green);
    } else if (passed > 0) {
      log(`  ⚠️  ${file} (${passed}/${total})`, colors.yellow);
    } else {
      log(`  ❌ ${file} (${passed}/${total})`, colors.red);
    }
  });

  // Check component enhancements
  log(`\n${colors.blue}🧩 Checking Component Enhancements...${colors.reset}`);
  
  const componentChecks = [
    {
      file: 'components/HapticTab.tsx',
      terms: ['createTabA11yProps', 'accessibilityLabel']
    },
    {
      file: 'components/ui/InteractiveChart.tsx',
      terms: ['createChartDataA11yProps', 'accessibilityRole']
    },
    {
      file: 'app/(tabs)/_layout.tsx',
      terms: ['tabBarAccessibilityLabel']
    }
  ];

  componentChecks.forEach(({ file, terms }) => {
    const results = checkFileContains(file, terms);
    const passed = results.filter(r => r.found).length;
    const total = results.length;
    
    totalChecks += total;
    passedChecks += passed;
    
    if (passed === total) {
      log(`  ✅ ${file} (${passed}/${total})`, colors.green);
    } else if (passed > 0) {
      log(`  ⚠️  ${file} (${passed}/${total})`, colors.yellow);
    } else {
      log(`  ❌ ${file} (${passed}/${total})`, colors.red);
    }
  });

  // Check utility functions
  log(`\n${colors.blue}🛠️  Checking Utility Functions...${colors.reset}`);
  
  const utilityChecks = [
    {
      file: 'utils/accessibility.ts',
      terms: [
        'createButtonA11yProps',
        'createTransactionA11yProps',
        'createCurrencyA11yProps',
        'formatNumberForA11y'
      ]
    }
  ];

  utilityChecks.forEach(({ file, terms }) => {
    const results = checkFileContains(file, terms);
    const passed = results.filter(r => r.found).length;
    const total = results.length;
    
    totalChecks += total;
    passedChecks += passed;
    
    if (passed === total) {
      log(`  ✅ ${file} (${passed}/${total})`, colors.green);
    } else if (passed > 0) {
      log(`  ⚠️  ${file} (${passed}/${total})`, colors.yellow);
    } else {
      log(`  ❌ ${file} (${passed}/${total})`, colors.red);
    }
  });

  // Final results
  log(`\n${colors.bold}📊 Validation Results${colors.reset}`);
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  
  if (percentage >= 90) {
    log(`✅ Accessibility implementation: ${percentage}% (${passedChecks}/${totalChecks})`, colors.green);
    log(`🎉 Excellent accessibility coverage!`, colors.green);
  } else if (percentage >= 70) {
    log(`⚠️  Accessibility implementation: ${percentage}% (${passedChecks}/${totalChecks})`, colors.yellow);
    log(`👍 Good accessibility coverage, room for improvement`, colors.yellow);
  } else {
    log(`❌ Accessibility implementation: ${percentage}% (${passedChecks}/${totalChecks})`, colors.red);
    log(`⚠️  Accessibility needs significant improvement`, colors.red);
  }

  // Recommendations
  log(`\n${colors.blue}💡 Recommendations:${colors.reset}`);
  log(`1. Test with screen reader enabled (VoiceOver/TalkBack)`);
  log(`2. Test keyboard navigation with external keyboard`);
  log(`3. Test voice control functionality`);
  log(`4. Verify color contrast ratios meet WCAG AA standards`);
  log(`5. Test with increased text size settings`);
  log(`6. Run accessibility audit: npm run accessibility:audit`);

  return percentage >= 70;
}

// Run validation
const success = validateAccessibilityImplementation();
process.exit(success ? 0 : 1);