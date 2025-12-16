/**
 * AddReceiptScreen.js - หน้าเพิ่มใบเสร็จ
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { createReceipt } from '../services/receiptService';

const AddReceiptScreen = ({ navigation }) => {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const validateForm = () => {
        if (!amount.trim()) { Alert.alert('ข้อผิดพลาด', 'กรุณากรอกจำนวนเงิน'); return false; }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) { Alert.alert('ข้อผิดพลาด', 'จำนวนเงินต้องเป็นตัวเลขที่มากกว่า 0'); return false; }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            await createReceipt({ type, amount: parseFloat(amount), customer_name: customerName.trim() || null });
            Alert.alert('สำเร็จ', 'บันทึกใบเสร็จเรียบร้อย', [{ text: 'ตกลง', onPress: () => navigation.goBack() }]);
        } catch (error) {
            console.error('Error creating receipt:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {/* ประเภท */}
                <View style={styles.section}>
                    <Text style={styles.label}>ประเภท *</Text>
                    <View style={styles.typeContainer}>
                        <TouchableOpacity style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]} onPress={() => setType('income')}>
                            <Text style={[styles.typeButtonText, type === 'income' && styles.typeButtonTextActive]}>รายรับ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.typeButton, type === 'expense' && styles.typeButtonActiveExpense]} onPress={() => setType('expense')}>
                            <Text style={[styles.typeButtonText, type === 'expense' && styles.typeButtonTextActive]}>รายจ่าย</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* จำนวนเงิน */}
                <View style={styles.section}>
                    <Text style={styles.label}>จำนวนเงิน (บาท) *</Text>
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>฿</Text>
                        <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" editable={!submitting} />
                    </View>
                </View>

                {/* ชื่อลูกค้า */}
                <View style={styles.section}>
                    <Text style={styles.label}>ชื่อลูกค้า / รายละเอียด</Text>
                    <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="ระบุชื่อ (ไม่บังคับ)" editable={!submitting} />
                </View>

                {/* ปุ่มบันทึก */}
                <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
                    <Text style={styles.submitButtonText}>{submitting ? 'กำลังบันทึก...' : '💾 บันทึกใบเสร็จ'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    section: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: '#333' },
    typeContainer: { flexDirection: 'row', gap: 12 },
    typeButton: { flex: 1, paddingVertical: 14, borderRadius: 8, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', backgroundColor: '#fff' },
    typeButtonActiveIncome: { borderColor: '#27ae60', backgroundColor: '#e8f5e9' },
    typeButtonActiveExpense: { borderColor: '#e74c3c', backgroundColor: '#fdecea' },
    typeButtonText: { fontSize: 16, color: '#666' },
    typeButtonTextActive: { fontWeight: '600', color: '#333' },
    amountContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
    currencySymbol: { fontSize: 24, fontWeight: 'bold', color: '#3498db', paddingLeft: 16 },
    amountInput: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#333', paddingHorizontal: 12, paddingVertical: 16 },
    submitButton: { backgroundColor: '#3498db', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    submitButtonDisabled: { backgroundColor: '#bdc3c7' },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});

export default AddReceiptScreen;
