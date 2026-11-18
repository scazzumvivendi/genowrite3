import { createContext, useContext } from 'react';

export const InstallContext = createContext<(() => Promise<void>) | undefined>(
  undefined,
);
export const useInstall = () => useContext(InstallContext);
