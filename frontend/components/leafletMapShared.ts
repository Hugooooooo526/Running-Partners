export interface Runner {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
  pace?: string;
  distance?: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface LeafletMapProps {
  runners: Runner[];
  selectedRunnerId: string | null;
  onRunnerPress: (id: string) => void;
  onMapPress: (lat: number, lng: number) => void;
  userLocation: { latitude: number; longitude: number } | null;
  route: { start: RoutePoint | null; end: RoutePoint | null } | null;
  // Recorded GPS breadcrumbs of a past run, drawn as a solid polyline
  // instead of `route`'s OSRM-fetched suggested path.
  path?: RoutePoint[];
}

// Posts to whichever host is listening: react-native-webview's WebView on
// native (window.ReactNativeWebView), or the parent window on web (rendered
// inside an <iframe>).
const HOST_BRIDGE_SHIM = `
    function postToHost(msg) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(msg);
      } else if (window.parent) {
        window.parent.postMessage(msg, '*');
      }
    }
`;

export const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #f2f2f2; }
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
    .user-location-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4285f4;
      border: 3px solid #ffffff;
      box-shadow: 0 0 0 4px rgba(66, 133, 244, 0.3), 0 2px 6px rgba(0,0,0,0.4);
    }
    .route-pin-dot {
      width: 22px;
      height: 22px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #0d0e12;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
    }
    .route-pin-dot.start {
      background: #34d17a;
    }
    .route-pin-dot.end {
      background: #ff4d4d;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
${HOST_BRIDGE_SHIM}
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([1.2998, 103.8374], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    map.on('click', function(e) {
      postToHost(JSON.stringify({ type: 'mapPress', lat: e.latlng.lat, lng: e.latlng.lng }));
    });

    var markers = {};

    function onRunnerClick(id) {
      postToHost(JSON.stringify({ type: 'runnerPress', id: id }));
    }

    window.flyToRunner = function(lat, lng, zoom) {
      map.flyTo([lat, lng], zoom, { duration: 0.6 });
    };

    var userLocationMarker = null;

    window.setUserLocation = function(lat, lng) {
      var latlng = [lat, lng];
      if (userLocationMarker) {
        userLocationMarker.setLatLng(latlng);
      } else {
        var icon = L.divIcon({
          className: 'user-location-marker',
          html: '<div class="user-location-dot"></div>',
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });
        userLocationMarker = L.marker(latlng, { icon: icon, zIndexOffset: 1000 }).addTo(map);
      }
    };

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

    var routeLayer = null;
    var startPinMarker = null;
    var endPinMarker = null;

    function clearRouteLayer() {
      if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
    }
    function clearPins() {
      if (startPinMarker) { map.removeLayer(startPinMarker); startPinMarker = null; }
      if (endPinMarker) { map.removeLayer(endPinMarker); endPinMarker = null; }
    }

    window.clearRoute = function() {
      clearRouteLayer();
      clearPins();
    };

    window.setPin = function(lat, lng, kind) {
      placePin(lat, lng, kind);
    };

    function placePin(lat, lng, kind) {
      var icon = L.divIcon({
        className: 'route-pin',
        html: '<div class="route-pin-dot ' + kind + '"></div>',
        iconSize: [0, 0],
        iconAnchor: [11, 22]
      });
      var marker = L.marker([lat, lng], { icon: icon, zIndexOffset: 900 }).addTo(map);
      if (kind === 'start') {
        if (startPinMarker) map.removeLayer(startPinMarker);
        startPinMarker = marker;
      } else {
        if (endPinMarker) map.removeLayer(endPinMarker);
        endPinMarker = marker;
      }
    }

    function drawStraightFallback(startLat, startLng, endLat, endLng) {
      clearRouteLayer();
      routeLayer = L.polyline(
        [[startLat, startLng], [endLat, endLng]],
        { color: '#c3f400', weight: 4, opacity: 0.85, dashArray: '6, 8' }
      ).addTo(map);
    }

    window.renderRoute = function(startLat, startLng, endLat, endLng) {
      clearPins();
      placePin(startLat, startLng, 'start');
      placePin(endLat, endLng, 'end');

      var url = 'https://router.project-osrm.org/route/v1/foot/' +
        startLng + ',' + startLat + ';' + endLng + ',' + endLat +
        '?overview=full&geometries=geojson';

      fetch(url)
        .then(function(res) {
          if (!res.ok) throw new Error('OSRM HTTP ' + res.status);
          return res.json();
        })
        .then(function(data) {
          if (data.code !== 'Ok' || !data.routes || !data.routes[0]) {
            throw new Error('OSRM no route');
          }
          var coords = data.routes[0].geometry.coordinates;
          var latlngs = coords.map(function(c) { return [c[1], c[0]]; });
          clearRouteLayer();
          routeLayer = L.polyline(latlngs, { color: '#c3f400', weight: 5, opacity: 0.9 }).addTo(map);
          map.fitBounds(routeLayer.getBounds(), { padding: [60, 60] });
        })
        .catch(function(err) {
          drawStraightFallback(startLat, startLng, endLat, endLng);
          map.fitBounds(routeLayer.getBounds(), { padding: [60, 60] });
        });
    };

    // Draws the actual GPS breadcrumbs recorded during a past run (as
    // opposed to renderRoute's OSRM-suggested path between two pins).
    window.renderPath = function(points) {
      clearRouteLayer();
      clearPins();
      if (points.length === 0) return;

      var latlngs = points.map(function(p) { return [p.latitude, p.longitude]; });
      placePin(points[0].latitude, points[0].longitude, 'start');
      placePin(points[points.length - 1].latitude, points[points.length - 1].longitude, 'end');

      if (points.length === 1) {
        map.setView(latlngs[0], 16);
        return;
      }

      routeLayer = L.polyline(latlngs, { color: '#c3f400', weight: 5, opacity: 0.9 }).addTo(map);
      map.fitBounds(routeLayer.getBounds(), { padding: [60, 60] });
    };
  </script>
</body>
</html>
`;
