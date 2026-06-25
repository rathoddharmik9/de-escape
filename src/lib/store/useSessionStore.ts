import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AttendeeProfile {
  fullName: string;
  phone: string;
  email: string;
  age: string;
  city: string;
  instagram: string;
}

export interface RegistrationSession {
  registrationId: string;
  fullName: string;
  status: string;
  eventTitle: string;
  groupInviteLink?: string;
}

interface SessionState {
  profile: AttendeeProfile;
  lastRegistration: RegistrationSession | null;
  setProfile: (profile: Partial<AttendeeProfile>) => void;
  setLastRegistration: (reg: RegistrationSession | null) => void;
  clearSession: () => void;
}

const initialProfile: AttendeeProfile = {
  fullName: "",
  phone: "",
  email: "",
  age: "",
  city: "",
  instagram: "",
};

const ssrStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(name);
  },
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      lastRegistration: null,
      setProfile: (profile) =>
        set((state) => ({ profile: { ...state.profile, ...profile } })),
      setLastRegistration: (reg) => set({ lastRegistration: reg }),
      clearSession: () => set({ profile: initialProfile, lastRegistration: null }),
    }),
    {
      name: "de-escape-session",
      storage: createJSONStorage(() => ssrStorage),
    }
  )
);
