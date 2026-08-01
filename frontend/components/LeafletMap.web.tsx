import React, { useRef, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MAP_HTML, LeafletMapProps } from './leafletMapShared';

// react-native-webview has no web implementation, so this variant renders
// the same Leaflet HTML inside a same-origin <iframe> instead. Metro/expo
// picks this file automatically on web builds via the .web.tsx extension.
// Communication mirrors the native WebView bridge: the iframe's script
// posts messages via window.parent.postMessage (see leafletMapShared's
// postToHost shim), and since the iframe is same-origin (srcDoc), we can
// call its exposed globals (renderMarkers, flyToRunner, etc.) directly
// through contentWindow instead of needing injectJavaScript/eval.
const LeafletMap: React.FC<LeafletMapProps> = ({
  runners,
  selectedRunnerId,
  onRunnerPress,
  onMapPress,
  userLocation,
  route,
  path,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const hasCenteredOnUserRef = useRef(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'runnerPress' && data.id) {
          onRunnerPress(data.id);
        } else if (data.type === 'mapPress') {
          onMapPress(data.lat, data.lng);
        }
      } catch {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRunnerPress, onMapPress]);

  const getMapWindow = useCallback((): any => iframeRef.current?.contentWindow ?? null, []);

  useEffect(() => {
    const mapWindow = getMapWindow();
    if (!iframeLoaded || !mapWindow) return;

    const runnersData = runners.map((r) => ({
      id: r.id,
      username: r.username,
      latitude: r.latitude,
      longitude: r.longitude,
    }));

    mapWindow.renderMarkers(runnersData, selectedRunnerId);
    const selected = runners.find((r) => r.id === selectedRunnerId);
    if (selected) mapWindow.flyToRunner(selected.latitude, selected.longitude, 17);
  }, [iframeLoaded, runners, selectedRunnerId, getMapWindow]);

  useEffect(() => {
    const mapWindow = getMapWindow();
    if (!iframeLoaded || !mapWindow || !userLocation) return;

    const shouldCenter = !hasCenteredOnUserRef.current;
    if (shouldCenter) hasCenteredOnUserRef.current = true;

    mapWindow.setUserLocation(userLocation.latitude, userLocation.longitude);
    if (shouldCenter) mapWindow.flyToRunner(userLocation.latitude, userLocation.longitude, 16);
  }, [iframeLoaded, userLocation, getMapWindow]);

  useEffect(() => {
    const mapWindow = getMapWindow();
    if (!iframeLoaded || !mapWindow) return;

    if (route?.start && route?.end) {
      mapWindow.renderRoute(route.start.latitude, route.start.longitude, route.end.latitude, route.end.longitude);
    } else if (route?.start || route?.end) {
      const point = route.start ?? route.end!;
      const kind = route.start ? 'start' : 'end';
      mapWindow.clearRoute();
      mapWindow.setPin(point.latitude, point.longitude, kind);
      mapWindow.flyToRunner(point.latitude, point.longitude, 16);
    } else {
      mapWindow.clearRoute();
    }
  }, [iframeLoaded, route, getMapWindow]);

  useEffect(() => {
    const mapWindow = getMapWindow();
    if (!iframeLoaded || !mapWindow || !path) return;
    mapWindow.renderPath(path);
  }, [iframeLoaded, path, getMapWindow]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={MAP_HTML}
        style={iframeStyle}
        onLoad={() => setIframeLoaded(true)}
      />
    </View>
  );
};

const iframeStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  height: '100%',
  border: 'none',
  backgroundColor: '#1a1a1a',
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default LeafletMap;
