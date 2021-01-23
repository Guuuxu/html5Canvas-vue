var MAPBUILDER_FAILED = 0;
var MAPBUILDER_SUCCESS = 1;

function MapBuilder() {
	//成员变量
	//dom相关对象
	this.dom = null;
	this.domCanvas = null;
	this.canvas2d = null;
	this.toolHandler = null;
	//成员对象
	this.toolsList = new Array(); // 工具数组
	//当前选中的对象
	this.selectedObject = new Array();
	//查询动作
	this.actions = new Array();
	this.selectedObject = new Array();

	//当为true的时候才接受用户输入
	this.activeMouseEvent = true;

	//回调事件
	this.onMouseMove = null;
	/**
	 *
	 */
	this.onUpdateObjcet = null;
	/**
	 * 当被选择的对象变更时调用
	 */
	this.onSelectedObjectChanged = null;
	/*
	 * 当被选择的对象属性发生改变的时候调用
	 */
	this.onSelectedPropertyChanged = null;
	/**
	 * 当添加机柜的时候调用该函数
	 */
	this.onAddDeviceGroup = null;
	/**
	 * 当节点发生改变的时候调用该函数
	 */
	this.onPathNodeChanged = null;

	/**
	 * 当选择设备结束后进行回调,未使用
	 */
	this.onAddDeviceFinished = null;

    /**
	 * 添加一组节点的时候启用
     */
    this.onAddNodeGroup = null;

	var mapBuilder = this;
	//地图元素控制器对象
	/**
	 * MapController主要功能如下
	 * （1）维护地图上的元素列表(地图主要包含三种元素 1、轨道点 2机柜 3环境设备)
	 * （2）路径重绘制
	 * （3）生成地图数据并上传
	 * （4）从json中读取地图数据
	 */
	this.mapController = {
		//轨道路径点
		pathNodes: new Array(),
		//设备，也就是站所内的机柜
		devices: new Array(),
		//环境设备
		envDevices: new Array(),
		//轨道路径点-未变动之前
		pathNodesOrigin: new Array(),
		//设备，也就是站所内的机柜-未变动之前
		devicesOrigin: new Array(),
		//环境设备-未变动之前
		envDevicesOrigin: new Array(),
		//计算下一个排序值
		curSortId: 0,
		nextSortId: function() {
			this.curSortId++;
			return this.curSortId;
		},
		//重绘轨道点所产生的路径
		redrawPath: function() {
			//清除当前线条
			console.log("redrawPath canvas2d"+mapBuilder.canvas2d);
			mapBuilder.canvas2d.fillStyle = MapBuilderConstant.CANVAS_BACKGROUND_COLOR;
			mapBuilder.canvas2d.fillRect(0, 0, 1000, 600);
			mapBuilder.canvas2d.lineWidth = MapBuilderConstant.CANVAS_LINE_WIDTH;
			mapBuilder.canvas2d.strokeStyle = MapBuilderConstant.CANVAS_LINE_COLOR;

			//TODO
			if(this.pathNodes.length > 0) {
				//根据sort字段进行冒泡排序
				var len = this.pathNodes.length;
				var temp;
				while(len > 0) {
					for(j = 0; j < len - 1; j++) {
						if(this.pathNodes[j].info.sort > this.pathNodes[j + 1].info.sort) {
							temp = this.pathNodes[j];
							this.pathNodes[j] = this.pathNodes[j + 1];
							this.pathNodes[j + 1] = temp;
						}
					}
					len--;
				}
				//设定线条样式
				mapBuilder.canvas2d.beginPath();
				console.log("pathNodes"+this.pathNodes.length+","+JSON.stringify(this.pathNodes[0]));
				for(var i = 0; i < this.pathNodes.length; i++) {
					if(i == 0) {
						mapBuilder.canvas2d.moveTo(this.pathNodes[i].info.posX, this.pathNodes[i].info.posY);
					} else {
						//根据角度画弧
						//直线
						if(this.pathNodes[i].info.angle == 0) {
							mapBuilder.canvas2d.lineTo(this.pathNodes[i].info.posX, this.pathNodes[i].info.posY);
						}
						// 正90度弧 ,表示为凸形90弧
						if(this.pathNodes[i].info.angle == 90) {
							//目标点在当前点上方
							if(this.pathNodes[i].info.posY <= this.pathNodes[i - 1].info.posY) {
								mapBuilder.canvas2d.quadraticCurveTo(this.pathNodes[i - 1].info.posX, this.pathNodes[i].info.posY,
									this.pathNodes[i].info.posX, this.pathNodes[i].info.posY);
							}

							//目标点在当前点下方
							if(this.pathNodes[i].info.posY > this.pathNodes[i - 1].info.posY) {
								mapBuilder.canvas2d.quadraticCurveTo(this.pathNodes[i].info.posX, this.pathNodes[i - 1].info.posY,
									this.pathNodes[i].info.posX, this.pathNodes[i].info.posY);
							}

						}

						// 负90度弧 ,表示为凹形90弧
						if(this.pathNodes[i].info.angle == -90) {
							//目标点在当前点上方
							if(this.pathNodes[i].info.posY <= this.pathNodes[i - 1].info.posY) {
								mapBuilder.canvas2d.quadraticCurveTo(this.pathNodes[i].info.posX, this.pathNodes[i - 1].info.posY,
									this.pathNodes[i].info.posX, this.pathNodes[i].info.posY);
							}
							//目标点在当前点下方
							if(this.pathNodes[i].info.posY > this.pathNodes[i - 1].info.posY) {
								mapBuilder.canvas2d.quadraticCurveTo(this.pathNodes[i - 1].info.posX, this.pathNodes[i].info.posY,
									this.pathNodes[i].info.posX, this.pathNodes[i].info.posY);
							}
						}
					}
				}
				//完成绘制
				mapBuilder.canvas2d.stroke();
				mapBuilder.canvas2d.closePath();
			}
		},
		//添加轨道点
		addNewPathNode: function(x, y, angle,stationNum) {
			var newPathNode = {
				objectType: MapBuilderConstant.OBJECT_TYPE_PATHNODE,
				//data保存的是与数据库相关的信息，格式与数据库保持一致
				info: {
					id: mapBuilder.uuid(),
					posX: x,
					posY: y,
					//节点类型1：实际磁钢片的点2：辅助画图虚拟点
					nodeType: 0,
					//与上一个点的角度，现在有90度和180度
					angle: angle,
					stationNum: !!stationNum ? stationNum : 0,
					mapLength: 1,
					createTime: mapBuilder.getTimeStamp(),
					updateTime: mapBuilder.getTimeStamp(),
					speed : 0.5,
					sort: this.nextSortId()
				},
				//div保存对应div元素的信息
				div: null
			}

			//创建并添加div到面板上注意，div的中心位置对应posX和posY
			this.addObject(newPathNode);
			//回调事件
			if(mapBuilder.onPathNodeChanged){
				mapBuilder.onPathNodeChanged(mapBuilder);
			}
			//返回创建的元素
			return newPathNode;
		},
		//添加机柜设备
		addNewDevice: function(x, y, width, height) {
			var newDevice = {
				objectType: MapBuilderConstant.OBJECT_TYPE_DEVICE,
				//data保存的是与数据库相关的信息，格式与数据库保持一致
				info: {
					id: mapBuilder.uuid(),
					posX: x,
					posY: y,
					//注意平面图上方块宽度就是机柜的长度
					deviceLength: width,
					//注意平面图上方块高度就是机柜的宽度
					deviceWidth: height,
					createTime: mapBuilder.getTimeStamp(),
					updateTime: mapBuilder.getTimeStamp(),
					//以下个字段是表关联CBS_DEVICE_INFO查询获得的,不可手动编辑,只可通过添加关联关系赋值
					deviceId: "",
					deviceName: "未关联设备"

				},
				//div保存对应div元素的信息
				div: null
			}

			//创建并添加div到面板上注意，div的左上角位置对应posX和posY
			this.addObject(newDevice);
			//返回创建的元素
			return newDevice;
		},
		//添加环境设备
		addNewEnvDevice: function(x, y, deviceType) {
			//数据库缺陷：缺少设备名
			var newEnvDevice = {
				objectType: MapBuilderConstant.OBJECT_TYPE_ENVDEVICE,
				//data保存的是与数据库相关的信息，格式与数据库保持一致
				info: {
					id: mapBuilder.uuid(),
					posX: x,
					posY: y,
					createTime: mapBuilder.getTimeStamp(),
					updateTime: mapBuilder.getTimeStamp(),
					//注意，以下三个字段是关联CBS_ENVDEVICE_INFO查询获得的
					envDeviceName: "",
					envDeviceType: deviceType,
					envDeviceId: "",
				},
				//div保存对应div元素的信息
				div: null
			}

			//创建并添加div到面板上注意，div的左上角位置对应posX和posY
			this.addObject(newEnvDevice);
			//返回创建的元素
			return newEnvDevice;
		},
		//添加Object并且创建div
		//flag 表示是不是初始化ajax请求到的数据
		addObject: function(obj,flag) {
			switch(obj.objectType) {
				//添加环境设备
				case MapBuilderConstant.OBJECT_TYPE_ENVDEVICE:
					//创建并添加div到面板上注意，div的左上角位置对应posX和posY
					obj.div = $("<div class='mapEnvDevice'></div>");
					obj.div.appendTo(mapBuilder.dom);
					obj.div.css("left", obj.info.posX - mapBuilder.getPixelValue(obj.div.css("width")) / 2);
					obj.div.css("top", obj.info.posY - mapBuilder.getPixelValue(obj.div.css("height")) / 2);

					//填充环境设备的背景图片
					obj.div.css({
						"background-image": "url(images/" + this.getEnvImageNameByType(obj.info.envDeviceType) + ")"
					});

					this.envDevices.push(obj);
					if(!!flag){
						this.envDevicesOrigin.push(obj);
					}
					break;
				case MapBuilderConstant.OBJECT_TYPE_DEVICE:
					if(null == obj.info.deviceName) {
						obj.info.deviceName = "未关联设备";
					}
					//创建并添加div到面板上注意，div的左上角位置对应posX和posY
					obj.div = $("<div class='mapDevice'></div>");
					obj.div.css("left", obj.info.posX);
					obj.div.css("top", obj.info.posY);
					obj.div.css("width", obj.info.deviceLength);
					obj.div.css("height", obj.info.deviceWidth);

					obj.div.css("line-height", obj.info.deviceWidth + "px");
					obj.div.html(obj.info.deviceName);
					obj.div.appendTo(mapBuilder.dom);

					this.devices.push(obj);
					if(!!flag){
						this.devicesOrigin.push(obj);
					}
					break;
				case MapBuilderConstant.OBJECT_TYPE_PATHNODE:
					//创建并添加div到面板上注意，div的中心位置对应posX和posY
					obj.div = $("<div class='mapPathNode'></div>");
					obj.div.appendTo(mapBuilder.dom);
					obj.div.css("left", obj.info.posX - mapBuilder.getPixelValue(obj.div.css("width")) / 2);
					obj.div.css("top", obj.info.posY - mapBuilder.getPixelValue(obj.div.css("height")) / 2);

					this.pathNodes.push(obj);
					if(!!flag){
						this.pathNodesOrigin.push(obj);
					}
					//重绘路径图
					this.redrawPath();
					break;
			}
		},
		getEnvImageNameByType: function(type){
            switch(type) {
                case MapBuilderConstant.DEVICE_TYPE_SF6:
                    imgName = "equipment_collart_tool_09.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_GUARD:
                    imgName = "equipment_collart_tool_106.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_FOG:
                    imgName = "equipment_collart_tool_104.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_TEMP:
                    imgName = "equipment_collart_tool_08.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_O3:
                    imgName = "equipment_collart_tool_10.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_AIRCONDITIONER://空调
                    imgName = "equipment_collart_tool_07.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_WATERLEVEL:	//液位
                    imgName = "equipment_collart_tool_100.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_WATERPUMP:
                    imgName = "equipment_collart_tool_06.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_DOOR:
                    imgName = "equipment_collart_tool_11.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_CLOUD:
                    imgName = "equipment_collart_tool_05.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_HUMIDITY:
                    imgName = "equipment_collart_tool_102.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_LIGHT:
                    imgName = "equipment_collart_tool_103.png";
                    break;
                case MapBuilderConstant.DEVICE_TYPE_BATTERY:
                    imgName = "equipment_collart_tool_105.png";
                    break;
            }
            return imgName;
		},
		//根据id获取对象
		getObjectById: function(id) {
			for(var index = 0; index < this.devices.length; index++) {
				if(this.devices[index].info.id == id) {
					return this.devices[index];
				}
			}

			for(var index = 0; index < this.envDevices.length; index++) {
				if(this.envDevices[index].info.id == id) {
					return this.envDevices[index];
				}
			}

			for(var index = 0; index < this.pathNodes.length; index++) {
				if(this.pathNodes[index].info.id == id) {
					return this.pathNodes[index];
				}
			}
		},
		//删除其中一个元素
		removeObject: function(obj) {
			if(obj) {
				var dataArray = null;
				switch(obj.objectType) {
					case MapBuilderConstant.OBJECT_TYPE_DEVICE:
						dataArray = this.devices;
						break;
					case MapBuilderConstant.OBJECT_TYPE_ENVDEVICE:
						dataArray = this.envDevices;
						break;
					case MapBuilderConstant.OBJECT_TYPE_PATHNODE:
						dataArray = this.pathNodes;
						break;
				}

				//删除元素
				for(var index = 0; index < dataArray.length; index++) {
					if(dataArray[index].info.id == obj.info.id) {
						//删除界面上的div
						dataArray[index].div.remove();
						//删除内存中的元素
						dataArray.splice(index, 1);
						break;
					}
				}

				//如果删除了点的位置,则重画路径
				if(obj.objectType == MapBuilderConstant.OBJECT_TYPE_PATHNODE) {
					this.redrawPath();
				}

			}
		},
		//根据对象的info中,posX posY等位置属性,同步div的位置
		updateMapObject: function(obj) {
			if(obj) {
				//更新保存的值,这部分功能主要给撤销功能准备的
				var dataArray = null;
				switch(obj.objectType) {
					case MapBuilderConstant.OBJECT_TYPE_DEVICE:
						dataArray = this.devices;
						break;
					case MapBuilderConstant.OBJECT_TYPE_ENVDEVICE:
						dataArray = this.envDevices;
						break;
					case MapBuilderConstant.OBJECT_TYPE_PATHNODE:
						dataArray = this.pathNodes;
						break;
				}
				for(var index = 0; index < dataArray.length; index++) {
					if(dataArray[index].info.id == obj.info.id) {
						mapBuilder.copyValue(dataArray[index], obj);
						break;
					}
				}
				//更新div的位置
				if(obj.objectType == MapBuilderConstant.OBJECT_TYPE_DEVICE) {
					//机柜类型posX 和posY 对应div左上角的点
					obj.div.css("left", obj.info.posX + "px");
					obj.div.css("top", obj.info.posY + "px");
					obj.div.css("width", obj.info.deviceLength + "px");
					obj.div.css("height", obj.info.deviceWidth + "px");
					obj.div.css("line-height", obj.info.deviceWidth + "px");
					obj.div.html(obj.info.deviceName);
				} else {
					//其他类型posX 和posY 对应div中点,高度和宽度由div本身决定(其高度和宽度实际上定义在css中)
					obj.div.css("left", obj.info.posX - mapBuilder.getPixelValue(obj.div.css("width")) / 2 + "px");
					obj.div.css("top", obj.info.posY - mapBuilder.getPixelValue(obj.div.css("height")) / 2 + "px");
				}
				//如果更改了环境设备，则更改图标
                if(obj.objectType == MapBuilderConstant.OBJECT_TYPE_ENVDEVICE) {
                    obj.div.css({
                        "background-image": "url(images/" + this.getEnvImageNameByType(obj.info.envDeviceType) + ")"
                    });
                }

				//如果更改了点的位置,则重画路径
				if(obj.objectType == MapBuilderConstant.OBJECT_TYPE_PATHNODE) {
					//回调事件
					if(mapBuilder.onPathNodeChanged){
						mapBuilder.onPathNodeChanged(mapBuilder);
					}
					this.redrawPath();
				}
			}
		},

		//加载站所地图信息
		loadStationMapInfo: function(url) {
			var controller = this;
			xauto.ajax({

				url: url
			}).ok(function(resp) {
				var devicesList = resp.data.devices;
				var pathNodeList = resp.data.pathNodes;
				var envDevices = resp.data.envDevices;

				//添加路径点
				for(var index = 0; index < pathNodeList.length; index++) {
					//添加一个节点
					var newPathNode = {
						objectType: MapBuilderConstant.OBJECT_TYPE_PATHNODE,
						info: {
							id: pathNodeList[index].id,
							posX: pathNodeList[index].posX,
							posY: pathNodeList[index].posY,
							//节点类型1：实际磁钢片的点2：辅助画图虚拟点
							nodeType: pathNodeList[index].nodeType,
							//与上一个点的角度，现在有90度和180度
							angle: pathNodeList[index].angle,
							stationNum: pathNodeList[index].stationNum,
							mapLength: pathNodeList[index].mapLength,
							createTime: pathNodeList[index].createTime,
							updateTime: pathNodeList[index].updateTime,
							speed: pathNodeList[index].speed,
							obstacleValue: pathNodeList[index].obstacleValue,
							sort: controller.nextSortId()
						},
						div: null
					}

					//添加到地图上
					controller.addObject(newPathNode,true);
				}

				//添加机柜
				for(var index = 0; index < devicesList.length; index++) {
					//添加一个节点
					var newDevice = {
						objectType: MapBuilderConstant.OBJECT_TYPE_DEVICE,
						info: {
							id: devicesList[index].id,
							posX: devicesList[index].posX,
							posY: devicesList[index].posY,
							//注意平面图上方块宽度就是机柜的长度
							deviceLength: devicesList[index].deviceLength,
							//注意平面图上方块高度就是机柜的宽度
							deviceWidth: devicesList[index].deviceWidth,
							createTime: devicesList[index].createTime,
							updateTime: devicesList[index].updateTime,
							//以下个字段是表关联CBS_DEVICE_INFO查询获得的,不可编辑
							deviceId: devicesList[index].deviceId,
							deviceName: devicesList[index].deviceName
						},
						div: null
					}

					//添加到地图上
					controller.addObject(newDevice,true);
				}

				//添加环境设备
				for(var index = 0; index < envDevices.length; index++) {
					//添加一个节点
					var newEnvDevice = {
						objectType: MapBuilderConstant.OBJECT_TYPE_ENVDEVICE,
						info: {
							id: envDevices[index].id,
							posX: envDevices[index].posX,
							posY: envDevices[index].posY,
							createTime: envDevices[index].createTime,
							updateTime: envDevices[index].updateTime,
							//注意，以下三个字段是关联CBS_ENVDEVICE_INFO查询获得的
							envDeviceName: envDevices[index].envDeviceName,
							envDeviceType: envDevices[index].envDeviceType,
							envDeviceId: envDevices[index].envDeviceId,
						},
						div: null
					}

					//添加到地图上
					controller.addObject(newEnvDevice,true);
				}

			}).nook(function(resp) {
				xauto.tip({
					title: "警告",
					desc: "获取站所平面图数据失败！"
				});
			});

		},
		saveStationMapInfo: function(url,callback) {
			var mapData = {
				pathNodes: new Array(),
				devices: new Array(),
				envDevices: new Array(),
				stationNumSpeed: new Array()
			}
			for(var index = 0; index < this.pathNodes.length; index++) {
				mapData.pathNodes.push(this.pathNodes[index].info);
			}

			for(var index = 0; index < this.devices.length; index++) {
				mapData.devices.push(this.devices[index].info);
			}

			for(var index = 0; index < this.envDevices.length; index++) {
				mapData.envDevices.push(this.envDevices[index].info);
				if(!this.envDevices[index].info.envDeviceId) {
					xauto.tip({
						title: "警告",
						desc: "有环境设备未添加关联，请添加关联后再进行保存操作！"
					});
					return;
				}
			}
			//计算速度的数据
			//首先获得真实测点的列表
			var preStationNum = 0;
			var preSpeed = 0;
			var preobstacleValue = 0;
			for(var index = 0; index < this.pathNodes.length; index++) {
				var curStationNum = this.pathNodes[index].info.stationNum;
				if(!!curStationNum && curStationNum > 0){
					//如果磁钢片顺序不对，则无法保存地图
					if(curStationNum <= preStationNum){
						xauto.tip({
							title: "警告",
							desc: "序列在后的磁钢片号不能比序列在前的磁钢片号大，错误的磁钢片号："+curStationNum
						});
						return;
					}

					//找到新的真实磁钢片点,并且已经有前一个磁钢片
					if(preStationNum != 0){
						//循环添加速度
						for(var i = preStationNum;i<curStationNum;i++){
							mapData.stationNumSpeed.push({
								id:mapBuilder.uuid(),
								stationNum:i+1,
								speed:this.pathNodes[index].info.speed,
								obstacleValue: this.pathNodes[index].info.obstacleValue
							})
						}
						preStationNum = curStationNum;
						preSpeed = this.pathNodes[index].info.speed;
						preobstacleValue = this.pathNodes[index].info.obstacleValue;
					}else{
						preStationNum = curStationNum;
						preSpeed = this.pathNodes[index].info.speed;
						preobstacleValue = this.pathNodes[index].info.obstacleValue;
						if(index == 0){
							mapData.stationNumSpeed.push({
								id:mapBuilder.uuid(),
								stationNum:preStationNum,
								speed:preSpeed,
								obstacleValue: preobstacleValue
							});
						}
					}

				}
			}
			//最后一个磁钢片速度保存



			xauto.ajax({
				url: url,
				data: mapData
			}).ok(function(resp) {
				if(typeof callback == "function"){
					callback(true);
				}else{
					xauto.tip({
						title: "信息",
						desc: "保存地图成功！"
					});
				}
			}).nook(function(resp) {
				xauto.tip({
					title: "警告",
					desc: "保存地图失败，失败原因：" + resp.message + "！"
				});
				if(typeof callback == "function"){
					callback(false);
				}
			}).error(function(resp) {
				if(typeof callback == "function"){
					callback(false);
				}
			});;
		}
	}
}

