import React, {useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  NativeEventEmitter,
  NativeModules,
  DeviceEventEmitter,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import BleManager from 'react-native-ble-manager';
import {Buffer} from 'buffer';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);

const WiFi_setup = () => {
  const peripherals = new Map();
  const route = useRoute();
  const {macID, selectedItem} = route.params;
  const navigation = useNavigation();
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [isSecureEntry, setSecureEntry] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // BLE Service and Characteristic UUIDs
  const HMGATEWAY_SERVICE = '80006769-666E-6F63-2020-726174532A41';
  const HMGATEWAY_CHARACTERISTIC_WIFI = '80016769-666E-6F63-2020-726174532A41';
  const HMGATEWAY_CHARACTERISTIC_GATEWAY =
    '80026769-666E-6F63-2020-726174532A41';

  // bleFunctionCallback states
  const BLE_FUNCTION_STATE__CONNECTED = 0x1; //params: [state][0: OK, -1: failed][connectedId]
  const BLE_FUNCTION_STATE__CHARACTERISTICS = 0x2; //params: [state][status][length][array]
  const BLE_FUNCTION_STATE__NOTIFICATION_STARTED = 0x3;
  const BLE_FUNCTION_STATE__FOUND_DEVICE = 0x4;
  const BLE_FUNCTION_STATE__WRITE_ERROR = 0x5;

  const bleFunctionCallback = null;
  const TAG = 'Bluetooth';

  const handleBackPress = () => {
    navigation.goBack();
  };

  const onCancelPressed = () => {
    navigation.navigate('Home');
  };

  const onConnectPressed = () => {
    if (isConnecting) return;

    setIsConnecting(true);

    // Check if selected item is already connected
    if (selectedItem.connected) {
      console.log(
        `Currently connected to ${selectedItem.name}. Disconnecting...`,
      );
      disconnectFromPeripheral(selectedItem);
    }

    // Connect to peripheral
    connectToPeripheral(selectedItem);

    setTimeout(() => {
      sendSsidPwd(selectedItem.id, ssid, password);
    }, 3000);

    setTimeout(() => {
      disconnectFromPeripheral(selectedItem);
    }, 8000);
  };

  const formatMacAddress = macID => {
    return macID.toLowerCase().replace(/:/g, '');
  };

  const displayMacID = formatMacAddress(macID) || '';

  //const connectToPeripheral = peripheral => {
  //  BleManager.connect(peripheral.id)
  //    .then(() => {
  //      console.log('Connected to device:', peripheral.id);
  //      return BleManager.retrieveServices(peripheral.id);
  //    })
  //    .then(deviceInfo => {
  //      peripheral.connected = true;
  //      peripherals.set(peripheral.id, peripheral);
  //      console.log('BLE device paired and connected successfully', deviceInfo);
  //    })
  //    .catch(error => {
  //      console.error('Connection error:', error);
  //    });
  //};

  const connectToPeripheral = async peripheral => {
    try {
      await BleManager.connect(peripheral.id);

      const deviceInfo = await BleManager.retrieveServices(peripheral.id);

      peripheral.connected = true;
      peripherals.set(peripheral.id, peripheral);

      await BleManager.startNotification(
        peripheral.id,
        HMGATEWAY_SERVICE,
        HMGATEWAY_CHARACTERISTIC_GATEWAY,
      );

      console.log('Started notifcation on ' + HMGATEWAY_CHARACTERISTIC_GATEWAY);

      DeviceEventEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleNotification,
      );
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleNotification = data => {
    const byteArray = data.value;
    const buffer = Buffer.from(byteArray);
    const text = buffer.toString('utf-8');

    console.log('Received notif: ', text);

    switch (text) {
      case 'OK':
        console.log('Received OK');
        break;

      case 'CON':
        console.log('Received CON');
        break;

      case 'NOK':
        console.log('Received NOK');
        break;

      case 'STA':
        console.log('Received STA');
        break;

      default:
        console.log('Received unknown value');
        break;
    }
    DeviceEventEmitter.removeAllListeners(
      'BleManagerDidUpdateValueForCharacteristic',
      handleNotification,
    );
  };

  // disconnect with device
  const disconnectFromPeripheral = peripheral => {
    BleManager.disconnect(peripheral.id)
      .then(() => {
        peripheral.connected = false;
        peripherals.set(peripheral.id, peripheral);
        Alert.alert('Alert', 'Successfully setup.', [
          {
            text: 'OK',
          },
        ]);
      })
      .catch(error => {
        console.log('failed to disconnect:', error);
      });

    navigation.navigate('Home');
  };

  const sendSsidPwd = (deviceId, SSID, pwd) => {
    if (!SSID || !pwd || !deviceId) return;

    const deviceid = deviceId + '';

    var pbytes = [];
    var idx = 2; // Start from index 2 as specified
    pbytes[0] = 0; // Initial byte
    pbytes[1] = SSID.length; // Length of SSID

    // Convert SSID to hex bytes
    for (var i = 0; i < SSID.length; i++) {
      pbytes[idx] = stringToHexByte(SSID[i]);
      idx++;
    }

    // Convert password to hex bytes
    for (var i = 0; i < pwd.length; i++) {
      pbytes[idx] = stringToHexByte(pwd[i]);
      idx++;
    }

    //pbytes[0] = idx;
    pbytes[0] = 1 + ssid.length + pwd.length; // Set the total length

    BleManager.write(
      deviceid,
      HMGATEWAY_SERVICE,
      HMGATEWAY_CHARACTERISTIC_WIFI,
      pbytes,
    )
      .then(() => {
        console.log(TAG, 'written!!!!!!!!!!');
      })
      .catch(error => {
        console.log(TAG, 'Error', error);
        if (bleFunctionCallback)
          bleFunctionCallback(BLE_FUNCTION_STATE__WRITE_ERROR, error);
      });
  };

  const stringToHexByte = str => {
    if (str !== undefined) {
      let bufferOne = Buffer.from(str);
      return bufferOne[0];
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#e8ecf4'}}>
      <View style={styles.container}>
        <View style={styles.background}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <AntDesign name="arrowleft" size={25} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}> WiFi Setup </Text>
        </View>

        <View style={styles.contentWrapper}>
          <View style={styles.input}>
            <Text style={styles.inputLabel}> Gateway MAC </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputControl}
                value={displayMacID}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.input}>
            <Text style={styles.inputLabel}> SSID </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.inputControl}
                placeholder=""
                placeholderTextColor=""
                value={ssid}
                onChangeText={newSsid => setSsid(String(newSsid))}
              />
            </View>
          </View>

          <View style={styles.input}>
            <Text style={styles.inputLabel}> Password </Text>
            <View style={[styles.inputContainer]}>
              <TextInput
                secureTextEntry={isSecureEntry}
                style={styles.inputControl}
                placeholder="Password"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={newpassword => setPassword(String(newpassword))}
              />
              <TouchableOpacity
                style={styles.icon}
                onPress={() => {
                  setSecureEntry(!isSecureEntry);
                }}>
                <FontAwesome5
                  name={isSecureEntry ? 'eye-slash' : 'eye'}
                  size={20}
                  color="black"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.buttonContainerSpace}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, isConnecting && styles.disabledButton]}
                onPress={onCancelPressed}
                disabled={isConnecting}>
                <Text
                  style={
                    isConnecting ? styles.disabledButtonText : styles.buttonText
                  }>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, isConnecting && styles.disabledButton]}
                onPress={onConnectPressed}
                disabled={isConnecting}>
                <Text
                  style={
                    isConnecting ? styles.disabledButtonText : styles.buttonText
                  }>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contentWrapper: {
    flex: 1,
    marginTop: 20,
    position: 'relative',
  },

  inputContainer: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: 'e8ecf4',
    width: '95%',
  },

  buttonContainerSpace: {
    paddingTop: 20,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    paddingLeft: 30,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  },

  background: {
    width: '100%',
    height: 75,
    backgroundColor: '#0F52BA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backButton: {
    marginTop: 50,
    position: 'absolute',
    left: 20,
    top: -15,
  },

  button: {
    flex: 1,
    backgroundColor: '#0F52BA',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1C1C1C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 20,
  },

  buttonText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#fff',
  },

  disabledButton: {
    backgroundColor: '#d3d3d3',
  },

  disabledButtonText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
  },

  input: {
    marginLeft: 20,
    marginBottom: 15,
  },

  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 10,
  },

  inputControl: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    fontWeight: '500',
    color: '#222',
    paddingRight: 40,
  },

  icon: {
    position: 'absolute',
    right: 10,
    top: 8,
    height: 30,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WiFi_setup;
