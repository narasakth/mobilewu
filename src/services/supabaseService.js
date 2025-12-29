/**
 * supabaseService.js - Supabase client and sync functions
 * With Email/Password and Google OAuth authentication
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Supabase configuration
const SUPABASE_URL = 'https://ebenvtgmoveznzwmkuet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZW52dGdtb3Zlem56d21rdWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDkyMjIsImV4cCI6MjA4MjIyNTIyMn0.h2MJizkv3NHBVxqrHdFO1e0ccYo7DtAXhlZeZJX_2d0';

// Redirect URI - works for both development and production
const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'acnescan',
});

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Constants
const DEVICE_ID_KEY = '@acnescan_device_id';
const STORAGE_BUCKET = 'acne-images';

/**
 * Generate a simple UUID
 */
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Get or create a unique device ID
 * @returns {Promise<string>} Device ID
 */
export const getDeviceId = async () => {
    try {
        let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

        if (!deviceId) {
            deviceId = `device-${generateUUID()}`;
            await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
    } catch (error) {
        console.error('Error getting device ID:', error);
        return `anonymous-${Date.now()}`;
    }
};

/**
 * Convert base64 to ArrayBuffer for Supabase upload
 */
const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

/**
 * Upload an image to Supabase Storage
 * @param {string} base64Image - Base64 encoded image
 * @param {string} fileName - File name for the image
 * @returns {Promise<string|null>} Public URL or null on error
 */
export const uploadImage = async (base64Image, fileName) => {
    try {
        if (!base64Image) return null;

        const deviceId = await getDeviceId();
        const filePath = `${deviceId}/${fileName}`;

        // Convert base64 to ArrayBuffer
        const imageData = base64ToArrayBuffer(base64Image);

        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, imageData, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        return urlData?.publicUrl || null;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
};

/**
 * Sync a single analysis to Supabase (with images)
 * @param {Object} analysis - Analysis data from local storage
 * @param {Object} images - Optional image objects with base64 data
 * @returns {Promise<Object|null>} Synced analysis or null on error
 */
export const syncAnalysisToCloud = async (analysis, images = {}) => {
    try {
        const deviceId = await getDeviceId();
        const timestamp = Date.now();

        // Upload images if provided
        let frontalUrl = null;
        let leftUrl = null;
        let rightUrl = null;

        if (images.frontal?.base64) {
            frontalUrl = await uploadImage(images.frontal.base64, `frontal_${timestamp}.jpg`);
        }
        if (images.left?.base64) {
            leftUrl = await uploadImage(images.left.base64, `left_${timestamp}.jpg`);
        }
        if (images.right?.base64) {
            rightUrl = await uploadImage(images.right.base64, `right_${timestamp}.jpg`);
        }

        const { data, error } = await supabase
            .from('analyses')
            .insert({
                device_id: deviceId,
                severity_level: analysis.severityLevel,
                severity_label: analysis.severityLabel,
                total_spots: analysis.totalSpots || 0,
                inflamed_count: analysis.spots?.inflamed || 0,
                clogged_count: analysis.spots?.clogged || 0,
                scars_count: analysis.spots?.scars || 0,
                local_id: analysis.id,
                // Image URLs - will be null if columns don't exist or upload failed
                ...(frontalUrl && { frontal_image_url: frontalUrl }),
                ...(leftUrl && { left_image_url: leftUrl }),
                ...(rightUrl && { right_image_url: rightUrl }),
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error syncing to Supabase:', error);
        return null;
    }
};

/**
 * Get all analyses for this device from Supabase
 * @returns {Promise<Array>} Array of analyses
 */
export const getCloudAnalyses = async () => {
    try {
        const deviceId = await getDeviceId();

        const { data, error } = await supabase
            .from('analyses')
            .select('*')
            .eq('device_id', deviceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching from Supabase:', error);
        return [];
    }
};

/**
 * Get device statistics from Supabase
 * @returns {Promise<Object|null>} Stats object or null
 */
export const getCloudStats = async () => {
    try {
        const deviceId = await getDeviceId();

        const { data, error } = await supabase
            .from('device_stats')
            .select('*')
            .eq('device_id', deviceId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
};

/**
 * Sync all local analyses to cloud (batch sync)
 * @param {Array} localAnalyses - Array of local analyses
 * @returns {Promise<number>} Number of synced items
 */
export const syncAllToCloud = async (localAnalyses) => {
    try {
        const deviceId = await getDeviceId();

        // Get existing cloud analyses
        const cloudAnalyses = await getCloudAnalyses();
        const cloudLocalIds = new Set(cloudAnalyses.map(a => a.local_id));

        // Filter out already synced
        const toSync = localAnalyses.filter(a => !cloudLocalIds.has(a.id));

        if (toSync.length === 0) return 0;

        const insertData = toSync.map(analysis => ({
            device_id: deviceId,
            severity_level: analysis.severityLevel,
            severity_label: analysis.severityLabel,
            total_spots: analysis.totalSpots || 0,
            inflamed_count: analysis.spots?.inflamed || 0,
            clogged_count: analysis.spots?.clogged || 0,
            scars_count: analysis.spots?.scars || 0,
            local_id: analysis.id,
        }));

        const { data, error } = await supabase
            .from('analyses')
            .insert(insertData);

        if (error) throw error;
        return toSync.length;
    } catch (error) {
        console.error('Error batch syncing:', error);
        return 0;
    }
};

/**
 * Check if Supabase is configured
 * @returns {boolean}
 */
export const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
        SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};

// =============================================
// Authentication Functions
// =============================================

/**
 * Sign up with email and password
 * @param {string} email 
 * @param {string} password 
 * @param {string} displayName 
 * @returns {Promise<Object>}
 */
export const signUp = async (email, password, displayName = '') => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                }
            }
        });

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error) {
        console.error('Sign up error:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<Object>}
 */
export const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Sign out current user
 * @returns {Promise<Object>}
 */
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true, error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send password reset email
 * @param {string} email 
 * @returns {Promise<Object>}
 */
export const resetPassword = async (email) => {
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return { success: true, data, error: null };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, data: null, error: error.message };
    }
};

/**
 * Get current user session
 * @returns {Promise<Object|null>}
 */
export const getCurrentUser = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user || null;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
};

