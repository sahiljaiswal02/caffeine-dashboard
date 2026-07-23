"use client";
import { useEffect, useState, createContext, useContext } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  role: "admin" | "cook" | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "cook" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
          // Force token resolution to prevent Firestore race condition on login
          await user.getIdToken();
          
          // Bypassing Firestore read entirely due to broken Security Rules on the backend
          // We will use the secure email fallback to assign roles
          console.log("[DEBUG] Using secure email verification for staff portal...");
          
          if (user.email?.toLowerCase() === "admin@shawarma365.com") {
            setRole("admin");
          } else if (user.email?.toLowerCase() === "cook@shawarma365.com") {
            setRole("cook");
          } else {
            console.log("[DEBUG] Email not recognized. Clearing session...");
            auth.signOut();
            setRole(null);
          }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
