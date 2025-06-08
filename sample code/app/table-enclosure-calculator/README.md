# Table and Enclosure Calculator

## Overview

The Table and Enclosure Calculator is a tool for generating a Bill of Materials (BOM) for CNC machine tables and enclosures of various sizes. It provides detailed calculations for extrusion lengths, hardware requirements, and panel materials, and outputs a BOM suitable for direct entry into WooCommerce orders.

## Features

- Calculate materials for machine tables with custom dimensions
- Calculate materials for enclosures with custom dimensions
- Handle both inside and outside dimension specifications
- Support for mounting enclosures to tables
- Support for doors and panels with various material types
- Export BOM to CSV (WooCommerce-ready)
- Simplified interface focused on core BOM calculation functionality

## BOM Export (WooCommerce-Ready)

The calculator generates a Bill of Materials (BOM) that includes only the following fields for each part:

- **Item**: Part name (e.g., "2060 Linear Rail (Length)")
- **SKU**: Stock Keeping Unit for WooCommerce import
- **QTY**: Quantity required
- **Description/Length**: Additional details or cut length

All cost/cost breakdown features have been removed. The BOM is designed for direct entry into WooCommerce orders or inventory systems.

## Calculator Usage

The calculator provides an easy-to-use interface for calculating materials needed for tables and enclosures with custom dimensions. The results panel displays the BOM and allows export to CSV or printing for manual entry.

## Calculator API

The calculator provides reusable functions in `calcUtils.ts` for various calculations:

```typescript
import { 
  calculateTableMaterials, 
  calculateEnclosureMaterials,
  calculateMountingMaterials,
  calculateDoorMaterials,
  calculatePanelMaterials 
} from './calcUtils';
```

## Extending the Calculator

The calculator is designed to be extensible. You can create custom configurations by using the calculation functions directly in your own components.

## Testing

Tests for all calculation utilities are available in:

- `calcUtils.test.ts` - Tests for the core calculation functions

Run tests with:

```bash
npm test app/table-enclosure-calculator
```

## 1. Overview

This report provides a comprehensive analysis of the Machine Table and Enclosure system, focusing on critical calculations, dimensional relationships, and integration considerations for automated configuration calculations.

The purpose of the app is to be able to calculate all the extrusion lengths and other hardware quantities that are required for custom sized machine tables and enclosures. It should be able to calculate a custom sized table or enclosure separately or an enclosure mounted on a machine table where they share side lengths.

## 2. Table

### Extrusions

The standard 20 series machine table always uses 2 sets of extrusions, on one the top and one to brace the legs. The total height of the table will just be the leg height.
The OD of the table will be the ID + the width of the 2 perpendicular extrusions (2x 20mm for the standard 20 series table).
The standard setup for extrusions for a machine table are:

- 4x 2060 x ID Length (2 for top and 2 for support)
- 4x 2060 x ID Width (2 for top and 2 for support)
- 4x 4040 x Height

### Hardware

The standard 20 series machine table always has 4 legs on the inside with the extrusions attached to the outside.
Each of the legs are attached with 2x Triple L Brackets with 3 holes on each side that line up with the 2060 slots and the 4040 leg slots.
There is one 2060 frame at the top and one on the legs for bracing.
Each hole on each L bracket will need an M5 button head screw (SCREWS-M5-BH-8-1) and an M5 T-nut (HARD-TNUT-SLIDING-M5).

There are 4 corners of the table and 2 brackets for each corner so that means we will need these for the inside mounting of the table legs:

- 8x Triple L Bracs for each frame so 16 in total.
- (6 x 2) x 4 = 48 screws and T-nuts for each frame for a total of 96.

The outside of the frames are joined with 60mm IO brackets, 1 on each corner x 2 frames = 8 pieces in total.
They also need 6 screws and T-nuts but they use the Cap heads instead (BOLT-M5-CAP-008-1PC) and there is only one bracket for each corner.
In total we will need:

- 8x BRAC-IOCNR-60
- 6 x 4 = 24 screws and T-nuts for each frame for a total of 48 for both frames.

### BOM for a standard 20 series table