/**
 * Get current session
 * @returns {Promise<Object|null>}
 */
export const getSession = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
};

/**
 * Listen to auth state changes
 * @param {Function} callback 
 * @returns {Object} Subscription object
 */
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
};

/**
 * Get user ID (from auth or device)
 * @returns {Promise<string>}
 */
export const getUserId = async () => {
    const user = await getCurrentUser();
    if (user) {
        return user.id;
    }
    return await getDeviceId();
};

/**
 * Sign in with Google OAuth
 * @returns {Promise<Object>}
 */
export const signInWithGoogle = async () => {
    try {
        // Get OAuth URL from Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUri,
                skipBrowserRedirect: true,
            }
        });

        if (error) throw error;

        // Open browser for Google sign in
        const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUri
        );

        if (result.type === 'success') {
            // Extract tokens from URL
            const url = result.url;
            const params = new URLSearchParams(url.split('#')[1]);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token) {
                // Set session with tokens
                const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                    access_token,
                    refresh_token,
                });

                if (sessionError) throw sessionError;
                return { success: true, data: sessionData, error: null };
            }
        }

        return { success: false, data: null, error: 'การเข้าสู่ระบบถูกยกเลิก' };
    } catch (error) {
        console.error('Google sign in error:', error);
        return { success: false, data: null, error: error.message };
    }
};

export { redirectUri };

export default {
    getDeviceId,
    getUserId,
    uploadImage,
    syncAnalysisToCloud,
    getCloudAnalyses,
    getCloudStats,
    syncAllToCloud,
    isSupabaseConfigured,
    // Auth exports
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    getCurrentUser,
    getSession,
    onAuthStateChange,
    supabase,
};
