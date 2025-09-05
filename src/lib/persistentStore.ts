// persistentStore.ts
// Uses localStorage and IndexedDB together for maximum resilience
// LocalStorage for quick access/recovery, IndexedDB for more permanent/larger storage

import { get, writable, type Writable } from 'svelte/store';
import {
    gpxTrackStore,
    selectedCategoriesStore,
    selectedRadiusStore,
    searchResultsCacheStore,
    tableDataStore,
    selectedStartRangeStore,
    selectedEndRangeStore,
    markersStore,
    tableDataDisplayStore
} from './stores';
import { browser } from '$app/environment';
import { 
    saveAppState, 
    getAppState, 
    type AppState 
} from './storage';

// Create a wrapper for localStorage with a fallback to memory
const storage = {
    getItem: (key: string): string | null => {
        try {
            if (browser) {
                return localStorage.getItem(key);
            }
        } catch (e) {
            console.warn('localStorage access failed', e);
        }
        return null;
    },
    setItem: (key: string, value: string): void => {
        try {
            if (browser) {
                localStorage.setItem(key, value);
            }
        } catch (e) {
            console.warn('localStorage write failed', e);
        }
    }
};

// Create a persistent store wrapper using both localStorage and IndexedDB
export function createPersistentStore<T>(key: string, initialValue: T): Writable<T> {
    // Try to get stored value from localStorage first (faster)
    const storedValueStr = storage.getItem(key);
    const storedValue: T = storedValueStr ? JSON.parse(storedValueStr) : initialValue;
    
    const store = writable<T>(storedValue);
    
    // Subscribe to changes and save to localStorage for quick access
    store.subscribe((value) => {
        if (browser) {
            try {
                const jsonValue = JSON.stringify(value);
                storage.setItem(key, jsonValue);
            } catch (e) {
                console.warn(`Failed to serialize store ${key} to localStorage`, e);
            }
        }
    });
    
    return store;
}

// Create stores that persist across sessions and browser reloads
export const persistentCategoriesStore = createPersistentStore<string[]>('selected-categories', []);
export const persistentRadiusStore = createPersistentStore<number>('selected-radius', 500);
export const persistentStartRangeStore = createPersistentStore<number>('start-range', 0);
export const persistentEndRangeStore = createPersistentStore<number>('end-range', 0);

// Save current app state to both localStorage and IndexedDB
async function saveCurrentAppState() {
    if (!browser) return;
    
    try {
        const appState: AppState = {
            selectedCategories: get(selectedCategoriesStore),
            selectedRadius: get(selectedRadiusStore),
            selectedStartRange: get(selectedStartRangeStore),
            selectedEndRange: get(selectedEndRangeStore),
            // We don't store the actual markers but the table data which can be used to recreate them
            lastSearchResults: get(tableDataStore)
        };
        
        await saveAppState(appState);
    } catch (e) {
        console.warn('Failed to save app state to IndexedDB', e);
    }
}

// Initialize from persistent storage on load
export async function initPersistentStores() {
    if (!browser) return;
    
    try {
        // Try to restore state from IndexedDB first
        const storedState = await getAppState();
        
        if (storedState) {
            // Restore app state from IndexedDB
            if (storedState.selectedCategories) {
                selectedCategoriesStore.set(storedState.selectedCategories);
                persistentCategoriesStore.set(storedState.selectedCategories);
            }
            
            if (storedState.selectedRadius) {
                selectedRadiusStore.set(storedState.selectedRadius);
                persistentRadiusStore.set(storedState.selectedRadius);
            }
            
            if (storedState.selectedStartRange !== undefined) {
                selectedStartRangeStore.set(storedState.selectedStartRange);
                persistentStartRangeStore.set(storedState.selectedStartRange);
            }
            
            if (storedState.selectedEndRange !== undefined) {
                selectedEndRangeStore.set(storedState.selectedEndRange);
                persistentEndRangeStore.set(storedState.selectedEndRange);
            }
            
            if (storedState.lastSearchResults) {
                tableDataStore.set(storedState.lastSearchResults);
            }
        } else {
            // Fall back to localStorage values if IndexedDB failed
            selectedCategoriesStore.set(get(persistentCategoriesStore));
            selectedRadiusStore.set(get(persistentRadiusStore));
            selectedStartRangeStore.set(get(persistentStartRangeStore));
            selectedEndRangeStore.set(get(persistentEndRangeStore));
        }
        
        // Set up subscriptions to sync between stores and save to IndexedDB periodically
        const saveDebounceTime = 2000; // 2 seconds
        let saveTimeout: ReturnType<typeof setTimeout> | null = null;
        
        function debouncedSave() {
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveCurrentAppState();
                saveTimeout = null;
            }, saveDebounceTime);
        }
        
        // Subscribe to store changes and save state
        selectedCategoriesStore.subscribe(value => {
            persistentCategoriesStore.set(value);
            debouncedSave();
        });
        
        selectedRadiusStore.subscribe(value => {
            persistentRadiusStore.set(value);
            debouncedSave();
        });
        
        selectedStartRangeStore.subscribe(value => {
            persistentStartRangeStore.set(value);
            debouncedSave();
        });
        
        selectedEndRangeStore.subscribe(value => {
            persistentEndRangeStore.set(value);
            debouncedSave();
        });
        
        // Save table data changes
        tableDataStore.subscribe(() => {
            debouncedSave();
        });
        
        // Setup visibility change handler to ensure state is saved when tab becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                if (saveTimeout) {
                    clearTimeout(saveTimeout);
                    saveTimeout = null;
                }
                saveCurrentAppState();
            }
        });
        
        // Also save before unload as a last resort
        window.addEventListener('beforeunload', () => {
            saveCurrentAppState();
        });
        
    } catch (e) {
        console.warn('Failed to initialize persistent stores', e);
        
        // Fall back to localStorage if IndexedDB fails completely
        selectedCategoriesStore.set(get(persistentCategoriesStore));
        selectedRadiusStore.set(get(persistentRadiusStore));
        selectedStartRangeStore.set(get(persistentStartRangeStore));
        selectedEndRangeStore.set(get(persistentEndRangeStore));
    }
}
