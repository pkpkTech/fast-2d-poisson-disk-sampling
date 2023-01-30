import { TinyNDArrayOfInteger } from "./tiny-ndarray";
export interface Rect {
    width: number;
    height: number;
}
export interface Options {
    shape: Rect;
    radius: number;
    tries: number;
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
export declare class FastPoissonDiskSampling {
    constructor(options: Options, rng?: () => number);
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
    addRandomPoint(): Coords;
    /**
     * Add a given point to the grid
     * @param {Array} point Point
     * @returns {Array|null} The point added to the grid, null if the point is out of the bound or not of the correct dimension
     */
    addPoint(point: Coords): Coords | null;
    /**
     * Add a given point to the grid, without any check
     * @param {Array} point Point
     * @returns {Array} The point added to the grid
     * @protected
     */
    directAddPoint(point: Point): Coords;
    /**
     * Check whether a given point is in the neighbourhood of existing points
     * @param {Array} point Point
     * @returns {boolean} Whether the point is in the neighbourhood of another point
     * @protected
     */
    inNeighbourhood(point: Point): boolean;
    /**
     * Try to generate a new point in the grid, returns null if it wasn't possible
     * @returns {Array|null} The added point or null
     */
    next(): Coords | null;
    /**
     * Automatically fill the grid, adding a random point to start the process if needed.
     * Will block the thread, probably best to use it in a web worker or child process.
     * @returns {Array[]} Sample points
     */
    fill(): Coords[];
    /**
     * Get all the points in the grid.
     * @returns {Array[]} Sample points
     */
    getAllPoints(): Coords[];
    /**
     * Reinitialize the grid as well as the internal state
     */
    reset(): void;
}
