/**
 * ForgotPasswordScreen.js - Reset password via email link
 * Supabase sends a magic link, not OTP code
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../services/supabaseService';

const COLORS = {
    primary: '#0066CC',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    accent: '#10B981',
    danger: '#EF4444',
};

const ForgotPasswordScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const handleSendLink = async () => {
        if (!email) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมล');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('ข้อผิดพลาด', 'รูปแบบอีเมลไม่ถูกต้อง');
            return;
        }

        setLoading(true);
        const result = await resetPassword(email);
        setLoading(false);

        if (result.success) {
            setSent(true);
        } else {
            Alert.alert('ข้อผิดพลาด', result.error || 'ไม่สามารถส่งลิงก์ได้');
        }
    };

    const renderForm = () => (
        <>
            <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={60} color={COLORS.primary} />
            </View>

            <Text style={styles.title}>ลืมรหัสผ่าน</Text>
            <Text style={styles.subtitle}>
                กรอกอีเมลที่ลงทะเบียนไว้{'\n'}
                ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณ
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="อีเมล"
                    placeholderTextColor={COLORS.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendLink}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.primaryButtonText}>ส่งลิงก์รีเซ็ต</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.secondaryButtonText}>กลับไปหน้าเข้าสู่ระบบ</Text>
            </TouchableOpacity>
        </>
    );

    const renderSuccess = () => (
        <>
            <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={80} color={COLORS.accent} />
            </View>

            <Text style={styles.title}>ส่งลิงก์แล้ว!</Text>
            <Text style={styles.subtitle}>
                เราส่งลิงก์รีเซ็ตรหัสผ่านไปยัง{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={24} color={COLORS.primary} />
                <Text style={styles.infoText}>
                    กรุณาเปิดลิงก์จากอีเมลในเบราว์เซอร์{'\n'}
                    แล้วตั้งรหัสผ่านใหม่ในเว็บ Supabase
                </Text>
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.primaryButtonText}>กลับไปหน้าเข้าสู่ระบบ</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                    setSent(false);
                    handleSendLink();
                }}
            >
                <Text style={styles.secondaryButtonText}>ส่งลิงก์อีกครั้ง</Text>
            </TouchableOpacity>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.formContainer}>
                    {sent ? renderSuccess() : renderForm()}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'android' ? 30 : 0,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    backButton: {
        padding: 8,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    emailHighlight: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: COLORS.text,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E0F2FE',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
});

export default ForgotPasswordScreen;
