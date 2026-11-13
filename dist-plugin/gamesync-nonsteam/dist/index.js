const manifest = {"name":"GameSync NonSteam"};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const call = api.call;
const routerHook = api.routerHook;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } } return target; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), true).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var {
        attr,
        size,
        title
      } = props,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaBan (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256 8C119.034 8 8 119.033 8 256s111.034 248 248 248 248-111.034 248-248S392.967 8 256 8zm130.108 117.892c65.448 65.448 70 165.481 20.677 235.637L150.47 105.216c70.204-49.356 170.226-44.735 235.638 20.676zM125.892 386.108c-65.448-65.448-70-165.481-20.677-235.637L361.53 406.784c-70.203 49.356-170.226 44.736-235.638-20.676z"},"child":[]}]})(props);
}function FaChartBar (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M332.8 320h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-288 0h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zM496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z"},"child":[]}]})(props);
}function FaCheck (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"},"child":[]}]})(props);
}function FaClock (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M256,8C119,8,8,119,8,256S119,504,256,504,504,393,504,256,393,8,256,8Zm92.49,313h0l-20,25a16,16,0,0,1-22.49,2.5h0l-67-49.72a40,40,0,0,1-15-31.23V112a16,16,0,0,1,16-16h32a16,16,0,0,1,16,16V256l58,42.5A16,16,0,0,1,348.49,321Z"},"child":[]}]})(props);
}function FaCloudDownloadAlt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4zm-132.9 88.7L299.3 420.7c-6.2 6.2-16.4 6.2-22.6 0L171.3 315.3c-10.1-10.1-2.9-27.3 11.3-27.3H248V176c0-8.8 7.2-16 16-16h48c8.8 0 16 7.2 16 16v112h65.4c14.2 0 21.4 17.2 11.3 27.3z"},"child":[]}]})(props);
}function FaCloudUploadAlt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4zM393.4 288H328v112c0 8.8-7.2 16-16 16h-48c-8.8 0-16-7.2-16-16V288h-65.4c-14.3 0-21.4-17.2-11.3-27.3l105.4-105.4c6.2-6.2 16.4-6.2 22.6 0l105.4 105.4c10.1 10.1 2.9 27.3-11.3 27.3z"},"child":[]}]})(props);
}function FaCloud (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M537.6 226.6c4.1-10.7 6.4-22.4 6.4-34.6 0-53-43-96-96-96-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32c-88.4 0-160 71.6-160 160 0 2.7.1 5.4.2 8.1C40.2 219.8 0 273.2 0 336c0 79.5 64.5 144 144 144h368c70.7 0 128-57.3 128-128 0-61.9-44-113.6-102.4-125.4z"},"child":[]}]})(props);
}function FaCog (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"},"child":[]}]})(props);
}function FaDatabase (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M448 73.143v45.714C448 159.143 347.667 192 224 192S0 159.143 0 118.857V73.143C0 32.857 100.333 0 224 0s224 32.857 224 73.143zM448 176v102.857C448 319.143 347.667 352 224 352S0 319.143 0 278.857V176c48.125 33.143 136.208 48.572 224 48.572S399.874 209.143 448 176zm0 160v102.857C448 479.143 347.667 512 224 512S0 479.143 0 438.857V336c48.125 33.143 136.208 48.572 224 48.572S399.874 369.143 448 336z"},"child":[]}]})(props);
}function FaDownload (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"},"child":[]}]})(props);
}function FaEdit (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"},"child":[]}]})(props);
}function FaExclamationTriangle (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"},"child":[]}]})(props);
}function FaFolderOpen (props) {
  return GenIcon({"attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M572.694 292.093L500.27 416.248A63.997 63.997 0 0 1 444.989 448H45.025c-18.523 0-30.064-20.093-20.731-36.093l72.424-124.155A64 64 0 0 1 152 256h399.964c18.523 0 30.064 20.093 20.73 36.093zM152 224h328v-48c0-26.51-21.49-48-48-48H272l-64-64H48C21.49 64 0 85.49 0 112v278.046l69.077-118.418C86.214 242.25 117.989 224 152 224z"},"child":[]}]})(props);
}function FaGamepad (props) {
  return GenIcon({"attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M480.07 96H160a160 160 0 1 0 114.24 272h91.52A160 160 0 1 0 480.07 96zM248 268a12 12 0 0 1-12 12h-52v52a12 12 0 0 1-12 12h-24a12 12 0 0 1-12-12v-52H84a12 12 0 0 1-12-12v-24a12 12 0 0 1 12-12h52v-52a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v52h52a12 12 0 0 1 12 12zm216 76a40 40 0 1 1 40-40 40 40 0 0 1-40 40zm64-96a40 40 0 1 1 40-40 40 40 0 0 1-40 40z"},"child":[]}]})(props);
}function FaHistory (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M504 255.531c.253 136.64-111.18 248.372-247.82 248.468-59.015.042-113.223-20.53-155.822-54.911-11.077-8.94-11.905-25.541-1.839-35.607l11.267-11.267c8.609-8.609 22.353-9.551 31.891-1.984C173.062 425.135 212.781 440 256 440c101.705 0 184-82.311 184-184 0-101.705-82.311-184-184-184-48.814 0-93.149 18.969-126.068 49.932l50.754 50.754c10.08 10.08 2.941 27.314-11.313 27.314H24c-8.837 0-16-7.163-16-16V38.627c0-14.254 17.234-21.393 27.314-11.314l49.372 49.372C129.209 34.136 189.552 8 256 8c136.81 0 247.747 110.78 248 247.531zm-180.912 78.784l9.823-12.63c8.138-10.463 6.253-25.542-4.21-33.679L288 256.349V152c0-13.255-10.745-24-24-24h-16c-13.255 0-24 10.745-24 24v135.651l65.409 50.874c10.463 8.137 25.541 6.253 33.679-4.21z"},"child":[]}]})(props);
}function FaPlus (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"},"child":[]}]})(props);
}function FaRedo (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M500.33 0h-47.41a12 12 0 0 0-12 12.57l4 82.76A247.42 247.42 0 0 0 256 8C119.34 8 7.9 119.53 8 256.19 8.1 393.07 119.1 504 256 504a247.1 247.1 0 0 0 166.18-63.91 12 12 0 0 0 .48-17.43l-34-34a12 12 0 0 0-16.38-.55A176 176 0 1 1 402.1 157.8l-101.53-4.87a12 12 0 0 0-12.57 12v47.41a12 12 0 0 0 12 12h200.33a12 12 0 0 0 12-12V12a12 12 0 0 0-12-12z"},"child":[]}]})(props);
}function FaSave (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"},"child":[]}]})(props);
}function FaServer (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M480 160H32c-17.673 0-32-14.327-32-32V64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm112 248H32c-17.673 0-32-14.327-32-32v-64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm112 248H32c-17.673 0-32-14.327-32-32v-64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24z"},"child":[]}]})(props);
}function FaSlidersH (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M496 384H160v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h80v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h336c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160h-80v-16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h336v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h80c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm0-160H288V48c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v16H16C7.2 64 0 71.2 0 80v32c0 8.8 7.2 16 16 16h208v16c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-16h208c8.8 0 16-7.2 16-16V80c0-8.8-7.2-16-16-16z"},"child":[]}]})(props);
}function FaSyncAlt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M370.72 133.28C339.458 104.008 298.888 87.962 255.848 88c-77.458.068-144.328 53.178-162.791 126.85-1.344 5.363-6.122 9.15-11.651 9.15H24.103c-7.498 0-13.194-6.807-11.807-14.176C33.933 94.924 134.813 8 256 8c66.448 0 126.791 26.136 171.315 68.685L463.03 40.97C478.149 25.851 504 36.559 504 57.941V192c0 13.255-10.745 24-24 24H345.941c-21.382 0-32.09-25.851-16.971-40.971l41.75-41.749zM32 296h134.059c21.382 0 32.09 25.851 16.971 40.971l-41.75 41.75c31.262 29.273 71.835 45.319 114.876 45.28 77.418-.07 144.315-53.144 162.787-126.849 1.344-5.363 6.122-9.15 11.651-9.15h57.304c7.498 0 13.194 6.807 11.807 14.176C478.067 417.076 377.187 504 256 504c-66.448 0-126.791-26.136-171.315-68.685L48.97 471.03C33.851 486.149 8 475.441 8 454.059V320c0-13.255 10.745-24 24-24z"},"child":[]}]})(props);
}function FaTimes (props) {
  return GenIcon({"attr":{"viewBox":"0 0 352 512"},"child":[{"tag":"path","attr":{"d":"M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"},"child":[]}]})(props);
}function FaTrash (props) {
  return GenIcon({"attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"},"child":[]}]})(props);
}function FaUndoAlt (props) {
  return GenIcon({"attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M255.545 8c-66.269.119-126.438 26.233-170.86 68.685L48.971 40.971C33.851 25.851 8 36.559 8 57.941V192c0 13.255 10.745 24 24 24h134.059c21.382 0 32.09-25.851 16.971-40.971l-41.75-41.75c30.864-28.899 70.801-44.907 113.23-45.273 92.398-.798 170.283 73.977 169.484 169.442C423.236 348.009 349.816 424 256 424c-41.127 0-79.997-14.678-110.63-41.556-4.743-4.161-11.906-3.908-16.368.553L89.34 422.659c-4.872 4.872-4.631 12.815.482 17.433C133.798 479.813 192.074 504 256 504c136.966 0 247.999-111.033 248-247.998C504.001 119.193 392.354 7.755 255.545 8z"},"child":[]}]})(props);
}

/** Единая палитра интерфейса (совместима с тёмной темой Steam). */
const colors = {
    text: "#e8eaed",
    muted: "#9aa0a6",
    dim: "#71767b",
    success: "#5bb85b",
    error: "#e06060",
    warning: "#e0a94a",
    accent: "#66aaff",
    card: "rgba(255, 255, 255, 0.05)",
    border: "rgba(255, 255, 255, 0.08)",
};
const radius = { sm: 6, md: 8 };
const card = {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: "8px 10px",
    width: "100%",
    boxSizing: "border-box",
};
const dimText = {
    fontSize: "11px",
    color: colors.dim,
    lineHeight: 1.4,
};
const actionRow = {
    display: "flex",
    gap: "8px",
    alignItems: "stretch",
    width: "100%",
};

