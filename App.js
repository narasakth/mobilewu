/**
 * App.js - Main Entry Point
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Database
import { initDb } from './src/db/database';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import AddReceiptScreen from './src/screens/AddReceiptScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import AddIncomeScreen from './src/screens/AddIncomeScreen';
import TransactionHistoryScreen from './src/screens/TransactionHistoryScreen';
import EditExpenseScreen from './src/screens/EditExpenseScreen';
import EditIncomeScreen from './src/screens/EditIncomeScreen';

const Stack = createNativeStackNavigator();

const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>กำลังเริ่มต้น...</Text>
    </View>
);

export default function App() {
    const [isDbReady, setIsDbReady] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                await initDb();
                console.log('App initialized successfully');
            } catch (error) {
                console.error('Error initializing app:', error);
            } finally {
                setIsDbReady(true);
            }
        };
        initializeApp();
    }, []);

    if (!isDbReady) return <LoadingScreen />;

    return (
        <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerStyle: { backgroundColor: '#3498db' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                }}
            >
                <Stack.Screen name="Home" component={HomeScreen} options={{ title: '💰 MobileWU' }} />
                <Stack.Screen name="AddReceipt" component={AddReceiptScreen} options={{ title: 'เพิ่มใบเสร็จ' }} />
                <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'บันทึกรายจ่าย', headerStyle: { backgroundColor: '#e74c3c' } }} />
                <Stack.Screen name="AddIncome" component={AddIncomeScreen} options={{ title: 'บันทึกรายรับ', headerStyle: { backgroundColor: '#27ae60' } }} />
                <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ title: 'ประวัติการเคลื่อนไหว' }} />
                <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'แก้ไขรายจ่าย', headerStyle: { backgroundColor: '#e74c3c' } }} />
                <Stack.Screen name="EditIncome" component={EditIncomeScreen} options={{ title: 'แก้ไขรายรับ', headerStyle: { backgroundColor: '#27ae60' } }} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
    loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
});
