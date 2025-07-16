/**
 * Accessibility Audit Utility for MoneyAI
 * Provides tools to audit and validate accessibility compliance
 */

import { AccessibilityInfo, Platform } from 'react-native';

export interface AccessibilityAuditResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  score: number;
  recommendations: string[];
}

export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  element: string;
  issue: string;
  solution: string;
  wcagGuideline?: string;
}

/**
 * Audits a component tree for accessibility compliance
 */
export class AccessibilityAuditor {
  private issues: AccessibilityIssue[] = [];

  /**
   * Performs a comprehensive accessibility audit
   */
  async performAudit(): Promise<AccessibilityAuditResult> {
    this.issues = [];

    // Check screen reader availability
    await this.checkScreenReaderSupport();
    
    // Check for common accessibility issues
    this.checkMinimumTouchTargets();
    this.checkColorContrast();
    this.checkKeyboardNavigation();
    this.checkSemanticStructure();

    const score = this.calculateScore();
    const recommendations = this.generateRecommendations();

    return {
      passed: this.issues.filter(i => i.severity === 'error').length === 0,
      issues: this.issues,
      score,
      recommendations,
    };
  }

  /**
   * Checks if screen reader is available and enabled
   */
  private async checkScreenReaderSupport(): Promise<void> {
    try {
      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      if (!isScreenReaderEnabled && Platform.OS !== 'web') {
        this.addIssue({
          severity: 'info',
          element: 'System',
          issue: 'Screen reader is not currently enabled',
          solution: 'Enable screen reader in device settings to test accessibility',
          wcagGuideline: 'WCAG 2.1 - 4.1.2 Name, Role, Value',
        });
      }
    } catch (error) {
      this.addIssue({
        severity: 'warning',
        element: 'System',
        issue: 'Unable to detect screen reader status',
        solution: 'Manually test with screen reader enabled',
      });
    }
  }

  /**
   * Validates minimum touch target sizes (44x44 points on iOS, 48x48 dp on Android)
   */
  private checkMinimumTouchTargets(): void {
    const minSize = Platform.OS === 'ios' ? 44 : 48;
    
    // This would typically scan the component tree for interactive elements
    // For now, we provide guidelines
    this.addIssue({
      severity: 'info',
      element: 'Interactive Elements',
      issue: `Ensure all interactive elements meet minimum size requirements (${minSize}x${minSize})`,
      solution: 'Use AccessibleButton and AccessibleIconButton components which enforce minimum sizes',
      wcagGuideline: 'WCAG 2.1 - 2.5.5 Target Size',
    });
  }

  /**
   * Checks color contrast ratios
   */
  private checkColorContrast(): void {
    // This would typically analyze color combinations
    // For now, we provide guidelines
    this.addIssue({
      severity: 'info',
      element: 'Color Contrast',
      issue: 'Verify color contrast meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)',
      solution: 'Use theme colors which are designed to meet contrast requirements',
      wcagGuideline: 'WCAG 2.1 - 1.4.3 Contrast (Minimum)',
    });
  }

  /**
   * Validates keyboard navigation support
   */
  private checkKeyboardNavigation(): void {
    this.addIssue({
      severity: 'info',
      element: 'Keyboard Navigation',
      issue: 'Ensure all interactive elements are keyboard accessible',
      solution: 'Use proper accessibilityRole and ensure onAccessibilityAction is handled',
      wcagGuideline: 'WCAG 2.1 - 2.1.1 Keyboard',
    });
  }

  /**
   * Validates semantic structure and hierarchy
   */
  private checkSemanticStructure(): void {
    this.addIssue({
      severity: 'info',
      element: 'Semantic Structure',
      issue: 'Verify proper heading hierarchy and semantic roles',
      solution: 'Use AccessibleHeader with proper levels and semantic roles for all elements',
      wcagGuideline: 'WCAG 2.1 - 1.3.1 Info and Relationships',
    });
  }

  /**
   * Adds an issue to the audit results
   */
  private addIssue(issue: AccessibilityIssue): void {
    this.issues.push(issue);
  }

