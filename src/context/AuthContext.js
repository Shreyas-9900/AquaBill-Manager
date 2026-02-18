// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up new user
  const signup = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      let flatId = null;

      // If tenant, find and link flat using flatCode
      if (userData.role === 'tenant' && userData.flatCode) {
        const flatsRef = collection(db, 'flats');
        const q = query(flatsRef, where('flatCode', '==', userData.flatCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // Delete the created user if flat code is invalid
          await userCredential.user.delete();
          throw new Error('Invalid flat code. Please check with your owner.');
        }

        const flatDoc = querySnapshot.docs[0];
        const flatData = flatDoc.data();

        // Check if flat is already occupied
        if (flatData.tenantId) {
          await userCredential.user.delete();
          throw new Error('This flat is already occupied.');
        }

        flatId = flatDoc.id;

        // Update flat with tenant ID
        await updateDoc(doc(db, 'flats', flatId), {
          tenantId: userCredential.user.uid
        });
      }

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        flatId: flatId,
        uid: userCredential.user.uid,
        email,
        createdAt: new Date().toISOString()
      });

      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Login user
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Google Sign-In
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // Create new user profile (role will be set by the component)
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName,
        email: result.user.email,
        phone: result.user.phoneNumber || '',
        role: 'owner', // Default to owner, can be changed
        flatId: null,
        uid: result.user.uid,
        createdAt: new Date().toISOString()
      });
    }
    
    return result;
  };

  // Logout user
  const logout = () => {
    return signOut(auth);
  };

  // Fetch user profile
  const fetchUserProfile = async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      setUserProfile(userDoc.data());
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    googleSignIn,
    logout,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
