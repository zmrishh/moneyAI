/**
 * Theme System Demo Screen
 * Demonstrates the comprehensive theme system and responsive design
 */

import { Container, Flex, Grid } from '@/components/ui/Grid';
import {
    ThemedButton,
    ThemedCard,
    ThemedScrollView,
    ThemedText,
    ThemedTextInput,
    ThemedView
} from '@/components/ui/ThemedComponents';
import { ThemeToggle, ThemeToggleIcon } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useResponsive } from '@/hooks/useResponsive';
import { Stack } from 'expo-router';

export default function ThemeDemoScreen() {
  const { theme, themeMode, isDark } = useTheme();
  const { breakpoint, width, height, orientation } = useResponsive();

  return (
    <>
      <Stack.Screen options={{ title: 'Theme System Demo' }} />
      <ThemedScrollView surface="primary">
        <Container padding="lg">
          
          {/* Header Section */}
          <ThemedView padding="lg" margin="md" borderRadius={12}>
            <ThemedText variant="3xl" weight="bold" align="center">
              Theme System Demo
            </ThemedText>
            <ThemedText variant="lg" color="secondary" align="center">
              Comprehensive theme and responsive design showcase
            </ThemedText>
          </ThemedView>

          {/* Theme Controls */}
          <ThemedCard padding="lg" elevated>
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Theme Controls
            </ThemedText>
            
            <Flex direction="column" gap={16}>
              <ThemedView>
                <ThemedText variant="sm" color="secondary" style={{ marginBottom: 8 }}>
                  Theme Toggle (Full)
                </ThemedText>
                <ThemeToggle />
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary" style={{ marginBottom: 8 }}>
                  Theme Toggle (Compact)
                </ThemedText>
                <ThemeToggle compact showLabels={false} />
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary" style={{ marginBottom: 8 }}>
                  Theme Toggle (Icon Only)
                </ThemedText>
                <ThemeToggleIcon />
              </ThemedView>
            </Flex>
          </ThemedCard>

          {/* Current Theme Info */}
          <ThemedCard padding="lg">
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Current Theme Info
            </ThemedText>
            
            <Grid columns={2} gap={12}>
              <ThemedView>
                <ThemedText variant="sm" color="secondary">Theme Mode</ThemedText>
                <ThemedText variant="lg" weight="medium">{themeMode}</ThemedText>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary">Active Theme</ThemedText>
                <ThemedText variant="lg" weight="medium">{theme.name}</ThemedText>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary">Is Dark</ThemedText>
                <ThemedText variant="lg" weight="medium">{isDark ? 'Yes' : 'No'}</ThemedText>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary">Breakpoint</ThemedText>
                <ThemedText variant="lg" weight="medium">{breakpoint}</ThemedText>
              </ThemedView>
            </Grid>
          </ThemedCard>

          {/* Responsive Info */}
          <ThemedCard padding="lg">
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Responsive Design Info
            </ThemedText>
            
            <Grid columns={{ mobile: 1, tablet: 2 }} gap={12}>
              <ThemedView>
                <ThemedText variant="sm" color="secondary">Screen Width</ThemedText>
                <ThemedText variant="lg" weight="medium">{width}px</ThemedText>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary">Screen Height</ThemedText>
                <ThemedText variant="lg" weight="medium">{height}px</ThemedText>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary">Orientation</ThemedText>
                <ThemedText variant="lg" weight="medium">{orientation}</ThemedText>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary">Current Breakpoint</ThemedText>
                <ThemedText variant="lg" weight="medium">{breakpoint}</ThemedText>
              </ThemedView>
            </Grid>
          </ThemedCard>

          {/* Typography Scale */}
          <ThemedCard padding="lg">
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Typography Scale
            </ThemedText>
            
            <Flex direction="column" gap={8}>
              <ThemedText variant="xs">Extra Small Text (xs)</ThemedText>
              <ThemedText variant="sm">Small Text (sm)</ThemedText>
              <ThemedText variant="base">Base Text (base)</ThemedText>
              <ThemedText variant="lg">Large Text (lg)</ThemedText>
              <ThemedText variant="xl">Extra Large Text (xl)</ThemedText>
              <ThemedText variant="2xl">2X Large Text (2xl)</ThemedText>
              <ThemedText variant="3xl">3X Large Text (3xl)</ThemedText>
              <ThemedText variant="4xl">4X Large Text (4xl)</ThemedText>
            </Flex>
          </ThemedCard>

          {/* Color Palette */}
          <ThemedCard padding="lg">
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Color Palette
            </ThemedText>
            
            <Flex direction="column" gap={12}>
              <ThemedView>
                <ThemedText variant="sm" color="secondary" style={{ marginBottom: 4 }}>
                  Text Colors
                </ThemedText>
                <ThemedText color="primary">Primary Text</ThemedText>
                <ThemedText color="secondary">Secondary Text</ThemedText>
                <ThemedText color="tertiary">Tertiary Text</ThemedText>
                <ThemedText color="disabled">Disabled Text</ThemedText>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary" style={{ marginBottom: 4 }}>
                  Surface Colors
                </ThemedText>
                <ThemedView surface="primary" padding="sm" borderRadius={8} style={{ marginBottom: 4 }}>
                  <ThemedText>Primary Surface</ThemedText>
                </ThemedView>
                <ThemedView surface="secondary" padding="sm" borderRadius={8} style={{ marginBottom: 4 }}>
                  <ThemedText>Secondary Surface</ThemedText>
                </ThemedView>
                <ThemedView surface="tertiary" padding="sm" borderRadius={8}>
                  <ThemedText>Tertiary Surface</ThemedText>
                </ThemedView>
              </ThemedView>
            </Flex>
          </ThemedCard>

          {/* Button Variants */}
          <ThemedCard padding="lg">
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Button Variants
            </ThemedText>
            
            <Flex direction="column" gap={12}>
              <ThemedView>
                <ThemedText variant="sm" color="secondary" style={{ marginBottom: 8 }}>
                  Button Variants
                </ThemedText>
                <Flex direction="row" gap={8} style={{ flexWrap: 'wrap' }}>
                  <ThemedButton variant="primary">Primary</ThemedButton>
                  <ThemedButton variant="secondary">Secondary</ThemedButton>
                  <ThemedButton variant="outline">Outline</ThemedButton>
                  <ThemedButton variant="ghost">Ghost</ThemedButton>
                </Flex>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary" style={{ marginBottom: 8 }}>
                  Button Sizes
                </ThemedText>
                <Flex direction="row" gap={8} style={{ flexWrap: 'wrap' }}>
                  <ThemedButton size="sm">Small</ThemedButton>
                  <ThemedButton size="md">Medium</ThemedButton>
                  <ThemedButton size="lg">Large</ThemedButton>
                </Flex>
              </ThemedView>
              
              <ThemedView>
                <ThemedText variant="sm" color="secondary" style={{ marginBottom: 8 }}>
                  Full Width Button
                </ThemedText>
                <ThemedButton fullWidth>Full Width Button</ThemedButton>
              </ThemedView>
            </Flex>
          </ThemedCard>

          {/* Form Components */}
          <ThemedCard padding="lg">
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Form Components
            </ThemedText>
            
            <Flex direction="column" gap={16}>
              <ThemedTextInput 
                label="Standard Input"
                placeholder="Enter some text..."
                helperText="This is a helper text"
              />
              
              <ThemedTextInput 
                label="Input with Error"
                placeholder="This has an error..."
                error="This field is required"
              />
              
              <ThemedTextInput 
                label="Large Input"
                size="lg"
                placeholder="Large input field..."
              />
            </Flex>
          </ThemedCard>

          {/* Grid System */}
          <ThemedCard padding="lg">
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Responsive Grid System
            </ThemedText>
            
            <ThemedView style={{ marginBottom: 16 }}>
              <ThemedText variant="sm" color="secondary" style={{ marginBottom: 8 }}>
                2 Column Grid (Mobile: 1, Tablet: 2)
              </ThemedText>
              <Grid columns={{ mobile: 1, tablet: 2 }} gap={12}>
                <ThemedView surface="secondary" padding="md" borderRadius={8}>
                  <ThemedText>Grid Item 1</ThemedText>
                </ThemedView>
                <ThemedView surface="secondary" padding="md" borderRadius={8}>
                  <ThemedText>Grid Item 2</ThemedText>
                </ThemedView>
                <ThemedView surface="secondary" padding="md" borderRadius={8}>
                  <ThemedText>Grid Item 3</ThemedText>
                </ThemedView>
                <ThemedView surface="secondary" padding="md" borderRadius={8}>
                  <ThemedText>Grid Item 4</ThemedText>
                </ThemedView>
              </Grid>
            </ThemedView>
            
            <ThemedView>
              <ThemedText variant="sm" color="secondary" style={{ marginBottom: 8 }}>
                Flex Layout (Responsive Direction)
              </ThemedText>
              <Flex 
                direction={{ mobile: 'column', tablet: 'row' }} 
                gap={12} 
                justify="space-between"
              >
                <ThemedView surface="tertiary" padding="md" borderRadius={8} style={{ flex: 1 }}>
                  <ThemedText>Flex Item 1</ThemedText>
                </ThemedView>
                <ThemedView surface="tertiary" padding="md" borderRadius={8} style={{ flex: 1 }}>
                  <ThemedText>Flex Item 2</ThemedText>
                </ThemedView>
                <ThemedView surface="tertiary" padding="md" borderRadius={8} style={{ flex: 1 }}>
                  <ThemedText>Flex Item 3</ThemedText>
                </ThemedView>
              </Flex>
            </ThemedView>
          </ThemedCard>

          {/* Cards */}
          <ThemedCard padding="lg">
            <ThemedText variant="xl" weight="semibold" style={{ marginBottom: 16 }}>
              Card Variants
            </ThemedText>
            
            <Flex direction="column" gap={16}>
              <ThemedCard padding="md">
                <ThemedText variant="lg" weight="semibold">Standard Card</ThemedText>
                <ThemedText color="secondary">This is a standard card with border</ThemedText>
              </ThemedCard>
              
              <ThemedCard padding="md" elevated>
                <ThemedText variant="lg" weight="semibold">Elevated Card</ThemedText>
                <ThemedText color="secondary">This is an elevated card with shadow</ThemedText>
              </ThemedCard>
            </Flex>
          </ThemedCard>

        </Container>
      </ThemedScrollView>
    </>
  );
}