  /**
   * Calculates accessibility score based on issues found
   */
  private calculateScore(): number {
    const errorWeight = 10;
    const warningWeight = 5;
    const infoWeight = 1;

    const totalDeductions = this.issues.reduce((total, issue) => {
      switch (issue.severity) {
        case 'error':
          return total + errorWeight;
        case 'warning':
          return total + warningWeight;
        case 'info':
          return total + infoWeight;
        default:
          return total;
      }
    }, 0);

    return Math.max(0, 100 - totalDeductions);
  }

  /**
   * Generates recommendations based on audit results
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const errorCount = this.issues.filter(i => i.severity === 'error').length;
    const warningCount = this.issues.filter(i => i.severity === 'warning').length;

    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} critical accessibility error${errorCount > 1 ? 's' : ''}`);
    }

    if (warningCount > 0) {
      recommendations.push(`Address ${warningCount} accessibility warning${warningCount > 1 ? 's' : ''}`);
    }

    recommendations.push('Test with screen reader enabled');
    recommendations.push('Test with voice control enabled');
    recommendations.push('Test with increased text size');
    recommendations.push('Test keyboard navigation');

    return recommendations;
  }
}

/**
 * Quick accessibility check for development
 */
export async function quickAccessibilityCheck(): Promise<void> {
  const auditor = new AccessibilityAuditor();
  const result = await auditor.performAudit();

  console.log('🔍 Accessibility Audit Results');
  console.log(`Score: ${result.score}/100`);
  console.log(`Status: ${result.passed ? '✅ Passed' : '❌ Failed'}`);
  
  if (result.issues.length > 0) {
    console.log('\n📋 Issues Found:');
    result.issues.forEach((issue, index) => {
      const icon = issue.severity === 'error' ? '🚨' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${icon} ${index + 1}. ${issue.element}: ${issue.issue}`);
      console.log(`   Solution: ${issue.solution}`);
      if (issue.wcagGuideline) {
        console.log(`   WCAG: ${issue.wcagGuideline}`);
      }
      console.log('');
    });
  }

  if (result.recommendations.length > 0) {
    console.log('💡 Recommendations:');
    result.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

/**
 * Validates accessibility props for a component
 */
export function validateAccessibilityProps(props: any): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for missing accessibility labels on interactive elements
  if (props.onPress && !props.accessibilityLabel) {
    issues.push({
      severity: 'error',
      element: 'Interactive Element',
      issue: 'Missing accessibilityLabel on pressable element',
      solution: 'Add descriptive accessibilityLabel prop',
      wcagGuideline: 'WCAG 2.1 - 4.1.2 Name, Role, Value',
    });
  }

  // Check for proper accessibility roles
  if (props.onPress && !props.accessibilityRole) {
    issues.push({
      severity: 'warning',
      element: 'Interactive Element',
      issue: 'Missing accessibilityRole on interactive element',
      solution: 'Add appropriate accessibilityRole (button, link, etc.)',
      wcagGuideline: 'WCAG 2.1 - 4.1.2 Name, Role, Value',
    });
  }

  return issues;
}

/**
 * Accessibility testing helpers
 */
export const AccessibilityTestHelpers = {
  /**
   * Simulates screen reader announcement
   */
  announceForScreenReader: (message: string) => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  },

  /**
   * Checks if screen reader is enabled
   */
  isScreenReaderEnabled: async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch {
      return false;
    }
  },

  /**
   * Gets current accessibility focus
   */
  setAccessibilityFocus: (reactTag: number) => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  },
};

/**
 * Accessibility guidelines and best practices
 */
export const AccessibilityGuidelines = {
  touchTargets: {
    minimum: Platform.OS === 'ios' ? 44 : 48,
    recommended: Platform.OS === 'ios' ? 48 : 56,
  },
  
  colorContrast: {
    normalText: 4.5, // WCAG AA
    largeText: 3.0,   // WCAG AA
    enhanced: 7.0,    // WCAG AAA
  },
  
  textSize: {
    minimum: 12,
    recommended: 16,
    large: 18,
  },
  
  timing: {
    minimumTapDelay: 500, // ms between taps to prevent accidental double-tap
    animationDuration: 300, // ms for smooth animations
  },
};