| Item | Description | SKU | QTY |
|------|-------------|-----|-----|
| 1 | 2060 Linear Rail | LR-2060-(C)-(length or width) | 8 |
| 2 | 4040 Linear Rail | LR-4040-(C)-(height) | 4 |
| 3 | In-Out Corner Bracket – 60mm | BRAC-IOCNR-60 | 8 |
| 4 | Universal L Brackets – Triple | BRAC-L3 | 16 |
| 5 | Sliding T-Nut | HARD-TNUT-SLIDING-M5 | 144 |
| 6 | M5 Cap Head Bolts – 8MM | BOLT-M5-CAP-008-1PC | 48 |
| 7 | M5 Button Head Screws – 8MM | SCREWS-M5-BH-8-1 | 96 |
| 8 | M5 Low Profile Screws – 25MM | SCREWS-M5-LP-25-1 | 16 |
| 9 | Foot Mounting Brackets | BRAC-FOOT | 4 |
| 10 | Wheels or Adjustable Feet | BUN-FOOT | 4 |

## 3. Enclosure

The standard 20 series enclosure is made up of 4 separate square frames, joined on the inside with BRAC-90ANG and on the outside with IO brackets.
The extrusions lengths should be the ID of the enclosure and the OD of the table will be the ID + the width of the perpendicular extrusions (the width of the panels) (2x 20mm for the standard 20 series enclosure).

### Extrusions

The standard setup for extrusions for an enclosure are:

- 2x 2020 x ID Length (top)
- 2x 2020 x ID Length (bottom)
- 2x 2020 x ID Width (top)
- 2x 2020 x ID Width (bottom)
- 8x 2020 x ID Height (total height - top and bottom extrusion height)

### Hardware

#### BOM for a standard 20 series enclosure < 1500mm

| Item | Description | SKU | Qty |
|------|-------------|-----|-----|
| 1 | In-Out Corner Bracket – 20mm | BRAC-IOCNR-20-(C) | 4 |
| 2 | In-Out Corner Bracket – 40mm | BRAC-IOCNR-40-(C) | 4 |
| 3 | In-Out Corner Bracket – 60mm | BRAC-IOCNR-60-(C) | 4 |
| 4 | 90 degree Angle Corner Connector (V-Slot) | BRAC-90ANG | 4 |
| 5 | Sliding T-Nut | HARD-TNUT-SLIDING-M5 | 56 |
| 6 | M5 Cap Head Bolts – 8MM | BOLT-M5-CAP-008-1PC | 56 |
| 7 | 2020 Linear Rail – [L] | LR-2020-(C)-(L) | 4 |
| 8 | 2020 Linear Rail – [W] | LR-2020-(C)-(W) | 4 |
| 9 | 2020 Linear Rail – [H] | LR-2020-(C)-(H) | 8 |
| 10 | M5 Button Head Bolts – 8MM | SCREWS-M5-BH-008-1 | 8 |

#### BOM for a standard 20 series enclosure > 1500mm

| Item | Description | SKU | Qty |
|------|-------------|-----|-----|
| 1 | In-Out Corner Bracket – 20mm | BRAC-IOCNR-20-(C) | 4 |
| 2 | In-Out Corner Bracket – 40mm | BRAC-IOCNR-40-(C) | 4 |
| 3 | In-Out Corner Bracket – 60mm | BRAC-IOCNR-60-(C) | 4 |
| 4 | 90 degree Angle Corner Connector (V-Slot) | BRAC-90ANG | 4 |
| 5 | Sliding T-Nut | HARD-TNUT-SLIDING-M5 | 64 |
| 6 | M5 Cap Head Bolts – 8MM | BOLT-M5-CAP-008-1PC | 64 |
| 7 | 2020 Linear Rail – [L] | LR-2020-(C)-(L) | 2 |
| 8 | 2020 Linear Rail – [W] | LR-2020-(C)-(W) | 2 |
| 9 | 2020 Linear Rail – [H] | LR-2020-(C)-[H] | 8 |
| 10 | M5 Button Head Bolts – 8MM | SCREWS-M5-BH-008-1 | 8 |
| 11 | 2040 Linear Rail – [L] | LR-2040-(C)-(L) | 2 |
| 12 | 2040 Linear Rail – [W] | LR-2040-(C)-(W) | 2 |

