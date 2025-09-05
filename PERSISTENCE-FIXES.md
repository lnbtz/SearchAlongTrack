# Persistent Storage and Service Worker Fixes

These changes improve state persistence for your SearchAlongTrack app, particularly on mobile devices like iOS where aggressive memory management can cause state loss when the app is in the background.

## Changes Made:

1. **Improved Service Worker**
   - Enhanced caching strategy for app resources
   - Properly set up for better offline support
   - Registered in the app via service worker registration code

2. **Comprehensive State Persistence**
   - Added IndexedDB state storage for app settings and UI state
   - Added parallel localStorage for faster access and redundancy
   - Created new persistent stores for critical app settings
   - Set up state synchronization between regular stores and persistent stores

3. **Visibility and App Lifecycle Handling**
   - Added event listeners for visibility changes (when app goes to background)
   - Added beforeunload handler to save state before the page is unloaded
   - Debounced saves to reduce write operations and improve performance

4. **Enhanced Map State Persistence**
   - Improved map state saving for map center and zoom level
   - Added handling to properly restore the map view

## What This Solves:

1. **iOS Background Tab Behavior**: iOS Safari may unload tabs in the background to free up memory. The improved state persistence ensures your app state is saved before this happens.

2. **Screen Locking Issues**: When a device's screen is locked, iOS may purge memory of background tabs. Your app will now restore its state properly when reopened.

3. **Tab Switching**: When users switch between tabs, your app is better prepared to save and restore its state.

4. **Browser Refresh Resilience**: Even if the browser refreshes the page, the app state is restored from persistent storage.

5. **Offline Support**: The improved service worker provides better offline capabilities.

## Tips for Usage:

- The persistent state now includes:
  - Selected categories
  - Selected radius
  - Track range selection (start/end)
  - Search results and table data
  - Map view state

- No changes to your workflow are required - the app will now automatically persist its state.

- Your app continues to use IndexedDB for track storage as before, now enhanced with additional state storage.

- No external database is needed for the current feature set.