/**
 * 绑定绘制面板到dom节点上
 */
MapBuilder.prototype.bindToDiv = function(obj) {
	//获得dom节点
	$obj = $(obj);
	$(".canvas").html("");
	if($obj.length == 0) {
		xauto.tip({
			title: "警告",
			desc: "绑定地图编辑控件失败，请确认绑定的是一个节点！"
		});
		return MAPBUILDER_FAILED;
	}

	//添加canvas 控件
	this.dom = $obj;
	this.dom.css("position", "relative");
	this.dom.addClass("mapbuilder");
	this.domCanvas = $("<canvas width='" + MapBuilderConstant.CANVAS_WIDTH + "px' height='" + MapBuilderConstant.CANVAS_HEIGHT + "px' style='position:absolute;left:0px;top:0px;'> </canvas>");
	this.dom.append(this.domCanvas);

	//获得canvas对象
	var canvas = this.domCanvas[0];
	if(canvas.getContext) {
		this.canvas2d = canvas.getContext('2d');
	} else {
		xauto.tip({
			title: "警告",
			desc: "此浏览器无法兼容使用Canvas，地图采集功能将无法使用"
		});
		return MAPBUILDER_FAILED;
	}
    console.log("初始化mapBuilder："+JSON.stringify(this))
	//调用初始化函数
	this.initMapBuilder();

	return MAPBUILDER_SUCCESS;
}

