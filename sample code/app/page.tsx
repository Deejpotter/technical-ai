/**
 * Home Page Component
 * Updated: 31/05/25
 * Author: Daniel Potter
 * Description: This component serves as the home page of the CNC application.
 * Use the TileSection component to display various tools and calculators by adding the relevant data to the tilesData array at the top of the file.
 */

import React from "react";
import LayoutContainer from "@/components/LayoutContainer";
import TileSection from "@/components/tiles/TileSection";
import { TileProps } from "@/components/tiles/Tile";

export default function Home() {
	// Defining tile data using the TileProps interface for TypeScript type checking
	const tilesData: TileProps[] = [
		{
			title: "Box Shipping Calculator",
			description:
				"Calculate the optimal shipping configuration for your boxes.",
			link: "/box-shipping-calculator",
			linkText: "Go to Calculator",
			bgColorClass: "bg-light",
			textColorClass: "text-dark",
		},
		{
			title: "CNC Calibration Tool",
			description: "Calibrate your CNC machine for precise manufacturing.",
			link: "/cnc-calibration-tool",
			linkText: "Calibrate CNC",
			bgColorClass: "bg-light",
			textColorClass: "text-dark",
		},
		{
			title: "Table and Enclosure Calculator",
			description: "Calculate the size of an enclosure and/or a machine table.",
			link: "/table-enclosure-calculator",
			linkText: "Table and Enclosure Calculator",
			bgColorClass: "bg-light",
			textColorClass: "text-dark",
		},
		{
			title: "40 Series Extrusion",
			description: "Calculate 40 Series Extrusion cuts.",
			link: "/40-series-extrusions",
			linkText: "40 Series Extrusion",
			bgColorClass: "bg-light",
			textColorClass: "text-dark",
		},
		{
			title: "20 Series Extrusion",
			description: "Calculate 20 Series Extrusion cuts.",
			link: "/20-series-extrusions",
			linkText: "20 Series Extrusion",
			bgColorClass: "bg-light",
			textColorClass: "text-dark",
		},
		{
			title: "CNC Technical AI",
			description: "An AI chatbot that can answer technical questions.",
			link: "/cnc-technical-ai",
			linkText: "CNC Technical AI",
			bgColorClass: "bg-light",
			textColorClass: "text-dark",
		},
		// More tiles can be added here
	];

	return (
		<>
			{/* Hero Section: Full-width section to welcome users */}
			<section className="hero-section text-center bg-dark text-white py-5 ">
				<h1>Welcome to CNC</h1>
				<p>
					Explore our tools and calculators designed to assist you with your
					maker projects.
				</p>
			</section>

			{/* Features Section: Utilizing the LayoutContainer for consistent styling */}
			<LayoutContainer>
				{/* TileSection: Displays a collection of tiles based on the tilesData array */}
				<TileSection title="Our Tools" tiles={tilesData} />
			</LayoutContainer>
		</>
	);
}
