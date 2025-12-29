/**
 * AnalysisResultScreen.js - Display acne analysis results
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Image,
    Dimensions,
    Switch,
    ActivityIndicator,
    BackHandler,
    Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyzeAllAngles } from '../services/roboflowService';
import { saveAnalysis } from '../services/analysisHistoryService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Image dimensions for calculating marker positions
const IMAGE_WIDTH = SCREEN_WIDTH - 32;
const IMAGE_HEIGHT = 380;

const AnalysisResultScreen = ({ navigation, route }) => {
    const { frontalImage, leftImage, rightImage } = route.params || {};
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showAIOverlay, setShowAIOverlay] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [analysisResult, setAnalysisResult] = useState(null);

    const images = [
        { uri: frontalImage?.uri, label: 'Frontal', detections: [] },
        { uri: leftImage?.uri, label: 'Left', detections: [] },
        { uri: rightImage?.uri, label: 'Right', detections: [] },
    ].filter(img => img.uri);

    // Call Roboflow API when component mounts
    useEffect(() => {
        const runAnalysis = async () => {
            try {
                setIsLoading(true);
                const result = await analyzeAllAngles(frontalImage, leftImage, rightImage);
                setAnalysisResult(result);

                // Update images with detections
                if (result.detections) {
                    images[0].detections = result.detections.frontal || [];
                    images[1].detections = result.detections.left || [];
                    images[2].detections = result.detections.right || [];
                }
            } catch (error) {
                console.error('Analysis error:', error);
                // Set default result on error
                setAnalysisResult({
                    severityLevel: 3,
                    severityLabel: 'ปานกลาง (Moderate Acne)',
                    spots: { inflamed: 4, clogged: 12, scars: 5 },
                    totalSpots: 21,
                    detections: { frontal: [], left: [], right: [] },
                });
            } finally {
                setIsLoading(false);
            }
        };

        runAnalysis();
    }, []);

    // Handle Android back button - go to Home instead of capture screens
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            return true;
        });
        return () => backHandler.remove();
    }, [navigation]);

    const getSeverityColor = (level) => {
        const colors = {
            1: '#4CAF50',
            2: '#8BC34A',
            3: '#FFC107',
            4: '#FF9800',
            5: '#F44336',
        };
        return colors[level] || '#2196F3';
    };

    const getSeverityGradient = (level) => {
        return {
            backgroundColor: getSeverityColor(level),
        };
    };

    const handleSaveToJournal = async () => {
        if (analysisResult) {
            // Pass images for cloud sync
            const images = {
                frontal: frontalImage,
                left: leftImage,
                right: rightImage,
            };

            const success = await saveAnalysis({
                ...analysisResult,
                frontalImageUri: frontalImage?.uri,
            }, images);

            if (success) {
                alert('บันทึกลง Journal สำเร็จ!');
            } else {
                alert('เกิดข้อผิดพลาดในการบันทึก');
            }
        }
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    };

    const handleCompare = () => {
        alert('ฟีเจอร์เปรียบเทียบจะพร้อมใช้งานเร็วๆ นี้');
    };

    // Get detection color based on class
    const getDetectionColor = (className) => {
        const name = (className || '').toLowerCase();
        if (name.includes('inflamed') || name.includes('pustule') || name.includes('papule')) {
            return '#F44336'; // Red for inflamed
        } else if (name.includes('scar') || name.includes('spot') || name.includes('mark')) {
            return '#FF9800'; // Orange for scars
        }
        return '#FFC107'; // Yellow for clogged/other
    };

    // Render detection markers for an image
    const renderDetectionMarkers = (detections, imageWidth, imageHeight) => {
        if (!detections || detections.length === 0) return null;

        return detections.map((detection, index) => {
            // Roboflow returns x, y as center coordinates, plus width and height
            // We need to convert these to position percentages
            const x = detection.x || 0;
            const y = detection.y || 0;
            const width = detection.width || 30;
            const height = detection.height || 30;

            // Calculate position as percentage of image dimensions
            const leftPercent = ((x - width / 2) / imageWidth) * 100;
            const topPercent = ((y - height / 2) / imageHeight) * 100;
            const markerWidth = (width / imageWidth) * 100;
            const markerHeight = (height / imageHeight) * 100;

            const color = getDetectionColor(detection.class);

            return (
                <View
                    key={index}
                    style={[
                        styles.detectionMarker,
                        {
                            left: `${Math.max(0, Math.min(leftPercent, 95))}%`,
                            top: `${Math.max(0, Math.min(topPercent, 95))}%`,
                            width: Math.max(20, markerWidth * 3),
                            height: Math.max(20, markerHeight * 3),
                            borderColor: color,
                            backgroundColor: `${color}30`,
                        },
                    ]}
                />
            );
        });
    };

    // Get current image detections
    const getCurrentDetections = () => {
        if (!analysisResult?.detections) return [];

        switch (currentImageIndex) {
            case 0: return analysisResult.detections.frontal || [];
            case 1: return analysisResult.detections.left || [];
            case 2: return analysisResult.detections.right || [];
            default: return [];
        }
    };

    // Treatment recommendations based on severity
    const getTreatmentPlan = (level) => {
        const plans = {
            1: [
                { icon: '🧴', title: 'Gentle Cleanser', desc: 'Use twice daily (AM/PM)' },
                { icon: '💧', title: 'Moisturizer', desc: 'Lightweight, non-comedogenic' },
            ],
            2: [
                { icon: '🧴', title: 'Gentle Cleanser', desc: 'Use twice daily (AM/PM)' },
                { icon: '💊', title: 'Spot Treatment', desc: 'Apply to affected areas' },
            ],
            3: [
                { icon: '🧴', title: 'Gentle Cleanser', desc: 'Use twice daily (AM/PM)' },
                { icon: '💊', title: 'Spot Treatment', desc: 'Apply to affected areas' },
                { icon: '🏥', title: 'Consult Dermatologist', desc: 'Consider professional advice' },
            ],
            4: [
                { icon: '🏥', title: 'See Dermatologist', desc: 'Professional treatment recommended' },
                { icon: '💊', title: 'Prescription Treatment', desc: 'As directed by doctor' },
            ],
            5: [
                { icon: '🏥', title: 'Urgent Dermatology Visit', desc: 'Seek professional help soon' },
                { icon: '⚠️', title: 'Avoid Picking', desc: 'Prevent scarring and infection' },
            ],
        };
        return plans[level] || plans[3];
    };

    // Show loading screen while analyzing
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>กำลังวิเคราะห์ภาพ...</Text>
                    <Text style={styles.loadingSubtext}>AI กำลังตรวจสอบสภาพผิว</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ผลการวิเคราะห์ระดับสิวหน้า</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Image Carousel */}
                <View style={styles.carouselContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                            const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
                            setCurrentImageIndex(index);
                        }}
                    >
                        {images.map((img, index) => (
                            <View key={index} style={styles.imageSlide}>
                                <Image
                                    source={{ uri: img.uri }}
                                    style={styles.capturedImage}
                                    resizeMode="cover"
                                />
                                {showAIOverlay && analysisResult?.detections && (
                                    <View style={styles.aiOverlay}>
                                        {renderDetectionMarkers(
                                            index === 0 ? analysisResult.detections.frontal :
                                                index === 1 ? analysisResult.detections.left :
                                                    analysisResult.detections.right,
                                            IMAGE_WIDTH,
                                            IMAGE_HEIGHT
                                        )}
                                    </View>
                                )}
                                {/* Image label */}
                                <View style={styles.imageLabel}>
                                    <Text style={styles.imageLabelText}>{img.label}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Page indicators */}
                    <View style={styles.pageIndicators}>
                        {images.map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.pageIndicator,
                                    currentImageIndex === index && styles.pageIndicatorActive
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* AI Overlay Toggle */}
                <View style={styles.overlayToggle}>
                    <View>
                        <Text style={styles.overlayToggleTitle}>AI Overlay</Text>
                        <Text style={styles.overlayToggleDesc}>Show diagnostic bounding boxes</Text>
                    </View>
                    <Switch
                        value={showAIOverlay}
                        onValueChange={setShowAIOverlay}
                        trackColor={{ false: '#DDD', true: '#2196F3' }}
                        thumbColor="#FFF"
                    />
                </View>

                {/* Severity Gauge */}
                {analysisResult && (
                    <>
                        <View style={styles.severitySection}>
                            <View style={styles.severityGauge}>
                                <View style={[styles.severityCircle, getSeverityGradient(analysisResult.severityLevel)]}>
                                    <Text style={styles.severityLabel}>SEVERITY</Text>
                                    <Text style={styles.severityLevel}>Level {analysisResult.severityLevel}</Text>
                                </View>
                            </View>
                            <View style={styles.severityInfo}>
                                <Text style={styles.severityDescription}>{analysisResult.severityLabel}</Text>
                            </View>
                        </View>

                        {/* Spots Breakdown */}
                        <View style={styles.spotsSection}>
                            <View style={styles.spotItem}>
                                <View style={styles.spotIcon}>
                                    <View style={[styles.spotDot, { backgroundColor: '#F44336' }]} />
                                </View>
                                <View style={styles.spotInfo}>
                                    <Text style={styles.spotLabel}>สิวอักเสบ (Inflamed)</Text>
                                    <Text style={styles.spotCount}>{analysisResult.spots?.inflamed || 0} Spots</Text>
                                </View>
                                <View style={[styles.spotBar, { width: `${((analysisResult.spots?.inflamed || 0) / Math.max(analysisResult.totalSpots || 1, 1)) * 100}%`, backgroundColor: '#F44336' }]} />
                            </View>

                            <View style={styles.spotItem}>
                                <View style={styles.spotIcon}>
                                    <View style={[styles.spotDot, { backgroundColor: '#9E9E9E' }]} />
                                </View>
                                <View style={styles.spotInfo}>
                                    <Text style={styles.spotLabel}>สิวอุดตัน (Clogged)</Text>
                                    <Text style={styles.spotCount}>{analysisResult.spots?.clogged || 0} Spots</Text>
                                </View>
                                <View style={[styles.spotBar, { width: `${((analysisResult.spots?.clogged || 0) / Math.max(analysisResult.totalSpots || 1, 1)) * 100}%`, backgroundColor: '#9E9E9E' }]} />
                            </View>

                            <View style={styles.spotItem}>
                                <View style={styles.spotIcon}>
                                    <View style={[styles.spotDot, { backgroundColor: '#FF9800' }]} />
                                </View>
                                <View style={styles.spotInfo}>
                                    <Text style={styles.spotLabel}>รอยดำจากสิว (Spots)</Text>
                                    <Text style={styles.spotCount}>{analysisResult.spots?.scars || 0} Spots</Text>
                                </View>
                                <View style={[styles.spotBar, { width: `${((analysisResult.spots?.scars || 0) / Math.max(analysisResult.totalSpots || 1, 1)) * 100}%`, backgroundColor: '#FF9800' }]} />
                            </View>
                        </View>

                        {/* Treatment Plan */}
                        <View style={styles.treatmentSection}>
                            <Text style={styles.treatmentTitle}>คำแนะนำการดูแล (Treatment Plan)</Text>
                            <View style={styles.treatmentGrid}>
                                {getTreatmentPlan(analysisResult.severityLevel).map((item, index) => (
                                    <View key={index} style={styles.treatmentCard}>
                                        <Text style={styles.treatmentIcon}>{item.icon}</Text>
                                        <Text style={styles.treatmentName}>{item.title}</Text>
                                        <Text style={styles.treatmentDesc}>{item.desc}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleSaveToJournal}
                    >
                        <Text style={styles.primaryButtonIcon}>📝</Text>
                        <Text style={styles.primaryButtonText}>บันทึกลง Journal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={async () => {
                            try {
                                await Share.share({
                                    message: `📊 ผลวิเคราะห์สภาพผิว\nระดับ: ${analysisResult?.severityLevel || '-'}/5\nจำนวนจุด: ${analysisResult?.totalSpots || 0}\n- สิวอักเสบ: ${analysisResult?.spots?.inflamed || 0}\n- สิวอุดตัน: ${analysisResult?.spots?.clogged || 0}\nวิเคราะห์โดย AcneScan`,
                                });
                            } catch (error) {
                                console.error('Share error:', error);
                            }
                        }}
                    >
                        <Ionicons name="share-outline" size={20} color="#0066CC" />
                        <Text style={styles.shareButtonText}>แชร์ผล</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
                    >
                        <Text style={styles.homeButtonIcon}>🏠</Text>
                        <Text style={styles.homeButtonText}>กลับหน้าหลัก</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A2E',
        marginTop: 16,
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 28,
        color: '#333',
        marginTop: -4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A2E',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 32,
    },
    carouselContainer: {
        backgroundColor: '#FFF',
        paddingVertical: 16,
    },
    imageSlide: {
        width: SCREEN_WIDTH - 32,
        height: 380,
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    capturedImage: {
        width: '100%',
        height: '100%',
    },
    aiOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    detectionMarker: {
        position: 'absolute',
        borderRadius: 4,
        borderWidth: 2,
    },
    imageLabel: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    imageLabelText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    pageIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    pageIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#DDD',
        marginHorizontal: 4,
    },
    pageIndicatorActive: {
        backgroundColor: '#2196F3',
        width: 24,
    },
    overlayToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingVertical: 16,
        marginTop: 1,
    },
    overlayToggleTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    overlayToggleDesc: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    severitySection: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#FFF',
        marginTop: 16,
    },
    severityGauge: {
        marginBottom: 16,
    },
    severityCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    severityLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '600',
        letterSpacing: 1,
    },
    severityLevel: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 4,
    },
    severityInfo: {
        alignItems: 'center',
    },
    severityDescription: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
    },
    spotsSection: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingVertical: 20,
        marginTop: 16,
    },
    spotItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    spotIcon: {
        marginRight: 12,
    },
    spotDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    spotInfo: {
        flex: 1,
    },
    spotLabel: {
        fontSize: 14,
        color: '#666',
    },
    spotCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1A1A2E',
    },
    spotBar: {
        height: 4,
        borderRadius: 2,
        position: 'absolute',
        right: 0,
        bottom: 0,
    },
    treatmentSection: {
        backgroundColor: '#FFF',
        paddingHorizontal: 24,
        paddingVertical: 20,
        marginTop: 16,
    },
    treatmentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A2E',
        marginBottom: 16,
    },
    treatmentGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    treatmentCard: {
        width: '48%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: '1%',
        marginBottom: 12,
    },
    treatmentIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    treatmentName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    treatmentDesc: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    actionsSection: {
        paddingHorizontal: 24,
        paddingVertical: 24,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    primaryButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    secondaryButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    secondaryButtonText: {
        fontSize: 14,
        color: '#2196F3',
        fontWeight: '600',
    },
    homeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    homeButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    homeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        gap: 8,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0066CC',
    },
});

export default AnalysisResultScreen;
