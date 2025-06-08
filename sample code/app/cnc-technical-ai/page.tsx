"use client";
import React, { useState } from "react";
import ChatInterface from "./ChatInterface";

const CncTechnicalAI = () => {
	const [showConversations, setShowConversations] = useState(false);

	return (
		<ChatInterface
			setShowConversations={setShowConversations}
			showConversations={showConversations}
		/>
	);
};

export default CncTechnicalAI;
