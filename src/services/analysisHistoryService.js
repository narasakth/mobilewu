/**
 * analysisHistoryService.js - Local storage for analysis history
 * Uses AsyncStorage to persist analysis results + Supabase cloud sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncAnalysisToCloud, isSupabaseConfigured, getUserId } from './supabaseService';

const HISTORY_KEY_PREFIX = '@acnescan_history_';
const MAX_HISTORY_ITEMS = 50;

/**
 * Get user-specific history key
 * @returns {Promise<string>} History key for current user
 */
const getHistoryKey = async () => {
    const userId = await getUserId();
    return `${HISTORY_KEY_PREFIX}${userId}`;
};

/**
 * Save a new analysis result to history
 * @param {Object} analysisResult - The analysis result to save
 * @param {Object} images - Optional images object with frontal, left, right
 * @returns {Promise<boolean>} Success status
 */
export const saveAnalysis = async (analysisResult, images = {}) => {
    try {
        const history = await getHistory();

        const newEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            severityLevel: analysisResult.severityLevel,
            severityLabel: analysisResult.severityLabel,
            spots: analysisResult.spots,
            totalSpots: analysisResult.totalSpots,
            thumbnail: analysisResult.frontalImageUri || null,
            synced: false,
        };

        // Add new entry at the beginning
        history.unshift(newEntry);

        // Keep only the last MAX_HISTORY_ITEMS
        if (history.length > MAX_HISTORY_ITEMS) {
            history.splice(MAX_HISTORY_ITEMS);
        }

        const historyKey = await getHistoryKey();
        await AsyncStorage.setItem(historyKey, JSON.stringify(history));

        // Sync to cloud if configured (with images)
        if (isSupabaseConfigured()) {
            try {
                await syncAnalysisToCloud(newEntry, images);
                history[0] = newEntry;
                const historyKey2 = await getHistoryKey();
                await AsyncStorage.setItem(historyKey2, JSON.stringify(history));
            } catch (syncError) {
                console.warn('Cloud sync failed, will retry later:', syncError);
            }
        }

        return true;
    } catch (error) {
        console.error('Error saving analysis:', error);
        return false;
    }
};

/**
 * Get all analysis history
 * @returns {Promise<Array>} Array of analysis results
 */
export const getHistory = async () => {
    try {
        const historyKey = await getHistoryKey();
        const historyJson = await AsyncStorage.getItem(historyKey);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error('Error getting history:', error);
        return [];
    }
};

/**
 * Get recent analyses (last N items)
 * @param {number} count - Number of items to retrieve
 * @returns {Promise<Array>} Array of recent analyses
 */
export const getRecentAnalyses = async (count = 5) => {
    try {
        const history = await getHistory();
        return history.slice(0, count);
    } catch (error) {
        console.error('Error getting recent analyses:', error);
        return [];
    }
};

/**
 * Get a single analysis by ID
 * @param {string} id - Analysis ID
 * @returns {Promise<Object|null>} Analysis result or null
 */
export const getAnalysisById = async (id) => {
    try {
        const history = await getHistory();
        return history.find(item => item.id === id) || null;
    } catch (error) {
        console.error('Error getting analysis:', error);
        return null;
    }
};

/**
 * Delete an analysis by ID
 * @param {string} id - Analysis ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteAnalysis = async (id) => {
    try {
        const history = await getHistory();
        const filteredHistory = history.filter(item => item.id !== id);
        const historyKey = await getHistoryKey();
        await AsyncStorage.setItem(historyKey, JSON.stringify(filteredHistory));
        return true;
    } catch (error) {
        console.error('Error deleting analysis:', error);
        return false;
    }
};

/**
 * Clear all history
 * @returns {Promise<boolean>} Success status
 */
export const clearHistory = async () => {
    try {
        const historyKey = await getHistoryKey();
        await AsyncStorage.removeItem(historyKey);
        return true;
    } catch (error) {
        console.error('Error clearing history:', error);
        return false;
    }
};

/**
 * Get statistics summary
 * @returns {Promise<Object>} Statistics object
 */
export const getStatistics = async () => {
    try {
        const history = await getHistory();

        if (history.length === 0) {
            return {
                totalScans: 0,
                averageLevel: 0,
                trend: 'neutral',
                lastScanDate: null,
            };
        }

        const totalScans = history.length;
        const averageLevel = history.reduce((sum, item) => sum + item.severityLevel, 0) / totalScans;

        // Calculate trend based on last 5 vs previous 5
        let trend = 'neutral';
        if (history.length >= 2) {
            const recent = history.slice(0, Math.min(5, history.length));
            const older = history.slice(Math.min(5, history.length), Math.min(10, history.length));

            if (older.length > 0) {
                const recentAvg = recent.reduce((sum, item) => sum + item.severityLevel, 0) / recent.length;
                const olderAvg = older.reduce((sum, item) => sum + item.severityLevel, 0) / older.length;

                if (recentAvg < olderAvg - 0.3) {
                    trend = 'improving';
                } else if (recentAvg > olderAvg + 0.3) {
                    trend = 'worsening';
                }
            }
        }

        return {
            totalScans,
            averageLevel: Math.round(averageLevel * 10) / 10,
            trend,
            lastScanDate: history[0]?.date || null,
        };
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            totalScans: 0,
            averageLevel: 0,
            trend: 'neutral',
            lastScanDate: null,
        };
    }
};

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {Object} Formatted date object
 */
export const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    let relative;
    if (diffDays === 0) {
        relative = 'Today';
    } else if (diffDays === 1) {
        relative = 'Yesterday';
    } else if (diffDays < 7) {
        relative = `${diffDays} days ago`;
    } else {
        relative = date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    return {
        date: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        relative,
    };
};

export default {
    saveAnalysis,
    getHistory,
    getRecentAnalyses,
    getAnalysisById,
    deleteAnalysis,
    clearHistory,
    getStatistics,
    formatDate,
};