#### Changes for enclosures > 1500mm

| Item | Description | SKU | Change |
|------|-------------|-----|--------|
| 5 | Sliding T-Nut | HARD-TNUT-SLIDING-M5 | add 8 |
| 6 | M5 Cap Head Bolts – 8MM | BOLT-M5-CAP-008-1PC | add 8 |
| 7 | 2020 Linear Rail – [L] | LR-2020-[L] | reduce by 2 |
| 8 | 2020 Linear Rail – [W] | LR-2020-[W] | reduce by 2 |
| 11 | 2040 Linear Rail – [L] | LR-2040-[L] | new - add 2 |
| 12 | 2040 Linear Rail – [W] | LR-2040-[W] | new - add 2 |

## 4. Sheets

Sheets refer to the materials that can be inserted into the panels on the enclosures if needed instead of doors.
Each side can have a different type of door or no door with just an empty hole or a panel.

Here are the available materials for sheets:

- Clear Corflute Sheets - 6mm (SKU: MAT-CFLU-6-C-240X120)
- Black Corflute Sheets - 6mm (SKU: MAT-CFLU-6-B-240X120)
- Heavy Duty Polypropylene Bubble Board - 6mm - Black (SKU: MAT-BUBL-6-G-240X120)

They are all 6mm thick and come in 2400x1200mm sheets that can be cut to size.
The 6mm thickness makes them fit nicely directly into the 6mm slot of the 20 series extrusion.

### Clearance Requirements

Panels sit inside the slot of the extrusion, so we need to increase the dimensions by the relevant slot depth.
The total size will be the OD of the frame or enclosure panel minus the height of the top and bottom extrusions and the width of the side extrusions then add the slot depth so the panels sit inside the slots nicely.

Panels sit inside, so the total size will be the OD of the frame or panel minus the height of the top and bottom extrusions and the width of the side extrusions.

For the 20 series V-slot, the depth is 6mm so for an enclosure panel of 1000x100mm made from 20x20mm extrusion, the sheet size is:
(panelWidth - extrusionWidth + slotDepth) × (panelHeight - extrusionHeight + slotDepth)
(1000 - 20 + 6) × (1000 - 20 + 6) = 986×986mm
For standard 20 series tables, the formula can be shortened to L - 14 x W - 14

## 5. Doors

There are a few different types of doors. Each side can have a different type of door or no door with just an empty hole or a panel.

### Standard

The standard doors are 2 doors, one attached to each side of the enclosure panel using hinges. These doors open outwards from the middle of the enclosure panel and they need a small 2mm gap either side of the door for clearance.
So the total size for this style of door would be the length of the extrusion for the relevant enclosure panel.

### Bi-Fold

The bi-fold doors are similar to the standard doors with 2 doors that open outwards but each door is split into 2 panels that have a hinge on the inside of the join so the separate doors will also fold in half out of the way.
They would need the same gaps outside the doors.
Looking at the dimensions for the hinges, it looks like the holes are exactly 20mm spaced across the hinge so no tolerance should be needed in between the separate pieces.

### Awning

The awning doors are one big door that lifts up from the bottom with the hinges on the top of the panels.
The OD of the door should be 4mm less than the length and width than the ID of the panel.

### Door Frame Sizes

| Door Size | Width | Height |
|-----------|-------|--------|
| STND-L60W60H75 | 526 mm | 712 mm |
| STND-L75W75H75 | 676 mm | 712 mm |
| STND-L100W100H75 | 446 mm | 712 mm |
| STND-L150W150H75 | 696 mm | 712 mm |

### Door Sheet Calculations

**Standard Door sheet Formulas:**

- Single Door Width = Frame Width - 74mm
- Double Door Width = (Frame Width - 154mm) ÷ 2
- Door Height = Frame Height - 38mm

### Door Type Specifications

**Standard [STND]:**

- Single door for ≤750mm width
- Double doors for >750mm width
- 3mm gap allowance per side

**Awning [AWNG]:**

- Single panel
- 4mm height clearance
- Additional support for larger sizes

**Bi-Fold [BFLD]:**

- Double panel per side
- Complex hinge calculations
- Additional clearance requirements
