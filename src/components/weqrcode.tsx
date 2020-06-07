import Taro, { Component } from '@tarojs/taro'
import { Canvas, View } from '@tarojs/components'
import drawQrcode from 'weapp-qrcode';
import './weqrcode.less'

interface IMyComponentProps {
    className: any,
    value: string | any,
    size: any
}

export default class Weqrcode extends Component<IMyComponentProps, any> {
    constructor(props) {
        super(props)
        this.state = {
            scale: 1
        }
    }
    async componentDidMount() {
        // 设置屏幕比例
        const res = await Taro.getSystemInfo();
        const scale = res.screenWidth / 375;
        this.initQrCode(scale)
    }
    componentDidUpdate(nextProps) {
        const { scale } = this.state
        if (nextProps.value !== this.props.value) {
            this.initQrCode(scale)
        }
    }
    initQrCode(scale) {
        const { value } = this.props
        if (!value) return
        drawQrcode({
            width: 200 * scale,
            height: 180 * scale,
            _this: this.$scope,
            canvasId: 'drawQrCanvas',
            text: value
        });
    }

    render () {
        const { value } = this.props
        return value ? (
            <Canvas className='canvas' canvasId='drawQrCanvas'></Canvas>
        ) : (<View className="canvas canvas-text">请输入WiFi名和密码</View>)
    }
}