import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Accelerometer, Gyroscope } from 'expo-sensors';

export default function App() {
  const [isDeadReckoning, setIsDeadReckoning] = useState(false);
  const [predictedSpeed, setPredictedSpeed] = useState<number>(0);
  const [accData, setAccData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [posX, setPosX] = useState(160);
  const [posY, setPosY] = useState(120);
  const [pathHistory, setPathHistory] = useState<{ x: number; y: number }[]>([{ x: 160, y: 120 }]);

  // Sensor data stream handling
  useEffect(() => {
    let subAcc: any;
    let subGyro: any;
    let timer: any;

    if (Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(100);
      Gyroscope.setUpdateInterval(100);

      subAcc = Accelerometer.addListener(data => setAccData(data));
      subGyro = Gyroscope.addListener(data => setGyroData(data));
    } else {
      timer = setInterval(() => {
        setAccData({
          x: Number((Math.random() * 0.4 - 0.2).toFixed(3)),
          y: Number((Math.random() * 1.8 + 1.2).toFixed(3)),
          z: Number((Math.random() * 0.2 + 9.7).toFixed(3)),
        });
        setGyroData({
          x: Number((Math.random() * 0.05 - 0.025).toFixed(3)),
          y: Number((Math.random() * 0.05 - 0.025).toFixed(3)),
          z: Number((Math.random() * 0.08 - 0.04).toFixed(3)),
        });
      }, 100);
    }

    return () => {
      if (subAcc) subAcc.remove();
      if (subGyro) subGyro.remove();
      if (timer) clearInterval(timer);
    };
  }, []);

  // Update position math on telemetry ticks
  useEffect(() => {
    if (isDeadReckoning) {
      const dt = 0.1;
      const headingRad = gyroData.z;
      const speed = Math.sqrt(accData.x ** 2 + accData.y ** 2) * 3.6;

      setPredictedSpeed(Number(speed.toFixed(1)));

      setPosX(prevX => {
        const nextX = Math.min(Math.max(prevX + speed * Math.cos(headingRad) * dt * 1.2, 20), 300);
        setPosY(prevY => {
          const nextY = Math.min(Math.max(prevY + speed * Math.sin(headingRad) * dt * 1.2, 20), 220);
          setPathHistory(prev => [...prev.slice(-50), { x: nextX, y: nextY }]);
          return nextY;
        });
        return nextX;
      });
    } else {
      setPredictedSpeed(0);
    }
  }, [accData, gyroData, isDeadReckoning]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HUD Header Bar */}
      <View style={styles.hudHeader}>
        <View style={styles.brandGroup}>
          <View style={styles.brandIcon} />
          <View>
            <Text style={styles.hudTitle}>IDR ENGINE v2.4</Text>
            <Text style={styles.hudSub}>INTELLIGENT DEAD RECKONING HARDWARE SUITE</Text>
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.liveText}>10 Hz RUNTIME</Text>
        </View>
      </View>

      {/* Primary Mode Banner */}
      <View style={[styles.statusBox, isDeadReckoning ? styles.statusBoxDR : styles.statusBoxGNSS]}>
        <View>
          <Text style={styles.statusCaption}>CURRENT OPERATIONAL STATE</Text>
          <Text style={[styles.statusMainText, isDeadReckoning ? styles.textDR : styles.textGNSS]}>
            {isDeadReckoning ? 'INS / DEAD RECKONING MODE' : 'PRIMARY GNSS LOCK ACTIVE'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.actionBtn, isDeadReckoning ? styles.btnRestore : styles.btnBlackout]} 
          onPress={() => setIsDeadReckoning(!isDeadReckoning)}
        >
          <Text style={styles.actionBtnText}>
            {isDeadReckoning ? 'RESTORE GNSS' : 'TRIGGER BLACKOUT'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Radar Canvas / Trajectory Visualization */}
      <View style={styles.hudPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>NAVIGATION MAP & TRAJECTORY VECTOR</Text>
          <Text style={styles.gridMeta}>COORDS: LAT/LON LOCAL</Text>
        </View>

        <View style={styles.radarFrame}>
          {/* HUD Crosshairs */}
          <View style={styles.crosshairV} />
          <View style={styles.crosshairH} />
          <View style={styles.radarRing1} />
          <View style={styles.radarRing2} />

          {/* Historical Path Tracing */}
          {pathHistory.map((pt, idx) => (
            <View 
              key={idx} 
              style={[
                styles.trailPoint, 
                { left: pt.x, top: pt.y, opacity: (idx + 1) / pathHistory.length }
              ]} 
            />
          ))}

          {/* Active Target Marker */}
          <View style={[styles.targetMarker, { left: posX - 8, top: posY - 8 }]}>
            <View style={styles.targetCore} />
          </View>
        </View>
      </View>

      {/* Main Metrics Dashboard */}
      <View style={styles.metricsRow}>
        <View style={[styles.hudPanel, styles.metricTile]}>
          <Text style={styles.metricLabel}>ESTIMATED VEHICLE SPEED</Text>
          <View style={styles.valGroup}>
            <Text style={styles.metricValue}>{predictedSpeed}</Text>
            <Text style={styles.metricUnit}>KM/H</Text>
          </View>
        </View>

        <View style={[styles.hudPanel, styles.metricTile]}>
          <Text style={styles.metricLabel}>DELTA DISPLACEMENT (X, Y)</Text>
          <View style={styles.valGroup}>
            <Text style={styles.metricValue}>
              {posX.toFixed(0)}, {posY.toFixed(0)}
            </Text>
            <Text style={styles.metricUnit}>METERS</Text>
          </View>
        </View>
      </View>

      {/* Raw Sensor Telemetry Console */}
      <View style={styles.hudPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>6-AXIS IMU HARDWARE TELEMETRY</Text>
          <Text style={styles.gridMeta}>SAMPLING @ 100ms</Text>
        </View>

        <View style={styles.consoleBox}>
          <View style={styles.consoleRow}>
            <Text style={styles.consoleTag}>ACCEL [X,Y,Z]:</Text>
            <Text style={styles.consoleVal}>{accData.x.toFixed(3)}g | {accData.y.toFixed(3)}g | {accData.z.toFixed(3)}g</Text>
          </View>
          <View style={styles.consoleRow}>
            <Text style={styles.consoleTag}>GYRO  [X,Y,Z]:</Text>
            <Text style={styles.consoleVal}>{gyroData.x.toFixed(3)} | {gyroData.y.toFixed(3)} | {gyroData.z.toFixed(3)} rad/s</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 18, backgroundColor: '#05080e', alignItems: 'center' },
  hudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  brandGroup: { flexDirection: 'row', alignItems: 'center' },
  brandIcon: { width: 10, height: 28, backgroundColor: '#00f2fe', marginRight: 10, borderRadius: 2 },
  hudTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  hudSub: { color: '#64748b', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0284c715', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#0384c744' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00f2fe', marginRight: 6 },
  liveText: { color: '#38bdf8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statusBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: 16, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  statusBoxGNSS: { backgroundColor: '#022c2244', borderColor: '#059669' },
  statusBoxDR: { backgroundColor: '#451a0344', borderColor: '#ea580c' },
  statusCaption: { color: '#94a3b8', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  statusMainText: { fontSize: 13, fontWeight: '900', marginTop: 2, letterSpacing: 1 },
  textGNSS: { color: '#10b981' },
  textDR: { color: '#ff5e00' },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6 },
  btnBlackout: { backgroundColor: '#ff5e00' },
  btnRestore: { backgroundColor: '#334155' },
  actionBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  hudPanel: { backgroundColor: '#0b111e', borderRadius: 8, borderWidth: 1, borderColor: '#1e293b', width: '100%', padding: 14, marginBottom: 16 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { color: '#94a3b8', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  gridMeta: { color: '#475569', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  radarFrame: { height: 240, backgroundColor: '#020408', borderRadius: 6, position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#0f172a' },
  crosshairV: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: '#1e293b' },
  crosshairH: { position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: '#1e293b' },
  radarRing1: { position: 'absolute', left: '25%', top: '15%', width: '50%', height: '70%', borderRadius: 100, borderWidth: 1, borderColor: '#1e293b33' },
  radarRing2: { position: 'absolute', left: '10%', top: '5%', width: '80%', height: '90%', borderRadius: 200, borderWidth: 1, borderColor: '#1e293b22' },
  trailPoint: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#00f2fe', position: 'absolute' },
  targetMarker: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#00f2fe', position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: '#00f2fe22' },
  targetCore: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff0055' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  metricTile: { width: '48%' },
  metricLabel: { color: '#64748b', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  valGroup: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  metricValue: { color: '#f8fafc', fontSize: 26, fontWeight: '900', marginRight: 6 },
  metricUnit: { color: '#00f2fe', fontSize: 10, fontWeight: '800' },
  consoleBox: { backgroundColor: '#020408', padding: 10, borderRadius: 4, borderWidth: 1, borderColor: '#0f172a' },
  consoleRow: { flexDirection: 'row', marginVertical: 3 },
  consoleTag: { color: '#64748b', fontSize: 11, width: 110, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontWeight: '700' },
  consoleVal: { color: '#00f2fe', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
