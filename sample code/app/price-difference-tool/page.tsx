"use client";

import LayoutContainer from "@/components/LayoutContainer";
import React, { useState } from "react";

export default function PriceDifferenceTool() {
  const [price, setPrice] = useState("");
  const [percentage, setPercentage] = useState("");
  const [modifiedPrice, setModifiedPrice] = useState<number | null>(null);

  // Update calculation on input change
  React.useEffect(() => {
    if (price && percentage) {
      const calculatedPrice = parseFloat(price) * parseFloat(percentage);
      setModifiedPrice(calculatedPrice);
    }
  }, [price, percentage]);

  return (
    <LayoutContainer>
      <h1>Price Difference Tool</h1>
      <form>
        <label>
          Original Price:
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <br />
        <label>
          Percentage Modifier (as decimal):
          <input
            type="number"
            step="0.01"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
          />
        </label>
        <br />
      </form>
      {modifiedPrice !== null && (
        <p>Modified Price: ${modifiedPrice.toFixed(2)}</p>
      )}

      <h2>Common Percentage Modifiers</h2>
      <table>
        <thead>
          <tr>
            <th>Percentage</th>
            <th>Decimal Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>80%</td>
            <td>0.8</td>
          </tr>
          <tr>
            <td>90%</td>
            <td>0.9</td>
          </tr>
          <tr>
            <td>100%</td>
            <td>1.0</td>
          </tr>
          <tr>
            <td>110%</td>
            <td>1.1</td>
          </tr>
          <tr>
            <td>120%</td>
            <td>1.2</td>
          </tr>
          {/* Add more rows as needed */}
        </tbody>
      </table>
    </LayoutContainer>
  );
}
