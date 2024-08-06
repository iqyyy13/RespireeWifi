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

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const WiFi = () => {
  const peripherals = new Map();
  const navigation = useNavigation();
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [macID, setMacID] = useState('');

  const isItemSelected = selectedItemId !== null;

  const renderItem = ({item}) => {
    //console.log(item);
    return (
      <TouchableOpacity
        style={styles.deviceContainer}
        onPress={() => handleItemPress(item)}>
        <Text style={styles.deviceName}>
          {item.name} {'   '} ({item.id})
        </Text>
        {selectedItemId === item.id && (
          <AntDesign name="checkcircleo" size={25} color="green" />
        )}
      </TouchableOpacity>
    );
  };

  const startScan = () => {
    if (!isScanning) {
      BleManager.scan([], 8, false)
        .then(() => {
          console.log('Scanning...');
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
                //return [
                ...prevDevices,
                {
                  id: device.id,
                  name: device.name || 'Unnamed Device',
                },
              ];
              //console.log("Devices List:", newDevices);
              return newDevices;
            });
          } //console.log('Discovered device:', device);
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

  const handleConnect = item => {
    console.log('Navigating to WiFi Setup Page for ', item);
    navigation.navigate('WiFi_setup', {macID, selectedItem});
  };

  const handleRefresh = () => {
    console.log('refreshing...');
    navigation.navigate('Home');

    setTimeout(() => {
      navigation.navigate('WiFi');
    }, 500);
  };

  const handleItemPress = item => {
    setSelectedItem(item);
    setSelectedItemId(item.id);
    console.log(`Item pressed: ${item.name}`);
    console.log(`MAC ID: ${item.id}`);
    setMacID(item.id);
    BleManager.stopScan();
    console.log('Scan stopped');
  };

  useEffect(() => {
    BleManager.enableBluetooth().then(() => {
      console.log('Bluetooth is turned on');
    });
    BleManager.start({showAlert: false}).then(() => {
      console.log('BleManager initialized');
    });

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
    console.log('requested');
    startScan();
    console.log('scanned');

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
                console.log('Button pressed');
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

  header: {
    marginVertical: 10,
  },

  title: {
    fontSize: 20,
    fontWeight: '400',
    color: 'white',
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
    fontSize: 22,
    fontWeight: '400',
    color: '#fff',
  },

  buttonDisabled: {
    backgroundColor: '#d3d3d3',
  },

  buttonTextDisabled: {
    color: 'gray',
  },

  bottomtext: {
    fontSize: 18,
    fontWeight: '600',
  },

  deviceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    backgroundColor: 'white',
  },

  deviceItem: {
    fontSize: 16,
    marginBottom: 10,
  },

  deviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },

  deviceInfo: {
    fontSize: 14,
  },

  deviceButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  flatListContent: {
    paddingBottom: 60,
  },
});

export default WiFi;
