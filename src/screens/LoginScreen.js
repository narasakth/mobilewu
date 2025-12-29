/**
 * LoginScreen.js - Login and Register screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signIn, signUp, resetPassword, signInWithGoogle } from '../services/supabaseService';

// Medical theme colors
const COLORS = {
    primary: '#0066CC',
    secondary: '#00A896',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    accent: '#10B981',
    error: '#EF4444',
    border: '#E2E8F0',
};

const LoginScreen = ({ navigation }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailValid, setEmailValid] = useState(null); // null = not checked, true/false = valid/invalid

    const validateEmail = (emailInput) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
    };

    const handleEmailChange = (text) => {
        setEmail(text);
        if (text.length > 0) {
            setEmailValid(validateEmail(text));
        } else {
            setEmailValid(null);
        }
    };

    const getPasswordStrength = (pass) => {
        if (!pass) return { level: 0, label: '', color: COLORS.border };
        let score = 0;
        if (pass.length >= 6) score++;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 1) return { level: 1, label: 'อ่อน', color: COLORS.danger };
        if (score <= 2) return { level: 2, label: 'ปานกลาง', color: COLORS.warning };
        if (score <= 3) return { level: 3, label: 'ดี', color: '#8BC34A' };
        return { level: 4, label: 'แข็งแรง', color: COLORS.accent };
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('ข้อผิดพลาด', 'รูปแบบอีเมลไม่ถูกต้อง');
            return;
        }

        setLoading(true);
        const result = await signIn(email, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('เข้าสู่ระบบไม่สำเร็จ', 'กรุณาลองใหม่อีกครั้ง');
        }
    };

    const handleRegister = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบ');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('ข้อผิดพลาด', 'รูปแบบอีเมลไม่ถูกต้อง');
            return;
        }

        if (password.length < 6) {
            Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
            return;
        }

        setLoading(true);
        const result = await signUp(email, password, displayName);
        setLoading(false);

        if (result.success) {
            Alert.alert(
                'สมัครสมาชิกสำเร็จ',
                'กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัคร',
                [{ text: 'ตกลง', onPress: () => setIsLogin(true) }]
            );
        } else {
            Alert.alert('สมัครไม่สำเร็จ', result.error || 'กรุณาลองใหม่อีกครั้ง');
        }
    };

    // handleForgotPassword function removed - using the one above

    const handleGoogleLogin = async () => {
        setLoading(true);
        const result = await signInWithGoogle();
        setLoading(false);

        if (!result.success) {
            Alert.alert('เข้าสู่ระบบไม่สำเร็จ', result.error || 'กรุณาลองใหม่อีกครั้ง');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="scan" size={48} color={COLORS.primary} />
                        </View>
                        <Text style={styles.appName}>AcneScan</Text>
                        <Text style={styles.tagline}>
                            {isLogin ? 'เข้าสู่ระบบเพื่อติดตามสุขภาพผิว' : 'สร้างบัญชีใหม่'}
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {!isLogin && (
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="ชื่อที่แสดง (ไม่บังคับ)"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={displayName}
                                    onChangeText={setDisplayName}
                                    autoCapitalize="words"
                                />
                            </View>
                        )}

                        <View style={[styles.inputContainer, emailValid === false && styles.inputError, emailValid === true && styles.inputSuccess]}>
                            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="อีเมล"
                                placeholderTextColor={COLORS.textSecondary}
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {emailValid !== null && (
                                <Ionicons
                                    name={emailValid ? "checkmark-circle" : "close-circle"}
                                    size={20}
                                    color={emailValid ? COLORS.accent : COLORS.danger}
                                />
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="รหัสผ่าน"
                                placeholderTextColor={COLORS.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={isLogin ? true : !showPassword}
                            />
                            {!isLogin && (
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={COLORS.textSecondary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Password Strength Bar */}
                        {!isLogin && password.length > 0 && (
                            <View style={styles.strengthContainer}>
                                <View style={styles.strengthBar}>
                                    {[1, 2, 3, 4].map((level) => (
                                        <View
                                            key={level}
                                            style={[
                                                styles.strengthSegment,
                                                {
                                                    backgroundColor: level <= getPasswordStrength(password).level
                                                        ? getPasswordStrength(password).color
                                                        : COLORS.border
                                                }
                                            ]}
                                        />
                                    ))}
                                </View>
                                <Text style={[styles.strengthLabel, { color: getPasswordStrength(password).color }]}>
                                    {getPasswordStrength(password).label}
                                </Text>
                            </View>
                        )}

                        {!isLogin && (
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="ยืนยันรหัสผ่าน"
                                    placeholderTextColor={COLORS.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={20}
                                        color={COLORS.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                        )}

                        {isLogin && (
                            <TouchableOpacity
                                style={styles.forgotButton}
                                onPress={handleForgotPassword}
                            >
                                <Text style={styles.forgotText}>ลืมรหัสผ่าน?</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.primaryButton, loading && styles.buttonDisabled]}
                            onPress={isLogin ? handleLogin : handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Google Login */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>หรือ</Text>
                            <View style={styles.dividerLine} />
                        </View>
                        <TouchableOpacity
                            style={[styles.googleButton, loading && styles.buttonDisabled]}
                            onPress={handleGoogleLogin}
                            disabled={loading}
                        >
                            <Ionicons name="logo-google" size={20} color="#3779dbff" />
                            <Text style={styles.googleButtonText}>ดำเนินการต่อด้วย Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Switch Mode */}
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchText}>
                            {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.switchLink}>
                                {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 8,
    },
    tagline: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: COLORS.card,
        borderRadius: 20,
        padding: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    inputSuccess: {
        borderColor: COLORS.accent,
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
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: -8,
    },
    strengthBar: {
        flexDirection: 'row',
        flex: 1,
        gap: 4,
    },
    strengthSegment: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 8,
        width: 60,
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
    dividerText: {
        color: COLORS.textSecondary,
        paddingHorizontal: 16,
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    googleButtonText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    switchText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    switchLink: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 4,
    },
});

export default LoginScreen;
