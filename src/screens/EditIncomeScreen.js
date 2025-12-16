/**
 * EditIncomeScreen.js - หน้าแก้ไขรายรับ
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateIncome, INCOME_CATEGORIES } from '../services/incomeService';

const EditIncomeScreen = ({ navigation, route }) => {
    const { transaction } = route.params;
    const [amount, setAmount] = useState(transaction.amount.toString());
    const [date, setDate] = useState(new Date(transaction.date));
    const [category, setCategory] = useState(transaction.category);
    const [note, setNote] = useState(transaction.note || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setDate(selectedDate);
    };

    const handleCategorySelect = (cat) => { setCategory(cat.id); setShowCategoryPicker(false); };
    const formatDate = (dateObj) => dateObj.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    const getCategoryDisplay = () => { const cat = INCOME_CATEGORIES.find(c => c.id === category); return cat ? `${cat.icon} ${cat.label}` : 'เลือกหมวดหมู่'; };

    const validateForm = () => {
        if (!amount.trim()) { Alert.alert('ข้อผิดพลาด', 'กรุณากรอกจำนวนเงิน'); return false; }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) { Alert.alert('ข้อผิดพลาด', 'จำนวนเงินต้องเป็นตัวเลขที่มากกว่า 0'); return false; }
        if (!category) { Alert.alert('ข้อผิดพลาด', 'กรุณาเลือกหมวดหมู่'); return false; }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            await updateIncome(transaction.id, { amount: parseFloat(amount), date, category, note: note.trim() || null });
            Alert.alert('สำเร็จ', 'แก้ไขรายรับเรียบร้อย', [{ text: 'ตกลง', onPress: () => navigation.goBack() }]);
        } catch (error) {
            console.error('Error updating income:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
        } finally { setSubmitting(false); }
    };

    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity style={[styles.categoryItem, category === item.id && styles.categoryItemActive]} onPress={() => handleCategorySelect(item)}>
            <Text style={styles.categoryIcon}>{item.icon}</Text>
            <Text style={[styles.categoryLabel, category === item.id && styles.categoryLabelActive]}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.section}>
                    <Text style={styles.label}>จำนวนเงิน (บาท) *</Text>
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>฿</Text>
                        <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" editable={!submitting} />
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={styles.label}>วันที่ *</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)} disabled={submitting}>
                        <Text style={styles.dateButtonText}>{formatDate(date)}</Text><Text style={styles.dateIcon}>📅</Text>
                    </TouchableOpacity>
                    {showDatePicker && <DateTimePicker value={date} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} maximumDate={new Date()} />}
                </View>
                <View style={styles.section}>
                    <Text style={styles.label}>หมวดหมู่ *</Text>
                    <TouchableOpacity style={[styles.categoryButton, category && styles.categoryButtonSelected]} onPress={() => setShowCategoryPicker(true)} disabled={submitting}>
                        <Text style={styles.categoryButtonText}>{getCategoryDisplay()}</Text><Text style={styles.dropdownIcon}>▼</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.section}>
                    <Text style={styles.label}>บันทึกช่วยจำ</Text>
                    <TextInput style={[styles.input, styles.noteInput]} value={note} onChangeText={setNote} placeholder="เพิ่มรายละเอียด (ไม่บังคับ)" multiline numberOfLines={3} editable={!submitting} />
                </View>
                <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
                    <Text style={styles.submitButtonText}>{submitting ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={submitting}>
                    <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                </TouchableOpacity>
            </ScrollView>
            <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}><Text style={styles.modalTitle}>เลือกหมวดหมู่</Text><TouchableOpacity onPress={() => setShowCategoryPicker(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity></View>
                        <FlatList data={INCOME_CATEGORIES} keyExtractor={(item) => item.id} renderItem={renderCategoryItem} numColumns={2} contentContainerStyle={styles.categoryList} />
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' }, scrollView: { flex: 1 }, scrollContent: { padding: 16, paddingBottom: 40 }, section: { marginBottom: 20 }, label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }, input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: '#333' }, amountContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }, currencySymbol: { fontSize: 24, fontWeight: 'bold', color: '#27ae60', paddingLeft: 16 }, amountInput: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#333', paddingHorizontal: 12, paddingVertical: 16 }, dateButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14 }, dateButtonText: { fontSize: 16, color: '#333' }, dateIcon: { fontSize: 20 }, categoryButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14 }, categoryButtonSelected: { borderColor: '#27ae60' }, categoryButtonText: { fontSize: 16, color: '#333' }, dropdownIcon: { fontSize: 12, color: '#999' }, noteInput: { minHeight: 80, textAlignVertical: 'top' }, submitButton: { backgroundColor: '#27ae60', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 }, submitButtonDisabled: { backgroundColor: '#bdc3c7' }, submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' }, cancelButton: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 }, cancelButtonText: { color: '#666', fontSize: 16 }, modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30, maxHeight: '70%' }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }, modalTitle: { fontSize: 18, fontWeight: '600', color: '#333' }, modalClose: { fontSize: 24, color: '#999', padding: 4 }, categoryList: { padding: 12 }, categoryItem: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 6, padding: 16, backgroundColor: '#f8f8f8', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' }, categoryItemActive: { backgroundColor: '#e8f5e9', borderColor: '#27ae60' }, categoryIcon: { fontSize: 32, marginBottom: 8 }, categoryLabel: { fontSize: 14, color: '#666', textAlign: 'center' }, categoryLabelActive: { color: '#27ae60', fontWeight: '600' },
});

export default EditIncomeScreen;
