import React, { useRef, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Runner {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
  pace?: string;
  distance?: string;
}

interface LeafletMapProps {
  runners: Runner[];
  selectedRunnerId: string | null;
  onRunnerPress: (id: string) => void;
  onMapPress: () => void;
}

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #0d0e12; }
    .leaflet-control-zoom { display: none; }
    .leaflet-control-attribution { display: none; }
    .runner-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .runner-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid #444933;
      background: #292a2e;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.2s;
    }
    .runner-avatar.selected {
      width: 64px;
      height: 64px;
      border: 4px solid #c3f400;
      box-shadow: 0 0 20px rgba(195, 244, 0, 0.5);
      font-size: 24px;
    }
    .runner-label {
      margin-top: 4px;
      background: #1e1f23;
      border-radius: 10px;
      padding: 2px 8px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: #c4c9ac;
      letter-spacing: 0.5px;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([1.2998, 103.8374], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapPress' }));
    });

    var markers = {};

    function onRunnerClick(id) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'runnerPress', id: id }));
    }

    window.renderMarkers = function(runnersData, selectedId) {
      Object.keys(markers).forEach(function(id) {
        map.removeLayer(markers[id]);
        delete markers[id];
      });

      runnersData.forEach(function(runner) {
        var isSelected = runner.id === selectedId;
        var avatarClass = isSelected ? 'runner-avatar selected' : 'runner-avatar';
        var initial = runner.username.charAt(0).toUpperCase();

        var icon = L.divIcon({
          className: 'runner-marker',
          html: '<div class="' + avatarClass + '" onclick="event.stopPropagation(); onRunnerClick(\\'' + runner.id + '\\')">' + initial + '</div>' +
                '<div class="runner-label">' + runner.username.toUpperCase() + '</div>',
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        var marker = L.marker([runner.latitude, runner.longitude], { icon: icon }).addTo(map);
        marker.on('click', function(e) {
          L.DomEvent.stopPropagation(e);
        });
        markers[runner.id] = marker;
      });
    };
  </script>
</body>
</html>
`;

const LeafletMap: React.FC<LeafletMapProps> = ({
  runners,
  selectedRunnerId,
  onRunnerPress,
  onMapPress,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [webviewLoaded, setWebviewLoaded] = useState(false);

  const onMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'runnerPress' && data.id) {
          onRunnerPress(data.id);
        } else if (data.type === 'mapPress') {
          onMapPress();
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

    const js = `
      window.renderMarkers(${runnersJson}, ${selectedRunnerId ? "'" + selectedRunnerId + "'" : 'null'});
      true;
    `;
    webViewRef.current.injectJavaScript(js);
  }, [webviewLoaded, runners, selectedRunnerId]);

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
