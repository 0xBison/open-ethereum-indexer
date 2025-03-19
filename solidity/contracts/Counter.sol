// Counter.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 private count;
    
    // Event emitted when the counter is incremented
    event CounterIncremented(uint256 newCount);
    event CounterDecremented(uint256 newCount);
    
    // Increment the counter and emit an event
    function increment() public {
        count += 1;
        emit CounterIncremented(count);
    }

    // Decrement the counter and emit an event
    function decrement() public {
        count -= 1;
        emit CounterDecremented(count);
    }

    // Get the current count
    function getCount() public view returns (uint256) {
        return count;
    }
}