/**
 * 绑定绘制面板到dom节点上
 */
MapBuilder.prototype.resize = function() {
	if(this.dom) {
		this.mapController.redrawPath();
	}
	return MAPBUILDER_SUCCESS;
}

/**
 * 解除绑定
 */
MapBuilder.prototype.unbind = function() {
	if(this.dom) {
		this.dom.children().remove();
		//解绑事件
		this.dom.unbind();
		if(this.keyEvent){
			//$(document).unbind(this.keyEvent);
			this.keyEvent = null;
		}

		this.dom = null;
		this.domCanvas = null;
		this.canvas2d = null;
	}
}

/**
 * 初始化插件 主要是绑定事件和加载工具
 */
MapBuilder.prototype.initMapBuilder = function() {
		var mapBuilder = this;

		//绑定键盘事件
		this.keyEvent = function(event){
			//40代表删除键
			if(event.keyCode == 46){
				mapBuilder.remove();
			}
			return true;

		}
		$(document).keydown(this.keyEvent);

		//绑定操作事件
		this.dom.mousedown(function(e) {
			if(!mapBuilder.activeMouseEvent){
				return;
			}
			//计算鼠标位置
			e.clientX = parseInt(e.pageX - mapBuilder.dom.offset().left + mapBuilder.dom.scrollLeft());
			e.clientY = parseInt(e.pageY - mapBuilder.dom.offset().top + mapBuilder.dom.scrollTop());

			//xauto.browser.log(e.clientX + "," + e.clientY);
			//调用当前工具的处理事件
			if(mapBuilder.toolHandler != null) {
				console.log("监听div initMapBuilder鼠标按下："+JSON.stringify(mapBuilder));
				mapBuilder.toolHandler.mousedown(mapBuilder, e);
			}
		});

		this.dom.mousemove(function(e) {
			if(!mapBuilder.activeMouseEvent){
				return;
			}
			//计算鼠标位置
			e.clientX = parseInt(e.pageX - mapBuilder.dom.offset().left + mapBuilder.dom.scrollLeft());
			e.clientY = parseInt(e.pageY - mapBuilder.dom.offset().top + mapBuilder.dom.scrollTop());

			//调用当前工具的处理事件
			if(mapBuilder.toolHandler != null) {
				mapBuilder.toolHandler.mousemove(mapBuilder, e);
			}
			//回调当前函数
			if(mapBuilder.onMouseMove) {
				mapBuilder.onMouseMove(e);
			}
		});

		this.dom.mouseup(function(e) {
			if(!mapBuilder.activeMouseEvent){
				return;
			}
			//计算鼠标位置
			e.clientX = parseInt(e.pageX - mapBuilder.dom.offset().left  + mapBuilder.dom.scrollLeft());
			e.clientY = parseInt(e.pageY - mapBuilder.dom.offset().top + mapBuilder.dom.scrollTop());

			//调用当前工具的处理事件
			if(mapBuilder.toolHandler != null) {
				mapBuilder.toolHandler.mouseup(mapBuilder, e);
			}
		});

		this.dom.mouseleave(function(e) {
			mapBuilder.dom.trigger("mouseup");
		});

		this.initTool();
	}
	//**************************************工具操作类函数*********************************************************
	/**
	 * 设置当前选择工具
	 */
