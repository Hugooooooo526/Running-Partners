import React, { useRef, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAP_HTML, LeafletMapProps } from './leafletMapShared';

const LeafletMap: React.FC<LeafletMapProps> = ({
  runners,
  selectedRunnerId,
  onRunnerPress,
  onMapPress,
  userLocation,
  route,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [webviewLoaded, setWebviewLoaded] = useState(false);
  const hasCenteredOnUserRef = useRef(false);

  const onMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'runnerPress' && data.id) {
          onRunnerPress(data.id);
        } else if (data.type === 'mapPress') {
          onMapPress(data.lat, data.lng);
        }
      } catch {}
    },
    [onRunnerPress, onMapPress]
  );

  useEffect(() => {
    if (!webviewLoaded || !webViewRef.current) return;

    const runnersJson = JSON.stringify(
      runners.map((r) => ({
        id: r.id,
        username: r.username,
        latitude: r.latitude,
        longitude: r.longitude,
      }))
    );

    const selected = runners.find((r) => r.id === selectedRunnerId);

    const js = `
      window.renderMarkers(${runnersJson}, ${selectedRunnerId ? "'" + selectedRunnerId + "'" : 'null'});
      ${selected ? `window.flyToRunner(${selected.latitude}, ${selected.longitude}, 17);` : ''}
      true;
    `;
    webViewRef.current.injectJavaScript(js);
  }, [webviewLoaded, runners, selectedRunnerId]);

  useEffect(() => {
    if (!webviewLoaded || !webViewRef.current || !userLocation) return;

    const shouldCenter = !hasCenteredOnUserRef.current;
    if (shouldCenter) hasCenteredOnUserRef.current = true;

    const js = `
      window.setUserLocation(${userLocation.latitude}, ${userLocation.longitude});
      ${shouldCenter ? `window.flyToRunner(${userLocation.latitude}, ${userLocation.longitude}, 16);` : ''}
      true;
    `;
    webViewRef.current.injectJavaScript(js);
  }, [webviewLoaded, userLocation]);

  useEffect(() => {
    if (!webviewLoaded || !webViewRef.current) return;

    let js: string;
    if (route?.start && route?.end) {
      js = `window.renderRoute(${route.start.latitude}, ${route.start.longitude}, ${route.end.latitude}, ${route.end.longitude}); true;`;
    } else if (route?.start || route?.end) {
      const point = route.start ?? route.end!;
      const kind = route.start ? 'start' : 'end';
      js = `window.clearRoute(); window.setPin(${point.latitude}, ${point.longitude}, '${kind}'); window.flyToRunner(${point.latitude}, ${point.longitude}, 16); true;`;
    } else {
      js = `window.clearRoute(); true;`;
    }
    webViewRef.current.injectJavaScript(js);
  }, [webviewLoaded, route]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        style={styles.webview}
        onMessage={onMessage}
        onLoadEnd={() => setWebviewLoaded(true)}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  webview: {
    flex: 1,
    backgroundColor: '#0d0e12',
  },
});

export default LeafletMap;
