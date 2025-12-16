/**
 * incomeService.js
 * Service layer สำหรับจัดการข้อมูลรายรับ
 */

import { executeQuery } from '../db/database';
import * as Crypto from 'expo-crypto';

export const INCOME_CATEGORIES = [
    { id: 'salary', label: 'เงินเดือน', icon: '💼' },
    { id: 'bonus', label: 'โบนัส', icon: '🎁' },
    { id: 'freelance', label: 'รายได้เสริม', icon: '💻' },
    { id: 'investment', label: 'การลงทุน', icon: '📈' },
    { id: 'gift', label: 'ของขวัญ/ได้รับ', icon: '🎀' },
    { id: 'refund', label: 'เงินคืน', icon: '💵' },
    { id: 'other', label: 'อื่นๆ', icon: '📦' },
];

export const createIncome = async (incomeData) => {
    const id = Crypto.randomUUID();
    const dateTimestamp = incomeData.date instanceof Date ? incomeData.date.getTime() : incomeData.date;
    const now = Date.now();

    const sql = `INSERT INTO incomes (id, amount, date, category, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [id, incomeData.amount, dateTimestamp, incomeData.category, incomeData.note || null, now];

    try {
        await executeQuery(sql, params);
        return { id, amount: incomeData.amount, date: dateTimestamp, category: incomeData.category, note: incomeData.note || null, created_at: now };
    } catch (error) {
        console.error('Error creating income:', error);
        throw error;
    }
};

export const getAllIncomes = async () => {
    const sql = `SELECT * FROM incomes ORDER BY date DESC, created_at DESC`;
    try {
        return await executeQuery(sql);
    } catch (error) {
        console.error('Error fetching incomes:', error);
        throw error;
    }
};

export const getIncomeById = async (id) => {
    const sql = `SELECT * FROM incomes WHERE id = ?`;
    try {
        const results = await executeQuery(sql, [id]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error('Error fetching income by ID:', error);
        throw error;
    }
};

export const updateIncome = async (id, incomeData) => {
    const dateTimestamp = incomeData.date instanceof Date ? incomeData.date.getTime() : incomeData.date;
    const sql = `UPDATE incomes SET amount = ?, date = ?, category = ?, note = ? WHERE id = ?`;
    const params = [incomeData.amount, dateTimestamp, incomeData.category, incomeData.note || null, id];

    try {
        const result = await executeQuery(sql, params);
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating income:', error);
        throw error;
    }
};

export const deleteIncome = async (id) => {
    const sql = `DELETE FROM incomes WHERE id = ?`;
    try {
        const result = await executeQuery(sql, [id]);
        return result.changes > 0;
    } catch (error) {
        console.error('Error deleting income:', error);
        throw error;
    }
};

export const getCategoryLabel = (categoryId) => {
    const category = INCOME_CATEGORIES.find(c => c.id === categoryId);
    return category ? category.label : categoryId;
};

export default { createIncome, getAllIncomes, getIncomeById, updateIncome, deleteIncome, getCategoryLabel, INCOME_CATEGORIES };
