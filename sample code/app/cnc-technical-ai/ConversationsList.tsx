'use client';
// Import React library and useState hook
import React, { useState } from 'react';

// Define the ConversationsList component as a functional component
const ConversationsList: React.FC = () => {
  // State to hold the selected conversation type
  const [selectedType, setSelectedType] = useState('Chat');

  // Function to handle type selection
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(event.target.value);
  };

  return (
    <div>
      {/* Dropdown for conversation type selection */}
      <div className="mb-3">
        <label htmlFor="conversation-type" className="form-label">Conversation Type:</label>
        <select id="conversation-type" className="form-select" value={selectedType} onChange={handleTypeChange}>
          <option value="Chat">Chat</option>
          <option value="Email">Email</option>
          {/* Add more types as needed */}
        </select>
      </div>
    </div>
  );
};

// Export the ConversationsList component for use in other parts of the application
export default ConversationsList;
