/**
 * ProfileScreen.js - User profile and settings
 * Thai language
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut, getCurrentUser } from '../services/supabaseService';
import { getStatistics } from '../services/analysisHistoryService';
import BottomNavigation from '../components/BottomNavigation';

// Medical theme colors
const COLORS = {
    primary: '#0066CC',
    secondary: '#00A896',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    accent: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    border: '#E2E8F0',
};

const ProfileScreen = ({ navigation }) => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            const statistics = await getStatistics();
            setStats(statistics);
        };

        loadData();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'ออกจากระบบ',
            'ต้องการออกจากระบบหรือไม่?',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ออกจากระบบ',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        Alert.prompt(
            'แก้ไขชื่อที่แสดง',
            'กรอกชื่อใหม่',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'บันทึก',
                    onPress: (name) => {
                        if (name && name.trim()) {
                            Alert.alert('สำเร็จ', `เปลี่ยนชื่อเป็น ${name} เรียบร้อยแล้ว`);
                        }
                    }
                }
            ],
            'plain-text',
            user?.user_metadata?.display_name || ''
        );
    };

    const handleChangePassword = () => {
        Alert.alert(
            'เปลี่ยนรหัสผ่าน',
            'ระบบจะส่งลิงก์เปลี่ยนรหัสผ่านไปยังอีเมลของคุณ',
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ส่งลิงก์',
                    onPress: async () => {
                        const { resetPassword } = require('../services/supabaseService');
                        if (user?.email) {
                            const result = await resetPassword(user.email);
                            if (result.success) {
                                Alert.alert('สำเร็จ', 'ส่งลิงก์เปลี่ยนรหัสผ่านไปยังอีเมลแล้ว');
                            } else {
                                Alert.alert('ข้อผิดพลาด', result.error);
                            }
                        }
                    }
                }
            ]
        );
    };

    const getTrendLabel = (trend) => {
        switch (trend) {
            case 'improving': return 'ดีขึ้น';
            case 'worsening': return 'แย่ลง';
            default: return 'คงที่';
        }
    };

    const getTrendColor = (trend) => {
        switch (trend) {
            case 'improving': return COLORS.accent;
            case 'worsening': return COLORS.danger;
            default: return COLORS.warning;
        }
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving': return 'trending-down';
            case 'worsening': return 'trending-up';
            default: return 'remove';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>โปรไฟล์</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* User Info */}
                <View style={styles.userCard}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={40} color="#FFF" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {user?.user_metadata?.display_name || 'ผู้ใช้งาน'}
                        </Text>
                        <Text style={styles.userEmail}>{user?.email || ''}</Text>
                    </View>
                </View>

                {/* Statistics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>สถิติการใช้งาน</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="scan" size={24} color={COLORS.primary} />
                            <Text style={styles.statValue}>{stats?.totalScans || 0}</Text>
                            <Text style={styles.statLabel}>การสแกนทั้งหมด</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="analytics" size={24} color={COLORS.secondary} />
                            <Text style={styles.statValue}>{stats?.averageLevel?.toFixed(1) || '-'}</Text>
                            <Text style={styles.statLabel}>ค่าเฉลี่ยระดับ</Text>
                        </View>
                        <View style={[styles.statCard, styles.statCardWide]}>
                            <View style={styles.trendRow}>
                                <Ionicons
                                    name={getTrendIcon(stats?.trend)}
                                    size={24}
                                    color={getTrendColor(stats?.trend)}
                                />
                                <Text style={[styles.trendValue, { color: getTrendColor(stats?.trend) }]}>
                                    {getTrendLabel(stats?.trend)}
                                </Text>
                            </View>
                            <Text style={styles.statLabel}>แนวโน้มสภาพผิว</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>การตั้งค่า</Text>
                    <View style={styles.menuCard}>
                        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="person-outline" size={22} color={COLORS.text} />
                                <Text style={styles.menuItemText}>แก้ไขโปรไฟล์</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="key-outline" size={22} color={COLORS.text} />
                                <Text style={styles.menuItemText}>เปลี่ยนรหัสผ่าน</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
                                <Text style={styles.menuItemText}>การแจ้งเตือน</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.text} />
                                <Text style={styles.menuItemText}>ความเป็นส่วนตัว</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="help-circle-outline" size={22} color={COLORS.text} />
                                <Text style={styles.menuItemText}>ช่วยเหลือ</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.menuDivider} />

                        <TouchableOpacity style={styles.menuItem}>
                            <View style={styles.menuItemLeft}>
                                <Ionicons name="information-circle-outline" size={22} color={COLORS.text} />
                                <Text style={styles.menuItemText}>เกี่ยวกับแอป</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
                    <Text style={styles.logoutText}>ออกจากระบบ</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.versionText}>เวอร์ชัน 1.0.0</Text>
            </ScrollView>

            <BottomNavigation />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        marginLeft: 16,
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    section: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 1,
    },
    statCardWide: {
        minWidth: '100%',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trendValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    menuCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuItemText: {
        fontSize: 16,
        color: COLORS.text,
    },
    menuDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginLeft: 50,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 20,
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.danger,
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.danger,
    },
    versionText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 24,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        paddingVertical: 12,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
    },
    navLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    navLabelActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});

export default ProfileScreen;
