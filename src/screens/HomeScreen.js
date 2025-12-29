/**
 * HomeScreen.js - Main landing page for AcneScan app
 * Updated with medical theme and Ionicons
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRecentAnalyses, formatDate, getStatistics } from '../services/analysisHistoryService';
import { signOut, getCurrentUser } from '../services/supabaseService';
import BottomNavigation from '../components/BottomNavigation';

// Medical theme colors
const COLORS = {
    primary: '#0066CC',      // Medical Blue
    secondary: '#00A896',    // Teal
    background: '#F8FAFC',   // Light Gray
    card: '#FFFFFF',
    text: '#1E293B',         // Dark Slate
    textSecondary: '#64748B',
    accent: '#10B981',       // Success Green
    warning: '#F59E0B',
    danger: '#EF4444',
};

const HomeScreen = ({ navigation }) => {
    const [recentAnalyses, setRecentAnalyses] = useState([]);
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ totalScans: 0, trend: 'neutral' });
    const [todayCount, setTodayCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Tips data
    const tips = [
        { icon: 'water', title: 'ดื่มน้ำให้เพียงพอ', text: 'ดื่มน้ำ 8 แก้วต่อวัน ช่วยให้ผิวชุ่มชื่น' },
        { icon: 'bed', title: 'นอนหลับให้เพียงพอ', text: 'นอน 7-8 ชั่วโมง ช่วยฟื้นฟูผิว' },
        { icon: 'nutrition', title: 'กินผักผลไม้', text: 'กินผักหลากสี ช่วยลดสิว' },
        { icon: 'sunny', title: 'ทากันแดด', text: 'ใช้ครีมกันแดด SPF30+ ทุกวัน' },
        { icon: 'hand-left', title: 'อย่าแตะหน้า', text: 'หลีกเลี่ยงการแตะหน้าบ่อยๆ' },
    ];
    const todayTip = tips[new Date().getDay() % tips.length];

    useEffect(() => {
        loadData();
        const unsubscribe = navigation.addListener('focus', loadData);

        // Load user info
        const loadUser = async () => {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        };
        loadUser();

        return unsubscribe;
    }, [navigation]);

    const handleLogout = async () => {
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

    const handleStartAnalysis = () => {
        navigation.navigate('FrontalCapture');
    };

    const handleViewHistory = () => {
        navigation.navigate('History');
    };

    const getLevelColor = (level) => {
        const colors = {
            1: COLORS.accent,
            2: '#8BC34A',
            3: COLORS.warning,
            4: '#FF9800',
            5: COLORS.danger,
        };
        return colors[level] || COLORS.primary;
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

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const loadData = async () => {
        const analyses = await getRecentAnalyses(3);
        const formattedAnalyses = analyses.map(item => ({
            ...item,
            formattedDate: formatDate(item.date),
        }));
        setRecentAnalyses(formattedAnalyses);

        const statistics = await getStatistics();
        setStats(statistics);

        const today = new Date().toDateString();
        const todayScans = analyses.filter(item =>
            new Date(item.date).toDateString() === today
        ).length;
        setTodayCount(todayScans);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            สวัสดี{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ''}
                        </Text>
                        <Text style={styles.subGreeting}>พร้อมตรวจสุขภาพผิวหรือยัง?</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
                        <View style={styles.profileAvatar}>
                            <Ionicons name="person" size={24} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Start Analysis Card */}
                <TouchableOpacity
                    style={styles.startAnalysisCard}
                    onPress={handleStartAnalysis}
                    activeOpacity={0.9}
                >
                    <View style={styles.cardGradient}>
                        <View style={styles.startAnalysisContent}>
                            <View style={styles.scanIconContainer}>
                                <Ionicons name="scan" size={40} color="#FFF" />
                            </View>
                            <View style={styles.startAnalysisTextContainer}>
                                <Text style={styles.startAnalysisTitle}>เริ่มวิเคราะห์ใหม่</Text>
                                <Text style={styles.startAnalysisSubtitle}>สแกนใบหน้าเพื่อตรวจสอบสิว</Text>
                            </View>
                        </View>
                        <View style={styles.startArrow}>
                            <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.8)" />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Ionicons name="analytics" size={24} color={COLORS.primary} />
                        <Text style={styles.statValue}>{stats.totalScans}</Text>
                        <Text style={styles.statLabel}>การสแกน</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name={getTrendIcon(stats.trend)} size={24} color={getTrendColor(stats.trend)} />
                        <Text style={[styles.statValue, { color: getTrendColor(stats.trend) }]}>
                            {getTrendLabel(stats.trend)}
                        </Text>
                        <Text style={styles.statLabel}>แนวโน้ม</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="calendar" size={24} color={COLORS.secondary} />
                        <Text style={styles.statValue}>{todayCount}</Text>
                        <Text style={styles.statLabel}>วันนี้</Text>
                    </View>
                </View>

                {/* Tips of the Day */}
                <View style={styles.tipCard}>
                    <View style={styles.tipHeader}>
                        <Ionicons name="bulb" size={20} color={COLORS.warning} />
                        <Text style={styles.tipTitle}>เคล็ดลับประจำวัน</Text>
                    </View>
                    <View style={styles.tipContent}>
                        <View style={styles.tipIconContainer}>
                            <Ionicons name={todayTip.icon} size={28} color={COLORS.primary} />
                        </View>
                        <View style={styles.tipTextContainer}>
                            <Text style={styles.tipName}>{todayTip.title}</Text>
                            <Text style={styles.tipDescription}>{todayTip.text}</Text>
                        </View>
                    </View>
                </View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 16,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subGreeting: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    profileButton: {
        padding: 4,
    },
    profileAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    startAnalysisCard: {
        marginHorizontal: 24,
        marginTop: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    cardGradient: {
        backgroundColor: COLORS.primary,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    startAnalysisContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    scanIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    startAnalysisTextContainer: {
        flex: 1,
    },
    startAnalysisTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
    },
    startAnalysisSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    startArrow: {
        marginLeft: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 24,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    },
    recentSection: {
        marginTop: 24,
        paddingHorizontal: 24,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    recentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    viewAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    activityIndicator: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    activityInfo: {
        flex: 1,
    },
    activityLevel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    activityDate: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    emptyActivity: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: COLORS.card,
        borderRadius: 16,
    },
    emptyActivityText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginTop: 16,
    },
    emptyActivityHint: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingBottom: 24,
        backgroundColor: COLORS.card,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    navItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
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
    tipCard: {
        backgroundColor: COLORS.card,
        marginHorizontal: 24,
        marginTop: 24,
        borderRadius: 16,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.warning,
        marginLeft: 8,
    },
    tipContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tipIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    tipName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    tipDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
});

export default HomeScreen;