MapBuilder.prototype.setTool = function(toolId) {
	//工具退出时候的额外处理函数
	if(this.toolHandler != null) {
		this.toolHandler.exit(this);
	}

	this.toolHandler = null;
	//查找已有的工具列表
	for(var index = 0; index < this.toolsList.length; index++) {
		if(this.toolsList[index].id == toolId) {
			this.toolHandler = this.toolsList[index];
			break;
		}
	}
    console.log("setTool当前选择的工具："+JSON.stringify(this.toolHandler));
	//若不存在对应工具，提示错误
	if(this.toolHandler == null) {
		// xauto.tip({
		// 	title: "警告",
		// 	desc: "未找到相应工具，设置工具失败！"
		// });
		return;
	}
	//工具进入时候的初始化
	this.toolHandler.init(this);

	if(this.onToolChanged){
		this.onToolChanged(toolId);
	}
}

/**
 * 设置工具编辑模式，每个工具的模式列举如下
 * （1）选择工具
 * 		无模式
 * （2）添加机柜组模式
 * 		无模式
 * （3）添加设备模式
 * 		1）添加机柜
 * 		2）添加风机
 * 		3）添加门禁
 * 		4）添加水泵
 * 		5）添加空调
 * 		6）添加SF6感应器
 * 		7）待添加
 * 	（4）添加轨道点模式
 * 		1）添加直线
 * 		2）添加90度弧
 * 		3）添加180度弧
 * @param {Object} m 工具模式
 */
