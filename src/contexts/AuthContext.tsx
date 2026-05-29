import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
    id: number;
    uuid: string;
    nome: string;
    email: string;
    tipousuario: string[];
    fk_colegio: number | null;
    isAdmin: boolean;
    criado_secretaria?: boolean;
    senha_alterada?: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Use refs to avoid stale closures in auth listeners
    const userRef = React.useRef<User | null>(null);
    const profileRef = React.useRef<UserProfile | null>(null);

    // Sync refs with state
    React.useEffect(() => {
        userRef.current = user;
    }, [user]);

    React.useEffect(() => {
        profileRef.current = profile;
    }, [profile]);

    const fetchProfile = async (userId: string) => {
        try {
            console.log('Fetching profile for:', userId);

            // Create a promise that rejects after 5 seconds
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            );

            // Create the supabase fetch promise
            const profilePromise = (async () => {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('uuid', userId)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    return null;
                }
                return data as UserProfile;
            })();

            // Race them
            const data = await Promise.race([profilePromise, timeoutPromise]);

            if (data) {
                console.log('Profile fetched successfully:', data.nome);
                localStorage.setItem('elti_user_profile', JSON.stringify(data));
                return data;
            }
            return null;
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            return null;
        }
    };

    const refreshProfile = async () => {
        if (user) {
            const p = await fetchProfile(user.id);
            setProfile(p);
        }
    };

    useEffect(() => {
        console.log('AuthContext: Initializing...');

        let isMounted = true;
        let authListener: any = null;

        const initializeAuth = async () => {
            try {
                // Initial session check
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                if (session?.user) {
                    console.log('AuthContext: Session found:', session.user.email);
                    setUser(session.user);

                    try {
                        const p = await fetchProfile(session.user.id);
                        if (isMounted) {
                            setProfile(p);
                        }
                    } catch (err) {
                        console.warn('AuthContext: Profile fetch failed during initialization:', err);
                        if (isMounted) setProfile(null);
                    }
                } else {
                    console.log('AuthContext: No session, showing login');
                    setUser(null);
                    setProfile(null);
                }
            } catch (err) {
                console.error('AuthContext: Initialization error:', err);
            } finally {
                if (isMounted) {
                    // Try to load cached profile as a fallback
                    if (!profileRef.current) {
                        const cached = localStorage.getItem('elti_user_profile');
                        if (cached) {
                            try {
                                setProfile(JSON.parse(cached));
                            } catch (e) {
                                localStorage.removeItem('elti_user_profile');
                            }
                        }
                    }
                    setLoading(false);
                }
            }
        };

        // Listen for auth changes
        const setupListener = () => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (!isMounted) return;

                console.log('AuthContext: Auth change event:', event, session?.user?.email);

                if (event === 'INITIAL_SESSION') return;

                if (event === 'SIGNED_OUT' || !session) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    localStorage.removeItem('elti_user_profile');
                    return;
                }

                if (session?.user) {
                    const currentUser = userRef.current;
                    const currentProfile = profileRef.current;
                    const isNewUser = !currentUser || currentUser.id !== session.user.id;

                    setUser(session.user);

                    // Check if we really need to show the loading screen
                    const shouldShowLoading = isNewUser || (!currentProfile && !localStorage.getItem('elti_user_profile'));

                    if (shouldShowLoading) {
                        setLoading(true);
                        try {
                            const p = await fetchProfile(session.user.id);
                            if (isMounted) setProfile(p);
                        } catch (err) {
                            console.warn('AuthContext: Profile fetch failed during auth change:', err);
                        } finally {
                            if (isMounted) setLoading(false);
                        }
                    } else {
                        // Background update if user already exists
                        fetchProfile(session.user.id).then(p => {
                            if (isMounted && p) setProfile(p);
                        }).catch(err => {
                            console.warn('AuthContext: Background profile refresh failed:', err);
                        });
                        // Guarantee loading is false
                        setLoading(false);
                    }
                }
            });
            authListener = subscription;
        };

        initializeAuth();
        setupListener();

        return () => {
            isMounted = false;
            if (authListener) authListener.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            // Clear local state immediately for instant UI feedback
            setUser(null);
            setProfile(null);
            localStorage.removeItem('elti_user_profile');
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error in signOut:', error);
            // Ensure states are cleared even if signOut fails
            setUser(null);
            setProfile(null);
            localStorage.removeItem('elti_user_profile');
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
