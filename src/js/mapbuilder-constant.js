//定义常量
MapBuilderConstant = {}

MapBuilderConstant.TOOL_SELECT = 0
MapBuilderConstant.TOOL_ADD_DEVICEGROUP = 1
MapBuilderConstant.TOOL_ADD_PATHNODE = 2
MapBuilderConstant.TOOL_ADD_DEVICE = 3
MapBuilderConstant.TOOL_ADD_PATHNODE_GROUP = 4

MapBuilderConstant.TOOL_SELECT_MODE_DEFAULT = 0
MapBuilderConstant.TOOL_SELECT_MODE_MOVE = 1
MapBuilderConstant.TOOL_SELECT_MODE_BOX = 2
MapBuilderConstant.TOOL_SELECT_MODE_RESIZE_WIDTH = 3
MapBuilderConstant.TOOL_SELECT_MODE_RESIZE_HEIGHT = 4

//站所平面图上的对象类型
MapBuilderConstant.OBJECT_TYPE_DEVICE = 0
MapBuilderConstant.OBJECT_TYPE_PATHNODE = 1
MapBuilderConstant.OBJECT_TYPE_ENVDEVICE = 2

//机柜
MapBuilderConstant.DEVICE_TYPE_CABINET = '00'
//SF6
MapBuilderConstant.DEVICE_TYPE_SF6 = '01' //3
//防盗
MapBuilderConstant.DEVICE_TYPE_GUARD = '02' //10
//烟雾
MapBuilderConstant.DEVICE_TYPE_FOG = '03' //10
//温度
MapBuilderConstant.DEVICE_TYPE_TEMP = '04' //10
//O3
MapBuilderConstant.DEVICE_TYPE_O3 = '05' //4
//空调
MapBuilderConstant.DEVICE_TYPE_AIRCONDITIONER = '06' //13
//液位传感器
MapBuilderConstant.DEVICE_TYPE_WATERLEVEL = '07' //5
//水泵
MapBuilderConstant.DEVICE_TYPE_WATERPUMP = '08' //1
//门禁
MapBuilderConstant.DEVICE_TYPE_DOOR = '09' //2
//风机
MapBuilderConstant.DEVICE_TYPE_CLOUD = '10' //8
//湿度
MapBuilderConstant.DEVICE_TYPE_HUMIDITY = '11' //8
//灯
MapBuilderConstant.DEVICE_TYPE_LIGHT = '12' //8
//电池容量
MapBuilderConstant.DEVICE_TYPE_BATTERY = '13' //8

MapBuilderConstant.CANVAS_BACKGROUND_COLOR = '#003442'
MapBuilderConstant.CANVAS_LINE_COLOR = '#ffffff'
MapBuilderConstant.CANVAS_LINE_WIDTH = 2

//添加路径点
//直线
MapBuilderConstant.TOOL_ADD_PATHNODE_LINE = 0
//90度弧
MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90 = 1
//180度弧
MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90MINUS = 2

//值类型
MapBuilderConstant.VALUE_TYPE_NUMBER = 0
MapBuilderConstant.VALUE_TYPE_STRING = 1
MapBuilderConstant.VALUE_TYPE_DEVICE = 2
MapBuilderConstant.VALUE_TYPE_ENVDEVICE = 3
MapBuilderConstant.VALUE_TYPE_FLOAT = 5
MapBuilderConstant.VALUE_TYPE_OPTION = 4

//用户操作类型
MapBuilderConstant.ACTION_ADD_OBJECT = 0
MapBuilderConstant.ACTION_DELETE_OBJECT = 1
MapBuilderConstant.ACTION_CHANGE_OBJECT = 2

MapBuilderConstant.CANVAS_WIDTH = 800
MapBuilderConstant.CANVAS_HEIGHT = 480

//打开设备选择窗体的目的
//选择设备组
MapBuilderConstant.DIALOG_SELECT_DEVICEGROUP = 1
//选择设备
MapBuilderConstant.DIALOG_SELECT_DEVICE = 2
//
MapBuilderConstant.DIALOG_SELECT_ENVDEVICE = 3