MapBuilder.prototype.setToolMode = function(m) {
	if(this.toolHandler != null) {
		this.toolHandler.mode = m;
	}
}

/**
 * 注册工具到当前的编辑器中
 * @param {Object} tool 工具
 */
MapBuilder.prototype.registerTool = function(tool) {
	this.toolsList.push(tool);
}

//*******************************************对象选择类函数*********************************************************
/**
 * 一组选择对象的操作函数
 */
MapBuilder.prototype.addSelectedObject = function(obj) {
	if(obj) {
		this.selectedObject.push(obj);
		//添加选择中的样式
		if(obj.div) {
			obj.div.addClass("mapObjectFocus");
		}
		//如果只选中了一个对象，则显示此对象属性
		if(this.onSelectedObjectChanged) {
			this.onSelectedObjectChanged(this);
		}
	}
}

/**
 * 从选择中移除一个对象
 * @param {Object} id 对象id
 */
MapBuilder.prototype.removeSelectedObject = function(id) {
	for(var i = 0; i < selectedObject.length; i++) {    
		if(this.selectedObject[i].info.id == id) {
			if(this.selectedObject[i].div) {
				obj.div.removeClass("mapObjectFocus");
			}      
			this.selectedObject.splice(i, 1);      
			break;
		}
	}
	//TODO 属性栏的更新
	if(this.onSelectedObjectChanged) {
		this.onSelectedObjectChanged(this);
	}
}