const toneColor = {
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.accent,
};
const toneBg = {
    success: "rgba(91, 184, 91, 0.12)",
    error: "rgba(224, 96, 96, 0.12)",
    warning: "rgba(224, 169, 74, 0.12)",
    info: "rgba(102, 170, 255, 0.12)",
};
/** Короткая подсказка под заголовком. */
function Hint({ children }) {
    return SP_JSX.jsx("div", { style: { fontSize: "12px", color: colors.muted, lineHeight: 1.4 }, children: children });
}
/** Цветное сообщение статуса (успех/ошибка/предупреждение). */
function StatusMessage({ tone, children }) {
    return (SP_JSX.jsx("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 10px",
            borderRadius: radius.sm,
            background: toneBg[tone],
            borderLeft: `3px solid ${toneColor[tone]}`,
            color: colors.text,
            fontSize: "12px",
            lineHeight: 1.4,
            width: "100%",
            boxSizing: "border-box",
        }, children: children }));
}
/** Небольшой цветной бейдж. */
function Badge({ tone = "info", children }) {
    return (SP_JSX.jsx("span", { style: {
            display: "inline-block",
            padding: "1px 7px",
            borderRadius: "999px",
            fontSize: "10px",
            fontWeight: 600,
            color: toneColor[tone],
            background: toneBg[tone],
            border: `1px solid ${toneColor[tone]}44`,
            whiteSpace: "nowrap",
        }, children: children }));
}
function Loading({ text }) {
    return (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px", color: colors.muted, fontSize: "12px" }, children: [SP_JSX.jsx(DFL.Spinner, {}), SP_JSX.jsx("span", { children: text })] }) }) }));
}
function EmptyState({ text }) {
    return (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { textAlign: "center", color: colors.dim, fontSize: "12px", padding: "12px 0" }, children: text }) }) }));
}
function ErrorState({ text, onRetry }) {
    return (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: "error", children: text }) }), onRetry && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: onRetry, children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" }) }))] }));
}
/** Обёртка для иконок: фиксированный слот, чтобы иконки не «съезжали» */
function Icon({ children }) {
    return (SP_JSX.jsx("span", { style: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            flex: "0 0 auto",
        }, children: children }));
}
/** Кнопка с иконкой в одной строке: icon-проп у ButtonItem с layout=below
 *  ставит иконку над текстом, поэтому иконку кладём внутрь children. */
function ActionButton({ icon, children, ...rest }) {
    return (SP_JSX.jsx(DFL.ButtonItem, { layout: "below", ...rest, children: SP_JSX.jsxs("span", { style: { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }, children: [icon ? SP_JSX.jsx(Icon, { children: icon }) : null, children] }) }));
}

const formatDate$3 = (value) => {
    if (!value)
        return "";
    try {
        return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    }
    catch {
        return value;
    }
};
function GameSyncMain() {
    const [pluginOk, setPluginOk] = SP_REACT.useState(false);
    const [summary, setSummary] = SP_REACT.useState(null);
    const [storage, setStorage] = SP_REACT.useState(null);
    const [syncing, setSyncing] = SP_REACT.useState(false);
    const [progress, setProgress] = SP_REACT.useState(null);
    const [autoSync, setAutoSync] = SP_REACT.useState(false);
    const [message, setMessage] = SP_REACT.useState(null);
    const loadStorage = async () => {
        try {
            const result = await call("get_storage_status", {});
            setStorage({
                success: Boolean(result?.success),
                provider: result?.provider || "хранилище",
                error: result?.error,
            });
        }
        catch (error) {
            setStorage({ success: false, provider: "хранилище", error: error?.message || String(error) });
        }
    };
    const load = async () => {
        try {
            const [test, stats, scan, appSettings] = await Promise.all([
                call("get_test", {}),
                call("get_sync_stats", {}),
                call("scan_games", {}),
                call("get_app_settings", {}),
            ]);
            setPluginOk(Boolean(test?.success));
            setAutoSync(Boolean(appSettings?.auto_sync));
            setSummary({
                games: Array.isArray(scan?.games) ? scan.games.length : 0,
                synced: Number(stats?.stats?.gamesCount || 0),
                lastSync: stats?.stats?.lastSync,
            });
        }
        catch (error) {
            setPluginOk(false);
            setSummary(null);
        }
    };
    SP_REACT.useEffect(() => {
        load();
        loadStorage();
    }, []);
    // Пока идёт синхронизация — опрашиваем прогресс (этап, проценты, игра).
    SP_REACT.useEffect(() => {
        if (!syncing)
            return;
        let cancelled = false;
        const tick = async () => {
            try {
                const next = await call("get_sync_progress", {});
                if (!cancelled && next)
                    setProgress(next);
            }
            catch {
                /* плагин мог перезапуститься — просто пропускаем тик */
            }
        };
        tick();
        const timer = setInterval(tick, 500);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, [syncing]);
    const openSettings = (tab) => {
        DFL.Router.CloseSideMenus();
        DFL.Router.Navigate("/gamesync-settings");
        setTimeout(() => window.dispatchEvent(new CustomEvent("gamesync-switch-tab", { detail: tab })), 120);
    };
    const syncAll = async () => {
        setSyncing(true);
        setMessage(null);
        setProgress({ active: true, stage: "Запуск…", percent: 0, currentGame: "", index: 0, total: 0, ok: 0, failed: 0 });
        try {
            const result = await call("sync_all_games", {});
            if (result?.success) {
                const synced = (result.synced || []).length;
                const failed = (result.failed || []).length;
                setMessage({
                    tone: failed > 0 ? "warning" : "success",
                    text: failed > 0 ? `Синхронизировано ${synced}, с ошибками ${failed}` : `Синхронизировано игр: ${synced}`,
                });
                await load();
                await loadStorage();
            }
            else {
                setMessage({ tone: "error", text: result?.error || "Не удалось синхронизировать" });
            }
        }
        catch (error) {
            setMessage({ tone: "error", text: error?.message || String(error) });
        }
        finally {
            setSyncing(false);
        }
    };
    const percent = Math.max(0, Math.min(100, Math.round(progress?.percent ?? 0)));
    const storageLabel = storage ? `${storage.provider} · ${storage.success ? "подключено" : "нет связи"}` : "проверка хранилища…";
    const storageOk = storage?.success ?? false;
    return (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Field, { icon: SP_JSX.jsx(Icon, { children: SP_JSX.jsx(FaCloud, { style: { color: storageOk ? "#5fd88a" : storage ? "#e05b5b" : "#8b929a" } }) }), label: "GameSync", description: `${storageLabel} · ${summary?.games ?? "…"} игр · ${summary?.synced ?? 0} в облаке${summary?.lastSync ? ` · ${formatDate$3(summary.lastSync)}` : ""}` }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ActionButton, { icon: syncing ? SP_JSX.jsx(DFL.Spinner, {}) : SP_JSX.jsx(FaSyncAlt, {}), onClick: syncAll, disabled: syncing || !pluginOk, children: syncing ? "Синхронизация…" : "Синхронизировать всё" }) }), (syncing || progress?.active) && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { width: "100%" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#b8bcbf", marginBottom: "4px" }, children: [SP_JSX.jsx("span", { children: progress?.stage || "Подготовка…" }), SP_JSX.jsxs("span", { children: [percent, "%"] })] }), SP_JSX.jsx("div", { style: { height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }, children: SP_JSX.jsx("div", { style: {
                                    width: `${percent}%`,
                                    height: "100%",
                                    borderRadius: "3px",
                                    background: "linear-gradient(90deg, #1a9fff, #66c0f4)",
                                    transition: "width 0.3s ease",
                                } }) }), SP_JSX.jsxs("div", { style: { fontSize: "10.5px", color: "#8b929a", marginTop: "4px", minHeight: "13px" }, children: [progress?.currentGame
                                    ? `${progress.currentGame}${progress.total ? ` · ${progress.index}/${progress.total}` : ""}`
                                    : progress?.total
                                        ? `${progress.index}/${progress.total}`
                                        : "", progress && (progress.ok > 0 || progress.failed > 0) ? ` · ок: ${progress.ok}, ошибок: ${progress.failed}` : ""] })] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaCloudDownloadAlt, {}), onClick: () => openSettings("backups"), children: "\u0411\u044D\u043A\u0430\u043F\u044B \u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaCog, {}), onClick: () => openSettings("main"), children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438" }) }), message && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: message.tone, children: message.text }) })), storage && !storage.success && !syncing && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(StatusMessage, { tone: "error", children: ["\u0425\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435: ", storage.error || "нет подключения"] }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(Hint, { children: [autoSync
                            ? "Автосинхронизация включена: плагин отслеживает запуск игр и сохраняет игру после выхода."
                            : "Автосинхронизация выключена — включите её в настройках, чтобы игра сохранялась после выхода.", " ", "\u041F\u0443\u0442\u0438 \u0438 \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u2014 \u043D\u0430 \u043F\u043E\u043B\u043D\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435."] }) })] }));
}

/**
 * Пресеты провайдеров хранилищ — единственный источник правды для UI.
 *
 * Порядок в списках важен: сначала то, что проще всего настроить
 * русскоязычному пользователю, «свои серверы» — посередине,
 * международные сервисы и произвольный WebDAV — в конце.
 *
 * Провайдеры и их условия меняются (Box выключил WebDAV в 2023,
 * Яндекс с 22.06.2026 требует подписку 360 для WebDAV), поэтому
 * описания должны обновляться вместе с реальностью, а не жить в TSX.
 */
const WEBDAV_PRESETS = [
    {
        id: "mail",
        name: "Облако Mail.ru",
        url: "https://webdav.cloud.mail.ru",
        status: "есть бесплатный тариф",
        region: "ru",
        description: "Облако Mail.ru: WebDAV включён в сервисе, отдельная регистрация не нужна — подойдёт обычный почтовый аккаунт.",
        credentials: "Логин — полный адрес почты (name@mail.ru). Пароль — пароль аккаунта или пароль для внешних приложений, если включена двухфакторная защита.",
    },
    {
        id: "yandex",
        name: "Яндекс Диск",
        url: "https://webdav.yandex.ru",
        status: "нужна подписка 360",
        region: "ru",
        description: "Яндекс Диск по WebDAV: одна папка GameSync в вашем облаке.",
        credentials: "Логин — полный адрес вида name@yandex.ru (короткий логин WebDAV не принимает). Пароль — пароль приложения (Яндекс ID → Безопасность → Пароли приложений).",
        warning: "С 22 июня 2026 запись по WebDAV требует подписку Яндекс 360: на бесплатном тарифе сервер отвечает HTTP 402. Для бесплатного варианта используйте Облако Mail.ru.",
    },
    {
        id: "nextcloud",
        name: "Nextcloud",
        url: "https://cloud.example.com/remote.php/dav/files/USERNAME/",
        status: "свой сервер",
        region: "self",
        description: "Свой или корпоративный Nextcloud. Подойдёт любой хостинг, включая домашний сервер и NAS.",
        credentials: "Замените cloud.example.com и USERNAME на свои. Логин и пароль — от Nextcloud; при двухфакторной защите создайте пароль приложения.",
    },
    {
        id: "owncloud",
        name: "ownCloud",
        url: "https://cloud.example.com/remote.php/dav/files/USERNAME/",
        status: "свой сервер",
        region: "self",
        description: "Свой сервер ownCloud (или совместимый WebDAV-хостинг).",
        credentials: "Замените cloud.example.com и USERNAME на свои. Логин и пароль — от ownCloud.",
    },
    {
        id: "fastmail",
        name: "Fastmail Files",
        url: "https://myfiles.fastmail.com",
        status: "подписка Fastmail",
        region: "intl",
        description: "Файловое хранилище Fastmail, доступное по WebDAV.",
        credentials: "Логин — полный логин Fastmail. Пароль — пароль приложения с доступом к файлам (Files).",
    },
    {
        id: "custom",
        name: "Другой WebDAV",
        url: "",
        status: "любой сервер",
        region: "intl",
        description: "Любой сервер с WebDAV: NAS, VPS, корпоративное облако. Google Drive, OneDrive, Dropbox и MEGA не поддерживают WebDAV напрямую — для них нужен S3-совместимый сервис или свой сервер.",
        credentials: "URL сервера, логин и пароль — в документации вашего сервиса.",
    },
];
const S3_PROVIDERS = {
    custom: { name: "Другой S3", endpoint: "", region: "us-east-1", pathStyle: false, status: "любой S3" },
    yandex: { name: "Yandex Object Storage", endpoint: "https://storage.yandexcloud.net", region: "ru-central1", pathStyle: false, status: "платно" },
    vk: { name: "VK Cloud", endpoint: "https://s3.mcs.mail.ru", region: "ru-1", pathStyle: true, status: "платно" },
    cloudru: { name: "Cloud.ru", endpoint: "https://s3.cloud.ru", region: "ru-central1", pathStyle: true, status: "платно" },
    aws: { name: "AWS S3", endpoint: "https://s3.amazonaws.com", region: "us-east-1", pathStyle: false, status: "платно" },
    backblaze: { name: "Backblaze B2", endpoint: "https://s3.us-west-004.backblazeb2.com", region: "us-west-004", pathStyle: true, status: "10 ГБ бесплатно" },
    wasabi: { name: "Wasabi", endpoint: "https://s3.wasabisys.com", region: "us-east-1", pathStyle: true, status: "платно" },
    digitalocean: { name: "DigitalOcean Spaces", endpoint: "https://nyc3.digitaloceanspaces.com", region: "nyc3", pathStyle: true, status: "платно" },
};
const CUSTOM_PRESET = WEBDAV_PRESETS[WEBDAV_PRESETS.length - 1];
/** Приводит сохранённое значение (в т.ч. устаревшее, например box) к известному id. */
function normalizeWebDAVProviderId(value) {
    if (typeof value === "string" && WEBDAV_PRESETS.some((preset) => preset.id === value)) {
        return value;
    }
    return "custom";
}
function getWebDAVPreset(id) {
    return WEBDAV_PRESETS.find((preset) => preset.id === id) || CUSTOM_PRESET;
}
/**
 * Определяет провайдера по URL, чтобы пользователю не приходилось
 * выбирать его вручную, если он вставил адрес.
 */
