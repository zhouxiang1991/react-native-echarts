import {
  WebView,
  /* View, */
  Platform,
} from 'react-native';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

const toString = (obj) => {
  let result = JSON.stringify(obj, (key, val) => {
    if (typeof val === 'function') {
      return `~--demo--~${val}~--demo--~`;
    }
    return val;
  });

  do {
    result = result.replace('"~--demo--~', '');
    result = result.replace('~--demo--~"', '');
    result = result.replace(/\\n/g, '');
    result = result.replace(/\\"/g, '"');
  } while (result.indexOf('~--demo--~') >= 0);
  return result;
};

const unicodeTransformChinese = (str) => {
  let ret = str;
  ret = ret.replace(
    /\\u([0-9a-fA-F]{2,4})/g,
    (string, matched) => {
      let chinese = parseInt(matched, 16);
      chinese = String.fromCharCode(chinese);
      return chinese;
    },
  );
  return ret;
};

export default class Echarts extends Component {
  constructor() {
    super();
    this.state = {
      width: 0,
      height: 0,
      option: '',
    };
  }
  componentWillMount() {
    const {
      width,
      height,
      option: _option,
    } = this.props;
    this.state.width = width;
    this.state.height = height;
    this.state.option = this.getOption(_option);
  }
  componentDidMount() {
    this._isMounted = true;
  }
  componentWillReceiveProps({ option: _option }) {
    if (_option !== this.props.option) {
      this.state.option = this.getOption(_option);
      const js = `
        myChart.setOption(${this.state.option});
      `;
      this.chart.injectJavaScript(js);
    }
  }
  shouldComponentUpdate(props) {
    const thisProps = this.props || {};
    const nextProps = props || {};
    if (Object.keys(thisProps).length !== Object.keys(nextProps).length) {
      return true;
    }

    for (const key in nextProps) {
      if (JSON.stringify(thisProps[key]) !== JSON.stringify(nextProps[key])) {
        return true;
      }
    }
    return false;
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  getOption(option) {
    let ret = toString(option);
    ret = unicodeTransformChinese(ret);
    return ret;
  }
  getRenderChartJsCode() {
    const {
      height,
      width,
      option,
    } = this.state;
    return `
      document.getElementById('main').style.height = "${height}px";
      document.getElementById('main').style.width = "${width}px";
      var myChart = echarts.init(document.getElementById('main'));
      myChart.setOption(${option});
      myChart.on('click', function(params) {
        var seen = [];
        var paramsString = JSON.stringify(params, function(key, val) {
          if (val != null && typeof val == "object") {
            if (seen.indexOf(val) >= 0) {
              return;
            }
            seen.push(val);
          }
          return val;
        });
        window.postMessage(paramsString);
      });
    `;
  }
  _setState(state) {
    if (this._isMounted) {
      this.setState(state);
    }
  }
  handleRefs = (chart) => {
    this.chart = chart;
  }
  handleOnMessage = ({ nativeEvent }) => {
    const {
      onPress,
    } = this.props;
    if (onPress) {
      const data = JSON.parse(nativeEvent.data);
      onPress(data);
    }
  }
  render() {
    /*
     * console.log(
     *   this.state,
     *   'this.state',
     * );
     */
    const {
      height,
      width,
    } = this.props;
    /* const source = (Platform.OS === 'ios' || __DEV__) */
    const source = Platform.OS === 'ios'
      ? require('./tpl.html')
      : {
        uri: 'file:///android_asset/echarts.html',
      };
    const js = this.getRenderChartJsCode();
    /*
     * console.log(
     *   js,
     *   'js',
     * );
     */
    const webViewStyle = {
      height,
      width,
      backgroundColor: 'transparent',
    };
    return (
      <WebView
        style={webViewStyle}
        ref={this.handleRefs}
        scrollEnabled={false}
        injectedJavaScript={js}
        scalesPageToFit={Platform.OS === 'android'}
        source={source}
        onMessage={this.handleOnMessage}
      />
    );
  }
}

Echarts.defaultProps = {
  width: 220,
  height: 220,
  option: {},
};

Echarts.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  option: PropTypes.object,
};