/**
 * 删除所有选中对象
 */
MapBuilder.prototype.removeAllSelectedObject = function() {
	if(this.selectedObject.length > 0) {
		for(var i = 0; i < this.selectedObject.length; i++) {    
			if(this.selectedObject[i].div) {
				this.selectedObject[i].div.removeClass("mapObjectFocus");
			} 
		}
		this.selectedObject.splice(0, this.selectedObject.length);
	}

	if(this.onSelectedObjectChanged) {
		this.onSelectedObjectChanged(this);
	}
}

/**
 * 判断一个对象是否已经被选中
 */
MapBuilder.prototype.isAlreadySelected = function(selectedObj) {
	for(var index = 0; index < this.selectedObject.length; index++) {
		if(this.selectedObject[index].info.id == selectedObj.info.id) {
			return true;
		}
	}
	return false;
}

//******************************************编辑类函数********************************************************
MapBuilder.prototype.save = function(url,callback) {
	this.mapController.saveStationMapInfo(url,callback);
}

MapBuilder.prototype.load = function(url) {
	this.mapController.loadStationMapInfo(url);
}

MapBuilder.prototype.revoke = function() {
	var action = this.popAction();
	console.log('pop action:'+action)
	//有客撤销的操作
	if(action != undefined) {
		//恢复被修改的对象
		if(action.actionType == MapBuilderConstant.ACTION_CHANGE_OBJECT) {
			for(var i = 0; i < action.objects.length; i++) {
				this.mapController.updateMapObject(action.objects[i]);
			}
		}

		if(action.actionType == MapBuilderConstant.ACTION_ADD_OBJECT) {
			for(var i = 0; i < action.objects.length; i++) {
				this.mapController.removeObject(action.objects[i]);
			}
		}

		if(action.actionType == MapBuilderConstant.ACTION_DELETE_OBJECT) {
			for(var i = 0; i < action.objects.length; i++) {
				this.mapController.addObject(action.objects[i]);
			}
		}
		if(this.onSelectedObjectChanged) {
			this.onSelectedObjectChanged(this);
		}

	} else {
		xauto.tip({
			title: "警告",
			desc: "无可撤销的操作！"
		});
	}

	if(this.onUpdateObjcet) {
		this.onUpdateObjcet();
	}

	if(this.onPathNodeChanged){
		this.onPathNodeChanged(this);
	}
}
MapBuilder.prototype.remove = function() {
	//未选中元素,操作无任何反应
	if(this.selectedObject.length == 0) {
		return;
	}
	var hasPathNode = false;
	var wantDeleteData = new Array();
	//保存将要删除的元素,同时判断所有元素中是否含有路径点
	for(var index = 0; index < this.selectedObject.length; index++) {
		wantDeleteData.push(this.selectedObject[index]);
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_PATHNODE) {
			hasPathNode = true;
		}
	}
	//将所有元素取消选中
	this.removeAllSelectedObject();
	//删除元素
	for(var index = 0; index < wantDeleteData.length; index++) {
		this.mapController.removeObject(wantDeleteData[index]);
	}
	//保存动作
	this.pushAction(MapBuilderConstant.ACTION_DELETE_OBJECT, wantDeleteData);
	//如果被修改的元素中含有点,则直接路径点
	if(hasPathNode) {
		this.mapController.redrawPath();
	}

	if(this.onUpdateObjcet) {
		this.onUpdateObjcet();
	}

	//响应节点改变事件
	if(this.onPathNodeChanged) {
		this.onPathNodeChanged(this);
	}
}
MapBuilder.prototype.alignLeft = function() {
	//未选中元素,操作无任何反应
	if(this.selectedObject.length == 0) {
		return;
	}
	//保存原始节点数据到动作堆栈
	var oldObjects = new Array();
	for(var index = 0; index < this.selectedObject.length; index++) {
		oldObjects.push(this.copyObject(this.selectedObject[index]));
	}
	this.pushAction(MapBuilderConstant.ACTION_CHANGE_OBJECT, oldObjects);

	//最左边的left
	var minLeft = MapBuilderConstant.CANVAS_WIDTH;
	for(var index = 0; index < this.selectedObject.length; index++) {
		if(this.selectedObject[index].info.posX < minLeft) {
			minLeft = this.selectedObject[index].info.posX;
		}
	}
	var hasPathNode = false;
	//调整所有元素的位置
	for(var index = 0; index < this.selectedObject.length; index++) {
		this.selectedObject[index].info.posX = minLeft;
		//调整对应div的位置
		this.mapController.updateMapObject(this.selectedObject[index]);
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_PATHNODE) {
			hasPathNode = true;
		}
	}

	//如果被修改的元素中含有点,则直接重绘
	if(hasPathNode) {
		this.mapController.redrawPath();
	}

	if(this.onUpdateObjcet) {
		this.onUpdateObjcet();
	}

}
MapBuilder.prototype.alignRight = function() {
	//未选中元素,操作无任何反应
	if(this.selectedObject.length == 0) {
		return;
	}
	//保存原始节点数据到动作堆栈
	var oldObjects = new Array();
	for(var index = 0; index < this.selectedObject.length; index++) {
		oldObjects.push(this.copyObject(this.selectedObject[index]));
	}
	this.pushAction(MapBuilderConstant.ACTION_CHANGE_OBJECT, oldObjects);

	//最右边坐标
	var maxRight = 0;
	for(var index = 0; index < this.selectedObject.length; index++) {
		//柜体和（轨道点,智能设备) 计算最右侧坐标有所区别
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_DEVICE) {
			if(this.selectedObject[index].info.posX + this.selectedObject[index].info.deviceLength > maxRight) {
				maxRight = this.selectedObject[index].info.posX + this.selectedObject[index].info.deviceLength;
			}
		} else {
			if(this.selectedObject[index].info.posX > maxRight) {
				maxRight = this.selectedObject[index].info.posX;
			}
		}

	}

	var hasPathNode = false;
	//调整所有元素的位置
	for(var index = 0; index < this.selectedObject.length; index++) {
		//计算要移动到的位置
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_DEVICE) {
			this.selectedObject[index].info.posX = maxRight - this.selectedObject[index].info.deviceLength;
		} else {
			this.selectedObject[index].info.posX = maxRight;
		}
		//调整对应div的位置
		this.mapController.updateMapObject(this.selectedObject[index]);
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_PATHNODE) {
			hasPathNode = true;
		}
	}

	//如果被修改的元素中含有点,则直接重绘
	if(hasPathNode) {
		this.mapController.redrawPath();
	}

	if(this.onUpdateObjcet) {
		this.onUpdateObjcet();
	}
}
MapBuilder.prototype.alignTop = function() {
	//未选中元素,操作无任何反应
	if(this.selectedObject.length == 0) {
		return;
	}
	//保存原始节点数据到动作堆栈
	var oldObjects = new Array();
	for(var index = 0; index < this.selectedObject.length; index++) {
		oldObjects.push(this.copyObject(this.selectedObject[index]));
	}
	this.pushAction(MapBuilderConstant.ACTION_CHANGE_OBJECT, oldObjects);

	//最左边的left
	var minTop = MapBuilderConstant.CANVAS_HEIGHT;
	for(var index = 0; index < this.selectedObject.length; index++) {
		if(this.selectedObject[index].info.posY < minTop) {
			minTop = this.selectedObject[index].info.posY;
		}
	}
	var hasPathNode = false;
	//调整所有元素的位置
	for(var index = 0; index < this.selectedObject.length; index++) {
		this.selectedObject[index].info.posY = minTop;
		//调整对应div的位置
		this.mapController.updateMapObject(this.selectedObject[index]);
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_PATHNODE) {
			hasPathNode = true;
		}
	}

	//如果被修改的元素中含有点,则直接重绘
	if(hasPathNode) {
		this.mapController.redrawPath();
	}

	if(this.onUpdateObjcet) {
		this.onUpdateObjcet();
	}

}

