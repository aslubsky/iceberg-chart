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
            var unknownHeight = Math.ceil(icebergHeight * this.data.unknown / 100);
            var topHeight = Math.ceil(icebergHeight * (this.data.success + this.data.fail) / 100);
            var inprogressHeight = Math.ceil(icebergHeight * this.data.inprogress / 100);
            var inprRatio = this.data.unknown / (this.data.inprogress + this.data.unknown);
            var inprogressWidth = Math.ceil(icebergWidth * inprRatio) + vOffset * 2;
            var successHeight = Math.ceil(icebergHeight * this.data.success / 100);

            //console.log('xCenter', xCenter);
            //console.log('hOffset', hOffset);
            //console.log('vOffset', vOffset);
            //console.log('icebergHeight', icebergHeight);
            //console.log('icebergWidth', icebergWidth);
            //console.log('bottomHeight', bottomHeight);
            //console.log('topHeight', topHeight);


            this.drawBg(hOffset + successHeight + 1);

            var points = this.drawWhiteIceberg(xCenter, hOffset, vOffset, topHeight, unknownHeight,
                inprogressHeight, inprogressWidth, icebergHeight, icebergWidth);
            //console.log(points);
            this.drawInprogressPart(xCenter, hOffset + topHeight + 1, points.inprogress);
            this.drawUnknownPart(xCenter, hOffset + topHeight + inprogressHeight + 1, points.unknown);

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
                this.drawLabel(xCenter, hOffset + topHeight + Math.ceil(inprogressHeight / 2),
                    Math.ceil(hOffset / 2), hOffset + topHeight + Math.ceil(inprogressHeight / 2) - 10,
                    'left', labels.inprogress + ' - ' + this.data.inprogress + '%', labelColors.inprogress);
            }

            if (this.data.unknown > 0) {
                this.drawLabel(xCenter, icebergHeight + Math.ceil(hOffset / 2),
                    this.canvas.width + hOffset / 2 - 20, icebergHeight - Math.ceil(unknownHeight / 8) - 10,
                    'right', labels.unknown + ' - ' + this.data.unknown + '%', labelColors.unknown);
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
            var textX = 0;
            var textY = 0;
            var textXPos;
            if (Math.abs(y - ly) < 8) {
                textXPos = this.ctx.measureText(text).width;
                textX = side == 'left' ? lx + textXPos : lx - textXPos - 18;
                textY = ly - 5;
            } else {
                textXPos = Math.ceil(this.ctx.measureText(text).width / 2);
                textX = side == 'left' ? lx + textXPos : lx - textXPos;
                textY = ly + 3;
            }

            // console.log('y', y, 'ly', ly, Math.abs(y - ly));

            this.ctx.moveTo(textX, textY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
            this.ctx.restore();
        }

        this.drawWhiteIceberg = function (xCenter, hOffset, vOffset, topHeight, unknownHeight,
                                          inprogressHeight, inprogressWidth, icebergHeight, icebergWidth) {
            var points = {
                inprogress: [],
                unknown: []
            };
            this.ctx.lineWidth = 1;
            this.ctx.miterLimit = 10;
            this.ctx.fillStyle = colors.overWaterPartBg;
            this.ctx.strokeStyle = colors.overWaterPart;
            //this.ctx.strokeStyle = '#000000';
            this.ctx.beginPath();

            //  1/\6
            // 2| |5
            // 3\/4

            // console.log('inprogressHeight, unknownHeight', inprogressHeight, unknownHeight);
            this.ctx.moveTo(xCenter, hOffset);
            if (inprogressHeight > 0 && unknownHeight > 0) {
                this.drawBrokenLine(xCenter, hOffset, vOffset, hOffset + topHeight, -1);//1
                points.inprogress = points.inprogress.concat(//2
                    this.drawBrokenLine(vOffset, hOffset + topHeight,
                        xCenter - Math.ceil(inprogressWidth / 2), hOffset + topHeight + inprogressHeight, 1)
                );

                this.ctx.lineTo(xCenter + Math.ceil(inprogressWidth / 2), hOffset + topHeight + inprogressHeight);

                points.inprogress = points.inprogress.concat(//5
                    this.drawBrokenLine(xCenter + Math.ceil(inprogressWidth / 2), hOffset + topHeight + inprogressHeight,
                        vOffset + icebergWidth, hOffset + topHeight, 1)
                );

                this.drawBrokenLine(vOffset + icebergWidth, hOffset + topHeight, xCenter, hOffset, -1);//6
                this.ctx.closePath();

                this.ctx.moveTo(xCenter + Math.ceil(inprogressWidth / 2), hOffset + topHeight + inprogressHeight);
                this.ctx.lineTo(xCenter - Math.ceil(inprogressWidth / 2), hOffset + topHeight + inprogressHeight);
                points.unknown = points.unknown.concat(//3
                    this.drawBrokenLine(xCenter - Math.ceil(inprogressWidth / 2), hOffset + topHeight + inprogressHeight,
                        xCenter, hOffset + icebergHeight, 1)
                );
                points.unknown = points.unknown.concat(//4
                    this.drawBrokenLine(xCenter, hOffset + icebergHeight,
                        xCenter + Math.ceil(inprogressWidth / 2), hOffset + topHeight + inprogressHeight, 1)
                );

            } else if (inprogressHeight > 0) {
                this.drawBrokenLine(xCenter, hOffset, vOffset, hOffset + topHeight, -1);
                points.inprogress = points.inprogress.concat(
                    this.drawBrokenLine(vOffset, hOffset + topHeight, xCenter, hOffset + icebergHeight, 1));
                points.inprogress = points.inprogress.concat(
                    this.drawBrokenLine(xCenter, hOffset + icebergHeight, vOffset + icebergWidth, hOffset + topHeight, 1));
                this.drawBrokenLine(vOffset + icebergWidth, hOffset + topHeight, xCenter, hOffset, -1);
            } else if (unknownHeight > 0) {
                this.drawBrokenLine(xCenter, hOffset, vOffset, hOffset + topHeight, -1);
                points.unknown = points.unknown.concat(
                    this.drawBrokenLine(vOffset, hOffset + topHeight, xCenter, hOffset + icebergHeight, 1));
                points.unknown = points.unknown.concat(
                    this.drawBrokenLine(xCenter, hOffset + icebergHeight, vOffset + icebergWidth, hOffset + topHeight, 1));
                this.drawBrokenLine(vOffset + icebergWidth, hOffset + topHeight, xCenter, hOffset, -1);
            } else {
                this.drawBrokenLine(xCenter, hOffset, vOffset, hOffset + topHeight, -1);
                this.drawBrokenLine(vOffset, hOffset + topHeight, xCenter, hOffset + icebergHeight, 1);
                this.drawBrokenLine(xCenter, hOffset + icebergHeight, vOffset + icebergWidth, hOffset + topHeight, 1);
                this.drawBrokenLine(vOffset + icebergWidth, hOffset + topHeight, xCenter, hOffset, -1);
            }


            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
            return points;
        }

        this.drawInprogressPart = function (x, y, points) {
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

        this.drawUnknownPart = function (x, y, points) {
            this.ctx.lineWidth = 1;
            this.ctx.miterLimit = 10;
            this.ctx.fillStyle = colors.unknownPartBg;
            this.ctx.strokeStyle = colors.unknownPart;
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

        this.drawBrokenLine = function (x1, y1, x2, y2, direction) {
            var points = [];

            var parts = this.getRandomParts(x1, y1, x2, y2);
            var self = this;
            points.push([
                x1, y1
            ]);
            parts.forEach(function (part) {
                var subLineLength = self.getRandomInt(2, 8);
                var y1Offset = self.getRandomInt(-3, 3);
                var y2Offset = self.getRandomInt(-3, 3);

                self.ctx.lineTo(part[0] - direction * subLineLength, part[1] + y1Offset);
                self.ctx.lineTo(part[0] + direction * subLineLength, part[1] + y2Offset);
                points.push([
                    part[0] - direction * subLineLength, part[1] + y1Offset
                ]);
                points.push([
                    part[0] + direction * subLineLength, part[1] + y2Offset
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
