// 在此处测试；当此软件包作为插件使用时，将不会编译此软件包。
dfmics.setAddr(dfmics.Addr.ADDR1)
basic.pause(5000);
dfmics.warmUp()
dfmics.wakeUpMode()
basic.forever(function () {
    serial.writeValue("CO", dfmics.getGasData(dfmics.MTYPE.CO))
    serial.writeValue("CH4", dfmics.getGasData(dfmics.MTYPE.CH4))
    serial.writeValue("C2H5OH", dfmics.getGasData(dfmics.MTYPE.C2H5OH))
    serial.writeValue("H2", dfmics.getGasData(dfmics.MTYPE.H2))
    serial.writeValue("NH3", dfmics.getGasData(dfmics.MTYPE.NH3))
    serial.writeValue("NO2", dfmics.getGasData(dfmics.MTYPE.NO2))
    basic.pause(100)
})
