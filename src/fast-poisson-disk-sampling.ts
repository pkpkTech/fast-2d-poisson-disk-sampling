import { TinyNDArrayOfInteger } from "./tiny-ndarray";

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

export interface Rect { width: number, height: number }

export interface Options {
    shape: Rect;
    radius: number,
    tries: number,
}

export interface Coords {
    x: number;
    y: number;
}
export interface Point extends Coords {
    angle?: number;
    tries?: number;
}

/**
 * FastPoissonDiskSampling constructor
 * @param {object} options Options
 * @param {Array} options.shape Shape of the space
 * @param {float} options.radius Minimum distance between each points
 * @param {int} [options.tries] Number of times the algorithm will try to place a point in the neighbourhood of another points, defaults to 30
 * @param {function|null} [rng] RNG function, defaults to Math.random
 * @constructor
 */
export class FastPoissonDiskSampling {
    constructor(options: Options, rng?: () => number) {
        this.width = options.shape.width;
        this.height = options.shape.height;
        this.radius = options.radius;
        this.maxTries = Math.max(3, Math.ceil(options.tries || 30));

        this.rng = rng ?? Math.random;

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

        // cache grid

        this.gridShape = {
            width: Math.ceil(this.width / this.cellSize),
            height: Math.ceil(this.height / this.cellSize)
        };

        this.grid = new TinyNDArrayOfInteger(this.gridShape); //will store references to samplePoints
    }

    width: number;
    height: number;
    radius: number;
    maxTries: number;

    rng: () => number;

    squaredRadius: number;
    radiusPlusEpsilon: number;
    cellSize: number;
    angleIncrement: number;
    angleIncrementOnSuccess: number;
    triesIncrementOnSuccess: number;

    processList: Point[];
    samplePoints: Coords[];

    gridShape: Rect;
    grid: TinyNDArrayOfInteger;


    /**
     * Add a totally random point in the grid
     * @returns {Array} The point added to the grid
     */
    addRandomPoint(): Coords {
        return this.directAddPoint({
            x: this.rng() * this.width,
            y: this.rng() * this.height,
            angle: this.rng() * Math.PI * 2,
            tries: 0
        });
    };

    /**
     * Add a given point to the grid
     * @param {Array} point Point
     * @returns {Array|null} The point added to the grid, null if the point is out of the bound or not of the correct dimension
     */
    addPoint(point: Coords): Coords | null {
        const valid =
            point.x >= 0 &&
            point.x < this.width &&
            point.y >= 0 &&
            point.y < this.height;

        return valid ?
            this.directAddPoint({
                ...point,
                angle: this.rng() * Math.PI * 2,
                tries: 0
            }) :
            null;
    };

    /**
     * Add a given point to the grid, without any check
     * @param {Array} point Point
     * @returns {Array} The point added to the grid
     * @protected
     */
    directAddPoint(point: Point): Coords {
        var coordsOnly: Coords = { x: point.x, y: point.y };
        this.processList.push(point);
        this.samplePoints.push(coordsOnly);

        var internalArrayIndex = ((point.x / this.cellSize) | 0) * this.grid.strideX + ((point.y / this.cellSize) | 0);

        this.grid.data[internalArrayIndex] = this.samplePoints.length; // store the point reference

        return coordsOnly;
    };

    /**
     * Check whether a given point is in the neighbourhood of existing points
     * @param {Array} point Point
     * @returns {boolean} Whether the point is in the neighbourhood of another point
     * @protected
     */
    inNeighbourhood(point: Point): boolean {
        var strideX = this.grid.strideX,
            boundX = this.gridShape.width,
            boundY = this.gridShape.height,
            cellX = point.x / this.cellSize | 0,
            cellY = point.y / this.cellSize | 0,
            neighbourIndex,
            internalArrayIndex,
            currentDimensionX,
            currentDimensionY,
            existingPoint;

        for (neighbourIndex = 0; neighbourIndex < neighbourhoodLength; neighbourIndex++) {
            currentDimensionX = cellX + neighbourhood[neighbourIndex][0];
            currentDimensionY = cellY + neighbourhood[neighbourIndex][1];

            internalArrayIndex = (
                currentDimensionX < 0 || currentDimensionY < 0 || currentDimensionX >= boundX || currentDimensionY >= boundY ?
                    -1 :
                    currentDimensionX * strideX + currentDimensionY
            );

            if (internalArrayIndex !== -1 && this.grid.data[internalArrayIndex] !== 0) {
                existingPoint = this.samplePoints[this.grid.data[internalArrayIndex] - 1];

                if (Math.pow(point.x - existingPoint.x, 2) + Math.pow(point.y - existingPoint.y, 2) < this.squaredRadius) {
                    return true;
                }
            }
        }

        return false;
    };

    /**
     * Try to generate a new point in the grid, returns null if it wasn't possible
     * @returns {Array|null} The added point or null
     */
    next() {
        var tries,
            currentPoint,
            currentAngle,
            newPoint;

        while (this.processList.length > 0) {
            var index = this.processList.length * this.rng() | 0;

            currentPoint = this.processList[index];
            currentAngle = currentPoint.angle!;
            tries = currentPoint.tries!;

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

                if (
                    (newPoint.x >= 0 && newPoint.x < this.width) &&
                    (newPoint.y >= 0 && newPoint.y < this.height) &&
                    !this.inNeighbourhood(newPoint)
                ) {
                    currentPoint.angle = currentAngle + this.angleIncrementOnSuccess + this.rng() * this.angleIncrement;
                    currentPoint.tries = tries + this.triesIncrementOnSuccess;
                    return this.directAddPoint(newPoint);
                }

                currentAngle = currentAngle + this.angleIncrement;
            }

            if (tries >= this.maxTries) {
                const r = this.processList.pop()!;
                if (index < this.processList.length) {
                    this.processList[index] = r;
                }
            }
        }

        return null;
    };

    /**
     * Automatically fill the grid, adding a random point to start the process if needed.
     * Will block the thread, probably best to use it in a web worker or child process.
     * @returns {Array[]} Sample points
     */
    fill() {
        if (this.samplePoints.length === 0) {
            this.addRandomPoint();
        }

        while (this.next()) { }

        return this.samplePoints;
    };

    /**
     * Get all the points in the grid.
     * @returns {Array[]} Sample points
     */
    getAllPoints() {
        return this.samplePoints;
    };

    /**
     * Reinitialize the grid as well as the internal state
     */
    reset() {
        var gridData = this.grid.data,
            i;

        // reset the cache grid
        for (i = 0; i < gridData.length; i++) {
            gridData[i] = 0;
        }

        // new array for the samplePoints as it is passed by reference to the outside
        this.samplePoints = [];

        // reset the internal state
        this.processList.length = 0;
    };
}
