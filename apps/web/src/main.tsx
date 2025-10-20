import "./font.css";
import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Providers from "@/components/Common/Providers";
import Routes from "./routes";

// Complete providers setup
const App = () => {
  return (
    <StrictMode>
      <Providers>
        <Routes />
      </Providers>
    </StrictMode>
  );
};

createRoot(document.getElementById("_hey_") as HTMLElement).render(<App />);
