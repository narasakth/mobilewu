/**
 * LeftProfileCaptureScreen.js - Step 2: Capture left side of face
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Alert,
    Image,
    Modal,
    Vibration,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LeftProfileCaptureScreen = ({ navigation, route }) => {
    const { frontalImage } = route.params || {};
    const [isReady, setIsReady] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [cameraFacing, setCameraFacing] = useState('front');
    const [countdown, setCountdown] = useState(null);
    const cameraRef = useRef(null);

    const handleFlipCamera = () => {
        setCameraFacing(current => (current === 'front' ? 'back' : 'front'));
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
        navigation.navigate('RightProfileCapture', {
            frontalImage,
            leftImage: capturedPhoto,
        });
    };

    const handleRetakePhoto = () => {
        setCapturedPhoto(null);
        setShowPreview(false);
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
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
                    style={styles.backButton}
                    onPress={handleGoBack}
                >
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
                    <Text style={styles.stepTitle}>Left Profile</Text>
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
                    {/* Left Profile Guide Overlay */}
                    <View style={styles.overlay}>
                        <View style={styles.profileGuideContainer}>
                            {/* Left profile silhouette */}
                            <View style={styles.profileOutline}>
                                <View style={styles.profileHead} />
                                <View style={styles.profileNose} />
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
                <Text style={styles.instructionsTitle}>หันหน้าไปทางซ้าย</Text>
                <Text style={styles.instructionsText}>
                    ค่อยๆ หมุนหน้าไปทางซ้ายตามกรอบ
                </Text>
            </View>

            {/* Capture Controls */}
            <View style={styles.controlsContainer}>
                {/* Thumbnail of frontal capture */}
                <View style={styles.thumbnailContainer}>
                    {frontalImage && (
                        <Image
                            source={{ uri: frontalImage.uri }}
                            style={styles.thumbnail}
                        />
                    )}
                    {!frontalImage && (
                        <View style={styles.thumbnailPlaceholder}>
                            <Text style={styles.thumbnailIcon}>👤</Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.captureButton, (!isReady || countdown !== null) && styles.captureButtonDisabled]}
                    onPress={startCountdown}
                    disabled={!isReady || countdown !== null}
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 48,
        paddingBottom: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: 28,
        color: '#FFF',
        marginTop: -4,
    },
    stepIndicator: {
        alignItems: 'center',
    },
    stepLabel: {
        fontSize: 12,
        color: '#2196F3',
        fontWeight: '600',
        letterSpacing: 1,
    },
    stepTitle: {
        fontSize: 18,
        color: '#FFF',
        fontWeight: 'bold',
        marginTop: 4,
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileGuideContainer: {
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileOutline: {
        width: SCREEN_WIDTH * 0.5,
        height: SCREEN_WIDTH * 0.7,
        borderWidth: 2,
        borderColor: '#2196F3',
        borderStyle: 'dashed',
        borderRadius: 20,
        position: 'relative',
        transform: [{ scaleX: -1 }], // Flip for left profile
    },
    profileHead: {
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '60%',
        height: '50%',
        borderWidth: 2,
        borderColor: 'rgba(33, 150, 243, 0.5)',
        borderRadius: 100,
    },
    profileNose: {
        position: 'absolute',
        top: '35%',
        left: '5%',
        width: 20,
        height: 30,
        borderWidth: 2,
        borderColor: 'rgba(33, 150, 243, 0.5)',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
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
    thumbnailContainer: {
        marginRight: 32,
    },
    thumbnail: {
        width: 50,
        height: 50,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2196F3',
    },
    thumbnailPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailIcon: {
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

export default LeftProfileCaptureScreen;