function detectWebDAVProvider(url) {
    const value = (url || "").trim().toLowerCase();
    if (!value)
        return null;
    if (/webdav\.yandex\.ru/.test(value))
        return "yandex";
    if (/webdav\.cloud\.mail\.ru/.test(value))
        return "mail";
    if (/fastmail\.com/.test(value))
        return "fastmail";
    if (/\/remote\.php\/dav\//.test(value))
        return "nextcloud";
    return null;
}

const DEFAULT_SETTINGS = {
    storageProvider: "webdav",
    // По умолчанию — самый доступный бесплатный вариант для русскоязычного
    // пользователя: Облако Mail.ru. URL подставляется автоматически.
    webdavProvider: "mail",
    webdavUrl: "https://webdav.cloud.mail.ru",
    webdavUsername: "",
    webdavPassword: "",
    webdavOAuthToken: "",
    s3Provider: "custom",
    s3Endpoint: "",
    s3Region: "us-east-1",
    s3Bucket: "",
    s3AccessKey: "",
    s3SecretKey: "",
    s3PathStyle: false,
    s3SignatureVersion: "s3v4",
    ftpHost: "",
    ftpPort: "21",
    ftpUsername: "",
    ftpPassword: "",
    ftpUseTls: false,
    ftpPassive: true,
    sftpHost: "",
    sftpPort: "22",
    sftpUsername: "",
    sftpPassword: "",
    sftpKeyPath: "",
    sftpKeyPassphrase: "",
    autoSync: false,
    defaultSavePaths: [],
};
/** Поля с секретами: их нельзя держать в localStorage (он виден любому скрипту Steam). */
const SECRET_FIELDS = [
    "webdavPassword",
    "webdavOAuthToken",
    "s3SecretKey",
    "ftpPassword",
    "sftpPassword",
    "sftpKeyPassphrase",
];
const SETTINGS_KEY = "gamesyncSettings";
const SETTINGS_CHANGE_EVENT = "gamesync-settings-change";
function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...DEFAULT_SETTINGS,
                ...parsed,
                webdavProvider: normalizeWebDAVProviderId(parsed.webdavProvider ?? DEFAULT_SETTINGS.webdavProvider),
            };
        }
    }
    catch (error) {
        console.error("Failed to load settings:", error);
    }
    return DEFAULT_SETTINGS;
}
function saveSettings(settings) {
    try {
        // Секреты живут только в конфиге бэкенда (~/.config/gamesync, права 0600),
        // а в localStorage остаётся всё остальное — чтобы не терять пути и провайдера.
        const persisted = { ...settings };
        for (const field of SECRET_FIELDS) {
            persisted[field] = "";
        }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(persisted));
        window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: settings }));
    }
    catch (error) {
        console.error("Failed to save settings:", error);
    }
}

const STORAGE_OPTIONS = [
    { data: "webdav", label: "Облако (WebDAV) — рекомендуется" },
    { data: "sftp", label: "Свой сервер: SFTP" },
    { data: "ftp", label: "Свой сервер: FTP/FTPS" },
    { data: "s3", label: "S3: для продвинутых" },
];
const PROVIDER_OPTIONS = WEBDAV_PRESETS.map((preset) => ({
    data: preset.id,
    label: `${preset.name} · ${preset.status}`,
}));
const SectionHeader = ({ icon, title }) => (SP_JSX.jsxs("div", { style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        fontSize: "11px",
        letterSpacing: "0.9px",
        textTransform: "uppercase",
        fontWeight: 700,
        color: colors.muted,
    }, children: [SP_JSX.jsx(Icon, { children: icon }), title] }));
