import React from 'react';
import { Image, StyleSheet } from 'react-native';

export const Logo = () => {
  return (
    <Image 
      source={require('../assets/images/logo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 650,
    height: 280,
    marginBottom: 50,
  },
});