import camelcase from 'camelcase';
import { ParamType } from 'ethers/lib/utils';
import { TypeDetails, getTypeDetails } from './getTypeDetails';

/**
 * Recursively processes Solidity event data to create a structured JavaScript object
 *
 * This function takes the parameter structure of an event and its raw arguments,
 * then constructs a JavaScript object that represents the event data in a more
 * accessible format. It handles complex nested structures including:
 * - Simple primitive values (uint, int, bool, address, etc.)
 * - Tuples (Solidity structs)
 * - Arrays of primitives
 * - Arrays of tuples
 * - Nested tuples and arrays
 *
 * @param params - Array of ParamType objects describing the event parameters
 * @param currentParamKey - Index tracker for recursion (start with -1 for root call)
 * @param eventArgs - The raw event arguments corresponding to the parameters
 * @returns A structured JavaScript object representing the event data
 *
 * @example
 * // For a simple event: event SimpleEvent(uint256 value, bool flag)
 * // With args: [BigNumber(123), true]
 * // Returns: { value: "123", flag: true }
 *
 * @example
 * // For a struct event: event StructEvent(MyStruct data) where MyStruct { uint256 a; bool b; }
 * // With args: [{ a: BigNumber(123), b: true }]
 * // Returns: { data: { a: "123", b: true } }
 */
export const getEventData = (
  params: ParamType[],
  currentParamKey: number,
  eventArgs: any,
): object => {
  const result = {};

  for (const param of params) {
    // Increment the parameter key for each parameter we process
    currentParamKey++;

    // Get type information for the current parameter
    const fieldInfo: TypeDetails = getTypeDetails(param);
    const currentArgValue = eventArgs[currentParamKey];

    // Determine the parameter characteristics
    const isTuple = fieldInfo.underlyingType === 'tuple';
    const isArray = fieldInfo.arraySize !== 0;

    // Process the value based on its type
    let processedValue;

    if (isTuple && !isArray) {
      // Handle a single tuple (struct)
      processedValue = getEventData(param.components, -1, currentArgValue);
    } else if (isTuple && isArray) {
      // Handle an array of tuples (array of structs)
      processedValue = currentArgValue.map((item) =>
        getEventData(param.components, -1, item),
      );
    } else if (isArray) {
      // Handle an array of primitives - match the original implementation's format
      const paramName = param.name;
      processedValue = currentArgValue.map((item) => {
        return {
          [paramName]: typeof item !== 'boolean' ? item.toString() : item,
        };
      });
    } else {
      // Handle primitive values
      processedValue =
        typeof currentArgValue !== 'boolean'
          ? currentArgValue.toString()
          : currentArgValue;
    }

    // Add the processed value to the result object with camelCased key
    result[camelcase(param.name)] = processedValue;
  }

  return result;
};
