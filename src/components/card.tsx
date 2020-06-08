/*
 * @Author: your name
 * @Date: 2020-06-06 11:48:16
 * @LastEditTime: 2020-06-07 23:20:47
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /wifi-card/src/components/Card.js
 */ 
import Taro, { Component } from '@tarojs/taro'
import { View, Button, Text, Input, Canvas } from '@tarojs/components'
import drawQrcode from 'weapp-qrcode';
import './weqrcode.less'
import './card.less'

interface IMyComponentState {
    ssid: string | number | any,
    password: string | number | any,
    qrvalue: string,
    qrImagePath: string,
    show: boolean,
    scale: number
}

interface IMyComponentProps {
    className?: string
}

export default class Card extends Component<IMyComponentProps, IMyComponentState> {
    constructor(props) {
        super(props);
        this.state = {
            ssid: '',
            password: '',
            qrvalue: '',
            qrImagePath: '',
            show: false,
            scale: 1
        }
    }

    async componentDidMount() {
        // 设置屏幕比例
        const res = await Taro.getSystemInfo();
        const scale = res.screenWidth / 375;
        this.initQrCode(scale)
        this.getLocation()
    }
    componentDidUpdate(nextProps, nextState) {
        const { scale, qrvalue } = this.state
        if (nextState.value !== qrvalue) {
            this.initQrCode(scale)
        }
    }
    initQrCode(scale, callBackFn?:any) {
        const { qrvalue } = this.state
        drawQrcode({
            width: 200 * scale,
            height: 180 * scale,
            _this: this.$scope,
            canvasId: 'drawQrCanvas',
            text: qrvalue,
            callback: (e) => {
                setTimeout(() => {
                    return callBackFn && callBackFn()
                }, 500)
            }
        });
    }

    setSsid = (val) => {
        this.setState({
            ssid: val
        })
    }

    setPassword = (val) => {
        this.setState({
            password: val
        })
    }

    setQrvalue = () => {
        const { ssid, password } = this.state
        this.setState({
            qrvalue: `WIFI:T:WPA;S:${ssid};P:${password};;`
        })
    }

    // 将canvas转换为二维码图片
    createShareQr() {
        let that = this
        that.initQrCode(that.state.scale, () => {
            Taro.canvasToTempFilePath({
                canvasId: 'drawQrCanvas',
                success (res) {
                    console.log(res,'res')
                    let tempFilePath = res.tempFilePath;
                    that.setState({
                        qrImagePath: tempFilePath,
                        // show: true
                    },()=> {
                    that.saveQrToLocal()
                    })
                }
            }, that.$scope)
        })
    }
    // 保存二维码到本地
    saveQrToLocal() {        
        let that = this
        console.log(this.state.qrImagePath,'12111111111')
        Taro.saveImageToPhotosAlbum({
            filePath: that.state.qrImagePath,
            success() {
                console.log('保存成功');
                Taro.showModal({
                title: '提示',
                content: '图片已保存到相册，赶快分享吧！',
                showCancel: false,
                confirmText: '好的',
                success(res) {
                        if (res.confirm) {
                            console.log('用户点击确定');
                        }
                        that.setState({
                            show: false
                        })
                    }
                    
                })
                
            },
            fail: function (err) {
                if (err.errMsg === "saveImageToPhotosAlbum:fail:auth denied" || err.errMsg === "saveImageToPhotosAlbum:fail auth deny") {
                  // 这边微信做过调整，必须要在按钮中触发，因此需要在弹框回调中进行调用
                  Taro.showModal({
                    title: '提示',
                    content: '需要您授权保存相册',
                    showCancel: false,
                    success:modalSuccess=>{
                      Taro.openSetting({
                        success(settingdata) {
                          console.log("settingdata", settingdata)
                          if (settingdata.authSetting['scope.writePhotosAlbum']) {
                            Taro.showModal({
                              title: '提示',
                              content: '获取权限成功,再次点击图片即可保存',
                              showCancel: false,
                            })
                          } else {
                            Taro.showModal({
                              title: '提示',
                              content: '获取权限失败，将无法保存到相册哦~',
                              showCancel: false,
                            })
                          }
                        },
                        fail(failData) {
                          console.log("failData",failData)
                        },
                        complete(finishData) {
                          console.log("finishData", finishData)
                        }
                      })
                    }
                  })
                }
            }
        })
        
    }
    getLocation() {
        const that = this
        Taro.startWifi({
            success: function (res) {
                Taro.getConnectedWifi({
                    success: (resWifi) => {
                        that.setState({
                            ssid: resWifi.wifi.SSID
                        })
                    }
                })
            }
        })
        
    }

    render() {
        const { ssid, password, qrvalue } = this.state
        return (
            <View className={this.props.className || 'card-wrap'}>
                <View className="warnning-text">*注意：小程序不会储存、跟踪、分析你的WiFi信息，源码：https://github.com/gitCoy/mini_wifi_code</View>
                <View className="details">
                <Canvas className='canvas' canvasId='drawQrCanvas'></Canvas>

                    <View className="text">
                        <Text>WiFi名</Text>
                        <Input type="text" maxLength={32} placeholder="WiFi Network name" value={ssid} onInput={event => this.setSsid(event.detail.value)} />
                        <Text>WiFi密码</Text>
                        <Input type="text" maxLength={64} placeholder="Password" value={password} onInput={event => this.setPassword(event.detail.value)} />
                        <Button onClick={this.setQrvalue}>生成二维码</Button>
                        <Button onClick={this.createShareQr}>保存二维码到本地</Button>
                    </View>
                </View>
                <View className="label-text">使用手机相机扫描二维码自动识别WiFi并连接，使用场景主要有，保存二维码到本地，打印贴于室内，或者公开场所扫一扫登录WiFi</View>
            </View>
        )
    }
}

