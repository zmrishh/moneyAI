/**
 * Tests for Theme System and Responsive Design
 */

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useResponsive, useResponsiveValue } from '@/hooks/useResponsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Container, Flex, Grid } from '../Grid';
import { ThemedButton, ThemedText, ThemedView } from '../ThemedComponents';
import { ThemeToggle, ThemeToggleIcon } from '../ThemeToggle';

// Mocks are already set up in jest-setup.js

// Test component to access theme context
function TestComponent() {
  const { theme, themeMode, isDark, setThemeMode, toggleTheme } = useTheme();
  const responsive = useResponsive();
  
  return (
    <>
      <ThemedText testID="theme-name">{theme.name}</ThemedText>
      <ThemedText testID="theme-mode">{themeMode}</ThemedText>
      <ThemedText testID="is-dark">{isDark.toString()}</ThemedText>
      <ThemedText testID="breakpoint">{responsive.breakpoint}</ThemedText>
      <ThemedButton testID="toggle-theme" onPress={toggleTheme}>
        Toggle
      </ThemedButton>
      <ThemedButton testID="set-dark" onPress={() => setThemeMode('dark')}>
        Set Dark
      </ThemedButton>
    </>
  );
}

function ResponsiveTestComponent() {
  const value = useResponsiveValue({
    mobile: 'mobile-value',
    tablet: 'tablet-value',
    desktop: 'desktop-value',
  });
  
  return <ThemedText testID="responsive-value">{value}</ThemedText>;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('should provide default light theme', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme-name').props.children).toBe('light');
    expect(getByTestId('theme-mode').props.children).toBe('auto');
    expect(getByTestId('is-dark').props.children).toBe('false');
  });

  it('should toggle between light and dark themes', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleButton = getByTestId('toggle-theme');
    
    // Initially light
    expect(getByTestId('theme-name').props.children).toBe('light');
    
    // Toggle to dark
    fireEvent.press(toggleButton);
    
    await waitFor(() => {
      expect(getByTestId('theme-name').props.children).toBe('dark');
    });
    
    // Toggle back to light
    fireEvent.press(toggleButton);
    
    await waitFor(() => {
      expect(getByTestId('theme-name').props.children).toBe('light');
    });
  });

  it('should set specific theme mode', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkButton = getByTestId('set-dark');
    
    fireEvent.press(setDarkButton);
    
    await waitFor(() => {
      expect(getByTestId('theme-name').props.children).toBe('dark');
      expect(getByTestId('theme-mode').props.children).toBe('dark');
    });
  });

  it('should save theme preference to AsyncStorage', async () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkButton = getByTestId('set-dark');
    fireEvent.press(setDarkButton);
    
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@moneyai_theme_mode', 'dark');
    });
  });

  it('should load saved theme preference', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('dark');
    
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByTestId('theme-mode').props.children).toBe('dark');
    });
  });
});

describe('Responsive Design', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect mobile breakpoint', () => {
    global.mockDimensions.get.mockReturnValue({ width: 375, height: 812 });
    
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('breakpoint').props.children).toBe('mobile');
  });

  it('should detect tablet breakpoint', () => {
    global.mockDimensions.get.mockReturnValue({ width: 768, height: 1024 });
    
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('breakpoint').props.children).toBe('tablet');
  });

  it('should detect desktop breakpoint', () => {
    global.mockDimensions.get.mockReturnValue({ width: 1200, height: 800 });
    
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('breakpoint').props.children).toBe('desktop');
  });

  it('should return responsive values based on breakpoint', () => {
    global.mockDimensions.get.mockReturnValue({ width: 375, height: 812 });
    
    const { getByTestId } = render(
      <ThemeProvider>
        <ResponsiveTestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('responsive-value').props.children).toBe('mobile-value');
  });

  it('should return tablet value for tablet breakpoint', () => {
    global.mockDimensions.get.mockReturnValue({ width: 768, height: 1024 });
    
    const { getByTestId } = render(
      <ThemeProvider>
        <ResponsiveTestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('responsive-value').props.children).toBe('tablet-value');
  });
});

describe('ThemedComponents', () => {
  it('should render ThemedText with correct styles', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemedText testID="themed-text" variant="lg" color="primary">
          Test Text
        </ThemedText>
      </ThemeProvider>
    );

    const textElement = getByTestId('themed-text');
    expect(textElement.props.children).toBe('Test Text');
    expect(textElement.props.style).toMatchObject(
      expect.objectContaining({
        fontSize: expect.any(Number),
        color: expect.any(String),
      })
    );
  });

  it('should render ThemedView with correct background', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemedView testID="themed-view" surface="secondary">
          <ThemedText>Content</ThemedText>
        </ThemedView>
      </ThemeProvider>
    );

    const viewElement = getByTestId('themed-view');
    expect(viewElement.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    );
  });

  it('should render ThemedButton with correct variant styles', () => {
    const mockPress = jest.fn();
    
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemedButton testID="themed-button" variant="primary" onPress={mockPress}>
          Button Text
        </ThemedButton>
      </ThemeProvider>
    );

    const buttonElement = getByTestId('themed-button');
    fireEvent.press(buttonElement);
    
    expect(mockPress).toHaveBeenCalled();
    expect(buttonElement.props.style).toMatchObject(
      expect.objectContaining({
        backgroundColor: expect.any(String),
        borderRadius: expect.any(Number),
      })
    );
  });
});

describe('ThemeToggle', () => {
  it('should render theme toggle options', () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(getByLabelText('Switch to Light theme')).toBeTruthy();
    expect(getByLabelText('Switch to Dark theme')).toBeTruthy();
    expect(getByLabelText('Switch to Auto theme')).toBeTruthy();
  });

  it('should switch theme when option is pressed', async () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <ThemeToggle />
        <TestComponent />
      </ThemeProvider>
    );

    const darkOption = getByLabelText('Switch to Dark theme');
    fireEvent.press(darkOption);
    
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@moneyai_theme_mode', 'dark');
    });
  });

  it('should render compact theme toggle icon', () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <ThemeToggleIcon />
      </ThemeProvider>
    );

    expect(getByLabelText('Switch to dark theme')).toBeTruthy();
  });
});

describe('Grid System', () => {
  it('should render Grid with correct column layout', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Grid testID="grid" columns={2}>
          <ThemedView testID="item-1"><ThemedText>Item 1</ThemedText></ThemedView>
          <ThemedView testID="item-2"><ThemedText>Item 2</ThemedText></ThemedView>
        </Grid>
      </ThemeProvider>
    );

    const gridElement = getByTestId('grid');
    expect(gridElement.props.style).toMatchObject(
      expect.objectContaining({
        flexDirection: 'row',
        flexWrap: 'wrap',
      })
    );
  });

  it('should render Container with responsive max width', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Container testID="container">
          <ThemedText>Container Content</ThemedText>
        </Container>
      </ThemeProvider>
    );

    const containerElement = getByTestId('container');
    expect(containerElement.props.style).toMatchObject(
      expect.objectContaining({
        width: '100%',
        alignSelf: 'center',
      })
    );
  });

  it('should render Flex with correct direction', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Flex testID="flex" direction="row" justify="center">
          <ThemedText>Flex Item</ThemedText>
        </Flex>
      </ThemeProvider>
    );

    const flexElement = getByTestId('flex');
    expect(flexElement.props.style).toMatchObject(
      expect.objectContaining({
        flexDirection: 'row',
        justifyContent: 'center',
      })
    );
  });
});