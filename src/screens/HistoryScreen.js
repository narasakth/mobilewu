/**
 * HistoryScreen.js - Display analysis history
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
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHistory, getStatistics, formatDate, deleteAnalysis } from '../services/analysisHistoryService';
import BottomNavigation from '../components/BottomNavigation';

const HistoryScreen = ({ navigation }) => {
    const [historyData, setHistoryData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statistics, setStatistics] = useState({
        totalScans: 0,
        averageLevel: 0,
        trend: 'neutral',
    });

    // Load history when screen comes into focus
    useEffect(() => {
        const loadHistory = async () => {
            const history = await getHistory();
            const stats = await getStatistics();

            const formattedHistory = history.map(item => ({
                ...item,
                formattedDate: formatDate(item.date),
            }));

            setHistoryData(formattedHistory);
            setFilteredData(formattedHistory);
            setStatistics(stats);
        };

        loadHistory();

        const unsubscribe = navigation.addListener('focus', loadHistory);
        return unsubscribe;
    }, [navigation]);

    // Filter history based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredData(historyData);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = historyData.filter(item => {
                const dateStr = item.formattedDate?.date?.toLowerCase() || '';
                const levelStr = `ระดับ ${item.severityLevel}`;
                return dateStr.includes(query) || levelStr.includes(query);
            });
            setFilteredData(filtered);
        }
    }, [searchQuery, historyData]);

    const handleDelete = (item) => {
        Alert.alert(
            'ลบประวัติ',
            `ต้องการลบประวัติวันที่ ${item.formattedDate?.date || ''} หรือไม่?`,
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ลบ',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await deleteAnalysis(item.id);
                        if (success) {
                            const newData = historyData.filter(h => h.id !== item.id);
                            setHistoryData(newData);
                            const stats = await getStatistics();
                            setStatistics(stats);
                        }
                    }
                }
            ]
        );
    };

    const getLevelColor = (level) => {
        const colors = {
            1: '#4CAF50',
            2: '#8BC34A',
            3: '#FFC107',
            4: '#FF9800',
            5: '#F44336',
        };
        return colors[level] || '#2196F3';
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'improving': return { icon: '↓', color: '#4CAF50' };
            case 'worsening': return { icon: '↑', color: '#F44336' };
            default: return { icon: '-', color: '#666' };
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>ประวัติการวิเคราะห์</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{statistics.totalScans}</Text>
                        <Text style={styles.summaryLabel}>การสแกน</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{statistics.averageLevel || '-'}</Text>
                        <Text style={styles.summaryLabel}>ค่าเฉลี่ย</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: getTrendIcon(statistics.trend).color }]}>
                            {getTrendIcon(statistics.trend).icon}
                        </Text>
                        <Text style={styles.summaryLabel}>แนวโน้ม</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="ค้นหาตามวันที่ หรือ ระดับ..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* History List */}
                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>ประวัติการวิเคราะห์ ({filteredData.length})</Text>

                    {filteredData.length > 0 ? (
                        filteredData.map((item) => (
                            <View key={item.id} style={styles.historyItemContainer}>
                                <TouchableOpacity
                                    style={styles.historyItem}
                                    onPress={() => navigation.navigate('HistoryDetail', { analysis: item })}
                                >
                                    <View style={styles.historyThumbnail}>
                                        <View style={[
                                            styles.thumbnailPlaceholder,
                                            { backgroundColor: getLevelColor(item.severityLevel) }
                                        ]}>
                                            <Text style={styles.thumbnailLevel}>{item.severityLevel}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.historyInfo}>
                                        <View style={styles.historyHeader}>
                                            <Text style={styles.historyDate}>{item.formattedDate?.date || '-'}</Text>
                                            <View style={[
                                                styles.levelBadge,
                                                { backgroundColor: `${getLevelColor(item.severityLevel)}20` }
                                            ]}>
                                                <Text style={[
                                                    styles.levelBadgeText,
                                                    { color: getLevelColor(item.severityLevel) }
                                                ]}>
                                                    ระดับ {item.severityLevel}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.historyTime}>{item.formattedDate?.time || ''}</Text>
                                        <Text style={styles.historyLabel}>{item.totalSpots || 0} จุด</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(item)}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📊</Text>
                            <Text style={styles.emptyTitle}>ยังไม่มีประวัติ</Text>
                            <Text style={styles.emptyText}>
                                เริ่มสแกนครั้งแรกเพื่อดูประวัติของคุณที่นี่
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyButton}
                                onPress={() => navigation.navigate('FrontalCapture')}
                            >
                                <Text style={styles.emptyButtonText}>เริ่มสแกน</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            <BottomNavigation />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
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
        fontSize: 18,
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
        paddingBottom: 100,
    },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A2E',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: '#EEE',
        marginHorizontal: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A2E',
    },
    historySection: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A2E',
        marginBottom: 16,
    },
    historyItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    deleteButton: {
        padding: 10,
        marginLeft: 8,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    historyThumbnail: {
        marginRight: 16,
    },
    thumbnailImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
    },
    thumbnailPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailLevel: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    historyInfo: {
        flex: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    historyDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A2E',
    },
    levelBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    levelBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    historyTime: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    historyLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    historyArrow: {
        fontSize: 24,
        color: '#CCC',
        marginLeft: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A1A2E',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    emptyButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
    },
    navIcon: {
        fontSize: 24,
        opacity: 0.5,
    },
    navIconActive: {
        opacity: 1,
    },
    navLabel: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    navLabelActive: {
        color: '#2196F3',
        fontWeight: '600',
    },
});

export default HistoryScreen;
