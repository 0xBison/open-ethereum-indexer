import { expect } from 'chai';
import { ethers } from 'ethers';
import { getTypeDetails, TypeDetails } from './getTypeDetails';

/**
 * Returns the string that should be appended to the end of the type string with respect to if its an array
 * @param arraySize -1 Denotes dynamic array, 0 denotes not an array, otherwise number is array size
 * @returns string that should be appended to the type - i.e. "[]", "" or [arraySize]
 */
function getTypeStringArraySuffix(arraySize: number): string {
  if (arraySize === 0) {
    // 0 - no suffix required so return empty string
    return '';
  }
  if (arraySize > 0) {
    return `[${arraySize.toString()}]`;
  }
  // -1 (or other negative number) so dynamic array
  return '[]';
}

/**
 * Get type of array (fixed/dynamic) based on array size
 * @param arraySize array size
 * @returns whether the array is fixed or dynamic (or non-array if not an array)
 */
function getArrayType(arraySize: number): string {
  if (arraySize === 0) {
    return 'non-array';
  }
  if (arraySize > 0) {
    return 'fixed array';
  }
  return 'dynamic array';
}

/**
 * Create type details object based on the params passed
 * @param fullType full type string from ABI
 * @param underlyingType underlying type i.e. for uint256[1] it is just uint
 * @param arraySize 0 for non-array, -1 for dynamic, positive number for fixed size array
 * @param typeSize optional param if type has a size e.g. for uint256[1] its 256
 * @returns the TypeDetails object for the params passed
 */
function createTypeDetails(
  fullType: string,
  underlyingType: string,
  arraySize: number,
  typeSize?: number,
): TypeDetails {
  // if type is uint or int and there's no size then we add the default size of 256
  if ((underlyingType === 'uint' || underlyingType === 'int') && !typeSize) {
    fullType = fullType.replace('int', 'int256');
    typeSize = 256;
  }

  const testValues: TypeDetails = {
    fullType,
    underlyingType,
    arraySize,
  };

  if (typeSize) {
    testValues.typeSize = typeSize.toString();
  }

  return testValues;
}

/**
 * Creates different tests for the underlying type based on array size and type size if relevant
 * @param underlyingType the underlying type e.g. uint, int, bool
 * @param arraySize negative number for dynamic array, 0 for non array test and positive for fixed array size
 * @param typeStepSize iterate from this value in this step until we reach typeMaxSize i.e. for uint would be 8, bytes is 1
 * @param typeMaxSize iterate up to this value in the step increments and then stop i.e. for uint would be 256, bytes max is 32
 * @returns an array of test values based on the inputs provided
 */
function createVariableTypeTests(
  underlyingType: string,
  arraySize: number,
  typeStepSize: number,
  typeMaxSize: number,
): TypeDetails[] {
  const results: TypeDetails[] = [];
  let typeSize: number = typeStepSize;

  while (typeSize <= typeMaxSize) {
    const fullType = `${underlyingType}${typeSize}${getTypeStringArraySuffix(
      arraySize,
    )}`;

    results.push(
      createTypeDetails(fullType, underlyingType, arraySize, typeSize),
    );

    typeSize += typeStepSize;
  }

  return results;
}

const testType = (type: string, expectedResult: TypeDetails) => {
  const components = {
    name: 'param_name',
    type,
  };

  const typeDetails = getTypeDetails(ethers.utils.ParamType.from(components));

  // Create a formatted output string for better readability
  const outputStr = JSON.stringify(expectedResult, null, 2)
    .replace(/\n\s*/g, ' ') // Replace newlines and indentation with spaces
    .replace(/[{}"]/g, '') // Remove braces and quotes
    .replace(/,/g, ', '); // Add space after commas

  // Use a more descriptive test name that includes input and expected output
  expect(typeDetails).to.deep.eq(
    expectedResult,
    `Input: ${type} should produce: ${outputStr}`,
  );
};

describe('getTypeDetails tests', () => {
  const arraySizes = [0, 2, -1];

  for (const arraySize of arraySizes) {
    describe(`${getArrayType(arraySize)} tests`, () => {
      describe(`uint ${getArrayType(arraySize)} tests`, () => {
        const tests = createVariableTypeTests('uint', arraySize, 8, 256);
        tests.forEach((test) => {
          // Format the expected output for better readability in test name
          const outputStr = JSON.stringify(test)
            .replace(/[{}"]/g, '')
            .replace(/,/g, ', ');

          it(`Input: ${test.fullType} → Output: ${outputStr}`, () => {
            testType(test.fullType, test);
          });
        });
      });

      // Apply the same pattern to other test blocks
      describe(`int ${getArrayType(arraySize)} tests`, () => {
        const tests = createVariableTypeTests('int', arraySize, 8, 256);
        tests.forEach((test) => {
          const outputStr = JSON.stringify(test)
            .replace(/[{}"]/g, '')
            .replace(/,/g, ', ');

          it(`Input: ${test.fullType} → Output: ${outputStr}`, () => {
            testType(test.fullType, test);
          });
        });
      });

      describe(`bytes ${getArrayType(arraySize)} tests`, () => {
        const tests = createVariableTypeTests('bytes', arraySize, 1, 32);
        tests.forEach((test) => {
          const outputStr = JSON.stringify(test)
            .replace(/[{}"]/g, '')
            .replace(/,/g, ', ');

          it(`Input: ${test.fullType} → Output: ${outputStr}`, () => {
            testType(test.fullType, test);
          });
        });
      });

      describe(`non sized primitive types and tuple ${getArrayType(
        arraySize,
      )} tests`, () => {
        for (const type of [
          'bool',
          'string',
          'address',
          'uint',
          'int',
          'bytes',
          'tuple',
        ]) {
          const fullType = `${type}${getTypeStringArraySuffix(arraySize)}`;
          const testValues = createTypeDetails(fullType, type, arraySize);

          const outputStr = JSON.stringify(testValues)
            .replace(/[{}"]/g, '')
            .replace(/,/g, ', ');

          it(`Input: ${fullType} → Output: ${outputStr}`, () => {
            testType(fullType, testValues);
          });
        }
      });
    });
  }
});
