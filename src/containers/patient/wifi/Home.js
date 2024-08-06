import React, {useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const Home = () => {
  const navigation = useNavigation();

  const onWiFiPressed = () => {
    console.log('WiFi login');
    navigation.navigate('WiFi');
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#e8ecf4'}}>
      <StatusBar backgroundColor={'#0F52BA'}></StatusBar>
      <View style={styles.container}>
        <View style={styles.background}>
          <Text style={styles.title}> Home </Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={onWiFiPressed}>
          <Text style={styles.buttonText}>WiFi Setup</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    marginVertical: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 5,
    textAlign: 'center',
  },

  background: {
    width: '100%',
    height: 75,
    backgroundColor: '#0F52BA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  button: {
    backgroundColor: '#0F52BA',
    width: 300,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1C1C1C',
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 30,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  buttonText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#fff',
  },

  bottomtext: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default Home;
