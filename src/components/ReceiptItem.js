/**
 * ReceiptItem.js
 * Component สำหรับแสดงรายการใบเสร็จ
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ReceiptItem = ({ receipt, onPress, onStatusChange }) => {
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formatAmount = (amount) => {
        return amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return { backgroundColor: '#27ae60', label: 'สำเร็จ' };
            case 'cancelled': return { backgroundColor: '#e74c3c', label: 'ยกเลิก' };
            default: return { backgroundColor: '#f39c12', label: 'รอดำเนินการ' };
        }
    };

    const statusInfo = getStatusStyle(receipt.status);
    const isIncome = receipt.type === 'income';

    return (
        <TouchableOpacity style={styles.container} onPress={() => onPress?.(receipt)} activeOpacity={0.7}>
            <View style={styles.leftSection}>
                <Text style={styles.receiptNo}>{receipt.receipt_no}</Text>
                <Text style={styles.date}>{formatDate(receipt.created_at)}</Text>
                {receipt.customer_name && <Text style={styles.customer}>{receipt.customer_name}</Text>}
            </View>

            <View style={styles.rightSection}>
                <Text style={[styles.amount, isIncome ? styles.incomeAmount : styles.expenseAmount]}>
                    {isIncome ? '+' : '-'}฿{formatAmount(receipt.amount)}
                </Text>
                <TouchableOpacity
                    style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}
                    onPress={() => onStatusChange?.(receipt.id, receipt.status === 'pending' ? 'completed' : 'pending')}
                >
                    <Text style={styles.statusText}>{statusInfo.label}</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginHorizontal: 12, marginVertical: 4, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    leftSection: { flex: 1 },
    receiptNo: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
    date: { fontSize: 12, color: '#888' },
    customer: { fontSize: 13, color: '#666', marginTop: 4 },
    rightSection: { alignItems: 'flex-end' },
    amount: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    incomeAmount: { color: '#27ae60' },
    expenseAmount: { color: '#e74c3c' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});

export default ReceiptItem;
