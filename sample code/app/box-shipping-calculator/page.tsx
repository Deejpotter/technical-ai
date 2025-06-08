/**
 * Box Shipping Calculator Page
 * Updated: 07/05/25
 * Author: Deej Potter
 * Description: Main UI for the box shipping calculator. Orchestrates invoice import, item management, and box calculation.
 *
 * Reasoning: Invoice import is chunked into fast, sequential server actions to avoid timeouts and make each step debuggable and retryable. UI state and progress are updated at each step for a responsive user experience.
 */

"use client";

import React, { useState, useEffect } from "react";
import ShippingItem from "@/types/box-shipping-calculator/ShippingItem";
import ItemAddForm from "./ItemAddForm";
import ItemSelectAndCalculate from "./ItemSelectAndCalculate";
import BoxResultsDisplay from "./BoxResultsDisplay";
import LayoutContainer from "@/components/LayoutContainer";
import {
	packItemsIntoMultipleBoxes,
	MultiBoxPackingResult,
} from "@/app/box-shipping-calculator/BoxCalculations";
import {
	getAvailableItems,
	addItemToDatabase,
	syncWithRemoteDatabase,
} from "@/app/actions/data-actions";
import {
	extractInvoiceItems,
	getItemDimensionsServer,
} from "@/app/actions/processInvoice";
import PdfImport from "@/components/PdfImport";

/**
 * Box Shipping Calculator Page Component
 */
