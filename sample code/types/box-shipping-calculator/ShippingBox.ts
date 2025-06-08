/**
 * ShippingBox
 * Updated: 05/13/2025
 * Author: Deej Potter
 * Description: Interface for shipping box dimensions and weight capacity.
 * 
 * Properties:
 * - id: The unique identifier of the box
 * - name: The name of the box
 * - length: The length of the box in millimeters
 * - width: The width of the box in millimeters
 * - height: The height of the box in millimeters
 * - maxWeight: The maximum weight the box can hold in grams
 */
export default interface ShippingBox {
	/**
	 * MongoDB ObjectId as string
	 * @example "507f1f77bcf86cd799439011"
	 */
	_id: string;
	/**
	 * The name of the box.
	 * @example "Small Box"
	 */
	name: string;
	/**
	 * The length of the box in millimeters.
	 * @example 210
	 */
	length: number;
	/**
	 * The width of the box in millimeters.
	 * @example 170
	 */
	width: number;
	/**
	 * The height of the box in millimeters.
	 * @example 120
	 */
	height: number;
	/**
	 * The maximum weight the box can hold in grams.
	 * @example 25000
	 */
	maxWeight: number;
}
