"use client";
// Import necessary modules from React and custom CSS
import React, {
	useState,
	Dispatch,
	SetStateAction,
	useEffect,
	useRef,
} from "react";
import {
	MainContainer,
	ChatContainer,
	MessageList,
	Message,
	MessageInput,
	Sidebar,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import "@/styles/ChatInterface.scss";
import FileUpload from "./FileUpload";

/**
 * Handles the chat interface for the chatbot.
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({
	setShowConversations,
	showConversations,
}) => {
	// Get API URL from environment variable. If not set, use an empty string which will try to access the same domain.
	const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
	// State to hold all chat messages
	const [messages, setMessages] = useState<
		Array<{ type: "user" | "bot"; content: string }>
	>([]);
	// Reference for auto-scrolling
	const messagesEndRef = useRef(null);
	// Auto-scroll when a new message is added
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Function to handle form submission
  const handleFormSubmit = async (
		innerHtml: string,
		textContent: string,
		innerText: string,
		nodes: NodeList
	) => {
		if (!textContent.trim()) return; // Don't send empty messages
		setMessages((prev) => [
			...prev,
			{ type: "user", content: `You: ${textContent}` },
		]);

		// Try the request to the bot API using the user's message.
		try {
			const response = await fetch(`${apiUrl}/ask`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ user_message: textContent }),
			});

			// If the request is successful, add the bot's response to the chat.
			if (response.ok) {
				const data = await response.json();
				setMessages((prev) => [
					...prev,
					{ type: "bot", content: `Bot: ${data.bot_response}` },
				]);
			}
		} catch (error) {
			console.error("Failed to fetch bot response", error);
		}
	};

	// Function to handle reinitialization
	const handleReinitializeClick = async () => {
		try {
			const response = await fetch(`${apiUrl}/reinitialize`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});

			if (response.ok) {
				alert("QA Collection reinitialized successfully.");
			} else {
				alert("Failed to reinitialize QA Collection.");
			}
		} catch (error) {
			console.error("Error reinitializing QA Collection", error);
		}
	};

	// T
	return (
		<MainContainer style={{ height: "90vh" }}>
			<Sidebar position="left">
				<FileUpload uploadEndpoint={apiUrl + "/upload"} />
			</Sidebar>
			<ChatContainer>
				<MessageList>
					{messages.map((msg, index) => {
						if (msg.type === "user") {
							// For user messages
							return (
								<Message
									key={index}
									model={{
										message: msg.content,
										direction: "outgoing",
										position: "single",
									}}
								/>
							);
						} else {
							// For bot messages
							return (
								<Message
									key={index}
									model={{
										message: msg.content,
										direction: "incoming",
										position: "single",
									}}
								/>
							);
						}
					})}
				</MessageList>
				<MessageInput
					attachButton={false}
					placeholder="Type your message..."
					onSend={handleFormSubmit}
				/>
			</ChatContainer>
		</MainContainer>
	);
};

// Set default export for this component to make it easier to import into other files
export default ChatInterface;

// The chat interface component receives setShowConversations and showConversations as props
export type ChatInterfaceProps = {
	setShowConversations: Dispatch<SetStateAction<boolean>>;
	showConversations: boolean;
};