import React, {
    createContext,
    forwardRef,
    useContext,
    useImperativeHandle,
    useMemo,
    useState,
} from "react";

import { StyleSheet, TouchableOpacity, View } from "react-native";

// ======================================================
// TYPES
// ======================================================

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type MapProps = {
  children?: React.ReactNode;
  style?: any;
  initialRegion?: Region;
  showsCompass?: boolean;
  showsBuildings?: boolean;
};

type MarkerProps = {
  coordinate: {
    latitude: number;
    longitude: number;
  };

  children?: React.ReactNode;

  onPress?: () => void;
};

type CircleProps = {
  center: {
    latitude: number;
    longitude: number;
  };

  radius?: number;

  strokeWidth?: number;

  strokeColor?: string;

  fillColor?: string;
};

// ======================================================
// DEFAULT REGION
// ======================================================

const DEFAULT_REGION: Region = {
  latitude: 13.7563,
  longitude: 100.5018,

  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

// ======================================================
// MAP CONTEXT
// ======================================================

const MapRegionContext = createContext<Region>(DEFAULT_REGION);

// ======================================================
// POSITION CALCULATION
// ======================================================

const coordinateToPercent = (
  coordinate: {
    latitude: number;
    longitude: number;
  },

  region: Region,
) => {
  const west = region.longitude - region.longitudeDelta / 2;

  const north = region.latitude + region.latitudeDelta / 2;

  const left = ((coordinate.longitude - west) / region.longitudeDelta) * 100;

  const top = ((north - coordinate.latitude) / region.latitudeDelta) * 100;

  return {
    left,
    top,
  };
};

// ======================================================
// WEB MAP
// ======================================================

const MapView = forwardRef<any, MapProps>(
  (
    {
      children,

      style,

      initialRegion = DEFAULT_REGION,
    },

    ref,
  ) => {
    const [region, setRegion] = useState<Region>(initialRegion);

    // ==================================================
    // SUPPORT animateToRegion()
    // ==================================================

    useImperativeHandle(
      ref,

      () => ({
        animateToRegion: (nextRegion: Partial<Region>) => {
          setRegion((previous) => ({
            ...previous,

            ...nextRegion,

            latitudeDelta: nextRegion.latitudeDelta ?? previous.latitudeDelta,

            longitudeDelta:
              nextRegion.longitudeDelta ?? previous.longitudeDelta,
          }));
        },
      }),
    );

    // ==================================================
    // OPENSTREETMAP
    // ==================================================

    const mapURL = useMemo(() => {
      const west = region.longitude - region.longitudeDelta / 2;

      const east = region.longitude + region.longitudeDelta / 2;

      const south = region.latitude - region.latitudeDelta / 2;

      const north = region.latitude + region.latitudeDelta / 2;

      const bbox = `${west},${south},${east},${north}`;

      return (
        "https://www.openstreetmap.org/export/embed.html" +
        `?bbox=${encodeURIComponent(bbox)}` +
        "&layer=mapnik"
      );
    }, [region]);

    const iframe = React.createElement(
      "iframe",

      {
        src: mapURL,

        title: "GPS Monster Hunter Map",

        loading: "lazy",

        style: {
          width: "100%",

          height: "100%",

          border: "0",

          display: "block",

          pointerEvents: "none",
        },
      },
    );

    return (
      <View style={[styles.map, style]}>
        {/* REAL WEB MAP */}

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {iframe}
        </View>

        {/* GAME OBJECTS */}

        <MapRegionContext.Provider value={region}>
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {children}
          </View>
        </MapRegionContext.Provider>
      </View>
    );
  },
);

MapView.displayName = "WebMapView";

// ======================================================
// MARKER
// ======================================================

export function Marker({
  coordinate,

  children,

  onPress,
}: MarkerProps) {
  const region = useContext(MapRegionContext);

  const position = coordinateToPercent(
    coordinate,

    region,
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.marker,

        {
          left: `${position.left}%`,

          top: `${position.top}%`,
        },
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

// ======================================================
// CIRCLE
// ======================================================

export function Circle({
  center,

  radius = 10,

  strokeWidth = 2,

  strokeColor = "rgba(36,111,255,0.65)",

  fillColor = "rgba(36,111,255,0.10)",
}: CircleProps) {
  const region = useContext(MapRegionContext);

  const position = coordinateToPercent(
    center,

    region,
  );

  const metersPerLatitudeDegree = 111320;

  const metersPerLongitudeDegree =
    111320 * Math.cos((center.latitude * Math.PI) / 180);

  const heightPercent =
    ((radius * 2) / (region.latitudeDelta * metersPerLatitudeDegree)) * 100;

  const widthPercent =
    ((radius * 2) / (region.longitudeDelta * metersPerLongitudeDegree)) * 100;

  const left = position.left - widthPercent / 2;

  const top = position.top - heightPercent / 2;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.circle,

        {
          left: `${left}%`,

          top: `${top}%`,

          width: `${widthPercent}%`,

          height: `${heightPercent}%`,

          borderWidth: strokeWidth,

          borderColor: strokeColor,

          backgroundColor: fillColor,
        },
      ]}
    />
  );
}

export default MapView;

// ======================================================
// STYLE
// ======================================================

const styles = StyleSheet.create({
  map: {
    flex: 1,

    position: "relative",

    overflow: "hidden",

    backgroundColor: "#DDE8DA",
  },

  marker: {
    position: "absolute",

    zIndex: 20,

    transform: [
      {
        translateX: -25,
      },

      {
        translateY: -25,
      },
    ],
  },

  circle: {
    position: "absolute",

    borderRadius: 9999,

    zIndex: 10,
  },
});
