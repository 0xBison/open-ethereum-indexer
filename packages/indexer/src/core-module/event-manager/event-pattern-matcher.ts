/**
 * Determines if a contract event matches a given pattern.
 * Patterns are in the format "ContractName:EventName".
 * Wildcards (*) can be used for either contract name or event name.
 *
 * @example
 * // Exact matches
 * matchesEventPattern("Uniswap", "Trade", "Uniswap:Trade") // true
 *
 * // Wildcard contract
 * matchesEventPattern("Uniswap", "Transfer", "*:Transfer") // true
 *
 * // Wildcard event
 * matchesEventPattern("Uniswap", "Trade", "Uniswap:*") // true
 *
 * // Full wildcard
 * matchesEventPattern("Any", "Event", "*:*") // true
 *
 * @param contractName - The actual contract name (e.g., "Uniswap")
 * @param eventName - The actual event name (e.g., "Trade")
 * @param pattern - The pattern to match against (e.g., "*:Transfer")
 * @returns boolean indicating if the contract and event names match the pattern
 */
export function matchesEventPattern(
  contractName: string | null | undefined,
  eventName: string,
  pattern: string,
): boolean {
  const [contractPattern, eventPattern] = pattern.split(':');

  // Contract can be blank/null/undefined and should match either wildcard or empty pattern
  const contractMatches =
    contractPattern === '*' ||
    contractPattern === '' || // Handle empty contract pattern
    (!!contractName && contractPattern === contractName);

  const eventMatches = eventPattern === '*' || eventPattern === eventName;

  return contractMatches && eventMatches;
}
