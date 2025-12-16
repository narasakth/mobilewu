/**
 * HomeScreen.js - หน้าหลัก Dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { getAllReceipts, updateReceiptStatus } from '../services/receiptService';
import { getDashboardSummary } from '../services/transactionService';
import ReceiptItem from '../components/ReceiptItem';

const HomeScreen = ({ navigation }) => {
    const [receipts, setReceipts] = useState([]);
    const [dashboard, setDashboard] = useState({ totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [receiptsData, dashboardData] = await Promise.all([getAllReceipts(), getDashboardSummary()]);
            setReceipts(receiptsData);
            setDashboard(dashboardData);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchData);
        return unsubscribe;
    }, [navigation, fetchData]);

    const handleRefresh = () => { setRefreshing(true); fetchData(); };

    const handleStatusChange = async (id, status) => {
        try {
            await updateReceiptStatus(id, status);
            fetchData();
            Alert.alert('สำเร็จ', 'อัปเดตสถานะเรียบร้อย');
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัปเดตสถานะได้');
        }
    };

    const handleReceiptPress = (receipt) => { console.log('Receipt pressed:', receipt.id); };

    const formatMoney = (amount) => amount.toLocaleString('th-TH', { minimumFractionDigits: 2 });
    const getCurrentMonthName = () => new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>ไม่มีรายการใบเสร็จ</Text>
            <Text style={styles.emptySubtext}>กดปุ่ม "+" เพื่อเพิ่มรายการใหม่</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>กำลังโหลด...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Dashboard - ยอดคงเหลือ */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>ยอดคงเหลือปัจจุบัน</Text>
                <Text style={styles.balanceValue}>฿{formatMoney(dashboard.totalBalance)}</Text>
            </View>

            {/* Monthly Summary */}
            <View style={styles.monthlyCard}>
                <Text style={styles.monthlyTitle}>📊 สรุปเดือน {getCurrentMonthName()}</Text>
                <View style={styles.monthlyRow}>
                    <View style={styles.monthlyItem}>
                        <Text style={styles.monthlyLabel}>รายรับ</Text>
                        <Text style={[styles.monthlyValue, styles.incomeText]}>+฿{formatMoney(dashboard.monthlyIncome)}</Text>
                    </View>
                    <View style={styles.monthlyDivider} />
                    <View style={styles.monthlyItem}>
                        <Text style={styles.monthlyLabel}>รายจ่าย</Text>
                        <Text style={[styles.monthlyValue, styles.expenseText]}>-฿{formatMoney(dashboard.monthlyExpense)}</Text>
                    </View>
                </View>
            </View>

            {/* Link to History */}
            <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('TransactionHistory')}>
                <Text style={styles.historyLinkText}>📋 ดูประวัติการเคลื่อนไหวทั้งหมด</Text>
                <Text style={styles.historyLinkArrow}>›</Text>
            </TouchableOpacity>

            {/* Receipt List */}
            <FlatList
                data={receipts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ReceiptItem receipt={item} onPress={handleReceiptPress} onStatusChange={handleStatusChange} />
                )}
                ListEmptyComponent={renderEmptyList}
                contentContainerStyle={receipts.length === 0 ? styles.emptyListContent : styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3498db']} />}
            />

            {/* FAB Buttons */}
            <View style={styles.fabContainer}>
                <TouchableOpacity style={[styles.fab, styles.fabIncome]} onPress={() => navigation.navigate('AddIncome')}>
                    <Text style={styles.fabText}>💵</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fab, styles.fabExpense]} onPress={() => navigation.navigate('AddExpense')}>
                    <Text style={styles.fabText}>💰</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fab, styles.fabReceipt]} onPress={() => navigation.navigate('AddReceipt')}>
                    <Text style={styles.fabText}>➕</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
    balanceCard: { backgroundColor: '#3498db', paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' },
    balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
    balanceValue: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    monthlyCard: { backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    monthlyTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
    monthlyRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    monthlyItem: { flex: 1, alignItems: 'center' },
    monthlyDivider: { width: 1, height: 40, backgroundColor: '#eee' },
    monthlyLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    monthlyValue: { fontSize: 18, fontWeight: 'bold' },
    incomeText: { color: '#27ae60' },
    expenseText: { color: '#e74c3c' },
    historyLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    historyLinkText: { fontSize: 14, color: '#3498db' },
    historyLinkArrow: { fontSize: 20, color: '#3498db' },
    listContent: { paddingVertical: 8, paddingBottom: 100 },
    emptyListContent: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 18, color: '#888', marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: '#aaa' },
    fabContainer: { position: 'absolute', right: 16, bottom: 16, alignItems: 'center' },
    fab: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    fabIncome: { backgroundColor: '#27ae60' },
    fabExpense: { backgroundColor: '#e74c3c' },
    fabReceipt: { backgroundColor: '#3498db' },
    fabText: { fontSize: 24 },
});

export default HomeScreen;
