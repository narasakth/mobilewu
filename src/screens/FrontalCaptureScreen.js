/**
 * FrontalCaptureScreen.js - Step 1: Capture front face view
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Alert,
    Modal,
    Image,
    Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FrontalCaptureScreen = ({ navigation }) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [isReady, setIsReady] = useState(false);
    const [lightingStatus, setLightingStatus] = useState('Good');
    const [showConsentModal, setShowConsentModal] = useState(true);
    const [hasConsented, setHasConsented] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [cameraFacing, setCameraFacing] = useState('front');
    const [countdown, setCountdown] = useState(null);
    const cameraRef = useRef(null);

    const handleFlipCamera = () => {
        setCameraFacing(current => (current === 'front' ? 'back' : 'front'));
    };

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleAcceptConsent = () => {
        setHasConsented(true);
        setShowConsentModal(false);
    };

    const handleDeclineConsent = () => {
        Alert.alert(
            'ไม่สามารถดำเนินการต่อได้',
            'คุณต้องยอมรับเงื่อนไขการใช้งานเพื่อใช้ฟีเจอร์นี้',
            [
                { text: 'กลับหน้าหลัก', onPress: () => navigation.navigate('Home') },
                { text: 'ลองอีกครั้ง', onPress: () => setShowConsentModal(true) },
            ]
        );
    };

    const startCountdown = () => {
        setCountdown(3);
        Vibration.vibrate(50);

        let count = 3;
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                setCountdown(count);
                Vibration.vibrate(50);
            } else {
                clearInterval(timer);
                setCountdown(null);
                handleCapture();
            }
        }, 1000);
    };

    const handleCapture = async () => {
        if (cameraRef.current) {
            try {
                Vibration.vibrate(100);
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: true,
                    shutterSound: false,
                });

                // Show preview instead of navigating immediately
                setCapturedPhoto(photo);
                setShowPreview(true);
            } catch (error) {
                Alert.alert('Error', 'ถ่ายภาพไม่สำเร็จ กรุณาลองใหม่');
                console.error('Capture error:', error);
            }
        }
    };

    const handleConfirmPhoto = () => {
        setShowPreview(false);
        navigation.navigate('LeftProfileCapture', {
            frontalImage: capturedPhoto,
        });
    };

    const handleRetakePhoto = () => {
        setCapturedPhoto(null);
        setShowPreview(false);
    };

    const handlePickImage = () => {
        // Will implement image picker later
        Alert.alert('Coming Soon', 'Gallery picker will be available soon.');
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionTitle}>Camera Access Required</Text>
                    <Text style={styles.permissionText}>
                        We need camera access to analyze your skin condition.
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Research Consent Modal */}
            <Modal
                visible={showConsentModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConsentModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalIcon}>📋</Text>
                            <Text style={styles.modalTitle}>ข้อตกลงการใช้งาน</Text>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            กรุณาอ่านและยอมรับเงื่อนไขก่อนดำเนินการต่อ
                        </Text>

                        <View style={styles.consentBox}>
                            <Text style={styles.consentText}>
                                ข้าพเจ้ายินยอมให้นำภาพถ่ายใบหน้าที่ถ่ายในแอปพลิเคชันนี้ไปใช้ในการวิจัยและพัฒนาระบบตรวจจับสิวด้วย AI โดยข้อมูลจะถูกเก็บรักษาอย่างปลอดภัยและไม่เปิดเผยข้อมูลส่วนบุคคล
                            </Text>

                            <View style={styles.consentDetails}>
                                <Text style={styles.consentDetailItem}>• ภาพถ่ายจะถูกใช้เพื่อการวิจัยเท่านั้น</Text>
                                <Text style={styles.consentDetailItem}>• ข้อมูลจะถูกเก็บอย่างปลอดภัยและเป็นความลับ</Text>
                                <Text style={styles.consentDetailItem}>• ไม่มีการเปิดเผยตัวตนของผู้ใช้งาน</Text>
                                <Text style={styles.consentDetailItem}>• สามารถขอลบข้อมูลได้ตลอดเวลา</Text>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.declineButton}
                                onPress={handleDeclineConsent}
                            >
                                <Text style={styles.declineButtonText}>ไม่ยอมรับ</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={handleAcceptConsent}
                            >
                                <Text style={styles.acceptButtonText}>ยอมรับเงื่อนไข</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Photo Preview Modal */}
            <Modal
                visible={showPreview}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.previewOverlay}>
                    <View style={styles.previewContainer}>
                        <Text style={styles.previewTitle}>ตรวจสอบภาพ</Text>
                        <Text style={styles.previewSubtitle}>ภาพชัดเจนหรือไม่?</Text>

                        {capturedPhoto && (
                            <Image
                                source={{ uri: capturedPhoto.uri }}
                                style={styles.previewImage}
                                resizeMode="cover"
                            />
                        )}

                        <View style={styles.previewButtons}>
                            <TouchableOpacity
                                style={styles.retakeButton}
                                onPress={handleRetakePhoto}
                            >
                                <Text style={styles.retakeButtonIcon}>🔄</Text>
                                <Text style={styles.retakeButtonText}>ถ่ายใหม่</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmPhoto}
                            >
                                <Text style={styles.confirmButtonIcon}>✓</Text>
                                <Text style={styles.confirmButtonText}>ใช้ภาพนี้</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepText}>Step 1 of 3: Frontal View</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            {/* Camera View */}
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing={cameraFacing}
                    onCameraReady={() => setIsReady(true)}
                >
                    {/* Face Guide Overlay */}
                    <View style={styles.overlay}>
                        {/* Lighting Indicator */}
                        <View style={styles.lightingIndicator}>
                            <View style={[
                                styles.lightingDot,
                                { backgroundColor: lightingStatus === 'Good' ? '#4CAF50' : '#FF9800' }
                            ]} />
                            <Text style={styles.lightingText}>Lighting: {lightingStatus}</Text>
                        </View>

                        {/* Face Outline */}
                        <View style={styles.faceGuideContainer}>
                            <View style={styles.faceOutline}>
                                {/* Dashed border effect */}
                                <View style={styles.faceOutlineInner} />
                            </View>
                        </View>
                    </View>
                </CameraView>
            </View>

            {/* Countdown Overlay */}
            {countdown !== null && (
                <View style={styles.countdownOverlay}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                </View>
            )}

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>วางใบหน้าให้อยู่ตรงกลางกรอบ</Text>
                <Text style={styles.instructionsText}>
                    มองตรงกล้อง และแสดงสีหน้าเป็นธรรมชาติ
                </Text>
            </View>

            {/* Capture Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={handlePickImage}
                >
                    <Ionicons name="images-outline" size={24} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.captureButton, (!isReady || !hasConsented || countdown !== null) && styles.captureButtonDisabled]}
                    onPress={startCountdown}
                    disabled={!isReady || !hasConsented || countdown !== null}
                >
                    <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.flipButton} onPress={handleFlipCamera}>
                    <Ionicons name="camera-reverse-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A1A',
    },
    countdownOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 100,
    },
    countdownText: {
        fontSize: 120,
        fontWeight: 'bold',
        color: '#FFF',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 16,
    },
    permissionText: {
        fontSize: 16,
        color: '#AAA',
        textAlign: 'center',
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
    permissionButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    modalIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1A1A2E',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    consentBox: {
        backgroundColor: '#F5F7FA',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    consentText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 22,
        marginBottom: 16,
    },
    consentDetails: {
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 12,
    },
    consentDetailItem: {
        fontSize: 13,
        color: '#555',
        marginBottom: 8,
        lineHeight: 18,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    declineButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        alignItems: 'center',
    },
    declineButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    acceptButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#2196F3',
        alignItems: 'center',
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },

    // Header styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#FFF',
    },
    stepIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    stepText: {
        fontSize: 14,
        color: '#FFF',
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    },
    cameraContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 24,
        overflow: 'hidden',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    lightingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        margin: 16,
    },
    lightingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    lightingText: {
        fontSize: 12,
        color: '#FFF',
    },
    faceGuideContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceOutline: {
        width: SCREEN_WIDTH * 0.65,
        height: SCREEN_WIDTH * 0.85,
        borderRadius: SCREEN_WIDTH * 0.325,
        borderWidth: 2,
        borderColor: '#2196F3',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceOutlineInner: {
        width: '95%',
        height: '95%',
        borderRadius: SCREEN_WIDTH * 0.3,
        borderWidth: 1,
        borderColor: 'rgba(33, 150, 243, 0.3)',
    },
    instructionsContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        alignItems: 'center',
    },
    instructionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    instructionsText: {
        fontSize: 14,
        color: '#AAA',
        textAlign: 'center',
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 32,
    },
    galleryButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 32,
    },
    galleryIcon: {
        fontSize: 24,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(33, 150, 243, 0.3)',
    },
    captureButtonDisabled: {
        opacity: 0.5,
    },
    captureButtonInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF',
    },
    flipButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 32,
    },
    flipIcon: {
        fontSize: 24,
    },

    // Preview Modal styles
    previewOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    previewContainer: {
        width: '100%',
        alignItems: 'center',
    },
    previewTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    previewSubtitle: {
        fontSize: 16,
        color: '#AAA',
        marginBottom: 24,
    },
    previewImage: {
        width: SCREEN_WIDTH - 48,
        height: SCREEN_WIDTH * 1.2,
        borderRadius: 20,
        marginBottom: 32,
    },
    previewButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    retakeButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    retakeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 12,
    },
    confirmButtonIcon: {
        fontSize: 20,
        marginRight: 8,
        color: '#FFF',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});

export default FrontalCaptureScreen;
