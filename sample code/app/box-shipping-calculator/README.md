# Box Shipping Calculator

## Overview

The Box Shipping Calculator is a sophisticated tool designed to optimize packaging for shipping by determining the most efficient box configuration for a set of items. It uses an Extreme Point-based 3D bin packing algorithm to calculate the optimal packing arrangement for items of various shapes and sizes.

Last Updated: May 13, 2025  
Author: Deej Potter

## Features

- **3D Bin Packing Algorithm**: Uses an advanced spatial algorithm to efficiently pack items into boxes
- **Multi-Box Support**: Can distribute items across multiple boxes when a single box isn't sufficient
- **Weight & Volume Optimization**: Considers both weight and volume constraints for optimal shipping costs
- **Visual Results**: Displays packing results with detailed metrics about volume and weight utilization
- **Item Management**: Add, edit, and remove items from the database with a user-friendly interface
- **Smart Box Selection**: Prioritizes smaller boxes over larger ones to minimize shipping costs
- **Orientation Optimization**: Considers all possible item orientations to maximize space efficiency
- **Invoice Processing**: Import items from text files using AI-powered text extraction
- **Simplified File Processing**: Processes text files directly (no complex PDF dependencies)

## Components

The Box Shipping Calculator consists of several interconnected components:

### 1. `BoxCalculations.ts`

The core algorithm for calculating optimal box configurations. This file implements:

- **Extreme Point-based 3D bin packing algorithm** - A spatial algorithm that efficiently positions items in 3D space
- **Box preference calculation** - Logic to prefer smaller boxes when possible
- **Multi-box packing strategy** - Smart distribution of items across multiple boxes when needed

### 2. `BoxResultsDisplay.tsx`

Handles the visual presentation of packing results, showing:

- Box utilization metrics (volume and weight)
- Visual representation of packed boxes
- Items that could not be fitted into boxes

### 3. `ItemSelectAndCalculate.tsx`

The main user interface for selecting items and initiating calculations, featuring:

- Item search, filtering, and sorting
- Item quantity management
- Item selection for calculation

### 4. `ItemAddForm.tsx` and `ItemEditModal.tsx`

Components for adding new items and editing existing ones in the database.

### 5. `InvoiceUploader.tsx`

Component for uploading invoices to automatically extract item information.

## Algorithm Details

The Box Shipping Calculator uses the Extreme Point-based 3D bin packing algorithm, which works as follows:

1. **Extreme Points Generation**: The algorithm maintains a set of "extreme points" where new items could potentially be placed.
2. **Item Placement**: For each item, it tries all possible orientations at each extreme point to find the best fit.
3. **Box Selection**: Starts with the smallest possible box and progressively tries larger ones until all items fit.
4. **Multi-Box Strategy**: When items don't fit in a single box, the algorithm intelligently distributes them across multiple boxes.
5. **Weight Constraints**: Ensures that box weight limits are respected in addition to spatial constraints.
6. **Box Preference**: Implements a penalty for excessively large boxes to minimize shipping costs.

## Usage

To use the Box Shipping Calculator:

1. **Select Items**: Use the search, filter, and sort functions to find and add items to your selection.
2. **Adjust Quantities**: Set the quantity for each item as needed.
3. **Calculate**: Click the "Calculate Box Size" button to determine the optimal box configuration.
4. **Review Results**: View the recommended box configuration with detailed metrics.
5. **Manage Items**: Use the item management functions to add, edit, or remove items from the database.

## Data Structure

The calculator uses the following key data structures:

- **ShippingItem**: Represents an item with dimensions, weight, and quantity.
- **ShippingBox**: Represents a box with dimensions and maximum weight capacity.
- **PackedItem**: Represents an item with its position and orientation within a box.
- **PackingBox**: Represents a box with its packed items and remaining space.

## Technical Architecture

### Data Models

The Box Shipping Calculator uses three primary interfaces:

1. **`ShippingItem`** (`interfaces/box-shipping-calculator/ShippingItem.ts`)
   - Represents an item with dimensions, weight, and quantity
   - Properties include id, name, dimensions, weight, and quantity

2. **`ShippingBox`** (`interfaces/box-shipping-calculator/ShippingBox.ts`)
   - Represents a box with dimensions and maximum weight capacity
   - Properties include id, name, dimensions, and weightCapacity

3. **`ShippingItemList`** (`interfaces/box-shipping-calculator/ShippingItemList.ts`)
   - Provides type definitions for managing collections of shipping items

### Core Algorithm

The 3D bin packing algorithm is implemented in `BoxCalculations.ts` and consists of:

- **`findOptimalBoxConfiguration`**: Main entry point that determines the best box for a set of items
- **`packItemsIntoBox`**: Places items into a specific box using the Extreme Point algorithm
- **`createExtremePoints`**: Identifies positions where new items can be placed
- **`calculateVolumeUtilization`**: Measures how efficiently a box's volume is being used

### React Components

- **`page.tsx`**: Main page component that integrates all calculator functionality
- **`ItemSelectAndCalculate.tsx`**: Handles item selection and initiates calculations
- **`BoxResultsDisplay.tsx`**: Visualizes packing results with metrics
- **`ItemAddForm.tsx`** & **`ItemEditModal.tsx`**: Manage item database entries
- **`InvoiceUploader.tsx`**: Processes invoice data to extract item information

### Testing

- **`BoxCalculations.test.ts`**: Unit tests for the bin packing algorithm
- **`BoxResultsDisplay.test.tsx`**: Tests for the results display component

## Future Enhancements

Planned improvements for the Box Shipping Calculator include:

1. **Custom Box Dimensions**: Allow users to define custom box dimensions
2. **Shipping Cost Calculation**: Integrate with shipping carriers to calculate actual shipping costs
3. **Fragility Consideration**: Account for fragile items that require special handling
4. **Box Arrangement Visualization**: Add a 3D visualization of the box packing arrangement
5. **Export & Print**: Enable exporting packing instructions and printing packing slips
6. **Orientation Restrictions**: Support items that can only be placed in certain orientations
7. **Multi-Box Optimization**: Improve the algorithm for distributing items across multiple boxes

## Troubleshooting

Common issues and their solutions:

- **Items Not Fitting**: If items don't fit, try adjusting their orientations or dimensions. Very large items may require special handling.
- **Weight Distribution**: If weight distribution is uneven, consider manually adjusting item assignment to boxes.
- **Performance Issues**: For very large item sets (100+), calculations may take longer. Consider breaking down into smaller batches.
- **Data Import Errors**: When using the invoice uploader, ensure the invoice format matches the expected structure.
- **Performance Issues**: For very large numbers of items, try grouping similar items or breaking the calculation into smaller batches.
