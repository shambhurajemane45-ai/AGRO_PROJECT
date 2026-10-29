"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { LanguageOption, PortalRole, SupportedLanguage } from "@/types";
import {
  DEFAULT_LANGUAGE,
  getLanguageOption,
  getPortalLoginDestination,
  getStoredLanguagePreference,
  getTranslations,
  LANGUAGE_CHANGE_EVENT,
  setStoredLanguagePreference,
  type SiteTranslations,
} from "@/lib/language";
import { LanguageSelectionModal } from "@/components/shared/LanguageSelectionModal";

interface LanguageModalState {
  isOpen: boolean;
  role: PortalRole;
  destinationPath: string;
}

interface LanguagePreferenceContextValue {
  language: SupportedLanguage;
  languageOption: LanguageOption;
  t: SiteTranslations;
  setLanguage: (language: SupportedLanguage) => void;
  openLanguageModalForRole: (role: PortalRole, destinationOverride?: string) => void;
  closeLanguageModal: () => void;
}

const LanguagePreferenceContext =
  createContext<LanguagePreferenceContextValue | null>(null);

function subscribeToLanguagePreference(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onStoreChange);
  };
}

function getServerLanguageSnapshot(): SupportedLanguage {
  return DEFAULT_LANGUAGE;
}

export function LanguagePreferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const language = useSyncExternalStore(
    subscribeToLanguagePreference,
    getStoredLanguagePreference,
    getServerLanguageSnapshot
  );
  const [modalState, setModalState] = useState<LanguageModalState>({
    isOpen: false,
    role: "customer",
    destinationPath: getPortalLoginDestination("customer"),
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: SupportedLanguage) => {
    setStoredLanguagePreference(nextLanguage);
  }, []);

  const openLanguageModalForRole = useCallback(
    (role: PortalRole, destinationOverride?: string) => {
      setModalState({
        isOpen: true,
        role,
        destinationPath:
          destinationOverride ?? getPortalLoginDestination(role),
      });
    },
    []
  );

  const closeLanguageModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const handleConfirmLanguageAndContinue = useCallback(
    (selectedLanguage: SupportedLanguage) => {
      setStoredLanguagePreference(selectedLanguage);
      const targetPath = modalState.destinationPath;
      setModalState((prev) => ({
        ...prev,
        isOpen: false,
      }));
      if (targetPath) {
        router.push(targetPath);
      }
    },
    [modalState.destinationPath, router]
  );

  const contextValue = useMemo<LanguagePreferenceContextValue>(
    () => ({
      language,
      languageOption: getLanguageOption(language),
      t: getTranslations(language),
      setLanguage,
      openLanguageModalForRole,
      closeLanguageModal,
    }),
    [language, setLanguage, openLanguageModalForRole, closeLanguageModal]
  );

  return (
    <LanguagePreferenceContext.Provider value={contextValue}>
      {children}
      <LanguageSelectionModal
        isOpen={modalState.isOpen}
        role={modalState.role}
        selectedLanguage={language}
        onSelectLanguage={setLanguage}
        onConfirm={handleConfirmLanguageAndContinue}
        onClose={closeLanguageModal}
      />
    </LanguagePreferenceContext.Provider>
  );
}

export function useLanguagePreference(): LanguagePreferenceContextValue {
  const context = useContext(LanguagePreferenceContext);
  if (!context) {
    throw new Error(
      "useLanguagePreference must be used within a LanguagePreferenceProvider."
    );
  }
  return context;
}
