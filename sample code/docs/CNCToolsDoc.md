# CNC Tools Doc

## Contents

- [CNC Tools Doc](#cnc-tools-doc)
  - [Contents](#contents)
  - [1. Project Overview](#1-project-overview)
    - [1.1 Overview](#11-overview)
    - [1.2 Development Approach](#12-development-approach)
      - [1.2.1 Flask](#121-flask)
      - [1.2.2 Next.js](#122-nextjs)
  - [2. Project Scope](#2-project-scope)
    - [2.1. Initial Scope](#21-initial-scope)
      - [2.1.1 User Interface Development](#211-user-interface-development)
      - [2.1.2 Authentication System](#212-authentication-system)
        - [Key Implementation Details](#key-implementation-details)
        - [Local Development](#local-development)
      - [2.1.3 Global Style and Layout Setup](#213-global-style-and-layout-setup)
    - [2.2. Sub Projects (Mini-Apps)](#22-sub-projects-mini-apps)
      - [2.2.1 CNC Technical AI Chatbot (page.tsx)](#221-cnc-technical-ai-chatbot-pagetsx)
      - [2.2.2 Box Shipping Calculator (page.tsx)](#222-box-shipping-calculator-pagetsx)
      - [2.2.3 CNC Calibration Tool (page.tsx and Sections)](#223-cnc-calibration-tool-pagetsx-and-sections)
      - [2.2.4 20-Series Extrusions (page.tsx)](#224-20-series-extrusions-pagetsx)
      - [2.2.5 40-Series Extrusions (page.tsx)](#225-40-series-extrusions-pagetsx)
      - [2.2.6 Enclosure Calculator (page.tsx)](#226-enclosure-calculator-pagetsx)
      - [2.2.7 Price Difference Tool (page.tsx)](#227-price-difference-tool-pagetsx)
  - [3. Deliverables](#3-deliverables)
    - [3.1 Usage Documentation](#31-usage-documentation)
    - [3.2 Diagrams](#32-diagrams)
  - [4. Application Architecture](#4-application-architecture)
    - [4.1. Infrastructure and Technologies](#41-infrastructure-and-technologies)
    - [4.2. Frameworks](#42-frameworks)
    - [4.3. Documentation Standards](#43-documentation-standards)
  - [5. Dev Ops](#5-dev-ops)
    - [5.1. Hosting](#51-hosting)
    - [5.2. Security, Performance, and Scalability](#52-security-performance-and-scalability)
    - [5.3. Sandbox Implementation](#53-sandbox-implementation)
    - [5.4. Version Control System](#54-version-control-system)
  - [6. Appendices](#6-appendices)
    - [6.1. Reference Materials](#61-reference-materials)
    - [6.2. Glossary](#62-glossary)

---

## 1. Project Overview

### 1.1 Overview

I designed the CNC Tools app help calculate CNC stuff. It's primarily aimed at simplifying daily operations for sales and technical assistance teams. The app includes various mini-apps that cater to specific functionalities, such as CNC calibration, box shipping calculations, and extrusion guides.

### 1.2 Development Approach

I chose Flask and Next.js for this project due to their unique benefits that align with my specific needs:

#### 1.2.1 Flask

I selected Flask for the AI chatbot backend due to its simplicity and flexibility in handling API requests. Flask is a lightweight framework that allows for quick setup and easy integration with other technologies.

#### 1.2.2 Next.js

I chose Next.js for the main app because of its versatility and performance benefits. Next.js is a popular choice for web applications not only because it is built on top of React, but also because it is a static site generator so static code is output which is great for SEO and load speeds.

---

## 2. Project Scope

### 2.1. Initial Scope

The initial phase is focused on setting up the primary interface elements such as the home page, navbar, and footer. It also includes preparing the framework for future integration of mini-apps.

#### 2.1.1 User Interface Development

- Developing the main entry points like the home page, navigation bar (navbar), and footer.

#### 2.1.2 Authentication System

- Implementing an authentication system using Netlify Identity to manage user access and personalization across the app.
- The system includes session persistence, ensuring users remain logged in across page reloads and browser sessions.
- Utilizes Netlify Identity for seamless integration of user management and authentication processes.
- Provides a consistent user experience in both development and production environments.

##### Key Implementation Details

- **AuthContext**: A React context is used for managing global authentication state across the application.
- **AuthProvider**: A component that wraps the entire application to provide authentication state to all components.
- **useAuth**: A custom hook created for easy access to authentication functionalities like login, logout, and user state.
- **Session Persistence**: Implemented using `netlifyIdentity.currentUser()` within `AuthProvider` to check and set the user's logged-in state on app initialization.
- **Netlify Identity Configuration**: Configured to handle user authentication seamlessly, including handling different scenarios in development and production environments.

##### Local Development

- For local development, email login is used instead of OAuth providers to simplify the testing and development process.
- Noted that using OAuth providers like Google requires setting proper callback URLs and may not function as expected in local development environments.

This authentication setup ensures that user credentials and sessions are handled securely while providing a smooth user experience.

#### 2.1.3 Global Style and Layout Setup

- Utilizing a custom Bootstrap implementation for consistent styling across the app.
- Incorporating custom CSS for specific styling needs as required.
- Establishing a global style guideline using `globals.scss`.
- Setting up a common layout structure that can be utilized by all mini-apps.

### 2.2. Sub Projects (Mini-Apps)

Each mini-app within the project targets a specific functionality:

#### 2.2.1 CNC Technical AI Chatbot (page.tsx)

- An AI chatbot for assisting with CNC-related technical queries.

#### 2.2.2 Box Shipping Calculator (page.tsx)

- A tool for optimizing box shipping configurations.

#### 2.2.3 CNC Calibration Tool (page.tsx and Sections)

- A comprehensive tool for calibrating CNC machines, including specific sections like `FlowCompensationSection`, `StartupGcodeGeneratorSection`, and `StepsPerMmSection`.

#### 2.2.4 20-Series Extrusions (page.tsx)

- A dedicated calculator and guide for 20-series extrusions.

#### 2.2.5 40-Series Extrusions (page.tsx)

- A similar tool as above but for 40-series extrusions.

#### 2.2.6 Enclosure Calculator (page.tsx)

- A calculator for determining the dimensions and specifications of enclosures.

#### 2.2.7 Price Difference Tool (page.tsx)

- A tool to calculate and compare price differences in products or services.

---

## 3. Deliverables

### 3.1 Usage Documentation

- User manuals and integration guides

### 3.2 Diagrams

- System architecture and workflow diagrams

---

## 4. Application Architecture

### 4.1. Infrastructure and Technologies

- Description of the Flask and Next.js technology stack supporting the Product Listing Agent.

### 4.2. Frameworks

- Rationale behind chosen frameworks for the Product Listing Agent, ensuring compatibility with existing structures.

### 4.3. Documentation Standards

- Standards for code documentation, API documentation, and update logs.

---

## 5. Dev Ops

### 5.1. Hosting

- Hosted on Netlify.

### 5.2. Security, Performance, and Scalability

- Measures to ensure data security, optimize performance, and plan for scalability.

### 5.3. Sandbox Implementation

- Use of sandbox environments for development and testing.

### 5.4. Version Control System

- Main and dev branches on Git, with strategies for branching and merging.

---

## 6. Appendices

### 6.1. Reference Materials

- Collection of resources and articles related to product listing systems and eCommerce applications.

### 6.2. Glossary

- Definitions of technical terms and jargon in web development.