function Settings() {
    const [settings, setSettings] = SP_REACT.useState(loadSettings());
    const [busy, setBusy] = SP_REACT.useState(null);
    const [result, setResult] = SP_REACT.useState(null);
    const [dirty, setDirty] = SP_REACT.useState(false);
    const [newPath, setNewPath] = SP_REACT.useState("");
    const [validating, setValidating] = SP_REACT.useState(false);
    const [pathValidationResult, setPathValidationResult] = SP_REACT.useState(null);
    const update = (patch) => {
        setSettings((prev) => ({ ...prev, ...patch }));
        setDirty(true);
    };
    const preset = getWebDAVPreset(settings.webdavProvider);
    SP_REACT.useEffect(() => {
        const loadStorageConfig = async () => {
            try {
                const response = await call("load_storage_config", {});
                if (response?.success && response.config) {
                    const config = response.config;
                    setSettings((prev) => ({
                        ...prev,
                        storageProvider: ["s3", "webdav", "ftp", "sftp"].includes(config.provider) ? config.provider : "webdav",
                        webdavProvider: normalizeWebDAVProviderId(config.webdav_provider ?? prev.webdavProvider),
                        webdavUrl: config.url || prev.webdavUrl || "",
                        webdavUsername: config.username || prev.webdavUsername || "",
                        webdavPassword: config.password || prev.webdavPassword || "",
                        webdavOAuthToken: config.oauth_token || prev.webdavOAuthToken || "",
                        s3Provider: S3_PROVIDERS[config.s3_provider] ? config.s3_provider : prev.s3Provider || "custom",
                        s3Endpoint: config.endpoint || prev.s3Endpoint || "",
                        s3Region: config.region || prev.s3Region || "us-east-1",
                        s3Bucket: config.bucket || prev.s3Bucket || "",
                        s3AccessKey: config.access_key || prev.s3AccessKey || "",
                        s3SecretKey: config.secret_key || prev.s3SecretKey || "",
                        s3PathStyle: typeof config.path_style === "boolean" ? config.path_style : prev.s3PathStyle ?? false,
                        s3SignatureVersion: config.signature_version || prev.s3SignatureVersion || "s3v4",
                        ftpHost: config.provider === "ftp" ? config.host || "" : prev.ftpHost || "",
                        ftpPort: config.provider === "ftp" ? String(config.port ?? prev.ftpPort ?? "21") : prev.ftpPort || "21",
                        ftpUsername: config.provider === "ftp" ? config.username || "" : prev.ftpUsername || "",
                        ftpPassword: config.provider === "ftp" ? config.password || "" : prev.ftpPassword || "",
                        ftpUseTls: config.provider === "ftp" ? !!config.use_tls : prev.ftpUseTls ?? false,
                        ftpPassive: config.provider === "ftp" ? config.passive ?? true : prev.ftpPassive ?? true,
                        sftpHost: config.provider === "sftp" ? config.host || "" : prev.sftpHost || "",
                        sftpPort: config.provider === "sftp" ? String(config.port ?? prev.sftpPort ?? "22") : prev.sftpPort || "22",
                        sftpUsername: config.provider === "sftp" ? config.username || "" : prev.sftpUsername || "",
                        sftpPassword: config.provider === "sftp" ? config.password || "" : prev.sftpPassword || "",
                        sftpKeyPath: config.provider === "sftp" ? config.key_path || "" : prev.sftpKeyPath || "",
                        sftpKeyPassphrase: config.provider === "sftp" ? config.key_passphrase || "" : prev.sftpKeyPassphrase || "",
                    }));
                }
            }
            catch (error) {
                console.error("Error loading storage config:", error);
            }
            // Автосинхронизация и глобальные пути живут на бэкенде: иначе тумблер
            // показывал бы «включено» после перезапуска Decky, пока монитор выключен.
            try {
                const app = await call("get_app_settings", {});
                if (app?.success) {
                    setSettings((prev) => ({
                        ...prev,
                        autoSync: typeof app.auto_sync === "boolean" ? app.auto_sync : prev.autoSync,
                        defaultSavePaths: Array.isArray(app.default_save_paths) && app.default_save_paths.length > 0
                            ? app.default_save_paths
                            : prev.defaultSavePaths,
                    }));
                }
            }
            catch (error) {
                console.error("Error loading app settings:", error);
            }
        };
        loadStorageConfig();
    }, []);
    // Секреты в localStorage не пишутся (см. saveSettings), остальное — да.
    SP_REACT.useEffect(() => {
        saveSettings(settings);
    }, [settings]);
    const buildPayload = (s) => {
        const provider = s.storageProvider;
        if (provider === "webdav") {
            return {
                provider,
                url: s.webdavUrl,
                username: s.webdavUsername,
                password: s.webdavPassword,
                oauth_token: s.webdavOAuthToken,
                webdav_provider: s.webdavProvider,
            };
        }
        if (provider === "s3") {
            return {
                provider,
                s3_provider: s.s3Provider,
                endpoint: s.s3Endpoint,
                region: s.s3Region,
                bucket: s.s3Bucket,
                access_key: s.s3AccessKey,
                secret_key: s.s3SecretKey,
                path_style: s.s3PathStyle,
                signature_version: s.s3SignatureVersion,
            };
        }
        if (provider === "ftp") {
            return {
                provider,
                host: s.ftpHost,
                port: s.ftpPort,
                username: s.ftpUsername,
                password: s.ftpPassword,
                use_tls: s.ftpUseTls,
                passive: s.ftpPassive,
            };
        }
        return {
            provider,
            host: s.sftpHost,
            port: s.sftpPort,
            username: s.sftpUsername,
            password: s.sftpPassword,
            key_path: s.sftpKeyPath,
            key_passphrase: s.sftpKeyPassphrase,
        };
    };
    /** Сохраняет конфигурацию на бэкенде. Возвращает текст ошибки или null. */
    const persist = async (customSettings) => {
        try {
            const response = await call("save_storage_config", buildPayload(settings));
            if (response?.success) {
                setDirty(false);
                return null;
            }
            return response?.error || "Ошибка сохранения";
        }
        catch (error) {
            return error?.message || String(error);
        }
    };
    /** Проверяет подключение. Возвращает текст ошибки или null. */
    const testConnection = async (customSettings) => {
        try {
            const response = await call("test_storage_connection", buildPayload(settings));
            if (response?.success)
                return null;
            return response?.error || response?.message || "Ошибка подключения";
        }
        catch (error) {
            return error?.message || String(error);
        }
    };
    const saveOnly = async () => {
        setBusy("save");
        setResult(null);
        try {
            const error = await persist();
            setResult(error
                ? { tone: "error", text: error }
                : { tone: "success", text: "Настройки сохранены" });
        }
        finally {
            setBusy(null);
        }
    };
    const saveAndTest = async () => {
        setBusy("test");
        setResult(null);
        try {
            const testError = await testConnection();
            if (testError) {
                setResult({ tone: "error", text: testError });
                return;
            }
            const saveError = await persist();
            setResult(saveError
                ? { tone: "warning", text: `Подключение работает, но настройки не сохранились: ${saveError}` }
                : { tone: "success", text: "Подключение успешно, настройки сохранены" });
        }
        finally {
            setBusy(null);
        }
    };
    const handleProviderChange = (id) => {
        const nextPreset = getWebDAVPreset(id);
        // Для «своего» URL не затираем то, что пользователь уже ввёл.
        const keepUrl = !nextPreset.url;
        // OAuth поддерживает только Яндекс: у остальных сервисов токен даёт 403,
        // поэтому при смене провайдера очищаем его.
        const oauthReset = id === "yandex" ? {} : { webdavOAuthToken: "" };
        update({
            webdavProvider: id,
            webdavUrl: keepUrl ? settings.webdavUrl : nextPreset.url,
            ...oauthReset,
        });
    };
    const handleUrlChange = (value) => {
        const detected = detectWebDAVProvider(value);
        if (detected && detected !== settings.webdavProvider) {
            update({ webdavUrl: value, webdavProvider: detected });
        }
        else {
            update({ webdavUrl: value });
        }
    };
    const persistDefaultPaths = async (paths) => {
        try {
            await call("set_default_save_paths", { default_save_paths: paths });
        }
        catch (error) {
            console.error("Error saving default save paths:", error);
        }
    };
    const addDefaultPath = async () => {
        if (!newPath.trim()) {
            setPathValidationResult("Введите путь");
            return;
        }
        setValidating(true);
        setPathValidationResult(null);
        try {
            const response = await call("validate_save_path", { path: newPath.trim() });
            if (response.success && response.path) {
                if (settings.defaultSavePaths.includes(response.path)) {
                    setPathValidationResult("Этот путь уже добавлен");
                }
                else {
                    const nextPaths = [...settings.defaultSavePaths, response.path];
                    update({ defaultSavePaths: nextPaths });
                    void persistDefaultPaths(nextPaths);
                    setNewPath("");
                }
            }
            else {
                setPathValidationResult(`✗ ${response.error || "Ошибка валидации"}`);
            }
        }
        catch (error) {
            setPathValidationResult(`✗ Ошибка: ${error}`);
        }
        finally {
            setValidating(false);
        }
    };
    const removeDefaultPath = (index) => {
        const nextPaths = settings.defaultSavePaths.filter((_, i) => i !== index);
        update({ defaultSavePaths: nextPaths });
        void persistDefaultPaths(nextPaths);
    };
    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(SectionHeader, { icon: SP_JSX.jsx(FaCloudUploadAlt, {}), title: "\u041A\u0443\u0434\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u044C" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Dropdown, { menuLabel: "\u0422\u0438\u043F \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430", rgOptions: STORAGE_OPTIONS, selectedOption: settings.storageProvider, onChange: (option) => update({ storageProvider: option.data }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u041E\u0431\u043B\u0430\u043A\u043E (WebDAV) \u2014 \u0441\u0430\u043C\u044B\u0439 \u043F\u0440\u043E\u0441\u0442\u043E\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442: \u0434\u0432\u0430 \u043F\u043E\u043B\u044F \u0438 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0439 \u0442\u0430\u0440\u0438\u0444. \u0421\u0432\u043E\u0439 \u0441\u0435\u0440\u0432\u0435\u0440 \u043D\u0443\u0436\u0435\u043D, \u0435\u0441\u043B\u0438 \u0443 \u0432\u0430\u0441 NAS \u0438\u043B\u0438 VPS. S3 \u2014 \u0434\u043B\u044F \u0442\u0435\u0445, \u043A\u0442\u043E \u0443\u0436\u0435 \u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u043E\u0431\u044A\u0435\u043A\u0442\u043D\u044B\u043C \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435\u043C." }) })] }), settings.storageProvider === "webdav" && (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(SectionHeader, { icon: SP_JSX.jsx(FaCloud, {}), title: "\u041E\u0431\u043B\u0430\u043A\u043E (WebDAV)" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Dropdown, { menuLabel: "\u0421\u0435\u0440\u0432\u0438\u0441", rgOptions: PROVIDER_OPTIONS, selectedOption: settings.webdavProvider, onChange: (option) => handleProviderChange(option.data) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "6px" }, children: [SP_JSX.jsx("div", { style: { fontSize: "12px", color: colors.muted, lineHeight: 1.4 }, children: preset.description }), SP_JSX.jsx("div", { style: dimText, children: preset.credentials })] }) }), preset.warning && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: "warning", children: preset.warning }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "URL", value: settings.webdavUrl || "", onChange: (e) => handleUrlChange(e.target.value), description: "\u041F\u043E\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438; \u043C\u043E\u0436\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0430 \u0441\u0432\u043E\u0439 \u0430\u0434\u0440\u0435\u0441" }) }), settings.webdavProvider === "yandex" && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "OAuth \u0442\u043E\u043A\u0435\u043D (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)", value: settings.webdavOAuthToken || "", onChange: (e) => update({ webdavOAuthToken: e.target.value }), description: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C, \u0447\u0442\u043E\u0431\u044B \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u043B\u043E\u0433\u0438\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F" }) })), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041B\u043E\u0433\u0438\u043D", value: settings.webdavUsername || "", onChange: (e) => update({ webdavUsername: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", value: settings.webdavPassword || "", onChange: (e) => update({ webdavPassword: e.target.value }), bIsPassword: true }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u0424\u0430\u0439\u043B\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u0432 \u043F\u0430\u043F\u043A\u0443 GameSync \u0432\u0430\u0448\u0435\u0433\u043E \u043E\u0431\u043B\u0430\u043A\u0430 \u2014 \u0438\u0445 \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 \u0432\u0435\u0431-\u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0435 \u0441\u0435\u0440\u0432\u0438\u0441\u0430. \u041F\u0430\u0440\u043E\u043B\u0438 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0439 \u0438 \u0442\u043E\u043A\u0435\u043D\u044B \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u0441\u0430\u043C\u043E\u043C Steam Deck." }) })] })), settings.storageProvider === "s3" && (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(SectionHeader, { icon: SP_JSX.jsx(FaDatabase, {}), title: "S3 / Object Storage" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Dropdown, { menuLabel: "\u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 S3", rgOptions: Object.entries(S3_PROVIDERS).map(([key, provider]) => ({
                                data: key,
                                label: `${provider.name} · ${provider.status}`,
                            })), selectedOption: settings.s3Provider, onChange: (option) => {
                                const presetKey = option.data;
                                const selected = S3_PROVIDERS[presetKey];
                                update({
                                    s3Provider: presetKey,
                                    s3Endpoint: selected.endpoint || settings.s3Endpoint,
                                    s3Region: selected.region || settings.s3Region,
                                    s3PathStyle: selected.pathStyle,
                                });
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u041F\u043E\u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0431\u0430\u043A\u0435\u0442 \u0438 Access/Secret \u043A\u043B\u044E\u0447\u0438 \u0432 \u043F\u0430\u043D\u0435\u043B\u0438 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430. \u041F\u0440\u0438 \u043F\u0435\u0440\u0432\u043E\u043C \u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u0438 \u043F\u043B\u0430\u0433\u0438\u043D \u0441\u043A\u0430\u0447\u0430\u0435\u0442 \u043A\u043B\u0438\u0435\u043D\u0442 S3 (~100 \u041C\u0411), \u044D\u0442\u043E \u043C\u043E\u0436\u0435\u0442 \u0437\u0430\u043D\u044F\u0442\u044C \u0432\u0440\u0435\u043C\u044F." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Bucket", value: settings.s3Bucket || "", onChange: (e) => update({ s3Bucket: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Endpoint", value: settings.s3Endpoint || "", onChange: (e) => update({ s3Endpoint: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Region", value: settings.s3Region || "", onChange: (e) => update({ s3Region: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Access Key", value: settings.s3AccessKey || "", onChange: (e) => update({ s3AccessKey: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "Secret Key", value: settings.s3SecretKey || "", onChange: (e) => update({ s3SecretKey: e.target.value }), bIsPassword: true }) })] })), settings.storageProvider === "ftp" && (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(SectionHeader, { icon: SP_JSX.jsx(FaServer, {}), title: "FTP / FTPS" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u0414\u043B\u044F \u0434\u043E\u043C\u0430\u0448\u043D\u0435\u0433\u043E \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u0438\u043B\u0438 NAS. FTP \u0431\u0435\u0437 TLS \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442 \u043F\u0430\u0440\u043E\u043B\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u043C \u0442\u0435\u043A\u0441\u0442\u043E\u043C \u2014 \u0432\u043A\u043B\u044E\u0447\u0430\u0439\u0442\u0435 TLS, \u0435\u0441\u043B\u0438 \u0441\u0435\u0440\u0432\u0435\u0440 \u0443\u043C\u0435\u0435\u0442." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u0425\u043E\u0441\u0442", value: settings.ftpHost || "", onChange: (e) => update({ ftpHost: e.target.value }), description: "ftp.example.com" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u043E\u0440\u0442", value: settings.ftpPort || "", onChange: (e) => update({ ftpPort: e.target.value }), description: "\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 21" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041B\u043E\u0433\u0438\u043D", value: settings.ftpUsername || "", onChange: (e) => update({ ftpUsername: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", value: settings.ftpPassword || "", onChange: (e) => update({ ftpPassword: e.target.value }), bIsPassword: true }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C TLS (FTPS)", checked: settings.ftpUseTls, onChange: (value) => update({ ftpUseTls: value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "\u041F\u0430\u0441\u0441\u0438\u0432\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C (PASV)", checked: settings.ftpPassive, onChange: (value) => update({ ftpPassive: value }) }) })] })), settings.storageProvider === "sftp" && (SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(SectionHeader, { icon: SP_JSX.jsx(FaServer, {}), title: "SFTP" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "SSH-\u0434\u043E\u0441\u0442\u0443\u043F \u043A NAS, VPS \u0438\u043B\u0438 \u0434\u043E\u043C\u0430\u0448\u043D\u0435\u043C\u0443 \u0441\u0435\u0440\u0432\u0435\u0440\u0443. \u041F\u0430\u0440\u043E\u043B\u044C \u0438\u043B\u0438 \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u044B\u0439 \u043A\u043B\u044E\u0447." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u0425\u043E\u0441\u0442", value: settings.sftpHost || "", onChange: (e) => update({ sftpHost: e.target.value }), description: "sftp.example.com" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u043E\u0440\u0442", value: settings.sftpPort || "", onChange: (e) => update({ sftpPort: e.target.value }), description: "\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 22" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041B\u043E\u0433\u0438\u043D", value: settings.sftpUsername || "", onChange: (e) => update({ sftpUsername: e.target.value }) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0430\u0440\u043E\u043B\u044C", value: settings.sftpPassword || "", onChange: (e) => update({ sftpPassword: e.target.value }), bIsPassword: true }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0440\u0438\u0432\u0430\u0442\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)", value: settings.sftpKeyPath || "", onChange: (e) => update({ sftpKeyPath: e.target.value }), description: "/home/deck/.ssh/id_ed25519" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0430\u0440\u043E\u043B\u044C \u043A\u043B\u044E\u0447\u0430 (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)", value: settings.sftpKeyPassphrase || "", onChange: (e) => update({ sftpKeyPassphrase: e.target.value }), bIsPassword: true }) })] })), SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: actionRow, children: [SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: saveAndTest, disabled: busy !== null, children: SP_JSX.jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "7px" }, children: [SP_JSX.jsx(FaCheck, {}), busy === "test" ? "Проверка…" : busy === "save" ? "Сохранение…" : "Проверить и сохранить"] }) }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: saveOnly, disabled: busy !== null, children: SP_JSX.jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "7px" }, children: [SP_JSX.jsx(FaSave, {}), "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"] }) }) })] }) }), dirty && busy === null && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0435\u0449\u0451 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B." }) })), result && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: result.tone, children: result.text }) }))] }), SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(SectionHeader, { icon: SP_JSX.jsx(FaSyncAlt, {}), title: "\u0410\u0432\u0442\u043E\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ToggleField, { label: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u0440\u0438 \u0432\u044B\u0445\u043E\u0434\u0435 \u0438\u0437 \u0438\u0433\u0440\u044B", checked: settings.autoSync, onChange: async (value) => {
                                update({ autoSync: value });
                                try {
                                    await call("enable_auto_sync", { enabled: value });
                                }
                                catch (error) {
                                    console.error("Error enabling auto-sync:", error);
                                }
                            } }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430 \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u043D\u0430 \u0431\u044D\u043A\u0435\u043D\u0434\u0435 \u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A\u0430 Decky." }) })] }), SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(SectionHeader, { icon: SP_JSX.jsx(FaFolderOpen, {}), title: "\u0413\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0435 \u043F\u0443\u0442\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0439" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u041F\u0440\u0438\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u043A\u043E \u0432\u0441\u0435\u043C \u0438\u0433\u0440\u0430\u043C \u0432 \u0434\u043E\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u043A \u0438\u043D\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043B\u044C\u043D\u044B\u043C \u043F\u0443\u0442\u044F\u043C." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.TextField, { label: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0443\u0442\u044C", value: newPath, onChange: (e) => setNewPath(e.target.value) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: addDefaultPath, disabled: validating || !newPath.trim(), children: SP_JSX.jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "7px" }, children: [SP_JSX.jsx(FaPlus, {}), validating ? "Проверка…" : "Добавить путь"] }) }) }), pathValidationResult && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: pathValidationResult.startsWith("✓") ? "success" : "error", children: pathValidationResult }) })), settings.defaultSavePaths.length === 0 ? (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { color: colors.dim, fontSize: "12px", fontStyle: "italic" }, children: "\u041D\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0445 \u043F\u0443\u0442\u0435\u0439" }) })) : (settings.defaultSavePaths.map((path, index) => (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "8px" }, children: [SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#c7ccd1", wordBreak: "break-all", fontFamily: "monospace" }, children: path }), SP_JSX.jsx("div", { style: actionRow, children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: () => removeDefaultPath(index), children: SP_JSX.jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "7px" }, children: [SP_JSX.jsx(FaTrash, {}), "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"] }) }) })] }) }, index))))] }), SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(SectionHeader, { icon: SP_JSX.jsx(FaExclamationTriangle, {}), title: "\u041E\u043F\u0430\u0441\u043D\u0430\u044F \u0437\u043E\u043D\u0430" }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(Hint, { children: "\u0423\u0434\u0430\u043B\u044F\u0435\u0442 \u0432\u0441\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438, \u043A\u044D\u0448, \u0438\u0437\u0443\u0447\u0435\u043D\u043D\u044B\u0435 \u043F\u0443\u0442\u0438 \u0438 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044E \u043F\u043B\u0430\u0433\u0438\u043D\u0430." }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.ButtonItem, { layout: "below", onClick: async () => {
                                if (!confirm("Удалить все данные плагина? Действие необратимо."))
                                    return;
                                try {
                                    const response = await call("clear_all_data", {});
                                    setResult(response?.success
                                        ? { tone: "success", text: response.message || "Все данные очищены" }
                                        : { tone: "error", text: response?.error || "Ошибка очистки" });
                                    setSettings({ ...DEFAULT_SETTINGS });
                                    setDirty(false);
                                }
                                catch (error) {
                                    setResult({ tone: "error", text: error?.message || String(error) });
                                }
                            }, children: SP_JSX.jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "7px" }, children: [SP_JSX.jsx(FaExclamationTriangle, {}), "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u0432\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u043B\u0430\u0433\u0438\u043D\u0430"] }) }) })] })] }));
}

