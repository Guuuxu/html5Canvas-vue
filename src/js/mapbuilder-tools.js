MapBuilder.prototype.initTool = function () {
    //创建添加设备对象
    var addDeviceTool = {
        id: MapBuilderConstant.TOOL_ADD_DEVICE,
        mode: 0,
        startMousePosition: null,
        curDevice: null,
        //初始化
        init: function (mb) {
            mb.dom.css("cursor", "crosshair");
        },
        exit: function (mb) {
            mb.dom.css("cursor", "default");
        },
        mousedown: function (mb, e) {
            //添加机柜，需要滑动拖出轮廓
            if (this.mode == MapBuilderConstant.DEVICE_TYPE_CABINET) {
                //记录当前鼠标位置
                this.startMousePosition = {
                    x: e.clientX,
                    y: e.clientY
                }

                this.curDevice = mb.mapController.addNewDevice(e.clientX, e.clientY, 10, 10);
            } else {
                //其他设备,直接添加图例就行了
                this.curDevice = mb.mapController.addNewEnvDevice(e.clientX, e.clientY, this.mode);
            }
        },
        mousemove: function (mb, e) {
            if (this.mode == MapBuilderConstant.DEVICE_TYPE_CABINET) {
                if (this.curDevice && this.startMousePosition) {
                    var deltaWidth = e.clientX - this.startMousePosition.x;
                    var deltaHeight = e.clientY - this.startMousePosition.y;
                    if (deltaHeight < 10) {
                        deltaHeight = 10;
                    }

                    if (deltaWidth < 10) {
                        deltaWidth = 10;
                    }
                    this.curDevice.info.deviceLength = deltaWidth;
                    this.curDevice.info.deviceWidth = deltaHeight;
                    this.curDevice.div.css("width", deltaWidth + "px");
                    this.curDevice.div.css("height", deltaHeight + "px");
                    this.curDevice.div.css("line-height", deltaHeight + "px");
                }
            }
        },
        mouseup: function (mb, e) {
            //添加完成后，添加到完成信息
            mb.setTool(MapBuilderConstant.TOOL_SELECT);

            //保存添加动作到动作栈
            mb.pushAction(MapBuilderConstant.ACTION_ADD_OBJECT, this.curDevice);
            //清除选择信息
            this.curDevice = null;
            this.startMousePosition = null;
        }
    }

    //添加轨道点的事件处理
    var addPathNodeTool = {
        id: MapBuilderConstant.TOOL_ADD_PATHNODE,
        mode: MapBuilderConstant.TOOL_ADD_PATHNODE_LINE,
        curPathNode: null,
        //轨道工具初始化工具
        init: function (mb) {
            mb.dom.css("cursor", "crosshair");
        },
        exit: function (mb) {
            mb.dom.css("cursor", "default");
        },
        limitValue: function (value, start, end) {
            if (value < start) {
                return start;
            }
            if (value > end) {
                return end;
            }
            return value;
        },
        mousedown: function (mb, e) {
            console.log("进入addPathNodeTool！！！！");
            //越界修正 5 为节点一般宽度
            e.clientX = this.limitValue(e.clientX, 5, MapBuilderConstant.CANVAS_WIDTH - 5);
            e.clientY = this.limitValue(e.clientY, 5, MapBuilderConstant.CANVAS_HEIGHT - 5)

            var angle = 0;
            switch (this.mode) {
                case MapBuilderConstant.TOOL_ADD_PATHNODE_LINE:
                    angle = 0;
                    break;
                case MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90:
                    angle = 90;
                    break;
                case MapBuilderConstant.TOOL_ADD_PATHNODE_ARC90MINUS:
                    angle = -90;
                    break;
            }
            this.curPathNode = mb.mapController.addNewPathNode(e.clientX, e.clientY, angle);
        },
        mousemove: function (mb, e) {

        },
        mouseup: function (mb, e) {
            //保存添加动作到动作栈
            mb.pushAction(MapBuilderConstant.ACTION_ADD_OBJECT, this.curPathNode);
        }
    }

    /**
     * 选择工具的事件处理程序
     */
    var selectTool = {
        id: MapBuilderConstant.TOOL_SELECT,
        startMousePosition: null,
        mode: 0,
        /**
         * 查询点在哪个平面元素内，一次只能选中一个元素。选择优先级：环境设备>点>机柜
         * @param {Number} x
         * @param {Number} y
         */
        findObjectsInPoint: function (mb, x, y) {
            var index = 0;
            var rectLeft = 0;
            var rectTop = 0;
            var rectWidth = 0;
            var rectHeight = 0;
            //先查询环境设备
            for (index = 0; index < mb.mapController.envDevices.length; index++) {
                rectWidth = mb.getPixelValue(mb.mapController.envDevices[index].div.css("width"));
                rectHeight = mb.getPixelValue(mb.mapController.envDevices[index].div.css("height"));
                rectLeft = mb.mapController.envDevices[index].info.posX - rectWidth / 2;
                rectTop = mb.mapController.envDevices[index].info.posY - rectHeight / 2;
                if (mb.isPointInRect(x, y, rectLeft, rectTop, rectWidth, rectHeight)) {
                    return mb.mapController.envDevices[index];
                }
            }
            //查询点
            for (index = 0; index < mb.mapController.pathNodes.length; index++) {
                rectWidth = mb.getPixelValue(mb.mapController.pathNodes[index].div.css("width"));
                rectHeight = mb.getPixelValue(mb.mapController.pathNodes[index].div.css("height"));
                rectLeft = mb.mapController.pathNodes[index].info.posX - rectWidth / 2;
                rectTop = mb.mapController.pathNodes[index].info.posY - rectHeight / 2;
                if (mb.isPointInRect(x, y, rectLeft, rectTop, rectWidth, rectHeight)) {
                    return mb.mapController.pathNodes[index];
                }
            }
            //查询机柜
            for (index = 0; index < mb.mapController.devices.length; index++) {
                rectWidth = mb.mapController.devices[index].info.deviceLength;
                rectHeight = mb.mapController.devices[index].info.deviceWidth;
                rectLeft = mb.mapController.devices[index].info.posX;
                rectTop = mb.mapController.devices[index].info.posY;
                if (mb.isPointInRect(x, y, rectLeft, rectTop, rectWidth, rectHeight)) {
                    return mb.mapController.devices[index];
                }
            }

            return null;

        },
        /**
         * 查询一个范围内，所有被包含在内的元素
         * @param {Object} selectBox
         */
        findObjectsInRect: function (mb, selectBox) {
            var boxInObject = new Array();
            var index = 0;
            var rectLeft = 0;
            var rectTop = 0;
            var rectWidth = 0;
            var rectHeight = 0;
            //查询环境设备
            for (index = 0; index < mb.mapController.envDevices.length; index++) {
                rectWidth = mb.getPixelValue(mb.mapController.envDevices[index].div.css("width"));
                rectHeight = mb.getPixelValue(mb.mapController.envDevices[index].div.css("height"));
                rectLeft = mb.mapController.envDevices[index].info.posX - rectWidth / 2;
                rectTop = mb.mapController.envDevices[index].info.posY - rectHeight / 2;
                if (mb.isRectInRect({
                        left: rectLeft,
                        top: rectTop,
                        width: rectWidth,
                        height: rectHeight
                    }, selectBox)) {
                    boxInObject.push(mb.mapController.envDevices[index]);
                }
            }
            //查询点
            for (index = 0; index < mb.mapController.pathNodes.length; index++) {
                rectWidth = mb.getPixelValue(mb.mapController.pathNodes[index].div.css("width"));
                rectHeight = mb.getPixelValue(mb.mapController.pathNodes[index].div.css("height"));
                rectLeft = mb.mapController.pathNodes[index].info.posX - rectWidth / 2;
                rectTop = mb.mapController.pathNodes[index].info.posY - rectHeight / 2;
                if (mb.isRectInRect({
                        left: rectLeft,
                        top: rectTop,
                        width: rectWidth,
                        height: rectHeight
                    }, selectBox)) {
                    boxInObject.push(mb.mapController.pathNodes[index]);
                }
            }
            //查询机柜
            for (index = 0; index < mb.mapController.devices.length; index++) {
                rectWidth = mb.mapController.devices[index].info.deviceLength;
                rectHeight = mb.mapController.devices[index].info.deviceWidth;
                rectLeft = mb.mapController.devices[index].info.posX;
                rectTop = mb.mapController.devices[index].info.posY;
                if (mb.isRectInRect({
                        left: rectLeft,
                        top: rectTop,
                        width: rectWidth,
                        height: rectHeight
                    }, selectBox)) {
                    boxInObject.push(mb.mapController.devices[index]);
                }
            }

            return boxInObject;

        },
        //初始化
        init: function (mb) {
          console.log("selectTool初始化！")
        },
        exit: function (mb) {

        },
        limitValue: function (value, start, end) {
            if (value < start) {
                return start;
            }
            if (value > end) {
                return end;
            }
            return value;
        },
        mousedown: function (mb, e) {
            //保存鼠标初始位置
            this.startMousePosition = {
                x: e.clientX,
                y: e.clientY
            }
            //先判断是否有已选对象
            var selectedObj = this.findObjectsInPoint(mb, e.clientX, e.clientY);
            //console.log("指针选择框选模式"+this.mode+",selectedObj:"+selectedObj+",mb:"+JSON.stringify(mb))
            //选择中了一个元素
            if (selectedObj != null) {

                //若点中的是没有选中状态的节点，则消除所有
                if (!mb.isAlreadySelected(selectedObj)) {
                    //移除当前选中的元素,并选择该元素,如果按下了ctrl就不删除之前选的元素
                    if (!e.ctrlKey) {
                        mb.removeAllSelectedObject();
                    }
                    mb.addSelectedObject(selectedObj);
                }
                //进入移动模式
                this.mode = MapBuilderConstant.TOOL_SELECT_MODE_MOVE;
                mb.dom.css("cursor", "move");
            } else {
                //未选中元素，进入框选模式

                this.mode = MapBuilderConstant.TOOL_SELECT_MODE_BOX;
                console.log("mousedown指针选择框选模式"+this.mode+",selectedObj:"+selectedObj+",mb:"+JSON.stringify(mb))
                //光标呈十字线
                mb.dom.css("cursor", "crosshair");
                //添加框选的框子
                this.boxDiv = $("<div style='border:1px dashed #ededed'></div>");
                this.boxDiv.css("left", this.startMousePosition.x + "px");
                this.boxDiv.css("top", this.startMousePosition.y + "px");
                this.boxDiv.css("width", "1px");
                this.boxDiv.css("height", "1px");
                this.boxDiv.appendTo(mb.dom);
                console.log("mousedown指针选择框选模式!!!!!!!"+this.mode+",selectedObj:"+selectedObj+",mb:"+JSON.stringify(mb))
            }
        },
        mousemove: function (mb, e) {
            console.log("mousemove指针选择"+this.mode)
            //默认模式，鼠标移动不触发任何事件
            if (this.mode == MapBuilderConstant.TOOL_SELECT_MODE_DEFAULT) {
                return;
            }

            //先计算鼠标移动量
            var deltaMouseX = e.clientX - this.startMousePosition.x;
            var deltaMouseY = e.clientY - this.startMousePosition.y;

            if (this.mode == MapBuilderConstant.TOOL_SELECT_MODE_MOVE && mb.selectedObject.length > 0) {
                //再修改选中元素的div的位置，等操作结束后，再修改已选择对象info中保存的的值
                for (var index = 0; index < mb.selectedObject.length; index++) {
                    //机柜的posX，posY对应div的左上角
                    if (mb.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_DEVICE) {
                        //边界限制
                        var left = this.limitValue(mb.selectedObject[index].info.posX + deltaMouseX, 0, MapBuilderConstant.CANVAS_WIDTH - mb.selectedObject[index].info.deviceLength);
                        var top = this.limitValue(mb.selectedObject[index].info.posY + deltaMouseY, 0, MapBuilderConstant.CANVAS_HEIGHT - mb.selectedObject[index].info.deviceWidth);
                        mb.selectedObject[index].div.css("left", left + "px");
                        mb.selectedObject[index].div.css("top", top + "px");
                    } else {
                        var left = this.limitValue(mb.selectedObject[index].info.posX + deltaMouseX - mb.getPixelValue(mb.selectedObject[index].div.css("width")) / 2, 0, MapBuilderConstant.CANVAS_WIDTH - mb.getPixelValue(mb.selectedObject[index].div.css("width")));
                        var top = this.limitValue(mb.selectedObject[index].info.posY + deltaMouseY - mb.getPixelValue(mb.selectedObject[index].div.css("height")) / 2, 0, MapBuilderConstant.CANVAS_HEIGHT - mb.getPixelValue(mb.selectedObject[index].div.css("height")));
                        //其他智能设备和轨道路径点对应div的中点
                        mb.selectedObject[index].div.css("left", left + "px");
                        mb.selectedObject[index].div.css("top", top + "px");
                    }
                }

            }
            //框选模式
            if (this.mode == MapBuilderConstant.TOOL_SELECT_MODE_BOX) {
                //限制两个点位置,不能超出画布范围
                console.log("mousemove指针选择进入框选移动"+this.mode)
                var curPointPos = {
                    x: e.clientX,
                    y: e.clientY
                }
                this.startMousePosition.x = this.limitValue(this.startMousePosition.x, 0, MapBuilderConstant.CANVAS_WIDTH);
                this.startMousePosition.y = this.limitValue(this.startMousePosition.y, 0, MapBuilderConstant.CANVAS_HEIGHT);
                curPointPos.x = this.limitValue(curPointPos.x, 0, MapBuilderConstant.CANVAS_WIDTH);
                curPointPos.y = this.limitValue(curPointPos.y, 0, MapBuilderConstant.CANVAS_HEIGHT);
                //先计算鼠标移动量
                var deltaWidth = Math.abs(curPointPos.x - this.startMousePosition.x);
                var deltaHeight = Math.abs(curPointPos.y - this.startMousePosition.y);
                var minX = curPointPos.x < this.startMousePosition.x ? curPointPos.x : this.startMousePosition.x;
                var minY = curPointPos.y < this.startMousePosition.y ? curPointPos.y : this.startMousePosition.y;
                //对框选位置进行限制
                this.boxDiv.css("left", minX + "px");
                this.boxDiv.css("top", minY + "px");
                this.boxDiv.css("width", deltaWidth + "px");
                this.boxDiv.css("height", deltaHeight + "px");
            }
        },
        mouseup: function (mb, e) {
            //移动模式
            if (this.mode == MapBuilderConstant.TOOL_SELECT_MODE_MOVE && mb.selectedObject.length > 0) {
                //如果位置发生改变，则进行动作记录
                if (e.clientX != this.startMousePosition.x || e.clientY != this.startMousePosition.y) {
                    //保存所有对象之前的状态
                    var oldObjects = new Array();
                    for (var index = 0; index < mb.selectedObject.length; index++) {
                        oldObjects.push(mb.copyObject(mb.selectedObject[index]));
                    }
                    mb.pushAction(MapBuilderConstant.ACTION_CHANGE_OBJECT, oldObjects);
                }
                //保存当前div位置到Object数据中
                //修改div的位置，等操作结束后，再修改
                for (var index = 0; index < mb.selectedObject.length; index++) {
                    //机柜的posX，posY对应div的左上角
                    if (mb.selectedObject[index].objectType == MapBuilderConstant.OBJECT_TYPE_DEVICE) {
                        mb.selectedObject[index].info.posX = mb.getPixelValue(mb.selectedObject[index].div.css("left"));
                        mb.selectedObject[index].info.posY = mb.getPixelValue(mb.selectedObject[index].div.css("top"));
                    } else {
                        //其他智能设备和轨道路径点对应div的中点
                        mb.selectedObject[index].info.posX = mb.getPixelValue(mb.selectedObject[index].div.css("left")) +
                            mb.getPixelValue(mb.selectedObject[index].div.css("width")) / 2;
                        mb.selectedObject[index].info.posY = mb.getPixelValue(mb.selectedObject[index].div.css("top")) +
                            mb.getPixelValue(mb.selectedObject[index].div.css("height")) / 2;
                    }

                }

                //移动结束，重置鼠标选择工具的状态
                this.mode = MapBuilderConstant.TOOL_SELECT_MODE_DEFAULT;
                mb.dom.css("cursor", "default");
                //重绘路径
                mb.mapController.redrawPath();
                //更新属性栏
                if (mb.onSelectedPropertyChanged) {
                    mb.onSelectedPropertyChanged(mb);
                }
                //响应节点改变事件
                if (mb.onPathNodeChanged) {
                    mb.onPathNodeChanged(mb);
                }

            }

            //框选模式
            if (this.mode == MapBuilderConstant.TOOL_SELECT_MODE_BOX) {
                console.log("指针选择进入框选放开"+this.mode)
                //清空所有选中的元素
                mb.removeAllSelectedObject();
                var objectsInBox = this.findObjectsInRect(mb, {
                    left: mb.getPixelValue(this.boxDiv.css("left")),
                    top: mb.getPixelValue(this.boxDiv.css("top")),
                    width: mb.getPixelValue(this.boxDiv.css("width")),
                    height: mb.getPixelValue(this.boxDiv.css("height"))
                });

                if (objectsInBox.length > 0) {
                    for (var index = 0; index < objectsInBox.length; index++) {
                        mb.addSelectedObject(objectsInBox[index]);
                    }
                }

                //this.boxDiv.remove();
                console.log("移除选择框boxDiv")
                this.mode = MapBuilderConstant.TOOL_SELECT_MODE_DEFAULT;
                mb.dom.css("cursor", "default");
            }
        }
    }

    //添加机柜组工具
    var addDeviceGroupTool = {
        id: MapBuilderConstant.TOOL_ADD_DEVICEGROUP,
        mode: 0,
        targetPosition: null,
        curStartPoint: null,
        curEndPoint: null,
        //初始化
        init: function (mb) {
            mb.dom.css("cursor", "crosshair");
        },
        exit: function (mb) {
            mb.dom.css("cursor", "default");
        },
        limitValue: function (value, start, end) {
            if (value < start) {
                return start;
            }
            if (value > end) {
                return end;
            }
            return value;
        },

        /**
         * 添加设备组事件
         * @param {Object} point1
         * @param {Object} point2
         * @param {Object} deviceIds
         */
        addDeviceGroup: function (mb, devices) {
            var point1 = this.curStartPoint;
            var point2 = this.curEndPoint;
            var count = devices.length;
            var space = 1;
            //判断是上下的两个点 还是左右的两个点
            var dX = Math.abs(point1.x - point2.x);
            var dY = Math.abs(point1.y - point2.y);
            var addedDevicesList = [];
            //横向
            if (dX >= dY) {
                var wantWidth = parseInt((dX - space * (count + 1)) / parseInt(count));
                var wantHeight = parseInt(dY);
                var minX = (point1.x > point2.x) ? point2.x : point1.x;
                var minY = (point1.y < point2.y) ? point1.y : point2.y;
                var curX = minX + space;

                for (var i = 0; i < count; i++) {
                    var newDevicePos = {
                        x: curX + space,
                        y: minY,
                        width: wantWidth,
                        height: wantHeight
                    }

                    var newDevice = {
                        objectType: MapBuilderConstant.OBJECT_TYPE_DEVICE,
                        info: {
                            id: mb.uuid(),
                            posX: newDevicePos.x,
                            posY: newDevicePos.y,
                            //注意平面图上方块宽度就是机柜的长度
                            deviceLength: newDevicePos.width,
                            //注意平面图上方块高度就是机柜的宽度
                            deviceWidth: newDevicePos.height,
                            createTime: mb.getTimeStamp(),
                            updateTime: mb.getTimeStamp(),
                            //以下个字段是表关联CBS_DEVICE_INFO查询获得的,不可编辑
                            deviceId: devices[i].deviceId,
                            deviceName: devices[i].deviceName
                        },
                        div: null
                    }

                    mb.mapController.addObject(newDevice);
                    addedDevicesList.push(newDevice);
                    curX += wantWidth + space;
                }
            }
            //纵向
            if (dX <= dY) {
                var wantHeight = parseInt((Math.abs(point1.y - point2.y) - space * (count + 1)) / parseInt(count));
                var wantWidth = parseInt(dX);
                var minX = (point1.x > point2.x) ? point2.x : point1.x;
                var minY = (point1.y > point2.y) ? point2.y : point1.y;
                var curY = minY;

                for (var i = 0; i < count; i++) {
                    var newDevicePos = {
                        x: minX,
                        y: curY + space,
                        width: wantWidth,
                        height: wantHeight
                    }

                    var newDevice = {
                        objectType: MapBuilderConstant.OBJECT_TYPE_DEVICE,
                        info: {
                            id: mb.uuid(),
                            posX: newDevicePos.x,
                            posY: newDevicePos.y,
                            //注意平面图上方块宽度就是机柜的长度
                            deviceLength: newDevicePos.width,
                            //注意平面图上方块高度就是机柜的宽度
                            deviceWidth: newDevicePos.height,
                            createTime: mb.getTimeStamp(),
                            updateTime: mb.getTimeStamp(),
                            //以下个字段是表关联CBS_MapBuilderConstant.DEVICE_INFO查询获得的,不可编辑
                            deviceId: devices[i].deviceId,
                            deviceName: devices[i].deviceName
                        },
                        div: null
                    }

                    mb.mapController.addObject(newDevice);
                    addedDevicesList.push(newDevice);
                    curY += wantHeight + space;
                }
            }
            //添加操作栈
            mb.pushAction(MapBuilderConstant.ACTION_ADD_OBJECT, addedDevicesList);
        },
        mousedown: function (mb, e) {
            var angle = 0;
            //添加节点
            /*mb.mapController.addNewPathNode(e.clientX, e.clientY, angle);*/
            //必须存在两点以上才能添加
            /*if(mb.mapController.pathNodes.length < 2) {
             return;
             }*/
            //保存点的参数
            this.curStartPoint = {
                x: e.clientX,
                y: e.clientY
            }

            //添加框选的框子
            this.boxDiv = $("<div style='border:1px solid #ededed'></div>");
            this.boxDiv.css("left", this.curStartPoint.x + "px");
            this.boxDiv.css("top", this.curStartPoint.y + "px");
            this.boxDiv.css("width", "1px");
            this.boxDiv.css("height", "1px");
            this.boxDiv.appendTo(mb.dom);
        },
        mousemove: function (mb, e) {
            if(this.boxDiv){
                //限制两个点位置,不能超出画布范围
                var curPointPos = {
                    x: e.clientX,
                    y: e.clientY
                }
                this.curStartPoint.x = this.limitValue(this.curStartPoint.x, 0, MapBuilderConstant.CANVAS_WIDTH);
                this.curStartPoint.y = this.limitValue(this.curStartPoint.y, 0, MapBuilderConstant.CANVAS_HEIGHT);
                curPointPos.x = this.limitValue(curPointPos.x, 0, MapBuilderConstant.CANVAS_WIDTH);
                curPointPos.y = this.limitValue(curPointPos.y, 0, MapBuilderConstant.CANVAS_HEIGHT);
                //先计算鼠标移动量
                var deltaWidth = Math.abs(curPointPos.x - this.curStartPoint.x);
                var deltaHeight = Math.abs(curPointPos.y - this.curStartPoint.y);
                var minX = curPointPos.x < this.curStartPoint.x ? curPointPos.x : this.curStartPoint.x;
                var minY = curPointPos.y < this.curStartPoint.y ? curPointPos.y : this.curStartPoint.y;
                //对框选位置进行限制
                this.boxDiv.css("left", minX + "px");
                this.boxDiv.css("top", minY + "px");
                this.boxDiv.css("width", deltaWidth + "px");
                this.boxDiv.css("height", deltaHeight + "px");
            }

        },
        mouseup: function (mb, e) {
            this.curEndPoint = {
                x: e.clientX,
                y: e.clientY
            }
            this.boxDiv.remove();
            this.boxDiv = null;
            //回调事件，创建设备组
            if (mb.onAddDeviceGroup) {
                //此时的this就是addDeviceGroup对象
                mb.onAddDeviceGroup(mb, this);
            }
            mb.setTool(MapBuilderConstant.TOOL_SELECT);
        }
    }

    //添加轨道点的事件处理
    var addPathNodeGroupTool = {
        id: MapBuilderConstant.TOOL_ADD_PATHNODE_GROUP,
        mode: MapBuilderConstant.TOOL_ADD_PATHNODE_LINE,
        curPathNode: [],
        selectedPoint: {
            x: 0,
            y: 0
        },
        //轨道工具初始化工具
        init: function (mb) {
            mb.dom.css("cursor", "crosshair");
        },
        exit: function (mb) {
            mb.dom.css("cursor", "default");
        },
        limitValue: function (value, start, end) {
            if (value < start) {
                return start;
            }
            if (value > end) {
                return end;
            }
            return value;
        },
        /**
         * 添加轨道点
         * @param mb MapBuilder对象
         * @param x1 坐标x1
         * @param y1 坐标y1
         * @param x2 坐标x2
         * @param y2 坐标y2
         * @param startNum 开始磁钢片号
         * @param endNum 结束磁钢片号
         */
        addPathNodeGroup: function (mb, startNum, endNum) {
            //获取节点最后一个点坐标
            if (mb.mapController.pathNodes.length == 0) {
                return;
            }
            //x1 y1为起点坐标
            var x1 = mb.mapController.pathNodes[mb.mapController.pathNodes.length - 1].info.posX;
            var y1 = mb.mapController.pathNodes[mb.mapController.pathNodes.length - 1].info.posY;

            this.curPathNode = [];

            var pointCount = endNum - startNum + 1;
            var pertcentDelta = 100 / pointCount;
            var curPercntDelta = pertcentDelta;

            for (var index = startNum; index <= endNum; index++) {
                //通过向量等分百分比
                var curX = (this.selectedPoint.x - x1) * (curPercntDelta / 100) + x1;
                var curY = (this.selectedPoint.y - y1) * (curPercntDelta / 100) + y1;
                this.curPathNode.push(mb.mapController.addNewPathNode(parseInt(curX), parseInt(curY), 0, index));
                curPercntDelta += pertcentDelta;
            }

            mb.pushAction(MapBuilderConstant.ACTION_ADD_OBJECT, this.curPathNode);

        },
        mousedown: function (mb, e) {

            //越界修正 5 为节点一般宽度
            e.clientX = this.limitValue(e.clientX, 5, MapBuilderConstant.CANVAS_WIDTH - 5);
            e.clientY = this.limitValue(e.clientY, 5, MapBuilderConstant.CANVAS_HEIGHT - 5)
            //获取上个点坐标
            this.selectedPoint.x = e.clientX;
            this.selectedPoint.y = e.clientY;
            //如果只有一个点
            if(mb.mapController.pathNodes.length == 0){
                this.curPathNode.push(mb.mapController.addNewPathNode(parseInt(e.clientX), parseInt(e.clientY), 0, 0));
                return;
            }
            //如果有多个点
            if (mb.onAddNodeGroup) {
                mb.onAddNodeGroup(mb, this);
            }
        },
        mousemove: function (mb, e) {

        },
        mouseup: function (mb, e) {

        }
    }

    //注册工具tool
    this.registerTool(addDeviceTool);
    this.registerTool(addPathNodeTool);
    this.registerTool(addPathNodeGroupTool);
    this.registerTool(selectTool);
    this.registerTool(addDeviceGroupTool);

}
