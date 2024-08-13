import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  Platform,
  StatusBar,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  useColorScheme,
  TouchableOpacity,
  Alert,
  FlatList,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {PermissionsAndroid} from 'react-native';
import BleManager from 'react-native-ble-manager';
import AntDesign from 'react-native-vector-icons/AntDesign';

import theme, {appColors, appFonts} from '../../../defaults/App.theme';

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const WiFi = () => {
  const peripherals = new Map();
  const navigation = useNavigation();
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [macID, setMacID] = useState('');

  const isItemSelected = selectedItemId !== null;

  const renderItem = ({item}) => {
    //console.log(item);
    const isSelected = selectedItemId === item.id;

    const containerStyle = [
      styles.deviceContainer,
      isSelected && {backgroundColor: '#ADD8E6'},
    ];
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={() => handleItemPress(item)}>
        <Text style={styles.deviceName}>
          {item.name} {'  '} ({item.id})
        </Text>
      </TouchableOpacity>
    );
  };

  const startScan = () => {
    if (!isScanning) {
      BleManager.scan([], 8, false)
        .then(() => {
          setIsScanning(true);
        })
        .catch(error => {
          console.error('Scan error:', error);
        });

      const handler = BleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        device => {
          if (device && device.name) {
            //console.log(`(${device.id})`);

            setDevices(prevDevices => {
              // Check if the device already exists in the list
              const existingDeviceIndex = prevDevices.findIndex(
                d => d.id === device.id,
              );

              if (existingDeviceIndex >= 0) {
                // Update existing device informaiton
                const updatedDevices = [...prevDevices];
                updatedDevices[existingDeviceIndex].name =
                  device.name || 'Unnamed Device';
                return updatedDevices;
              }

              //Add new device to the list
              const newDevices = [
                ...prevDevices,
                {
                  id: device.id,
                  name: device.name || 'Unnamed Device',
                },
              ];
              return newDevices;
            });
          }
        },
      );
      return () => {
        handler.remove();
      };
    }
  };

  const requestBluetoothPermission = async () => {
    if (
      Platform.OS === 'android' &&
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    ) {
      const apiLevel = parseInt(Platform.Version.toString(), 10);

      if (
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN &&
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      ) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          result['android.permission.BLUETOOTH_CONNECT'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }
    }

    this.showErrorToast('Permission have not been granted');

    return false;
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleConnect = () => {
    navigation.navigate('WiFi_setup', {macID, selectedItem});
  };

  const handleRefresh = () => {
    navigation.navigate('Home');

    setTimeout(() => {
      navigation.navigate('WiFi');
    }, 500);
  };

  const handleItemPress = item => {
    setSelectedItem(item);
    setSelectedItemId(item.id);
    setMacID(item.id);
    BleManager.stopScan();
    1;
  };

  useEffect(() => {
    BleManager.enableBluetooth().then(() => {});
    BleManager.start({showAlert: false}).then(() => {});

    let stopDiscoverListener = BleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      peripheral => {
        peripherals.set(peripheral.id, peripheral);
        setDiscoveredDevices(Array.from(peripherals.values()));
      },
    );

    let stopConnectListener = BleManagerEmitter.addListener(
      'BleManagerConnectPeripheral',
      peripheral => {
        console.log('BleManagerConnectPeripheral:', peripheral);
      },
    );

    let stopScanListener = BleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        setIsScanning(false);
        console.log('scan stopped');
      },
    );

    requestBluetoothPermission();
    startScan();

    return () => {
      stopDiscoverListener.remove();
      stopConnectListener.remove();
      stopScanListener.remove();
    };
  }, []);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#e8ecf4'}}>
      <View style={styles.container}>
        <View style={styles.background}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <AntDesign name="arrowleft" size={25} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}> Device List </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}>
            <AntDesign name="reload1" size={25} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.listContainer}>
          <FlatList
            data={devices}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.flatListContent}
          />
        </View>
        <View style={styles.connectContainer}>
          <TouchableOpacity
            style={[styles.button, !isItemSelected && styles.buttonDisabled]}
            onPress={() => {
              if (isItemSelected && selectedItemId) {
                handleConnect(selectedItemId);
              } else {
                console.log('No item selected or item not available');
              }
            }}
            disabled={!isItemSelected}>
            <Text
              style={[
                styles.buttonText,
                !isItemSelected && styles.buttonTextDisabled,
              ]}>
              Connect
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const windowHeight = Dimensions.get('window').height;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: windowHeight,
  },

  listContainer: {
    paddingTop: 20,
    paddingLeft: 5,
    flex: 1,
    flexDirection: 'column',
  },

  connectContainer: {
    marginVertical: 10,
    flex: 0.1,
  },

  title: {
    fontSize: theme.sizes.xxl,
    fontWeight: theme.appFonts.extraBold,
    color: theme.appColors.white,
    marginTop: 20,
    textAlign: 'center',
  },

  background: {
    backgroundColor: '#0F52BA',
    width: '100%',
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  backButton: {
    marginTop: 50,
    position: 'absolute',
    left: 20,
    top: -15,
  },

  refreshButton: {
    position: 'absolute',
    right: 20,
    bottom: 18,
  },

  button: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#0F52BA',
    width: '90%',
    borderRadius: 10,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },

  buttonText: {
    fontSize: theme.sizes.xxl,
    fontWeight: '400',
    color: theme.appColors.white,
  },

  buttonDisabled: {
    backgroundColor: '#d3d3d3',
  },

  buttonTextDisabled: {
    color: 'gray',
  },

  deviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.appColors.grey10,
    borderRadius: 5,
    backgroundColor: theme.appColors.white,
  },

  deviceName: {
    fontSize: theme.sizes.extraMedium,
    fontWeight: 'bold',
    color: theme.appColors.black,
  },

  flatListContent: {
    paddingBottom: 60,
  },
});

export default WiFi;
