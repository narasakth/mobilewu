/**
 * TransactionHistoryScreen.js - หน้าประวัติการเคลื่อนไหว
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getAllTransactions, getSummaryByType } from '../services/transactionService';
import { deleteExpense } from '../services/expenseService';
import { deleteIncome } from '../services/incomeService';

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
    const isIncome = transaction.type === 'income';
    const formatDate = (timestamp) => new Date(timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const formatAmount = (amount) => amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <View style={styles.transactionItem}>
            <View style={styles.leftSection}>
                <Text style={styles.categoryIcon}>{transaction.categoryInfo?.icon || '📋'}</Text>
                <View style={styles.categoryInfo}>
                    <Text style={styles.categoryLabel}>{transaction.categoryInfo?.label || transaction.category}</Text>
                    <Text style={styles.dateText}>{formatDate(transaction.date)}</Text>
                </View>
            </View>
            <View style={styles.centerSection}>
                <Text style={[styles.amountText, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
                    {isIncome ? '+' : '-'}฿{formatAmount(transaction.amount)}
                </Text>
                {transaction.note && <Text style={styles.noteText} numberOfLines={1}>{transaction.note}</Text>}
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => onEdit(transaction)}><Text style={styles.actionBtnText}>✏️</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(transaction)}><Text style={styles.actionBtnText}>🗑️</Text></TouchableOpacity>
            </View>
        </View>
    );
};

const TransactionHistoryScreen = ({ navigation }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = useCallback(async () => {
        try {
            const data = await getAllTransactions();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchTransactions);
        return unsubscribe;
    }, [navigation, fetchTransactions]);

    const handleRefresh = () => { setRefreshing(true); fetchTransactions(); };

    const handleEdit = (transaction) => {
        if (transaction.type === 'expense') navigation.navigate('EditExpense', { transaction });
        else navigation.navigate('EditIncome', { transaction });
    };

    const handleDelete = (transaction) => {
        const typeLabel = transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย';
        const amount = transaction.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 });
        Alert.alert('ยืนยันการลบ', `คุณต้องการลบ${typeLabel} ฿${amount} ใช่หรือไม่?`, [
            { text: 'ยกเลิก', style: 'cancel' },
            {
                text: 'ลบ', style: 'destructive', onPress: async () => {
                    try {
                        if (transaction.type === 'expense') await deleteExpense(transaction.id);
                        else await deleteIncome(transaction.id);
                        Alert.alert('สำเร็จ', 'ลบรายการเรียบร้อย');
                        fetchTransactions();
                    } catch (error) {
                        console.error('Error deleting transaction:', error);
                        Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลบรายการได้');
                    }
                }
            }
        ]);
    };

    const summary = getSummaryByType(transactions);

    if (loading) {
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3498db" /><Text style={styles.loadingText}>กำลังโหลด...</Text></View>;
    }

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}><Text style={styles.emptyIcon}>📋</Text><Text style={styles.emptyText}>ยังไม่มีรายการ</Text><Text style={styles.emptySubtext}>บันทึกรายรับ/รายจ่ายเพื่อดูประวัติ</Text></View>
    );

    const groupByDate = (txs) => {
        const groups = {};
        txs.forEach(t => { const dateKey = new Date(t.date).toDateString(); if (!groups[dateKey]) groups[dateKey] = []; groups[dateKey].push(t); });
        return Object.entries(groups).map(([date, items]) => ({ date, dateDisplay: new Date(date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' }), items }));
    };

    const groupedTransactions = groupByDate(transactions);

    return (
        <View style={styles.container}>
            <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}><Text style={styles.summaryLabel}>รายรับ</Text><Text style={[styles.summaryValue, styles.incomeAmount]}>+฿{summary.totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text></View>
                <View style={styles.summaryItem}><Text style={styles.summaryLabel}>รายจ่าย</Text><Text style={[styles.summaryValue, styles.expenseAmount]}>-฿{summary.totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text></View>
                <View style={styles.summaryItem}><Text style={styles.summaryLabel}>คงเหลือ</Text><Text style={[styles.summaryValue, summary.balance >= 0 ? styles.incomeAmount : styles.expenseAmount]}>฿{summary.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text></View>
            </View>

            <FlatList
                data={groupedTransactions}
                keyExtractor={(item) => item.date}
                renderItem={({ item: group }) => (
                    <View style={styles.dateGroup}>
                        <View style={styles.dateHeader}><Text style={styles.dateHeaderText}>{group.dateDisplay}</Text></View>
                        {group.items.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} onEdit={handleEdit} onDelete={handleDelete} />)}
                    </View>
                )}
                ListEmptyComponent={renderEmptyList}
                contentContainerStyle={transactions.length === 0 ? styles.emptyListContent : styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3498db']} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
    summaryContainer: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    summaryValue: { fontSize: 14, fontWeight: 'bold' },
    listContent: { paddingBottom: 20 },
    emptyListContent: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 18, color: '#888', marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: '#aaa' },
    dateGroup: { marginTop: 8 },
    dateHeader: { backgroundColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 8 },
    dateHeaderText: { fontSize: 13, fontWeight: '600', color: '#666' },
    transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    categoryIcon: { fontSize: 28, marginRight: 12 },
    categoryInfo: { flex: 1 },
    categoryLabel: { fontSize: 15, fontWeight: '500', color: '#333', marginBottom: 2 },
    dateText: { fontSize: 12, color: '#999' },
    centerSection: { alignItems: 'flex-end', flex: 1 },
    amountText: { fontSize: 14, fontWeight: 'bold' },
    incomeAmount: { color: '#27ae60' },
    expenseAmount: { color: '#e74c3c' },
    noteText: { fontSize: 11, color: '#999', marginTop: 2, maxWidth: 100 },
    actionButtons: { flexDirection: 'row', marginLeft: 8 },
    actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
    editBtn: { backgroundColor: '#f0f0f0' },
    deleteBtn: { backgroundColor: '#fee' },
    actionBtnText: { fontSize: 14 },
});

export default TransactionHistoryScreen;
