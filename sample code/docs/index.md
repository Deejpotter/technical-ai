---
layout: default
title: Next.js 14 Business & Personal Site Documentation
nav_order: 1
description: "Documentation for combined business and personal website built with Next.js 14"
permalink: /
---

# Next.js 14 Business & Personal Site Documentation

Comprehensive documentation for the combined business and personal website built with Next.js 14, TypeScript, and Bootstrap.

[View on GitHub](https://github.com/deejpotter/cnc-tools){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn package manager
- Git for version control

### Quick Start

1. Clone the repository:

```bash
git clone https://github.com/deejpotter/cnc-tools.git
cd your-repo
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to see your application.

## Project Structure

```
📦 root
├── app/
│   ├── (tools)/
│   │   ├── box-shipping-calculator/
│   │   ├── cnc-calibration-tool/
│   │   ├── cnc-technical-ai/
│   │   ├── enclosure-calculator/
│   │   └── price-difference-tool/
│   ├── actions/
│   │   ├── mongodb/
│   │   └── processInvoice.ts
│   ├── globals.scss
│   └── layout.tsx
├── components/
│   ├── navbar/
│   ├── LayoutContainer.tsx
│   ├── Tile.tsx
│   └── TileSection.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── ItemContext.tsx
├── interfaces/
│   └── box-shipping-calculator/
└── styles/
    ├── ChatInterface.scss
    └── ChatMessage.scss
```

## Key Features

- **Next.js 14 App Router**: Utilizing the latest Next.js features
- **TypeScript Integration**: Full type safety across the application
- **Bootstrap Styling**: Primary styling with Bootstrap classes
- **CNC Tools**: Various calculators and utilities
- **AI Integration**: Technical AI assistant for CNC queries
- **Authentication**: Secure user authentication system

## Documentation Sections

- [Code Style Guide](./code-style-guide)
- [Component Documentation](./components)
- [Tools Documentation](./tools)
- [API Documentation](./api)
- [Deployment Guide](./deployment)

## Contributing

Please read our [Contributing Guide](./contributing) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
