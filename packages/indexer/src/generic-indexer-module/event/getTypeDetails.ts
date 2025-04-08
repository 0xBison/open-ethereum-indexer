import { ParamType } from 'ethers/lib/utils';

export interface TypeDetails {
  fullType: string; // uint8[]
  underlyingType: string; // uint
  arraySize: number; // 0 if not an array, -1 if dynamic, otherwise array size
  typeSize?: string; // 8
}

/**
 * Parses a Solidity type and extracts detailed information about it
 *
 * This function analyzes a Solidity parameter type and returns a structured object
 * containing information about the type's characteristics including:
 * - The full type string (e.g. "uint256[]")
 * - The underlying type (e.g. "uint")
 * - Whether it's an array and what kind (fixed or dynamic)
 * - The bit size for types that have sizes (uint/int/bytes)
 *
 * @param paramType An ethers.js ParamType object representing a Solidity type
 * @returns A TypeDetails object with parsed information about the type
 *
 * @example
 * // For a simple type:
 * // Input: ParamType for "uint256"
 * // Output: {
 * //   fullType: "uint256",
 * //   underlyingType: "uint",
 * //   arraySize: 0,
 * //   typeSize: "256"
 * // }
 *
 * @example
 * // For a dynamic array:
 * // Input: ParamType for "address[]"
 * // Output: {
 * //   fullType: "address[]",
 * //   underlyingType: "address",
 * //   arraySize: -1
 * // }
 *
 * @example
 * // For a fixed-size array:
 * // Input: ParamType for "bytes32[2]"
 * // Output: {
 * //   fullType: "bytes32[2]",
 * //   underlyingType: "bytes",
 * //   arraySize: 2,
 * //   typeSize: "32"
 * // }
 *
 * @example
 * // For a tuple:
 * // Input: ParamType for "tuple"
 * // Output: {
 * //   fullType: "tuple",
 * //   underlyingType: "tuple",
 * //   arraySize: 0
 * // }
 *
 * @example
 * // For a fixed-size array of tuples:
 * // Input: ParamType for "tuple[2]"
 * // Output: {
 * //   fullType: "tuple[2]",
 * //   underlyingType: "tuple",
 * //   arraySize: 2
 * // }
 *
 * @example
 * // For a dynamic array of tuples:
 * // Input: ParamType for "tuple[]"
 * // Output: {
 * //   fullType: "tuple[]",
 * //   underlyingType: "tuple",
 * //   arraySize: -1
 * // }
 */
export function getTypeDetails(paramType: ParamType): TypeDetails {
  const { type } = paramType;
  const underlyingType: string = (type.match(/[a-zA-Z]+/) || [''])[0];

  let arraySizeValue = (type.match(/.*\[(.*)\].*/) || [type, '0'])[1];

  if (arraySizeValue === '') {
    arraySizeValue = '-1';
  }

  const arraySize = parseInt(arraySizeValue);

  const typeDetails: TypeDetails = {
    fullType: type,
    underlyingType,
    arraySize,
  };

  const typeSize: string = (type.match(/[0-9]+(?!\])/) || [''])[0];

  if (typeSize !== '') {
    typeDetails.typeSize = typeSize;
  }

  return typeDetails;
}
