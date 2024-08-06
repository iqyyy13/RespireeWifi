import {Dimensions, Platform, PixelRatio, Alert} from 'react-native';
import {isEmpty} from 'lodash';
import CountryList from '../defaults/App.countries';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

export const emailValidation =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

export const phoneNumberValidation =
  /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

export const usernameValidate = /^[A-Za-z][A-Za-z0-9]*$/;

export const passwordValidate =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])[a-zA-Z0-9_\S]{8,}$/g;

export const validateCountry = countryName => {
  if (isEmpty(countryName)) {
    return '';
  }
  const findCountry = CountryList.find(
    country => country?.name === countryName,
  );

  return findCountry ? countryName : '';
};

export const displayName = (user, isRoleNeeded = false) => {
  const role = user?.role ? user?.role : '';
  const withRole = `${user?.username}-(${role})`;
  const withOutRole = `${user?.username}`;

  return isRoleNeeded ? withRole : withOutRole;
};

export const truncateString = (str, num) => {
  if (!str) {
    return 'Attachment';
  }
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + '...';
};

const {width, height} = Dimensions.get('window');

//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

const scale = size => (width / guidelineBaseWidth) * size;
const verticalScale = size => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export {scale, verticalScale, moderateScale};

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// based on iphone 5s's scale
const _scale = SCREEN_WIDTH / 320;

export function normalize(size) {
  const newSize = size * _scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
}

const percentageCalculation = (max: number, val: number) => max * (val / 100);

export const fontCalculation = (val: number) => {
  const widthDimension =
    SCREEN_HEIGHT > SCREEN_WIDTH ? SCREEN_WIDTH : SCREEN_HEIGHT;
  const aspectRatioBasedHeight = (16 / 9) * widthDimension;
  return percentageCalculation(
    Math.sqrt(
      Math.pow(aspectRatioBasedHeight, 2) + Math.pow(widthDimension, 2),
    ),
    val,
  );
};

export const checkCameraPermissionAllowed = async () => {
  const blocked = [RESULTS.DENIED, RESULTS.BLOCKED, RESULTS.BLOCKED];
  const notAvailable = [RESULTS.UNAVAILABLE];

  const _platForm =
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.CAMERA
      : Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : undefined;

  if (!_platForm) {
    return false;
  }
  try {
    const permission = await check(_platForm);

    if (blocked.includes(permission)) {
      return true;
    } else if (notAvailable.includes(permission)) {
      Alert.alert('Sorry,this feature is not available on this device!.');
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const checkStorageORIOSPhotoLibraryPermissionAllowed = async () => {
  const blocked = [RESULTS.DENIED, RESULTS.BLOCKED, RESULTS.BLOCKED];
  const notAvailable = [RESULTS.UNAVAILABLE];

  const _platForm =
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
      : Platform.OS === 'ios'
      ? PERMISSIONS.IOS.PHOTO_LIBRARY
      : undefined;

  if (!_platForm) {
    return false;
  }
  try {
    const permission = await check(_platForm);
    if (blocked.includes(permission)) {
      return true;
    } else if (notAvailable.includes(permission)) {
      Alert.alert('Sorry,this feature is not available on this device!.');
      return false;
    }
  } catch (error) {
    return false;
  }
};

const requestNotificationPermission = async () => {
  const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
  return result;
};

const checkNotificationPermission = async () => {
  const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
  return result;
};

export const checkAndroidPostNotificationPermissions = async () => {
  const checkPermission = await checkNotificationPermission();
  if (checkPermission !== RESULTS.GRANTED) {
    const request = await requestNotificationPermission();
    if (request !== RESULTS.GRANTED) {
      // permission not granted
    }
  }
};

/**
 * @param {*} timezone - a valid timezone eg:continent/country
 * @returns {string} utcOffset - ±HH:mm
 * if no timezone params were passed the this function
 * will automatically guess timeszone based on system time
 */
export const getTimezoneOffset = (timezone = '') => {
  const guessedZone = dayjs.tz.guess();
  const _zone = timezone ? timezone : guessedZone;
  const utcOffset = dayjs(new Date()).tz(_zone).format('Z');

  return utcOffset;
};

export const removeAllBlankObjects = detailsObj => {
  Object.keys(detailsObj).forEach(k => {
    if (
      detailsObj[k] &&
      typeof detailsObj[k] === 'object' &&
      removeAllBlankObjects(detailsObj[k]) === null
    ) {
      delete detailsObj[k];
    }
  });
  if (!Object.keys(detailsObj).length) {
    return null;
  }
};

export const checkKeyPresenceInArray = (arrOfObj, key) =>
  arrOfObj.some(obj => Object.keys(obj).includes(key));

export const filterTwoArraysByReference = (origArr, updatingArr) => {
  if (!isEmpty(origArr) && !isEmpty(updatingArr)) {
    const result = Array.from(
      [...origArr, ...updatingArr]
        .reduce((m, o) => m.set(o.id, o), new Map())
        .values(),
    );

    return result;
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const formatBytes = bytes => {
  const bytesToMb = bytes / 1024 ** 2;
  return bytesToMb;
};
