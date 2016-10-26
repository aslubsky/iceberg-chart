(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        factory(exports);
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports', 'd3'], factory);
    } else {
        // Browser globals
        factory(root);
    }
}(this, function (exports) {

    var IcebergChart = function (canvasElement, options) {
        options = options || {};
        this.canvas = canvasElement;
        this.canvas.width = options.width || 360;
        this.canvas.height = options.height || 440;

        var labels = options.labels || {
                'success': 'Success',
                'fail': 'Fail',
                'inprogress': 'Inprogress',
                'unknown': 'Unknown'
            };
        var labelColors = options.labelColors || {
                'success': '#2CBD6E',
                'fail': '#FF5151',
                'inprogress': '#FF5151',
                'unknown': '#FF5151'
            };
        var colors = options.labelColors || {
                'background': '#83b4e0',
                'waterLine': '#2E75B5',
                'inprogressPartBg': '#cbdff1',
                'inprogressPart': '#FFFFFF',
                'unknownPartBg': '#99c0e3',
                'unknownPart': '#FFFFFF',
                'overWaterPartBg': '#FFFFFF',
                'overWaterPart': '#F3F6FB'
            };

        this.load = function (data) {
            this.data = data;
            return this;
        }

        this.draw = function () {
            this.ctx = this.canvas.getContext('2d');
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            var xCenter = this.canvas.width / 2;
            var hOffset = 15;
            var vOffset = 30;
            var icebergHeight = this.canvas.height - hOffset * 2;
            var icebergWidth = this.canvas.width - vOffset * 2;
            var bottomHeight = Math.ceil(icebergHeight * this.data.unknown / 100);
            var topHeight = Math.ceil(icebergHeight * (this.data.success + this.data.fail) / 100);
            var inprogressHeight = Math.ceil(icebergHeight * (this.data.inprogress) / 100); //add inprogress
            var successHeight = Math.ceil(icebergHeight * this.data.success / 100);

            //console.log('xCenter', xCenter);
            //console.log('hOffset', hOffset);
            //console.log('vOffset', vOffset);
            //console.log('icebergHeight', icebergHeight);
            //console.log('icebergWidth', icebergWidth);
            //console.log('bottomHeight', bottomHeight);
            //console.log('topHeight', topHeight);

            this.drawBg(hOffset + successHeight + 1);

            var points = this.drawWhiteIceberg(xCenter, hOffset, vOffset, topHeight, icebergHeight, icebergWidth, icebergHeight - bottomHeight);

            if (this.data.inprogress > 0) {
                this.drawInprogressPart(xCenter, hOffset + topHeight + 1, points);
            }

            this.drawUnknownPart(xCenter, hOffset + topHeight + 1, points, icebergHeight - bottomHeight);
            this.drawWaterLine(hOffset + successHeight);

            if (this.data.success > 0) {
                this.drawLabel(xCenter, hOffset + Math.ceil(successHeight / 2), hOffset, 14,
                    'left', labels.success + ' - ' + this.data.success + '%', labelColors.success);
            }

            if (this.data.fail > 0) {
                this.drawLabel(xCenter, hOffset + topHeight - Math.ceil((icebergHeight * this.data.fail / 100) / 2),
                    this.canvas.width - hOffset, hOffset + successHeight + 14,
                    'right', labels.fail + ' - ' + this.data.fail + '%', labelColors.fail);
            }

            if (this.data.inprogress > 0) {
                this.drawLabel(xCenter, hOffset + inprogressHeight + topHeight + 10 - Math.ceil((icebergHeight * this.data.inprogress / 100) / 2) - 14,
                    hOffset,
                    hOffset + topHeight + 15,
                    'left',
                    labels.inprogress + ' - ' + this.data.inprogress + '%', labelColors.inprogress);
            }

            if (this.data.unknown > 0) {
                this.drawLabel(xCenter, icebergHeight - Math.ceil(bottomHeight / 4) + 7,
                    this.canvas.width + hOffset / 2 - 10,
                    hOffset + topHeight + 15 + inprogressHeight, //icebergHeight - Math.ceil((bottomHeight +inprogressHeight+faiHeight)/ 4)+14,
                    'right', labels.unknown + ' - ' + this.data.unknown + '%',
                    labelColors.unknown);
            }
        }

        this.drawLabel = function (x, y, lx, ly, side, text, color) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.font = "bold 14px Arial";
            this.ctx.fillStyle = color;
            this.ctx.fillText(text, side == 'left' ? lx : lx - text.length * 8, ly);
            this.ctx.stroke();

            this.ctx.lineWidth = 1;
            this.ctx.miterLimit = 10;
            this.ctx.fillStyle = 'transparent';
            this.ctx.strokeStyle = color;
            this.ctx.moveTo(side == 'left' ? lx + text.length * 8 + 2 : lx - text.length * 8 - 2, ly - 7);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();

            this.ctx.restore();
        }

        this.drawWhiteIceberg = function (xCenter, hOffset, vOffset, topHeight, icebergHeight, icebergWidth, unknownHeight) {
            var points = [];
            this.ctx.lineWidth = 1;
            this.ctx.miterLimit = 10;
            this.ctx.fillStyle = colors.overWaterPartBg;
            this.ctx.strokeStyle = colors.overWaterPart;
            //this.ctx.strokeStyle = '#000000';
            this.ctx.beginPath();


            this.ctx.moveTo(xCenter, hOffset);
            this.drawBrokenLine(xCenter, hOffset, vOffset, hOffset + topHeight, -1, null, null);
            points = points.concat(this.drawBrokenLine(vOffset, hOffset + topHeight, xCenter, hOffset + icebergHeight, 1, unknownHeight, 'left'));
            points = points.concat(this.drawBrokenLine(xCenter, hOffset + icebergHeight, vOffset + icebergWidth, hOffset + topHeight, 1, unknownHeight, 'right'));
            this.drawBrokenLine(vOffset + icebergWidth, hOffset + topHeight, xCenter, hOffset, -1, null, null);

            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            return points;
        }

        this.drawInprogressPart = function (x, y, points, color) {
            this.ctx.lineWidth = 1;
            this.ctx.miterLimit = 10;
            this.ctx.fillStyle = colors.inprogressPartBg;
            this.ctx.strokeStyle = colors.inprogressPart;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            var self = this;
            points.forEach(function (point) {
                self.ctx.lineTo(point[0] + 1, point[1] + 1);
            });
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }


        this.drawUnknownPart = function (x, y, points, unknownHeight) {
            this.ctx.lineWidth = 1;
            this.ctx.miterLimit = 10;
            this.ctx.fillStyle = colors.unknownPartBg;
            this.ctx.strokeStyle = colors.unknownPart;
            this.ctx.beginPath();
            var self = this;
            points.forEach(function (point, index) {
                if (point[1] > (unknownHeight + 13)) {
                    self.ctx.lineTo(point[0] + 1, point[1] + 1);
                }
            });
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

        }

        this.drawBg = function (y) {
            this.ctx.save();
            this.ctx.lineWidth = 1;
            this.ctx.miterLimit = 10;
            this.ctx.fillStyle = colors.background;
            this.ctx.strokeStyle = colors.background;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.lineTo(this.canvas.width, this.canvas.height);
            this.ctx.lineTo(0, this.canvas.height);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.drawWaterLine = function (y) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.lineWidth = 2;
            this.ctx.miterLimit = 10;
            this.ctx.fillStyle = "transparent";
            this.ctx.strokeStyle = colors.waterLine;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.getRandomInt = function (min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        this.getRandomParts = function (x1, y1, x2, y2) {
            var length = Math.ceil(Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2)));
            var minPartLength = 30;
            var part = Math.ceil(length / 2);

            var cx1 = Math.ceil((x1 + x2) / 2);
            var cy1 = Math.ceil((y1 + y2) / 2);
            var cx2 = Math.ceil((x1 + x2) / 2);
            var cy2 = Math.ceil((y1 + y2) / 2);

            var parts = [];
            var parts2 = [];

            //console.log(length, '|');
            while (part > minPartLength) {
                if (this.getRandomInt(0, 1) == 1) {
                    parts.push([cx1, cy1]);
                }
                if (this.getRandomInt(0, 1) == 1) {
                    parts2.push([cx2, cy2]);
                }
                cx1 = Math.ceil((x1 + cx1) / 2);
                cy1 = Math.ceil((y1 + cy1) / 2);
                cx2 = Math.ceil((x2 + cx2) / 2);
                cy2 = Math.ceil((y2 + cy2) / 2);


                //console.log(part);
                part = Math.ceil(part / 2);
            }
            if (parts.length == 0) {
                parts.push([
                    Math.ceil((x1 + x2) / 2),
                    Math.ceil((y1 + y2) / 2)
                ]);
            }
            parts.reverse();
            parts = parts.concat(parts2);
            //console.log(parts);
            //console.log(parts2);
            return parts;
        }

        this.drawBrokenLine = function (x1, y1, x2, y2, direction, unknownHeight, position) {
            var points = [];

            var parts = this.getRandomParts(x1, y1, x2, y2);
            var self = this;
            unknownHeight = (unknownHeight) ? (unknownHeight + 14) : false;
            points.push([
                x1, y1
            ]);
            var setUnknownHeightY1 = false;
            var setUnknownHeightY2 = false;

            parts.forEach(function (part, i) {


                var subLineLength = self.getRandomInt(2, 8);
                var y1Offset = self.getRandomInt(-3, 3);
                var y2Offset = self.getRandomInt(-3, 3);
                var drowY1 = part[1] + y1Offset;
                var drowY2 = part[1] + y2Offset;

                if (unknownHeight && !setUnknownHeightY1 && unknownHeight <= drowY1) {
                    drowY1 = unknownHeight;
                    setUnknownHeightY1 = true;
                }

                if (unknownHeight && !setUnknownHeightY2 && unknownHeight <= drowY2) {
                    drowY2 = unknownHeight;
                    setUnknownHeightY2 = true;
                }

                if (setUnknownHeightY1 && drowY1 >= unknownHeight) {
                    drowY1 = unknownHeight;
                }

                if (setUnknownHeightY2 && drowY2 >= unknownHeight) {
                    drowY2 = unknownHeight;
                }

                if (position == 'left' && unknownHeight && i == (parts.length - 1) && !setUnknownHeightY1 && !setUnknownHeightY2) {
                    drowY1 = unknownHeight;
                    drowY2 = unknownHeight;
                    setUnknownHeightY2 = true;
                    setUnknownHeightY1 = true;
                }

                if (position == 'right' && !setUnknownHeightY2 && !setUnknownHeightY1 && unknownHeight) {
                    drowY1 = unknownHeight;
                    drowY2 = unknownHeight;
                    setUnknownHeightY1 = true;
                    setUnknownHeightY2 = true;
                }

                self.ctx.lineTo(part[0] - direction * subLineLength, drowY1);
                self.ctx.lineTo(part[0] + direction * subLineLength, drowY2);
                points.push([
                    part[0] - direction * subLineLength, drowY1, unknownHeight
                ]);
                points.push([
                    part[0] + direction * subLineLength, drowY2, unknownHeight
                ]);
            });

            points.push([
                x2, y2
            ]);
            self.ctx.lineTo(x2, y2);
            return points;
        }
    }

    exports.IcebergChart = IcebergChart;
    window.IcebergChart = IcebergChart;
    return IcebergChart;

}));