MapBuilder.prototype.alignBottom = function() {
	//未选中元素,操作无任何反应
	if(this.selectedObject.length == 0) {
		return;
	}
	//保存原始节点数据到动作堆栈
	var oldObjects = new Array();
	for(var index = 0; index < this.selectedObject.length; index++) {
		oldObjects.push(this.copyObject(this.selectedObject[index]));
	}
	this.pushAction(MapBuilderConstant.ACTION_CHANGE_OBJECT, oldObjects);

	//最右边坐标
	var maxBottom = 0;
	for(var index = 0; index < this.selectedObject.length; index++) {
		//柜体和（轨道点,智能设备) 计算最右侧坐标有所区别
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_DEVICE) {
			if(this.selectedObject[index].info.posY + this.selectedObject[index].info.deviceWidth > maxBottom) {
				maxBottom = this.selectedObject[index].info.posY + this.selectedObject[index].info.deviceWidth;
			}
		} else {
			if(this.selectedObject[index].info.posY > maxBottom) {
				maxBottom = this.selectedObject[index].info.posY;
			}
		}

	}

	var hasPathNode = false;
	//调整所有元素的位置
	for(var index = 0; index < this.selectedObject.length; index++) {
		//计算要移动到的位置
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_DEVICE) {
			this.selectedObject[index].info.posY = maxBottom - this.selectedObject[index].info.deviceWidth;
		} else {
			this.selectedObject[index].info.posY = maxBottom;
		}
		//调整对应div的位置
		this.mapController.updateMapObject(this.selectedObject[index]);
		if(this.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_PATHNODE) {
			hasPathNode = true;
		}
	}

	//如果被修改的元素中含有点,则直接重绘
	if(hasPathNode) {
		this.mapController.redrawPath();
	}

	if(this.onUpdateObjcet) {
		this.onUpdateObjcet();
	}
}

