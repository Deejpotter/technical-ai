/**
 * Next.js Root Layout
 * Updated: 14/05/2025
 * Author: Deej Potter
 * Description: This is the root layout component for the Next.js application.
 * This component wraps the entire application and provides a consistent layout and styling.
 * It can be overridden by creating a new layout file in the relevant directory.
 */
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.scss";
import "bootstrap-icons/font/bootstrap-icons.css";

import { ItemProvider } from "../contexts/ItemContext";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

// Uses next/font to load the Nunito Sans font from Google Fonts.
const nunito = Nunito({ subsets: ["latin"] });

// The metadata object is built-in to Next.js and is used to provide metadata to the page.
export const metadata: Metadata = {
	title: "CNC Calculations",
	description: "Calculation tool for CNC stuff.",
};

// Define the navigation structure for the Navbar. This array can be moved to a config or utils file for reuse.
// Each item should have a 'name' and optional 'path' and 'items' (for dropdowns).
const navItems = [
	{ name: "Box Shipping Calculator", path: "/box-shipping-calculator" },
	{ name: "CNC AI", path: "/cnc-technical-ai" },
	{ name: "Table Enclosure Calculator", path: "/table-enclosure-calculator" },
	{
		name: "Extrusion Resources",
		items: [
			{ name: "20-Series Extrusions", path: "/20-series-extrusions" },
			{ name: "40-Series Extrusions", path: "/40-series-extrusions" },
		],
	},
	{ name: "CNC Calibration", path: "/cnc-calibration-tool" },
	{ name: "Price Difference", path: "/price-difference-tool" },
];

// The RootLayout component is the root component that is used to wrap the pages.
// It takes the children prop which is the child components that will be wrapped by the context provider.
// The ReactNode type is a type that represents any valid React child element.
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			{/* The head element is built-in to Next.js and is used to provide metadata to the page.*/}
			{/* The AuthProvider component is used to provide the authentication context to the components. */}
			<AuthProvider>
				{/* The ItemProvider component is used to provide the item context to the components. */}
				<ItemProvider>
					<body className={nunito.className}>
						{/* Render the Navbar component then render the children components. */}
						<Navbar
							brand={"CNC Tools"}
							navItems={navItems} // Pass the navigation array to the Navbar
						/>
						<main>{children}</main>
						{/* Add Footer component at the bottom of the page */}
						<Footer />
					</body>
				</ItemProvider>
			</AuthProvider>
		</html>
	);
}
