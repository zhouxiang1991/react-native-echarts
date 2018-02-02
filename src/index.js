import {
  WebView,
  Platform,
} from 'react-native';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

const echartHtml = require('./echart.html');

export default class Echarts extends Component {
  constructor() {
    super();
    this.load = false;
  }
  componentWillMount() {
  }
  componentDidMount() {
    this._isMounted = true;
  }
  async componentWillReceiveProps({ option }) {
    if (option !== this.props.option) {
      const message = this.stringify(option);
      for (;;) {
        await new Promise((r) => setTimeout(r, 100));
        if (this.load) {
          this.chart.postMessage(message);
          return;
        }
      }
    }
  }
  shouldComponentUpdate() {
    return false;
  }
  componentWillUnmount() {
    this._isMounted = false;
  }
  getRenderChartJsCode() {
    const {
      height,
      width,
    } = this.props;
    return `
      document.getElementById('main').style.height = "${height}px";
      document.getElementById('main').style.width = "${width}px";
      var myChart = echarts.init(document.getElementById('main'));
      myChart.setOption({});
      myChart.on('click', function (){
        window.postMessage('aa');
      });
      var parse = function (str) {
        const result = JSON.parse(str, function(key, val) {
          if (
            typeof val === 'string'
            && val.match(/~~function~~/g)
          ) {
            var code = val.replace(/~~function~~/g, '');
            code = eval('(' + code + ')');
            return code;
          }
          return val;
        });
        return result;
      };
      var handleMessage = function (_message) {
        try {
          var message = parse(_message.data);
          myChart.setOption(message);
        } catch (e) {
          window.postMessage(e);
        }
      };
      window.document.addEventListener('message', handleMessage);
    `;
  }
  getEchartHtml() {
    if (Platform.OS === 'ios' || __DEV__) {
      return echartHtml;
    }

    return {
      uri: 'file:///android_asset/echarts.html',
    };
  }
  stringify(obj) {
    const result = JSON.stringify(obj, (key, val) => {
      if (typeof val === 'function') {
        return `~~function~~${val}~~function~~`;
      }
      return val;
    });
    /* result = unicodeTransformChinese(result); */
    return result;
  }
  handleRefs = (chart) => {
    this.chart = chart;
  }
  handleMessage = ({ nativeEvent }) => {
  }
  handleWebViewLoadend = () => {
    this.load = true;
  }
  render() {
    const {
      height,
      width,
    } = this.props;
    const webViewStyle = {
      height,
      width,
      backgroundColor: 'transparent',
    };
    const js = this.getRenderChartJsCode();
    const source = this.getEchartHtml();
    return (
      <WebView
        style={webViewStyle}
        ref={this.handleRefs}
        scrollEnabled={false}
        injectedJavaScript={js}
        scalesPageToFit={Platform.OS === 'android'}
        source={source}
        onMessage={this.handleMessage}
        onLoadEnd={this.handleWebViewLoadend}
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