//********************************************动作堆栈操作函数*****************************************************
MapBuilder.prototype.pushAction = function(type, objs) {
	//如果是一个元素,则转化为数组
	if(objs instanceof Array == false) {
		var newArray = new Array();
		newArray.push(objs);
		objs = newArray;
	}
	this.actions.push({
		actionType: type,
		objects: objs
	})
}
MapBuilder.prototype.popAction = function() {
	//注意,无动作的是否返回是undefined
	return this.actions.pop();
}

//*****************************************工具函数**************************************************************
//生成uuid
MapBuilder.prototype.uuid = function() {
	var s = [];
	var hexDigits = "0123456789abcdef";
	for(var i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
	s[8] = s[13] = s[18] = s[23] = "-";

	var uuid = s.join("");
	return uuid;
}

//获得当前的时间戳
MapBuilder.prototype.getTimeStamp = function() {
	var myDate = new Date();
	return myDate.getFullYear() + "-" +
		(myDate.getMonth() + 1) + "-" +
		myDate.getDate() + " " +
		myDate.getHours() + ":" +
		myDate.getMinutes() + ":" +
		myDate.getSeconds()
}

//获取像素的值
MapBuilder.prototype.getPixelValue = function(px) {
	if(px) {
		return parseInt(px.replace("px", ""));
	}
}

//判断某个点是否在矩形内
MapBuilder.prototype.isPointInRect = function(pointX, pointY, rectLeft, rectTop, rectWidth, rectHeight) {
		//转换为数值型
		pointX = parseInt(pointX);
		pointY = parseInt(pointY);
		rectLeft = parseInt(rectLeft);
		rectTop = parseInt(rectTop);
		rectWidth = parseInt(rectWidth);
		rectHeight = parseInt(rectHeight);
		return pointX >= rectLeft && (pointX < rectLeft + rectWidth) && pointY >= rectTop && (pointY <= rectTop + rectHeight);
	}
	//判断某个矩形是否在另一个矩形内
MapBuilder.prototype.isRectInRect = function(srcRect, destRect) {
		return srcRect.left >= destRect.left && srcRect.left + srcRect.width <= destRect.left + destRect.width &&
			srcRect.top >= destRect.top && srcRect.top + srcRect.height <= destRect.top + destRect.height;
	}
	//拷贝js对象,深层次拷贝,但不会拷贝div对象
MapBuilder.prototype.copyObject = function(source) {
		var result = {};
		for(var key in source) {
			if(typeof source[key] != 'object' || key == "div") {
				result[key] = source[key];
			} else {
				result[key] = this.copyObject(source[key])
			}
		}
		return result;
	}
	//浅层次复制对象的值给另一个对象,不会遍历子对象
MapBuilder.prototype.copyValue = function(dest, source) {
	for(var key in dest) {
		dest[key] = source[key];
	}
}

MapBuilder.prototype.enableMouseEvent = function(b){
	this.activeMouseEvent = b;
}
