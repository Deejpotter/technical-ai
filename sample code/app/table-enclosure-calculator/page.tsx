"use client";
/**
 * Table and Enclosure Calculator Page
 * Updated: 17/05/2025
 * Author: Deej Potter
 *
 * This is a client component that uses dynamic imports and Suspense
 * for better performance and code splitting.
 */

import LayoutContainer from "@/components/LayoutContainer";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { MATERIAL_TYPES, MATERIAL_THICKNESS } from "./constants";

// Dynamically import client components
const TableCalculator = dynamic(() => import("./components/TableCalculator"), {
	loading: () => <div className="alert alert-info">Loading calculator...</div>,
	ssr: false,
});

export default function TableEnclosureCalculatorPage() {
	return (
		<LayoutContainer>
			<div className="table-enclosure-calculator">
				{/* Client Component Calculator */}
				<Suspense
					fallback={
						<div className="alert alert-info">Loading calculator...</div>
					}
				>
					<TableCalculator
						materialTypes={MATERIAL_TYPES}
						materialThickness={MATERIAL_THICKNESS} // Changed from materialThicknesses
					/>
				</Suspense>
			</div>
		</LayoutContainer>
	);
}
