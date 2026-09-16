import React, { forwardRef, useImperativeHandle } from "react";

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ======================================================
// WEB MAP FALLBACK
// ======================================================

type MapProps = {
  children?: React.ReactNode;
  style?: any;
  initialRegion?: any;
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
// MAP
// ======================================================

const MapView = forwardRef<any, MapProps>(({ children, style }, ref) => {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {
      // Native map animation is not required on web.
    },
  }));

  return (
    <View style={[styles.map, style]}>
      {/* MAP BACKGROUND */}

      <View style={styles.mapBackground} />

      {/* ROADS */}

      <View style={styles.roadHorizontal} />

      <View style={styles.roadVertical} />

      <View style={styles.roadDiagonal} />

      {/* DECORATION */}

      <View
        style={[
          styles.greenArea,
          {
            top: "13%",
            left: "8%",
          },
        ]}
      />

      <View
        style={[
          styles.greenArea,
          {
            bottom: "12%",
            right: "9%",
          },
        ]}
      />

      <View style={styles.mapLabel}>
        <Text style={styles.mapLabelTitle}>GPS MONSTER HUNTER</Text>

        <Text style={styles.mapLabelSub}>WEB MAP PREVIEW</Text>
      </View>

      {children}
    </View>
  );
});

MapView.displayName = "WebMapView";

// ======================================================
// MARKER
// ======================================================

export function Marker({ coordinate, children, onPress }: MarkerProps) {
  /*
    สร้างตำแหน่งจำลองจาก Coordinate
    เพื่อให้ Player / Monster ไม่ทับกันบน Web
  */

  const xSeed = Math.abs(Math.floor(coordinate.longitude * 1000000)) % 55;

  const ySeed = Math.abs(Math.floor(coordinate.latitude * 1000000)) % 45;

  const left = 20 + xSeed;

  const top = 24 + ySeed;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.marker,
        {
          left: `${left}%`,
          top: `${top}%`,
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
  strokeWidth = 2,
  strokeColor = "rgba(36,111,255,0.65)",
  fillColor = "rgba(36,111,255,0.10)",
}: CircleProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.circle,
        {
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

  mapBackground: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "#DDE8DA",
  },

  roadHorizontal: {
    position: "absolute",

    left: "-5%",

    right: "-5%",

    top: "46%",

    height: 55,

    backgroundColor: "#F7F4EC",

    borderTopWidth: 2,

    borderBottomWidth: 2,

    borderColor: "#DDD8CC",
  },

  roadVertical: {
    position: "absolute",

    top: "-5%",

    bottom: "-5%",

    left: "48%",

    width: 55,

    backgroundColor: "#F7F4EC",

    borderLeftWidth: 2,

    borderRightWidth: 2,

    borderColor: "#DDD8CC",
  },

  roadDiagonal: {
    position: "absolute",

    width: "150%",

    height: 34,

    left: "-20%",

    top: "68%",

    backgroundColor: "#F4F1E9",

    transform: [
      {
        rotate: "-12deg",
      },
    ],
  },

  greenArea: {
    position: "absolute",

    width: 150,

    height: 115,

    borderRadius: 30,

    backgroundColor: "#BFD7B4",
  },

  mapLabel: {
    position: "absolute",

    top: 150,

    left: 15,

    backgroundColor: "rgba(255,255,255,0.93)",

    paddingHorizontal: 12,

    paddingVertical: 8,

    borderRadius: 12,
  },

  mapLabelTitle: {
    color: "#111722",

    fontSize: 11,

    fontWeight: "900",
  },

  mapLabelSub: {
    color: "#697480",

    fontSize: 9,

    fontWeight: "800",

    marginTop: 2,
  },

  marker: {
    position: "absolute",

    zIndex: 10,

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

    width: 110,

    height: 110,

    borderRadius: 55,

    left: "50%",

    top: "50%",

    marginLeft: -55,

    marginTop: -55,

    zIndex: 2,
  },
});
