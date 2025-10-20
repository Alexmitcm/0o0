import { createContext, type ReactNode, useContext, useState } from "react";

export interface CompanyLogo {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string;
}

interface LogoContextType {
  logos: CompanyLogo[];
  setLogos: (logos: CompanyLogo[]) => void;
  addLogo: (logo: CompanyLogo) => void;
  updateLogo: (id: string, logo: CompanyLogo) => void;
  deleteLogo: (id: string) => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

interface LogoProviderProps {
  children: ReactNode;
}

export const LogoProvider = ({ children }: LogoProviderProps) => {
  const [logos, setLogos] = useState<CompanyLogo[]>([
    {
      id: "1",
      logoUrl: "/logos/company1.png",
      name: "Company 1",
      websiteUrl: "https://company1.com"
    },
    {
      id: "2",
      logoUrl: "/logos/company2.png",
      name: "Company 2",
      websiteUrl: "https://company2.com"
    },
    {
      id: "3",
      logoUrl: "/logos/company3.png",
      name: "Company 3",
      websiteUrl: "https://company3.com"
    },
    {
      id: "4",
      logoUrl: "/logos/company4.png",
      name: "Company 4",
      websiteUrl: "https://company4.com"
    },
    {
      id: "5",
      logoUrl: "/logos/company5.png",
      name: "Company 5",
      websiteUrl: "https://company5.com"
    },
    {
      id: "6",
      logoUrl: "/logos/company6.png",
      name: "Company 6",
      websiteUrl: "https://company6.com"
    },
    {
      id: "7",
      logoUrl: "/logos/company7.png",
      name: "Company 7",
      websiteUrl: "https://company7.com"
    },
    {
      id: "8",
      logoUrl: "/logos/company8.png",
      name: "Company 8",
      websiteUrl: "https://company8.com"
    },
    {
      id: "9",
      logoUrl: "/logos/company9.png",
      name: "Company 9",
      websiteUrl: "https://company9.com"
    },
    {
      id: "10",
      logoUrl: "/logos/company10.png",
      name: "Company 10",
      websiteUrl: "https://company10.com"
    },
    {
      id: "11",
      logoUrl: "/logos/company11.png",
      name: "Company 11",
      websiteUrl: "https://company11.com"
    },
    {
      id: "12",
      logoUrl: "/logos/company12.png",
      name: "Company 12",
      websiteUrl: "https://company12.com"
    }
  ]);

  const addLogo = (logo: CompanyLogo) => {
    setLogos((prev) => [...prev, logo]);
  };

  const updateLogo = (id: string, updatedLogo: CompanyLogo) => {
    setLogos((prev) =>
      prev.map((logo) => (logo.id === id ? updatedLogo : logo))
    );
  };

  const deleteLogo = (id: string) => {
    setLogos((prev) => prev.filter((logo) => logo.id !== id));
  };

  return (
    <LogoContext.Provider
      value={{
        addLogo,
        deleteLogo,
        logos,
        setLogos,
        updateLogo
      }}
    >
      {children}
    </LogoContext.Provider>
  );
};

export const useLogoContext = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error("useLogoContext must be used within a LogoProvider");
  }
  return context;
};
