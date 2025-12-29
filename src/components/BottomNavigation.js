/**
 * BottomNavigation.js - Shared bottom navigation component
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const COLORS = {
    primary: '#0066CC',
    textSecondary: '#64748B',
    card: '#FFFFFF',
    border: '#E2E8F0',
};

const BottomNavigation = () => {
    const navigation = useNavigation();
    const route = useRoute();

    const isActive = (screenName) => {
        if (screenName === 'Home' && ['Home', 'FrontalCapture', 'LeftProfileCapture', 'RightProfileCapture', 'AnalysisResult'].includes(route.name)) {
            return route.name === 'Home';
        }
        return route.name === screenName;
    };

    const navItems = [
        { name: 'Home', icon: 'home', iconOutline: 'home-outline', label: 'หน้าหลัก' },
        { name: 'History', icon: 'time', iconOutline: 'time-outline', label: 'ประวัติ' },
        { name: 'Profile', icon: 'person', iconOutline: 'person-outline', label: 'โปรไฟล์' },
    ];

    return (
        <View style={styles.bottomNav}>
            {navItems.map((item) => {
                const active = isActive(item.name);
                return (
                    <TouchableOpacity
                        key={item.name}
                        style={styles.navItem}
                        onPress={() => navigation.navigate(item.name)}
                    >
                        <Ionicons
                            name={active ? item.icon : item.iconOutline}
                            size={24}
                            color={active ? COLORS.primary : COLORS.textSecondary}
                        />
                        <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        paddingVertical: 12,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
    },
    navLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    navLabelActive: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});

export default BottomNavigation;
