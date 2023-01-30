"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastPoissonDiskSampling = void 0;
const tiny_ndarray_1 = require("./tiny-ndarray");
const piDiv3 = Math.PI / 3;
const neighbourhood = [
    [0, 0], [0, -1], [-1, 0],
    [1, 0], [0, 1], [-1, -1],
    [1, -1], [-1, 1], [1, 1],
    [0, -2], [-2, 0], [2, 0],
    [0, 2], [-1, -2], [1, -2],
    [-2, -1], [2, -1], [-2, 1],
    [2, 1], [-1, 2], [1, 2]
];
const neighbourhoodLength = neighbourhood.length;
class FastPoissonDiskSampling {
    constructor(options, rng) {
        this.width = options.shape.width;
        this.height = options.shape.height;
        this.radius = options.radius;
        this.maxTries = Math.max(3, Math.ceil(options.tries || 30));
        this.rng = rng !== null && rng !== void 0 ? rng : Math.random;
        const floatPrecisionMitigation = Math.max(1, Math.max(this.width, this.height) / 64 | 0);
        const epsilonRadius = 1e-14 * floatPrecisionMitigation;
        const epsilonAngle = 2e-14;
        this.squaredRadius = this.radius * this.radius;
        this.radiusPlusEpsilon = this.radius + epsilonRadius;
        this.cellSize = this.radius * Math.SQRT1_2;
        this.angleIncrement = Math.PI * 2 / this.maxTries;
        this.angleIncrementOnSuccess = piDiv3 + epsilonAngle;
        this.triesIncrementOnSuccess = Math.ceil(this.angleIncrementOnSuccess / this.angleIncrement);
        this.processList = [];
        this.samplePoints = [];
        this.gridShape = {
            width: Math.ceil(this.width / this.cellSize),
            height: Math.ceil(this.height / this.cellSize)
        };
        this.grid = new tiny_ndarray_1.TinyNDArrayOfInteger(this.gridShape);
    }
    addRandomPoint() {
        return this.directAddPoint({
            x: this.rng() * this.width,
            y: this.rng() * this.height,
            angle: this.rng() * Math.PI * 2,
            tries: 0
        });
    }
    ;
    addPoint(point) {
        const valid = point.x >= 0 &&
            point.x < this.width &&
            point.y >= 0 &&
            point.y < this.height;
        return valid ?
            this.directAddPoint(Object.assign(Object.assign({}, point), { angle: this.rng() * Math.PI * 2, tries: 0 })) :
            null;
    }
    ;
    directAddPoint(point) {
        var coordsOnly = { x: point.x, y: point.y };
        this.processList.push(point);
        this.samplePoints.push(coordsOnly);
        var internalArrayIndex = ((point.x / this.cellSize) | 0) * this.grid.strideX + ((point.y / this.cellSize) | 0);
        this.grid.data[internalArrayIndex] = this.samplePoints.length;
        return coordsOnly;
    }
    ;
    inNeighbourhood(point) {
        var strideX = this.grid.strideX, boundX = this.gridShape.width, boundY = this.gridShape.height, cellX = point.x / this.cellSize | 0, cellY = point.y / this.cellSize | 0, neighbourIndex, internalArrayIndex, currentDimensionX, currentDimensionY, existingPoint;
        for (neighbourIndex = 0; neighbourIndex < neighbourhoodLength; neighbourIndex++) {
            currentDimensionX = cellX + neighbourhood[neighbourIndex][0];
            currentDimensionY = cellY + neighbourhood[neighbourIndex][1];
            internalArrayIndex = (currentDimensionX < 0 || currentDimensionY < 0 || currentDimensionX >= boundX || currentDimensionY >= boundY ?
                -1 :
                currentDimensionX * strideX + currentDimensionY);
            if (internalArrayIndex !== -1 && this.grid.data[internalArrayIndex] !== 0) {
                existingPoint = this.samplePoints[this.grid.data[internalArrayIndex] - 1];
                if (Math.pow(point.x - existingPoint.x, 2) + Math.pow(point.y - existingPoint.y, 2) < this.squaredRadius) {
                    return true;
                }
            }
        }
        return false;
    }
    ;
    next() {
        var tries, currentPoint, currentAngle, newPoint;
        while (this.processList.length > 0) {
            var index = this.processList.length * this.rng() | 0;
            currentPoint = this.processList[index];
            currentAngle = currentPoint.angle;
            tries = currentPoint.tries;
            if (tries === 0) {
                currentAngle = currentAngle + (this.rng() - 0.5) * piDiv3 * 4;
            }
            for (; tries < this.maxTries; tries++) {
                newPoint = {
                    x: currentPoint.x + Math.cos(currentAngle) * this.radiusPlusEpsilon,
                    y: currentPoint.y + Math.sin(currentAngle) * this.radiusPlusEpsilon,
                    angle: currentAngle,
                    tries: 0
                };
                if ((newPoint.x >= 0 && newPoint.x < this.width) &&
                    (newPoint.y >= 0 && newPoint.y < this.height) &&
                    !this.inNeighbourhood(newPoint)) {
                    currentPoint.angle = currentAngle + this.angleIncrementOnSuccess + this.rng() * this.angleIncrement;
                    currentPoint.tries = tries + this.triesIncrementOnSuccess;
                    return this.directAddPoint(newPoint);
                }
                currentAngle = currentAngle + this.angleIncrement;
            }
            if (tries >= this.maxTries) {
                const r = this.processList.pop();
                if (index < this.processList.length) {
                    this.processList[index] = r;
                }
            }
        }
        return null;
    }
    ;
    fill() {
        if (this.samplePoints.length === 0) {
            this.addRandomPoint();
        }
        while (this.next()) { }
        return this.samplePoints;
    }
    ;
    getAllPoints() {
        return this.samplePoints;
    }
    ;
    reset() {
        var gridData = this.grid.data, i;
        for (i = 0; i < gridData.length; i++) {
            gridData[i] = 0;
        }
        this.samplePoints = [];
        this.processList.length = 0;
    }
    ;
}
exports.FastPoissonDiskSampling = FastPoissonDiskSampling;
