// Simple client-side auth utilities
export interface User {
  id: number;
  name: string;
  isGuest: boolean;
  sessionId?: string;
}

// Store user in localStorage
export const storeUser = (user: User): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    }
  } catch (error) {
    console.warn('Failed to store user:', error);
  }
};

// Get user from localStorage
export const getStoredUser = (): User | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    }
  } catch (error) {
    console.warn('Failed to get stored user:', error);
  }
  return null;
};

// Clear user from localStorage
export const clearStoredUser = (): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('currentUser');
    }
  } catch (error) {
    console.warn('Failed to clear stored user:', error);
  }
};

// Get just the user ID (most common use case)
export const getCurrentUserId = (): number | null => {
  try {
    const user = getStoredUser();
    return user ? user.id : null;
  } catch (error) {
    console.warn('Failed to get current user ID:', error);
    return null;
  }
};
