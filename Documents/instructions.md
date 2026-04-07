<!-- This is the instruction manual for the development team to use the code. In case the developer changes, development gap or any other situation, we can start working with the help of this document anytime. -->

# Developer Instruction Manual

This manual provides guidance for setting up, developing, and maintaining the `sachiv-mitra-sale-client` project.

## 🛠️ Project Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (recommended version 18 or higher)
- [npm](https://www.npmjs.com/) (installed with Node.js)

### Installation
1. Navigate to the project directory:
   ```bash
   cd sachiv-mitra-sale-client
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### Development Server
To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### Production Build
To create an optimized production build:
```bash
npm run build
```

---

## 📂 Project Structure

- **`src/pages`**: Contains the React components for each page of the application.
- **`src/services`**: Contains axios-based service files for API communication.
- **`src/shared`**: Houses reusable UI components (e.g., buttons, inputs, layouts).
- **`src/utils`**: Includes utility functions and helper methods.
- **`src/styles`**: Contains global and component-specific CSS files.
- **`public`**: Static assets like images and logos.

---

## 🔧 Development Guidelines

### Adding a New Page
1. Create a new `.jsx` file in `src/pages`.
2. Define the page component and export it.
3. Register the new route in `src/App.jsx` using `React Router`.

### API Integration
1. Add a new service file (or update an existing one) in `src/services`.
2. Use the `import.meta.env.VITE_APIURL` to access the base API URL.
3. Define functions using `axios` for `GET`, `POST`, `PUT`, and `DELETE` requests.

### Styling Conventions
- **Tailwind CSS**: Use utility classes directly in the `className` attribute for most styling needs.
- **Bootstrap**: Use Bootstrap components and classes for complex UI elements like modals and grid layouts.
- **Global Styles**: Modify `src/index.css` for app-wide styling changes.

### Environment Variables
- Ensure the `.env` file contains the correct `VITE_APIURL` for the backend service.
