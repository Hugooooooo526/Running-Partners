import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UseLocationResult {
  location: Coordinates | null;
  errorMsg: string | null;
}

// High accuracy + a fixed time cadence so fixes keep flowing while the user
// moves. Avoid gating on distanceInterval here: on Android, a coarse
// ("Balanced") fix with a 5m distance threshold can suppress updates for a
// slow runner, and on web expo-location's watchPositionAsync passes options
// straight to navigator.geolocation.watchPosition without enableHighAccuracy,
// so the browser often returns just a single coarse fix.
const WATCH_OPTIONS: Location.LocationOptions = {
  accuracy: Location.Accuracy.High,
  timeInterval: 2000,
  distanceInterval: 0,
};

// Safety net: poll getCurrentPositionAsync (which does set enableHighAccuracy
// on web) so we always have a reasonably fresh fix even where the watch is
// sparse.
const POLL_INTERVAL_MS = 10_000;

// On some Linux desktops Chrome has no working location backend (no geoclue,
// no network-based provider). In that case navigator.geolocation never calls
// either callback — it just hangs forever, so nothing here would time out on
// its own and the UI would silently never get a fix. Race the first fix
// against a plain JS timer so the user gets a visible error instead.
const FIRST_FIX_TIMEOUT_MS = 15_000;

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let firstFixTimer: ReturnType<typeof setTimeout> | null = null;
    let gotFirstFix = false;
    let cancelled = false;

    const applyPosition = (position: Location.LocationObject) => {
      if (cancelled) return;
      if (!gotFirstFix) {
        gotFirstFix = true;
        if (firstFixTimer) clearTimeout(firstFixTimer);
      }
      setErrorMsg(null);
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    };

    const poll = async () => {
      try {
        const position = await Location.getCurrentPositionAsync(WATCH_OPTIONS);
        applyPosition(position);
      } catch {
        // Transient failure — the watch or next poll will retry.
      }
    };

    (async () => {
      let status: Location.PermissionStatus;
      try {
        ({ status } = await Location.requestForegroundPermissionsAsync());
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : 'Unable to request location permission');
        }
        return;
      }
      if (cancelled) return;
      if (status !== 'granted') {
        setErrorMsg('Location permission was denied');
        return;
      }

      firstFixTimer = setTimeout(() => {
        if (!cancelled && !gotFirstFix) {
          setErrorMsg('Unable to determine your location — check that location services are enabled');
        }
      }, FIRST_FIX_TIMEOUT_MS);

      try {
        subscription = await Location.watchPositionAsync(WATCH_OPTIONS, applyPosition);
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : 'Unable to start location updates');
        }
      }

      // Kick off a first fix immediately, then poll as a backstop.
      poll();
      pollTimer = setInterval(poll, POLL_INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (firstFixTimer) clearTimeout(firstFixTimer);
      subscription?.remove();
    };
  }, []);

  return { location, errorMsg };
}
