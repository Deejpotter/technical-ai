// Quick test to verify box selection logic

// Import the functions from BoxCalculations
const { packItemsIntoMultipleBoxes } = require('./BoxCalculations');

// Test case 1: Small items should not use 3m box
const smallItems = [
  {
    _id: "item1",
    name: "Small Item",
    sku: "TEST-SMALL",
    length: 100,
    width: 50,
    height: 30,
    weight: 500,
    quantity: 5
  }
];

console.log("=== Test Case 1: Small Items ===");
const result1 = packItemsIntoMultipleBoxes(smallItems);
console.log(`Selected box: ${result1.shipments[0].box.name}`);
console.log(`Box length: ${result1.shipments[0].box.length}mm\n`);

// Test case 2: Large item should use large box
const largeItems = [
  {
    _id: "item2",
    name: "Large Item",
    sku: "TEST-LARGE",
    length: 2000, // This should require a long box
    width: 50,
    height: 30,
    weight: 1000,
    quantity: 1
  }
];

console.log("=== Test Case 2: Large Items ===");
const result2 = packItemsIntoMultipleBoxes(largeItems);
console.log(`Selected box: ${result2.shipments[0].box.name}`);
console.log(`Box length: ${result2.shipments[0].box.length}mm\n`);

// Test case 3: Mix of items
const mixedItems = [
  {
    _id: "item1",
    name: "Small Item",
    sku: "TEST-SMALL",
    length: 100,
    width: 50,
    height: 30,
    weight: 500,
    quantity: 2
  },
  {
    _id: "item3",
    name: "Medium Item",
    sku: "TEST-MEDIUM",
    length: 500,
    width: 80,
    height: 60,
    weight: 800,
    quantity: 1
  }
];

console.log("=== Test Case 3: Mixed Items ===");
const result3 = packItemsIntoMultipleBoxes(mixedItems);
console.log(`Selected box: ${result3.shipments[0].box.name}`);
console.log(`Box length: ${result3.shipments[0].box.length}mm`);
