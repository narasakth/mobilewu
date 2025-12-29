/**
 * App.js - Acne Scan App Main Entry Point
 * With Supabase Authentication
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

// Services
import { getSession, onAuthStateChange } from './src/services/supabaseService';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import FrontalCaptureScreen from './src/screens/FrontalCaptureScreen';
import LeftProfileCaptureScreen from './src/screens/LeftProfileCaptureScreen';
import RightProfileCaptureScreen from './src/screens/RightProfileCaptureScreen';
import AnalysisResultScreen from './src/screens/AnalysisResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HistoryDetailScreen from './src/screens/HistoryDetailScreen';

const Stack = createNativeStackNavigator();

// Auth Stack (not logged in)
const AuthStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            animation: 'fade',
        }}
    >
        <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
);

// Main Stack (logged in)
const MainStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            animation: 'fade',
        }}
    >
        <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ animation: 'fade' }}
        />
        <Stack.Screen
            name="FrontalCapture"
            component={FrontalCaptureScreen}
            options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
            name="LeftProfileCapture"
            component={LeftProfileCaptureScreen}
            options={{ animation: 'fade' }}
        />
        <Stack.Screen
            name="RightProfileCapture"
            component={RightProfileCaptureScreen}
            options={{ animation: 'fade' }}
        />
        <Stack.Screen
            name="AnalysisResult"
            component={AnalysisResultScreen}
            options={{ animation: 'fade' }}
        />
        <Stack.Screen
            name="History"
            component={HistoryScreen}
            options={{ animation: 'fade' }}
        />
        <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ animation: 'fade' }}
        />
        <Stack.Screen
            name="HistoryDetail"
            component={HistoryDetailScreen}
            options={{ animation: 'slide_from_right' }}
        />
    </Stack.Navigator>
);

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Check initial session
        const checkSession = async () => {
            const currentSession = await getSession();
            setSession(currentSession);
            setIsLoading(false);
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = onAuthStateChange((event, newSession) => {
            console.log('Auth event:', event);
            setSession(newSession);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Loading screen
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066CC" />
                <Text style={styles.loadingText}>กำลังโหลด...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <StatusBar style="auto" />
            {session ? <MainStack /> : <AuthStack />}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#64748B',
    },
});
