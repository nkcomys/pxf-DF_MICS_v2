
//% color="#49cef7" weight=10 icon="\uf1b0" block="DFMics" blockId="DFMics"
namespace dfmics {

    export enum MTYPE{
        //% block="CarbonMonoxide (CO)"
        CO = 0x01,
        //% block="Methane (CH4)"
        CH4 = 0x02,
        //% block="Ethanol (C2H5OH)"
        C2H5OH = 0x03,
        //% block="Hydrogen (H2)"
        H2 = 0x06,
        //% block="Ammonia (NH3)"
        NH3 = 0x08,
        //% block="NitrogenDioxide (NO2)"
        NO2 = 0x0A,
    }
    
    
    export enum Addr{
        //% block="0x75"
        ADDR1 = 0x75,
        //% block="0x76"
        ADDR2 = 0x76,
        //% block="0x77"
        ADDR3 = 0x77,
        //% block="0x77"
        ADDR4 = 0x77,
    }

    let I2CAddr = 0x75;
    let POWER_MODE_REGISTER = 0x0a;
    let OX_REGISTER_HIGH = 0x04;

    let __r0_ox = 0;
    let __r0_red = 0;


    /**
     * TODO:设置I2C地址
     * @param addr I2C地址 
     */
    //% block="Initialize device set I2C addr %addr"
    //% weight=98
    export function setAddr(eAddr: Addr){
        I2CAddr = eAddr;
    }

    /**
     * TODO: warmUpTime
     */
    //% block="Warm Up"
    //% weight=96
    export function warmUp(){
        basic.pause(1000);

        let buffer = readReg(OX_REGISTER_HIGH, 6);

        let oxData = (buffer[0] << 8) | buffer[1];
        let redData = (buffer[2] << 8) | buffer[3];
        let powerData = (buffer[4] << 8) | buffer[5];

        __r0_ox  = powerData - oxData;
        __r0_red = powerData - redData;
    }
    
    /**
     * TODO: 讀取傳感器計算後的氣體濃度（PPM）數據
     * @param eOption 氣體類別
     */
    //% block="Read the gas %eOption concentration (PPM) data calculated by the sensor"
    //% weight=95
    export function getGasData(eOption: MTYPE): number {

        let buffer = readReg(OX_REGISTER_HIGH, 6);

        let oxData = (buffer[0] << 8) | buffer[1];
        let redData = (buffer[2] << 8) | buffer[3];
        let powerData = (buffer[4] << 8) | buffer[5];

        let RS_R0_RED_data = (powerData - redData) / __r0_red;
        let RS_R0_OX_data = (powerData - oxData) / __r0_ox;

        switch(eOption){
            case MTYPE.CO:
                return getCarbonMonoxide(RS_R0_RED_data);
            case MTYPE.CH4:
                return getMethane(RS_R0_RED_data);
            case MTYPE.C2H5OH:
                return getEthanol(RS_R0_RED_data);
            case MTYPE.H2:
                return getHydrogen(RS_R0_RED_data);
            case MTYPE.NH3:
                return getAmmonia(RS_R0_RED_data);
            case MTYPE.NO2:
                return getNitrogenDioxide(RS_R0_OX_data);
            default:
                return -1;
        }
    }



    function getCarbonMonoxide(data: number): number
    {
    if(data > 0.425)
        return 0.0;
    let co = (0.425 - data) / 0.000405;
    if(co > 1000.0)
        return 1000.0;
    if(co < 1.0) 
        return 0.0;
    return co;
    }

    function getEthanol(data: number): number
    {
    if(data > 0.306)
        return 0.0;
    let ethanol = (0.306 - data) / 0.00057;
    if(ethanol < 10.0) 
        return 0.0;
    if(ethanol > 500.0) 
        return 500.0;
    return ethanol;
    }

    function getMethane(data: number): number
    {
    if(data > 0.786)
        return 0.0;
        let methane = (0.786 - data) / 0.000023;
    if(methane < 1000.0) methane = 0.0;
    if(methane > 25000.0) methane = 25000.0;
    return methane;
    }

    function getNitrogenDioxide(data: number): number
    {
    if(data < 1.1) return 0;
    let nitrogendioxide = (data - 0.045) / 6.13;
    if(nitrogendioxide < 0.1)
        return 0.0;
    if(nitrogendioxide > 10.0)
        return 10.0;
    return nitrogendioxide;
    }

    function getHydrogen(data: number): number
    {
    if(data > 0.279)
        return 0.0;
        let hydrogen = (0.279 - data) / 0.00026;
    if(hydrogen < 1.0) 
        return 0.0;
    if(hydrogen > 1000.0) 
        return 1000.0;
    return hydrogen;
    }

    function getAmmonia(data: number): number
    {
    if(data > 0.8)
        return 0.0;
        let ammonia = (0.8 - data) / 0.0015;
    if(ammonia < 1.0) 
        return 0.0;
    if(ammonia > 500.0) 
        return 500.0;
    return ammonia;
    }


    /**
     * TODO: Get Power State
     */
    //% block="Get Power State"
    //% weight=92
    export function getPowerState(): number {
        let buffer = readReg(POWER_MODE_REGISTER,1);
        return buffer[0];
    }

    /**
     * TODO: SleepMode
     */
    //% block="Sleep Mode"
    //% weight=91
    export function sleepMode() {
        let buffer = pins.createBuffer(2);
        buffer[0]=POWER_MODE_REGISTER;
        buffer[1]=0x00;
        writeReg(buffer);
        basic.pause(100);
    }

    /**
     * TODO: wakeUpMode
     */
    //% block="Wake Up Mode"
    //% weight=89
    export function wakeUpMode() {
        let buffer = pins.createBuffer(2);
        buffer[0]=POWER_MODE_REGISTER;
        buffer[1]=0x01;
        writeReg(buffer);
        basic.pause(100);
    }


    /**
     * TODO: 从指定传感器中获取指定长度数据
     * @param  reg 寄存器值
     * @param  len 获取数据长度
     * @return 返回获取数据的buffer
     */
    function readReg(reg:number, len:number):Buffer{
        pins.i2cWriteNumber(I2CAddr, reg, NumberFormat.Int8LE);
        return pins.i2cReadBuffer(I2CAddr, len);
    }

    /**
     * TODO:向指定传感器寄存器中写入数据
     * @param reg 寄存器值
     * @param buf 写入数据
     * @return 无返回
     */
    function writeReg(buf:Buffer):void{
        pins.i2cWriteBuffer(I2CAddr, buf);
    }
}