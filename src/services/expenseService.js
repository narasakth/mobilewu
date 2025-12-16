/**
 * expenseService.js
 * Service layer สำหรับจัดการข้อมูลรายจ่าย
 */

import { executeQuery } from '../db/database';
import * as Crypto from 'expo-crypto';

export const EXPENSE_CATEGORIES = [
    { id: 'food', label: 'อาหาร', icon: '🍔' },
    { id: 'transport', label: 'เดินทาง', icon: '🚗' },
    { id: 'shopping', label: 'ช้อปปิ้ง', icon: '🛒' },
    { id: 'utilities', label: 'ค่าน้ำ/ค่าไฟ', icon: '💡' },
    { id: 'entertainment', label: 'บันเทิง', icon: '🎬' },
    { id: 'health', label: 'สุขภาพ', icon: '💊' },
    { id: 'other', label: 'อื่นๆ', icon: '📦' },
];

export const createExpense = async (expenseData) => {
    const id = Crypto.randomUUID();
    const dateTimestamp = expenseData.date instanceof Date ? expenseData.date.getTime() : expenseData.date;
    const now = Date.now();

    const sql = `INSERT INTO expenses (id, amount, date, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [id, expenseData.amount, dateTimestamp, expenseData.category, expenseData.note || null, now];

    try {
        await executeQuery(sql, params);
        return { id, amount: expenseData.amount, date: dateTimestamp, category: expenseData.category, note: expenseData.note || null, created_at: now };
    } catch (error) {
        console.error('Error creating expense:', error);
        throw error;
    }
};

export const getAllExpenses = async () => {
    const sql = `SELECT * FROM expenses ORDER BY date DESC, created_at DESC`;
    try {
        return await executeQuery(sql);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        throw error;
    }
};

export const getExpenseById = async (id) => {
    const sql = `SELECT * FROM expenses WHERE id = ?`;
    try {
        const results = await executeQuery(sql, [id]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Error fetching expense by ID:', error);
        throw error;
    }
};

export const updateExpense = async (id, expenseData) => {
    const dateTimestamp = expenseData.date instanceof Date ? expenseData.date.getTime() : expenseData.date;
    const sql = `UPDATE expenses SET amount = ?, date = ?, category = ?, note = ? WHERE id = ?`;
    const params = [expenseData.amount, dateTimestamp, expenseData.category, expenseData.note || null, id];

    try {
        const result = await executeQuery(sql, params);
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating expense:', error);
        throw error;
    }
};

export const deleteExpense = async (id) => {
    const sql = `DELETE FROM expenses WHERE id = ?`;
    try {
        const result = await executeQuery(sql, [id]);
        return result.changes > 0;
    } catch (error) {
        console.error('Error deleting expense:', error);
        throw error;
    }
};

export const getCategoryLabel = (categoryId) => {
    const category = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.label : categoryId;
};

export default { createExpense, getAllExpenses, getExpenseById, updateExpense, deleteExpense, getCategoryLabel, EXPENSE_CATEGORIES };
