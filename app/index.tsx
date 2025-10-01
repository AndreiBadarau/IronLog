import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
const Logo = require('../assets/images/icon.png');

const Home = () => {
  return (
    <View style={styles.container}>

      <Image source={Logo} style={styles.logo}/> 


      <Text style={styles.title}>Home</Text>

      <Text style={{marginTop: 10, marginBottom: 30}}>
        Welcome to the Home Screen! </Text>

      <View style={styles.card}>
        <Text>This is a simple React Native app.</Text>
      </View>

    </View>

  
  )

}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    boxShadow: '4px 4px rgba(0,0,0,0.1)',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  }
})