import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { subDays } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export type PeriodType = 'week' | 'month' | '3months' | '6months' | 'custom';

interface DateRangeState {
  selectedPeriod: PeriodType;
  customRange: DateRange;
  isLoading: boolean;
  error: string | null;
}

type DateRangeAction =
  | { type: 'SET_PERIOD'; payload: PeriodType }
  | { type: 'SET_CUSTOM_RANGE'; payload: DateRange }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

interface DateRangeContextType {
  state: DateRangeState;
  setPeriod: (period: PeriodType) => void;
  setCustomRange: (range: DateRange) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  getCurrentRange: () => DateRange;
}

const initialState: DateRangeState = {
  selectedPeriod: 'week',
  customRange: {
    from: subDays(new Date(), 7),
    to: new Date(),
  },
  isLoading: false,
  error: null,
};

const dateRangeReducer = (state: DateRangeState, action: DateRangeAction): DateRangeState => {
  switch (action.type) {
    case 'SET_PERIOD':
      return {
        ...state,
        selectedPeriod: action.payload,
        error: null,
      };
    case 'SET_CUSTOM_RANGE':
      return {
        ...state,
        customRange: action.payload,
        selectedPeriod: 'custom',
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export const DateRangeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dateRangeReducer, initialState);

  const setPeriod = useCallback((period: PeriodType) => {
    dispatch({ type: 'SET_PERIOD', payload: period });
  }, []);

  const setCustomRange = useCallback((range: DateRange) => {
    dispatch({ type: 'SET_CUSTOM_RANGE', payload: range });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const getCurrentRange = useCallback((): DateRange => {
    if (state.selectedPeriod === 'custom') {
      return state.customRange;
    }
    
    // Calculate range based on selected period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (state.selectedPeriod) {
      case 'week':
        return {
          from: subDays(today, 7),
          to: today,
        };
      case 'month':
        return {
          from: new Date(today.getFullYear(), today.getMonth(), 1),
          to: today,
        };
      case '3months':
        return {
          from: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()),
          to: today,
        };
      case '6months':
        return {
          from: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()),
          to: today,
        };
      default:
        return state.customRange;
    }
  }, [state.selectedPeriod, state.customRange]);

  const value: DateRangeContextType = {
    state,
    setPeriod,
    setCustomRange,
    setLoading,
    setError,
    reset,
    getCurrentRange,
  };

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
};

export const useDateRange = (): DateRangeContextType => {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
};