/**
 * HistoryDetailScreen.js - View history analysis detail
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

const HistoryDetailScreen = ({ route, navigation }) => {
    const { analysis } = route.params;

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

    const getLevelLabel = (level) => {
        const labels = {
            1: 'ดีมาก',
            2: 'ดี',
            3: 'ปานกลาง',
            4: 'มาก',
            5: 'รุนแรง',
        };
        return labels[level] || 'ไม่ทราบ';
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
                    <Text style={styles.headerTitle}>รายละเอียดการวิเคราะห์</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Severity Card */}
                <View style={[styles.severityCard, { backgroundColor: getLevelColor(analysis.severityLevel) }]}>
                    <Text style={styles.severityLevel}>ระดับ {analysis.severityLevel}</Text>
                    <Text style={styles.severityLabel}>{getLevelLabel(analysis.severityLevel)}</Text>
                </View>

                {/* Date Info */}
                <View style={styles.dateCard}>
                    <View style={styles.dateRow}>
                        <Ionicons name="calendar" size={20} color={COLORS.primary} />
                        <Text style={styles.dateText}>
                            {analysis.formattedDate?.date || new Date(analysis.date).toLocaleDateString('th-TH')}
                        </Text>
                    </View>
                    <View style={styles.dateRow}>
                        <Ionicons name="time" size={20} color={COLORS.secondary} />
                        <Text style={styles.dateText}>
                            {analysis.formattedDate?.time || new Date(analysis.date).toLocaleTimeString('th-TH')}
                        </Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ผลการวิเคราะห์</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Ionicons name="apps" size={24} color={COLORS.primary} />
                            <Text style={styles.statValue}>{analysis.totalSpots || 0}</Text>
                            <Text style={styles.statLabel}>จุดทั้งหมด</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="flame" size={24} color={COLORS.danger} />
                            <Text style={styles.statValue}>{analysis.spots?.inflamed || 0}</Text>
                            <Text style={styles.statLabel}>สิวอักเสบ</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="ellipse" size={24} color={COLORS.warning} />
                            <Text style={styles.statValue}>{analysis.spots?.clogged || 0}</Text>
                            <Text style={styles.statLabel}>สิวอุดตัน</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="bandage" size={24} color={COLORS.textSecondary} />
                            <Text style={styles.statValue}>{analysis.spots?.scars || 0}</Text>
                            <Text style={styles.statLabel}>รอยสิว</Text>
                        </View>
                    </View>
                </View>

                {/* Tips */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>คำแนะนำ</Text>
                    <View style={styles.tipCard}>
                        <Ionicons name="bulb-outline" size={24} color={COLORS.warning} />
                        <Text style={styles.tipText}>
                            {analysis.severityLevel <= 2
                                ? 'สภาพผิวดี! รักษาความสะอาดและดูแลผิวต่อไป'
                                : analysis.severityLevel <= 3
                                    ? 'สภาพผิวปานกลาง ควรทำความสะอาดผิวอย่างสม่ำเสมอ'
                                    : 'แนะนำให้ปรึกษาแพทย์ผิวหนังเพื่อการรักษาที่เหมาะสม'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 40,
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
    severityCard: {
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    severityLevel: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    severityLabel: {
        fontSize: 18,
        color: '#FFF',
        marginTop: 4,
    },
    dateCard: {
        backgroundColor: COLORS.card,
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        fontSize: 14,
        color: COLORS.text,
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
        width: '47%',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 1,
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
    tipCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 22,
    },
});

export default HistoryDetailScreen;
