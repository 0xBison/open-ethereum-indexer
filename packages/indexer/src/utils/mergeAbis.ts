import fs from 'fs';
import path from 'path';
import { getFullEventSignature } from 'solidity-events-to-typeorm';

/**
 * Merges multiple ABIs, keeping only event definitions and handling duplicates
 * @param abis - Array of ABIs to merge
 * @returns The merged ABI containing only events
 */
export function mergeEventAbis(...abis: any[]): any[] {
  // Object to track events by their signatures
  const eventsBySignature: { [signature: string]: any } = {};

  // Count of warnings for testing purposes
  let warningCount = 0;

  // Process each ABI
  for (const abi of abis) {
    if (!Array.isArray(abi)) {
      console.warn('Skipping non-array ABI input');
      continue;
    }

    // Filter only events from the ABI
    const events = abi.filter((item: any) => item.type === 'event');

    // Process each event
    for (const event of events) {
      try {
        const signature = getFullEventSignature(event);

        // If we haven't seen this signature before, add it
        if (!eventsBySignature[signature]) {
          eventsBySignature[signature] = event;
        } else {
          // We already have an event with this signature, check for differences
          const existingEvent = eventsBySignature[signature];

          // Compare field names and properties to see if they're the same structurally
          const isDifferent =
            JSON.stringify(existingEvent) !== JSON.stringify(event);

          if (isDifferent) {
            console.warn(
              `WARNING: Event with signature "${signature}" has different definitions across ABIs.`,
            );
            warningCount++;
            // We keep the first one we encountered
          }
          // If they're identical, we just skip (no need to add a duplicate)
        }
      } catch (error) {
        console.warn(`Error processing event: ${error}`);
      }
    }
  }

  // Convert the map back to an array
  const mergedEvents = Object.values(eventsBySignature);

  // For testing/debugging
  if (process.env.NODE_ENV === 'test') {
    (mergedEvents as any).warningCount = warningCount;
  }

  return mergedEvents;
}

/**
 * Merges multiple ABI files, extracting only events and handling duplicates
 * @param abiPaths - Array of paths to ABI JSON files
 * @param outputPath - Optional path to write the merged ABI
 * @returns The merged ABI containing only events
 */
export function mergeEventAbiFiles(
  abiPaths: string[],
  outputPath?: string,
): any[] {
  // Load all ABI files
  const abis = abiPaths.map((abiPath) => {
    try {
      const abiJson = fs.readFileSync(path.resolve(abiPath), 'utf8');
      return JSON.parse(abiJson);
    } catch (error) {
      console.error(`Error loading ABI from ${abiPath}:`, error);
      return [];
    }
  });

  // Merge the ABIs
  const mergedAbi = mergeEventAbis(...abis);

  // Write to output file if specified
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(mergedAbi, null, 2));
    console.log(`Merged event ABI written to ${outputPath}`);
  }

  return mergedAbi;
}
