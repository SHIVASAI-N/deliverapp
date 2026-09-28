import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { RiderHomeScreen } from './src/screens/RiderHomeScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0c0a09" />
      <RiderHomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0c0a09',
  },
});
