/**
 * ItemEditModal
 * Updated: 05/13/2025
 * Author: Deej Potter
 * Description: Modal component for editing existing shipping items.
 * Provides form validation and error handling for item updates.
 */

import React, { useState } from "react";
import ShippingItem from "@/types/box-shipping-calculator/ShippingItem";

interface ItemEditModalProps {
	item: ShippingItem;
	isOpen: boolean;
	onClose: () => void;
	onSave: (item: ShippingItem) => Promise<void>;
}

const ItemEditModal: React.FC<ItemEditModalProps> = ({
	item,
	isOpen,
	onClose,
	onSave,
}) => {
	const [editedItem, setEditedItem] = useState<ShippingItem>(item);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Handle form submission
	 * Validates input and calls onSave callback
	 * Adds debug logging to trace weight changes
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSaving(true);

		// Debug: Log the weight before saving
		console.debug("[ItemEditModal] Saving item:", {
			_id: editedItem._id,
			name: editedItem.name,
			weight: editedItem.weight,
		});
		if (!editedItem.weight || editedItem.weight === 0) {
			console.warn(
				`[ItemEditModal] WARNING: Attempting to save item with zero or missing weight!`,
				editedItem
			);
		}

		try {
			await onSave(editedItem);
		} catch (error) {
			setError("Failed to save changes. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	/**
	 * Handle input changes
	 * Updates the editedItem state with new values
	 */
	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setEditedItem((prev) => ({
			...prev,
			[name]:
				name === "weight" ||
				name === "length" ||
				name === "width" ||
				name === "height"
					? Number(value)
					: value,
		}));
	};

	if (!isOpen) return null;

	return (
		<div
			className="modal d-block"
			style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
		>
			<div className="modal-dialog">
				<div className="modal-content">
					<div className="modal-header">
						<h5 className="modal-title">Edit Item</h5>
						<button
							type="button"
							className="btn-close"
							onClick={onClose}
							disabled={isSaving}
						/>
					</div>
					<form onSubmit={handleSubmit}>
						<div className="modal-body">
							{error && (
								<div className="alert alert-danger" role="alert">
									{error}
								</div>
							)}

							{/* Name Input */}
							<div className="mb-3">
								<label htmlFor="name" className="form-label">
									Name
								</label>
								<input
									type="text"
									className="form-control"
									id="name"
									name="name"
									value={editedItem.name}
									onChange={handleChange}
									required
								/>
							</div>

							{/* SKU Input */}
							<div className="mb-3">
								<label htmlFor="sku" className="form-label">
									SKU
								</label>
								<input
									type="text"
									className="form-control"
									id="sku"
									name="sku"
									value={editedItem.sku || ""}
									onChange={handleChange}
								/>
							</div>

							{/* Dimensions Inputs */}
							<div className="row">
								<div className="col-md-4">
									<div className="mb-3">
										<label htmlFor="length" className="form-label">
											Length (mm)
										</label>
										<input
											type="number"
											className="form-control"
											id="length"
											name="length"
											value={editedItem.length}
											onChange={handleChange}
											required
											min="1"
										/>
									</div>
								</div>
								<div className="col-md-4">
									<div className="mb-3">
										<label htmlFor="width" className="form-label">
											Width (mm)
										</label>
										<input
											type="number"
											className="form-control"
											id="width"
											name="width"
											value={editedItem.width}
											onChange={handleChange}
											required
											min="1"
										/>
									</div>
								</div>
								<div className="col-md-4">
									<div className="mb-3">
										<label htmlFor="height" className="form-label">
											Height (mm)
										</label>
										<input
											type="number"
											className="form-control"
											id="height"
											name="height"
											value={editedItem.height}
											onChange={handleChange}
											required
											min="1"
										/>
									</div>
								</div>
							</div>

							{/* Weight Input */}
							<div className="mb-3">
								<label htmlFor="weight" className="form-label">
									Weight (g)
								</label>
								<input
									type="number"
									className="form-control"
									id="weight"
									name="weight"
									value={editedItem.weight}
									onChange={handleChange}
									required
									min="1"
								/>
							</div>
						</div>
						<div className="modal-footer">
							<button
								type="button"
								className="btn btn-secondary"
								onClick={onClose}
								disabled={isSaving}
							>
								Cancel
							</button>
							<button
								type="submit"
								className="btn btn-primary"
								disabled={isSaving}
							>
								{isSaving ? (
									<>
										<span className="spinner-border spinner-border-sm me-2" />
										Saving...
									</>
								) : (
									"Save Changes"
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ItemEditModal;