const pathLine = {
    fontFamily: "Consolas, 'Cascadia Mono', monospace",
    fontSize: "11px",
    color: "#a9bcc7",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: "1 1 auto",
    minWidth: 0,
};
const sourceLabel = (source) => {
    switch (source) {
        case "known":
            return "база";
        case "learned":
            return "изучено";
        case "heuristic":
            return "поиск";
        default:
            return source;
    }
};
function GamePathsTab() {
    const [games, setGames] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const [editingGame, setEditingGame] = SP_REACT.useState(null);
    const [editingPathIndex, setEditingPathIndex] = SP_REACT.useState(null);
    const [editingPathValue, setEditingPathValue] = SP_REACT.useState("");
    const [newPath, setNewPath] = SP_REACT.useState("");
    const [validating, setValidating] = SP_REACT.useState(false);
    const [pathValidationResult, setPathValidationResult] = SP_REACT.useState(null);
    const loadGames = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const result = await call("scan_games", { force_refresh: forceRefresh });
            if (result.success && result.games) {
                setGames(result.games);
            }
            else {
                setError(result.error || "Ошибка загрузки игр");
            }
        }
        catch (err) {
            setError(`Ошибка: ${err}`);
        }
        finally {
            setLoading(false);
        }
    };
    const persistPaths = async (game, savePaths, excludePaths) => {
        try {
            const payload = { game_name: game.name, save_paths: savePaths };
            if (excludePaths !== undefined)
                payload.exclude_paths = excludePaths;
            const result = await call("update_game_paths", payload);
            if (result.success) {
                await loadGames();
                return true;
            }
            setPathValidationResult(`✗ ${result.error || "Ошибка сохранения"}`);
            return false;
        }
        catch (err) {
            setPathValidationResult(`✗ Ошибка: ${err}`);
            return false;
        }
    };
    const addPathToGame = async (game) => {
        if (!newPath.trim()) {
            setPathValidationResult("Введите путь");
            return;
        }
        setValidating(true);
        setPathValidationResult(null);
        try {
            const result = await call("validate_save_path", { path: newPath.trim() });
            if (result.success && result.path) {
                if (game.savePaths.includes(result.path)) {
                    setPathValidationResult("Этот путь уже добавлен");
                }
                else if (await persistPaths(game, [...game.savePaths, result.path])) {
                    setNewPath("");
                }
            }
            else {
                setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
            }
        }
        finally {
            setValidating(false);
        }
    };
    const addCandidateToGame = async (game, candidatePath) => {
        if (game.savePaths.includes(candidatePath))
            return;
        await persistPaths(game, [...game.savePaths, candidatePath]);
    };
    const removePathFromGame = async (game, pathIndex) => {
        await persistPaths(game, game.savePaths.filter((_, i) => i !== pathIndex));
    };
    const excludePathFromGame = async (game, path) => {
        const updatedPaths = game.savePaths.filter((p) => p !== path);
        const updatedExcludes = Array.from(new Set([...(game.excludePaths || []), path]));
        await persistPaths(game, updatedPaths, updatedExcludes);
    };
    const saveEditedPath = async (game, pathIndex) => {
        if (!editingPathValue.trim()) {
            setPathValidationResult("Введите путь");
            return;
        }
        setValidating(true);
        setPathValidationResult(null);
        try {
            const result = await call("validate_save_path", { path: editingPathValue.trim() });
            if (result.success && result.path) {
                const updatedPaths = [...game.savePaths];
                updatedPaths[pathIndex] = result.path;
                if (await persistPaths(game, updatedPaths)) {
                    setEditingPathIndex(null);
                    setEditingPathValue("");
                }
            }
            else {
                setPathValidationResult(`✗ ${result.error || "Ошибка валидации"}`);
            }
        }
        finally {
            setValidating(false);
        }
    };
    SP_REACT.useEffect(() => {
        loadGames();
    }, []);
    if (loading)
        return SP_JSX.jsx(Loading, { text: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u0433\u0440..." });
    if (error)
        return SP_JSX.jsx(ErrorState, { text: error, onRetry: loadGames });
    const settings = loadSettings();
    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { ...card, display: "flex", alignItems: "center", gap: "10px" }, children: [SP_JSX.jsx(FaFolderOpen, { style: { color: "#66c0f4", fontSize: "18px", flex: "0 0 auto" } }), SP_JSX.jsxs("div", { style: { flex: "1 1 auto", minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: colors.text }, children: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0443\u0442\u044F\u043C\u0438" }), SP_JSX.jsxs("div", { style: { fontSize: "11px", color: colors.dim, marginTop: "2px" }, children: [games.length, " \u0438\u0433\u0440 \u00B7 \u0433\u043B\u043E\u0431\u0430\u043B\u044C\u043D\u044B\u0445 \u043F\u0443\u0442\u0435\u0439: ", settings.defaultSavePaths.length] })] }), SP_JSX.jsx("div", { style: { width: "176px", flex: "0 0 auto" }, children: SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaRedo, {}), onClick: () => loadGames(true), disabled: loading, children: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C" }) })] }) }) }), games.length === 0 && SP_JSX.jsx(EmptyState, { text: "\u0418\u0433\u0440\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" }), games.map((game) => {
                const isEditing = editingGame === game.name;
                const candidates = (game.saveCandidates || []).filter((c) => !game.savePaths.includes(c.path));
                return (SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "6px" }, children: [SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "10px" }, children: [SP_JSX.jsxs("div", { style: { flex: "1 1 auto", minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: "14px", fontWeight: 600, color: colors.text }, children: game.name }), SP_JSX.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }, children: [SP_JSX.jsx(Badge, { tone: game.hasSaves ? "success" : "warning", children: game.hasSaves ? `${game.savePaths.length} путей` : "нет сохранений" }), typeof game.steamAppId === "number" && SP_JSX.jsxs(Badge, { children: ["appid ", game.steamAppId] }), (game.excludePaths?.length || 0) > 0 && (SP_JSX.jsxs(Badge, { tone: "error", children: ["\u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u043E ", game.excludePaths.length] })), game.sharedPrefix && SP_JSX.jsx(Badge, { tone: "warning", children: "\u043E\u0431\u0449\u0438\u0439 \u043F\u0440\u0435\u0444\u0438\u043A\u0441" })] })] }), SP_JSX.jsx("div", { style: { width: "176px", flex: "0 0 auto" }, children: SP_JSX.jsx(ActionButton, { icon: isEditing ? SP_JSX.jsx(FaTimes, {}) : SP_JSX.jsx(FaEdit, {}), onClick: () => {
                                                    setEditingGame(isEditing ? null : game.name);
                                                    setEditingPathIndex(null);
                                                    setNewPath("");
                                                    setPathValidationResult(null);
                                                }, children: isEditing ? "Готово" : "Изменить" }) })] }), game.savePaths.length === 0 && SP_JSX.jsx("div", { style: dimText, children: "\u041F\u0443\u0442\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u2014 \u0434\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0432\u0440\u0443\u0447\u043D\u0443\u044E." }), game.savePaths.map((path, pathIndex) => {
                                    const isEditingThisPath = isEditing && editingPathIndex === pathIndex;
                                    if (isEditingThisPath) {
                                        return (SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [SP_JSX.jsx(DFL.TextField, { label: "\u041F\u0443\u0442\u044C", value: editingPathValue, onChange: (e) => setEditingPathValue(e.target.value) }), SP_JSX.jsxs("div", { style: { display: "flex", gap: "8px" }, children: [SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaCheck, {}), onClick: () => saveEditedPath(game, pathIndex), disabled: validating || !editingPathValue.trim(), children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C" }) }), SP_JSX.jsx("div", { style: { flex: 1 }, children: SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaTimes, {}), onClick: () => setEditingPathIndex(null), children: "\u041E\u0442\u043C\u0435\u043D\u0430" }) })] })] }, pathIndex));
                                    }
                                    return (SP_JSX.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "4px" }, children: SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [SP_JSX.jsx("div", { style: pathLine, title: path, children: path }), isEditing && (SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px", width: "100%", marginTop: "2px" }, children: [SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaEdit, {}), onClick: () => {
                                                                setEditingPathIndex(pathIndex);
                                                                setEditingPathValue(path);
                                                            }, children: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0443\u0442\u044C" }), SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaBan, {}), onClick: () => excludePathFromGame(game, path), children: "\u0418\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u0437 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438" }), SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaTrash, {}), onClick: () => removePathFromGame(game, pathIndex), children: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u0443\u0442\u044C" })] }))] }) }, pathIndex));
                                }), isEditing && candidates.length > 0 && (SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [SP_JSX.jsxs("div", { style: { ...dimText, fontWeight: 600 }, children: ["\u041A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u044B (", candidates.length, ")"] }), candidates.map((candidate, ci) => (SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [SP_JSX.jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [SP_JSX.jsx("div", { style: pathLine, title: candidate.path, children: candidate.path }), SP_JSX.jsxs("div", { style: { fontSize: "10px", color: colors.dim }, children: [sourceLabel(candidate.source), " \u00B7 \u043E\u0446\u0435\u043D\u043A\u0430 ", candidate.score, candidate.fileCount ? ` · файлов: ${candidate.fileCount}` : ""] })] }), SP_JSX.jsx("div", { style: { width: "176px", flex: "0 0 auto" }, children: SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaPlus, {}), onClick: () => addCandidateToGame(game, candidate.path), children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C" }) })] }, ci)))] })), isEditing && (SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }, children: [SP_JSX.jsx(DFL.TextField, { label: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0443\u0442\u044C", value: newPath, onChange: (e) => setNewPath(e.target.value) }), SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaPlus, {}), onClick: () => addPathToGame(game), disabled: validating || !newPath.trim(), children: validating ? "Проверка…" : "Добавить путь" })] })), pathValidationResult && (SP_JSX.jsx(StatusMessage, { tone: pathValidationResult.startsWith("✓") ? "success" : "error", children: pathValidationResult }))] }) }) }, game.name));
            })] }));
}

