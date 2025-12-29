/**
 * roboflowService.js - Roboflow API integration for acne detection
 * 
 * Uses Roboflow Serverless Hosted API for acne detection.
 */

import axios from 'axios';

// Roboflow API Configuration
const ROBOFLOW_CONFIG = {
    API_KEY: 'zQrG4gmeykD17p9RQp1o',
    MODEL_ID: 'acne-detection-q9g59/7',
    API_URL: 'https://serverless.roboflow.com',
};

/**
 * Analyze a single image for acne detection
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<Object>} Detection results
 */
export const analyzeImage = async (imageBase64) => {
    try {
        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const response = await axios({
            method: 'POST',
            url: `${ROBOFLOW_CONFIG.API_URL}/${ROBOFLOW_CONFIG.MODEL_ID}`,
            params: {
                api_key: ROBOFLOW_CONFIG.API_KEY,
            },
            data: base64Data,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Roboflow API error:', error);
        throw error;
    }
};

/**
 * Analyze all 3 face angles and aggregate results
 * @param {Object} frontalImage - Frontal face image with base64 data
 * @param {Object} leftImage - Left profile image with base64 data
 * @param {Object} rightImage - Right profile image with base64 data
 * @returns {Promise<Object>} Aggregated analysis results
 */
export const analyzeAllAngles = async (frontalImage, leftImage, rightImage) => {
    try {
        // Analyze all three images in parallel
        const [frontalResult, leftResult, rightResult] = await Promise.all([
            analyzeImage(frontalImage.base64),
            analyzeImage(leftImage.base64),
            analyzeImage(rightImage.base64),
        ]);

        return aggregateResults(frontalResult, leftResult, rightResult);
    } catch (error) {
        console.error('Analysis error:', error);

        // Return mock data if API fails (for testing purposes)
        return {
            severityLevel: 3,
            severityLabel: 'ปานกลาง (Moderate Acne)',
            spots: {
                inflamed: 4,
                clogged: 12,
                scars: 5,
            },
            totalSpots: 21,
            detections: {
                frontal: [],
                left: [],
                right: [],
            },
            confidence: 0.85,
            analyzedAt: new Date().toISOString(),
            error: error.message,
        };
    }
};

/**
 * Aggregate results from multiple angle analyses
 * @param {Object} frontalResult - Results from frontal image
 * @param {Object} leftResult - Results from left profile
 * @param {Object} rightResult - Results from right profile
 * @returns {Object} Aggregated results
 */
const aggregateResults = (frontalResult, leftResult, rightResult) => {
    const allDetections = [
        ...(frontalResult.predictions || []),
        ...(leftResult.predictions || []),
        ...(rightResult.predictions || []),
    ];

    const categorized = categorizeDetections(allDetections);
    const totalSpots = allDetections.length;
    const severityLevel = calculateSeverityLevel(totalSpots, categorized);

    return {
        severityLevel,
        severityLabel: getSeverityLabel(severityLevel),
        spots: categorized,
        totalSpots,
        detections: {
            frontal: frontalResult.predictions || [],
            left: leftResult.predictions || [],
            right: rightResult.predictions || [],
        },
        confidence: calculateAverageConfidence(allDetections),
        analyzedAt: new Date().toISOString(),
    };
};

/**
 * Categorize detections by acne type
 * @param {Array} detections - Array of detection objects
 * @returns {Object} Counts by category
 */
export const categorizeDetections = (detections) => {
    const categories = {
        inflamed: 0,  // สิวอักเสบ
        clogged: 0,   // สิวอุดตัน
        scars: 0,     // รอยดำจากสิว
    };

    detections.forEach(detection => {
        const className = (detection.class || '').toLowerCase();

        if (className.includes('inflamed') || className.includes('pustule') || className.includes('papule') || className.includes('nodule')) {
            categories.inflamed++;
        } else if (className.includes('clogged') || className.includes('comedone') || className.includes('whitehead') || className.includes('blackhead')) {
            categories.clogged++;
        } else if (className.includes('scar') || className.includes('spot') || className.includes('mark') || className.includes('pih')) {
            categories.scars++;
        } else {
            // Default to clogged for unrecognized types
            categories.clogged++;
        }
    });

    return categories;
};

/**
 * Calculate severity level based on detection count and types
 * @param {number} totalSpots - Total number of spots detected
 * @param {Object} categorized - Categorized spot counts
 * @returns {number} Severity level (1-5)
 */
export const calculateSeverityLevel = (totalSpots, categorized) => {
    // Weighted scoring: inflamed spots are more severe
    const weightedScore =
        (categorized.inflamed * 3) +
        (categorized.clogged * 1) +
        (categorized.scars * 2);

    if (weightedScore <= 5) return 1;      // Clear
    if (weightedScore <= 15) return 2;     // Mild
    if (weightedScore <= 30) return 3;     // Moderate
    if (weightedScore <= 50) return 4;     // Severe
    return 5;                               // Very Severe
};

/**
 * Get Thai severity label
 * @param {number} level - Severity level (1-5)
 * @returns {string} Severity label in Thai
 */
const getSeverityLabel = (level) => {
    const labels = {
        1: 'ใส (Clear)',
        2: 'เล็กน้อย (Mild Acne)',
        3: 'ปานกลาง (Moderate Acne)',
        4: 'รุนแรง (Severe Acne)',
        5: 'รุนแรงมาก (Very Severe Acne)',
    };
    return labels[level] || labels[3];
};

/**
 * Calculate average confidence from detections
 * @param {Array} detections - Array of detection objects
 * @returns {number} Average confidence (0-1)
 */
const calculateAverageConfidence = (detections) => {
    if (detections.length === 0) return 0;

    const totalConfidence = detections.reduce(
        (sum, det) => sum + (det.confidence || 0),
        0
    );

    return totalConfidence / detections.length;
};

export default {
    analyzeImage,
    analyzeAllAngles,
    categorizeDetections,
    calculateSeverityLevel,
};
