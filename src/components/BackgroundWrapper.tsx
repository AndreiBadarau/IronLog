import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

interface BackgroundWrapperProps {
  children: React.ReactNode;
}

export default function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/background.jpeg')}
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={7} // Built-in blur effect
      >
        <View style={styles.overlay}>
          {children}
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for better text readability over blurred image
  },
});