const BoxShippingCalculatorPage: React.FC = () => {
	// State Management
	// ---------------
	const [items, setItems] = useState<ShippingItem[]>([]);
	const [selectedItems, setSelectedItems] = useState<ShippingItem[]>([]);
	const [packingResult, setPackingResult] =
		useState<MultiBoxPackingResult | null>(null);
	const [importError, setImportError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);
	const [importStep, setImportStep] = useState<
		null | "extract" | "items" | "dimensions"
	>(null);
	const [importProgress, setImportProgress] = useState<string | null>(null);

	/**
	 * Effect hook to load initial items and initialize sample data if needed
	 */
	useEffect(() => {
		// Load items from the database when the component mounts
		loadItems();
		// });
	}, []);

	/**
	 * Handles loading/reloading items from the database
	 * Used when items are updated, deleted, or added
	 * Shows loading state during fetch and handles errors
	 *
	 * Debug: Log the items loaded from the database to verify weights and data integrity.
	 */
	const loadItems = async () => {
		setIsLoading(true);
		try {
			const response = await getAvailableItems();
			if (response.success && response.data) {
				// Debug: Log all item weights loaded from DB
				console.debug(
					"[loadItems] Items loaded from DB:",
					response.data.map((item) => ({
						sku: item.sku,
						name: item.name,
						weight: item.weight,
					}))
				);
				// Warn if any item has zero or missing weight
				response.data.forEach((item) => {
					if (!item.weight || item.weight === 0) {
						console.warn(
							`[loadItems] WARNING: Item with SKU ${item.sku} has zero or missing weight!`,
							item
						);
					}
				});
				setItems(response.data);
				// Debug: Confirm items state after set
				setTimeout(() => {
					console.debug(
						"[loadItems] Items state after set:",
						response.data.map((item) => ({
							sku: item.sku,
							weight: item.weight,
						}))
					);
				}, 0);
			} else {
				setImportError(response.error || "Failed to load items");
				setItems([]); // Clear items on error
			}
		} catch (error) {
			console.error("Failed to load items:", error);
			setImportError("Error loading items from database.");
			setItems([]); // Clear items on error
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Handler for adding new items to the available items list
	 * @param item New item to be added to the database
	 */
	const handleAddItem = async (item: Omit<ShippingItem, "_id">) => {
		try {
			const response = await addItemToDatabase(item);
			if (response.success && response.data) {
				setItems((prevItems) => [...prevItems, response.data]);
				setImportError(null);
			} else {
				setImportError(response.error || "Failed to add item");
			}
		} catch (error) {
			console.error("Failed to add item:", error);
			setImportError("Failed to add new item");
		}
	};

	/**
	 * Handler for importing items from a Maker Store invoice
	 * @param newItems Array of ShippingItem objects from processInvoice, already checked against/added to DB
	 */
	const handleInvoiceItems = async (newItems: ShippingItem[]) => {
		// The `newItems` are already processed by `processInvoice` and `getItemDimensions`.
		// This means they are either existing items from the DB (with updated quantities from the invoice)
		// or new items that have been estimated and added to the DB.
		try {
			// First, refresh the displayed list of available items from the database.
			await loadItems();

			// Now, add/update these invoice items in the selectedItems state.
			setSelectedItems((prevSelectedItems) => {
				const updatedSelectedItems = [...prevSelectedItems]; // Create a mutable copy

				newItems.forEach((invoiceItem) => {
					// Ensure invoiceItem._id is valid, as it's crucial for matching.
					if (!invoiceItem._id) {
						console.warn(
							"Invoice item missing _id, cannot add to selection:",
							invoiceItem
						);
						return; // Skip this item if it doesn't have an _id
					}
					const existingItemIndex = updatedSelectedItems.findIndex(
						(selItem) => selItem._id === invoiceItem._id
					);

					if (existingItemIndex > -1) {
						// Item already exists in selectedItems, so update its quantity
						const currentItem = updatedSelectedItems[existingItemIndex];
						updatedSelectedItems[existingItemIndex] = {
							...currentItem,
							// Ensure quantities are numbers before adding
							quantity:
								(Number(currentItem.quantity) || 0) +
								(Number(invoiceItem.quantity) || 0),
						};
					} else {
						// Item is not in selectedItems, add it.
						// The invoiceItem should already have the correct quantity from the invoice.
						updatedSelectedItems.push({
							...invoiceItem,
							quantity: Number(invoiceItem.quantity) || 1,
						});
					}
				});

				return updatedSelectedItems;
			});

			if (newItems.length > 0) {
				setImportError(null); // Clear any previous import errors
				// Optionally, provide a success message to the user here.
			} else {
				setImportError(
					"No items were processed from the invoice. The invoice might be empty or items lacked SKUs."
				);
			}
		} catch (error) {
			console.error(
				"An error occurred while refreshing items and updating selection after invoice processing:",
				error
			);
			setImportError(
				error instanceof Error
					? error.message
					: "Failed to update item list and selection after invoice processing."
			);
		}
	};

	/**
	 * Handler for calculating the optimal box size
	 * @param itemsToCalculate Array of items to calculate box size for
	 */
	const handleCalculateBox = (itemsToCalculate: ShippingItem[]) => {
		const result = packItemsIntoMultipleBoxes(itemsToCalculate);
		setPackingResult(result);
	};

	/**
	 * Handler for manually triggering a sync with the remote database
	 */
	const handleSync = async () => {
		try {
			setIsSyncing(true);
			const response = await syncWithRemoteDatabase();
			if (response.success) {
				await loadItems(); // Reload items after successful sync
				setImportError(null);
			} else {
				setImportError(response.message || "Sync failed");
			}
		} catch (error) {
			console.error("Failed to sync with remote database:", error);
			setImportError("Failed to sync with remote database");
		} finally {
			setIsSyncing(false);
		}
	};

	/**
	 * Handler for when text is extracted from a PDF or text file via PdfImport.
	 * Implements the chunked server action workflow for serverless robustness:
	 * 1. Calls extractInvoiceItems to extract items from the text (fast, <10s)
	 * 2. Calls getItemDimensionsServer to get ShippingItem objects (fast, <10s)
	 * 3. Updates UI and state at each step, with error handling and progress feedback
	 *
	 * Rationale: This approach avoids serverless/API timeouts and makes each step debuggable and retryable.
	 *
	 * @param text The extracted text content from the file
	 */
	const handleTextExtracted = async (text: string) => {
		setImportStep("extract");
		setImportProgress("Extracting items from invoice text...");
		setImportError(null);
		try {
			// Step 1: Extract items from text
			const extractedItems = await extractInvoiceItems(text);
			if (!Array.isArray(extractedItems) || extractedItems.length === 0) {
				setImportError("No items found in invoice.");
				setImportStep(null);
				setImportProgress(null);
				return;
			}
			setImportStep("items");
			setImportProgress("Looking up or estimating item dimensions...");

			// Step 2: Get full ShippingItem objects (with dimensions)
			const shippingItems = await getItemDimensionsServer(extractedItems);
			if (!Array.isArray(shippingItems) || shippingItems.length === 0) {
				setImportError("No items with dimensions found in invoice.");
				setImportStep(null);
				setImportProgress(null);
				return;
			}
			setImportStep("dimensions");
			setImportProgress("Import complete!");
			// Pass to handler to update state/UI
			handleInvoiceItems(shippingItems);
			setTimeout(() => {
				setImportStep(null);
				setImportProgress(null);
			}, 1000);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to process invoice";
			console.error("Invoice processing error:", error);
			setImportError(errorMessage);
			setImportStep(null);
			setImportProgress(null);
		}
	};

	// Render loading state while fetching initial data
	if (isLoading) {
		return (
			<LayoutContainer>
				<div className="container pb-5">
					<h1 className="mb-4">Box Shipping Calculator</h1>
					<div className="text-center">
						<div className="spinner-border" role="status">
							<span className="visually-hidden">Loading...</span>
						</div>
					</div>
				</div>
			</LayoutContainer>
		);
	}

	return (
		<LayoutContainer>
			<div className="container pb-5">
				<div className="d-flex justify-content-between align-items-center mb-4">
					<h1>Box Shipping Calculator</h1>
					<button
						className="btn btn-outline-primary"
						onClick={handleSync}
						disabled={isSyncing}
					>
						{isSyncing ? (
							<>
								<span
									className="spinner-border spinner-border-sm me-2"
									role="status"
									aria-hidden="true"
								></span>
								Syncing...
							</>
						) : (
							"Sync Data"
						)}
					</button>
				</div>

				<div className="row">
					{/* Invoice Import Section */}
					<div className="col-12 mb-4">
						<div className="card h-100 shadow bg-light">
							<div className="card-body">
								<h2 className="card-title mb-3">Import from Invoice</h2>
								<PdfImport
									onTextExtracted={handleTextExtracted}
									onError={setImportError}
									label="Import Maker Store Invoice (PDF or Text)"
									accept=".pdf,.txt,.text"
								/>
								{importProgress && (
									<p className="mt-3 text-info">{importProgress}</p>
								)}
								{importError && (
									<p className="mt-3 text-danger">{importError}</p>
								)}
							</div>
						</div>
					</div>
					{/* Item Selection and Calculation Section */}
					<div className="col-12 mb-4">
						<div className="card h-100 shadow bg-light">
							<div className="card-body">
								<h2 className="card-title mb-3">Select Items</h2>
								<ItemSelectAndCalculate
									availableItems={items}
									selectedItems={selectedItems}
									onSelectedItemsChange={setSelectedItems}
									onCalculateBox={handleCalculateBox}
									onItemsChange={loadItems}
								/>
							</div>
						</div>
					</div>{" "}
					{/* Box Results Display */}
					{packingResult && (
						<div className="col-12 mb-4">
							<div className="card h-100 shadow bg-light">
								<div className="card-body">
									<h2 className="card-title mb-3">Calculation Results</h2>
									<BoxResultsDisplay packingResult={packingResult} />
								</div>
							</div>
						</div>
					)}
					{/* Manual Item Addition Form */}
					<div className="col-12 mb-4">
						<div className="card h-100 shadow bg-light">
							<div className="card-body">
								<h2 className="card-title mb-3">Manually Add New Item</h2>
								<ItemAddForm onAddItem={handleAddItem} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</LayoutContainer>
	);
};

export default BoxShippingCalculatorPage;