const formatBytes$2 = (bytes) => {
    if (!bytes || bytes <= 0)
        return "—";
    const units = ["Б", "КБ", "МБ", "ГБ"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${Math.round((bytes / Math.pow(1024, index)) * 10) / 10} ${units[index]}`;
};
const formatDate$2 = (value) => {
    if (!value)
        return "дата неизвестна";
    try {
        return new Date(value).toLocaleString("ru-RU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    catch {
        return value;
    }
};
const VERSION_OPTIONS = [3, 5, 10, 20, 50].map((value) => ({ data: value, label: `${value} версий` }));
function BackupsTab() {
    const [games, setGames] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [refreshing, setRefreshing] = SP_REACT.useState(false);
    const [error, setError] = SP_REACT.useState(null);
    const [selected, setSelected] = SP_REACT.useState(null);
    const [restoring, setRestoring] = SP_REACT.useState(false);
    const [downloading, setDownloading] = SP_REACT.useState(false);
    const [maxVersions, setMaxVersions] = SP_REACT.useState(10);
    const [providerName, setProviderName] = SP_REACT.useState("хранилище");
    const [status, setStatus] = SP_REACT.useState(null);
    const load = async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        }
        else {
            setLoading(true);
        }
        setError(null);
        try {
            const [response, appSettings, storage] = await Promise.all([
                call("get_backups", {}),
                call("get_app_settings", {}),
                call("get_storage_status", {}),
            ]);
            if (response?.success) {
                setGames(response.games || []);
            }
            else {
                setError(response?.error || "Не удалось загрузить список бэкапов");
            }
            setMaxVersions(Number(appSettings?.max_backup_versions || 10));
            setProviderName(storage?.provider || "хранилище");
        }
        catch (err) {
            setError(`Ошибка: ${err}`);
        }
        finally {
            if (silent) {
                setRefreshing(false);
            }
            else {
                setLoading(false);
            }
        }
    };
    SP_REACT.useEffect(() => {
        load();
    }, []);
    const selectedGame = games.find((item) => item.game === selected) || games[0] || null;
    const changeMaxVersions = async (value) => {
        setMaxVersions(value);
        try {
            const result = await call("set_max_backup_versions", { count: value });
            if (result?.success) {
                setStatus({ tone: "success", text: `Будем хранить до ${value} версий на игру` });
            }
            else {
                setStatus({ tone: "error", text: result?.error || "Не удалось сохранить настройку" });
            }
        }
        catch (err) {
            setStatus({ tone: "error", text: err?.message || String(err) });
        }
    };
    const doRestore = async (gameName, entry) => {
        setRestoring(true);
        setStatus(null);
        try {
            const response = await call("restore_backup", { game_name: gameName, backup_id: entry.id });
            if (response?.success) {
                const suffix = response.safety_backup ? " · текущие сейвы сохранены в резерв" : "";
                setStatus({ tone: "success", text: `${response.message || "Восстановлено"}${suffix}` });
                await load(true);
            }
            else {
                setStatus({ tone: "error", text: response?.error || "Ошибка восстановления" });
            }
        }
        catch (err) {
            setStatus({ tone: "error", text: err?.message || String(err) });
        }
        finally {
            setRestoring(false);
        }
    };
    const askRestore = (gameName, entry) => {
        let modal = null;
        modal = DFL.showModal(SP_JSX.jsx(DFL.ConfirmModal, { strTitle: `Восстановить «${gameName}»?`, strDescription: SP_JSX.jsxs(SP_JSX.Fragment, { children: ["\u0411\u044D\u043A\u0430\u043F \u043E\u0442 ", formatDate$2(entry.created), " \u00B7 ", formatBytes$2(entry.size), ".", SP_JSX.jsx("br", {}), "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0431\u0443\u0434\u0443\u0442 \u0440\u0430\u0441\u043F\u0430\u043A\u043E\u0432\u0430\u043D\u044B \u0432 \u043F\u0430\u043F\u043A\u0438 \u044D\u0442\u043E\u0439 \u0438\u0433\u0440\u044B \u0438 \u0437\u0430\u043C\u0435\u043D\u044F\u0442 \u0442\u0435\u043A\u0443\u0449\u0438\u0435 \u0444\u0430\u0439\u043B\u044B. \u041F\u0435\u0440\u0435\u0434 \u0437\u0430\u043C\u0435\u043D\u043E\u0439 \u043F\u043B\u0430\u0433\u0438\u043D \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442 \u0438\u0445 \u0432 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u044B\u0439 \u0430\u0440\u0445\u0438\u0432."] }), strOKButtonText: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C", strCancelButtonText: "\u041E\u0442\u043C\u0435\u043D\u0430", bDestructiveWarning: true, onOK: () => {
                modal?.Close();
                doRestore(gameName, entry);
            }, onCancel: () => modal?.Close() }));
    };
    const download = async (gameName, entry) => {
        setDownloading(true);
        setStatus(null);
        try {
            const result = await call("download_backup", { game_name: gameName, backup_id: entry.id });
            if (result?.success) {
                setStatus({ tone: "success", text: `Скачано в ${result.path}` });
            }
            else {
                setStatus({ tone: "error", text: result?.error || "Не удалось скачать архив" });
            }
        }
        catch (err) {
            setStatus({ tone: "error", text: err?.message || String(err) });
        }
        finally {
            setDownloading(false);
        }
    };
    if (loading)
        return SP_JSX.jsx(Loading, { text: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0431\u044D\u043A\u0430\u043F\u043E\u0432..." });
    if (error)
        return SP_JSX.jsx(ErrorState, { text: error, onRetry: load });
    if (games.length === 0)
        return SP_JSX.jsx(EmptyState, { text: "\u0412 \u043E\u0431\u043B\u0430\u043A\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0431\u044D\u043A\u0430\u043F\u043E\u0432 \u2014 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u0439\u0442\u0435 \u0438\u0433\u0440\u0443" });
    const totalBackups = games.reduce((sum, item) => sum + item.entries.length, 0);
    const totalSize = games.reduce((sum, item) => sum + item.entries.reduce((acc, entry) => acc + (entry.size || 0), 0), 0);
    const latest = selectedGame?.entries[0];
    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsxs(DFL.PanelSection, { children: [SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { ...card, display: "flex", alignItems: "center", gap: "10px" }, children: [SP_JSX.jsx(FaCloudDownloadAlt, { style: { color: "#66c0f4", fontSize: "18px", flex: "0 0 auto" } }), SP_JSX.jsxs("div", { style: { flex: "1 1 auto", minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: colors.text }, children: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0439" }), SP_JSX.jsxs("div", { style: { fontSize: "11px", color: colors.dim, marginTop: "2px" }, children: [providerName, " \u00B7 ", games.length, " \u0438\u0433\u0440 \u00B7 ", totalBackups, " \u0431\u044D\u043A\u0430\u043F\u043E\u0432 \u00B7 ", formatBytes$2(totalSize)] })] }), SP_JSX.jsx("div", { style: { width: "176px", flex: "0 0 auto" }, children: SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaRedo, {}), onClick: () => load(true), disabled: refreshing, children: refreshing ? "Обновление…" : "Обновить список" }) })] }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(DFL.Dropdown, { menuLabel: "\u0425\u0440\u0430\u043D\u0438\u0442\u044C \u0432\u0435\u0440\u0441\u0438\u0439 \u043D\u0430 \u0438\u0433\u0440\u0443", rgOptions: VERSION_OPTIONS, selectedOption: maxVersions, onChange: (option) => changeMaxVersions(Number(option.data)) }) }), SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs(Hint, { children: ["\u041F\u043B\u0430\u0433\u0438\u043D \u0445\u0440\u0430\u043D\u0438\u0442 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u044E\u044E \u0432\u0435\u0440\u0441\u0438\u044E \u0438 \u0434\u043E ", Math.max(0, maxVersions - 1), " \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0445. \u041F\u0435\u0440\u0435\u0434 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435\u043C \u0442\u0435\u043A\u0443\u0449\u0438\u0435 \u0441\u0435\u0439\u0432\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u0432 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u044B\u0439 \u0430\u0440\u0445\u0438\u0432."] }) }), status && (SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx(StatusMessage, { tone: status.tone, children: status.text }) }))] }), SP_JSX.jsxs("div", { style: { display: "flex", gap: "12px", alignItems: "flex-start", padding: "0 16px" }, children: [SP_JSX.jsx("div", { style: { flex: "1 1 0", minWidth: "0", display: "flex", flexDirection: "column", gap: "10px" }, children: games.map((item) => {
                            const last = item.entries[0];
                            const isSelected = selectedGame?.game === item.game;
                            return (SP_JSX.jsxs("div", { onClick: () => setSelected(item.game), style: {
                                    ...card,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "8px",
                                    cursor: "pointer",
                                    borderColor: isSelected ? "rgba(102,192,244,0.45)" : undefined,
                                }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }, children: [SP_JSX.jsxs("div", { style: { minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: "13px", fontWeight: 600, color: colors.text }, children: item.game }), SP_JSX.jsxs("div", { style: { fontSize: "10.5px", color: colors.dim, marginTop: "2px" }, children: [formatDate$2(last?.created), " \u00B7 ", formatBytes$2(last?.size), " \u00B7 ", (last?.paths || []).length, " \u043F\u0443\u0442\u0435\u0439"] })] }), SP_JSX.jsxs(Badge, { tone: "success", children: [SP_JSX.jsx(FaCloud, { style: { marginRight: "4px" } }), "\u0432 \u043E\u0431\u043B\u0430\u043A\u0435"] })] }), SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaUndoAlt, {}), onClick: () => last && askRestore(item.game, last), disabled: !last || restoring, children: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C" })] }, item.game));
                        }) }), selectedGame && latest && (SP_JSX.jsxs("aside", { style: { ...card, width: "296px", flex: "0 0 296px", display: "flex", flexDirection: "column", gap: "8px", minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: "14px", fontWeight: 600, color: colors.text }, children: selectedGame.game }), SP_JSX.jsxs("div", { style: dimText, children: ["\u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0431\u044D\u043A\u0430\u043F: ", formatDate$2(latest.created)] }), SP_JSX.jsxs("div", { style: { fontSize: "24px", fontWeight: 600, color: colors.text }, children: [formatBytes$2(latest.size), " ", SP_JSX.jsxs("span", { style: { fontSize: "11px", fontWeight: 400, color: colors.dim }, children: ["\u00B7 ", selectedGame.entries.length, " \u0432\u0435\u0440\u0441\u0438\u0439"] })] }), SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: colors.muted }, children: [SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: "8px" }, children: [SP_JSX.jsx("span", { children: "\u041F\u0443\u0442\u0435\u0439 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0439" }), SP_JSX.jsx("span", { style: { color: colors.text }, children: (latest.paths || []).length })] }), SP_JSX.jsxs("div", { style: { display: "flex", justifyContent: "space-between", gap: "8px", minWidth: 0 }, children: [SP_JSX.jsx("span", { children: "\u0412 \u043E\u0431\u043B\u0430\u043A\u0435" }), SP_JSX.jsx("span", { style: { color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: "0 1 auto" }, children: String(latest.remote || "").split("/").slice(-2).join("/") })] })] }), SP_JSX.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }, children: selectedGame.entries.slice(0, 6).map((entry) => (SP_JSX.jsxs("div", { style: {
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "8px",
                                        fontSize: "10.5px",
                                        color: colors.dim,
                                        padding: "3px 0",
                                        borderTop: "1px solid rgba(255,255,255,0.05)",
                                    }, children: [SP_JSX.jsx("span", { children: formatDate$2(entry.created) }), SP_JSX.jsx("span", { children: formatBytes$2(entry.size) })] }, entry.id))) }), SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaUndoAlt, {}), onClick: () => askRestore(selectedGame.game, latest), disabled: restoring, children: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0438\u0437 \u043E\u0431\u043B\u0430\u043A\u0430" }), SP_JSX.jsx(ActionButton, { icon: SP_JSX.jsx(FaDownload, {}), onClick: () => download(selectedGame.game, latest), disabled: downloading, children: downloading ? "Скачивание…" : "Скачать .tar.gz" }), SP_JSX.jsx(Hint, { children: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0438\u0448\u0435\u0442 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u0435\u0439\u0432\u044B. \u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F \u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0430 \u043A\u0430\u043A \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0430\u044F." })] }))] })] }));
}

const formatBytes$1 = (bytes) => {
    if (!bytes)
        return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
};
const formatDate$1 = (isoString) => {
    if (!isoString)
        return "—";
    try {
        return new Date(isoString).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    catch {
        return isoString;
    }
};
function StatCard({ icon: Icon, label, value, sub }) {
    return (SP_JSX.jsxs("div", { style: {
            flex: "1 1 0",
            minWidth: "150px",
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "8px",
            padding: "12px 14px",
            boxSizing: "border-box",
        }, children: [SP_JSX.jsxs("div", { style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    fontSize: "10px",
                    letterSpacing: "0.7px",
                    textTransform: "uppercase",
                    color: colors.dim,
                    fontWeight: 600,
                }, children: [SP_JSX.jsx(Icon, { style: { color: "#66c0f4" } }), label] }), SP_JSX.jsx("div", { style: { fontSize: "24px", fontWeight: 600, marginTop: "8px", color: colors.text }, children: value }), sub && SP_JSX.jsx("div", { style: { fontSize: "10.5px", color: colors.dim, marginTop: "3px" }, children: sub })] }));
}
function StatsTab() {
    const [stats, setStats] = SP_REACT.useState(null);
    const [recent, setRecent] = SP_REACT.useState([]);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    const loadStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await call("get_sync_stats", {});
            if (!result.success || !result.stats) {
                setError(result.error || "Ошибка загрузки статистики");
                return;
            }
            setStats(result.stats);
            try {
                const backups = await call("get_backups", {});
                const flat = [];
                for (const group of backups?.games || []) {
                    for (const entry of group.entries || []) {
                        flat.push({ game: group.game, created: entry.created, size: entry.size });
                    }
                }
                flat.sort((a, b) => String(b.created || "").localeCompare(String(a.created || "")));
                setRecent(flat.slice(0, 4));
            }
            catch (err) {
                console.error("Failed to load recent backups", err);
            }
        }
        catch (err) {
            setError(`Ошибка: ${err}`);
        }
        finally {
            setLoading(false);
        }
    };
    SP_REACT.useEffect(() => {
        loadStats();
    }, []);
    if (loading)
        return SP_JSX.jsx(Loading, { text: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0438..." });
    if (error)
        return SP_JSX.jsx(ErrorState, { text: error, onRetry: loadStats });
    if (!stats)
        return SP_JSX.jsx(EmptyState, { text: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0434\u043B\u044F \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F" });
    const maxCount = Math.max(1, ...(stats.syncsByDate || []).map((item) => item.count));
    return (SP_JSX.jsxs("div", { children: [SP_JSX.jsx(DFL.PanelSection, { children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px", width: "100%" }, children: [SP_JSX.jsx(StatCard, { icon: FaChartBar, label: "\u0412\u0441\u0435\u0433\u043E \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0439", value: String(stats.totalSyncs), sub: "\u0437\u0430 \u0432\u0441\u0451 \u0432\u0440\u0435\u043C\u044F" }), SP_JSX.jsx(StatCard, { icon: FaGamepad, label: "\u0418\u0433\u0440", value: String(stats.gamesCount), sub: "\u0432 \u043E\u0431\u043B\u0430\u043A\u0435" }), SP_JSX.jsx(StatCard, { icon: FaCloudDownloadAlt, label: "\u041E\u0431\u0449\u0438\u0439 \u0440\u0430\u0437\u043C\u0435\u0440", value: formatBytes$1(stats.totalSize || 0), sub: "\u0432 \u043E\u0431\u043B\u0430\u043A\u0435" }), SP_JSX.jsx(StatCard, { icon: FaClock, label: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F", value: formatDate$1(stats.lastSync).split(",")[1]?.trim() || "—", sub: formatDate$1(stats.lastSync).split(",")[0] })] }) }) }), SP_JSX.jsx(DFL.PanelSection, { title: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043F\u043E \u0434\u0430\u0442\u0430\u043C", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "8px" }, children: (stats.syncsByDate || []).slice(0, 7).map((item) => (SP_JSX.jsxs("div", { style: { display: "flex", alignItems: "center", gap: "10px" }, children: [SP_JSX.jsx("span", { style: { width: "86px", fontSize: "10.5px", color: colors.muted }, children: new Date(item.date).toLocaleDateString("ru-RU") }), SP_JSX.jsx("div", { style: { flex: 1, height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)" }, children: SP_JSX.jsx("div", { style: {
                                            width: `${Math.max(4, Math.round((item.count / maxCount) * 100))}%`,
                                            height: "100%",
                                            borderRadius: "4px",
                                            background: "linear-gradient(90deg,#1a9fff,#3fb6ff)",
                                        } }) }), SP_JSX.jsx("span", { style: { fontSize: "10px", color: colors.dim, width: "18px", textAlign: "right" }, children: item.count })] }, item.date))) }) }) }), recent.length > 0 && (SP_JSX.jsx(DFL.PanelSection, { title: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438", children: SP_JSX.jsx(DFL.PanelSectionRow, { children: SP_JSX.jsx("div", { style: { ...card, display: "flex", flexDirection: "column", gap: "6px" }, children: recent.map((entry, index) => (SP_JSX.jsxs("div", { style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                gap: "10px",
                                paddingTop: index > 0 ? "6px" : 0,
                                borderTop: index > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                            }, children: [SP_JSX.jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "12px", color: colors.text }, children: [SP_JSX.jsx(FaHistory, { style: { color: colors.dim } }), entry.game] }), SP_JSX.jsxs("span", { style: { fontSize: "10.5px", color: colors.dim }, children: [formatDate$1(entry.created), entry.size ? ` · ${formatBytes$1(entry.size)}` : ""] })] }, `${entry.game}-${index}`))) }) }) }))] }));
}

const TABS = [
    { id: "main", title: "Основные", icon: SP_JSX.jsx(FaSlidersH, {}), content: SP_JSX.jsx(Settings, {}) },
    { id: "game_paths", title: "Пути игр", icon: SP_JSX.jsx(FaFolderOpen, {}), content: SP_JSX.jsx(GamePathsTab, {}) },
    { id: "backups", title: "Бэкапы", icon: SP_JSX.jsx(FaCloudDownloadAlt, {}), content: SP_JSX.jsx(BackupsTab, {}) },
    { id: "stats", title: "Статистика", icon: SP_JSX.jsx(FaChartBar, {}), content: SP_JSX.jsx(StatsTab, {}) },
];
function SettingsPage() {
    const [currentTab, setCurrentTab] = SP_REACT.useState("main");
    SP_REACT.useEffect(() => {
        const handleTabSwitch = (event) => {
            const tab = event.detail;
            if (TABS.some((item) => item.id === tab)) {
                setCurrentTab(tab);
            }
        };
        window.addEventListener("gamesync-switch-tab", handleTabSwitch);
        return () => {
            window.removeEventListener("gamesync-switch-tab", handleTabSwitch);
        };
    }, []);
    const active = TABS.find((item) => item.id === currentTab) || TABS[0];
    return (SP_JSX.jsxs("div", { style: {
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            boxSizing: "border-box",
            paddingTop: "var(--basicui-header-height, 50px)",
            background: "transparent",
        }, children: [SP_JSX.jsx("div", { style: {
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "0 12px",
                    height: "52px",
                    flex: "0 0 auto",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }, children: TABS.map((tab) => {
                    const isActive = tab.id === active.id;
                    return (SP_JSX.jsxs(DFL.Focusable, { onClick: () => setCurrentTab(tab.id), onActivate: () => setCurrentTab(tab.id), style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "9px 18px 10px",
                            borderRadius: "4px 4px 0 0",
                            fontSize: "13px",
                            color: isActive ? "#ffffff" : "rgba(200,210,218,0.65)",
                            background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                            boxShadow: isActive ? "inset 0 -2px 0 #66c0f4" : "none",
                            cursor: "pointer",
                            userSelect: "none",
                        }, children: [SP_JSX.jsx(Icon, { children: tab.icon }), tab.title] }, tab.id));
                }) }), SP_JSX.jsx("div", { style: { flex: "1 1 auto", overflowY: "auto", overflowX: "hidden", padding: "14px 24px 24px" }, children: active.content })] }));
}

const formatDate = (value) => {
    if (!value)
        return "";
    try {
        return new Date(value).toLocaleString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    catch {
        return value;
    }
};
const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0)
        return "";
    const units = ["Б", "КБ", "МБ", "ГБ"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${Math.round((bytes / Math.pow(1024, index)) * 10) / 10} ${units[index]}`;
};
/**
 * Строка GameSync на странице non-Steam игры в библиотеке Steam.
 *
 * Патч страницы передаёт сюда appid и название; для игр, которые плагин
 * не знает, бэкенд отвечает found=false и строка не рисуется.
 */
function GameSyncGameRow({ appId, title }) {
    const [status, setStatus] = SP_REACT.useState(null);
    const [checked, setChecked] = SP_REACT.useState(false);
    const [busy, setBusy] = SP_REACT.useState(false);
    const [message, setMessage] = SP_REACT.useState(null);
    const load = async () => {
        try {
            const response = await call("get_game_sync_status", { appid: appId, game_name: title });
            setStatus(response?.found ? response : null);
        }
        catch (error) {
            console.error("[GameSync] status request failed", error);
            setStatus(null);
        }
        finally {
            setChecked(true);
        }
    };
    SP_REACT.useEffect(() => {
        setChecked(false);
        setStatus(null);
        load();
    }, [appId]);
    if (!checked || !status) {
        return null;
    }
    const syncNow = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const response = await call("sync_game", { game_name: status.game });
            if (!response?.success) {
                setMessage(response?.error || "Не удалось синхронизировать");
            }
            await load();
        }
        catch (error) {
            setMessage(error?.message || String(error));
        }
        finally {
            setBusy(false);
        }
    };
    const openSettings = () => {
        try {
            DFL.Router.CloseSideMenus();
            DFL.Router.Navigate("/gamesync-settings");
            setTimeout(() => window.dispatchEvent(new CustomEvent("gamesync-switch-tab", { detail: "game_paths" })), 150);
        }
        catch (error) {
            console.error("[GameSync] navigation failed", error);
        }
    };
    const details = [
        status.last_sync ? `в облаке с ${formatDate(status.last_sync)}` : "ещё не синхронизировались",
        formatBytes(status.size),
        status.versions && status.versions > 1 ? `${status.versions} версий` : "",
        status.save_paths ? `${status.save_paths} путей` : "",
    ]
        .filter(Boolean)
        .join(" · ");
    return (SP_JSX.jsxs(DFL.Focusable, { "flow-children": "row", style: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 16px",
            margin: "0 0 10px",
            background: "rgba(20, 32, 40, 0.72)",
            borderLeft: "3px solid #66c0f4",
            borderRadius: "4px",
        }, children: [SP_JSX.jsx(FaCloud, { style: { fontSize: "20px", color: "#7fd0ff", flex: "0 0 auto" } }), SP_JSX.jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "2px", flex: "1 1 auto", minWidth: 0 }, children: [SP_JSX.jsx("div", { style: { fontSize: "11px", letterSpacing: "0.6px", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }, children: "GameSync" }), SP_JSX.jsx("div", { style: { fontSize: "13px", color: "#e8eef3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, children: details }), message && SP_JSX.jsx("div", { style: { fontSize: "11px", color: "#f0a0a0" }, children: message })] }), SP_JSX.jsx(DFL.DialogButton, { style: { minWidth: "170px" }, onClick: syncNow, disabled: busy, children: busy ? "Синхронизация…" : "Синхронизировать" }), SP_JSX.jsx(DFL.DialogButton, { style: { minWidth: "110px" }, onClick: openSettings, children: "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C" })] }));
}

const ROUTE = "/library/app/:appid";
/** renderFunc уже пропатченные — не навешиваем второй afterPatch. */
const patchedRenderFuncs = new WeakSet();
/** Патчи, которые надо снять при выгрузке плагина. */
const appliedPatches = [];
function getOverview(tree) {
    const node = DFL.findInReactTree(tree, (x) => x?.props?.children?.props?.overview);
    return node?.props?.children?.props?.overview;
}
function getInnerContainer(tree) {
    const innerClass = DFL.appDetailsClasses?.InnerContainer;
    if (!innerClass) {
        return null;
    }
    return DFL.findInReactTree(tree, (x) => Array.isArray(x?.props?.children) &&
        typeof x?.props?.className === "string" &&
        x.props.className.includes(innerClass));
}
function findPlaySectionIndex(children) {
    for (let index = 0; index < children.length; index += 1) {
        const child = children[index];
        const name = String(child?.type?.displayName || child?.type?.name || "");
        if (/play/i.test(name)) {
            return index;
        }
    }
    return -1;
}
function injectRow(tree) {
    const overview = getOverview(tree);
    const appId = overview?.appid ?? overview?.app_id;
    if (appId === undefined || appId === null) {
        return;
    }
    const container = getInnerContainer(tree);
    if (!container) {
        return;
    }
    const key = `gamesync-status-${appId}`;
    const children = container.props.children;
    if (children.some((child) => child?.key === key)) {
        return;
    }
    const title = overview?.display_name || overview?.localized_name || overview?.name;
    // Ставим сразу после строки Play. Если её не нашли — в начало контента,
    // но никогда в конец: раньше фиксированный индекс 2 отправлял строку вниз.
    const playIndex = findPlaySectionIndex(children);
    const index = playIndex >= 0 ? playIndex + 1 : Math.min(1, children.length);
    children.splice(index, 0, SP_REACT.createElement(GameSyncGameRow, { key, appId, title }));
}
/**
 * Добавляет строку GameSync на страницу игры.
 * Возвращает функцию очистки для `onDismount`.
 */
function installAppDetailsPatch() {
    try {
        const routePatch = routerHook.addPatch(ROUTE, (tree) => {
            try {
                const routeProps = DFL.findInReactTree(tree, (x) => x?.renderFunc);
                if (routeProps && !patchedRenderFuncs.has(routeProps)) {
                    patchedRenderFuncs.add(routeProps);
                    const handler = DFL.createReactTreePatcher([(node) => DFL.findInReactTree(node, (x) => x?.props?.children?.props?.overview)?.props?.children], (_args, ret) => {
                        try {
                            injectRow(ret);
                        }
                        catch (error) {
                            console.error("[GameSync] failed to inject game row", error);
                        }
                        return ret;
                    });
                    appliedPatches.push(DFL.afterPatch(routeProps, "renderFunc", handler));
                }
            }
            catch (error) {
                console.error("[GameSync] app details patch setup failed", error);
            }
            return tree;
        });
        return () => {
            try {
                routerHook.removePatch(ROUTE, routePatch);
            }
            catch (error) {
                console.error("[GameSync] failed to remove route patch", error);
            }
            while (appliedPatches.length > 0) {
                try {
                    appliedPatches.pop()?.unpatch();
                }
                catch (error) {
                    console.error("[GameSync] failed to unpatch renderFunc", error);
                }
            }
        };
    }
    catch (error) {
        console.error("[GameSync] cannot register app details patch", error);
        return () => { };
    }
}

var index = definePlugin(() => {
    // Строка статуса на странице non-Steam игры в библиотеке Steam
    const removeAppDetailsPatch = installAppDetailsPatch();
    // Регистрация маршрута для полноразмерной страницы настроек
    routerHook.addRoute("/gamesync-settings", () => {
        return SP_JSX.jsx(SettingsPage, {});
    });
    return {
        name: "GameSync NonSteam",
        titleView: SP_JSX.jsx("div", { className: DFL.staticClasses.Title, children: "GameSync" }),
        content: (SP_JSX.jsx("div", { children: SP_JSX.jsx(GameSyncMain, {}) })),
        icon: SP_JSX.jsx(FaCloud, {}),
        onDismount() {
            try {
                removeAppDetailsPatch();
            }
            catch (error) {
                console.error("[GameSync] failed to remove app details patch", error);
            }
            routerHook.removeRoute("/gamesync-settings");
        },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
