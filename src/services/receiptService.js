/**
 * receiptService.js
 * Service layer สำหรับจัดการข้อมูลใบเสร็จ
 */

import { executeQuery } from '../db/database';
import * as Crypto from 'expo-crypto';

export const createReceipt = async (receiptData) => {
    const id = Crypto.randomUUID();
    const receipt_no = receiptData.receipt_no || `RCP-${Date.now()}`;
    const now = Date.now();
    const itemsJson = receiptData.items ? JSON.stringify(receiptData.items) : null;

    const sql = `
        INSERT INTO receipts (id, receipt_no, type, amount, customer_name, items, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        id, receipt_no, receiptData.type, receiptData.amount,
        receiptData.customer_name || null, itemsJson,
        receiptData.status || 'pending', now, now
    ];

    try {
        await executeQuery(sql, params);
        return { id, receipt_no, type: receiptData.type, amount: receiptData.amount, status: receiptData.status || 'pending', created_at: now };
    } catch (error) {
        console.error('Error creating receipt:', error);
        throw error;
    }
};

export const getAllReceipts = async () => {
    const sql = `SELECT * FROM receipts ORDER BY created_at DESC`;

    try {
        const results = await executeQuery(sql);
        return results.map(receipt => ({
            ...receipt,
            items: receipt.items ? JSON.parse(receipt.items) : null
        }));
    } catch (error) {
        console.error('Error fetching receipts:', error);
        throw error;
    }
};

export const updateReceiptStatus = async (id, status) => {
    const now = Date.now();
    const sql = `UPDATE receipts SET status = ?, updated_at = ? WHERE id = ?`;

    try {
        const result = await executeQuery(sql, [status, now, id]);
        return result.changes > 0;
    } catch (error) {
        console.error('Error updating receipt status:', error);
        throw error;
    }
};

export const getReceiptById = async (id) => {
    const sql = `SELECT * FROM receipts WHERE id = ?`;

    try {
        const results = await executeQuery(sql, [id]);
        if (results.length > 0) {
            const receipt = results[0];
            return { ...receipt, items: receipt.items ? JSON.parse(receipt.items) : null };
        }
        return null;
    } catch (error) {
        console.error('Error fetching receipt by ID:', error);
        throw error;
    }
};

export default { createReceipt, getAllReceipts, updateReceiptStatus, getReceiptById };
